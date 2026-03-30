// ============================================
// ERP SYSTEM - EVENTS MODULE
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { formatDate, getStatusBadge, getInitials } from '../utils.js';
import { showModal } from '../components/modal.js';

export default function renderEvents(container) {
  const events = store.get('events');
  const orders = store.get('orders');

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Quản lý Sự kiện </h1>
        <p>Lịch thi công & setup hệ thống Âm thanh, Ánh sáng, Sân khấu</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header">
        <h3>Lịch Sự kiện Sắp Tới</h3>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px;">
          ${events.map(ev => {
            const order = orders.find(o => o.id === ev.orderId);
            const teamHtml = ev.team.map(id => {
              const emp = store.getEmployee(id);
              return `<div class="avatar avatar-sm" style="background:${emp?.avatar||'#333'}" title="${emp?.name||''}">${getInitials(emp?.name||'?')}</div>`;
            }).join('');
            
            return `
            <div style="background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:20px;display:flex;flex-direction:column;gap:12px;cursor:pointer;transition:all 0.2s" class="event-card" data-action="view-event" data-id="${ev.id}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <span class="badge badge-amber" style="font-size:10px">📅 ${formatDate(ev.date)}</span>
                ${getStatusBadge(ev.status)}
              </div>
              <h4 style="margin:0;font-size:var(--font-size-lg);line-height:1.4">${ev.title}</h4>
              <div style="display:flex;flex-direction:column;gap:6px;font-size:var(--font-size-sm);color:var(--text-muted)">
                <div style="display:flex;align-items:center;gap:8px">📍 ${ev.location}</div>
                <div style="display:flex;align-items:center;gap:8px">📦 HĐ: ${order?.id || '---'}</div>
              </div>
              <div style="margin-top:auto;padding-top:12px;border-top:1px dashed var(--border-color);display:flex;justify-content:space-between;align-items:center">
                <div style="font-size:var(--font-size-xs);color:var(--text-muted)">Team Setup:</div>
                <div style="display:flex;margin-left:8px;direction:rtl">${teamHtml}</div>
              </div>
            </div>
            `;
          }).join('')}
          ${events.length === 0 ? '<p style="color:var(--text-muted);font-style:italic">Chưa có sự kiện nào sắp diễn ra.</p>' : ''}
        </div>
      </div>
    </div>
  `;

  container.addEventListener('click', e => {
    const card = e.target.closest('.event-card');
    if (!card) return;
    const ev = store.getById('events', card.dataset.id);
    if (!ev) return;
    const order = orders.find(o => o.id === ev.orderId);

    showModal(`Chi tiết Sự kiện`, `
      <h3 style="margin-bottom:16px">${ev.title}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:var(--font-size-sm);margin-bottom:24px">
        <div><span style="color:var(--text-muted)">Ngày diễn ra:</span> <strong>${formatDate(ev.date)}</strong></div>
        <div><span style="color:var(--text-muted)">Địa điểm:</span> ${ev.location}</div>
        <div><span style="color:var(--text-muted)">Trạng thái:</span> ${getStatusBadge(ev.status)}</div>
        <div><span style="color:var(--text-muted)">Thuộc Hợp đồng:</span> <a href="#orders">${order?.id||''}</a></div>
      </div>

      <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:16px">
        <h4 style="margin-bottom:12px">Checklist Yêu cầu thiết bị</h4>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
          ${order?.equipment ? order.equipment.split(',').map(eq => `
            <li style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" checked disabled style="accent-color:var(--accent-emerald)">
              <span>${eq.trim()}</span>
            </li>
          `).join('') : '<span style="color:var(--text-muted)">Không có chi tiết</span>'}
          ${ev.checklist?.map(c => `
             <li style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" ${c.done ? 'checked' : ''} disabled style="accent-color:var(--accent-emerald)">
              <span>${c.task}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `, { size: 'md' });
  });
}
