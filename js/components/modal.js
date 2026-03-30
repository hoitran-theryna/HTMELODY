// ============================================
// ERP SYSTEM - MODAL COMPONENT
// ============================================

export function showModal(title, content, options = {}) {
  const { size = '', onClose, footer } = options;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal ${size ? 'modal-' + size : ''}">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" id="modal-close-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">${typeof content === 'string' ? content : ''}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>
  `;

  if (typeof content !== 'string') {
    overlay.querySelector('.modal-body').appendChild(content);
  }

  const close = () => {
    overlay.style.animation = 'fade-out 0.2s ease-in forwards';
    setTimeout(() => { overlay.remove(); if (onClose) onClose(); }, 200);
  };

  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
  });

  document.body.appendChild(overlay);
  return { close, overlay, body: overlay.querySelector('.modal-body'), footerEl: overlay.querySelector('.modal-footer') };
}

export function confirmModal(title, message) {
  return new Promise((resolve) => {
    const footer = `<button class="btn btn-secondary" id="confirm-cancel">Hủy</button><button class="btn btn-primary" id="confirm-ok">Xác nhận</button>`;
    const modal = showModal(title, `<p style="color:var(--text-secondary)">${message}</p>`, { footer });
    modal.overlay.querySelector('#confirm-cancel').addEventListener('click', () => { modal.close(); resolve(false); });
    modal.overlay.querySelector('#confirm-ok').addEventListener('click', () => { modal.close(); resolve(true); });
  });
}
