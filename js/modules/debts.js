// ============================================
// ERP SYSTEM - DEBTS MODULE (Công nợ)
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { formatFullCurrency, formatDate, getStatusBadge, getInitials } from '../utils.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { paginate, paginationHTML, bindPagination } from '../components/pagination.js';

export default function renderDebts(container) {
  const perm = auth.getPermission('debts');
  let currentTab = 'led'; // 'led' or 'event'
  let ledPage = 1, eventPage = 1, payablePage = 1;

  const render = () => {
    const debts = store.get('debts');
    const ledDebts = debts.filter(d => d.branch !== 'event' && d.type === 'receivable');
    const eventDebts = debts.filter(d => d.branch === 'event' && d.type === 'receivable');
    const payables = debts.filter(d => d.type === 'payable');

    const totalReceivable = debts.filter(d => d.type === 'receivable').reduce((sum, d) => sum + ((d.totalAmount || 0) + (d.shippingFee || 0) - (d.paidAmount || 0)), 0);
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
        <!-- Tabs Chuyên Nghiệp -->
        <div style="display: flex; border-bottom: 2px solid var(--border-color); margin-bottom: -24px; padding-left: 8px; gap: 24px;">
          <div id="tab-led" style="padding: 12px 16px; cursor: pointer; color: ${currentTab === 'led' ? 'var(--accent-blue-light)' : 'var(--text-muted)'}; border-bottom: 2px solid ${currentTab === 'led' ? 'var(--accent-blue-light)' : 'transparent'}; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
            <span style="width:18px; height:18px;">${ICONS.tool}</span> Đèn LED & Bảng hiệu
          </div>
          <div id="tab-event" style="padding: 12px 16px; cursor: pointer; color: ${currentTab === 'event' ? 'var(--accent-blue-light)' : 'var(--text-muted)'}; border-bottom: 2px solid ${currentTab === 'event' ? 'var(--accent-blue-light)' : 'transparent'}; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
            <span style="width:18px; height:18px;">${ICONS.speaker}</span> Tổ chức Sự kiện
          </div>
        </div>

        <div class="card" style="margin-top: 24px;">
          <div class="card-header" style="justify-content: space-between">
            <h3 style="color:var(--accent-emerald)">
              ${currentTab === 'led' ? 'Công nợ Khách hàng - Mảng Sản xuất & Quảng cáo' : 'Công nợ Khách hàng - Mảng Sự kiện'}
            </h3>
            <span class="badge badge-blue">${(currentTab === 'led' ? ledDebts : eventDebts).length} Khoản nợ</span>
          </div>
          <div class="data-table-wrapper" style="overflow-x: auto" id="debt-main-wrap"></div>
          <div id="debt-main-pag"></div>
        </div>

        <!-- Khoản Phải Trả (Nhà cung cấp) -->
        <div class="card">
          <div class="card-header">
            <h3 style="color:var(--accent-rose)">Công nợ Phải Trả (Cho Nhà cung cấp Vật tư)</h3>
          </div>
          <div class="data-table-wrapper" id="debt-pay-wrap"></div>
          <div id="debt-pay-pag"></div>
        </div>
      </div>
    `;

    // Populate paginated table wrappers
    const fillDebtTable = (wrapperId, pagId, data, renderFn, getPage, setPage) => {
      const wrap = container.querySelector('#' + wrapperId);
      const pagEl = container.querySelector('#' + pagId);
      if (!wrap) return;
      const { items, total, pages, page } = paginate(data, getPage());
      wrap.innerHTML = renderFn(items, perm);
      if (pagEl) {
        pagEl.innerHTML = paginationHTML(page, pages, total);
        bindPagination(pagEl, p => { setPage(p); fillDebtTable(wrapperId, pagId, data, renderFn, getPage, setPage); });
      }
    };

    fillDebtTable(
      'debt-main-wrap', 'debt-main-pag',
      currentTab === 'led' ? ledDebts : eventDebts,
      currentTab === 'led'
        ? (items, p) => renderLEDTable(items, p)
        : (items, p) => renderDebtTable(items, 'receivable', p),
      () => currentTab === 'led' ? ledPage : eventPage,
      p => { if (currentTab === 'led') ledPage = p; else eventPage = p; }
    );

    fillDebtTable(
      'debt-pay-wrap', 'debt-pay-pag',
      payables,
      (items, p) => renderDebtTable(items, 'payable', p),
      () => payablePage,
      p => { payablePage = p; }
    );

    // Re-attach listeners for elements inside the template
    container.querySelector('#tab-led').onclick = () => { currentTab = 'led'; ledPage = 1; render(); };
    container.querySelector('#tab-event').onclick = () => { currentTab = 'event'; eventPage = 1; render(); };
    
    container.querySelector('#btn-add-debt')?.addEventListener('click', () => {
      const today = new Date().toISOString().split('T')[0];
      const modal = showModal('Thêm Công Nợ Thủ Công', `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Phân nhánh sản phẩm</label>
            <select id="form-debt-branch" class="form-select">
              <option value="led">✨ Đèn LED & Quảng cáo</option>
              <option value="event">🎤 Sự kiện (Sẽ hoàn thiện sau)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Đối tác / Khách hàng</label>
            <input type="text" id="form-debt-partner" class="form-input" placeholder="Tên khách hàng..." required />
          </div>
        </div>

        <div id="led-special-fields" style="background:var(--bg-tertiary); padding:16px; border-radius:8px; margin-bottom:16px; border: 1px solid var(--accent-blue-light)">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Ngày chốt sale</label><input type="date" id="form-debt-sale-date" class="form-input" value="${today}" /></div>
            <div class="form-group"><label class="form-label">Ngày giao hàng</label><input type="date" id="form-debt-delivery-date" class="form-input" /></div>
            <div class="form-group"><label class="form-label">Hạn bảo hành</label><input type="date" id="form-debt-warranty-date" class="form-input" /></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Kênh tiếp cận</label><input type="text" id="form-debt-channel" class="form-input" placeholder="FB, TikTok..." /></div>
            <div class="form-group"><label class="form-label">Số lượng</label><input type="number" id="form-debt-qty" class="form-input" value="1" /></div>
            <div class="form-group"><label class="form-label">Kích thước</label><input type="text" id="form-debt-size" class="form-input" placeholder="100x80cm..." /></div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label class="form-label">Mã HĐ / Tham chiếu</label><input type="text" id="form-debt-source" class="form-input" placeholder="VD: LED-001" required /></div>
          <div class="form-group">
            <label class="form-label">Số điện thoại</label>
            <input type="text" id="form-debt-phone" class="form-input" placeholder="090..." />
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div class="form-group"><label class="form-label">Giá trị đơn (VNĐ)</label><input type="number" id="form-debt-amount" class="form-input" placeholder="0" required /></div>
          <div class="form-group"><label class="form-label">Tiền Ship (nếu có)</label><input type="number" id="form-debt-ship" class="form-input" value="0" /></div>
          <div class="form-group"><label class="form-label">Tiền cọc / Đã trả</label><input type="number" id="form-debt-paid" class="form-input" value="0" /></div>
        </div>
      `, { size: 'lg', footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Hủy</button><button class="btn btn-primary" id="btn-save-debt">Lưu Công Nợ</button>' });

      modal.overlay.querySelector('#btn-save-debt').addEventListener('click', () => {
        const branch = modal.overlay.querySelector('#form-debt-branch').value;
        const partner = modal.overlay.querySelector('#form-debt-partner').value.trim();
        const amount = parseInt(modal.overlay.querySelector('#form-debt-amount').value) || 0;
        const ship = parseInt(modal.overlay.querySelector('#form-debt-ship').value) || 0;
        const paid = parseInt(modal.overlay.querySelector('#form-debt-paid').value) || 0;

        if (!partner || amount <= 0) {
          showToast('Vui lòng điền đủ Tên và Số tiền hợp lệ!', 'error'); return;
        }

        store.add('debts', {
          id: store.generateId('DB'), 
          type: 'receivable', 
          branch,
          partnerName: partner,
          partnerPhone: modal.overlay.querySelector('#form-debt-phone').value,
          sourceId: modal.overlay.querySelector('#form-debt-source').value || 'MANUAL',
          totalAmount: amount,
          shippingFee: ship,
          paidAmount: paid,
          saleDate: modal.overlay.querySelector('#form-debt-sale-date').value,
          deliveryDate: modal.overlay.querySelector('#form-debt-delivery-date').value,
          warrantyDate: modal.overlay.querySelector('#form-debt-warranty-date').value,
          channel: modal.overlay.querySelector('#form-debt-channel').value,
          quantity: modal.overlay.querySelector('#form-debt-qty').value,
          size: modal.overlay.querySelector('#form-debt-size').value,
          status: (paid >= (amount + ship)) ? 'paid' : (paid > 0 ? 'partial' : 'pending'),
          dueDate: modal.overlay.querySelector('#form-debt-delivery-date').value || today,
          createdAt: new Date().toISOString()
        });

        showToast('Đã lưu khoản công nợ chuyên sâu!', 'success');
        modal.close();
        render();
      });
    });
  };

  // Delegate click for payment (so it doesn't need re-attaching)
  container.addEventListener('click', e => {
    // Handle edit-debt action
    const editBtn = e.target.closest('[data-action="edit-debt"]');
    if (editBtn) {
      const debt = store.getById('debts', editBtn.dataset.id);
      if (!debt || perm !== 'full') return;
      const modal = showModal(`Cập nhật thông tin: ${debt.id}`, `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Ngày giao hàng</label>
            <input type="date" id="edit-delivery" class="form-input" value="${debt.deliveryDate || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Hạn bảo hành</label>
            <input type="date" id="edit-warranty" class="form-input" value="${debt.warrantyDate || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Kênh tiếp cận</label>
            <input type="text" id="edit-channel" class="form-input" value="${debt.channel || ''}" placeholder="FB, TikTok, Zalo..." />
          </div>
          <div class="form-group">
            <label class="form-label">Kích thước</label>
            <input type="text" id="edit-size" class="form-input" value="${debt.size || ''}" placeholder="100x80cm..." />
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Ghi chú</label>
            <input type="text" id="edit-notes" class="form-input" value="${debt.notes || ''}" placeholder="Ghi chú thêm..." />
          </div>
        </div>
      `, { footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Hủy</button><button class="btn btn-primary" id="btn-save-edit-debt">Lưu thay đổi</button>' });

      modal.overlay.querySelector('#btn-save-edit-debt').addEventListener('click', async () => {
        await store.update('debts', debt.id, {
          deliveryDate: modal.overlay.querySelector('#edit-delivery').value,
          warrantyDate: modal.overlay.querySelector('#edit-warranty').value,
          channel: modal.overlay.querySelector('#edit-channel').value,
          size: modal.overlay.querySelector('#edit-size').value,
          notes: modal.overlay.querySelector('#edit-notes').value,
        });
        modal.close();
        render();
      });
      return;
    }

    const btn = e.target.closest('[data-action="pay"]');
    if (!btn) return;
    const debt = store.getById('debts', btn.dataset.id);
    if (!debt) return;

    if (perm === 'full') {
      const remaining = (debt.totalAmount || 0) + (debt.shippingFee || 0) - (debt.paidAmount || 0);
      const typeLabel = debt.type === 'receivable' ? 'THU TIỀN' : 'CHI TRẢ';
      
      const modal = showModal(`Ghi nhận ${typeLabel} - ${debt.id}`, `
        <div style="background:var(--bg-tertiary);padding:12px;border-radius:var(--radius-md);margin-bottom:16px;font-size:var(--font-size-sm)">
          <div>Tham chiếu: <strong>${debt.sourceId}</strong></div>
          <div style="display:flex; justify-content:space-between; margin-top:4px">
            <span>Giá trị đơn: <strong>${formatFullCurrency(debt.totalAmount)}</strong></span>
            ${debt.shippingFee ? `<span style="color:var(--accent-amber)">Ship: +${formatFullCurrency(debt.shippingFee)}</span>` : ''}
          </div>
          <div style="margin-top:8px; border-top:1px solid var(--border-color); padding-top:4px">Còn lại: <strong style="color:var(--accent-rose); font-size:16px">${formatFullCurrency(remaining)}</strong></div>
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

      modal.overlay.querySelector('#btn-submit-pay').addEventListener('click', async () => {
        const amt = parseInt(modal.overlay.querySelector('#pay-amount').value);
        if (amt <= 0 || amt > remaining) {
          showToast('Số tiền không hợp lệ', 'error'); return;
        }

        const submitBtn = modal.overlay.querySelector('#btn-submit-pay');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang lưu...';

        const newPaid = (debt.paidAmount || 0) + amt;
        const totalReq = (debt.totalAmount || 0) + (debt.shippingFee || 0);
        const newStatus = newPaid >= totalReq ? 'paid' : 'partial';

        // Cập nhật công nợ trước
        await store.update('debts', debt.id, { paidAmount: newPaid, status: newStatus });

        // Ghi vào sổ quỹ
        const partnerLabel = debt.partnerName || debt.sourceId || debt.id;
        await store.add('funds', {
          id: store.generateId('FD'),
          date: modal.overlay.querySelector('#pay-date').value,
          account: modal.overlay.querySelector('#pay-fund').value,
          type: debt.type === 'receivable' ? 'in' : 'out',
          amount: amt,
          category: debt.type === 'receivable' ? 'Thu công nợ khách hàng' : 'Thanh toán nhà cung cấp',
          description: `${debt.type === 'receivable' ? 'Thu tiền' : 'Trả tiền'}: ${partnerLabel}`,
          refId: debt.sourceId || debt.id
        });

        showToast(`Đã ghi nhận ${formatFullCurrency(amt)} vào Sổ quỹ!`, 'success');
        modal.close();
        render();
      });
    }
  });

  render(); 
}

