import Link from '@/components/navigation-link';
import {requireOwner} from '@/lib/server/identity/access';
import {OwnerSignout} from '@/components/admin/session-buttons';
import {Library, ArrowUpRight} from 'lucide-react';
export default async function Workspace({children}: {children: React.ReactNode}) {
  const owner = await requireOwner();
  return <div className="admin-workspace ref-container"><div className="admin-topbar"><Link href="/admin" className="admin-studio-brand"><Library size={19}/><strong>Resource studio</strong></Link><span className="admin-owner-name">{owner.name}</span><Link href="/resources" className="admin-visit">Visit the site <ArrowUpRight size={14}/></Link><Link href="/admin/security" className="admin-security-link">Security</Link><OwnerSignout/></div>{children}</div>;
}
