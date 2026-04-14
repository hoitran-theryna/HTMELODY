// ============================================
// ERP SYSTEM - CUSTOMERS MODULE (Khách hàng)
// ============================================

import store from '../store.js';
import auth from '../auth.js';

import { ICONS } from '../components/icons.js';
import { formatFullCurrency, formatDate, getStatusBadge, getInitials } from '../utils.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { paginate, paginationHTML, bindPagination } from '../components/pagination.js';

export default function renderCustomers(container) {
  const perm = auth.getPermission('customers');

  let page = 1;
  let custDateFrom = '';
  let custDateTo = '';

  const render = () => {
    // Sắp xếp khách hàng mới nhất lên đầu
    const customers = store.get('customers').sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const orders = store.get('orders');
    const debts = store.get('debts');

    // Stats
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const customersWithDebt = customers.filter(c => {
      const cDebts = debts.filter(d => d.partnerId === c.id && d.type === 'receivable');
      const remaining = cDebts.reduce((s, d) => s + ((d.totalAmount || 0) + (d.shippingFee || 0) - (d.paidAmount || 0)), 0);
      return remaining > 0;
    }).length;

    const expiringWarranty = debts.filter(d => {
      if (!d.warrantyDate) return false;
      const wd = new Date(d.warrantyDate);
      return wd >= today && wd <= in30Days;
    }).length;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Quản lý Khách hàng</h1>
          <p>Hồ sơ khách hàng, lịch sử đơn hàng và theo dõi bảo hành</p>
        </div>
        <div class="page-header-right">
          ${perm === 'full' ? `<button class="btn btn-primary" id="btn-add-customer">${ICONS.plus} Thêm Khách hàng</button>` : ''}
        </div>
      </div>

      <div class="stats-grid stagger-children">
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-primary)">${ICONS.users}</div></div>
          <div class="stat-card-value">${customers.length}</div>
          <div class="stat-card-label">Tổng Khách hàng</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-warning)">${ICONS['trending-up']}</div></div>
          <div class="stat-card-value">${customersWithDebt}</div>
          <div class="stat-card-label">Còn Công nợ</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-danger)">${ICONS.clock}</div></div>
          <div class="stat-card-value">${expiringWarranty}</div>
          <div class="stat-card-label">Bảo hành Hết hạn (30 ngày)</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header" style="flex-wrap:wrap;gap:8px">
          <h3>Danh sách Khách hàng</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <input type="text" id="cust-search" class="form-input" placeholder="Tìm theo tên, SĐT..." style="width:190px" />
            <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg-tertiary);border-radius:var(--radius-md);border:1px solid var(--border-color)">
              <span style="font-size:12px;color:var(--text-muted);white-space:nowrap">Từ</span>
              <input type="date" id="cust-date-from" class="form-input" style="width:130px;padding:4px 8px;font-size:12px" value="${custDateFrom}" />
              <span style="font-size:12px;color:var(--text-muted)">→</span>
              <input type="date" id="cust-date-to" class="form-input" style="width:130px;padding:4px 8px;font-size:12px" value="${custDateTo}" />
              <button class="btn btn-ghost btn-sm" id="cust-date-clear" style="padding:4px 8px;font-size:11px;color:var(--text-muted)">× Xóa</button>
            </div>
          </div>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>SĐT / Email</th>
                <th>Địa chỉ</th>
                <th>Số đơn</th>
                <th>Còn nợ</th>
                <th>Bảo hành gần nhất</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody id="customers-tbody"></tbody>
          </table>
        </div>
        <div id="customers-pag"></div>
      </div>
    `;

    function renderTablePage(data, newPage = 1) {
      page = newPage;
      const { items, total, pages } = paginate(data, page);
      container.querySelector('#customers-tbody').innerHTML = renderRows(items, orders, debts);
      const pag = container.querySelector('#customers-pag');
      if (pag) {
        pag.innerHTML = paginationHTML(page, pages, total);
        bindPagination(pag, p => renderTablePage(data, p));
      }
    }

    function getFiltered() {
      const q    = (container.querySelector('#cust-search')?.value || '').toLowerCase();
      const from = container.querySelector('#cust-date-from')?.value || custDateFrom;
      const to   = container.querySelector('#cust-date-to')?.value || custDateTo;
      let result = customers;
      if (q) result = result.filter(c => (c.name || '').toLowerCase().includes(q) || (c.phone || c.contact || '').includes(q));
      if (from) {
        const d = new Date(from);
        result = result.filter(c => c.createdAt && new Date(c.createdAt) >= d);
      }
      if (to) {
        const d = new Date(to); d.setHours(23, 59, 59, 999);
        result = result.filter(c => c.createdAt && new Date(c.createdAt) <= d);
      }
      return result;
    }

    renderTablePage(getFiltered());

    // Search & date filters
    container.querySelector('#cust-search')?.addEventListener('input', () => renderTablePage(getFiltered(), 1));
    container.querySelector('#cust-date-from')?.addEventListener('change', e => { custDateFrom = e.target.value; renderTablePage(getFiltered(), 1); });
    container.querySelector('#cust-date-to')?.addEventListener('change', e => { custDateTo = e.target.value; renderTablePage(getFiltered(), 1); });
    container.querySelector('#cust-date-clear')?.addEventListener('click', () => {
      custDateFrom = ''; custDateTo = '';
      container.querySelector('#cust-date-from').value = '';
      container.querySelector('#cust-date-to').value = '';
      renderTablePage(getFiltered(), 1);
    });

    // Add customer
    container.querySelector('#btn-add-customer')?.addEventListener('click', () => openCustomerModal(null, render));

    // Row actions (delegate)
    container.addEventListener('click', async e => {
      const viewBtn = e.target.closest('[data-action="view-cust"]');
      const editBtn = e.target.closest('[data-action="edit-cust"]');
      const deleteBtn = e.target.closest('[data-action="delete-cust"]');
      if (viewBtn) {
        const c = store.getById('customers', viewBtn.dataset.id);
        if (c) openCustomerDetail(c, orders, debts, perm, render);
      }
      if (editBtn) {
        const c = store.getById('customers', editBtn.dataset.id);
        if (c && perm === 'full') openCustomerModal(c, render);
      }
      if (deleteBtn && auth.isDirector()) {
        const c = store.getById('customers', deleteBtn.dataset.id);
        if (!c) return;
        const cOrders = store.get('orders').filter(o => o.customerId === c.id);
        if (cOrders.length > 0) {
          showToast(`Không thể xóa! "${c.name}" còn ${cOrders.length} đơn hàng liên quan. Hãy xóa đơn hàng trước.`, 'error');
          return;
        }
        // Xóa các công nợ không liên kết đơn hàng (nhập tay)
        const cDebts = store.get('debts').filter(d => d.partnerId === c.id);
        if (!confirm(`Xóa vĩnh viễn khách hàng "${c.name}"?${cDebts.length ? `\n• ${cDebts.length} khoản công nợ liên quan cũng sẽ bị xóa.` : ''}`)) return;
        for (const d of cDebts) await store.remove('debts', d.id, true);
        await store.remove('customers', c.id, true);
        showToast(`Đã xóa khách hàng "${c.name}"!`, 'success');
        render();
      }
    });
  };

  render();
}

function renderRows(customers, orders, debts) {
  if (customers.length === 0) return `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">Chưa có khách hàng nào.</td></tr>`;
  const today = new Date();

  return customers.map(c => {
    const cOrders = orders.filter(o => o.customerId === c.id);
    const cDebts = debts.filter(d => d.partnerId === c.id && d.type === 'receivable');
    const remaining = cDebts.reduce((s, d) => s + Math.max(0, (d.totalAmount || 0) + (d.shippingFee || 0) - (d.paidAmount || 0)), 0);

    // Next warranty
    const futureWarranties = cDebts
      .filter(d => d.warrantyDate && new Date(d.warrantyDate) >= today)
      .sort((a, b) => new Date(a.warrantyDate) - new Date(b.warrantyDate));
    const nextWarranty = futureWarranties[0];
    const isExpiringSoon = nextWarranty && (new Date(nextWarranty.warrantyDate) - today) < 30 * 24 * 60 * 60 * 1000;

    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="avatar avatar-sm" style="background:var(--gradient-primary);width:32px;height:32px;font-size:12px">${getInitials(c.name)}</div>
          <div>
            <div style="font-weight:600">${c.name || '---'}</div>
            ${c.notes ? `<div style="font-size:10px;color:var(--text-muted)">${c.notes.substring(0,40)}...</div>` : ''}
          </div>
        </div>
      </td>
      <td>
        <div>${c.phone || c.contact || '---'}</div>
        ${c.email ? `<div style="font-size:11px;color:var(--text-muted)">${c.email}</div>` : ''}
      </td>
      <td style="font-size:12px;max-width:180px;color:var(--text-secondary)">${c.address || '---'}</td>
      <td><span class="badge badge-blue">${cOrders.length} đơn</span></td>
      <td style="font-weight:600;color:${remaining > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'}">
        ${remaining > 0 ? formatFullCurrency(remaining) : '<span class="badge badge-green">Sạch nợ</span>'}
      </td>
      <td>
        ${nextWarranty
          ? `<span style="color:${isExpiringSoon ? 'var(--accent-rose)' : 'var(--accent-emerald)'};font-weight:500;font-size:12px">${isExpiringSoon ? '⚠️ ' : '✅ '}${formatDate(nextWarranty.warrantyDate)}</span>`
          : '<span style="color:var(--text-muted);font-size:12px">---</span>'
        }
      </td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-icon btn-ghost btn-sm" data-action="view-cust" data-id="${c.id}" title="Xem hồ sơ">${ICONS.eye}</button>
          <button class="btn btn-icon btn-ghost btn-sm" data-action="edit-cust" data-id="${c.id}" title="Chỉnh sửa">${ICONS.edit}</button>
          ${auth.isDirector() ? `<button class="btn btn-icon btn-ghost btn-sm" style="color:var(--accent-rose)" data-action="delete-cust" data-id="${c.id}" title="Xóa khách hàng">${ICONS.trash}</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openCustomerDetail(c, orders, debts, perm, onUpdate) {
  const cOrders = orders.filter(o => o.customerId === c.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const cDebts = debts.filter(d => d.partnerId === c.id && d.type === 'receivable');
  const totalRemaining = cDebts.reduce((s, d) => s + Math.max(0, (d.totalAmount || 0) + (d.shippingFee || 0) - (d.paidAmount || 0)), 0);

  const ordersHtml = cOrders.length === 0
    ? `<div style="color:var(--text-muted);text-align:center;padding:12px">Chưa có đơn hàng nào</div>`
    : cOrders.map(o => {
        const debt = cDebts.find(d => d.sourceId === o.id);
        const remaining = debt ? Math.max(0, (debt.totalAmount || 0) + (debt.shippingFee || 0) - (debt.paidAmount || 0)) : 0;
        return `
        <div style="background:var(--bg-tertiary);border-radius:8px;padding:12px;margin-bottom:8px;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start">
          <div>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
              <span style="font-weight:600;font-family:var(--font-mono);font-size:12px">${o.id}</span>
              ${getStatusBadge(o.status)}
              <span class="badge ${o.type === 'neon' ? 'badge-violet' : 'badge-amber'}">${o.type === 'neon' ? '✨ LED' : '🎤 Sự kiện'}</span>
            </div>
            <div style="font-weight:500;margin-bottom:4px">${o.title}</div>
            <div style="font-size:11px;color:var(--text-muted);display:flex;gap:12px">
              <span>Giá trị: <strong>${formatFullCurrency(o.price)}</strong></span>
              <span>Deadline: ${formatDate(o.deadline)}</span>
              ${debt?.warrantyDate ? `<span style="color:var(--accent-emerald)">🔧 BH đến: <strong>${formatDate(debt.warrantyDate)}</strong></span>` : ''}
            </div>
          </div>
          <div style="text-align:right">
            ${debt ? `
              <div style="font-size:11px;color:var(--text-muted)">Còn lại</div>
              <div style="font-weight:700;color:${remaining > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'}">
                ${remaining > 0 ? formatFullCurrency(remaining) : '✓ Xong'}
              </div>
            ` : ''}
          </div>
        </div>`;
      }).join('');

  showModal(`Hồ sơ Khách hàng: ${c.name}`, `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;background:var(--bg-tertiary);padding:16px;border-radius:8px">
      <div>
        <div style="font-size:11px;color:var(--text-muted)">SĐT</div>
        <div style="font-weight:600">${c.phone || c.contact || '---'}</div>
      </div>
      <div>
        <div style="font-size:11px;color:var(--text-muted)">Email</div>
        <div>${c.email || '---'}</div>
      </div>
      <div style="grid-column:span 2">
        <div style="font-size:11px;color:var(--text-muted)">Địa chỉ</div>
        <div>${c.address || '---'}</div>
      </div>
      ${c.notes ? `<div style="grid-column:span 2"><div style="font-size:11px;color:var(--text-muted)">Ghi chú</div><div style="font-style:italic">${c.notes}</div></div>` : ''}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h4 style="color:var(--text-primary)">Lịch sử Đơn hàng (${cOrders.length})</h4>
      <div style="font-size:13px;font-weight:600;color:${totalRemaining > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'}">
        Tổng còn nợ: ${totalRemaining > 0 ? formatFullCurrency(totalRemaining) : 'Đã thanh toán hết'}
      </div>
    </div>
    <div style="max-height:300px;overflow-y:auto">${ordersHtml}</div>
  `, { size: 'lg', footer: `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">Đóng</button>${perm === 'full' ? `<button class="btn btn-primary" id="btn-edit-this-cust">Chỉnh sửa thông tin</button>` : ''}` });

  document.getElementById('btn-edit-this-cust')?.addEventListener('click', () => {
    document.querySelector('.modal-overlay')?.remove();
    openCustomerModal(c, onUpdate);
  });
}

function openCustomerModal(customer, onSuccess) {
  const isEdit = !!customer;
  const modal = showModal(isEdit ? `Sửa Khách hàng: ${customer.name}` : 'Thêm Khách hàng Mới', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">Tên Khách hàng / Công ty <span style="color:var(--accent-rose)">*</span></label>
        <input type="text" id="cust-name" class="form-input" value="${customer?.name || ''}" placeholder="Nguyễn Văn A / Cty TNHH..." required />
      </div>
      <div class="form-group">
        <label class="form-label">Số điện thoại</label>
        <input type="text" id="cust-phone" class="form-input" value="${customer?.phone || customer?.contact || ''}" placeholder="090..." />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" id="cust-email" class="form-input" value="${customer?.email || ''}" placeholder="email@..." />
      </div>
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">Địa chỉ</label>
        <input type="text" id="cust-address" class="form-input" value="${customer?.address || ''}" placeholder="Số nhà, đường, quận, TP..." />
      </div>
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">Ghi chú</label>
        <input type="text" id="cust-notes" class="form-input" value="${customer?.notes || ''}" placeholder="Khách VIP, kênh tiếp cận, sở thích..." />
      </div>
    </div>
  `, { footer: `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">Hủy</button><button class="btn btn-primary" id="btn-save-cust">${isEdit ? 'Lưu thay đổi' : 'Thêm Khách hàng'}</button>` });

  modal.overlay.querySelector('#btn-save-cust').addEventListener('click', async () => {
    const name = modal.overlay.querySelector('#cust-name').value.trim();
    if (!name) { showToast('Vui lòng nhập tên khách hàng!', 'error'); return; }

    const saveBtn = modal.overlay.querySelector('#btn-save-cust');
    saveBtn.disabled = true;

    const data = {
      name,
      phone: modal.overlay.querySelector('#cust-phone').value.trim(),
      contact: modal.overlay.querySelector('#cust-phone').value.trim(),
      email: modal.overlay.querySelector('#cust-email').value.trim(),
      address: modal.overlay.querySelector('#cust-address').value.trim(),
      notes: modal.overlay.querySelector('#cust-notes').value.trim(),
    };

    if (isEdit) {
      await store.update('customers', customer.id, data);
    } else {
      await store.add('customers', { id: store.generateId('KH', 'customers'), ...data, createdAt: new Date().toISOString() });
    }

    modal.close();
    onSuccess();
  });
}
