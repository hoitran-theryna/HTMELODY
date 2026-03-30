// ============================================
// ERP SYSTEM - REPORTS MODULE (Financial & Ops)
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { formatCurrency, formatFullCurrency } from '../utils.js';

export default function renderReports(container) {
  const perm = auth.getPermission('reports');
  if (perm === 'none') {
    container.innerHTML = `<div class="empty-state"><h3>Không có quyền truy cập</h3></div>`;
    return;
  }

  // ── Helpers ──
  const toMonthStr = d => d?.slice(0, 7) || '';
  const formatMonthLabel = m => {
    const [y, mo] = m.split('-');
    return `Tháng ${mo}/${y}`;
  };

  const getMonthOptions = () => {
    const funds = store.get('funds');
    const debts = store.get('debts');
    const orders = store.get('orders');
    const months = new Set();
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
    funds.forEach(f => { if (f.date?.length >= 7) months.add(toMonthStr(f.date)); });
    debts.forEach(d => { if (d.saleDate?.length >= 7) months.add(toMonthStr(d.saleDate)); });
    orders.forEach(o => { if (o.createdAt?.length >= 7) months.add(toMonthStr(o.createdAt)); });
    return [...months].filter(Boolean).sort().reverse();
  };

  const monthOptions = getMonthOptions();
  let selectedMonth = monthOptions[0] || new Date().toISOString().slice(0, 7);

  // ── Tính toán theo tháng ──
  const calc = (month) => {
    const debts     = store.get('debts');
    const funds     = store.get('funds');
    const employees = store.get('employees');

    const mDebts   = debts.filter(d => toMonthStr(d.saleDate) === month);
    const mOutFunds = funds.filter(f => f.type === 'out' && toMonthStr(f.date) === month);

    const revenueNeon  = mDebts.filter(d => d.type === 'receivable' && d.branch !== 'event').reduce((s,d) => s + (d.paidAmount||0), 0);
    const revenueEvent = mDebts.filter(d => d.type === 'receivable' && d.branch === 'event').reduce((s,d) => s + (d.paidAmount||0), 0);
    const totalRevenue = revenueNeon + revenueEvent;

    const pctNeon  = totalRevenue ? Math.round(revenueNeon  / totalRevenue * 100) : 0;
    const pctEvent = totalRevenue ? Math.round(revenueEvent / totalRevenue * 100) : 0;

    const materialCost = mOutFunds
      .filter(f => /vật tư|nguyên liệu|mua hàng/i.test(f.category||''))
      .reduce((s,f) => s + (f.amount||0), 0);
    const payrollCost = employees
      .filter(e => e.status !== 'inactive')
      .reduce((s,e) => s + (e.salary||0), 0);
    const otherOpsCost = mOutFunds
      .filter(f => !/vật tư|nguyên liệu|mua hàng|lương|phụ cấp/i.test(f.category||''))
      .reduce((s,f) => s + (f.amount||0), 0);

    const totalExpense = materialCost + payrollCost + otherOpsCost;
    const netProfit    = totalRevenue - totalExpense;

    return { revenueNeon, revenueEvent, totalRevenue, pctNeon, pctEvent, materialCost, payrollCost, otherOpsCost, totalExpense, netProfit };
  };

  const render = () => {
    const { revenueNeon, revenueEvent, totalRevenue, pctNeon, pctEvent,
            materialCost, payrollCost, otherOpsCost, totalExpense, netProfit } = calc(selectedMonth);
    const label = formatMonthLabel(selectedMonth);
    const debts = store.get('debts');

    container.innerHTML = `
      <div class="page-header" id="report-header-section">
        <div class="page-header-left">
          <h1>Báo cáo Hoạt động Kinh doanh</h1>
          <p>${label}</p>
        </div>
        <div class="page-header-right">
          <select class="form-select" id="report-month-select" style="max-width:160px">
            ${monthOptions.map(m => `<option value="${m}" ${m === selectedMonth ? 'selected' : ''}>${formatMonthLabel(m)}</option>`).join('')}
          </select>
          <button class="btn btn-primary" id="btn-print-report" style="background:#dc2626;border-color:#dc2626">${ICONS.report} Xuất PDF</button>
        </div>
      </div>

      <div id="print-area">
        <div class="print-only" style="text-align:center;margin-bottom:30px;display:none">
          <h2 style="font-size:24px;margin-bottom:8px;color:#000">KẾT QUẢ HOẠT ĐỘNG KINH DOANH</h2>
          <p style="font-size:14px;color:#333">Kỳ báo cáo: ${label}</p>
          <p style="font-size:14px;color:#333">Công ty TNHH HT Melody</p>
        </div>

        <div class="stats-grid stagger-children" style="grid-template-columns:1fr 1fr;margin-bottom:24px">
          <div class="stat-card" style="border-left:4px solid var(--accent-emerald)">
            <div class="stat-card-value" style="color:var(--accent-emerald)">${formatFullCurrency(totalRevenue)}</div>
            <div class="stat-card-label">TỔNG DOANH THU ${label.toUpperCase()}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:8px">LED: ${pctNeon}% — Sự kiện: ${pctEvent}%</div>
          </div>
          <div class="stat-card" style="border-left:4px solid ${netProfit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}">
            <div class="stat-card-value" style="color:${netProfit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}">${formatFullCurrency(netProfit)}</div>
            <div class="stat-card-label">LỢI NHUẬN RÒNG (TRƯỚC THUẾ)</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:8px">Tổng chi phí: ${formatCurrency(totalExpense)}</div>
          </div>
        </div>

        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><h3>Bảng Cân đối Doanh thu — ${label}</h3></div>
          <div class="card-body" style="padding:0">
            <table style="width:100%;text-align:left;border-collapse:collapse;font-size:14px">
              <thead style="background:#1e293b">
                <tr>
                  <th style="padding:12px 16px;border-bottom:1px solid #334155">Chỉ tiêu</th>
                  <th style="padding:12px 16px;border-bottom:1px solid #334155;text-align:right">Thành tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style="padding:12px 16px;border-bottom:1px solid #334155;font-weight:600">I. DOANH THU HOẠT ĐỘNG</td><td style="padding:12px 16px;text-align:right;border-bottom:1px solid #334155;font-weight:600">${formatFullCurrency(totalRevenue)}</td></tr>
                <tr><td style="padding:12px 16px;padding-left:32px;border-bottom:1px dashed #334155">1. Doanh thu HĐ Gia công LED Neon</td><td style="padding:12px 16px;text-align:right;border-bottom:1px dashed #334155">${formatFullCurrency(revenueNeon)}</td></tr>
                <tr><td style="padding:12px 16px;padding-left:32px;border-bottom:1px solid #334155">2. Doanh thu HĐ Sự kiện & Thiết bị</td><td style="padding:12px 16px;text-align:right;border-bottom:1px solid #334155">${formatFullCurrency(revenueEvent)}</td></tr>

                <tr><td style="padding:12px 16px;border-bottom:1px solid #334155;font-weight:600">II. TỔNG CHI PHÍ HOẠT ĐỘNG (Ước tính)</td><td style="padding:12px 16px;text-align:right;border-bottom:1px solid #334155;font-weight:600;color:var(--accent-rose)">(${formatFullCurrency(totalExpense)})</td></tr>
                <tr><td style="padding:12px 16px;padding-left:32px;border-bottom:1px dashed #334155">1. Chi phí mua vật tư & thiết bị (Chi quỹ tháng)</td><td style="padding:12px 16px;text-align:right;border-bottom:1px dashed #334155">(${formatFullCurrency(materialCost)})</td></tr>
                <tr><td style="padding:12px 16px;padding-left:32px;border-bottom:1px dashed #334155">2. Chi phí nhân sự (Lương cố định)</td><td style="padding:12px 16px;text-align:right;border-bottom:1px dashed #334155">(${formatFullCurrency(payrollCost)})</td></tr>
                <tr><td style="padding:12px 16px;padding-left:32px;border-bottom:1px solid #334155">3. Chi phí vận hành, khác (Chi quỹ còn lại)</td><td style="padding:12px 16px;text-align:right;border-bottom:1px solid #334155">(${formatFullCurrency(otherOpsCost)})</td></tr>

                <tr style="background:#0f172a"><td style="padding:16px;font-weight:700;font-size:16px;color:var(--accent-blue-light)">LỢI NHUẬN TRƯỚC THUẾ (I-II)</td><td style="padding:16px;text-align:right;font-weight:700;font-size:16px;color:${netProfit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}">${formatFullCurrency(netProfit)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Tổng hợp Công nợ (Toàn bộ)</h3></div>
          <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
            <div>
              <h4 style="color:var(--text-muted);margin-bottom:12px;font-size:13px">Phải Thu (Tiền chờ lấy)</h4>
              <div style="font-size:24px;font-weight:700;color:var(--accent-emerald);margin-bottom:8px">${formatFullCurrency(debts.filter(d=>d.type==='receivable').reduce((s,d)=>s+((d.totalAmount||0)+(d.shippingFee||0)-(d.paidAmount||0)),0))}</div>
              <p style="font-size:12px;color:var(--text-muted)">Từ ${debts.filter(d=>d.type==='receivable'&&d.status!=='paid').length} khách hàng chưa trả đủ.</p>
            </div>
            <div>
              <h4 style="color:var(--text-muted);margin-bottom:12px;font-size:13px">Phải Trả (Nhà cung cấp)</h4>
              <div style="font-size:24px;font-weight:700;color:var(--accent-rose);margin-bottom:8px">${formatFullCurrency(debts.filter(d=>d.type==='payable').reduce((s,d)=>s+((d.totalAmount||0)-(d.paidAmount||0)),0))}</div>
              <p style="font-size:12px;color:var(--text-muted)">Cho ${debts.filter(d=>d.type==='payable'&&d.status!=='paid').length} nhà cung cấp.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#report-month-select').addEventListener('change', e => {
      selectedMonth = e.target.value;
      render();
    });

    container.querySelector('#btn-print-report').addEventListener('click', () => {
      const backupTitle = document.title;
      const style = document.createElement('style');
      style.innerHTML = `@media print {
        body { background:white!important;color:black!important;-webkit-print-color-adjust:exact;print-color-adjust:exact; }
        .sidebar,.header,#report-header-section { display:none!important; }
        .main-wrapper { margin:0!important;padding:0!important; }
        .card,.stat-card { border:1px solid #e2e8f0!important;box-shadow:none!important;background:white!important; }
        .stat-card-value,.stat-card-label,thead th,tbody td { color:black!important; }
        .print-only { display:block!important; }
      }`;
      document.head.appendChild(style);
      document.title = `BaoCao_KinhDoanh_${selectedMonth.replace('-','_')}.pdf`;
      window.print();
      setTimeout(() => { document.head.removeChild(style); document.title = backupTitle; }, 100);
    });
  };

  render();
}
