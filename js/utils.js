// ============================================
// ERP SYSTEM - UTILITY FUNCTIONS
// ============================================

export function formatCurrency(amount) {
  if (amount == null) return '0 đ';
  if (amount >= 1e9) return (amount / 1e9).toFixed(1) + ' tỷ';
  if (amount >= 1e6) return (amount / 1e6).toFixed(0) + ' tr';
  if (amount >= 1e3) return (amount / 1e3).toFixed(0) + 'K';
  return amount.toLocaleString('vi-VN');
}

export function formatFullCurrency(amount) {
  if (amount == null) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

export function formatNumber(n) {
  if (n == null) return '0';
  return new Intl.NumberFormat('vi-VN').format(n);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase();
}

export function getStatusBadge(status) {
  const map = {
    // General
    active: { class: 'badge-green', text: 'Hoạt động' },
    inactive: { class: 'badge-rose', text: 'Nghỉ việc' },
    
    // Orders
    quoting: { class: 'badge-blue', text: 'Báo giá' },
    approved: { class: 'badge-amber', text: 'Đã chốt' },
    producing: { class: 'badge-violet', text: 'Đang sản xuất' },
    delivered: { class: 'badge-cyan', text: 'Đã giao' },
    done: { class: 'badge-green', text: 'Hoàn thành' },
    
    // Steps / Events
    preparing: { class: 'badge-amber', text: 'Chuẩn bị' },
    uong_ong: { class: 'badge-violet', text: 'Uốn ống' },
    lap_rap: { class: 'badge-blue', text: 'Lắp ráp' },
    dong_goi: { class: 'badge-green', text: 'Đóng gói' },

    // Financial / Debts
    unpaid: { class: 'badge-rose', text: 'Chưa thanh toán' },
    partial: { class: 'badge-amber', text: 'Thanh toán 1 phần' },
    paid: { class: 'badge-green', text: 'Đã thanh toán' },
    overdue: { class: 'badge-rose', text: 'Quá hạn' },
    pending: { class: 'badge-blue', text: 'Đang chờ' },

    // CRM
    lead: { class: 'badge-blue', text: 'Tiềm năng' },
    proposal: { class: 'badge-violet', text: 'Đề xuất' },
    negotiation: { class: 'badge-amber', text: 'Đàm phán' },
    customer: { class: 'badge-green', text: 'Khách hàng' },

    // Attendance
    'on-time': { class: 'badge-green', text: 'Đúng giờ' },
    late: { class: 'badge-amber', text: 'Đi muộn' },
    absent: { class: 'badge-rose', text: 'Vắng mặt' },
  };
  
  const s = map[status] || { class: 'badge-blue', text: status };
  return `<span class="badge ${s.class}">${s.text}</span>`;
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}
