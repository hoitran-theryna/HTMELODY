// ============================================
// ERP SYSTEM - TAX MODULE (Thuế Công ty)
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { formatFullCurrency, formatDate, getStatusBadge } from '../utils.js';
import { showModal } from '../components/modal.js';

export default function renderTax(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;gap:24px;padding:40px">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--gradient-warning);display:flex;align-items:center;justify-content:center;font-size:36px">
        🚧
      </div>
      <div>
        <h2 style="margin:0 0 8px;font-size:var(--font-size-2xl)">Sắp ra mắt</h2>
        <p style="color:var(--text-muted);margin:0;max-width:360px;line-height:1.6">
          Module <strong>Thuế Nội bộ</strong> đang được phát triển.<br>
          Tính năng quản lý Tờ khai VAT, TNCN, TNDN sẽ sớm được cập nhật.
        </p>
      </div>
      <span class="badge badge-amber" style="font-size:13px;padding:8px 20px">Đang phát triển</span>
    </div>
  `;
}

// eslint-disable-next-line no-unused-vars
function _renderTaxFull(container) {
  const taxes = store.get('taxes');
  const perm = auth.getPermission('tax');

  // Lấy danh sách thuế VAT, TNCN, TNDN
  const getTaxTotal = (type, st) => taxes.filter(t => t.type === type && t.status === st).reduce((s,t)=>s+t.amount,0);

  const pendingVat = getTaxTotal('vat', 'pending');
  const pendingTncn = getTaxTotal('tncn', 'pending');
  const totalPending = pendingVat + pendingTncn;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Thuế Nội bộ</h1>
        <p>Quản lý Tờ khai, Nhắc nhở hạn nộp Thuế GTGT, TNCN, TNDN</p>
      </div>
    </div>

    <div class="content-grid">
      <div class="col-8">
        <div class="card">
          <div class="card-header">
            <h3>Nghĩa vụ Thuế cần nộp</h3>
            ${perm === 'full' ? `<button class="btn btn-secondary btn-sm" id="btn-add-tax">Khai báo Phải nộp</button>` : ''}
          </div>
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Kỳ báo cáo</th>
                  <th>Loại Thuế</th>
                  <th>Nội dung</th>
                  <th>Số tiền (VNĐ)</th>
                  <th>Hạn nộp</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${taxes.sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map(t => {
                  const isLate = t.status === 'pending' && new Date(t.deadline) < new Date();
                  const typeLabel = t.type === 'vat' ? 'GTGT (VAT)' : t.type === 'tncn' ? 'Thu nhập cá nhân' : 'Thu nhập DN';
                  return `
                  <tr style="${isLate ? 'background:rgba(244,63,94,0.05)' : ''}">
                    <td style="font-weight:600">${t.period}</td>
                    <td><span class="badge ${t.type==='vat'?'badge-blue':t.type==='tncn'?'badge-amber':'badge-violet'}">${typeLabel}</span></td>
                    <td style="font-size:var(--font-size-sm)">${t.note}</td>
                    <td style="font-variant-numeric:tabular-nums;color:var(--text-primary);font-weight:600">${formatFullCurrency(t.amount)}</td>
                    <td style="${isLate ? 'color:var(--accent-rose);font-weight:600' : ''}">
                      ${formatDate(t.deadline)} ${isLate ? '(Trễ)' : ''}
                    </td>
                    <td>
                      ${t.status === 'paid' ? getStatusBadge('paid') : getStatusBadge('pending')}
                    </td>
                  </tr>`
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-4">
        <div class="card" style="background:var(--bg-tertiary);border-color:var(--accent-rose)">
          <div class="card-header" style="border-bottom:none;padding-bottom:0">
            <h3 style="color:var(--accent-rose)">Tổng Thuế Chờ Nộp</h3>
          </div>
          <div class="card-body">
            <div style="font-size:36px;font-weight:700;color:var(--accent-rose);margin-bottom:24px;text-align:center">
              ${formatFullCurrency(totalPending)}
            </div>
            
            <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border-color)">
              <span style="color:var(--text-muted)">Thuế GTGT (VAT):</span>
              <span style="font-weight:600">${formatFullCurrency(pendingVat)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border-color)">
              <span style="color:var(--text-muted)">Thuế TNCN:</span>
              <span style="font-weight:600">${formatFullCurrency(pendingTncn)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:12px 0">
              <span style="color:var(--text-muted)">Thuế TNDN:</span>
              <span style="font-weight:600">0 đ</span>
            </div>
            
            <button class="btn btn-primary" style="width:100%;margin-top:24px;background:var(--accent-rose);border-color:var(--accent-rose)">${ICONS.dashboard} Đi đến E-Tax</button>
            <p style="text-align:center;font-size:11px;color:var(--text-muted);margin-top:12px">Module thuế chỉ dùng để nhắc nhở & đối soát số liệu chuẩn bị cho Kế toán kê khai ngoài ứng dụng chính phủ.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-add-tax')?.addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    const modal = showModal('Khai báo Nghĩa vụ Thuế', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">Loại Thuế</label>
          <select id="form-tax-type" class="form-select">
            <option value="vat">Thuế GTGT (VAT)</option>
            <option value="tncn">Thuế TNCN</option>
            <option value="tndn">Thuế TNDN</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Kỳ báo cáo (Tháng/Năm)</label>
          <input type="text" id="form-tax-period" class="form-input" placeholder="VD: T03-2026" required />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Số tiền truy thu (VNĐ)</label>
        <input type="number" id="form-tax-amount" class="form-input" placeholder="0" required />
      </div>
      <div class="form-group">
        <label class="form-label">Hạn nộp cuối cùng</label>
        <input type="date" id="form-tax-due" value="${today}" class="form-input" required />
      </div>
      <div class="form-group">
        <label class="form-label">Ghi chú (Tùy chọn)</label>
        <input type="text" id="form-tax-note" class="form-input" placeholder="Tờ khai số xyz..." />
      </div>
    `, { footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Hủy</button><button class="btn btn-primary" id="btn-save-tax">Ghi nhận</button>' });

    modal.overlay.querySelector('#btn-save-tax').addEventListener('click', () => {
      const type = modal.overlay.querySelector('#form-tax-type').value;
      const period = modal.overlay.querySelector('#form-tax-period').value.trim();
      const amount = parseInt(modal.overlay.querySelector('#form-tax-amount').value) || 0;
      const due = modal.overlay.querySelector('#form-tax-due').value;
      const note = modal.overlay.querySelector('#form-tax-note').value.trim() || 'Khai báo thủ công';

      if (!period || amount <= 0) {
         showToast('Kỳ báo cáo và Số tiền không hợp lệ!', 'error'); return;
      }

      store.add('taxes', {
        id: store.generateId('TX', 'taxes'), type, period, amount,
        deadline: due, note, status: 'pending'
      });

      showToast('Đã lưu nghĩa vụ thuế chưa nộp!', 'success');
      modal.close();
      renderTax(container);
    });
  });
}
