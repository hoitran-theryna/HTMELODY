// ============================================
// ERP SYSTEM - DASHBOARD MODULE
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { formatCurrency, formatFullCurrency } from '../utils.js';
import { drawBarChart, drawLineChart } from '../components/chart.js';

export default function renderDashboard(container) {
  const user = auth.getUser();
  const role = auth.getRole();
  const perm = auth.getPermission('dashboard');

  let html = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Tổng quan Hệ thống</h1>
        <p>Xin chào, ${user?.name}. Bạn đang đăng nhập quyền: <strong>${auth.getRoleName()}</strong></p>
      </div>
    </div>
  `;

  // === DÀNH CHO GIÁM ĐỐC / KẾ TOÁN ===
  if (perm === 'full' || perm === 'finance') {
    const orders = store.get('orders');
    const debts = store.get('debts');
    const funds = store.get('funds');

    const inProgressOrders = orders.filter(o => ['approved', 'producing'].includes(o.status)).length;
    
    // Tính số dư Quỹ (Bank + Cash)
    const totalIn = funds.filter(f => f.type === 'in').reduce((s,f) => s + f.amount, 0);
    const totalOut = funds.filter(f => f.type === 'out').reduce((s,f) => s + f.amount, 0);
    const currentBalance = totalIn - totalOut + 175000000; // 175m fake init

    // Công nợ Phải Thu
    const totalReceivable = debts.filter(d => d.type === 'receivable').reduce((s,d) => s + (d.totalAmount - d.paidAmount), 0);
    // Phải Trả
    const totalPayable = debts.filter(d => d.type === 'payable').reduce((s,d) => s + (d.totalAmount - d.paidAmount), 0);

    html += `
      <div class="stats-grid stagger-children">
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-success)">${ICONS.wallet}</div></div>
          <div class="stat-card-value" style="color:var(--accent-emerald)">${formatCurrency(currentBalance)}</div>
          <div class="stat-card-label">TỔNG SỐ DƯ QUỸ</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-info)">${ICONS['trending-up']}</div></div>
          <div class="stat-card-value">${formatCurrency(totalReceivable)}</div>
          <div class="stat-card-label" style="color:var(--accent-blue-light);font-weight:600">PHI THU (Khách nợ)</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-danger)">${ICONS['trending-down']}</div></div>
          <div class="stat-card-value">${formatCurrency(totalPayable)}</div>
          <div class="stat-card-label" style="color:var(--accent-rose);font-weight:600">PHẢI TRẢ (Nợ NCC)</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-primary)">${ICONS['shopping-cart']}</div></div>
          <div class="stat-card-value">${inProgressOrders}</div>
          <div class="stat-card-label">Đơn hàng Đang chạy</div>
        </div>
      </div>

      <div class="content-grid" style="margin-top:var(--space-2xl)">
        <div class="col-8">
          <div class="card">
            <div class="card-header"><h3>Thống kê Doanh thu LED vs Sự kiện (6 tháng)</h3></div>
            <div class="card-body">
              <div class="chart-container"><canvas id="dash-revenue-chart"></canvas></div>
              <div style="display:flex;justify-content:center;gap:16px;margin-top:16px;font-size:12px">
                <div style="display:flex;align-items:center;gap:6px"><span style="width:12px;height:12px;background:#8b5cf6;border-radius:2px"></span> Doanh thu LED Neon</div>
                <div style="display:flex;align-items:center;gap:6px"><span style="width:12px;height:12px;background:#10b981;border-radius:2px"></span> Doanh thu Sự kiện</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-4">
          <div class="card" style="height:100%">
            <div class="card-header"><h3>Dòng tiền Gần đây</h3></div>
            <div class="card-body" style="padding:0">
              <ul style="list-style:none;padding:0;margin:0;">
                ${funds.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5).map(f => `
                  <li style="padding:16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center">
                    <div>
                      <div style="font-weight:500;font-size:var(--font-size-sm);margin-bottom:4px">${f.category}</div>
                      <div style="font-size:11px;color:var(--text-muted)">${f.account==='bank'?'Ngân hàng':'Tiền mặt'} • ${f.date}</div>
                    </div>
                    <div style="font-weight:600;font-variant-numeric:tabular-nums;color:${f.type==='in'?'var(--accent-emerald)':'var(--accent-rose)'}">
                      ${f.type==='in'?'+':'-'}${formatFullCurrency(f.amount)}
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    // Biểu đồ
    setTimeout(() => {
      const cvs = document.getElementById('dash-revenue-chart');
      if (cvs) {
        // Mock data cho 6 tháng (10-2025 tới 03-2026)
        const labels = ['T10', 'T11', 'T12', 'T01', 'T02', 'T03'];
        const neonRev = [120, 150, 180, 140, 110, 190]; // tr VND
        const eventRev = [300, 250, 400, 280, 150, 500]; // tr VND
        drawBarChart(cvs, {
           labels,
           datasets: [
             { values: eventRev, colors: ['#0d9488', '#10b981'] },
             { values: neonRev, colors: ['#6d28d9', '#8b5cf6'] }
           ]
        }, { height: 280, maxVal: 500 });
      }
    }, 100);
  }

  // === DÀNH CHO QUẢN LÝ SẢN XUẤT / KINH DOANH ===
  else if (perm === 'production' || perm === 'sales') {
     const orders = store.get('orders');
     const prod = store.get('production');
     const events = store.get('events');
     
     html += `
       <div class="stats-grid stagger-children">
         <div class="stat-card">
            <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-primary)">${ICONS['shopping-cart']}</div></div>
            <div class="stat-card-value">${orders.filter(o=>o.status==='done').length}</div>
            <div class="stat-card-label">Đơn/HĐ Hoàn thành</div>
         </div>
         <div class="stat-card">
            <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-warning)">${ICONS.tool}</div></div>
            <div class="stat-card-value">${prod.length}</div>
            <div class="stat-card-label">Khâu đang Uốn cáp/Lắp ráp</div>
         </div>
         <div class="stat-card">
            <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-info)">${ICONS.speaker}</div></div>
            <div class="stat-card-value">${events.filter(e=>e.status==='preparing').length}</div>
            <div class="stat-card-label">Sự kiện Sắp tới</div>
         </div>
       </div>
       <div class="card" style="margin-top:24px"><div class="card-header"><h3>Hiệu năng Bộ phận</h3></div><div class="card-body" style="color:var(--text-muted);text-align:center;padding:40px">Bảng phân tích đang được cập nhật riêng cho Production/Sales. Vui lòng truy cập menu tiến độ.</div></div>
     `;
  }
  
  // === DÀNH CHO NHÂN VIÊN XƯỞNG ===
  else {
     html += `
       <div class="stats-grid stagger-children">
         <div class="stat-card">
            <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-success)">${ICONS.clock}</div></div>
            <div class="stat-card-value">22</div>
            <div class="stat-card-label">Ngày công Tháng 3</div>
         </div>
         <div class="stat-card">
            <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-warning)">${ICONS.tool}</div></div>
            <div class="stat-card-value">12h</div>
            <div class="stat-card-label">Tăng ca Sản xuất</div>
         </div>
         <div class="stat-card">
            <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-info)">${ICONS.speaker}</div></div>
            <div class="stat-card-value">3</div>
            <div class="stat-card-label">Setup Sự kiện ngoài giờ</div>
         </div>
       </div>
       <div class="card" style="margin-top:24px">
          <div class="card-header"><h3>Mục tiêu & Chấm công</h3></div>
          <div class="card-body" style="padding:40px;text-align:center;color:var(--text-muted)">
            Thông tin chi tiết lương thưởng được cập nhật vào ngày 05 hằng tháng tại mục [Lương & Phụ cấp].
          </div>
       </div>
     `;
  }

  container.innerHTML = html;
}
