import Link from '@/components/navigation-link';
import {SiteContactForm} from '@/components/admin/site-contact-form';
import {requireOwner} from '@/lib/server/identity/access';
import {loadContacts} from '@/lib/server/site-contact';

export default async function SiteContactPage() {
  await requireOwner();
  const contacts = await loadContacts();
  return <>
    <header className="admin-page-heading"><div><h1>Public contact & social links</h1><p>Choose what visitors can see in the footer and on the About page.</p></div>
      <Link href="/about#contact" className="button button-outline">View About</Link>
    </header>
    <SiteContactForm initial={contacts}/>
  </>;
}
