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
};

const PERMISSIONS = {
  dashboard:   { director: 'full', manager: 'production', sales: 'sales', accountant: 'finance', staff: 'personal' },
  orders:      { director: 'full', manager: 'full', sales: 'full', accountant: 'view', staff: 'view' },
  production:  { director: 'full', manager: 'full', sales: 'none', accountant: 'none', staff: 'view' },
  events:      { director: 'full', manager: 'full', sales: 'view', accountant: 'none', staff: 'view' },
  hr:          { director: 'full', manager: 'view', sales: 'none', accountant: 'none', staff: 'none' },
  attendance:  { director: 'full', manager: 'department', sales: 'personal', accountant: 'personal', staff: 'personal' },
  payroll:     { director: 'full', manager: 'none', sales: 'personal', accountant: 'full', staff: 'personal' },
  debts:       { director: 'full', manager: 'view', sales: 'view', accountant: 'full', staff: 'none' },
  fund:        { director: 'full', manager: 'none', sales: 'none', accountant: 'full', staff: 'none' },
  tax:         { director: 'full', manager: 'none', sales: 'none', accountant: 'full', staff: 'none' },
  assets:      { director: 'full', manager: 'full', sales: 'none', accountant: 'view', staff: 'view' },
  reports:     { director: 'full', manager: 'production', sales: 'sales', accountant: 'finance', staff: 'none' },
  contracts:   { director: 'full', manager: 'none', sales: 'none', accountant: 'full', staff: 'none' },
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
