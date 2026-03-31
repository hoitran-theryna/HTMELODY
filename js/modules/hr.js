// ============================================
// ERP SYSTEM - HR MODULE (Full CRUD)
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { formatFullCurrency, formatDate, getStatusBadge, getInitials } from '../utils.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { paginate, paginationHTML, bindPagination } from '../components/pagination.js';

export default function renderHR(container) {
  const perm = auth.getPermission('hr');
  if (perm === 'none') { container.innerHTML = '<h3>Không có quyền truy cập</h3>'; return; }

  const departments = store.get('departments');

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Quản trị Nhân sự Siêu cấp</h1><p>Hồ sơ CBNV, Lương cứng, Đãi ngộ, Cấp quyền Hệ thống</p></div>
      <div class="page-header-right">
         ${perm === 'full' ? `<button class="btn btn-primary" id="btn-add-emp">${ICONS.plus} Tuyển Nhân sự Mới</button>` : ''}
      </div>
    </div>
    
    <div class="stats-grid stagger-children" id="hr-stats-container">
       <!-- Stats injected via JS -->
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Danh sách CB-CNV</h3>
        <select class="form-select" id="hr-dept"><option value="">Tất cả Khối/Phòng</option>${departments.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}</select>
      </div>
      <div class="data-table-wrapper" style="overflow-x:auto">
        <table class="data-table" style="min-width:800px">
          <thead>
            <tr>
              <th>ID Đăng nhập & Tên</th>
              <th>Truy Cập HT</th>
              <th>Bộ phận & Chức danh</th>
              <th>Lương Cơ bản</th>
              <th>Hoa hồng/Thưởng</th>
              <th>Trạng thái</th>
              ${perm === 'full' ? '<th style="text-align:center">Thao tác</th>' : ''}
            </tr>
          </thead>
          <tbody id="hr-table-body"></tbody>
        </table>
      </div>
      <div id="hr-pag"></div>
    </div>
  `;

  let currentDeptFilter = '';
  let page = 1;

  const renderStats = (emps) => {
    document.getElementById('hr-stats-container').innerHTML = `
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-primary)">${ICONS.users}</div></div>
        <div class="stat-card-value">${emps.length}</div>
        <div class="stat-card-label">Tổng nhân sự</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-success)">${ICONS.tool}</div></div>
        <div class="stat-card-value">${emps.filter(e=>e.department==='D03').length}</div>
        <div class="stat-card-label">Thợ Xưởng Neon</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-info)">${ICONS.speaker}</div></div>
        <div class="stat-card-value">${emps.filter(e=>e.department==='D05').length}</div>
        <div class="stat-card-label">Kỹ thuật Sự kiện</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><div class="stat-card-icon" style="background:var(--gradient-rose)">${ICONS.shield}</div></div>
        <div class="stat-card-value">${emps.filter(e=>e.role==='director'||e.role==='manager').length}</div>
        <div class="stat-card-label">Cấp Quản lý</div>
      </div>
    `;
  };

  const renderTable = (newPage = 1) => {
    page = newPage;
    const employees = store.get('employees');
    let data = employees;
    if (currentDeptFilter) data = data.filter(e => e.department === currentDeptFilter);

    renderStats(employees);

    const { items, total, pages } = paginate(data, page);

    document.getElementById('hr-table-body').innerHTML = items.map(e => `
      <tr>
        <td>
          <div class="user-cell">
            <div class="avatar avatar-sm" style="background:${e.avatar||'#10b981;font-weight:bold'}">${getInitials(e.name || 'AA')}</div>
            <div>
              <div style="font-weight:600">${e.name||'Chưa rõ Tên'}</div>
              ${perm==='full' ? `<div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">UID: <b>${e.username||'N/A'}</b> | Pass: <b>${e.password||'***'}</b></div>` : ''}
            </div>
          </div>
        </td>
        <td><span class="badge ${e.role==='director'||e.role==='accountant'?'badge-rose':e.role==='manager'?'badge-violet':'badge-blue'}">${e.role?.toUpperCase()||'NHÂN VIÊN'}</span></td>
        <td>
          <div style="font-weight:500">${e.position||'Chưa rõ phân công'}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-muted)">${store.getDepartmentName(e.department)}</div>
        </td>
        <td style="font-variant-numeric:tabular-nums;color:var(--accent-emerald);font-weight:600">${perm==='full' ? formatFullCurrency(e.salary||0) : '*** đ'}</td>
        <td style="font-weight:bold;color:var(--accent-amber)">
           ${perm==='full' ? (e.commissionType==='fixed' ? formatFullCurrency(e.commissionRate||0) : (e.commissionRate>0 ? e.commissionRate+' %' : '-')) : '***'}
        </td>
        <td>${getStatusBadge(e.status)}</td>
        ${perm === 'full' ? `
        <td style="text-align:center">
            <div style="display:flex;gap:8px;justify-content:center">
               <button class="btn btn-icon btn-sm btn-ghost edit-emp" data-id="${e.id}" title="Sửa Hồ sơ" style="color:var(--accent-blue)">${ICONS.edit}</button>
               <button class="btn btn-icon btn-sm btn-ghost del-emp" data-id="${e.id}" title="Xoá vĩnh viễn" style="color:var(--accent-rose)">${ICONS.trash}</button>
            </div>
        </td>` : ''}
      </tr>
    `).join('');

    const pag = container.querySelector('#hr-pag');
    if (pag) {
      pag.innerHTML = paginationHTML(page, pages, total);
      bindPagination(pag, p => renderTable(p));
    }
  };

  const openModal = (empId = null) => {
    const emp = empId ? store.getById('employees', empId) : null;
    const modal = showModal(emp ? 'Sửa thông tin Nhân viên' : 'Tuyển Nhân sự Mới', `
       <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group"><label class="form-label">Tên đầy đủ (Hiển thị Bảng Lương)</label><input type="text" id="emp-name" class="form-input" value="${emp?.name||''}"></div>
          <div class="form-group"><label class="form-label">Phân ban</label>
             <select id="emp-dept" class="form-select">
                ${departments.map(d=>`<option value="${d.id}" ${emp?.department===d.id?'selected':''}>${d.name}</option>`).join('')}
             </select>
          </div>
          
          <div class="form-group"><label class="form-label">Tên đăng nhập Website</label><input type="text" id="emp-user" class="form-input" value="${emp?.username||''}"></div>
          <div class="form-group"><label class="form-label">Mật khẩu</label><input type="text" id="emp-pass" class="form-input" value="${emp?.password||'1'}"></div>
          
          <div class="form-group"><label class="form-label">Chức danh thực tế (Ví dụ: Thợ uốn)</label><input type="text" id="emp-pos" class="form-input" value="${emp?.position||''}"></div>
          <div class="form-group"><label class="form-label">Số ĐTDĐ (Tùy chọn)</label><input type="text" id="emp-phone" class="form-input" value="${emp?.phone||''}"></div>
          
          <div class="form-group"><label class="form-label">Phân Quyền Website (Admin)</label>
             <select id="emp-role" class="form-select">
                <option value="staff" ${emp?.role==='staff'?'selected':''}>Nhân Viên Xưởng (Chỉ xem việc)</option>
                <option value="sales" ${emp?.role==='sales'?'selected':''}>Kinh Doanh (Quản lý Đơn hàng)</option>
                <option value="accountant" ${emp?.role==='accountant'?'selected':''}>Kế Toán (Sổ quỹ, Công Nợ, Lương)</option>
                <option value="manager" ${emp?.role==='manager'?'selected':''}>Quản lý (Kho, Thẻ việc Kanban)</option>
                <option value="event" ${emp?.role==='event'?'selected':''}>Event Director (Sự Kiện)</option>
                <option value="director" ${emp?.role==='director'?'selected':''}>Giám Đốc (Toàn quyền Xóa sửa)</option>
             </select>
          </div>
          <div class="form-group"><label class="form-label">Trạng thái Nhậm chức</label>
             <select id="emp-status" class="form-select">
                <option value="active" ${emp?.status!=='inactive'?'selected':''}>Đang làm việc</option>
                <option value="inactive" ${emp?.status==='inactive'?'selected':''}>Đã Khóa / Nghỉ việc</option>
             </select>
          </div>

          <div class="form-group"><label class="form-label">LƯƠNG CƠ BẢN (VNĐ/Tháng)</label><input type="number" id="emp-salary" class="form-input" value="${emp?.salary||0}" style="font-weight:bold;color:var(--accent-emerald)"></div>
          <div class="form-group"><label class="form-label">Cấu hình Thưởng / Hoa hồng</label>
             <div style="display:flex;gap:8px">
                <input type="number" id="emp-comm" class="form-input" value="${emp?.commissionRate||0}" style="font-weight:bold;color:var(--accent-amber)">
                <select id="emp-comm-type" class="form-select" style="width:110px">
                   <option value="percent" ${emp?.commissionType!=='fixed'?'selected':''}>%</option>
                   <option value="fixed" ${emp?.commissionType==='fixed'?'selected':''}>VNĐ (Cứng)</option>
                </select>
             </div>
          </div>
       </div>
       <div style="margin-top:16px;font-size:12px;color:var(--text-muted);background:rgba(16,185,129,0.1);padding:10px;border-radius:8px">
          <i style="color:var(--accent-emerald)">Lưu ý:</i> Tài khoản sẽ có hiệu lực ngay khi Lập hồ sơ.
       </div>
    `, { size: 'lg', footer: `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">Hủy</button><button class="btn btn-primary" id="btn-save-emp">${emp ? 'Cập nhật' : 'Khởi tạo Hồ sơ'}</button>`});

    modal.overlay.querySelector('#btn-save-emp').addEventListener('click', () => {
       const user = document.getElementById('emp-user').value.trim();
       const name = document.getElementById('emp-name').value.trim();
       if (!user || !name) { showToast('Tên và Tên đăng nhập không thể để trống', 'error'); return; }
       
       const updates = {
          name, username: user,
          password: document.getElementById('emp-pass').value.trim(),
          phone: document.getElementById('emp-phone').value.trim(),
          position: document.getElementById('emp-pos').value.trim(),
          department: document.getElementById('emp-dept').value,
          role: document.getElementById('emp-role').value,
          status: document.getElementById('emp-status').value,
          salary: parseInt(document.getElementById('emp-salary').value) || 0,
          commissionRate: parseFloat(document.getElementById('emp-comm').value) || 0,
          commissionType: document.getElementById('emp-comm-type').value
       };

       if (empId) {
          store.update('employees', empId, updates);
          showToast(`Đã Sửa hồ sơ của: ${name}`, 'success');
       } else {
          updates.id = store.generateId('EMP');
          updates.joinDate = new Date().toISOString().split('T')[0];
          updates.avatar = '#' + Math.floor(Math.random()*16777215).toString(16);
          store.add('employees', updates);
          showToast(`Đã cấp Tài khoản mới: ${user}`, 'success');
       }
       renderTable();
       modal.overlay.remove();
    });
  };

  document.getElementById('hr-dept')?.addEventListener('change', e => {
     currentDeptFilter = e.target.value;
     renderTable(1);
  });

  container.addEventListener('click', e => {
     const addBtn = e.target.closest('#btn-add-emp');
     if (addBtn) openModal();
     
     const editBtn = e.target.closest('.edit-emp');
     if (editBtn) openModal(editBtn.dataset.id);

     const delBtn = e.target.closest('.del-emp');
     if (delBtn) {
        if (confirm('NGUY HIỂM: \nBạn có chắc chắn muốn Tước Quyền Truy Cập và Loại bỏ Vĩnh viễn Dữ liệu Lịch sử của Nhân sự này khỏi Database không? \nThao tác này KHÔNG THỂ HOÀN TÁC!')) {
           store.remove('employees', delBtn.dataset.id);
           showToast('Đã xóa bỏ hoàn toàn (Burned) Hồ sơ', 'success');
           renderTable();
        }
     }
  });

  // Lắng nghe Phản ứng Bất đồng bộ từ Hệ thống Mạng (Vì khi lưu xong Supabase báo về thì mình render lại)
  // Thực chất Store mình đã emit đồng bộ trước luôn rồi nên tốc độ là Instant
  store.on('employees', () => renderTable());

  renderTable();
}
