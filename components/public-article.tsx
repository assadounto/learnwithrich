import {PurchaseProduct} from './purchase-product';
import {GuideText} from './guide-text';
import {isFreeArticle} from '@/lib/live-catalog';
import type {Listing} from '@/lib/xonbay/contracts';
/** Free reading comes from the API's public snapshot, never a customer-only endpoint. */
export function PublicArticle({item}:{item:Listing}){
 if(!isFreeArticle(item)||!item.free_article)return null;
 const content=item.free_article;
 return <section id="read-guide" className="public-guide-reading" aria-label="Read this guide"><header><span className="maker-kicker">FREE TO READ</span><h2>Make a little time for curiosity.</h2><p>Read the complete guide here. No sign-in needed.</p></header><GuideText text={content.body||''}/>{content.steps?.map((step,index)=><section className="public-guide-step" key={step.id}><span className="maker-kicker">STEP {index+1}</span><h3>{step.title}</h3><GuideText text={step.body}/></section>)}{item.files?.length?<details className="public-guide-extras"><summary>Optional downloads · {item.files.length} files</summary><p>The guide above is open to everyone. Sign in only if you want to keep and download its attached files.</p><ul>{item.files.map((file,index)=><li key={index}>{file.filename}</li>)}</ul>{item.checkout_pricing&&<PurchaseProduct id={item.public_id} total={item.checkout_pricing.total_minor} free freeLabel="Get files"/>}</details>:null}</section>;
}
