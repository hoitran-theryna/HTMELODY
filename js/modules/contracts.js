// ============================================
// ERP SYSTEM - CONTRACTS GENERATOR (HT MELODY FORM)
// ============================================

import store from '../store.js';
import auth from '../auth.js';
import { ICONS } from '../components/icons.js';
import { formatCurrency, formatFullCurrency } from '../utils.js';
import { showToast } from '../components/toast.js';

// Helper dịch số thành chữ Tiếng Việt chuẩn mực
function numberToWords(number) {
    if (number === 0) return 'Không đồng';
    const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    let str = Math.floor(number).toString();
    while (str.length % 3 !== 0) str = '0' + str;
    let res = '';
    for (let i = 0; i < str.length; i += 3) {
      const g = str.substring(i, i + 3);
      if (g === '000' && i !== 0) continue;
      const t = parseInt(g[0]), c = parseInt(g[1]), d = parseInt(g[2]);
      if (t !== 0 || i !== 0) res += digits[t] + ' trăm ';
      if (c === 0 && d !== 0 && (t !== 0 || i !== 0)) res += 'lẻ ';
      if (c === 1) res += 'mười ';
      if (c > 1) res += digits[c] + ' mươi ';
      if (d === 1 && c > 1) res += 'mốt ';
      else if (d === 5 && c > 0) res += 'lăm ';
      else if (d !== 0) res += digits[d] + ' ';
      const pos = (str.length - i) / 3;
      if (pos === 4) res += 'tỷ ';
      if (pos === 3) res += 'triệu ';
      if (pos === 2) res += 'nghìn ';
    }
    res = res.trim() + ' đồng';
    return res.charAt(0).toUpperCase() + res.slice(1) + './.';
}

