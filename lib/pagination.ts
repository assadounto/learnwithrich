export const studioPageSizes = [20, 50, 100] as const;

export function studioPageSize(value: unknown, fallback: (typeof studioPageSizes)[number] = 20) {
  return studioPageSizes.find(size => String(size) === value) ?? fallback;
}

export function requestedPage(value: unknown) {
  return typeof value === 'string' && /^\d{1,6}$/.test(value) ? Math.max(1, Number(value)) : 1;
}

export function pageWindow(total: number, size: number, requested: number) {
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(requested, pages);
  return {page, pages, skip: (page - 1) * size};
}

export function paginationItems(page: number, pages: number) {
  const first = page <= 4 ? [1, 2, 3, 4, 5] : [1, 2];
  const last = page >= pages - 3 ? [pages - 4, pages - 3, pages - 2, pages - 1, pages] : [pages - 1, pages];
  const numbers = [...new Set([...first, page - 1, page, page + 1, ...last])]
    .filter(number => number >= 1 && number <= pages).sort((a, b) => a - b);
  return numbers.flatMap((number, index) => {
    const previous = numbers[index - 1] ?? 0;
    const gap = number - previous;
    const current = {number, ellipsis: false};
    return gap <= 1 ? [current] : [{number: previous + Math.floor(gap / 2), ellipsis: gap > 2}, current];
  });
}
