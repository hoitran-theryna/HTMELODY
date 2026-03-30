export function numberToWordsVN(n) {
   if (n === 0) return 'Không đồng';
   const d = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
   function readTien(num) {
     let str = num.toString();
     let res = '';
     for (let i = 0; i < str.length; i++) {
        let digit = parseInt(str[i]);
        let pos = str.length - 1 - i;
        if (digit === 0 && pos % 3 !== 0) {
           if (parseInt(str[i+1]) !== 0 && pos % 3 === 1) res += 'lẻ ';
           continue;
        }
        if (pos % 3 === 2) res += d[digit] + ' trăm ';
        else if (pos % 3 === 1) {
           if (digit === 1) res += 'mười ';
           else res += d[digit] + ' mươi ';
        } else {
           if (digit === 1 && str.length > 1 && parseInt(str[i-1]) > 1) res += 'mốt ';
           else if (digit === 5 && str.length > 1 && parseInt(str[i-1]) > 0) res += 'lăm ';
           else if (digit !== 0 || (digit === 0 && str.length === 1)) res += d[digit] + ' ';
           
           if (pos === 9) res += 'tỷ, ';
           else if (pos === 6) res += 'triệu, ';
           else if (pos === 3) res += 'nghìn, ';
        }
     }
     return res.replace(/,\s*$/, '').trim().replace(/^[a-z]/, function(m) { return m.toUpperCase(); });
   }
   return readTien(n) + ' đồng.';
}
