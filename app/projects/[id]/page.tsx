import type {Metadata} from 'next';
import Link from '@/components/navigation-link';
import {notFound} from 'next/navigation';
import {CircuitBoard} from 'lucide-react';
import {listing,ServiceError} from '@/lib/xonbay/server';
import {isProject,isFreeArticle} from '@/lib/live-catalog';
import {money} from '@/lib/xonbay/contracts';
import {PurchaseProduct} from '@/components/purchase-product';
import {LiveProjectInformation} from '@/components/live-project-information';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{try{const item=await listing((await params).id);return {title:item.title,description:item.description}}catch{return {title:'Project'}}}
export default async function Project({params}:{params:Promise<{id:string}>}){
 let item;try{item=await listing((await params).id)}catch(e){if(e instanceof ServiceError&&e.status===404)notFound();throw e}if(!isProject(item))notFound();const details=item.project_details||{};const quote=item.checkout_pricing;const freeReading=isFreeArticle(item);
 return <article className="live-project-detail ref-container"><Link href="/projects" className="text-link">Projects / {item.title}</Link><header className="live-project-heading"><div><span className="maker-kicker">A LEARNWITHRICH PROJECT</span><h1>{item.title}</h1><div className="folio-tool-list">{item.tags?.filter(tag=>tag.toLowerCase()!=='project').map(tag=><span key={tag}>{tag}</span>)}</div></div><div className="live-project-facts">{details.difficulty&&<span>{details.difficulty}</span>}{details.duration&&<span>{details.duration}</span>}<strong>{item.price_minor===0?'Free project':money(item.price_minor,item.currency)}</strong></div></header>
 <div className="live-project-intro"><div className="live-project-main-cover">{item.cover_url?<img src={item.cover_url} alt={item.title}/>:<><CircuitBoard size={100} strokeWidth={1}/><span>Small beginnings.<br/><i>Useful possibilities.</i></span></>}</div><aside className="live-project-buy" id="project-access"><span className="maker-kicker">MAKE IT YOUR NEXT BUILD</span><h2>Your project workbench.</h2><p>{item.description}</p>{freeReading?<><p className="public-reading-badge">Free to read and build</p><a href="#project-build" className="button button-orange">Read the build guide</a></>:quote?<><dl className="checkout-quote"><div><dt>Project</dt><dd>{item.price_minor===0?'Free':money(item.price_minor,item.currency)}</dd></div>{quote.network_fee_minor>0&&<div><dt>Payment fee</dt><dd>{money(quote.network_fee_minor,item.currency)}</dd></div>}<div><dt>Total</dt><dd>{money(quote.total_minor,item.currency)}</dd></div></dl><PurchaseProduct id={item.public_id} total={quote.total_minor} free={item.price_minor===0}/></>:<p>Access is temporarily unavailable. Please try again shortly.</p>}<p className="studio-note">{freeReading?'Explore the components and build instructions below. No sign-in needed.':'Keep this project in your library. Sign in to claim it or access your purchases.'}</p></aside></div><LiveProjectInformation item={item}/>
 </article>;
}
