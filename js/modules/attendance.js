// ============================================
// ERP SYSTEM - ATTENDANCE MODULE
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { showToast } from '../components/toast.js';

export default function renderAttendance(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;gap:24px;padding:40px">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--gradient-warning);display:flex;align-items:center;justify-content:center;font-size:36px">
        🚧
      </div>
      <div>
        <h2 style="margin:0 0 8px;font-size:var(--font-size-2xl)">Sắp ra mắt</h2>
        <p style="color:var(--text-muted);margin:0;max-width:360px;line-height:1.6">
          Module <strong>Chấm công & Tăng ca</strong> đang được phát triển.<br>
          Tính năng theo dõi giờ làm, GPS công trình và tích hợp máy chấm công sẽ sớm được cập nhật.
        </p>
      </div>
      <span class="badge badge-amber" style="font-size:13px;padding:8px 20px">Đang phát triển</span>
    </div>
  `;
}

// eslint-disable-next-line no-unused-vars
function _renderAttendanceFull(container) {
  const perm = auth.getPermission('attendance');
  const user = auth.getUser();
  const records = store.get('attendance');
  const employees = store.get('employees');

  const today = new Date().toISOString().split('T')[0];
  const isCheckedIn = records.some(r => r.date === today && r.employeeId === user.id);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Chấm công & Tăng ca</h1><p>Theo dõi giờ làm việc Xưởng, đi công trình, setup Sự kiện</p></div>
      <div class="page-header-right">
        <button id="btn-checkin" class="btn ${isCheckedIn ? 'btn-secondary' : 'btn-success'}">
           ${isCheckedIn ? ICONS.check + ' Đã Chấm công lúc 07:44' : ICONS.clock + ' Check In (Bằng GPS)'}
        </button>
      </div>
    </div>
    <div class="card">
       <div class="card-header"><h3>Thống kê Công (${perm === 'personal' ? 'Cá nhân' : 'Toàn Công ty'})</h3></div>
       <div class="card-body" style="color:var(--text-muted);text-align:center;padding:40px">
          Sẵn sàng kết nối với API máy chấm công vân tay Xưởng / thiết bị GPS công trình.
       </div>
    </div>
  `;

  document.getElementById('btn-checkin')?.addEventListener('click', () => {
     if (isCheckedIn) { showToast('Bạn đã chấm công ngày hôm nay rồi!', 'info'); return; }
     store.add('attendance', {
        id: store.generateId('AT', 'attendance'), date: today, employeeId: user.id,
        checkIn: new Date().toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute:'2-digit' }),
        checkOut: '', status: 'present'
     });
     showToast('Đã nhận định vị GPS và lưu Chấm Công thành công!', 'success');
     _renderAttendanceFull(container);
  });
}
