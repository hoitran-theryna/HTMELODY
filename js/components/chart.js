// ============================================  
// ERP SYSTEM - CHART COMPONENT (Canvas-based)
// ============================================

export function drawBarChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = rect.width; const h = options.height || 280;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  const { labels, datasets, showGrid = true } = data;
  const padding = { top: 20, right: 20, bottom: 40, left: 70 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const allVals = datasets.flatMap(d => d.values);
  const maxVal = Math.ceil(Math.max(...allVals) / 1000000) * 1000000 || 100;

  // Grid
  if (showGrid) {
    ctx.strokeStyle = 'rgba(99,115,155,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.font = '11px Inter'; ctx.textAlign = 'right';
      const val = maxVal - (maxVal / 5) * i;
      ctx.fillText(formatShortNum(val), padding.left - 8, y + 4);
    }
  }

  // Labels
  const barGroupW = chartW / labels.length;
  ctx.fillStyle = '#64748b'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
  labels.forEach((label, i) => {
    ctx.fillText(label, padding.left + barGroupW * i + barGroupW / 2, h - 12);
  });

  // Bars
  const barCount = datasets.length;
  const barW = Math.min(barGroupW * 0.6 / barCount, 36);
  const totalBarsW = barW * barCount + (barCount - 1) * 4;

  datasets.forEach((ds, di) => {
    ds.values.forEach((val, vi) => {
      const barH = (val / maxVal) * chartH;
      const x = padding.left + barGroupW * vi + (barGroupW - totalBarsW) / 2 + di * (barW + 4);
      const y = padding.top + chartH - barH;

      const grad = ctx.createLinearGradient(x, y, x, y + barH);
      const colors = ds.colors || ['#3b82f6', '#2563eb'];
      grad.addColorStop(0, colors[0]); grad.addColorStop(1, colors[1] || colors[0]);
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, barW, barH, 4);
    });
  });
}

export function drawLineChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = rect.width; const h = options.height || 280;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  const { labels, datasets } = data;
  const padding = { top: 20, right: 20, bottom: 40, left: 70 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const allVals = datasets.flatMap(d => d.values);
  const maxVal = Math.ceil(Math.max(...allVals) / 1000000) * 1000000 || 100;

  // Grid
  ctx.strokeStyle = 'rgba(99,115,155,0.1)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartH / 5) * i;
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.font = '11px Inter'; ctx.textAlign = 'right';
    ctx.fillText(formatShortNum(maxVal - (maxVal / 5) * i), padding.left - 8, y + 4);
  }

  // Labels
  const stepX = chartW / (labels.length - 1);
  ctx.fillStyle = '#64748b'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
  labels.forEach((label, i) => {
    ctx.fillText(label, padding.left + stepX * i, h - 12);
  });

  // Lines
  datasets.forEach(ds => {
    const points = ds.values.map((val, i) => ({
      x: padding.left + stepX * i,
      y: padding.top + chartH - (val / maxVal) * chartH,
    }));

    // Area fill
    if (ds.fill) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, padding.top + chartH);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length-1].x, padding.top + chartH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      grad.addColorStop(0, ds.fillColor || 'rgba(59,130,246,0.15)');
      grad.addColorStop(1, 'rgba(59,130,246,0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = ds.color || '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    points.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
    ctx.stroke();

    // Dots
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = ds.color || '#3b82f6';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#0f1629';
      ctx.fill();
    });
  });
}

export function drawDoughnutChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = options.size || 220;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const { labels, values, colors } = data;
  const cx = size / 2; const cy = size / 2;
  const outerR = size / 2 - 10; const innerR = outerR * 0.6;
  const total = values.reduce((s, v) => s + v, 0);

  let startAngle = -Math.PI / 2;
  values.forEach((val, i) => {
    const sliceAngle = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = colors[i] || '#3b82f6';
    ctx.fill();
    startAngle += sliceAngle;
  });

  // Center text
  ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 24px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 8);
  ctx.fillStyle = '#64748b'; ctx.font = '11px Inter';
  ctx.fillText(options.centerLabel || 'Tổng', cx, cy + 12);
}

export function drawPieChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = options.size || 220;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const { values, colors } = data;
  const cx = size / 2; const cy = size / 2; const r = size / 2 - 10;
  const total = values.reduce((s, v) => s + v, 0);

  let startAngle = -Math.PI / 2;
  values.forEach((val, i) => {
    const sliceAngle = (val / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i] || '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = '#0f1629'; ctx.lineWidth = 2; ctx.stroke();
    startAngle += sliceAngle;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  if (h < 1) return;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function formatShortNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toString();
}

export function createChartLegend(labels, colors) {
  return `<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;justify-content:center">
    ${labels.map((l, i) => `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8">
      <span style="width:10px;height:10px;border-radius:3px;background:${colors[i]};flex-shrink:0"></span>${l}
    </div>`).join('')}
  </div>`;
}
