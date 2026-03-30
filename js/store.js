// ============================================
// ERP SYSTEM - STATE MANAGEMENT (Store - 100% Supabase Sync)
// ============================================

import { supabase } from './supabase.js';
import { showToast } from './components/toast.js';

class Store {
  constructor() {
    this.listeners = {};
    this.state = {
      employees: [],
      departments: [],
      customers: [],
      orders: [],
      production: [],
      events: [],
      debts: [],
      funds: [],
      taxes: [],
      assets: [],
      attendance: [],
      contracts: [],
      currentUser: null,
    };
    this.tables = {
       employees: 'employees',
       departments: 'departments',
       customers: 'customers',
       orders: 'orders',
       production: 'production',
       events: 'events',
       debts: 'debts',
       funds: 'fund',
       assets: 'assets',
       attendance: 'attendance',
       taxes: 'taxes',
       contracts: 'contracts'
    };
  }

  // Khởi tạo cửa hàng dữ liệu từ Supabase Cloud
  async initStore() {
    try {
      console.log("Đang đồng bộ dữ liệu 100% từ Supabase...");
      
      const tableNames = Object.keys(this.tables);
      
      // Kéo toàn bộ dữ liệu từ các bảng về RAM để hiển thị siêu tốc
      for (const key of tableNames) {
         const dbTable = this.tables[key];
         let { data, error } = await supabase.from(dbTable).select('*');
         
         if (error) {
            console.warn(`Không thể kéo bảng ${dbTable}:`, error.message);
            continue;
         }
         
         if (data) {
            this.state[key] = data;
         }
      }
      
      this.emit('*', this.state);
      return true;
    } catch(err) {
      console.error("Lỗi Khởi tạo Supabase:", err);
      showToast("Lỗi kết nối CSDL Cloud!", "error");
      return false;
    }
  }

  get(key) { return this.state[key] || []; }
  
  set(key, value) { 
     this.state[key] = value; 
     this.emit(key, value); 
  }

  getById(collection, id) { return this.state[collection]?.find(item => item.id === id); }

  // THÊM: Đợi Supabase lưu xong mới cập nhật UI (Đảm bảo an toàn 100%)
  async add(collection, item) {
    const dbTable = this.tables[collection];
    if (!dbTable) return null;

    try {
       const { data, error } = await supabase.from(dbTable).insert(item).select();
       
       if (error) throw error;
       
       // Cập nhật RAM State sau khi Cloud báo OK
       const newItem = data[0] || item;
       if (!this.state[collection]) this.state[collection] = [];
       this.state[collection].push(newItem);
       
       this.emit(collection, this.state[collection]);
       showToast("Đã lưu dữ liệu lên Supabase", "success");
       return newItem;
    } catch (err) {
       console.error("Lỗi thêm dữ liệu:", err);
       showToast("Lưu thất bại: " + err.message, "error");
       return null;
    }
  }

  // SỬA: Đợi Supabase xác nhận cập nhật thành công
  async update(collection, id, updates) {
    const dbTable = this.tables[collection];
    if (!dbTable) return null;

    try {
       const { error } = await supabase.from(dbTable).update(updates).eq('id', id);
       
       if (error) throw error;
       
       // Cập nhật RAM State
       const idx = this.state[collection]?.findIndex(item => item.id === id);
       if (idx !== -1) {
          this.state[collection][idx] = { ...this.state[collection][idx], ...updates };
       }
       
       this.emit(collection, this.state[collection]);
       showToast("Đã cập nhật dữ liệu Cloud", "success");
       return true;
    } catch (err) {
       console.error("Lỗi cập nhật dữ liệu:", err);
       showToast("Cập nhật thất bại: " + err.message, "error");
       return false;
    }
  }

  // XÓA: Đợi Supabase xác nhận xóa thành công
  async remove(collection, id) {
    const dbTable = this.tables[collection];
    if (!dbTable) return;

    try {
       const { error } = await supabase.from(dbTable).delete().eq('id', id);
       
       if (error) throw error;
       
       // Cập nhật RAM State
       this.state[collection] = this.state[collection]?.filter(item => item.id !== id);
       
       this.emit(collection, this.state[collection]);
       showToast("Đã xóa vĩnh viễn trên Supabase", "success");
    } catch (err) {
       console.error("Lỗi xóa dữ liệu:", err);
       showToast("Xóa thất bại: " + err.message, "error");
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => { this.listeners[event] = this.listeners[event].filter(cb => cb !== callback); };
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
    (this.listeners['*'] || []).forEach(cb => cb(event, data));
  }

  // Nút khẩn cấp: Xóa cache và reload ứng dụng
  reset() {
    location.reload();
  }

  getEmployeeName(id) { return this.getById('employees', id)?.name || 'N/A'; }
  getDepartmentName(id) { return this.getById('departments', id)?.name || 'N/A'; }
  getEmployee(id) { return this.getById('employees', id); }

  generateId(prefix) {
    const items = Object.values(this.state).flat().filter(i => i?.id?.toString().startsWith(prefix));
    const max = items.reduce((m, i) => { const n = parseInt(i.id.replace(prefix, '').replace('-', '')) || 0; return n > m ? n : m; }, 0);
    return `${prefix}-${String(max + 1).padStart(2, '0')}`;
  }
}

const store = new Store();
export default store;
