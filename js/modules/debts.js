// ============================================
// ERP SYSTEM - DEBTS MODULE (Công nợ)
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { formatFullCurrency, formatDate, getStatusBadge, getInitials } from '../utils.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export default function renderDebts(container) {
  const debts = store.get('debts');
  const perm = auth.getPermission('debts');
  
  const receivables = debts.filter(d => d.type === 'receivable');
  const payables = debts.filter(d => d.type === 'payable');
  
  const totalReceivable = receivables.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  const totalPayable = payables.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  
  const overdueCount = debts.filter(d => d.status !== 'paid' && new Date(d.dueDate) < new Date()).length;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Quản lý Công nợ</h1>
        <p>Theo dõi Công nợ Phải thu (Khách hàng) và Phải trả (Nhà cung cấp)</p>
      </div>
      <div class="page-header-right">
        ${perm === 'full' ? `<button class="btn btn-primary" id="btn-add-debt">${ICONS.plus} Tạo Công nợ</button>` : ''}
      </div>
    </div>

    <div class="stats-grid stagger-children">
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-success)">${ICONS['trending-up']}</div></div>
        <div class="stat-card-value" style="color:var(--accent-emerald)">${formatFullCurrency(totalReceivable)}</div>
        <div class="stat-card-label">Tổng nợ PHẢI THU</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-danger)">${ICONS['trending-down']}</div></div>
        <div class="stat-card-value" style="color:var(--accent-rose)">${formatFullCurrency(totalPayable)}</div>
        <div class="stat-card-label">Tổng nợ PHẢI TRẢ</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-warning)">${ICONS.clock}</div></div>
        <div class="stat-card-value">${overdueCount}</div>
        <div class="stat-card-label">Khoản nợ QUÁ HẠN</div>
      </div>
    </div>

    <div class="content-grid" style="grid-template-columns:1fr; gap:24px">
      <!-- Khoản Phải Thu -->
      <div class="card">
        <div class="card-header">
          <h3 style="color:var(--accent-emerald)">Công nợ Phải Thu (Từ Khách hàng)</h3>
        </div>
        <div class="data-table-wrapper">
          ${renderDebtTable(receivables, 'receivable', perm)}
        </div>
      </div>

      <!-- Khoản Phải Trả -->
      <div class="card">
        <div class="card-header">
          <h3 style="color:var(--accent-rose)">Công nợ Phải Trả (Cho Nhà cung cấp)</h3>
        </div>
        <div class="data-table-wrapper">
          ${renderDebtTable(payables, 'payable', perm)}
        </div>
      </div>
    </div>
  `;

  // Filter actions or payment logic
  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const debt = store.getById('debts', btn.dataset.id);
    if (!debt) return;

    if (btn.dataset.action === 'pay' && perm === 'full') {
      const remaining = debt.totalAmount - debt.paidAmount;
      const typeLabel = debt.type === 'receivable' ? 'THU TIỀN' : 'CHI TRẢ';
      
      const modal = showModal(`Ghi nhận ${typeLabel} - ${debt.id}`, `
        <div style="background:var(--bg-tertiary);padding:12px;border-radius:var(--radius-md);margin-bottom:16px;font-size:var(--font-size-sm)">
          <div>Tham chiếu: <strong>${debt.sourceId}</strong></div>
          <div>Cần thanh toán: <strong style="color:var(--accent-rose)">${formatFullCurrency(remaining)}</strong></div>
        </div>
        <div class="form-group">
          <label class="form-label">Số tiền giao dịch (VNĐ)</label>
          <input type="number" id="pay-amount" class="form-input" value="${remaining}" max="${remaining}" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Ngày giao dịch</label>
            <input type="date" id="pay-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label class="form-label">Tài khoản ghi nhận</label>
            <select id="pay-fund" class="form-select">
               <option value="bank">Ngân hàng (Vietcombank)</option>
               <option value="cash">Tiền mặt (Quỹ xưởng)</option>
            </select>
          </div>
        </div>
      `, { footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Hủy</button><button class="btn btn-primary" id="btn-submit-pay">Xác nhận Lưu</button>' });

      modal.overlay.querySelector('#btn-submit-pay').addEventListener('click', () => {
        const amt = parseInt(modal.overlay.querySelector('#pay-amount').value);
        if (amt <= 0 || amt > remaining) {
          showToast('Số tiền không hợp lệ', 'error'); return;
        }

        // Cập nhật debt
        const newPaid = debt.paidAmount + amt;
        const newStatus = newPaid >= debt.totalAmount ? 'paid' : 'partial';
        store.update('debts', debt.id, { paidAmount: newPaid, status: newStatus });

        // Tự động thêm vào Sổ Quỹ
        store.add('funds', {
          id: store.generateId('FD'),
          date: modal.overlay.querySelector('#pay-date').value,
          account: modal.overlay.querySelector('#pay-fund').value,
          type: debt.type === 'receivable' ? 'in' : 'out',
          amount: amt,
          category: 'Thanh toán Công nợ',
          description: `Thanh toán cho ${debt.sourceId}`,
          refId: debt.id
        });

        showToast('Đã ghi nhận thanh toán và cập nhật Sổ Quỹ!', 'success');
        modal.close();
        renderDebts(container);
      });
    }
  });

  document.getElementById('btn-add-debt')?.addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    const modal = showModal('Thêm Công Nợ Thủ Công', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">Loại Công nợ</label>
          <select id="form-debt-type" class="form-select">
            <option value="receivable">Phải Thu (Thu vào)</option>
            <option value="payable">Phải Trả (Chi ra)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Hạn thanh toán</label>
          <input type="date" id="form-debt-due" value="${today}" class="form-input" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Tên Đối tác (Khách nợ / Nhà cung cấp)</label>
        <input type="text" id="form-debt-partner" class="form-input" placeholder="Tên Cty Nhựa, Cửa hàng Sơn..." required />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">Mã HĐ/Chứng từ (Tham chiếu)</label>
          <input type="text" id="form-debt-source" class="form-input" placeholder="VD: MICA-01..." required />
        </div>
        <div class="form-group">
          <label class="form-label">Nhân viên Sale phụ trách</label>
          <select id="form-debt-sales" class="form-select">
             <option value="">-- Chọn Sale (Nếu có) --</option>
             ${store.get('employees').filter(e=>e.role==='sales').map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Tổng số tiền (VNĐ)</label>
        <input type="number" id="form-debt-amount" class="form-input" placeholder="0" required />
      </div>
    `, { footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Hủy</button><button class="btn btn-primary" id="btn-save-debt">Khởi tạo Khoản Nợ</button>' });

    modal.overlay.querySelector('#btn-save-debt').addEventListener('click', () => {
      const type = modal.overlay.querySelector('#form-debt-type').value;
      const partner = modal.overlay.querySelector('#form-debt-partner').value.trim();
      const source = modal.overlay.querySelector('#form-debt-source').value.trim();
      const salesId = modal.overlay.querySelector('#form-debt-sales').value;
      const amount = parseInt(modal.overlay.querySelector('#form-debt-amount').value) || 0;
      const due = modal.overlay.querySelector('#form-debt-due').value;

      if (!partner || amount <= 0) {
        showToast('Vui lòng điền đủ Tên/Số tiền hợp lệ!', 'error'); return;
      }

      store.add('debts', {
        id: store.generateId('DB'), type: type, partnerName: partner,
        sourceId: source || 'MANUAL', salesId, totalAmount: amount, paidAmount: 0,
        dueDate: due, status: 'pending', createdAt: new Date().toISOString()
      });

      showToast('Đã thêm thành công một khoản Công nợ mới!', 'success');
      modal.close();
      renderDebts(container);
    });
  });
}

