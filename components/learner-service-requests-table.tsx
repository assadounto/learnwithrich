'use client';

import {Children, type ReactNode, useState} from 'react';
import {ArrowDownRight} from 'lucide-react';

export type LearnerServiceRequestRow = {
  id: string;
  service: string;
  status: string;
  submitted: string;
  quote: string;
};

export function LearnerServiceRequestsTable({rows, children}: {rows: LearnerServiceRequestRow[]; children: ReactNode}) {
  const details = Children.toArray(children);
  const [selected, setSelected] = useState(0);
  if (!rows.length) return null;

  return <div className="learner-service-requests-table">
    <div className="account-service-table-wrap">
      <table>
        <thead><tr><th>Request</th><th>Submitted</th><th>Status</th><th>Quote</th><th><span className="sr-only">Details</span></th></tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.id} aria-current={selected === index ? 'true' : undefined}>
          <th scope="row"><span>{row.service}</span><small>#{row.id.slice(0, 8).toUpperCase()}</small></th>
          <td>{row.submitted}</td><td><span className={`account-service-status status-${row.status.toLowerCase()}`}>{row.status.replaceAll('_', ' ').toLowerCase()}</span></td>
          <td>{row.quote}</td><td><button type="button" className="button button-dark account-service-open" aria-expanded={selected === index} onClick={() => setSelected(index)}>{selected === index ? 'Open' : 'Details'}<ArrowDownRight size={14}/></button></td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="account-service-detail" aria-live="polite">
      <div className="account-service-detail-heading"><span>REQUEST DETAILS</span><strong>#{rows[selected].id.slice(0, 8).toUpperCase()}</strong></div>
      {details[selected]}
    </div>
  </div>;
}
