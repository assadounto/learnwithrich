import Link from '@/components/navigation-link';
import {ArrowLeft, FileArchive} from 'lucide-react';
import {ResourcePackagePreview} from '@/components/admin/resource-package-preview';

export default function ImportResourcePackage() {
  return <>
    <Link href="/admin/resources" className="admin-back"><ArrowLeft size={15}/>All resources</Link>
    <header className="admin-page-heading"><div><span className="admin-kicker">BULK RESOURCE SETUP</span><h1>Preview a ZIP package</h1><p>Check a single resource or a complete course/path bundle before importing.</p></div><FileArchive size={26}/></header>
    <ResourcePackagePreview/>
  </>;
}