function renderDebtTable(data, type, perm) {
  if (data.length === 0) return `<div style="padding:24px;text-align:center;color:var(--text-muted)">Không có công nợ nào.</div>`;
  
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Mã / CTừ</th>
          <th>Đối tượng</th>
          <th>Sale phụ trách</th>
          <th>Tổng tiền</th>
          <th>Đã thanh toán</th>
          <th>Còn lại</th>
          <th>Hạn TT</th>
          <th>Trạng thái</th>
          ${perm === 'full' ? '<th>Thao tác</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${data.map(d => {
          const isOverdue = d.status !== 'paid' && new Date(d.dueDate) < new Date();
          let partnerName = d.partnerName;
          if (!partnerName && d.partnerId) {
             partnerName = store.getById('customers', d.partnerId)?.name || d.partnerId;
          }
          const remain = d.totalAmount - d.paidAmount;
          
          // Lấy tên nhân viên Sale
          const salesPerson = d.salesId ? store.getById('employees', d.salesId) : null;
          
          return `
          <tr style="${isOverdue ? 'background:rgba(244,63,94,0.05)' : ''}">
            <td>
              <div style="font-weight:600">${d.id}</div>
              <div style="font-size:var(--font-size-xs);color:var(--text-muted);font-family:var(--font-mono)">${d.sourceId}</div>
            </td>
            <td style="font-weight:500">${partnerName}</td>
            <td>
               ${salesPerson ? `
               <div class="user-cell" style="gap:6px">
                  <div class="avatar avatar-xs" style="background:${salesPerson.avatar}; width:20px; height:20px; font-size:9px">${getInitials(salesPerson.name)}</div>
                  <span style="font-size:12px">${salesPerson.name}</span>
               </div>` : '<span style="color:var(--text-muted);font-size:11px">---</span>'}
            </td>
            <td style="font-variant-numeric:tabular-nums">${formatFullCurrency(d.totalAmount)}</td>
            <td style="font-variant-numeric:tabular-nums;color:var(--accent-emerald)">${formatFullCurrency(d.paidAmount)}</td>
            <td style="font-variant-numeric:tabular-nums;font-weight:600;color:var(--accent-rose)">${formatFullCurrency(remain)}</td>
            <td>
              ${formatDate(d.dueDate)}
              ${isOverdue ? '<span style="color:var(--accent-rose);font-size:10px;margin-left:4px">⚠️ Mụn</span>' : ''}
            </td>
            <td>${isOverdue ? getStatusBadge('overdue') : getStatusBadge(d.status)}</td>
            ${perm === 'full' ? `
            <td>
              <div style="display:flex;gap:4px">
                 ${d.status !== 'paid' ? `<button class="btn btn-sm ${type==='receivable'?'btn-success':'btn-danger'}" data-action="pay" data-id="${d.id}" title="Ghi nhận thanh toán">${type==='receivable' ? ICONS.plus : ICONS.dashboard}</button>` : '<span style="color:var(--text-muted);font-size:var(--font-size-xs)">Xong</span>'}
              </div>
            </td>
            ` : ''}
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}
