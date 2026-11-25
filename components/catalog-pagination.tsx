import type {ReactNode} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import Link from '@/components/navigation-link';
import {paginationItems} from '@/lib/pagination';

type Props = {page: number; pages: number; label?: string} &
  ({href: (page: number) => string; onPage?: never} | {onPage: (page: number) => void; href?: never});

export function CatalogPagination({page, pages, href, onPage, label = 'Catalog pages'}: Props) {
  if (pages <= 1) return null;

  function control(number: number, name: string, children: ReactNode) {
    return href ? <Link href={href(number)} aria-label={name} prefetch={false}>{children}</Link>
      : <button type="button" aria-label={name} onClick={() => onPage?.(number)}>{children}</button>;
  }

  return <nav className="catalog-pagination" aria-label={label}>
    {page > 1 && control(page - 1, 'Previous page', <ChevronLeft size={18}/>)}
    {paginationItems(page, pages).map(({number, ellipsis}) => <span className="catalog-page-number" key={number}>
      {number === page ? <span aria-current="page" aria-label={`Page ${number}`}>{number}</span>
        : control(number, ellipsis ? `Jump to page ${number}` : `Page ${number}`, ellipsis ? '…' : number)}
    </span>)}
    {page < pages && control(page + 1, 'Next page', <ChevronRight size={18}/>)}
  </nav>;
}
