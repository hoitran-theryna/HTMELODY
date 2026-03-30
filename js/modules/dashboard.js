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
        // Tính doanh thu 6 tháng gần nhất từ dữ liệu thực
        const now = new Date();
        const labels = [];
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push('T' + String(d.getMonth() + 1).padStart(2, '0'));
          months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
        const neonRev = months.map(m =>
          orders.filter(o => o.type === 'neon' && (o.createdAt || '').startsWith(m))
                .reduce((s, o) => s + (o.price || 0), 0)
        );
        const eventRev = months.map(m =>
          orders.filter(o => o.type === 'event' && (o.createdAt || '').startsWith(m))
                .reduce((s, o) => s + (o.price || 0), 0)
        );
        // Nếu chưa có dữ liệu thực, dùng mock data (đơn vị VND)
        const hasData = [...neonRev, ...eventRev].some(v => v > 0);
        const finalNeon = hasData ? neonRev : [120,150,180,140,110,190].map(v => v * 1_000_000);
        const finalEvent = hasData ? eventRev : [300,250,400,280,150,500].map(v => v * 1_000_000);
        drawBarChart(cvs, {
          labels,
          datasets: [
            { values: finalEvent, colors: ['#0d9488', '#10b981'] },
            { values: finalNeon, colors: ['#6d28d9', '#8b5cf6'] }
          ]
        }, { height: 280 });
      }
    }, 100);
  }

  // === DÀNH CHO QUẢN LÝ SẢN XUẤT / KINH DOANH ===
  else if (perm === 'production' || perm === 'sales') {
     const orders = store.get('orders');
     const debts = store.get('debts');
     const prod = store.get('production');

     const now = new Date();
     const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
     const ordersThisMonth = orders.filter(o => (o.createdAt||'').startsWith(thisMonth));
     const activeOrders = orders.filter(o => !['done','delivered','cancelled'].includes(o.status));
     const myDebts = debts.filter(d => d.type === 'receivable' && d.status !== 'paid');
     const totalPending = myDebts.reduce((s,d) => s + ((d.totalAmount||0)-(d.paidAmount||0)), 0);
     const revenueThisMonth = ordersThisMonth.reduce((s,o) => s + (o.price||0), 0);

     const customers = store.get('customers');
     const recentOrders = orders.slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,8);

     html += `
       <div class="stats-grid stagger-children">
         <div class="stat-card">
            <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-primary)">${ICONS['shopping-cart']}</div></div>
            <div class="stat-card-value">${activeOrders.length}</div>
            <div class="stat-card-label">Đơn hàng Đang xử lý</div>
         </div>
         <div class="stat-card">
            <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-success)">${ICONS['trending-up']}</div></div>
            <div class="stat-card-value" style="font-size:20px">${formatCurrency(revenueThisMonth)}</div>
            <div class="stat-card-label">Doanh thu Tháng này</div>
         </div>
         <div class="stat-card">
            <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-warning)">${ICONS.tool}</div></div>
            <div class="stat-card-value">${prod.length}</div>
            <div class="stat-card-label">Task đang Sản xuất</div>
         </div>
         <div class="stat-card">
            <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-danger)">${ICONS.bookmark}</div></div>
            <div class="stat-card-value" style="font-size:20px;color:var(--accent-amber)">${formatCurrency(totalPending)}</div>
            <div class="stat-card-label">Công nợ chưa Thu</div>
         </div>
       </div>
       <div class="card" style="margin-top:24px">
         <div class="card-header"><h3>Đơn hàng Gần đây</h3></div>
         <div class="card-body" style="padding:0;overflow:hidden">
           <table style="width:100%;border-collapse:collapse">
             <thead>
               <tr style="background:var(--bg-tertiary);border-bottom:1px solid var(--border-color)">
                 <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Mã đơn</th>
                 <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Tên đơn hàng</th>
                 <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Khách hàng</th>
                 <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Giá trị</th>
                 <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Trạng thái</th>
                 <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Deadline</th>
               </tr>
             </thead>
             <tbody>
               ${recentOrders.map((o, idx) => {
                 const statusMap = { pending:'Chờ duyệt', approved:'Đã duyệt', producing:'Đang SX', done:'Hoàn thành', delivered:'Đã giao', cancelled:'Đã hủy' };
                 const statusBg  = { pending:'rgba(245,158,11,.15)', approved:'rgba(59,130,246,.15)', producing:'rgba(139,92,246,.15)', done:'rgba(16,185,129,.15)', delivered:'rgba(100,116,139,.15)', cancelled:'rgba(239,68,68,.15)' };
                 const statusClr = { pending:'var(--accent-amber)', approved:'var(--accent-blue-light)', producing:'#a78bfa', done:'var(--accent-emerald)', delivered:'var(--text-muted)', cancelled:'var(--accent-rose)' };
                 const isOverdue = o.deadline && new Date(o.deadline) < now && !['done','delivered','cancelled'].includes(o.status);
                 const typeTag = o.type === 'neon' ? '<span style="font-size:10px;background:rgba(139,92,246,.2);color:#a78bfa;padding:1px 6px;border-radius:4px;margin-left:6px">Neon</span>' : o.type === 'event' ? '<span style="font-size:10px;background:rgba(16,185,129,.2);color:var(--accent-emerald);padding:1px 6px;border-radius:4px;margin-left:6px">Event</span>' : '';
                 return `<tr style="border-bottom:1px solid var(--border-color);${idx%2===1?'background:rgba(255,255,255,.01)':''}">
                   <td style="padding:12px 16px;font-family:var(--font-mono);font-size:12px;color:var(--text-muted)">${o.id}</td>
                   <td style="padding:12px 16px;font-weight:500;color:var(--text-primary)">${o.title||''}${typeTag}</td>
                   <td style="padding:12px 16px;color:var(--text-secondary);font-size:var(--font-size-sm)">${o.partnerName||customers.find(c=>c.id===o.customerId)?.name||'—'}</td>
                   <td style="padding:12px 16px;text-align:right;font-variant-numeric:tabular-nums;font-weight:600">${formatFullCurrency(o.price||0)}</td>
                   <td style="padding:12px 16px;text-align:center">
                     <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500;background:${statusBg[o.status]||'rgba(100,116,139,.15)'};color:${statusClr[o.status]||'var(--text-muted)'}">
                       ${statusMap[o.status]||o.status}
                     </span>
                   </td>
                   <td style="padding:12px 16px;font-size:var(--font-size-sm);color:${isOverdue?'var(--accent-rose)':'var(--text-secondary)'}">
                     ${isOverdue?'⚠ ':''}${o.deadline||'—'}
                   </td>
                 </tr>`;
               }).join('')}
             </tbody>
           </table>
         </div>
       </div>
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
