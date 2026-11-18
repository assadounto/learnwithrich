import Link from '@/components/navigation-link';
import {ArrowRight,ArrowUpRight,BookOpen} from 'lucide-react';
import type {Listing} from '@/lib/xonbay/contracts';
import {money} from '@/lib/xonbay/contracts';
import {categoryOf,categoryLabel,productHref} from '@/lib/live-catalog';
import {LiveProductCard} from './live-products';
import {PaperEdges} from './paper-edges';
import {DrawnUnderline} from './decorative-marks';

export function BusinessHomeCatalog({items,error}:{items:Listing[];error:boolean}){
 if(error)return <section className="ref-container business-home-state"><h2>Good ideas are worth another try.</h2><p role="status">The collection couldn’t load right now. Please try again shortly.</p><Link className="text-link" href="/resources">Open the library <ArrowRight size={17}/></Link></section>;
 if(!items.length)return <section className="ref-container business-home-state"><h2>A new collection is taking shape.</h2><p>Projects, guides and courses will appear here as they’re published by LearnWithRich.</p></section>;
 const projects=items.filter(i=>categoryOf(i)==='project');
 const resources=items.filter(i=>!['project','course'].includes(categoryOf(i)));
 const courses=items.filter(i=>categoryOf(i)==='course');
 const spotlight=projects[0];
 return <>
 {projects.length>0&&<section className="live-products ref-container business-home-projects"><div className="ref-section-heading"><div><span className="maker-kicker">FROM THE LEARNWITHRICH WORKBENCH</span><h2>Pick an idea. Make it real.</h2></div><Link className="text-link" href="/projects">All projects <ArrowUpRight size={16}/></Link></div><div className="live-product-grid">{projects.slice(0,6).map(item=><LiveProductCard key={item.public_id} item={item}/>)}</div></section>}
 {resources.length>0&&<section className="ref-library business-home-library"><PaperEdges/><div className="ref-container"><div className="ref-section-heading"><div className="ref-library-copy"><span className="maker-kicker">THE LEARNWITHRICH LIBRARY</span><h2>Good ideas deserve<br/>good resources.<DrawnUnderline className="olive-scribble"/></h2><p>Practical reading to help you understand the parts, plan your next step and share what you learn.</p></div><Link href="/resources" className="button button-cream">Browse library <ArrowRight size={18}/></Link></div><div className="live-product-grid">{resources.slice(0,6).map(item=><LiveProductCard key={item.public_id} item={item}/>)}</div></div></section>}
 {spotlight&&<section className="maker-spotlight business-home-spotlight"><PaperEdges/><div className="ref-container maker-spotlight-inner"><Link className="business-spotlight-image home-reveal" href={productHref(spotlight)} aria-label={spotlight.title}>{spotlight.cover_url?<img src={spotlight.cover_url} alt="" loading="lazy"/>:<BookOpen size={70} strokeWidth={1}/>}<span>ONE IDEA. YOUR NEXT BUILD.</span></Link><div className="spotlight-copy home-reveal"><span className="maker-kicker">PROJECT SPOTLIGHT</span><h2>{spotlight.title}</h2><p>{spotlight.description}</p>{(spotlight.tags||[]).filter(t=>t.toLowerCase()!=='project').length>0&&<div className="business-spotlight-tags">{(spotlight.tags||[]).filter(t=>t.toLowerCase()!=='project').slice(0,5).map(t=><span key={t}>{t}</span>)}</div>}<div className="spotlight-actions"><Link href={productHref(spotlight)} className="button button-orange">Explore the project <ArrowRight size={17}/></Link><span>{spotlight.price_minor===0?'Free':money(spotlight.price_minor,spotlight.currency)} · {categoryLabel(spotlight)}</span></div></div></div></section>}
 {courses.length>0&&<section className="live-products ref-container business-home-courses"><div className="ref-section-heading"><div><span className="maker-kicker">LEARN BY DOING</span><h2>Less watching. More making.</h2></div><Link href="/courses" className="text-link">All courses <ArrowUpRight size={16}/></Link></div><div className="live-product-grid">{courses.slice(0,3).map(item=><LiveProductCard key={item.public_id} item={item}/>)}</div></section>}
 </>;
}
