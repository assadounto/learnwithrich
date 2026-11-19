export default function Loading() {
  return <section className="route-loading ref-container" role="status" aria-live="polite">
    <p className="route-loading-label">Opening the next page…</p>
    <div className="route-loading-grid" aria-hidden="true">{[0,1,2].map(index => <div className="route-loading-card" key={index}><span/><span/><span/></div>)}</div>
  </section>;
}
