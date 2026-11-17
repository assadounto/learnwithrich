import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
export default function NotFound(){return <div className="container not-found"><span className="eyebrow">A LITTLE DETOUR / 404</span><h1>This idea hasn’t<br/>found <i>its page yet.</i></h1><p>The link may have moved. There’s plenty more to explore.</p><Link href="/resources" className="button button-orange">Back to the library <ArrowRight size={17}/></Link></div>}
