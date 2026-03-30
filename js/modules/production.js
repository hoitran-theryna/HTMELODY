// ============================================
// ERP SYSTEM - PRODUCTION MODULE (LED NEON)
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { getInitials, formatDate } from '../utils.js';

const STEPS = [
  { id: 'preparing', label: 'Cắt Mica/Vẽ file', color: '#f59e0b' },
  { id: 'uong_ong', label: 'Đang uốn ống', color: '#8b5cf6' },
  { id: 'lap_rap', label: 'Vô điện & Lắp ráp', color: '#3b82f6' },
  { id: 'dong_goi', label: 'QC & Đóng gói', color: '#10b981' },
];

export default function renderProduction(container) {
  const productionTasks = store.get('production');
  const orders = store.get('orders');
  const perm = auth.getPermission('production');

  // Lọc lấy các đơn hàng neon đang cần sản xuất
  const neonOrders = orders.filter(o => o.type === 'neon' && ['approved', 'producing'].includes(o.status));

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Tiến độ Sản xuất LED Neon</h1>
        <p>Bảng Kanban theo dõi các khâu gia công biển hiệu LED</p>
      </div>
    </div>

    <div class="kanban-board" id="prod-kanban">
      ${STEPS.map(step => {
    const stepTasks = productionTasks.filter(t => t.step === step.id);
    return `
        <div class="kanban-column" data-step="${step.id}">
          <div class="kanban-column-header">
            <div class="kanban-column-title">
              <span style="width:10px;height:10px;border-radius:50%;background:${step.color}"></span>
              ${step.label}
              <span class="kanban-count">${stepTasks.length}</span>
            </div>
          </div>
          <div class="kanban-column-body" data-step="${step.id}">
            ${stepTasks.map(task => renderProdCard(task, orders)).join('')}
          </div>
        </div>`;
  }).join('')}
    </div>
  `;

  // Drag and drop Kanban logic
  if (perm === 'full' || perm === 'view') { // Nếu Staff thì có quyền kéo thả hoặc ít nhất quản lý
    initKanbanDnd(container, STEPS);
  }
}

function renderProdCard(task, orders) {
  const order = orders.find(o => o.id === task.orderId);
  const assignee = store.getEmployee(task.assignee);

  if (!order) {
    return `<div class="kanban-card" data-id="${task.id}" draggable="true">
      <div style="font-size:var(--font-size-xs);font-family:var(--font-mono);color:var(--text-muted);margin-bottom:4px">${task.orderId || task.id}</div>
      <div class="kanban-card-title">${task.title || task.name || 'Công việc sản xuất'}</div>
      ${task.notes ? `<div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:4px">${task.notes}</div>` : ''}
      <div class="kanban-card-meta" style="margin-top:8px">
        <span style="font-size:11px;color:var(--accent-amber)">⚠ Đơn hàng đã xóa</span>
        <div class="avatar avatar-sm" style="background:${assignee?.avatar || '#3b82f6'};width:24px;height:24px;font-size:10px" title="${assignee?.name || ''}">
          ${getInitials(assignee?.name || '?')}
        </div>
      </div>
    </div>`;
  }

  return `<div class="kanban-card" data-id="${task.id}" draggable="true">
    <div style="font-size:var(--font-size-xs);font-family:var(--font-mono);color:var(--text-muted);margin-bottom:4px">${order.id}</div>
    <div class="kanban-card-title">${order.title}</div>
    <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:4px;margin-bottom:8px">KT: ${order.size} | ${order.color}</div>
    
    <div class="kanban-card-meta">
      <div style="display:flex;align-items:center;gap:6px">
        <span class="kanban-card-deadline" style="color:var(--accent-rose)">⏳ ${formatDate(order.deadline)}</span>
      </div>
      <div class="avatar avatar-sm" style="background:${assignee?.avatar || '#3b82f6'};width:24px;height:24px;font-size:10px" title="${assignee?.name || ''}">
        ${getInitials(assignee?.name || '?')}
      </div>
    </div>
  </div>`;
}

function initKanbanDnd(container, STEPS) {
  const board = document.getElementById('prod-kanban');
  let draggedCard = null;

  board.addEventListener('dragstart', e => {
    const card = e.target.closest('.kanban-card');
    if (!card) return;
    draggedCard = card;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  board.addEventListener('dragend', e => {
    if (draggedCard) draggedCard.classList.remove('dragging');
    draggedCard = null;
    document.querySelectorAll('.kanban-column-body').forEach(b => b.style.background = '');
  });

  board.addEventListener('dragover', e => {
    e.preventDefault();
    const body = e.target.closest('.kanban-column-body');
    if (body) body.style.background = 'rgba(255,255,255,0.03)';
  });

  board.addEventListener('dragleave', e => {
    const body = e.target.closest('.kanban-column-body');
    if (body) body.style.background = '';
  });

  board.addEventListener('drop', async e => {
    e.preventDefault();
    const body = e.target.closest('.kanban-column-body');
    if (body && draggedCard) {
      const taskId = draggedCard.dataset.id;
      const newStep = body.dataset.step;

      // 1. Optimistic UI: Di chuyển card ngay lập tức trong DOM
      draggedCard.classList.remove('dragging');
      body.appendChild(draggedCard);

      // 2. Cập nhật dữ liệu lên Cloud
      try {
        const success = await store.update('production', taskId, { step: newStep });

        if (success) {
          const stepName = STEPS.find(s => s.id === newStep)?.label;
          showToast(`Đã chuyển sang khâu "${stepName}"`, 'success');

          // 3. Re-render toàn bộ board để cập nhật số lượng (counts) và thứ tự
          renderProduction(container);
        } else {
          // Re-render để trả card về chỗ cũ nếu lỗi
          renderProduction(container);
        }
      } catch (err) {
        console.error("Lỗi khi kéo thả:", err);
        showToast("Lỗi khi cập nhật trạng thái!", "error");
        renderProduction(container);
      }
    }
  });
}
