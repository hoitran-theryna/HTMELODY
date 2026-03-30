// ============================================
// ERP SYSTEM - HEADER COMPONENT
// ============================================

import auth from '../auth.js';
import store from '../store.js';
import { ICONS } from './icons.js';

export function renderHeader() {
  const notifications = store.get('notifications') || [];
  const notifCount = notifications.length;

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
          <button class="btn btn-icon btn-ghost" id="notification-btn">
            ${ICONS.bell}
            ${notifCount > 0 ? `<span class="notification-badge">${notifCount}</span>` : ''}
          </button>
          <div class="notification-dropdown" id="notification-dropdown">
            <div class="notification-dropdown-header">
              <h3>Thông báo</h3>
              <span style="font-size:var(--font-size-xs);color:var(--text-muted)">${notifCount} mới</span>
            </div>
            <div class="notification-list">
              ${notifications.map(n => `
                <div class="notification-item">
                  <div class="notification-item-icon" style="background:rgba(59,130,246,0.1);color:var(--accent-blue-light)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  </div>
                  <div class="notification-item-content">
                    <div class="notification-item-text">${n.text}</div>
                    <div class="notification-item-time">${n.time}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </header>`;
}

export function startClock() {
  const update = () => {
    const el = document.getElementById('clock-time');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  };
  update();
  setInterval(update, 1000);
}

export function initHeaderEvents() {
  const btn = document.getElementById('notification-btn');
  const dropdown = document.getElementById('notification-dropdown');
  if (btn && dropdown) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) dropdown.classList.remove('show');
    });
  }
}
