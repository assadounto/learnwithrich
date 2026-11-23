import Link from 'next/link';
import { Brand } from './brand';

export function Footer(){return <footer className="reference-footer"><div className="ref-container ref-footer-inner"><Brand/><nav aria-label="Footer navigation"><Link href="/">Discover</Link><Link href="/projects">Projects</Link><Link href="/resources?view=library">Library</Link><Link href="/courses">Courses</Link><Link href="/guestbook">Guest book</Link><Link href="/reviews">Reviews</Link><Link href="/about">About</Link><Link href="/services/request">Request a service</Link><Link href="/resource-package">Resource ZIP format</Link><Link href="/privacy">Privacy</Link></nav><span>© {new Date().getFullYear()} LearnWithRich by Richmond Adu-Kyere.</span></div></footer>}