function renderLEDTable(data, perm) {
  if (data.length === 0) return `<div style="padding:24px;text-align:center;color:var(--text-muted)">Không có dữ liệu trong mảng LED.</div>`;
  
  return `
    <table class="data-table" style="min-width:1200px">
      <thead>
        <tr>
          <th>Mã / Ngày Sale</th>
          <th>Khách hàng</th>
          <th>SP (SL/Kích thước)</th>
          <th>Kênh</th>
          <th>Giao / Bảo hành</th>
          <th>Giá Đơn</th>
          <th>Ship</th>
          <th>Cọc / Đã trả</th>
          <th>Còn lại</th>
          <th>Trạng thái</th>
          ${perm === 'full' ? '<th>Thao tác</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${data.map(d => {
          const totalReceivable = (d.totalAmount || 0) + (d.shippingFee || 0);
          const remain = totalReceivable - (d.paidAmount || 0);
          const isOverdue = d.status !== 'paid' && d.deliveryDate && new Date(d.deliveryDate) < new Date();
          
          let partnerName = d.partnerName;
          let partnerPhone = d.partnerPhone;
          if (!partnerName && d.partnerId) {
             const cus = store.getById('customers', d.partnerId);
             partnerName = cus?.name || 'Khách lẻ/Ẩn';
             if (!partnerPhone) partnerPhone = cus?.phone || cus?.contact || '';
          }
          
          return `
          <tr style="${isOverdue ? 'background:rgba(244,63,94,0.05)' : ''}">
            <td>
               <div style="font-weight:600">${d.id}</div>
               <div style="font-size:10px; color:var(--text-muted)">Sale: ${formatDate(d.saleDate)}</div>
            </td>
            <td>
               <div style="font-weight:600; color:var(--text-primary)">${partnerName}</div>
               <div style="font-size:10px; color:var(--accent-blue-light)">${partnerPhone || ''}</div>
            </td>
            <td>
               <div style="font-size:12px">${d.size || '---'}</div>
               <div style="font-size:10px; color:var(--text-muted)">SL: <strong>${d.quantity || 1}</strong></div>
            </td>
            <td style="font-size:12px; color:var(--accent-amber)">${d.channel || '---'}</td>
            <td>
               <div style="display:flex; align-items:center; gap:4px; font-size:11px">
                 <span style="width:12px; height:12px; color:var(--text-muted)">${ICONS.box}</span>
                 <span>Giao: ${formatDate(d.deliveryDate)}</span>
               </div>
               <div style="display:flex; align-items:center; gap:4px; font-size:10px; color:var(--accent-emerald); margin-top:2px">
                 <span style="width:12px; height:12px;">${ICONS['check-circle']}</span>
                 <span>BH: ${formatDate(d.warrantyDate)}</span>
               </div>
            </td>
            <td style="font-variant-numeric:tabular-nums">${formatFullCurrency(d.totalAmount)}</td>
            <td style="font-variant-numeric:tabular-nums; color:var(--accent-amber)">${formatFullCurrency(d.shippingFee || 0)}</td>
            <td style="font-variant-numeric:tabular-nums; color:var(--accent-emerald)">${formatFullCurrency(d.paidAmount || 0)}</td>
            <td style="font-variant-numeric:tabular-nums; font-weight:600; color:var(--accent-rose); background:rgba(244,63,94,0.03)">${formatFullCurrency(remain)}</td>
            <td>${getStatusBadge(d.status)}</td>
            ${perm === 'full' ? `
            <td>
               <button class="btn btn-sm btn-success" data-action="pay" data-id="${d.id}" title="Thu tiền">${ICONS.wallet}</button>
               <button class="btn btn-sm btn-ghost" data-action="edit-debt" data-id="${d.id}" title="Sửa thông tin BH">${ICONS.edit}</button>
            </td>` : ''}
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
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
          const remain = (d.totalAmount || 0) + (d.shippingFee || 0) - (d.paidAmount || 0);
          
          let partnerInfo = `
            <div style="font-weight:600; color:var(--text-primary)">${partnerName}</div>
            ${d.partnerPhone ? `<div style="font-size:11px; color:var(--accent-blue-light)">📞 ${d.partnerPhone}</div>` : ''}
            ${d.partnerAddress ? `<div style="font-size:11px; color:var(--text-muted); max-width:200px; line-height:1.2; margin-top:2px">${d.partnerAddress}</div>` : ''}
          `;
          const salesPerson = d.salesId ? store.getById('employees', d.salesId) : null;
          
          return `
          <tr style="${isOverdue ? 'background:rgba(244,63,94,0.05)' : ''}">
            <td>
              <div style="font-weight:600">${d.id}</div>
              <div style="font-size:var(--font-size-xs);color:var(--text-muted);font-family:var(--font-mono)">${d.sourceId}</div>
            </td>
            <td>${partnerInfo}</td>
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
                 ${d.status !== 'paid' ? `<button class="btn btn-sm ${type==='receivable'?'btn-success':'btn-danger'}" data-action="pay" data-id="${d.id}" title="Ghi nhận thanh toán">${ICONS.wallet}</button>` : '<span style="color:var(--text-muted);font-size:var(--font-size-xs)">Xong</span>'}
              </div>
            </td>
            ` : ''}
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}
