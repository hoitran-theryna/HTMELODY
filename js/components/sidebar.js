// ============================================
// ERP SYSTEM - SIDEBAR COMPONENT
// ============================================

import auth from '../auth.js';
import store from '../store.js';
import { ICONS } from './icons.js';

const NAV_ITEMS = [
  { section: 'Tổng quan', items: [
    { id: 'dashboard', label: 'Bảng Điều khiển', icon: 'dashboard' },
  ]},
  { section: 'Kinh doanh & Sản xuất', items: [
    { id: 'orders', label: 'Đơn hàng', icon: 'shopping-cart' },
    { id: 'customers', label: 'Khách hàng', icon: 'users' },
    { id: 'contracts', label: 'Soạn Hợp đồng (.doc)', icon: 'bookmark' },
    { id: 'production', label: 'Xưởng Sản xuất', icon: 'tool' },
    { id: 'events', label: 'Sự kiện Âm thanh Ánh sáng', icon: 'speaker' },
  ]},
  { section: 'Tài chính - Kế toán', items: [
    { id: 'debts', label: 'Công nợ', icon: 'bookmark' },
    { id: 'fund', label: 'Sổ Quỹ', icon: 'wallet' },
    { id: 'tax', label: 'Thuế nội bộ', icon: 'percent' },
    { id: 'assets', label: 'Tài sản & Vật tư', icon: 'box' },
  ]},
  { section: 'Nhân sự & Lương', items: [
    { id: 'hr', label: 'Nhân sự', icon: 'users' },
    { id: 'attendance', label: 'Chấm công', icon: 'clock' },
    { id: 'payroll', label: 'Lương & Phụ cấp', icon: 'money' },
  ]},
  { section: 'Phân tích', items: [
    { id: 'reports', label: 'Báo cáo Tài chính', icon: 'report' },
  ]},
];

export function renderSidebar() {
  const user = auth.getUser();
  
  // Notification counts
  const unpaidDebts = store.get('debts').filter(d => d.status !== 'paid').length;
  const inProgressOrders = store.get('orders').filter(o => !['delivered', 'done'].includes(o.status)).length;
  const pendingTaxes = store.get('taxes').filter(t => t.status === 'pending').length;

  const navHtml = NAV_ITEMS.map(section => {
    const accessibleItems = section.items.filter(item => auth.hasAccess(item.id));
    if (accessibleItems.length === 0) return '';
    return `
      <div class="nav-section">
        <div class="nav-section-title">${section.section}</div>
        ${accessibleItems.map(item => {
          let badge = '';
          if (item.id === 'orders' && inProgressOrders > 0) badge = `<span class="nav-badge" style="background:var(--accent-blue-dark)">${inProgressOrders}</span>`;
          if (item.id === 'debts' && unpaidDebts > 0 && auth.getPermission('debts') !== 'none') badge = `<span class="nav-badge" style="background:var(--accent-amber)">${unpaidDebts}</span>`;
          if (item.id === 'tax' && pendingTaxes > 0) badge = `<span class="nav-badge">${pendingTaxes}</span>`;
          
          return `<div class="nav-item" data-route="${item.id}" id="nav-${item.id}">
            ${ICONS[item.icon] || ICONS.dashboard}
            <span class="nav-item-text">${item.label}</span>
            ${badge}
          </div>`;
        }).join('')}
      </div>`;
  }).join('');

  const initials = user ? getInitials(user.name) : '';

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <img src="/logo.png" alt="Landlight Art" style="width:40px;height:40px;border-radius:8px;object-fit:cover;flex-shrink:0" />
        <div class="sidebar-brand">
          <h2>Landlight Art</h2>
          <span>Quản lý Nội bộ</span>
        </div>
        <button class="btn-sidebar-close" id="btn-sidebar-close" aria-label="Đóng sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <nav class="sidebar-nav">
        ${navHtml}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user" id="sidebar-user-area">
          <div class="avatar" style="background:${user?.avatar || '#3b82f6'}">${initials}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user?.name || ''}</div>
            <div class="sidebar-user-role">${auth.getRoleName()}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted);flex-shrink:0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </div>
      </div>
    </aside>`;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase();
}
