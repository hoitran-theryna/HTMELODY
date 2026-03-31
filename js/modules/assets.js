// ============================================
// ERP SYSTEM - ASSETS & MATERIALS MODULE
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { formatFullCurrency } from '../utils.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { paginate, paginationHTML, bindPagination } from '../components/pagination.js';

export default function renderAssets(container) {
  const perm = auth.getPermission('assets');

  if (container._assetsUnsub) container._assetsUnsub();
  if (container._eventsUnsub) container._eventsUnsub();

  let matPage = 1, eqPage = 1;

  const render = () => {
    const assets = store.get('assets');
    const events = store.get('events');

    // Tính số lượng đang mang đi sự kiện (tất cả sự kiện chưa kết thúc)
    const activeStatuses = ['pending', 'approved', 'setup', 'running', 'active'];
    const deployedMap = {}; // assetId -> tổng qty đang dùng
    events
      .filter(ev => activeStatuses.includes(ev.status) || !ev.status)
      .forEach(ev => {
        (ev.materials || []).forEach(m => {
          deployedMap[m.assetId] = (deployedMap[m.assetId] || 0) + (m.qty || 0);
        });
      });

    const materials  = assets.filter(a => a.type === 'material');
    const equipment  = assets.filter(a => a.type === 'equipment');

    const totalValue    = assets.reduce((s, a) => s + (a.quantity || 0) * (a.price || 0), 0);
    const totalDeployed = Object.values(deployedMap).reduce((s, v) => s + v, 0);
    const totalItems    = assets.length;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Tài sản & Vật tư</h1>
          <p>Quản lý tồn kho — theo dõi số lượng trong kho và đang mang đi sự kiện</p>
        </div>
        <div class="page-header-right">
          ${perm === 'full' ? `<button class="btn btn-primary" id="btn-add-asset">${ICONS.plus} Thêm Vật tư / Thiết bị</button>` : ''}
        </div>
      </div>

      <div class="stats-grid stagger-children" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-primary)">${ICONS.tool}</div></div>
          <div class="stat-card-value">${totalItems}</div>
          <div class="stat-card-label">Tổng loại vật tư / thiết bị</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-warning)">${ICONS.speaker}</div></div>
          <div class="stat-card-value" style="color:var(--accent-amber)">${totalDeployed}</div>
          <div class="stat-card-label">Đang mang đi Sự kiện</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-success)">${ICONS.wallet}</div></div>
          <div class="stat-card-value" style="font-size:18px;color:var(--accent-emerald)">${formatFullCurrency(totalValue)}</div>
          <div class="stat-card-label">Tổng giá trị tài sản</div>
        </div>
      </div>

      <!-- VẬT TƯ SẢN XUẤT LED -->
      <div class="card" style="margin-top:24px">
        <div class="card-header">
          <h3 style="color:var(--accent-violet)">Kho Vật tư Sản xuất LED</h3>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên vật tư</th>
                <th style="text-align:center">Tổng số lượng</th>
                <th style="text-align:center;color:var(--accent-amber)">Đang dùng (Sự kiện)</th>
                <th style="text-align:center;color:var(--accent-emerald)">Còn trong kho</th>
                <th>Đơn giá</th>
                <th>Trị giá tồn kho</th>
                ${perm === 'full' ? '<th style="text-align:center">Thao tác</th>' : ''}
              </tr>
            </thead>
            <tbody id="mat-tbody"></tbody>
          </table>
        </div>
        <div id="mat-pag"></div>
      </div>

      <!-- THIẾT BỊ SỰ KIỆN -->
      <div class="card" style="margin-top:24px">
        <div class="card-header">
          <h3 style="color:var(--accent-emerald)">Kho Thiết bị Sự kiện (Âm thanh / Ánh sáng)</h3>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên thiết bị</th>
                <th style="text-align:center">Tổng số lượng</th>
                <th style="text-align:center;color:var(--accent-amber)">Đang dùng (Sự kiện)</th>
                <th style="text-align:center;color:var(--accent-emerald)">Còn trong kho</th>
                <th>Đơn giá</th>
                <th>Trị giá tồn kho</th>
                ${perm === 'full' ? '<th style="text-align:center">Thao tác</th>' : ''}
              </tr>
            </thead>
            <tbody id="eq-tbody"></tbody>
          </table>
        </div>
        <div id="eq-pag"></div>
      </div>
    `;

    // ── Render row helper ──
    const assetRow = (a) => {
      const deployed = deployedMap[a.id] || 0;
      const available = (a.quantity || 0) - deployed;
      return `<tr>
        <td style="font-weight:500">${a.name}</td>
        <td style="text-align:center">${a.quantity} ${a.unit}</td>
        <td style="text-align:center">
          <span style="color:${deployed>0?'var(--accent-amber)':'var(--text-muted)'};font-weight:${deployed>0?'600':'400'}">${deployed} ${a.unit}</span>
        </td>
        <td style="text-align:center">
          <span style="color:${available<=0?'var(--accent-rose)':available<=2?'var(--accent-amber)':'var(--accent-emerald)'};font-weight:600">${available} ${a.unit}</span>
        </td>
        <td style="font-variant-numeric:tabular-nums">${formatFullCurrency(a.price)}</td>
        <td style="font-variant-numeric:tabular-nums">${formatFullCurrency((a.quantity||0)*(a.price||0))}</td>
        ${perm === 'full' ? `<td style="text-align:center">
          <button class="btn-icon btn-edit-asset" data-id="${a.id}" title="Sửa" style="color:var(--accent-blue-light);background:none;border:none;cursor:pointer;padding:4px 8px">${ICONS.edit}</button>
          <button class="btn-icon btn-del-asset" data-id="${a.id}" title="Xóa" style="color:var(--accent-rose);background:none;border:none;cursor:pointer;padding:4px 8px">${ICONS.trash}</button>
        </td>` : ''}
      </tr>`;
    };

    // ── Paginate & render each table ──
    const fillAssetTable = (tbodyId, pagId, data, getPage, setPage, emptyMsg) => {
      const tbody = container.querySelector('#' + tbodyId);
      const pagEl = container.querySelector('#' + pagId);
      if (!tbody) return;
      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${perm==='full'?7:6}" style="text-align:center;padding:2rem;color:var(--text-muted)">${emptyMsg}</td></tr>`;
        if (pagEl) pagEl.innerHTML = '';
        return;
      }
      const { items, total, pages } = paginate(data, getPage());
      tbody.innerHTML = items.map(assetRow).join('');
      if (pagEl) {
        pagEl.innerHTML = paginationHTML(getPage(), pages, total);
        bindPagination(pagEl, p => { setPage(p); fillAssetTable(tbodyId, pagId, data, getPage, setPage, emptyMsg); });
      }
    };

    fillAssetTable('mat-tbody', 'mat-pag', materials, () => matPage, p => { matPage = p; }, 'Chưa có vật tư nào.');
    fillAssetTable('eq-tbody',  'eq-pag',  equipment, () => eqPage,  p => { eqPage = p; },  'Chưa có thiết bị nào.');

    // ── Nút thêm mới ──
    container.querySelector('#btn-add-asset')?.addEventListener('click', () => openAssetModal(null, render));

    // ── Nút sửa ──
    container.querySelectorAll('.btn-edit-asset').forEach(btn => {
      btn.addEventListener('click', () => {
        const asset = store.getById('assets', btn.dataset.id);
        if (asset) openAssetModal(asset, render);
      });
    });

    // ── Nút xóa ──
    container.querySelectorAll('.btn-del-asset').forEach(btn => {
      btn.addEventListener('click', async () => {
        const asset = store.getById('assets', btn.dataset.id);
        if (!asset) return;
        if (!confirm(`Xóa "${asset.name}" khỏi kho?`)) return;
        await store.remove('assets', btn.dataset.id);
        showToast('Đã xóa vật tư', 'success');
      });
    });
  };

  // Re-render khi assets hoặc events thay đổi
  container._assetsUnsub = store.on('assets', () => { if (document.contains(container)) render(); });
  container._eventsUnsub = store.on('events', () => { if (document.contains(container)) render(); });

  render();
}

