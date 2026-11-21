import Link from '@/components/navigation-link';
export default function AdminNotFound() { return <section className="admin-empty"><h1>Resource not found</h1><p>This resource may have moved or no longer exists.</p><Link href="/admin/resources" className="button button-dark">Return to resources</Link></section>; }
