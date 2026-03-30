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

  const orders = store.get('orders');
  const debts = store.get('debts');
  const funds = store.get('funds');
  const taxes = store.get('taxes');

  // Tính Doanh Thu
  const revenueNeon = orders.filter(o => o.type === 'neon').reduce((s,o)=>s+(o.price||0), 0);
  const revenueEvent = orders.filter(o => o.type === 'event').reduce((s,o)=>s+(o.price||0), 0);
  const totalRevenue = revenueNeon + revenueEvent;

  // Tính tỷ trọng
  const pctNeon = totalRevenue ? Math.round((revenueNeon/totalRevenue)*100) : 0;
  const pctEvent = totalRevenue ? Math.round((revenueEvent/totalRevenue)*100) : 0;

  // Tính CP ước tính (Mock -> Lấy từ Quỹ Chi)
  const totalExpense = funds.filter(f => f.type === 'out').reduce((s,f)=>s+Math.abs(f.amount),0) + 120000000; // Fake c/p lương + fixed
  const netProfit = totalRevenue - totalExpense;

  container.innerHTML = `
    <div class="page-header" id="report-header-section">
      <div class="page-header-left">
        <h1>Báo cáo Hoạt động Kinh doanh</h1>
        <p>Tháng 03/2026</p>
      </div>
      <div class="page-header-right">
        <select class="form-select" style="max-width:150px">
          <option>Tháng 03/2026</option>
          <option>Tháng 02/2026</option>
          <option>Quý 1/2026</option>
        </select>
        <button class="btn btn-primary" id="btn-print-report" style="background:#dc2626;border-color:#dc2626">${ICONS.report} Xuất PDF Báo cáo</button>
      </div>
    </div>

    <!-- KHU VỰC IN ẨN/HIỆN THEO CSS -->
    <div id="print-area">
      <!-- Title Only For Print -->
      <div class="print-only" style="text-align:center;margin-bottom:30px;display:none">
        <h2 style="font-size:24px;margin-bottom:8px;color:#000">KẾT QUẢ HOẠT ĐỘNG KINH DOANH</h2>
        <p style="font-size:14px;color:#333">Kỳ báo cáo: Tháng 03/2026</p>
        <p style="font-size:14px;color:#333">Công ty TNHH LED Neon & Sự kiện ABC</p>
      </div>

      <div class="stats-grid stagger-children" style="grid-template-columns:1fr 1fr; margin-bottom:24px">
        <div class="stat-card" style="border-left: 4px solid var(--accent-emerald)">
          <div class="stat-card-value" style="color:var(--accent-emerald)">${formatFullCurrency(totalRevenue)}</div>
          <div class="stat-card-label">TỔNG DOANH THU</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:8px">LED: ${pctNeon}% — Sự kiện: ${pctEvent}%</div>
        </div>
        <div class="stat-card" style="border-left: 4px solid ${netProfit>=0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}">
          <div class="stat-card-value" style="color:${netProfit>=0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}">${formatFullCurrency(netProfit)}</div>
          <div class="stat-card-label">LỢI NHUẬN RÒNG (TRƯỚC THUẾ)</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:8px">Chi phí: ${formatCurrency(totalExpense)}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:24px">
        <div class="card-header">
          <h3>Bảng Cân đối Doanh thu (Phân rã)</h3>
        </div>
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
              <tr><td style="padding:12px 16px;padding-left:32px;border-bottom:1px dashed #334155">1. Chi phí mua vật tư & thiết bị (Chi quỹ)</td><td style="padding:12px 16px;text-align:right;border-bottom:1px dashed #334155">(${formatFullCurrency(funds.filter(f=>f.type==='out'&&f.category.includes('Vật tư')).reduce((s,f)=>s+f.amount,0))})</td></tr>
              <tr><td style="padding:12px 16px;padding-left:32px;border-bottom:1px dashed #334155">2. Chi phí nhân sự (Cố định + Phụ cấp)</td><td style="padding:12px 16px;text-align:right;border-bottom:1px dashed #334155">(90.000.000 đ)</td></tr>
              <tr><td style="padding:12px 16px;padding-left:32px;border-bottom:1px solid #334155">3. Chi phí vận hành, khác</td><td style="padding:12px 16px;text-align:right;border-bottom:1px solid #334155">(30.000.000 đ)</td></tr>

              <tr style="background:#0f172a"><td style="padding:16px;font-weight:700;font-size:16px;color:var(--accent-blue-light)">LỢI NHUẬN TRƯỚC THUẾ (I-II)</td><td style="padding:16px;text-align:right;font-weight:700;font-size:16px;color:var(--accent-blue-light)">${formatFullCurrency(netProfit)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
         <div class="card-header"><h3>Báo cáo Tổng hợp Công nợ & Quỹ</h3></div>
         <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
            <div>
               <h4 style="color:var(--text-muted);margin-bottom:12px;font-size:13px">Phải Thu & Cần Tồn (Tiền chờ lấy)</h4>
               <div style="font-size:24px;font-weight:700;color:var(--accent-emerald);margin-bottom:8px">${formatFullCurrency(debts.filter(d=>d.type==='receivable').reduce((s,d)=>s+(d.totalAmount-d.paidAmount),0))}</div>
               <p style="font-size:12px;color:var(--text-muted)">Tổng tài khoản phải thu từ ${debts.filter(d=>d.type==='receivable' && d.status!=='paid').length} khách hàng / đối tác.</p>
            </div>
            <div>
               <h4 style="color:var(--text-muted);margin-bottom:12px;font-size:13px">Phải Trả Ngắn Hạn (Tiền chuẩn bị rớt)</h4>
               <div style="font-size:24px;font-weight:700;color:var(--accent-rose);margin-bottom:8px">${formatFullCurrency(debts.filter(d=>d.type==='payable').reduce((s,d)=>s+(d.totalAmount-d.paidAmount),0))}</div>
               <p style="font-size:12px;color:var(--text-muted)">Tổng tiền vật liệu, thuế, thanh toán cho ${debts.filter(d=>d.type==='payable' && d.status!=='paid').length} nhà cung cấp.</p>
            </div>
         </div>
      </div>
    </div> <!-- end print area -->
  `;

  // Print Logic
  document.getElementById('btn-print-report')?.addEventListener('click', () => {
    const backupClass = document.body.className;
    const backupTitle = document.title;
    
    // Tạo 1 style tạm thời ép print mode
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .sidebar, .header, #report-header-section { display: none !important; }
        .main-wrapper { margin: 0 !important; padding: 0 !important; }
        .card, .stat-card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; background: white !important; }
        .stat-card-value { color: black !important; }
        thead th, tbody td { border-color: #cbd5e1 !important; color: black !important; }
        .print-only { display: block !important; }
        .stat-card-label { color: #475569 !important; }
      }
    `;
    document.head.appendChild(style);
    document.title = "Báo_cáo_Hoạt_động_T3_2026.pdf";
    
    // Simulate printing
    window.print();
    
    // Revert
    setTimeout(() => {
      document.head.removeChild(style);
      document.title = backupTitle;
    }, 100);
  });
}