// ── MODAL THÊM / SỬA VẬT TƯ ──
function openAssetModal(asset, onSave) {
  const isEdit = !!asset;
  const modal = showModal(isEdit ? 'Chỉnh sửa Vật tư / Thiết bị' : 'Thêm Vật tư / Thiết bị mới', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">Tên vật tư / thiết bị</label>
        <input type="text" id="asset-name" class="form-input" value="${asset?.name || ''}" placeholder="VD: Loa array, Đèn moving head..." />
      </div>
      <div class="form-group">
        <label class="form-label">Loại</label>
        <select id="asset-type" class="form-select">
          <option value="material" ${asset?.type==='material'?'selected':''}>Vật tư Sản xuất LED</option>
          <option value="equipment" ${asset?.type==='equipment'?'selected':''}>Thiết bị Sự kiện</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Đơn vị tính</label>
        <input type="text" id="asset-unit" class="form-input" value="${asset?.unit || ''}" placeholder="Cái, Bộ, Cuộn, Cây..." />
      </div>
      <div class="form-group">
        <label class="form-label">Số lượng tổng</label>
        <input type="number" id="asset-qty" class="form-input" value="${asset?.quantity || 0}" min="0" />
      </div>
      <div class="form-group">
        <label class="form-label">Đơn giá (VNĐ)</label>
        <input type="number" id="asset-price" class="form-input" value="${asset?.price || 0}" min="0" />
      </div>
    </div>
  `, {
    footer: `
      <button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">Hủy</button>
      <button class="btn btn-primary" id="btn-save-asset">${isEdit ? 'Lưu thay đổi' : 'Thêm vào kho'}</button>
    `
  });

  modal.overlay.querySelector('#btn-save-asset').addEventListener('click', async () => {
    const name  = modal.overlay.querySelector('#asset-name').value.trim();
    const type  = modal.overlay.querySelector('#asset-type').value;
    const unit  = modal.overlay.querySelector('#asset-unit').value.trim();
    const qty   = parseInt(modal.overlay.querySelector('#asset-qty').value) || 0;
    const price = parseInt(modal.overlay.querySelector('#asset-price').value) || 0;

    if (!name) { showToast('Vui lòng nhập tên vật tư', 'error'); return; }
    if (!unit) { showToast('Vui lòng nhập đơn vị tính', 'error'); return; }

    if (isEdit) {
      await store.update('assets', asset.id, { name, type, unit, quantity: qty, price });
      showToast('Đã cập nhật vật tư', 'success');
    } else {
      await store.add('assets', {
        id: store.generateId('AST'),
        name, type, unit, quantity: qty, price
      });
      showToast('Đã thêm vật tư vào kho', 'success');
    }
    modal.close();
  });
}
