// ============================================
// ERP SYSTEM - PAYROLL MODULE
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { formatFullCurrency, getInitials } from '../utils.js';
import { ICONS } from '../components/icons.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export default function renderPayroll(container) {
  const perm = auth.getPermission('payroll');
  const user = auth.getUser();

  // ── Helpers ──
  const toMonthStr = d => d?.slice(0, 7) || '';
  const formatMonthLabel = m => {
    const [y, mo] = m.split('-');
    return `Tháng ${mo}/${y}`;
  };

  const getMonthOptions = () => {
    const orders = store.get('orders');
    const payrollRecs = store.get('payroll_records');
    const months = new Set();
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
    orders.forEach(o => { if (o.createdAt?.length >= 7) months.add(toMonthStr(o.createdAt)); });
    payrollRecs.forEach(r => { if (r.month) months.add(r.month); });
    return [...months].filter(Boolean).sort().reverse();
  };

  // ── Tính lương theo tháng ──
  const calcRows = (month) => {
    const allEmployees = perm === 'full'
      ? store.get('employees').filter(e => e.status === 'active')
      : [store.getById('employees', user.id) || user];

    const monthOrders = store.get('orders').filter(o => toMonthStr(o.createdAt) === month);

    return allEmployees.map(e => {
      const base = e.salary || 0;
      const empOrders = monthOrders.filter(o => o.salesId === e.id);
      const salesVal  = empOrders.reduce((s, o) => s + (o.price||0), 0);
      let commission  = 0;
      if (e.commissionType === 'fixed') commission = e.commissionRate || 0;
      else commission = Math.round(salesVal * ((e.commissionRate||0) / 100));
      return {
        employeeId: e.id, name: e.name, position: e.position,
        avatar: e.avatar, base, commission, net: base + commission,
        orderCount: empOrders.length
      };
    });
  };

  const monthOptions = getMonthOptions();
  let selectedMonth = monthOptions[0] || new Date().toISOString().slice(0, 7);

  // ── Render ──
  const render = () => {
    const payrollRecs = store.get('payroll_records');
    const saved       = payrollRecs.find(r => r.month === selectedMonth);
    const isFinalized = !!saved;
    const rows        = isFinalized ? saved.records : calcRows(selectedMonth);
    const label       = formatMonthLabel(selectedMonth);

    const totalSalary    = rows.reduce((s,r) => s + (r.base||0), 0);
    const totalAllowance = rows.reduce((s,r) => s + (r.commission||0), 0);
    const totalNet       = rows.reduce((s,r) => s + (r.net||0), 0);

    const canAdmin = user.role === 'director' || user.role === 'accountant';

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Bảng Lương ${label}</h1>
          <p>Lương Xưởng + Phụ cấp Sự kiện + HH Kinh doanh &nbsp;•&nbsp;
            ${isFinalized
              ? `<span style="color:var(--accent-emerald);font-weight:600">Đã chốt ${new Date(saved.finalizedAt).toLocaleDateString('vi-VN')}</span>`
              : `<span style="color:var(--accent-amber);font-weight:600">Chưa chốt — đang tính theo dữ liệu hiện tại</span>`}
          </p>
        </div>
        <div class="page-header-right">
          <select class="form-select" id="payroll-month-select" style="max-width:160px">
            ${monthOptions.map(m => `<option value="${m}" ${m === selectedMonth ? 'selected' : ''}>${formatMonthLabel(m)}</option>`).join('')}
          </select>
          ${perm === 'full' && !isFinalized && canAdmin
            ? `<button class="btn btn-success" id="btn-finalize-payroll">${ICONS['check-circle']} Chốt lương ${label}</button>`
            : ''}
        </div>
      </div>

      ${perm === 'full' ? `
      <div class="stats-grid stagger-children" style="margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-primary)">${ICONS.wallet}</div></div>
          <div class="stat-card-value">${formatFullCurrency(totalSalary)}</div>
          <div class="stat-card-label">Quỹ Lương Cơ Bản</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-warning)">${ICONS.tool}</div></div>
          <div class="stat-card-value">${formatFullCurrency(totalAllowance)}</div>
          <div class="stat-card-label">Phụ cấp / Hoa hồng tháng</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-success)">${ICONS.users}</div></div>
          <div class="stat-card-value">${formatFullCurrency(totalNet)}</div>
          <div class="stat-card-label">Tổng Chi Lương Thực tế</div>
        </div>
      </div>` : ''}

      <div class="card">
        <div class="card-header">
          <h3>Chi tiết Phân bổ — ${label}</h3>
          ${isFinalized
            ? `<span class="badge badge-emerald">Bản lưu vĩnh viễn</span>`
            : `<span class="badge badge-amber">Dữ liệu tạm tính</span>`}
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Lương Cơ Bản</th>
                <th>Cộng / Phụ cấp</th>
                <th>Trừ (BHXH/Thuế)</th>
                <th>Thực Nhận</th>
                <th style="text-align:center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
              <tr>
                <td>
                  <div class="user-cell">
                    <div class="avatar avatar-sm" style="background:${r.avatar}">${getInitials(r.name)}</div>
                    <div>
                      <div style="font-weight:600">${r.name}</div>
                      <div style="font-size:11px;color:var(--text-muted)">${r.position} • ${r.orderCount} đơn tháng này</div>
                    </div>
                  </div>
                </td>
                <td style="font-variant-numeric:tabular-nums">${formatFullCurrency(r.base)}</td>
                <td style="font-variant-numeric:tabular-nums;color:var(--accent-emerald);font-weight:600">+${formatFullCurrency(r.commission)}</td>
                <td style="color:var(--text-muted)">0 đ</td>
                <td style="font-variant-numeric:tabular-nums;font-weight:800;color:var(--accent-blue-light);font-size:16px">${formatFullCurrency(r.net)}</td>
                <td>
                  <div class="actions-cell">
                    <button class="btn btn-icon btn-sm" data-action="view-payslip" data-id="${r.employeeId}" title="Xem phiếu lương">${ICONS.eye}</button>
                    ${!isFinalized && canAdmin && perm === 'full'
                      ? `<button class="btn btn-icon btn-sm" data-action="edit-emp-salary" data-id="${r.employeeId}" title="Sửa Lương/HH">${ICONS.edit}</button>`
                      : ''}
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Month selector
    container.querySelector('#payroll-month-select').addEventListener('change', e => {
      selectedMonth = e.target.value;
      render();
    });

    // Chốt lương
    container.querySelector('#btn-finalize-payroll')?.addEventListener('click', async () => {
      const lbl = formatMonthLabel(selectedMonth);
      if (!confirm(`Chốt lương ${lbl}?\n\nSau khi chốt, dữ liệu lương tháng này sẽ được lưu vĩnh viễn và không thể chỉnh sửa.`)) return;
      const currentRows = calcRows(selectedMonth);
      const result = await store.add('payroll_records', {
        id: store.generateId('PR'),
        month: selectedMonth,
        records: currentRows,
        totalNet: currentRows.reduce((s,r) => s + r.net, 0),
        finalizedAt: new Date().toISOString()
      });
      if (result) {
        showToast(`Đã chốt lương ${lbl} thành công!`, 'success');
        render();
      }
    });
  };

  // ── Event delegation (một lần, không bị nhân bản khi render lại) ──
  container.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const empId  = btn.dataset.id;
    if (!empId) return;

    const eData = store.getById('employees', empId);
    if (!eData) return;

    if (action === 'view-payslip') {
      // Lấy data từ bản chốt nếu có, nếu không tính tạm
      const saved = store.get('payroll_records').find(r => r.month === selectedMonth);
      const rowData = saved
        ? saved.records.find(r => r.employeeId === empId)
        : calcRows(selectedMonth).find(r => r.employeeId === empId);
      if (!rowData) return;
      const label = formatMonthLabel(selectedMonth);

      showModal(`Phiếu Lương: ${eData.name}`, `
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:4px">Kỳ thanh toán: ${label}</div>
          <div style="font-weight:700;font-size:28px;color:var(--accent-blue-light);letter-spacing:-0.5px">${formatFullCurrency(rowData.net)}</div>
          <div class="badge badge-emerald" style="margin-top:8px">Mã NV: ${eData.id}</div>
        </div>
        <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border-color)">
          <div style="padding:14px 16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between">
            <span style="color:var(--text-muted)">1. Lương cơ bản tháng:</span>
            <span style="font-weight:600">${formatFullCurrency(rowData.base)}</span>
          </div>
          <div style="padding:14px 16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;background:rgba(16,185,129,0.05)">
            <span style="color:var(--text-muted)">2. Phụ cấp / Hoa hồng (${rowData.orderCount} đơn):</span>
            <span style="font-weight:600;color:var(--accent-emerald)">+${formatFullCurrency(rowData.commission)}</span>
          </div>
          <div style="padding:16px;display:flex;justify-content:space-between;background:var(--bg-secondary)">
            <span style="font-weight:800;font-size:15px">TỔNG THỰC NHẬN</span>
            <span style="font-weight:800;font-size:18px;color:var(--accent-blue-light)">${formatFullCurrency(rowData.net)}</span>
          </div>
        </div>
        <p style="font-size:11px;color:var(--text-muted);margin-top:12px;text-align:center">
          ${saved ? 'Phiếu lương đã chốt vĩnh viễn.' : 'Chưa chốt — số liệu có thể thay đổi.'}
        </p>
      `, { footer: '<button class="btn btn-primary" onclick="window.print()">In Phiếu</button><button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Đóng</button>' });
    }

    if (action === 'edit-emp-salary') {
      const modal = showModal(`Điều chỉnh Thu nhập: ${eData.name}`, `
        <div class="form-group">
          <label class="form-label">Lương cơ bản (VNĐ/Tháng)</label>
          <input type="number" id="edit-salary" class="form-input" value="${eData.salary||0}" style="font-weight:bold;color:var(--accent-emerald);font-size:18px">
        </div>
        <div class="form-group" style="margin-top:20px">
          <label class="form-label">Hoa hồng / Phụ cấp</label>
          <div style="display:flex;gap:10px">
            <input type="number" id="edit-comm" class="form-input" value="${eData.commissionRate||0}" style="font-weight:bold;color:var(--accent-amber);font-size:18px">
            <select id="edit-comm-type" class="form-select" style="width:130px">
              <option value="percent" ${eData.commissionType !== 'fixed' ? 'selected' : ''}>% doanh số</option>
              <option value="fixed" ${eData.commissionType === 'fixed' ? 'selected' : ''}>VNĐ cố định</option>
            </select>
          </div>
          <p style="font-size:11px;color:var(--text-muted);margin-top:8px">Áp dụng từ tháng tiếp theo (tháng hiện tại tính theo số cũ nếu đã chốt).</p>
        </div>
      `, { footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Hủy</button><button class="btn btn-primary" id="btn-save-payroll-edit">Lưu & Cập nhật Cloud</button>' });

      modal.overlay.querySelector('#btn-save-payroll-edit').addEventListener('click', async () => {
        const salary         = parseInt(modal.overlay.querySelector('#edit-salary').value) || 0;
        const commissionRate = parseFloat(modal.overlay.querySelector('#edit-comm').value) || 0;
        const commissionType = modal.overlay.querySelector('#edit-comm-type').value;
        const success = await store.update('employees', eData.id, { salary, commissionRate, commissionType });
        if (success) {
          showToast(`Đã cập nhật lương cho ${eData.name}`, 'success');
          modal.close();
          render();
        }
      });
    }
  }, { once: false });

  render();
}
