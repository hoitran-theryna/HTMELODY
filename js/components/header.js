// ============================================
// ERP SYSTEM - HEADER COMPONENT
// ============================================

import store from '../store.js';
import router from '../router.js';
import { ICONS } from './icons.js';

// Sinh thông báo thông minh từ dữ liệu thực tế
function generateNotifications() {
  const items = [];
  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in7Days  = new Date(today.getTime() +  7 * 24 * 60 * 60 * 1000);
  const todayStr = today.toISOString().split('T')[0];

  const debts  = store.get('debts')  || [];
  const orders = store.get('orders') || [];

  // 1. Công nợ quá hạn
  const overdueDebts = debts.filter(d =>
    d.status !== 'paid' && d.dueDate && new Date(d.dueDate) < today
  );
  if (overdueDebts.length) {
    items.push({
      id: `overdue-${overdueDebts.length}`,
      level: 'danger',
      bg: 'rgba(244,63,94,0.10)',
      color: 'var(--accent-rose)',
      icon: ICONS.wallet,
      text: `${overdueDebts.length} khoản công nợ đã quá hạn thu tiền`,
      sub: 'Vào Công nợ để xử lý ngay',
      route: 'debts',
    });
  }

  // 2. Bảo hành sắp hết hạn trong 30 ngày
  const expiringWarranty = debts.filter(d => {
    if (!d.warrantyDate) return false;
    const w = new Date(d.warrantyDate);
    return w >= today && w <= in30Days;
  });
  if (expiringWarranty.length) {
    items.push({
      id: `warranty-${expiringWarranty.length}`,
      level: 'warning',
      bg: 'rgba(245,158,11,0.10)',
      color: 'var(--accent-amber)',
      icon: ICONS.tasks,
      text: `${expiringWarranty.length} hợp đồng sắp hết hạn bảo hành`,
      sub: 'Trong vòng 30 ngày tới — liên hệ khách hàng',
      route: 'debts',
    });
  }

  // 3. Đơn hàng deadline trong 7 ngày (chưa xong)
  const urgentOrders = orders.filter(o =>
    o.status !== 'done' &&
    o.deadline &&
    new Date(o.deadline) >= today &&
    new Date(o.deadline) <= in7Days
  );
  if (urgentOrders.length) {
    items.push({
      id: `urgent-orders-${urgentOrders.length}`,
      level: 'warning',
      bg: 'rgba(245,158,11,0.10)',
      color: 'var(--accent-amber)',
      icon: ICONS.clock,
      text: `${urgentOrders.length} đơn hàng sắp đến hạn bàn giao`,
      sub: 'Deadline trong 7 ngày tới — kiểm tra tiến độ',
      route: 'orders',
    });
  }

  // 4. Đơn hàng mới tạo hôm nay
  const todayOrders = orders.filter(o => (o.createdAt || '').startsWith(todayStr));
  if (todayOrders.length) {
    items.push({
      id: `new-orders-${todayStr}`,
      level: 'info',
      bg: 'rgba(59,130,246,0.10)',
      color: 'var(--accent-blue)',
      icon: ICONS.zap,
      text: `${todayOrders.length} đơn hàng mới được tạo hôm nay`,
      sub: `Ngày ${todayStr.split('-').reverse().join('/')}`,
      route: 'orders',
    });
  }

  return items;
}

// Trả về danh sách ID đã đọc từ sessionStorage
function getReadIds() {
  try { return JSON.parse(sessionStorage.getItem('erp_notif_read') || '[]'); }
  catch { return []; }
}

function saveReadIds(ids) {
  sessionStorage.setItem('erp_notif_read', JSON.stringify(ids));
}

