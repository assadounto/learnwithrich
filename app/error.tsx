'use client';
import Link from '@/components/navigation-link';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="route-error ref-container"><span className="maker-kicker">LET’S TRY THAT AGAIN</span><h1>This page couldn’t open.</h1><p>Something interrupted the request. Try again, or head back to the workbench.</p><div className="route-error-actions"><button className="button button-orange" onClick={reset}>Try again</button><Link href="/projects" className="button button-outline">Browse projects</Link></div></section>;
}
