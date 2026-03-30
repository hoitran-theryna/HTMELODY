// ============================================
// ERP SYSTEM - MAIN APPLICATION (LED Neon)
// ============================================

import './css-loader.js';
import auth from './auth.js';
import router from './router.js';
import store from './store.js';
import { renderSidebar } from './components/sidebar.js';
import { renderHeader, startClock, initHeaderEvents } from './components/header.js';
import { ICONS } from './components/icons.js';
import { showToast } from './components/toast.js';

// Import modules
import renderDashboard from './modules/dashboard.js';
import renderOrders from './modules/orders.js';
import renderContracts from './modules/contracts.js';
import renderProduction from './modules/production.js';
import renderEvents from './modules/events.js';
import renderHR from './modules/hr.js';
import renderAttendance from './modules/attendance.js';
import renderPayroll from './modules/payroll.js';
import renderDebts from './modules/debts.js';
import renderFund from './modules/fund.js';
import renderTax from './modules/tax.js';
import renderAssets from './modules/assets.js';
import renderReports from './modules/reports.js';

// Register routes
router.register('dashboard', renderDashboard, 'Bảng Điều khiển');
router.register('orders', renderOrders, 'Quản lý Đơn hàng');
router.register('contracts', renderContracts, 'Biểu Mẫu Hợp Đồng');
router.register('production', renderProduction, 'Tiến độ Sản xuất');
router.register('events', renderEvents, 'Tổ chức Sự kiện');
router.register('hr', renderHR, 'Nhân sự');
router.register('attendance', renderAttendance, 'Chấm công');
router.register('payroll', renderPayroll, 'Lương & Phụ cấp');
router.register('debts', renderDebts, 'Công nợ');
router.register('fund', renderFund, 'Sổ Quỹ');
router.register('tax', renderTax, 'Thuế nội bộ');
router.register('assets', renderAssets, 'Tài sản & Vật tư');
router.register('reports', renderReports, 'Báo cáo Tài chính');
router.register('login', showLogin, 'Đăng nhập');

const app = document.getElementById('app');

function showLogin() {
  renderLoginPage();
}

function renderLoginPage() {
  app.innerHTML = `
    <div class="login-screen">
      <div class="login-card" style="max-width:400px">
        <div class="login-logo">
          <div class="login-logo-icon" style="background:linear-gradient(135deg, #10b981, #06b6d4)">
            ${ICONS.zap}
          </div>
          <h1>LED & EVENTS</h1>
          <p>Hệ thống Quản lý ERP Chuyên dụng</p>
        </div>
        <div class="login-form">
          <div class="form-group">
            <label class="form-label">Tên đăng nhập</label>
            <input type="text" id="login-username" class="form-input" placeholder="VD: giamdoc" autofocus />
          </div>
          <div class="form-group" style="margin-top:16px">
            <label class="form-label">Mật khẩu</label>
            <input type="password" id="login-password" class="form-input" placeholder="Nhập mật khẩu" />
          </div>
          <button class="btn btn-primary btn-lg" id="login-btn" style="width:100%;margin-top:24px;justify-content:center">
            Đăng nhập
          </button>
        </div>
        <div style="margin-top:24px;background:var(--bg-tertiary);padding:16px;border-radius:var(--radius-lg);font-size:var(--font-size-xs)">
          <div style="font-weight:600;margin-bottom:8px">Tài khoản Demo (MK: 1):</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <div>• <strong style="color:var(--text-primary)">giamdoc</strong></div>
            <div>• <strong style="color:var(--text-primary)">ketoan</strong></div>
            <div>• <strong style="color:var(--text-primary)">quanly</strong></div>
            <div>• <strong style="color:var(--text-primary)">kinhdoanh</strong></div>
            <div>• <strong style="color:var(--text-primary)">nhanvien</strong></div>
            <div>• <strong style="color:var(--text-primary)">sukien1</strong></div>
          </div>
        </div>
        <p style="text-align:center;margin-top:var(--space-lg);font-size:var(--font-size-xs);color:var(--text-muted)">
          © 2026 LED & Events ERP v2.0
        </p>
      </div>
    </div>
  `;

  const loginBtn = document.getElementById('login-btn');
  const userInp = document.getElementById('login-username');
  const passInp = document.getElementById('login-password');

  const doLogin = () => {
    const user = userInp.value.trim();
    const pass = passInp.value.trim();
    if (!user || !pass) return;

    loginBtn.innerHTML = '<span class="spinner spinner-sm"></span> Đang xử lý...';
    loginBtn.disabled = true;

    setTimeout(() => {
      if (auth.login(user, pass)) {
        showToast(`Xin chào, ${auth.getUser().name}!`, 'success');
        renderMainApp();
        router.navigate('dashboard');
      } else {
        showToast('Sai tên đăng nhập hoặc mật khẩu!', 'error');
        loginBtn.innerHTML = 'Đăng nhập';
        loginBtn.disabled = false;
        passInp.value = '';
        passInp.focus();
      }
    }, 600);
  };

  loginBtn.addEventListener('click', doLogin);
  passInp.addEventListener('keypress', e => e.key === 'Enter' && doLogin());
}

function renderMainApp() {
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-wrapper">
      ${renderHeader()}
      <main class="main-content" id="main-content"></main>
    </div>
  `;

  router.setContainer(document.getElementById('main-content'));
  startClock();
  initHeaderEvents();

  // Sidebar navigation
  document.querySelectorAll('.nav-item[data-route]').forEach(item => {
    item.addEventListener('click', () => {
      router.navigate(item.dataset.route);
    });
  });

  // Logout
  document.getElementById('sidebar-user-area')?.addEventListener('click', () => {
    if (confirm('Bạn có muốn đăng xuất?')) {
      auth.logout();
      renderLoginPage();
    }
  });

  // Handle initial route
  router.handleRoute();
}

// Initialize
async function init() {
  app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:var(--bg-primary);">
     <span class="spinner" style="width:40px;height:40px;border-width:4px"></span>
     <p style="margin-top:16px;color:var(--text-muted);font-size:14px">Đang kết nối Dữ liệu Mạng Nội Bộ (Supabase)...</p>
  </div>`;

  await store.initStore();

  if (auth.isLoggedIn()) {
    renderMainApp();
  } else {
    renderLoginPage();
  }
}

// DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
