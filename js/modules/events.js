// ============================================
// ERP SYSTEM - EVENTS MODULE
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { formatDate, getStatusBadge, getInitials, formatFullCurrency } from '../utils.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export default function renderEvents(container) {
  const role = auth.getRole();
  const perm = auth.getPermission('events');
  // Giám đốc và thợ/nhân viên đều có thể thêm vật tư vào sự kiện
  const canEditMaterials = (role === 'director' || role === 'staff' || role === 'event' || role === 'manager');

  if (container._eventsUnsub) container._eventsUnsub();

  const render = () => {
    const events  = store.get('events');
    const orders  = store.get('orders');
    const assets  = store.get('assets');

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Quản lý Sự kiện</h1>
          <p>Lịch thi công & setup hệ thống Âm thanh, Ánh sáng, Sân khấu</p>
        </div>
        <div class="page-header-right">
          ${perm === 'full' ? `<button class="btn btn-primary" id="btn-create-event">${ICONS.plus} Tạo Sự kiện</button>` : ''}
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><h3>Lịch Sự kiện Sắp Tới</h3></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px;">
            ${events.map(ev => {
              const order   = orders.find(o => o.id === ev.orderId);
              const matCount = (ev.materials || []).length;
              const teamHtml = (ev.team || []).map(id => {
                const emp = store.getById('employees', id);
                return `<div class="avatar avatar-sm" style="background:#333" title="${emp?.name||''}">${getInitials(emp?.name||'?')}</div>`;
              }).join('');

              return `
              <div style="background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:20px;display:flex;flex-direction:column;gap:12px;cursor:pointer;transition:all 0.2s" class="event-card" data-id="${ev.id}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <span class="badge badge-amber" style="font-size:10px">📅 ${formatDate(ev.date)}</span>
                  ${getStatusBadge(ev.status)}
                </div>
                <h4 style="margin:0;font-size:var(--font-size-lg);line-height:1.4">${ev.title}</h4>
                <div style="display:flex;flex-direction:column;gap:6px;font-size:var(--font-size-sm);color:var(--text-muted)">
                  <div>📍 ${ev.location}</div>
                  <div>📦 Đơn hàng: ${order?.id || '---'}</div>
                  ${ev.contractId ? `<div>📄 Hợp đồng: ${store.get('contracts').find(c=>c.id===ev.contractId)?.ctrNo || ev.contractId}</div>` : ''}
                  ${matCount > 0 ? `<div style="color:var(--accent-amber)">🔧 ${matCount} loại vật tư đã thêm</div>` : `<div style="color:var(--text-muted);font-style:italic">🔧 Chưa có vật tư</div>`}
                </div>
                <div style="margin-top:auto;padding-top:12px;border-top:1px dashed var(--border-color);display:flex;justify-content:space-between;align-items:center">
                  <div style="font-size:var(--font-size-xs);color:var(--text-muted)">Team Setup:</div>
                  <div style="display:flex;margin-left:8px;direction:rtl">${teamHtml}</div>
                </div>
              </div>
              `;
            }).join('')}
            ${events.length === 0 ? '<p style="color:var(--text-muted);font-style:italic">Chưa có sự kiện nào.</p>' : ''}
          </div>
        </div>
      </div>
    `;

    // Nút tạo sự kiện mới
    container.querySelector('#btn-create-event')?.addEventListener('click', () => openCreateEventModal(orders));

    // Click vào event card → mở modal chi tiết + vật tư
    container.querySelectorAll('.event-card').forEach(card => {
      card.addEventListener('click', () => {
        const ev = store.getById('events', card.dataset.id);
        if (ev) openEventDetail(ev, assets, orders, canEditMaterials);
      });
    });
  };

  container._eventsUnsub = store.on('events', () => { if (document.contains(container)) render(); });
  render();
}

// ── MODAL TẠO SỰ KIỆN MỚI ──
function openCreateEventModal(orders) {
  const today = new Date().toISOString().split('T')[0];
  const employees = store.get('employees').filter(e => ['staff', 'event', 'manager'].includes(e.role));

  const modal = showModal('Tạo Sự kiện Mới', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">Tên sự kiện</label>
        <input type="text" id="ev-title" class="form-input" placeholder="VD: Lễ khai trương ABC, Tiệc cưới..." />
      </div>
      <div class="form-group">
        <label class="form-label">Ngày diễn ra</label>
        <input type="date" id="ev-date" class="form-input" value="${today}" />
      </div>
      <div class="form-group">
        <label class="form-label">Trạng thái</label>
        <select id="ev-status" class="form-select">
          <option value="pending">Chờ xác nhận</option>
          <option value="approved">Đã duyệt</option>
          <option value="setup">Đang setup</option>
          <option value="running">Đang diễn ra</option>
          <option value="done">Hoàn thành</option>
        </select>
      </div>
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">Địa điểm</label>
        <input type="text" id="ev-location" class="form-input" placeholder="Địa chỉ tổ chức sự kiện..." />
      </div>
      <div class="form-group">
        <label class="form-label">Liên kết Đơn hàng (nếu có)</label>
        <select id="ev-order" class="form-select">
          <option value="">-- Không liên kết --</option>
          ${orders.map(o => `<option value="${o.id}">${o.id} — ${o.title || o.partnerName || ''}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Liên kết Hợp đồng (nếu có)</label>
        <select id="ev-contract" class="form-select">
          <option value="">-- Không liên kết --</option>
          ${store.get('contracts').map(c => `<option value="${c.id}">${c.ctrNo || c.id} — ${c.aName || ''}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">Team thực hiện</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px;background:var(--bg-tertiary);border-radius:8px;border:1px solid var(--border-color)">
          ${employees.length === 0
            ? '<span style="color:var(--text-muted);font-size:13px">Chưa có nhân viên nào.</span>'
            : employees.map(e => `
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;padding:4px 8px;background:var(--bg-secondary);border-radius:6px">
                <input type="checkbox" class="ev-team-cb" value="${e.id}" style="accent-color:var(--accent-emerald)">
                ${e.name}
              </label>
            `).join('')
          }
        </div>
      </div>
    </div>
  `, {
    footer: `
      <button class="btn btn-secondary" id="btn-cancel-ev">Hủy</button>
      <button class="btn btn-primary" id="btn-save-ev">Tạo Sự kiện</button>
    `
  });

  modal.overlay.querySelector('#btn-cancel-ev')?.addEventListener('click', () => modal.close());

  modal.overlay.querySelector('#btn-save-ev')?.addEventListener('click', async () => {
    const title    = modal.overlay.querySelector('#ev-title').value.trim();
    const date     = modal.overlay.querySelector('#ev-date').value;
    const status   = modal.overlay.querySelector('#ev-status').value;
    const location = modal.overlay.querySelector('#ev-location').value.trim();
    const orderId      = modal.overlay.querySelector('#ev-order').value;
    const contractId   = modal.overlay.querySelector('#ev-contract').value;
    const team         = [...modal.overlay.querySelectorAll('.ev-team-cb:checked')].map(cb => cb.value);

    if (!title)    { showToast('Vui lòng nhập tên sự kiện', 'error'); return; }
    if (!date)     { showToast('Vui lòng chọn ngày diễn ra', 'error'); return; }
    if (!location) { showToast('Vui lòng nhập địa điểm', 'error'); return; }

    const saveBtn = modal.overlay.querySelector('#btn-save-ev');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';

    await store.add('events', {
      id: store.generateId('EV'),
      title,
      date,
      status,
      location,
      orderId:    orderId    || null,
      contractId: contractId || null,
      team,
      materials: [],
      checklist: []
    });

    showToast('Đã tạo sự kiện mới!', 'success');
    modal.close();
  });
}

// ── MODAL CHI TIẾT SỰ KIỆN + QUẢN LÝ VẬT TƯ ──
function openEventDetail(ev, assets, orders, canEditMaterials) {
  const order = orders.find(o => o.id === ev.orderId);

  const renderMaterialRows = (materials) => {
    if (!materials || materials.length === 0) {
      return `<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--text-muted);font-style:italic">Chưa có vật tư nào được thêm vào sự kiện này.</td></tr>`;
    }
    return materials.map((m, idx) => `
      <tr>
        <td style="font-weight:500">${m.name}</td>
        <td style="text-align:center">${m.qty}</td>
        <td style="text-align:center">${m.unit || ''}</td>
        ${canEditMaterials ? `<td style="text-align:center">
          <button class="btn btn-icon btn-sm btn-ghost btn-rm-mat" data-idx="${idx}" style="color:var(--accent-rose)" title="Xóa vật tư">${ICONS.trash}</button>
        </td>` : '<td></td>'}
      </tr>
    `).join('');
  };

  const modal = showModal(`Chi tiết Sự kiện`, `
    <div style="margin-bottom:20px">
      <h3 style="margin-bottom:12px">${ev.title}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:var(--font-size-sm);margin-bottom:16px">
        <div><span style="color:var(--text-muted)">Ngày diễn ra:</span> <strong>${formatDate(ev.date)}</strong></div>
        <div><span style="color:var(--text-muted)">Địa điểm:</span> ${ev.location}</div>
        <div><span style="color:var(--text-muted)">Trạng thái:</span> ${getStatusBadge(ev.status)}</div>
        <div><span style="color:var(--text-muted)">Đơn hàng:</span> ${order?.id || '---'}</div>
        ${ev.contractId ? `<div style="grid-column:span 2"><span style="color:var(--text-muted)">Hợp đồng:</span> <strong style="color:var(--accent-blue-light)">${store.get('contracts').find(c=>c.id===ev.contractId)?.ctrNo || ev.contractId}</strong> — ${store.get('contracts').find(c=>c.id===ev.contractId)?.aName || ''}</div>` : ''}
      </div>
    </div>

    <div style="border-top:1px solid var(--border-color);padding-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h4 style="margin:0;color:var(--accent-amber)">🔧 Vật tư mang đi Sự kiện</h4>
        ${canEditMaterials ? `<button class="btn btn-secondary" id="btn-add-material" style="padding:6px 14px;font-size:13px">${ICONS.plus} Thêm vật tư</button>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:var(--bg-tertiary)">
            <th style="padding:8px 12px;text-align:left;color:var(--text-muted);font-size:11px;text-transform:uppercase">Tên vật tư / thiết bị</th>
            <th style="padding:8px 12px;text-align:center;color:var(--text-muted);font-size:11px;text-transform:uppercase">SL mang đi</th>
            <th style="padding:8px 12px;text-align:center;color:var(--text-muted);font-size:11px;text-transform:uppercase">ĐVT</th>
            <th style="padding:8px 12px;text-align:center;color:var(--text-muted);font-size:11px;text-transform:uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody id="mat-tbody">
          ${renderMaterialRows(ev.materials || [])}
        </tbody>
      </table>
    </div>
  `, { size: 'lg', footer: '<button class="btn btn-secondary" id="btn-close-ev-modal">Đóng</button>' });

  modal.overlay.querySelector('#btn-close-ev-modal')?.addEventListener('click', () => modal.close());

  // ── Thêm vật tư ──
  modal.overlay.querySelector('#btn-add-material')?.addEventListener('click', () => {
    // Lấy danh sách tài sản mới nhất
    const allAssets = store.get('assets');
    const evFresh   = store.getById('events', ev.id);
    const evMats    = evFresh?.materials || [];

    // Tính available cho từng asset
    const allEvents = store.get('events');
    const activeStatuses = ['pending', 'approved', 'setup', 'running', 'active'];
    const deployedMap = {};
    allEvents.filter(e => e.id !== ev.id && (activeStatuses.includes(e.status) || !e.status))
      .forEach(e => (e.materials || []).forEach(m => {
        deployedMap[m.assetId] = (deployedMap[m.assetId] || 0) + (m.qty || 0);
      }));
    // Trừ luôn qty đang có trong sự kiện này (để biết available nếu không tính event hiện tại)
    evMats.forEach(m => { deployedMap[m.assetId] = (deployedMap[m.assetId] || 0); });

    const availableAssets = allAssets.map(a => ({
      ...a,
      available: (a.quantity || 0) - (deployedMap[a.id] || 0) - (evMats.find(m => m.assetId === a.id)?.qty || 0)
    }));

    const addModal = showModal('Chọn vật tư / thiết bị', `
      <div class="form-group">
        <label class="form-label">Vật tư / Thiết bị</label>
        <select id="sel-asset" class="form-select">
          <option value="">-- Chọn --</option>
          ${availableAssets.map(a => `
            <option value="${a.id}" data-unit="${a.unit}" data-avail="${a.available}">
              ${a.name} (${a.type === 'material' ? 'Vật tư' : 'Thiết bị'}) — Còn: ${a.available} ${a.unit}
            </option>
          `).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-top:12px">
        <label class="form-label">Số lượng mang đi</label>
        <input type="number" id="mat-qty" class="form-input" value="1" min="1" />
        <p id="avail-hint" style="font-size:12px;color:var(--text-muted);margin-top:4px"></p>
      </div>
    `, {
      footer: `
        <button class="btn btn-secondary" id="btn-cancel-mat">Hủy</button>
        <button class="btn btn-primary" id="btn-confirm-mat">Thêm vào Sự kiện</button>
      `
    });

    addModal.overlay.querySelector('#btn-cancel-mat')?.addEventListener('click', () => addModal.close());

    const selEl = addModal.overlay.querySelector('#sel-asset');
    const hint  = addModal.overlay.querySelector('#avail-hint');
    selEl.addEventListener('change', () => {
      const opt = selEl.options[selEl.selectedIndex];
      const avail = opt.dataset.avail;
      hint.textContent = avail !== undefined ? `Số lượng tối đa có thể mang: ${avail} ${opt.dataset.unit}` : '';
    });

    addModal.overlay.querySelector('#btn-confirm-mat')?.addEventListener('click', async () => {
      const selOpt = selEl.options[selEl.selectedIndex];
      const assetId = selEl.value;
      if (!assetId) { showToast('Vui lòng chọn vật tư', 'error'); return; }

      const qty = parseInt(addModal.overlay.querySelector('#mat-qty').value) || 0;
      if (qty <= 0) { showToast('Số lượng phải lớn hơn 0', 'error'); return; }

      const avail = parseInt(selOpt.dataset.avail) || 0;
      if (qty > avail) { showToast(`Không đủ hàng! Kho còn ${avail} ${selOpt.dataset.unit}`, 'error'); return; }

      const assetObj = allAssets.find(a => a.id === assetId);
      const freshEv  = store.getById('events', ev.id);
      const mats     = [...(freshEv?.materials || [])];

      // Nếu đã có asset này rồi thì cộng thêm
      const existIdx = mats.findIndex(m => m.assetId === assetId);
      if (existIdx >= 0) {
        mats[existIdx] = { ...mats[existIdx], qty: mats[existIdx].qty + qty };
      } else {
        mats.push({ assetId, name: assetObj.name, qty, unit: assetObj.unit });
      }

      await store.update('events', ev.id, { materials: mats });
      ev.materials = mats; // cập nhật local để re-render modal
      showToast(`Đã thêm ${qty} ${assetObj.unit} ${assetObj.name}`, 'success');
      addModal.close();

      // Refresh tbody trong modal chi tiết
      const tbody = modal.overlay.querySelector('#mat-tbody');
      if (tbody) tbody.innerHTML = renderMaterialRows(mats);
      bindRemoveButtons(mats);
    });
  });

  const bindRemoveButtons = (mats) => {
    modal.overlay.querySelectorAll('.btn-rm-mat').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx  = parseInt(btn.dataset.idx);
        const freshEv = store.getById('events', ev.id);
        const newMats = [...(freshEv?.materials || [])];
        const removed = newMats.splice(idx, 1)[0];
        await store.update('events', ev.id, { materials: newMats });
        ev.materials = newMats;
        showToast(`Đã bỏ ${removed?.name} khỏi sự kiện`, 'info');
        const tbody = modal.overlay.querySelector('#mat-tbody');
        if (tbody) tbody.innerHTML = renderMaterialRows(newMats);
        bindRemoveButtons(newMats);
      });
    });
  };

  bindRemoveButtons(ev.materials || []);
}
