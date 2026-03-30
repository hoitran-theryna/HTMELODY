// ============================================
// ERP SYSTEM - MOCK DATA (LED Neon & Event)
// ============================================

const DEPARTMENTS = [
  { id: 'D01', name: 'Ban Giám đốc', color: '#8b5cf6' },
  { id: 'D02', name: 'Phòng Kế toán', color: '#f59e0b' },
  { id: 'D03', name: 'Xưởng Sản xuất', color: '#10b981' },
  { id: 'D04', name: 'Phòng Kinh doanh', color: '#3b82f6' },
  { id: 'D05', name: 'Đội Sự kiện', color: '#ec4899' },
];

const EMPLOYEES = [
  { id: 'E01', username: 'giamdoc', password: '1', name: 'Trần Văn Sếp', email: 'giamdoc@ledneon.vn', phone: '0901234567', department: 'D01', position: 'Giám đốc', role: 'director', salary: 45000000, joinDate: '2020-01-15', status: 'active', avatar: '#8b5cf6' },
  { id: 'E02', username: 'ketoan', password: '1', name: 'Lê Thị Tiền', email: 'ketoan@ledneon.vn', phone: '0912345678', department: 'D02', position: 'Kế toán trưởng', role: 'accountant', salary: 25000000, joinDate: '2020-03-01', status: 'active', avatar: '#f59e0b' },
  { id: 'E03', username: 'quanly', password: '1', name: 'Phạm Minh Xưởng', email: 'quanly@ledneon.vn', phone: '0923456789', department: 'D03', position: 'Quản lý Sản xuất', role: 'manager', salary: 30000000, joinDate: '2020-06-15', status: 'active', avatar: '#10b981' },
  { id: 'E04', username: 'kinhdoanh', password: '1', name: 'Nguyễn Thị Sale', email: 'kinhdoanh@ledneon.vn', phone: '0934567890', department: 'D04', position: 'Trưởng phòng Sales', role: 'sales', salary: 20000000, joinDate: '2021-04-01', status: 'active', avatar: '#3b82f6' },
  { id: 'E05', username: 'nhanvien', password: '1', name: 'Vũ Văn Thợ', email: 'thouon@ledneon.vn', phone: '0945678901', department: 'D03', position: 'Thợ uốn Neon', role: 'staff', salary: 15000000, joinDate: '2022-05-01', status: 'active', avatar: '#64748b' },
  { id: 'E06', username: 'tho2', password: '1', name: 'Bùi Đức Cắt', email: 'thocat@ledneon.vn', phone: '0956789012', department: 'D03', position: 'Thợ thi công CNC', role: 'staff', salary: 14000000, joinDate: '2022-08-10', status: 'active', avatar: '#64748b' },
  { id: 'E07', username: 'sukien1', password: '1', name: 'Hoàng Ánh Sáng', email: 'anhsang@ledneon.vn', phone: '0967890123', department: 'D05', position: 'Kỹ thuật Ánh sáng', role: 'staff', salary: 18000000, joinDate: '2021-02-15', status: 'active', avatar: '#ec4899' },
  { id: 'E08', username: 'sukien2', password: '1', name: 'Ngô Âm Thanh', email: 'amthanh@ledneon.vn', phone: '0978901234', department: 'D05', position: 'Kỹ thuật Âm thanh', role: 'staff', salary: 18000000, joinDate: '2021-03-20', status: 'active', avatar: '#ec4899' }
];

const CUSTOMERS = [
  { id: 'C01', name: 'Cà phê The Retro', contact: 'Anh Hải', phone: '0988111222', type: 'F&B', typeGroup: 'retail', address: 'Quận 1, TP.HCM' },
  { id: 'C02', name: 'Công ty Sự kiện XYZ', contact: 'Chị Lan', phone: '0977222333', type: 'Agency', typeGroup: 'business', address: 'Quận 3, TP.HCM' },
  { id: 'C03', name: 'Bar club Vibe', contact: 'Anh Vũ', phone: '0966333444', type: 'Nightlife', typeGroup: 'retail', address: 'Quận 1, TP.HCM' },
  { id: 'C04', name: 'Studio Cưới ABC', contact: 'Chị Mai', phone: '0955444555', type: 'Studio', typeGroup: 'business', address: 'Quận Phú Nhuận, TP.HCM' },
];

