// ============================================
// ERP SYSTEM - ORDERS MODULE (LED & EVENTS)
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { formatCurrency, formatFullCurrency, formatDate, getStatusBadge } from '../utils.js';

export default function renderOrders(container) {
  const orders = store.get('orders');
  const customers = store.get('customers');
  const perm = auth.getPermission('orders');

  const neonOrders = orders.filter(o => o.type === 'neon');
  const eventOrders = orders.filter(o => o.type === 'event');
  
  const inProgress = orders.filter(o => ['approved', 'producing'].includes(o.status)).length;
  const totalValue = orders.reduce((sum, o) => sum + (o.price || 0), 0);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Quản lý Đơn hàng</h1>
        <p>Theo dõi đơn hàng Sản xuất LED và Tổ chức Sự kiện</p>
      </div>
      <div class="page-header-right">
        ${perm === 'full' ? `<button class="btn btn-primary" id="btn-add-order">${ICONS.plus} Tạo Đơn hàng</button>` : ''}
      </div>
    </div>

    <div class="stats-grid stagger-children">
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-primary)">${ICONS['shopping-cart']}</div></div>
        <div class="stat-card-value">${orders.length}</div>
        <div class="stat-card-label">Tổng số đơn hàng</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-success)">${ICONS.money}</div></div>
        <div class="stat-card-value">${formatCurrency(totalValue)}</div>
        <div class="stat-card-label">Tổng giá trị HĐ</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-warning)">${ICONS.tool}</div></div>
        <div class="stat-card-value">${neonOrders.length}</div>
        <div class="stat-card-label">Đơn LED Neon</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-info)">${ICONS.speaker}</div></div>
        <div class="stat-card-value">${eventOrders.length}</div>
        <div class="stat-card-label">Hợp đồng Sự kiện</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Danh sách Đơn hàng & Hợp đồng</h3>
        <div style="display:flex;gap:8px">
          <select class="form-select" id="order-type-filter" style="width:140px">
            <option value="">Tất cả mảng</option>
            <option value="neon">Chỉ LED Neon</option>
            <option value="event">Chỉ Sự kiện</option>
          </select>
          <select class="form-select" id="order-status-filter" style="width:160px">
            <option value="">Tất cả trạng thái</option>
            <option value="quoting">Đang báo giá</option>
            <option value="approved">Đã chốt</option>
            <option value="producing">Đang sản xuất</option>
            <option value="done">Hoàn thành</option>
          </select>
        </div>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã Đơn</th>
              <th>Khách hàng</th>
              <th>Nội dung</th>
              <th>Phân loại</th>
              <th>Giá trị HĐ (VNĐ)</th>
              <th>Deadline</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody id="orders-table-body"></tbody>
        </table>
      </div>
    </div>
  `;

  function renderTable(typeFilter = '', statusFilter = '') {
    let data = orders;
    if (typeFilter) data = data.filter(o => o.type === typeFilter);
    if (statusFilter) data = data.filter(o => o.status === statusFilter);

    // Sắp xếp đơn mới trước
    data = data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    document.getElementById('orders-table-body').innerHTML = data.map(o => {
      const cus = store.getById('customers', o.customerId);
      const isEvent = o.type === 'event';
      
      return `<tr>
        <td style="font-weight:600;font-family:var(--font-mono);color:var(--text-secondary)">${o.id}</td>
        <td>
          <div style="font-weight:500">${cus?.name || 'Khách lẻ'}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-muted)">${cus?.contact || ''}</div>
        </td>
        <td style="max-width:250px">
          <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${o.title}">${o.title}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-muted)">${isEvent ? (o.size || '') : (o.size + ' | ' + o.color)}</div>
        </td>
        <td>
          <span class="badge ${isEvent ? 'badge-amber' : 'badge-violet'}">
            ${isEvent ? '🎤 Sự kiện' : '✨ LED Neon'}
          </span>
        </td>
        <td style="font-variant-numeric:tabular-nums;font-weight:600;color:var(--accent-blue-light)">
          ${formatFullCurrency(o.price)}
        </td>
        <td>${formatDate(o.deadline)}</td>
        <td>${getStatusBadge(o.status)}</td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-icon btn-ghost btn-sm" data-action="view" data-id="${o.id}">${ICONS.eye}</button>
            ${perm === 'full' ? `<button class="btn btn-icon btn-ghost btn-sm" data-action="edit" data-id="${o.id}">${ICONS.edit}</button>` : ''}
          </div>
        </td>
      </tr>`;
    }).join('');
    if (data.length === 0) {
      document.getElementById('orders-table-body').innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted)">Không tìm thấy đơn hàng nào phù hợp.</td></tr>`;
    }
  }

  renderTable();

  // Filters
  document.getElementById('order-type-filter')?.addEventListener('change', e => {
    renderTable(e.target.value, document.getElementById('order-status-filter').value);
  });
  document.getElementById('order-status-filter')?.addEventListener('change', e => {
    renderTable(document.getElementById('order-type-filter').value, e.target.value);
  });

  // Actions
  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const order = store.getById('orders', btn.dataset.id);
    if (!order) return;
    
    if (btn.dataset.action === 'view') {
      const cus = store.getById('customers', order.customerId);
      const isEvent = order.type === 'event';
      showModal(`Chi tiết ${isEvent ? 'Hợp đồng Sự kiện' : 'Đơn hàng LED'} - ${order.id}`, `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <div>
            <div style="font-size:var(--font-size-sm);color:var(--text-muted)">Khách hàng</div>
            <div style="font-weight:600;font-size:var(--font-size-lg)">${cus?.name || '---'}</div>
            <div style="font-size:var(--font-size-sm)">${cus?.phone || ''}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:var(--font-size-sm);color:var(--text-muted)">Trạng thái</div>
            <div style="margin-top:4px">${getStatusBadge(order.status)}</div>
          </div>
        </div>
        <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:16px;margin-bottom:16px">
          <h4 style="margin-bottom:12px;color:var(--text-primary)">Nội dung yêu cầu</h4>
          <p style="font-weight:500;margin-bottom:12px;font-size:var(--font-size-lg)">${order.title}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:var(--font-size-sm)">
            ${isEvent ? `
              <div><span style="color:var(--text-muted)">Quy mô/Sân khấu:</span> ${order.size || '---'}</div>
              <div style="grid-column: span 2"><span style="color:var(--text-muted)">Thiết bị yêu cầu:</span> ${order.equipment || '---'}</div>
            ` : `
              <div><span style="color:var(--text-muted)">Kích thước bảng:</span> ${order.size || '---'}</div>
              <div><span style="color:var(--text-muted)">Chiều dài dây LED:</span> ${order.stringLength || '---'}</div>
              <div><span style="color:var(--text-muted)">Màu sắc LED:</span> ${order.color || '---'}</div>
            `}
            <div><span style="color:var(--text-muted)">Tổng giá trị HĐ:</span> <strong style="color:var(--accent-emerald)">${formatFullCurrency(order.price)}</strong></div>
            <div><span style="color:var(--text-muted)">Hạn bàn giao:</span> ${formatDate(order.deadline)}</div>
          </div>
        </div>
      `, { size: 'lg', footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Đóng</button>' });
    }
  });

  // Create Order Modal Logic
  document.getElementById('btn-add-order')?.addEventListener('click', () => {
    const custOptions = store.get('customers').map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const today = new Date().toISOString().split('T')[0];

    const modal = showModal('Tạo Đơn Hàng / Hợp Đồng Mới', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">Loại Hình</label>
          <select id="form-order-type" class="form-select">
            <option value="neon">✨ Sản xuất LED Neon</option>
            <option value="event">🎤 Tổ chức Sự kiện</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Khách Hàng</label>
          <select id="form-order-cust" class="form-select">${custOptions}</select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Tên Dự án / Ghi chú chính</label>
        <input type="text" id="form-order-title" class="form-input" placeholder="VD: Bảng Happy Birthday, Setup tiệc Gala..." required />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">Trị Giá Hợp đồng (VNĐ)</label>
          <input type="number" id="form-order-price" class="form-input" placeholder="0" required />
        </div>
        <div class="form-group">
          <label class="form-label">Hạn chót (Deadline)</label>
          <input type="date" id="form-order-deadline" value="${today}" class="form-input" required />
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
         <div class="form-group">
            <label class="form-label">Kích thước / Quy mô</label>
            <input type="text" id="form-order-size" class="form-input" placeholder="VD: 150x80cm..." />
         </div>
         <div class="form-group">
            <label class="form-label">Nhân viên Sale phụ trách</label>
            <select id="form-order-sales" class="form-select">
               <option value="">-- Chọn Sale --</option>
               ${store.get('employees').filter(e => e.role === 'sales').map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
            </select>
         </div>
      </div>
      <div class="form-group">
         <label class="form-label">Màu sắc / Thiết bị</label>
         <input type="text" id="form-order-extra" class="form-input" placeholder="Cam, Xanh / 4 Loa rực rỡ..." />
      </div>
    `, { size: 'md', footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Hủy</button><button class="btn btn-primary" id="btn-save-order">Tạo & Đồng Bộ</button>' });

    modal.overlay.querySelector('#btn-save-order').addEventListener('click', () => {
      const type = modal.overlay.querySelector('#form-order-type').value;
      const custId = modal.overlay.querySelector('#form-order-cust').value;
      const title = modal.overlay.querySelector('#form-order-title').value.trim();
      const price = parseInt(modal.overlay.querySelector('#form-order-price').value) || 0;
      const deadline = modal.overlay.querySelector('#form-order-deadline').value;
      const size = modal.overlay.querySelector('#form-order-size').value.trim();
      const salesId = modal.overlay.querySelector('#form-order-sales').value;
      const extra = modal.overlay.querySelector('#form-order-extra').value.trim();

      if (!title || price <= 0) {
        showToast('Vui lòng nhập Tên dự án và Trị giá hợp lệ', 'error'); return;
      }

      // 1. Tạo Đơn Hàng mới (Lưu cả Sales Id phục vụ tính hoa hồng)
      const orderId = store.generateId('OD');
      store.add('orders', {
        id: orderId, type, title, customerId: custId, salesId, price, deadline,
        size, color: extra, equipment: extra,
        status: 'approved', createdAt: new Date().toISOString()
      });

      // 2. Đồng bộ: Tạo thẻ Kanban (Nếu là LED) hoặc Lịch (Nếu là Event)
      if (type === 'neon') {
         store.add('production', {
            id: store.generateId('PR'), orderId, step: 'preparing',
            assignee: 'EMP-05' // Mặc định gán Trưởng Xưởng (ví dụ EMP-05)
         });
      } else {
         store.add('events', {
            id: store.generateId('EV'), orderId, title: "Triển khai: " + title,
            date: deadline, location: 'Cần cập nhật', status: 'preparing', team: ['EMP-06']
         });
      }

      // 3. Đồng bộ: Kéo theo khoản phải thu Công Nợ (Lưu cả Sale phụ trách để tính hoa hồng)
      store.add('debts', {
        id: store.generateId('DB'), type: 'receivable', partnerId: custId,
        sourceId: orderId, salesId, totalAmount: price, paidAmount: 0,
        dueDate: deadline, status: 'pending', createdAt: new Date().toISOString()
      });

      showToast(`Tạo thành công HĐ ${orderId}. Đã tự động chuyển qua Xưởng & Công Nợ!`, 'success');
      modal.close();
      renderOrders(container); // Re-render table
    });
  });

  // LOGIC CHỈNH SỬA ĐƠN HÀNG
  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="edit"]');
    if (!btn) return;
    
    const order = store.getById('orders', btn.dataset.id);
    if (!order) return;

    const custOptions = store.get('customers').map(c => `<option value="${c.id}" ${order.customerId===c.id?'selected':''}>${c.name}</option>`).join('');
    const saleOptions = store.get('employees').filter(e => e.role === 'sales').map(e => `<option value="${e.id}" ${order.salesId===e.id?'selected':''}>${e.name}</option>`).join('');

    const modal = showModal(`Sửa Đơn Hàng: ${order.id}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label class="form-label">Loại Hình</label>
           <select id="edit-order-type" class="form-select">
              <option value="neon" ${order.type==='neon'?'selected':''}>✨ Sản xuất LED Neon</option>
              <option value="event" ${order.type==='event'?'selected':''}>🎤 Tổ chức Sự kiện</option>
           </select>
        </div>
        <div class="form-group"><label class="form-label">Khách Hàng</label>
           <select id="edit-order-cust" class="form-select">${custOptions}</select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Tên Dự án / Ghi chú</label>
         <input type="text" id="edit-order-title" class="form-input" value="${order.title}">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label class="form-label">Trị Giá (VNĐ)</label>
           <input type="number" id="edit-order-price" class="form-input" value="${order.price}">
        </div>
        <div class="form-group"><label class="form-label">Nhân viên Sale phụ trách</label>
           <select id="edit-order-sales" class="form-select">
              <option value="">-- Chọn Sale --</option>
              ${saleOptions}
           </select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Trạng thái đơn hàng</label>
         <select id="edit-order-status" class="form-select">
            <option value="quoting" ${order.status==='quoting'?'selected':''}>Đang báo giá</option>
            <option value="approved" ${order.status==='approved'?'selected':''}>Đã chốt (Xác nhận)</option>
            <option value="producing" ${order.status==='producing'?'selected':''}>Đang sản xuất</option>
            <option value="done" ${order.status==='done'?'selected':''}>Hoàn thành & Bàn giao</option>
         </select>
      </div>
    `, { footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Hủy</button><button class="btn btn-primary" id="btn-update-order">Cập nhật thay đổi</button>' });

    modal.overlay.querySelector('#btn-update-order').addEventListener('click', async () => {
       const updates = {
          type: document.getElementById('edit-order-type').value,
          customerId: document.getElementById('edit-order-cust').value,
          title: document.getElementById('edit-order-title').value.trim(),
          price: parseInt(document.getElementById('edit-order-price').value) || 0,
          salesId: document.getElementById('edit-order-sales').value,
          status: document.getElementById('edit-order-status').value
       };

       await store.update('orders', order.id, updates);
       
       // Cập nhật SalesId cả bên Công nợ (Để hoa hồng luôn đúng)
       const debt = store.get('debts').find(d => d.sourceId === order.id);
       if (debt) {
          await store.update('debts', debt.id, { salesId: updates.salesId, totalAmount: updates.price });
       }

       showToast(`Đã cập nhật Đơn hàng ${order.id} thành công!`, 'success');
       modal.close();
       renderOrders(container);
    });
  });
}
