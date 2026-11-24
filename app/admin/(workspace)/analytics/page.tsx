import {ChartNoAxesCombined, Globe, Laptop, MousePointer2} from 'lucide-react';
import Link from '@/components/navigation-link';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import styles from './analytics.module.css';

export const metadata = {title: 'Site analytics'};
const numbers = new Intl.NumberFormat('en-GH');
const displayDate = new Intl.DateTimeFormat('en-GH', {month: 'short', day: 'numeric', timeZone: 'UTC'});
const countryNames = new Intl.DisplayNames(['en'], {type: 'region'});
const ranges = [7, 30, 90];

function Breakdown({title, rows, total}: {title: string; rows: {name: string; count: number}[]; total: number}) {
  return <section className={styles.section}>
    <h2>{title}</h2>
    {rows.length ? <table className={styles.table}>
      <thead><tr><th scope="col">{title}</th><th scope="col">Views</th><th scope="col">Share</th></tr></thead>
      <tbody>{rows.map(({name, count}) => <tr key={name}><th scope="row">{name}</th><td>{numbers.format(count)}</td><td>{Math.round(100 * count / total)}%</td></tr>)}</tbody>
    </table> : <p className={styles.empty}>No recorded views for this period.</p>}
  </section>;
}

export default async function AnalyticsPage({searchParams}: {searchParams: Promise<{days?: string}>}) {
  await requireOwner();
  const requested = Number((await searchParams).days);
  const days = ranges.includes(requested) ? requested : 30;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dayMs = 86400000;
  const where = {day: {gte: new Date(today.getTime() - (days - 1) * dayMs), lte: today}};
  const db = database().pageAnalytics;
  const [daily, pages, countries, sources, screens] = await Promise.all([
    db.groupBy({by: ['day'], where, _sum: {views: true, visits: true}, orderBy: {day: 'asc'}}),
    db.groupBy({by: ['path'], where, _sum: {views: true}, orderBy: [{_sum: {views: 'desc'}}, {path: 'asc'}], take: 15}),
    db.groupBy({by: ['country'], where, _sum: {views: true}, orderBy: [{_sum: {views: 'desc'}}, {country: 'asc'}]}),
    db.groupBy({by: ['source'], where, _sum: {views: true}, orderBy: [{_sum: {views: 'desc'}}, {source: 'asc'}], take: 12}),
    db.groupBy({by: ['screen'], where, _sum: {views: true}, orderBy: {screen: 'desc'}}),
  ]);
  const total = daily.reduce((sum, row) => sum + (row._sum.views ?? 0), 0);
  const visits = daily.reduce((sum, row) => sum + (row._sum.visits ?? 0), 0);
  const knownLocation = countries.reduce((sum, row) => sum + (row.country ? row._sum.views ?? 0 : 0), 0);
  const byDay = new Map(daily.map(row => [row.day.getTime(), row._sum.views ?? 0]));
  const series = Array.from({length: days}, (_, index) => {
    const day = new Date(where.day.gte.getTime() + index * dayMs);
    return {day, views: byDay.get(day.getTime()) ?? 0};
  });
  const peak = Math.max(1, ...series.map(row => row.views));
  return <div className={styles.page}>
    <header className="admin-page-heading">
      <div><h1>Site analytics</h1><p>Public page activity, where readers come from, and how they browse.</p></div>
      <nav className={styles.ranges} aria-label="Analytics date range">
        {ranges.map(range => <Link key={range} href={`/admin/analytics?days=${range}`} aria-current={range === days ? 'page' : undefined}>{range} days</Link>)}
      </nav>
    </header>
    <dl className={styles.stats}>
      <div><dt><ChartNoAxesCombined size={17}/>Page views</dt><dd>{numbers.format(total)}</dd></div>
      <div><dt><MousePointer2 size={17}/>Visits started</dt><dd>{numbers.format(visits)}</dd></div>
      <div><dt><Globe size={17}/>Country coverage</dt><dd>{total ? `${Math.round(100 * knownLocation / total)}%` : '—'}</dd></div>
    </dl>
    <section className={styles.section}>
      <h2>Views by day</h2>
      {total ? <>
        <div className={styles.chart} aria-hidden="true">
          {series.map(({day, views}) => <div key={day.toISOString()} title={`${displayDate.format(day)} · ${views} views`} style={{height: `${Math.max(1, 100 * views / peak)}%`}}/>)}
        </div>
        <div className={styles.axis}><span>{displayDate.format(series[0].day)}</span><span>{displayDate.format(today)}</span></div>
        <details className={styles.daily}><summary>Daily counts</summary><table className={styles.table}>
          <thead><tr><th scope="col">Date (UTC)</th><th scope="col">Views</th></tr></thead>
          <tbody>{series.map(({day, views}) => <tr key={day.toISOString()}><th scope="row">{displayDate.format(day)}</th><td>{numbers.format(views)}</td></tr>)}</tbody>
        </table></details>
      </> : <p className={styles.empty}>Views will appear here after people visit public pages.</p>}
    </section>
    <div className={styles.breakdowns}>
      <Breakdown title="Top pages" total={total} rows={pages.map(row => ({name: row.path, count: row._sum.views ?? 0}))}/>
      <Breakdown title="Countries" total={total} rows={countries.map(row => ({name: row.country ? countryNames.of(row.country) ?? row.country : 'Unknown country', count: row._sum.views ?? 0}))}/>
      <Breakdown title="Referring websites" total={total} rows={sources.map(row => ({name: row.source || 'Direct or internal', count: row._sum.views ?? 0}))}/>
      <Breakdown title="Screen sizes" total={total} rows={screens.map(row => ({name: row.screen === 'small' ? 'Small (under 768px)' : 'Large (768px and up)', count: row._sum.views ?? 0}))}/>
    </div>
    <p className={styles.note}><Laptop size={16}/>Visits are counted once per browsing tab session. Country comes from the hosting network when available.</p>
  </div>;
}
