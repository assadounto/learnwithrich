import {ChevronLeft, ChevronRight} from 'lucide-react';
import Link from '@/components/navigation-link';

export function CatalogPagination({page, pages, href, label = 'Catalog pages'}: {
  page: number; pages: number; href: (page: number) => string; label?: string;
}) {
  if (pages <= 1) return null;
  const numbers = [...new Set([1, page - 1, page, page + 1, pages])].filter(number => number >= 1 && number <= pages).sort((a, b) => a - b);
  return <nav className="catalog-pagination" aria-label={label}>
    {page > 1 && <Link href={href(page - 1)} aria-label="Previous page"><ChevronLeft size={18}/></Link>}
    {numbers.map((number, index) => <span className="catalog-page-number" key={number}>
      {index > 0 && number - numbers[index - 1] > 1 && <span aria-hidden="true">…</span>}
      {number === page ? <span aria-current="page" aria-label={`Page ${number}`}>{number}</span> : <Link href={href(number)} aria-label={`Page ${number}`}>{number}</Link>}
    </span>)}
    {page < pages && <Link href={href(page + 1)} aria-label="Next page"><ChevronRight size={18}/></Link>}
  </nav>;
}
