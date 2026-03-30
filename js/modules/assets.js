// ============================================
// ERP SYSTEM - ASSETS MODULE
// ============================================

import store from '../store.js';
import { ICONS } from '../components/icons.js';
import { formatFullCurrency, getStatusBadge } from '../utils.js';

export default function renderAssets(container) {
  const assets = store.get('assets');

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Vật tư & Thiết bị Sự kiện</h1><p>Theo dõi Tồn kho & Đồ mang đi công trình</p></div>
    </div>

    <div class="content-grid">
      <div class="col-6">
         <div class="card">
            <div class="card-header"><h3 style="color:var(--accent-violet)">Kho Vật tư Sản xuất LED</h3></div>
            <div class="data-table-wrapper">
              <table class="data-table"><thead><tr><th>Vật tư</th><th>Tồn kho</th><th>Trị giá</th></tr></thead><tbody>
              ${assets.filter(a=>a.type==='material').map(a=>`<tr><td style="font-weight:500">${a.name}</td><td>${a.quantity} ${a.unit}</td><td style="font-variant-numeric:tabular-nums">${formatFullCurrency(a.quantity * a.price)}</td></tr>`).join('')}
              </tbody></table>
            </div>
         </div>
      </div>
      <div class="col-6">
         <div class="card">
            <div class="card-header"><h3 style="color:var(--accent-emerald)">Kho Thiết bị Sự kiện (Âm thanh/Ánh sáng)</h3></div>
            <div class="data-table-wrapper">
              <table class="data-table"><thead><tr><th>Thiết bị</th><th>Sẵn sàng</th><th>Trị giá</th></tr></thead><tbody>
              ${assets.filter(a=>a.type==='equipment').map(a=>`<tr><td style="font-weight:500">${a.name}</td><td>${a.quantity} ${a.unit}</td><td style="font-variant-numeric:tabular-nums">${formatFullCurrency(a.quantity * a.price)}</td></tr>`).join('')}
              </tbody></table>
            </div>
         </div>
      </div>
    </div>
  `;
}
