import type {ReactNode} from 'react';
import styles from '@/app/(learner)/account/account.module.css';

export function AccountTable({label, columns, children}: {label: string; columns: string[]; children: ReactNode}) {
  return <div className={styles.tableScroll} role="region" aria-label={`${label} table`} tabIndex={0}>
    <table className={styles.table}>
      <caption className="sr-only">{label}</caption>
      <thead><tr>{columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>;
}
