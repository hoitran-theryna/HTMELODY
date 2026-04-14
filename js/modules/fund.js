// ============================================
// ERP SYSTEM - FUND & BANK MODULE (Sổ Quỹ)
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { formatFullCurrency, formatDate } from '../utils.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { paginate, paginationHTML, bindPagination } from '../components/pagination.js';

export default function renderFund(container) {
  const perm = auth.getPermission('fund');

  // Huỷ subscription cũ nếu có (tránh listener chồng chất khi re-render)
  if (container._fundUnsub) container._fundUnsub();

  let page = 1;

  const render = () => {
    const funds = store.get('funds');

    // Tách giao dịch theo tài khoản
    const bankIn  = funds.filter(f => f.account === 'bank' && f.type === 'in').reduce((s, f) => s + (f.amount || 0), 0);
    const bankOut = funds.filter(f => f.account === 'bank' && f.type === 'out').reduce((s, f) => s + (f.amount || 0), 0);
    const cashIn  = funds.filter(f => f.account === 'cash' && f.type === 'in').reduce((s, f) => s + (f.amount || 0), 0);
    const cashOut = funds.filter(f => f.account === 'cash' && f.type === 'out').reduce((s, f) => s + (f.amount || 0), 0);

    // Tìm số dư đầu kỳ (loại entry đặc biệt "opening")
    const bankOpening = funds.filter(f => f.account === 'bank' && f.category === 'Số dư đầu kỳ').reduce((s, f) => s + (f.type === 'in' ? f.amount : -f.amount), 0);
    const cashOpening = funds.filter(f => f.account === 'cash' && f.category === 'Số dư đầu kỳ').reduce((s, f) => s + (f.type === 'in' ? f.amount : -f.amount), 0);

    const bankBalance = bankOpening + bankIn - bankOut;
    const cashBalance = cashOpening + cashIn - cashOut;
    const totalBalance = bankBalance + cashBalance;

    // Thống kê kỳ này (tháng hiện tại)
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthIn  = funds.filter(f => f.type === 'in'  && (f.date || '').startsWith(thisMonth) && f.category !== 'Số dư đầu kỳ').reduce((s, f) => s + (f.amount || 0), 0);
    const monthOut = funds.filter(f => f.type === 'out' && (f.date || '').startsWith(thisMonth)).reduce((s, f) => s + (f.amount || 0), 0);

    const currentFilter = { acc: container._fundAccFilter || '', type: container._fundTypeFilter || '' };

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Sổ Quỹ & Giao dịch</h1>
          <p>Dòng tiền vào/ra theo thời gian thực từ đơn hàng, công nợ và phiếu thủ công</p>
        </div>
        <div class="page-header-right">
          ${perm === 'full' ? `
            <button class="btn btn-secondary" id="btn-opening-balance">${ICONS.wallet} Nhập số dư đầu kỳ</button>
            <button class="btn btn-primary" id="btn-add-fund">${ICONS.plus} Lập phiếu Thu/Chi</button>
          ` : ''}
        </div>
      </div>

      <div class="stats-grid stagger-children">
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-primary)">${ICONS.wallet}</div></div>
          <div class="stat-card-value" style="color:${totalBalance >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}">${formatFullCurrency(totalBalance)}</div>
          <div class="stat-card-label">TỔNG QUỸ HIỆN TẠI</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-info)">${ICONS.dashboard}</div></div>
          <div class="stat-card-value" style="color:var(--accent-blue)">${formatFullCurrency(bankBalance)}</div>
          <div class="stat-card-label">Số dư Ngân Hàng</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-warning)">${ICONS.money}</div></div>
          <div class="stat-card-value" style="color:var(--accent-amber)">${formatFullCurrency(cashBalance)}</div>
          <div class="stat-card-label">Tiền mặt tại Xưởng</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-success)">${ICONS['trending-up']}</div></div>
          <div class="stat-card-value" style="font-size:14px">
            <span style="color:var(--accent-emerald)">+${formatFullCurrency(monthIn)}</span>
            <span style="color:var(--text-muted);font-size:11px;display:block">Chi: -${formatFullCurrency(monthOut)}</span>
          </div>
          <div class="stat-card-label">Tháng này</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Lịch sử Giao dịch</h3>
          <div style="display:flex;gap:8px">
            <select class="form-select" id="fund-account-filter">
              <option value="" ${currentFilter.acc===''?'selected':''}>Tất cả Quỹ</option>
              <option value="bank" ${currentFilter.acc==='bank'?'selected':''}>Ngân hàng</option>
              <option value="cash" ${currentFilter.acc==='cash'?'selected':''}>Tiền mặt</option>
            </select>
            <select class="form-select" id="fund-type-filter">
              <option value="" ${currentFilter.type===''?'selected':''}>Tất cả</option>
              <option value="in" ${currentFilter.type==='in'?'selected':''}>Thu tiền (+)</option>
              <option value="out" ${currentFilter.type==='out'?'selected':''}>Chi tiền (-)</option>
            </select>
          </div>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Mã GD</th>
                <th>Tài khoản</th>
                <th>Danh mục</th>
                <th>Nội dung</th>
                <th style="color:var(--accent-emerald)">Thu vào (+)</th>
                <th style="color:var(--accent-rose)">Chi ra (-)</th>
                <th>Chứng từ</th>
              </tr>
            </thead>
            <tbody id="fund-table-body"></tbody>
          </table>
        </div>
        <div id="fund-pag"></div>
      </div>
    `;

    const renderTable = (accFilter, typeFilter, newPage = 1) => {
      page = newPage;
      const tbody = document.getElementById('fund-table-body');
      if (!tbody) return;

      let data = [...store.get('funds')].sort((a, b) => new Date(b.date) - new Date(a.date));
      if (accFilter) data = data.filter(f => f.account === accFilter);
      if (typeFilter) data = data.filter(f => f.type === typeFilter);

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted)">Chưa có giao dịch nào.</td></tr>`;
        const pag = container.querySelector('#fund-pag');
        if (pag) pag.innerHTML = '';
        return;
      }

      const { items, total, pages } = paginate(data, page);

      tbody.innerHTML = items.map(f => {
        const isBank = f.account === 'bank';
        const isIn   = f.type === 'in';
        const isOpening = f.category === 'Số dư đầu kỳ';
        return `<tr style="${isOpening ? 'opacity:0.6;font-style:italic' : ''}">
          <td>${formatDate(f.date)}</td>
          <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${f.id}</td>
          <td><span class="badge ${isBank ? 'badge-blue' : 'badge-amber'}">${isBank ? 'Ngân hàng' : 'Tiền mặt'}</span></td>
          <td><span style="font-size:12px;color:var(--text-secondary)">${f.category || '---'}</span></td>
          <td style="font-weight:500;max-width:280px;font-size:13px">${f.description}</td>
          <td style="font-variant-numeric:tabular-nums;color:var(--accent-emerald);font-weight:600">
            ${isIn ? '+' + formatFullCurrency(f.amount) : ''}
          </td>
          <td style="font-variant-numeric:tabular-nums;color:var(--accent-rose)">
            ${!isIn ? '−' + formatFullCurrency(f.amount) : ''}
          </td>
          <td style="font-size:11px;color:var(--accent-blue)">${f.refId || '---'}</td>
        </tr>`;
      }).join('');

      const pag = container.querySelector('#fund-pag');
      if (pag) {
        pag.innerHTML = paginationHTML(page, pages, total);
        bindPagination(pag, p => renderTable(accFilter, typeFilter, p));
      }
    };

    renderTable(currentFilter.acc, currentFilter.type);

    // Lưu filter state để giữ khi re-render
    container.querySelector('#fund-account-filter')?.addEventListener('change', e => {
      container._fundAccFilter = e.target.value;
      renderTable(e.target.value, container._fundTypeFilter || '', 1);
    });
    container.querySelector('#fund-type-filter')?.addEventListener('change', e => {
      container._fundTypeFilter = e.target.value;
      renderTable(container._fundAccFilter || '', e.target.value, 1);
    });

    // Nút nhập số dư đầu kỳ
    container.querySelector('#btn-opening-balance')?.addEventListener('click', () => {
      const modal = showModal('Nhập Số dư Đầu kỳ', `
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Dùng để thiết lập số tiền ban đầu trước khi bắt đầu theo dõi trên hệ thống.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Tài khoản</label>
            <select id="ob-acc" class="form-select">
              <option value="bank">Ngân hàng</option>
              <option value="cash">Tiền mặt</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ngày áp dụng</label>
            <input type="date" id="ob-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Số dư đầu kỳ (VNĐ)</label>
            <input type="number" id="ob-amount" class="form-input" placeholder="0" />
          </div>
        </div>
      `, { footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Hủy</button><button class="btn btn-primary" id="btn-save-ob">Lưu số dư</button>' });

      modal.overlay.querySelector('#btn-save-ob').addEventListener('click', async () => {
        const amt = parseInt(modal.overlay.querySelector('#ob-amount').value) || 0;
        if (amt <= 0) { showToast('Vui lòng nhập số tiền hợp lệ', 'error'); return; }
        await store.add('funds', {
          id: store.generateId('FD', 'funds'),
          date: modal.overlay.querySelector('#ob-date').value,
          account: modal.overlay.querySelector('#ob-acc').value,
          type: 'in',
          amount: amt,
          category: 'Số dư đầu kỳ',
          description: 'Số dư đầu kỳ thiết lập ban đầu',
          refId: ''
        });
        modal.close();
      });
    });

    // Nút lập phiếu thu/chi
    container.querySelector('#btn-add-fund')?.addEventListener('click', () => {
      const today = new Date().toISOString().split('T')[0];
      const modal = showModal('Lập phiếu Thu / Chi', `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">Loại phiếu</label>
            <select id="form-fund-type" class="form-select">
              <option value="in">Phiếu Thu (Tiền vào +)</option>
              <option value="out">Phiếu Chi (Tiền ra −)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tài khoản</label>
            <select id="form-fund-acc" class="form-select">
              <option value="bank">Ngân hàng công ty</option>
              <option value="cash">Tiền mặt quỹ xưởng</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ngày giao dịch</label>
            <input type="date" id="form-fund-date" class="form-input" value="${today}" />
          </div>
          <div class="form-group">
            <label class="form-label">Số tiền (VNĐ)</label>
            <input type="number" id="form-fund-amount" class="form-input" placeholder="0" />
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Danh mục</label>
            <select id="form-fund-cat" class="form-select">
              <option value="Thu công nợ khách hàng">Thu công nợ khách hàng</option>
              <option value="Tiền cọc Đơn hàng">Tiền cọc Đơn hàng</option>
              <option value="Chi lương nhân viên">Chi lương nhân viên</option>
              <option value="Chi mua vật tư">Chi mua vật tư</option>
              <option value="Chi phí vận chuyển">Chi phí vận chuyển</option>
              <option value="Chi phí điện nước">Chi phí điện nước</option>
              <option value="Chi phí thuê mặt bằng">Chi phí thuê mặt bằng</option>
              <option value="Thu nhập khác">Thu nhập khác</option>
              <option value="Chi phí khác">Chi phí khác</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Diễn giải chi tiết</label>
            <input type="text" id="form-fund-desc" class="form-input" placeholder="Mô tả cụ thể giao dịch..." />
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Mã chứng từ gốc (nếu có)</label>
            <input type="text" id="form-fund-ref" class="form-input" placeholder="VD: OD-01, DB-03..." />
          </div>
        </div>
      `, { footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Hủy</button><button class="btn btn-primary" id="btn-save-fund">Lưu phiếu</button>' });

      modal.overlay.querySelector('#btn-save-fund').addEventListener('click', async () => {
        const amt  = parseInt(modal.overlay.querySelector('#form-fund-amount').value) || 0;
        const desc = modal.overlay.querySelector('#form-fund-desc').value.trim();
        if (amt <= 0)  { showToast('Vui lòng nhập số tiền hợp lệ', 'error'); return; }
        if (!desc)     { showToast('Vui lòng nhập diễn giải', 'error'); return; }

        const saveBtn = modal.overlay.querySelector('#btn-save-fund');
        saveBtn.disabled = true;

        await store.add('funds', {
          id: store.generateId('FD', 'funds'),
          date: modal.overlay.querySelector('#form-fund-date').value,
          type: modal.overlay.querySelector('#form-fund-type').value,
          account: modal.overlay.querySelector('#form-fund-acc').value,
          amount: amt,
          category: modal.overlay.querySelector('#form-fund-cat').value,
          description: desc,
          refId: modal.overlay.querySelector('#form-fund-ref').value.trim()
        });
        modal.close();
      });
    });
  };

  // Auto-refresh khi có giao dịch mới từ bất kỳ module nào (debts, orders,...)
  container._fundUnsub = store.on('funds', () => {
    if (document.contains(container)) render();
  });

  render();
}

