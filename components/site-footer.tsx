import Link from 'next/link';
import {Brand} from './brand';

const groups = [
  {name: 'Explore', links: [['Discover', '/'], ['Projects', '/projects'], ['Project ideas', '/project-ideas'], ['Resource library', '/resources'], ['Courses', '/courses']]},
  {name: 'Connect', links: [['About', '/about'], ['Request a service', '/services/request'], ['Reviews', '/reviews'], ['Guest book', '/guestbook']]},
  {name: 'Tools & policies', links: [['Saved library', '/library'], ['Resource ZIP format', '/resource-package'], ['Privacy', '/privacy'], ['Terms', '/terms']]},
] as const;

export function Footer() {
  return <footer className="reference-footer">
    <div className="ref-container ref-footer-inner">
      <Brand/>
      <nav aria-label="Footer navigation">
        {groups.map(group => <div className="ref-footer-group" key={group.name}>
          <h2>{group.name}</h2>
          <ul>{group.links.map(([label, href]) => <li key={href}><Link href={href} prefetch={false}>{label}</Link></li>)}</ul>
        </div>)}
      </nav>
      <span>© {new Date().getFullYear()} LearnWithRich by Richmond Adu-Kyere.</span>
    </div>
  </footer>;
}
