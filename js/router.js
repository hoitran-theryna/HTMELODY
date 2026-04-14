// ============================================
// ERP SYSTEM - SPA ROUTER
// ============================================

import auth from './auth.js';

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.container = null;
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  setContainer(el) { this.container = el; }

  register(path, handler, title) {
    this.routes[path] = { handler, title };
  }

  navigate(path) {
    window.location.hash = path;
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const route = this.routes[hash];

    if (!route) {
      if (auth.isLoggedIn()) this.navigate('dashboard');
      else this.navigate('login');
      return;
    }

    // Check login state
    if (hash !== 'login' && !auth.isLoggedIn()) {
      this.navigate('login');
      return;
    }
    
    // Prevent logged-in users from seeing the login page
    if (hash === 'login' && auth.isLoggedIn()) {
      this.navigate('dashboard');
      return;
    }

    // Check permissions
    if (hash !== 'login' && hash !== 'dashboard' && !auth.hasAccess(hash)) {
      this.navigate('dashboard');
      return;
    }

    this.currentRoute = hash;

    if (this.container) {
      this.container.classList.add('page-exit');
      setTimeout(() => {
        // Clone element để xóa sạch toàn bộ accumulated event listeners
        const fresh = this.container.cloneNode(false);
        this.container.parentNode.replaceChild(fresh, this.container);
        this.container = fresh;

        this.container.classList.remove('page-exit');
        this.container.classList.add('page-enter');

        try {
          route.handler(this.container);
        } catch(e) {
          console.error(`Error rendering route ${hash}:`, e);
          this.container.innerHTML = `<div class="empty-state">
            <h3 style="color:var(--accent-rose)">Lỗi tải module</h3>
            <p>Module này đang được cập nhật hoặc có lỗi xảy ra.</p>
          </div>`;
        }

        setTimeout(() => this.container.classList.remove('page-enter'), 300);
      }, 150);
    }

    // Update active nav, breadcrumb, và bottom tabs
    setTimeout(() => {
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.route === hash);
      });
      const breadcrumb = document.getElementById('breadcrumb-current');
      if (breadcrumb) breadcrumb.textContent = route.title || hash;
      // Thông báo cho bottom tab bar sync (kể cả khi dùng back/forward browser)
      window.dispatchEvent(new CustomEvent('erp-route-changed', { detail: { route: hash } }));
    }, 50);
  }

  getCurrentRoute() { return this.currentRoute; }
  getRouteTitle(path) { return this.routes[path]?.title || path; }
}

const router = new Router();
export default router;
