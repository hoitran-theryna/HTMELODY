// ============================================
// ERP SYSTEM - FUND & BANK MODULE (Sổ Quỹ)
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { formatFullCurrency, formatDate } from '../utils.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export default function renderFund(container) {
  const funds = store.get('funds');
  const perm = auth.getPermission('fund');

  // Tính số dư (Tổng Thu - Tổng Chi) cho Bank & Cash
  const bankIn = funds.filter(f => f.account === 'bank' && f.type === 'in').reduce((s, f) => s + f.amount, 0);
  const bankOut = funds.filter(f => f.account === 'bank' && f.type === 'out').reduce((s, f) => s + f.amount, 0);
  const bankBalance = bankIn - bankOut + 150000000; // Số dư đầu kỳ giả định 150tr

  const cashIn = funds.filter(f => f.account === 'cash' && f.type === 'in').reduce((s, f) => s + f.amount, 0);
  const cashOut = funds.filter(f => f.account === 'cash' && f.type === 'out').reduce((s, f) => s + f.amount, 0);
  const cashBalance = cashIn - cashOut + 25000000; // Số dư tiền mặt đầu kỳ 25tr

  const totalBalance = bankBalance + cashBalance;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Sổ Quỹ & Giao dịch</h1>
        <p>Quản lý dòng tiền vào/ra của Tài khoản Kế toán và Tiền mặt Xưởng</p>
      </div>
      <div class="page-header-right">
        ${perm === 'full' ? `
          <button class="btn btn-secondary" id="btn-transfer">${ICONS.tool} Chuyển quỹ nội bộ</button>
          <button class="btn btn-primary" id="btn-add-fund">${ICONS.plus} Lập phiếu Thu/Chi</button>
        ` : ''}
      </div>
    </div>

    <div class="stats-grid stagger-children">
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-primary)">${ICONS.wallet}</div></div>
        <div class="stat-card-value">${formatFullCurrency(totalBalance)}</div>
        <div class="stat-card-label">TỔNG QUỸ HIỆN TẠI</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-info)">${ICONS.dashboard}</div></div>
        <div class="stat-card-value" style="color:var(--accent-blue-light)">${formatFullCurrency(bankBalance)}</div>
        <div class="stat-card-label">Quỹ Ngân Hàng</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-warning)">${ICONS.money}</div></div>
        <div class="stat-card-value" style="color:var(--accent-emerald)">${formatFullCurrency(cashBalance)}</div>
        <div class="stat-card-label">Tiền mặt tại Xưởng</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Lịch sử Giao dịch (Sổ chi tiết)</h3>
        <div style="display:flex;gap:8px">
          <select class="form-select" id="fund-account-filter">
            <option value="">Tất cả Quỹ</option>
            <option value="bank">Ngân hàng</option>
            <option value="cash">Tiền mặt</option>
          </select>
          <select class="form-select" id="fund-type-filter">
            <option value="">Tất cả</option>
            <option value="in">Thu tiền (+)</option>
            <option value="out">Chi tiền (-)</option>
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
              <th>Phân loại</th>
              <th>Nội dung</th>
              <th>Thu vào</th>
              <th>Chi ra</th>
              <th>Chứng từ gốc</th>
            </tr>
          </thead>
          <tbody id="fund-table-body"></tbody>
        </table>
      </div>
    </div>
  `;

  function renderTable(accFilter='', typeFilter='') {
    let data = [...funds].sort((a,b) => new Date(b.date) - new Date(a.date));
    if (accFilter) data = data.filter(f => f.account === accFilter);
    if (typeFilter) data = data.filter(f => f.type === typeFilter);

    document.getElementById('fund-table-body').innerHTML = data.map(f => {
      const isBank = f.account === 'bank';
      const isIn = f.type === 'in';
      return `<tr>
        <td>${formatDate(f.date)}</td>
        <td style="font-family:var(--font-mono);font-size:var(--font-size-xs);color:var(--text-muted)">${f.id}</td>
        <td><span class="badge ${isBank ? 'badge-blue' : 'badge-amber'}">${isBank ? 'Ngân hàng' : 'Tiền mặt'}</span></td>
        <td><span class="tag">${f.category}</span></td>
        <td style="font-weight:500;max-width:250px">${f.description}</td>
        <td style="font-variant-numeric:tabular-nums;color:var(--accent-emerald);font-weight:600">
          ${isIn ? '+' + formatFullCurrency(f.amount) : ''}
        </td>
        <td style="font-variant-numeric:tabular-nums;color:var(--accent-rose)">
          ${!isIn ? '-' + formatFullCurrency(f.amount) : ''}
        </td>
        <td style="font-size:var(--font-size-xs)"><a href="#">${f.refId || '---'}</a></td>
      </tr>`;
    }).join('');
  }
  
  renderTable();

  // Filters
  document.getElementById('fund-account-filter')?.addEventListener('change', e => {
    renderTable(e.target.value, document.getElementById('fund-type-filter').value);
  });
  document.getElementById('fund-type-filter')?.addEventListener('change', e => {
    renderTable(document.getElementById('fund-account-filter').value, e.target.value);
  });

  // Phiếu thu chi
  document.getElementById('btn-add-fund')?.addEventListener('click', () => {
    const modal = showModal('Lập phiếu Thu / Chi mới', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="form-group">
          <label class="form-label">Loại phiếu</label>
          <select id="form-fund-type" class="form-select">
            <option value="in">Phiếu Thu (Tiền vào)</option>
            <option value="out">Phiếu Chi (Tiền ra)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tài khoản</label>
          <select id="form-fund-acc" class="form-select">
            <option value="bank">Ngân hàng công ty</option>
            <option value="cash">Tiền mặt quỹ xưởng</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Số tiền (VNĐ)</label>
        <input type="number" id="form-fund-amount" class="form-input" placeholder="0" />
      </div>
      <div class="form-group">
        <label class="form-label">Danh mục chi tiêu/thu nhập</label>
        <input type="text" id="form-fund-cat" class="form-input" placeholder="VD: Tiền cơm công đoàn, cọc vật tư..." />
      </div>
      <div class="form-group">
        <label class="form-label">Diễn giải</label>
        <textarea id="form-fund-desc" class="form-textarea" placeholder="Nhập mô tả cụ thể..."></textarea>
      </div>
    `, { footer: '<button class="btn btn-secondary" onclick="document.querySelector(\'.modal-overlay\').remove()">Hủy</button><button class="btn btn-primary" id="btn-save-fund">Lưu phiếu</button>' });

    modal.overlay.querySelector('#btn-save-fund').addEventListener('click', () => {
      const amt = parseInt(modal.overlay.querySelector('#form-fund-amount').value);
      const cat = modal.overlay.querySelector('#form-fund-cat').value.trim();
      const desc = modal.overlay.querySelector('#form-fund-desc').value.trim();
      
      if (!amt || !cat || !desc) { showToast('Vui lòng điền đủ thông tin', 'warning'); return; }

      store.add('funds', {
        id: store.generateId('FD'),
        date: new Date().toISOString().split('T')[0],
        type: modal.overlay.querySelector('#form-fund-type').value,
        account: modal.overlay.querySelector('#form-fund-acc').value,
        amount: amt,
        category: cat,
        description: desc,
        refId: '' // manual entry
      });
      showToast('Đã ghi nhận phiếu Thu/Chi', 'success');
      modal.close();
      renderFund(container);
    });
  });
}