const ORDERS = [
  { id: 'OD-2601', type: 'neon', customerId: 'C01', title: 'Biển Neon "Good Vibes Only"', size: '120x60cm', stringLength: '5m', color: 'Hồng + Xanh blue', price: 3500000, status: 'producing', createdAt: '2026-03-25', deadline: '2026-03-30' },
  { id: 'OD-2602', type: 'neon', customerId: 'C03', title: 'Biển logo Vibe Club', size: '200x100cm', stringLength: '12m', color: 'Đỏ', price: 8500000, status: 'done', createdAt: '2026-03-20', deadline: '2026-03-26' },
  { id: 'OD-2603', type: 'event', customerId: 'C02', title: 'Setup Lễ ra mắt sản phẩm XYZ', size: 'Sân khấu 10x5m', equipment: 'Màn LED, Ánh sáng moving head, Loa line array', price: 45000000, status: 'approved', createdAt: '2026-03-28', deadline: '2026-04-10' },
  { id: 'OD-2604', type: 'neon', customerId: 'C04', title: 'Chữ Neon "Marry Me"', size: '80x30cm', stringLength: '3m', color: 'Trắng ấm', price: 1800000, status: 'delivered', createdAt: '2026-03-15', deadline: '2026-03-18' },
];

const PRODUCTION = [
  { id: 'PR-01', orderId: 'OD-2601', step: 'uong_ong', assignee: 'E05', progress: 50, note: 'Khách muốn màu hồng cánh sen' },
  { id: 'PR-02', orderId: 'OD-2602', step: 'dong_goi', assignee: 'E06', progress: 100, note: 'Đã bọc foam chống sốc kĩ' },
];

const EVENTS = [
  { id: 'EV-01', orderId: 'OD-2603', title: 'Setup Lễ ra mắt sản phẩm XYZ', date: '2026-04-10', location: 'Khách sạn InterContinental', team: ['E07', 'E08'], status: 'preparing', checklist: [{task: 'Kiểm tra loa', done: true}, {task: 'Test màn LED', done: false}] }
];

const DEBTS = [
  { id: 'DB-01', type: 'receivable', partnerId: 'C01', sourceId: 'OD-2601', totalAmount: 3500000, paidAmount: 1500000, dueDate: '2026-03-30', status: 'partial' },
  { id: 'DB-02', type: 'receivable', partnerId: 'C02', sourceId: 'OD-2603', totalAmount: 45000000, paidAmount: 22000000, dueDate: '2026-04-12', status: 'partial' },
  { id: 'DB-03', type: 'payable', partnerName: 'NPP Vật tư LED Neon X', sourceId: 'Nhập hàng tháng 3', totalAmount: 12500000, paidAmount: 0, dueDate: '2026-04-05', status: 'unpaid' },
];

const FUNDS = [
  { id: 'FD-01', date: '2026-03-25', account: 'bank', type: 'in', amount: 1500000, category: 'Khách cọc', description: 'C01 cọc biển Good Vibes', refId: 'OD-2601' },
  { id: 'FD-02', date: '2026-03-28', account: 'bank', type: 'in', amount: 22000000, category: 'Khách cọc', description: 'C02 cọc event ra mắt', refId: 'OD-2603' },
  { id: 'FD-03', date: '2026-03-15', account: 'cash', type: 'out', amount: 2000000, category: 'Mua vật tư', description: 'Mua bổ sung mica trong', refId: '' },
  { id: 'FD-04', date: '2026-03-18', account: 'bank', type: 'in', amount: 1800000, category: 'Thanh toán', description: 'C04 thanh toán đủ', refId: 'OD-2604' },
];

const TAXES = [
  { id: 'TX-01', period: '03-2026', type: 'vat', amount: 3500000, status: 'pending', deadline: '2026-04-20', note: 'VAT đầu ra tháng 3' },
  { id: 'TX-02', period: '03-2026', type: 'tncn', amount: 1200000, status: 'paid', deadline: '2026-04-20', note: 'Khấu trừ lương tháng 3' }
];

const ASSETS = [
  { id: 'AST-01', type: 'material', name: 'Dây LED Neon 12V Trắng ấm', unit: 'Cuộn 50m', quantity: 12, price: 800000 },
  { id: 'AST-02', type: 'material', name: 'Tấm Mica trong 3mm', unit: 'Tấm (122x244)', quantity: 20, price: 650000 },
  { id: 'AST-03', type: 'equipment', name: 'Loa Line Array Active', unit: 'Cái', quantity: 8, price: 15000000 },
  { id: 'AST-04', type: 'equipment', name: 'Đèn Moving Head Beam', unit: 'Cái', quantity: 12, price: 4500000 },
];

function generateAttendance() {
  const records = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  for (let day = 1; day <= Math.min(today.getDate(), 28); day++) {
    EMPLOYEES.filter(e => e.status === 'active' && e.role === 'staff').forEach(emp => {
      const isWeekend = [0].includes(new Date(year, month, day).getDay()); // Chủ nhật nghỉ
      if (isWeekend) return;
      records.push({ employeeId: emp.id, date: `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`, checkIn: '08:00', checkOut: '17:30', status: 'on-time' });
    });
  }
  return records;
}

export {
  DEPARTMENTS, EMPLOYEES, CUSTOMERS, ORDERS, PRODUCTION, EVENTS,
  DEBTS, FUNDS, TAXES, ASSETS, generateAttendance
};
