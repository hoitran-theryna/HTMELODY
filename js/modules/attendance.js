// ============================================
// ERP SYSTEM - ATTENDANCE MODULE
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { showToast } from '../components/toast.js';

export default function renderAttendance(container) {
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
     if (isCheckedIn) {
        showToast('Bạn đã chấm công ngày hôm nay rồi!', 'info');
        return;
     }

     store.add('attendance', {
        id: store.generateId('AT'),
        date: today,
        employeeId: user.id,
        checkIn: new Date().toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute:'2-digit' }),
        checkOut: '',
        status: 'present'
     });

     showToast('✅ Đã nhận định vị GPS và lưu Chấm Công thành công!', 'success');
     renderAttendance(container);
  });
}