export function renderHeader() {
  const notifs     = generateNotifications();
  const readIds    = getReadIds();
  const unread     = notifs.filter(n => !readIds.includes(n.id)).length;

  const emptyHtml = `
    <div style="padding:32px 16px;text-align:center;color:var(--text-muted)">
      <div style="font-size:32px;margin-bottom:8px">🎉</div>
      <div style="font-size:var(--font-size-sm);font-weight:500">Không có thông báo mới</div>
      <div style="font-size:var(--font-size-xs);margin-top:4px">Mọi thứ đang ổn!</div>
    </div>`;

  const listHtml = notifs.map(n => `
    <div class="notification-item" data-notif-route="${n.route}" style="cursor:pointer">
      <div class="notification-item-icon" style="background:${n.bg};color:${n.color}">
        <div style="width:16px;height:16px">${n.icon}</div>
      </div>
      <div class="notification-item-content">
        <div class="notification-item-text" style="${!readIds.includes(n.id) ? 'font-weight:600' : ''}">${n.text}</div>
        <div class="notification-item-time">${n.sub}</div>
      </div>
      ${!readIds.includes(n.id) ? `<span style="width:7px;height:7px;background:${n.color};border-radius:50%;flex-shrink:0;align-self:center;margin-left:4px"></span>` : ''}
    </div>`).join('');

  return `
    <header class="header" id="app-header">
      <div class="header-left">
        <button class="btn-hamburger" id="btn-hamburger" aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div class="header-breadcrumb">
          <span>ERP</span>
          ${ICONS.chevronRight}
          <span class="current" id="breadcrumb-current">Dashboard</span>
        </div>
        <div class="header-search">
          ${ICONS.search}
          <input type="text" placeholder="Tìm kiếm nhanh... (Ctrl+K)" id="header-search-input" />
        </div>
      </div>
      <div class="header-right">
        <div class="header-clock" id="header-clock">
          <span class="pulse-dot"></span>
          <span id="clock-time">--:--:--</span>
        </div>
        <div class="header-notification" id="notification-area">
          <button class="btn btn-icon btn-ghost" id="notification-btn" aria-label="Thông báo">
            ${ICONS.bell}
            <span class="notification-badge" id="notif-badge" style="${unread > 0 ? '' : 'display:none'}">${unread}</span>
          </button>
          <div class="notification-dropdown" id="notification-dropdown">
            <div class="notification-dropdown-header">
              <h3>Thông báo hệ thống</h3>
              <span style="font-size:var(--font-size-xs);color:var(--text-muted)">${notifs.length} cảnh báo</span>
            </div>
            <div class="notification-list">
              ${notifs.length === 0 ? emptyHtml : listHtml}
            </div>
            ${notifs.length > 0 ? `
            <div style="padding:10px 16px;border-top:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center">
              <button class="btn btn-ghost btn-sm" id="notif-mark-all-read" style="font-size:12px;color:var(--text-muted)">
                Đánh dấu đã đọc tất cả
              </button>
              <span style="font-size:11px;color:var(--text-muted)">${unread > 0 ? `${unread} chưa đọc` : 'Đã đọc hết'}</span>
            </div>` : ''}
          </div>
        </div>
      </div>
    </header>`;
}

let _clockInterval = null;

export function startClock() {
  if (_clockInterval) clearInterval(_clockInterval);

  const update = () => {
    const el = document.getElementById('clock-time');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  };
  update();
  _clockInterval = setInterval(update, 1000);
}

export function initHeaderEvents() {
  const btn      = document.getElementById('notification-btn');
  const dropdown = document.getElementById('notification-dropdown');
  const badge    = document.getElementById('notif-badge');

  if (!btn || !dropdown) return;

  // Toggle dropdown
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('show');

    // Đánh dấu đã đọc khi mở dropdown
    if (isOpen) {
      const notifs = generateNotifications();
      saveReadIds(notifs.map(n => n.id));
      if (badge) badge.style.display = 'none';

      // Xóa chấm đỏ chưa đọc trong danh sách
      dropdown.querySelectorAll('.notification-item').forEach(item => {
        const dot = item.querySelector('span[style*="border-radius:50%"]');
        if (dot) dot.remove();
        const textEl = item.querySelector('.notification-item-text');
        if (textEl) textEl.style.fontWeight = '';
      });
    }
  });

  // Đóng khi click ra ngoài
  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target) && e.target !== btn) {
      dropdown.classList.remove('show');
    }
  });

  // Đánh dấu đã đọc tất cả
  document.getElementById('notif-mark-all-read')?.addEventListener('click', () => {
    const notifs = generateNotifications();
    saveReadIds(notifs.map(n => n.id));
    if (badge) badge.style.display = 'none';
    dropdown.classList.remove('show');
  });

  // Click vào từng thông báo → điều hướng đến module tương ứng
  dropdown.querySelectorAll('[data-notif-route]').forEach(item => {
    item.addEventListener('click', () => {
      dropdown.classList.remove('show');
      router.navigate(item.dataset.notifRoute);
    });
  });
}
