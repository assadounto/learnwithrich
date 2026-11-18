import {GuideText} from '@/components/guide-text';
import Link from '@/components/navigation-link';
import {notFound} from 'next/navigation';
import {requireUser,requireToken,library,upstream} from '@/lib/xonbay/server';
export const dynamic='force-dynamic';
export default async function Article({params}:{params:Promise<{id:string}>}){await requireUser();const accessToken=await requireToken();const {id}=await params;const own=(await library(accessToken)).find(e=>e.digital_product_public_id===id&&e.content_type==='article');if(!own)notFound();const article=await upstream('/v1/digital_articles/'+encodeURIComponent(id),accessToken);return <article className="purchased-article ref-container"><Link href="/dashboard" className="text-link">My dashboard</Link><h1>{article.title}</h1><GuideText text={article.body||''}/>{article.steps?.map((step:{id:string;title:string;body:string})=><section key={step.id}><h2>{step.title}</h2><GuideText text={step.body}/></section>)}</article>}
