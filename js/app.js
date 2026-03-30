// ============================================
// ERP SYSTEM - MAIN APPLICATION (LED Neon)
// ============================================

import './css-loader.js';
import auth from './auth.js';
import router from './router.js';
import store from './store.js';
import { renderSidebar } from './components/sidebar.js';
import { renderHeader, startClock, initHeaderEvents } from './components/header.js';
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
import renderCustomers from './modules/customers.js';

// Register routes
router.register('dashboard', renderDashboard, 'Bảng Điều khiển');
router.register('orders', renderOrders, 'Quản lý Đơn hàng');
router.register('customers', renderCustomers, 'Khách hàng');
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
          <img src="/logo.png" alt="Landlight Art" style="width:110px;height:110px;border-radius:16px;object-fit:cover;box-shadow:0 8px 32px rgba(0,100,255,0.3);margin-bottom:4px" />
          <h1>Landlight Art</h1>
          <p>Hệ thống ERP — LED & Tổ chức sự kiện</p>
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
            <div>• <strong style="color:var(--text-primary)">giamdoc2</strong> (Mới)</div>
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
  app.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100vh;background:var(--bg-primary);position:fixed;top:0;left:0;z-index:9999;">
     <img src="/logo.png" alt="Landlight Art" style="width:90px;height:90px;border-radius:16px;object-fit:cover;margin-bottom:16px;box-shadow:0 0 30px rgba(0,100,255,0.4)" />
     <h1 style="background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:24px;font-weight:800;margin-bottom:8px">Landlight Art</h1>
     <div style="display:flex;align-items:center;gap:10px;color:var(--text-muted);font-size:14px;margin-top:12px">
        <span class="spinner spinner-sm"></span>
        <span>Đang đồng bộ dữ liệu Cloud...</span>
     </div>
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
