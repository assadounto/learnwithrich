import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {adminRepository} from '@/lib/server/admin/repository';
import {HomepageBuilder} from '@/components/admin/homepage-builder';
import {Layers3, Sparkles} from 'lucide-react';

export const dynamic = 'force-dynamic';
export default async function HomepageStudio() {
  const owner = await requireOwner();
  const data = await adminRepository(database(), owner.id, owner.sessionId).homepageSettings();
  return <><header className="admin-page-heading homepage-admin-heading"><div><span className="admin-kicker"><Sparkles size={14}/> PUBLIC WEBSITE</span><h1>Build your homepage</h1><p>Arrange resource sections, choose exactly what to feature, or let the latest published work fill each section automatically.</p></div><span className="homepage-admin-icon"><Layers3 size={24}/></span></header><HomepageBuilder initialSections={data.sections} choices={data.resources}/></>;
}