export default async function renderContracts(container) {
  const perm = auth.getPermission('contracts');
  if (perm === 'none') {
    container.innerHTML = `<div class="empty-state"><h3>Không có quyền truy cập</h3></div>`;
    return;
  }

  // Chỉ Giám đốc mới được soạn hợp đồng — các role khác xem danh sách chỉ đọc
  if (perm !== 'full') {
    const contracts = store.get('contracts');
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Hợp Đồng</h1>
          <p>Bạn chỉ có quyền xem danh sách hợp đồng. Liên hệ Giám đốc để soạn hợp đồng mới.</p>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Danh sách Hợp đồng</h3></div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Số HĐ</th>
                <th>Ngày soạn</th>
                <th>Tên Công ty Bên A</th>
                <th>Đại diện</th>
                <th>Tổng giá trị</th>
              </tr>
            </thead>
            <tbody>
              ${contracts.length === 0
                ? `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted)">Chưa có hợp đồng nào.</td></tr>`
                : contracts.map(c => {
                    const subTotal = (c.items || []).reduce((s, i) => s + ((i.qty || 0) * (i.price || 0)), 0);
                    const total = subTotal * (1 + (c.vat || 0) / 100);
                    return `<tr>
                      <td style="font-family:var(--font-mono);font-size:12px">${c.ctrNo || c.id}</td>
                      <td>${c.ctrDate || '—'}</td>
                      <td style="font-weight:500">${c.aName || '—'}</td>
                      <td>${c.aRep || '—'}</td>
                      <td style="font-weight:600;color:var(--accent-emerald)">${new Intl.NumberFormat('vi-VN').format(total)} đ</td>
                    </tr>`;
                  }).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
    return;
  }

  // 1. LẤY DỮ LIỆU TỪ SUPABASE (Thông qua Store)
  const contracts = store.get('contracts');
  
  // Nếu chưa có hợp đồng nào, tạo một bản nháp mới
  let currentContract = contracts.length > 0 ? contracts[0] : null;

  if (!currentContract) {
    const newDraft = {
       id: `CTR-${Date.now()}`,
       ctrNo: '01-12-2025-HDTC',
       ctrDate: new Date().toISOString().split('T')[0],
       aName: 'CÔNG TY CỔ PHẦN TRUYỀN THÔNG GIẢI TRÍ VERA',
       aTax: '4201644918',
       aPhone: '0932 509 199',
       aAdd: 'LK36 Lô 40 đường số 4, KĐT Mỹ Gia, Phường Nam Nha Trang, Tỉnh Khánh Hòa, Việt Nam',
       aRep: 'Bà TRẦN THỊ THIÊN THƯ',
       aRole: 'GIÁM ĐỐC',
       aBank: '8021144447979',
       items: [{ name: 'Sản phẩm 1', detail: 'Chi tiết...', unit: 'Cái', qty: 1, price: 0 }],
       vat: 10,
       advPct: 45,
       timeSetup: 'Chưa xác định',
       timeRun: 'Chưa xác định',
       timeAddr: 'Chưa xác định'
    };
    currentContract = await store.add('contracts', newDraft);
  }

  // KIỂM TRA LỖI KẾT NỐI BẢNG
  if (!currentContract) {
    container.innerHTML = `
      <div class="empty-state" style="padding:40px; text-align:center">
        <div style="font-size:48px; margin-bottom:20px">⚠️</div>
        <h3>Bảng 'contracts' chưa tồn tại trên Supabase</h3>
        <p style="color:var(--text-muted); margin-bottom:20px">Hệ thống Cloud không tìm thấy bảng dữ liệu để lưu hợp đồng.</p>
        <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:left; font-family:monospace; font-size:12px; border:1px solid var(--border-color)">
           Vui lòng chạy SQL Editor trên Supabase Dashboard:<br><br>
           <code>create table contracts (...);</code>
        </div>
        <button class="btn btn-primary" style="margin-top:20px" onclick="location.reload()">Thử lại (F5)</button>
      </div>
    `;
    return;
  }

  // 2. LOGIC TỰ ĐỘNG LƯU (AUTO-SAVE TO SUPABASE)
  let saveTimeout = null;
  const autoSave = () => {
     if (saveTimeout) clearTimeout(saveTimeout);
     saveTimeout = setTimeout(async () => {
        await store.update('contracts', currentContract.id, currentContract);
     }, 1500); // 1.5 giây sau khi ngừng gõ sẽ lưu
  };

  const reRender = () => {
     let subTotal = (currentContract.items || []).reduce((s, i) => s + ((i.qty || 0) * (i.price || 0)), 0);
     let vatAmount = subTotal * (currentContract.vat / 100);
     let totalAmount = subTotal + vatAmount;
     let dot1Amount = totalAmount * (currentContract.advPct / 100);
     let dot2Amount = totalAmount - dot1Amount;
     let dot2Pct = 100 - currentContract.advPct;

     container.innerHTML = `
        <div class="page-header">
           <div class="page-header-left">
              <h1>Biểu mẫu Hợp Đồng Cloud</h1>
              <p>Dữ liệu được lưu trữ 100% trên Supabase (Đã bật Auto-save)</p>
           </div>
           <div class="page-header-right">
              <button class="btn btn-primary" id="btn-export-word">
                 ${ICONS.report} Xuất Hợp đồng
              </button>
           </div>
        </div>

        <div class="contract-layout">
           <!-- THÔNG TIN KHÁCH HÀNG -->
           <div class="col-left">
              <div class="card" style="margin-bottom:24px">
                 <div class="card-header"><h3 style="color:var(--accent-blue)">BÊN A (KHÁCH HÀNG)</h3></div>
                 <div class="card-body">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                       <div class="form-group"><label class="form-label">Số Hợp đồng</label><input type="text" class="form-input sync-input" data-key="ctrNo" value="${currentContract.ctrNo}"></div>
                       <div class="form-group"><label class="form-label">Ngày soạn</label><input type="date" class="form-input sync-input" data-key="ctrDate" value="${currentContract.ctrDate}"></div>
                    </div>
                    <div class="form-group" style="margin-top:10px"><label class="form-label">Tên Công ty Bên A</label><input type="text" class="form-input sync-input" data-key="aName" value="${currentContract.aName}"></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
                       <div class="form-group"><label class="form-label">Mã số thuế</label><input type="text" class="form-input sync-input" data-key="aTax" value="${currentContract.aTax}"></div>
                       <div class="form-group"><label class="form-label">Điện thoại</label><input type="text" class="form-input sync-input" data-key="aPhone" value="${currentContract.aPhone}"></div>
                    </div>
                    <div class="form-group" style="margin-top:10px"><label class="form-label">Địa chỉ</label><input type="text" class="form-input sync-input" data-key="aAdd" value="${currentContract.aAdd}"></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
                       <div class="form-group"><label class="form-label">Đại diện</label><input type="text" class="form-input sync-input" data-key="aRep" value="${currentContract.aRep}"></div>
                       <div class="form-group"><label class="form-label">Chức vụ</label><input type="text" class="form-input sync-input" data-key="aRole" value="${currentContract.aRole}"></div>
                    </div>
                    <div class="form-group" style="margin-top:10px"><label class="form-label">Tài khoản Ngân hàng</label><input type="text" class="form-input sync-input" data-key="aBank" value="${currentContract.aBank}"></div>
                 </div>
              </div>

              <div class="card" style="margin-bottom:24px">
                 <div class="card-header"><h3 style="color:var(--accent-emerald)">NHÂN VIÊN KINH DOANH</h3></div>
                 <div class="card-body">
                    <div class="form-group">
                       <label class="form-label">Sale phụ trách hợp đồng</label>
                       <select class="form-select sync-input" data-key="salesId">
                          <option value="">-- Click chọn Sale --</option>
                          ${store.get('employees').filter(e=>e.role==='sales').map(e=>`<option value="${e.id}" ${currentContract.salesId===e.id?'selected':''}>${e.name}</option>`).join('')}
                       </select>
                    </div>
                 </div>
              </div>

              <div class="card">
                 <div class="card-header"><h3 style="color:var(--accent-amber)">DỰ KIẾN THỰC HIỆN</h3></div>
                 <div class="card-body">
                    <div class="form-group"><label class="form-label">Thời gian thi công</label><input type="text" class="form-input sync-input" data-key="timeSetup" value="${currentContract.timeSetup}"></div>
                    <div class="form-group" style="margin-top:10px"><label class="form-label">Thời gian Sự kiện</label><input type="text" class="form-input sync-input" data-key="timeRun" value="${currentContract.timeRun}"></div>
                    <div class="form-group" style="margin-top:10px"><label class="form-label">Địa điểm</label><input type="text" class="form-input sync-input" data-key="timeAddr" value="${currentContract.timeAddr}"></div>
                 </div>
              </div>
           </div>

           <!-- CHI TIẾT HẠNG MỤC -->
           <div class="col-right">
              <div class="card">
                 <div class="card-header" style="justify-content:space-between;display:flex;align-items:center;">
                    <h3 style="color:var(--accent-emerald)">CHI TIẾT BÁO GIÁ</h3>
                    <div style="display:flex;align-items:center;gap:12px;background:var(--bg-tertiary);padding:5px 15px;border-radius:8px">
                       <span style="font-weight:bold;font-size:14px">VAT:</span> 
                       <select class="form-select sync-input" data-key="vat" style="width:120px;height:38px;font-size:15px;font-weight:bold;color:var(--accent-emerald);">
                          <option value="0" ${currentContract.vat==0?'selected':''}>VAT 0%</option>
                          <option value="8" ${currentContract.vat==8?'selected':''}>VAT 8%</option>
                          <option value="10" ${currentContract.vat==10?'selected':''}>VAT 10%</option>
                       </select>
                    </div>
                 </div>
                 <div class="card-body" style="padding:0; overflow-x:auto;">
                    <table class="data-table" style="font-size:12px; width:100%; min-width:850px; border-collapse:collapse;">
                       <thead style="background:var(--bg-tertiary)">
                          <tr>
                            <th width="35">#</th>
                            <th style="text-align:left">Tên / Quy cách hạng mục</th>
                            <th width="85">ĐVT</th>
                            <th width="85">SL</th>
                            <th width="125">Đơn Giá</th>
                            <th width="135">Thành Tiền</th>
                            <th width="45">✕</th>
                          </tr>
                       </thead>
                       <tbody>
                          ${(currentContract.items || []).map((it, idx) => `
                             <tr>
                                <td align="center">${idx+1}</td>
                                <td style="padding: 10px;">
                                   <input type="text" class="form-input sync-arr" style="height:35px; font-weight:bold; margin-bottom:6px; width:100%; color:var(--text-primary); font-size:14px" data-idx="${idx}" data-prop="name" value="${it.name || ''}" placeholder="Tên chính">
                                   <textarea class="form-input sync-arr" style="font-size:12px; padding:8px; height:80px; width:100%; color:var(--text-primary);" data-idx="${idx}" data-prop="detail">${it.detail || ''}</textarea>
                                </td>
                                <td><input type="text" class="form-input sync-arr" style="width:100%; text-align:center; height:38px; color:var(--text-primary);" data-idx="${idx}" data-prop="unit" value="${it.unit || ''}"></td>
                                <td><input type="number" class="form-input sync-arr" style="width:100%; text-align:center; height:38px; color:var(--text-primary);" data-idx="${idx}" data-prop="qty" value="${it.qty || 0}"></td>
                                <td><input type="number" class="form-input sync-arr" style="width:100%; text-align:right; height:38px; color:var(--text-primary);" data-idx="${idx}" data-prop="price" value="${it.price || 0}"></td>
                                <td align="right" style="padding-right:12px;"><b>${formatCurrency((it.qty || 0) * (it.price || 0))}</b></td>
                                <td align="center">
                                   <button class="rm-row" data-idx="${idx}" style="background:#e11d48; color:white; border:none; border-radius:6px; width:34px; height:34px; cursor:pointer;">✕</button>
                                </td>
                             </tr>
                          `).join('')}
                          <tr><td colspan="7" style="padding:12px">
                             <button class="btn btn-secondary" id="btn-add-row" style="width:100%; height:45px; font-weight:bold;">+ THÊM HẠNG MỤC MỚI</button>
                          </td></tr>
                       </tbody>
                    </table>

                    <div style="padding:20px;background:var(--bg-tertiary);border-top:1px solid var(--border-color)">
                       <div style="display:flex;justify-content:space-between"><span>Tổng hạng mục:</span> <b>${formatFullCurrency(subTotal)}</b></div>
                       <div style="display:flex;justify-content:space-between"><span>Thuế VAT (${currentContract.vat}%):</span> <b>${formatFullCurrency(vatAmount)}</b></div>
                       <div style="display:flex;justify-content:space-between;font-size:18px;color:var(--accent-emerald);margin-top:12px;border-top:2px solid var(--border-color);padding-top:12px">
                          <span>TỔNG THANH TOÁN:</span> <b>${formatFullCurrency(totalAmount)}</b>
                       </div>
                    </div>
                 </div>
              </div>

              <div class="card" style="margin-top:24px">
                 <div class="card-body" style="background:rgba(59,130,246,0.05); border-left:4px solid var(--accent-blue); padding:15px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                       <span style="font-weight:bold; color:var(--accent-blue)">Đặt cọc Đợt 1 / Tạm ứng (%):</span>
                       <input type="number" class="form-input sync-input" data-key="advPct" value="${currentContract.advPct}" style="width:80px; text-align:center; color:var(--text-primary);">
                    </div>
                    <div style="font-size:14px;line-height:2.0">
                       <div style="display:flex;justify-content:space-between"><span>• Tạm ứng Đợt 1 (${currentContract.advPct}%):</span> <b>${formatFullCurrency(dot1Amount)}</b></div>
                       <div style="display:flex;justify-content:space-between"><span>• Thanh toán sau nghiệm thu (${dot2Pct}%):</span> <b>${formatFullCurrency(dot2Amount)}</b></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
     `;
     bindEvents(subTotal, vatAmount, totalAmount, dot1Amount, dot2Amount);
  };

  const bindEvents = (subTotal, vatAmount, totalAmount, dot1Amount, dot2Amount) => {
     container.querySelectorAll('.sync-input').forEach(el => {
        // SELECT: re-render ngay để cập nhật tính toán
        // INPUT/TEXTAREA: chỉ lưu data, re-render khi blur để tránh mất con trỏ
        el.addEventListener('input', e => {
           let val = e.target.value;
           if (['vat', 'advPct'].includes(e.target.dataset.key)) val = parseInt(val) || 0;
           currentContract[e.target.dataset.key] = val;
           autoSave();
           if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) reRender();
        });
        el.addEventListener('change', e => {
           if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) reRender();
        });
     });

     container.querySelectorAll('.sync-arr').forEach(el => {
        el.addEventListener('input', e => {
           let { idx, prop } = e.target.dataset;
           let val = e.target.value;
           if (['qty', 'price'].includes(prop)) val = parseFloat(val) || 0;
           currentContract.items[parseInt(idx)][prop] = val;
           autoSave();
           // Chỉ cập nhật ô THÀNH TIỀN tương ứng mà không reRender() toàn bộ
           const row = e.target.closest('tr');
           if (row) {
             const it = currentContract.items[parseInt(idx)];
             const totalCell = row.querySelector('td:nth-child(6) b');
             if (totalCell) {
               const { formatCurrency } = window.__erpUtils || {};
               // fallback: reRender khi blur
             }
           }
        });
        el.addEventListener('change', () => reRender());
     });

     container.querySelectorAll('.rm-row').forEach(el => {
        el.addEventListener('click', e => {
           currentContract.items.splice(parseInt(e.target.dataset.idx), 1);
           autoSave();
           reRender();
        });
     });

     container.querySelector('#btn-add-row')?.addEventListener('click', () => {
        currentContract.items.push({ name: '', detail: '', unit: 'Gói', qty: 1, price: 0 });
        autoSave();
        reRender();
     });

     container.querySelector('#btn-export-word')?.addEventListener('click', () => {
        const d = new Date(currentContract.ctrDate);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const formatTable = (v) => new Intl.NumberFormat('vi-VN').format(v);

        let trHTML = currentContract.items.map((it, idx) => `
           <tr style="text-align:center; vertical-align:top">
             <td style="border: 1px solid black; padding: 5px;">${idx+1}</td>
             <td style="border: 1px solid black; padding: 5px; text-align:left"><b>${it.name}</b></td>
             <td style="border: 1px solid black; padding: 5px; text-align:left">${it.detail.replace(/\n/g, '<br>')}</td>
             <td style="border: 1px solid black; padding: 5px;">${it.unit}</td>
             <td style="border: 1px solid black; padding: 5px;">${it.qty}</td>
             <td style="border: 1px solid black; padding: 5px; text-align:right">${formatTable(it.price)}</td>
             <td style="border: 1px solid black; padding: 5px; text-align:right">${formatTable(it.qty * it.price)}</td>
           </tr>
        `).join('');

        const wordTemplate = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset='utf-8'>
            <title>Hợp Đồng - ${currentContract.ctrNo}</title>
            <style>
               @page { size: A4; margin: 2cm 2cm 2cm 3cm; }
               body { font-family: "Times New Roman", Times, serif; font-size: 13pt; line-height: 1.5; color: black; }
               p { margin: 0 0 6pt 0; text-align: justify; text-indent: 0; }
               .indent-line { text-indent: 1.27cm; }
               .center { text-align: center; }
               .bold { font-weight: bold; }
               table { border-collapse: collapse; width: 100%; margin-bottom: 8pt; font-size: 13pt; color: black; }
               th { border: 1px solid black; padding: 6px; text-align: center; background-color: #f2f2f2; }
               .info-table td { border: none; padding: 1pt 0; vertical-align: top; }
            </style>
          </head>
          <body>
            <p class="center" style="font-weight: bold;"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b></p>
            <p class="center" style="font-weight: bold;"><b>ĐỘC LẬP – TỰ DO – HẠNH PHÚC</b></p>
            <p class="center" style="font-weight: bold;"><b>-------------</b></p>
            <br/>
            <p class="center" style="font-size: 16pt; font-weight: bold;"><b>HỢP ĐỒNG THI CÔNG</b></p>
            <p class="center" style="font-weight: bold;"><b>SỐ: ${currentContract.ctrNo}</b></p>
            <br/>

            <p>–\t<i>Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005 của Quốc hội nước Cộng hoà Xã hội Chủ nghĩa Việt Nam;</i></p>
            <p>–\t<i>Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015 của Quốc hội nước Cộng hoà Xã hội Chủ nghĩa Việt Nam;</i></p>
            <p>–\t<i>Căn cứ Luật Quảng cáo số 16/2012/QH13 ngày 21/06/2012 của Quốc hội nước Cộng hoà Xã hội Chủ nghĩa Việt Nam;</i></p>
            <p>–\t<i>Căn cứ nhu cầu và sự thoả thuận giữa các bên.</i></p>
            <br/>

            <p>Hôm nay, ngày ${day} tháng ${month} năm ${year}, tại văn phòng <b>CÔNG TY TNHH QUẢNG CÁO VÀ TỔ CHỨC SỰ KIỆN HT MELODY</b>, chúng tôi gồm có:</p>
            <br/>

            <p><b>BÊN A: ${(currentContract.aName || '').toUpperCase()}</b></p>
            <table class="info-table">
               <tr><td width="130">– Mã số thuế</td><td width="20">:</td><td>${currentContract.aTax}</td></tr>
               <tr><td>– Địa chỉ</td><td>:</td><td>${currentContract.aAdd}</td></tr>
               <tr><td>– Điện thoại</td><td>:</td><td>${currentContract.aPhone || '................'}</td></tr>
               <tr><td>– Đại diện</td><td>:</td><td><b>${currentContract.aRep}</b></td></tr>
               <tr><td>– Chức vụ</td><td>:</td><td><b>${currentContract.aRole}</b></td></tr>
               <tr><td>– Tài khoản</td><td>:</td><td>${currentContract.aBank}</td></tr>
            </table>
            <br/>

            <p><b>BÊN B: CÔNG TY TNHH QUẢNG CÁO VÀ TỔ CHỨC SỰ KIỆN HT MELODY</b></p>
            <table class="info-table">
               <tr><td width="130">– Mã số thuế</td><td width="20">:</td><td>4202004075</td></tr>
               <tr><td>– Địa chỉ</td><td>:</td><td>Thôn Trung Dõng 1, Xã Vạn Thắng, Tỉnh Khánh Hòa, Việt Nam</td></tr>
               <tr><td>– Điện thoại</td><td>:</td><td>0901 718 241 - 0981 170 008</td></tr>
               <tr><td>– Đại diện</td><td>:</td><td><b>Ông TRẦN QUỐC TOÀN</b></td></tr>
               <tr><td>– Chức vụ</td><td>:</td><td><b>GIÁM ĐỐC</b></td></tr>
               <tr><td>– Tài khoản</td><td>:</td><td>404251299400001 tại Ngân hàng NAM Á BANK - PGD Vạn Ninh</td></tr>
            </table>
            <br/>

            <p>Sau khi thỏa thuận, hai bên cùng thống nhất ký hợp đồng thi công, với các điều khoản sau:</p>
            <br/>
            
            <p class="bold">ĐIỀU 1. NỘI DUNG HỢP ĐỒNG</p>
            <p>Bên B đồng ý thực hiện thi công và cung cấp các hạng mục cho Bên A theo danh mục sau:</p>
            <p><b>1. Chi tiết hạng mục:</b></p>

            <table border="1">
              <tr style="font-weight:bold">
                <th width="40">STT</th>
                <th>HẠNG MỤC</th>
                <th>QUY CÁCH</th>
                <th width="50">ĐVT</th>
                <th width="40">SL</th>
                <th width="115">ĐƠN GIÁ (VNĐ)</th>
                <th width="115">THÀNH TIỀN (VNĐ)</th>
              </tr>
              ${trHTML}
              <tr>
                <td colspan="6" align="right"><b>TỔNG CỘNG</b></td>
                <td align="right"><b>${formatTable(subTotal)}</b></td>
              </tr>
              <tr>
                <td colspan="6" align="right"><b>Thuế VAT ${currentContract.vat}%</b></td>
                <td align="right"><b>${formatTable(vatAmount)}</b></td>
              </tr>
              <tr>
                <td colspan="6" align="right"><b>TỔNG CỘNG SAU THUẾ</b></td>
                <td align="right"><b>${formatTable(totalAmount)}</b></td>
              </tr>
            </table>

            <p><b>2. Thời gian thực hiện:</b></p>
            <p>–\tThời gian thi công: ${currentContract.timeSetup}</p>
            <p>–\tThời gian sự kiện: ${currentContract.timeRun}</p>
            <p>–\tĐịa điểm: ${currentContract.timeAddr}</p>
            <br/>

            <p class="bold">ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN:</p>
            <p><b>2.1 Tổng giá trị hợp đồng:</b></p>
            <p>–\tTổng giá trị hợp đồng: <b>${formatTable(totalAmount)} đồng (bao gồm thuế VAT)</b></p>
            <p><b>(Bằng chữ: ${numberToWords(totalAmount)})</b></p>
            <p>–\tMọi phát sinh trong Hợp đồng này phải được hai Bên trao đổi và thỏa thuận, giá trị thanh toán cuối cùng dựa vào giá trị nghiệm thu thanh lý.</p>
            <br/>
            
            <p><b>2.2. Phương thức thanh toán:</b></p>
            <p>–\t<b>Đợt 1:</b> Bên A tạm ứng số tiền: <b>${formatTable(dot1Amount)} đồng (Bằng chữ: ${numberToWords(dot1Amount)})</b> ngay sau khi hai bên ký Hợp đồng.</p>
            <p>–\t<b>Đợt 2:</b> Bên A thanh toán phần giá trị còn lại của Hợp đồng, tương ứng với số tiền là: <b>${formatTable(dot2Amount)} đồng (Bằng chữ: ${numberToWords(dot2Amount)})</b> sau 7 đến 10 ngày khi Bên B thực hiện thi công hoàn thiện tất cả các hạng mục và ký nghiệm thu hoàn thiện.</p>
            <br/>

            <p><b>2.3. Hình thức thanh toán:</b></p>
            <p>Bên A thanh toán cho Bên B bằng hình thức chuyển khoản vào tài khoản ngân hàng của Bên B:</p>
            <p>–\tNgười thụ hưởng: <b>CÔNG TY TNHH QUẢNG CÁO VÀ TỔ CHỨC SỰ KIỆN HT MELODY</b></p>
            <p>–\tSố tài khoản: <b>404251299400001</b></p>
            <p>–\tNgân hàng: <b>NAM Á BANK - Chi Nhánh Nha Trang – PGD Vạn Ninh</b></p>
            <br/>
            <br clear="all" style="page-break-before:always" />

            <p class="bold">ĐIỀU 3: QUYỀN VÀ TRÁCH NHIỆM CỦA MỖI BÊN</p>
            <p><b>1. Quyền và trách nhiệm của Bên A:</b></p>
            <p>–\tTạo mọi điều kiện thuận lợi cho bên B thực hiện công việc theo nội dung đã nêu tại Điều 1 của Hợp đồng.</p>
            <p>–\tCung cấp đầy đủ các tài liệu, hồ sơ, thông tin và các vấn đề liên quan đến thi công để không ảnh hưởng đến tiến độ thực hiện của Bên B.</p>
            <p>–\tPhối hợp với Bên B giải quyết các vấn đề phát sinh trên tinh thần hợp tác, hỗ trợ để giải quyết vấn đề.</p>
            <p>–\tBên A có nghĩa vụ kiểm tra, nghiệm thu công trình tại thời điểm bàn giao và ký biên bản bàn giao đầy đủ ngay khi hoàn tất việc kiểm tra và nhận bàn giao.</p>
            <p>–\tThanh toán đầy đủ cho Bên B theo như Điều 2 của Hợp đồng này.</p>
            <br/>
            
            <p><b>2. Quyền và trách nhiệm của Bên B:</b></p>
            <p>–\tBảo đảm thực hiện đầy đủ các hạng mục đã thỏa thuận với số lượng, chất lượng đúng yêu cầu.</p>
            <p>–\tĐảm bảo tính thẩm mỹ, độ bền đối với các hạng mục thi công.</p>
            <p>–\tThông báo cho Bên A về tiến độ thực hiện hợp đồng. Nếu có vấn đề phát sinh, bên B phải kịp thời thông báo cho bên A để bàn bạc, phối hợp giải quyết.</p>
            <p>–\tBên B có nghĩa vụ hoàn thành công trình đúng hạn và bàn giao đủ các hạng mục đúng quy cách mà bên A đã yêu cầu.</p>
            <p>–\tBên B chịu trách nhiệm bảo hành trong thời hạn 12 tháng kể từ ngày hoàn thành thi công và được bên A nghiệm thu công trình.</p>
            <br/>

            <p class="bold">ĐIỀU 4: TRÁCH NHIỆM DO VI PHẠM HỢP ĐỒNG</p>
            <p><b>1. Phạt vi phạm Hợp đồng</b></p>
            <p class="indent-line">Trong trường hợp một bên vi phạm nghĩa vụ của mình (Bên vi phạm) mà không do lỗi của Bên còn lại (Bên bị vi phạm), thì Bên bị vi phạm có quyền yêu cầu và ấn định một khoảng thời gian hợp lý để Bên vi phạm khắc phục vi phạm của mình. Nếu Bên vi phạm không khắc phục trong thời gian đó, Bên bị vi phạm có quyền đình chỉ hoặc chấm dứt Hợp đồng bằng cách thông báo cho bên kia trước (ít nhất là 05 ngày). Bên vi phạm phải chịu phạt vi phạm Hợp đồng tương đương <b>50% giá trị Hợp đồng bị vi phạm.</b></p>
            <br/>

            <p><b>2. Bồi thường thiệt hại</b></p>
            <p class="indent-line">Trường hợp xảy ra hành vi vi phạm Hợp đồng, ngoài việc bị phạt vi phạm Hợp đồng theo quy định tại Khoản 1 Điều này, Bên vi phạm còn phải bồi thường cho Bên bị vi phạm toàn bộ các thiệt hại thực tế phát sinh do việc vi phạm Hợp đồng gây ra.</p>
            <p class="indent-line">Bên vi phạm có trách nhiệm thanh toán các khoản phạt, bồi thường thiệt hại cho bên bị vi phạm trong thời hạn hợp lý theo thỏa thuận của hai bên.</p>
            <br/>

            <p class="bold">ĐIỀU 5: ĐIỀU KHOẢN CHUNG:</p>
            <p>–\tTrong quá trình thực hiện nếu có vướng mắc thì hai bên sẽ cùng nhau thỏa thuận giải quyết. Trường hợp hai bên không thể thỏa thuận được thì các bên đều có quyền đưa ra Tòa án có thẩm quyền để giải quyết.</p>
            <p>–\tHợp đồng này có hiệu lực kể từ ngày hai bên ký kết và thanh lý sau khi các bên hoàn tất nghĩa vụ của hợp đồng.</p>
            <p>–\tViệc thay đổi, điều chỉnh các điều khoản trong hợp đồng phải được lập thành phụ lục hợp đồng và là một bộ phận không thể tách rời của Hợp đồng này.</p>
            <p>–\tHợp đồng được làm thành 02 (hai) bản, mỗi bên giữ 01 (một) bản có giá trị pháp lý như nhau.</p>
            <br/>

            <table style="width:100%; border:none; margin-top:30px">
               <tr>
                  <td align="center" width="50%"><b>ĐẠI DIỆN BÊN A</b></td>
                  <td align="center" width="50%"><b>ĐẠI DIỆN BÊN B</b></td>
               </tr>
            </table>
          </body>
          </html>
        `;

        const blob = new Blob(['\ufeff', wordTemplate], { type: 'application/vnd.ms-word' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `HopDong_HTMelody_${currentContract.ctrNo}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Đã xuất Hợp đồng Full Text!', 'success');
     });
  };

  reRender();
}
