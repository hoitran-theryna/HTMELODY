// ============================================
// ERP SYSTEM - AUTHENTICATION & ROLES
// ============================================

import store from './store.js';

const ROLES = {
  director: { name: 'Giám đốc', level: 5, icon: 'crown' },
  manager: { name: 'Quản lý Sản xuất', level: 4, icon: 'briefcase' },
  sales: { name: 'Kinh doanh', level: 3, icon: 'users' },
  accountant: { name: 'Kế toán', level: 4, icon: 'calculator' },
  staff: { name: 'Nhân viên Xưởng', level: 1, icon: 'user' },
  event: { name: 'Event Director', level: 3, icon: 'speaker' },
};

const PERMISSIONS = {
  dashboard:   { director: 'full', manager: 'production', sales: 'sales', event: 'view', accountant: 'finance', staff: 'personal' },
  orders:      { director: 'full', manager: 'full', sales: 'full', event: 'full', accountant: 'view', staff: 'view' },
  production:  { director: 'full', manager: 'full', sales: 'view', event: 'view', accountant: 'none', staff: 'view' },
  events:      { director: 'full', manager: 'full', sales: 'view', event: 'full', accountant: 'none', staff: 'view' },
  hr:          { director: 'full', manager: 'view', sales: 'none', event: 'none', accountant: 'none', staff: 'none' },
  attendance:  { director: 'full', manager: 'department', sales: 'personal', event: 'personal', accountant: 'personal', staff: 'personal' },
  payroll:     { director: 'full', manager: 'none', sales: 'personal', event: 'personal', accountant: 'full', staff: 'personal' },
  debts:       { director: 'full', manager: 'view', sales: 'view', event: 'view', accountant: 'full', staff: 'none' },
  fund:        { director: 'full', manager: 'none', sales: 'none', event: 'none', accountant: 'full', staff: 'none' },
  tax:         { director: 'full', manager: 'none', sales: 'none', event: 'none', accountant: 'full', staff: 'none' },
  assets:      { director: 'full', manager: 'view', sales: 'none', event: 'view', accountant: 'view', staff: 'view' },
  reports:     { director: 'full', manager: 'production', sales: 'sales', event: 'view', accountant: 'finance', staff: 'none' },
  contracts:   { director: 'full', manager: 'view', sales: 'view', event: 'none', accountant: 'view', staff: 'none' },
  customers:   { director: 'full', manager: 'full', sales: 'full', event: 'view', accountant: 'view', staff: 'none' },
};

class Auth {
  constructor() {
    this.currentUser = null;
    this.currentRole = null;
  }

  login(username, password) {
    const users = store.get('employees');
    const user = users.find(u => u.username === username && u.password === password && u.status === 'active');
    
    if (!user) return false;
    
    this.currentUser = user;
    this.currentRole = user.role;
    store.set('currentUser', user);
    return true;
  }

  logout() {
    this.currentUser = null;
    this.currentRole = null;
    store.set('currentUser', null);
  }

  isLoggedIn() { return !!this.currentUser; }
  getUser() { return this.currentUser; }
  getRole() { return this.currentRole; }
  getRoleName() { return ROLES[this.currentRole]?.name || ''; }

  hasAccess(module) {
    if (!this.currentRole) return false;
    const perm = PERMISSIONS[module]?.[this.currentRole];
    return perm && perm !== 'none';
  }

  getPermission(module) {
    if (!this.currentRole) return 'none';
    return PERMISSIONS[module]?.[this.currentRole] || 'none';
  }

  getAccessibleModules() {
    return Object.keys(PERMISSIONS).filter(m => this.hasAccess(m));
  }
}

const auth = new Auth();
// Initialize auth from stored user if available
const savedUser = store.get('currentUser');
if (savedUser && !Array.isArray(savedUser)) {
   auth.currentUser = savedUser;
   auth.currentRole = savedUser.role;
}

export { auth, ROLES, PERMISSIONS };
export default auth;
