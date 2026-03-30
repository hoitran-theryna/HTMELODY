// ============================================
// ERP SYSTEM - PAYROLL MODULE
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { formatFullCurrency, getInitials } from '../utils.js';
import { ICONS } from '../components/icons.js';
import { showModal } from '../components/modal.js';

export default function renderPayroll(container) {
  const perm = auth.getPermission('payroll');
  const user = auth.getUser();
  const employees = perm === 'full' ? store.get('employees').filter(e=>e.status==='active') : [user];
  
  const totalSalary = employees.reduce((s,e)=>s+e.salary,0);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Bảng Lương Tháng 03/2026</h1><p>Lương Xưởng + PC Sự kiện + HH Kinh doanh</p></div>
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
         <div class="stat-card-value">${formatFullCurrency(4500000)}</div>
         <div class="stat-card-label">Phụ cấp Tăng ca / Sự kiện</div>
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-header"><h3>Chi tiết Phân bổ</h3></div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Nhân viên</th><th>Lương Cơ Bản</th><th>Cộng / Phụ cấp</th><th>Trừ (BHXH/Thuế)</th><th>Thực Nhận</th><th>Thao tác</th></tr></thead>
          <tbody>
            ${employees.map(e => {
                const base = e.salary;
                let commission = 0;
                
                // 1. Tính toán hoa hồng trực tiếp từ danh sách Đơn hàng
                const salesOrders = store.get('orders').filter(o => o.salesId === e.id);
                const totalSalesVal = salesOrders.reduce((sum, o) => sum + (o.price || 0), 0);

                if (e.commissionType === 'fixed') {
                   commission = e.commissionRate || 0;
                } else {
                   commission = Math.round(totalSalesVal * ((e.commissionRate || 0) / 100));
                }
                
                // 2. Công thức mới: Thực nhận = Lương cứng + Hoa hồng (Không trừ BHXH)
                const net = base + commission;
                
                return `
                <tr>
                  <td>
                    <div class="user-cell">
                       <div class="avatar avatar-sm" style="background:${e.avatar}">${getInitials(e.name)}</div>
                       <div>
                          <div style="font-weight:600">${e.name}</div>
                          <div style="font-size:11px;color:var(--text-muted)">${e.position} (${salesOrders.length} đơn hàng)</div>
                       </div>
                    </div>
                  </td>
                  <td style="font-variant-numeric:tabular-nums">${formatFullCurrency(base)}</td>
                  <td style="font-variant-numeric:tabular-nums;color:var(--accent-emerald);font-weight:600">+${formatFullCurrency(commission)}</td>
                  <td style="font-variant-numeric:tabular-nums;color:var(--text-muted)">0 đ</td>
                  <td style="font-variant-numeric:tabular-nums;font-weight:800;color:var(--accent-blue-light);font-size:16px">${formatFullCurrency(net)}</td>
                  <td>
                    <button class="btn btn-icon btn-sm" data-action="view-payslip" data-id="${e.id}" title="Xem chi tiết">${ICONS.eye}</button>
                    ${(user.role === 'director' || user.role === 'accountant') ? `<button class="btn btn-icon btn-sm" data-action="edit-emp-salary" data-id="${e.id}" title="Sửa Lương/HH" style="margin-left:8px">✏️</button>` : ''}
                  </td>
                </tr>`;
             }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Xử lý sự kiện: Xem phiếu lương và Sửa nhanh (Dành cho Quản lý)
  container.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    
    const empId = btn.dataset.id;
    const eData = store.getById('employees', empId);
    if (!eData) return;

    // Logic tính toán lương tối giản chung
    const base = eData.salary || 0;
    const salesOrders = store.get('orders').filter(o => o.salesId === eData.id);
    const totalSalesVal = salesOrders.reduce((sum, o) => sum + (o.price || 0), 0);
    let commission = 0;
    if (eData.commissionType === 'fixed') {
        commission = eData.commissionRate || 0;
    } else {
        commission = Math.round(totalSalesVal * ((eData.commissionRate || 0) / 100));
    }
    const net = base + commission;

    // 1. Hành động XEM PHIẾU LƯƠNG
    if (btn.dataset.action === 'view-payslip') {
      showModal(`Phiếu Lương: ${eData.name}`, `
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:4px">Kỳ thanh toán: Tháng 03/2026</div>
          <div style="font-weight:700;font-size:28px;color:var(--accent-blue-light);letter-spacing:-0.5px">${formatFullCurrency(net)}</div>
          <div class="badge badge-emerald" style="margin-top:8px">Mã Nhân Viên: ${eData.id}</div>
        </div>

        <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--border-color)">
          <div style="padding:14px 16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between">
            <span style="color:var(--text-muted)">1. Lương cơ bản tháng:</span>
            <span style="font-weight:600">${formatFullCurrency(base)}</span>
          </div>
          <div style="padding:14px 16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;background:rgba(16,185,129,0.05)">
            <span style="color:var(--text-muted)">2. Hoa hồng kinh doanh (${salesOrders.length} đơn):</span>
            <span style="font-weight:600;color:var(--accent-emerald)">+${formatFullCurrency(commission)}</span>
          </div>
          <div style="padding:16px;display:flex;justify-content:space-between;background:var(--bg-secondary)">
            <span style="font-weight:800;font-size:15px">TỔNG THỰC NHẬN</span>
            <span style="font-weight:800;font-size:18px;color:var(--accent-blue-light)">${formatFullCurrency(net)}</span>
          </div>
        </div>
        <p style="font-size:11px;color:var(--text-muted);margin-top:12px;text-align:center"><i>Lưu ý: Bảng lương đã lược bỏ các khoản khấu trừ theo yêu cầu của Giám đốc.</i></p>
      `, { footer: '<button class="btn btn-primary" onclick="window.print()">In Phiếu Lương</button><button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Đóng</button>' });
    }

    // 2. Hành động SỬA NHANH LƯƠNG/HOA HỒNG (Chỉ Admin)
    if (btn.dataset.action === 'edit-emp-salary') {
       const modal = showModal(`Điều chỉnh Thu nhập: ${eData.name}`, `
          <div class="form-group">
             <label class="form-label">Lương cơ bản (VNĐ/Tháng)</label>
             <input type="number" id="edit-salary" class="form-input" value="${eData.salary}" style="font-weight:bold;color:var(--accent-emerald);font-size:18px">
          </div>
          <div class="form-group" style="margin-top:20px">
             <label class="form-label">Thiết lập Hoa hồng sản phẩm</label>
             <div style="display:flex;gap:10px">
                <input type="number" id="edit-comm" class="form-input" value="${eData.commissionRate}" style="font-weight:bold;color:var(--accent-amber);font-size:18px">
                <select id="edit-comm-type" class="form-select" style="width:120px">
                   <option value="percent" ${eData.commissionType!=='fixed'?'selected':''}>Phần trăm (%)</option>
                   <option value="fixed" ${eData.commissionType==='fixed'?'selected':''}>Số tiền (VNĐ)</option>
                </select>
             </div>
             <p style="font-size:11px;color:var(--text-muted);margin-top:8px">* Hoa hồng sẽ tự động tính dựa trên tổng giá trị các đơn hàng được gán cho nhân viên này.</p>
          </div>
       `, { footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Hủy</button><button class="btn btn-primary" id="btn-save-payroll-edit">Lưu & Cập nhật Cloud</button>' });

       modal.overlay.querySelector('#btn-save-payroll-edit').addEventListener('click', async () => {
          const salary = parseInt(document.getElementById('edit-salary').value) || 0;
          const commissionRate = parseFloat(document.getElementById('edit-comm').value) || 0;
          const commissionType = document.getElementById('edit-comm-type').value;

          const success = await store.update('employees', eData.id, { salary, commissionRate, commissionType });
          if (success) {
             showToast(`Đã cập nhật mức thu nhập mới cho ${eData.name}`, 'success');
             modal.close();
             renderPayroll(container); // Refresh màn hình lương
          }
       });
    }
  });
}
