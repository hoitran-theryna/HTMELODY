// ============================================
// ERP SYSTEM - PAGINATION UTILITY
// ============================================

export const PER_PAGE = 5;

/**
 * Slice data array for the given page.
 * Returns { items, total, page, pages }
 */
export function paginate(data, page = 1, perPage = PER_PAGE) {
  const total = data.length;
  const pages = Math.ceil(total / perPage) || 1;
  const p = Math.max(1, Math.min(page, pages));
  return {
    items: data.slice((p - 1) * perPage, p * perPage),
    total, page: p, pages
  };
}

/**
 * Return HTML string for pagination bar.
 * Returns empty string when there's only 1 page.
 */
export function paginationHTML(page, pages, total) {
  if (pages <= 1) return '';

  const nums = buildNums(page, pages);
  return `
    <div class="pagination-bar">
      <span class="pagination-info">${total} mục &nbsp;·&nbsp; Trang <strong>${page}</strong>/${pages}</span>
      <div class="pagination-controls">
        <button class="btn-page" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>&#8249;</button>
        ${nums.map(n => n === '...'
          ? `<span class="page-ellipsis">…</span>`
          : `<button class="btn-page${n === page ? ' active' : ''}" data-page="${n}">${n}</button>`
        ).join('')}
        <button class="btn-page" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>&#8250;</button>
      </div>
    </div>`;
}

/**
 * Bind click events on .btn-page inside wrap element.
 */
export function bindPagination(wrap, onChange) {
  if (!wrap) return;
  wrap.querySelectorAll('.btn-page:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => onChange(+btn.dataset.page));
  });
}

function buildNums(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (cur <= 4)        return [1, 2, 3, 4, 5, '...', total];
  if (cur >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', cur - 1, cur, cur + 1, '...', total];
}
