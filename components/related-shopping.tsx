import {ArrowUpRight,Layers,ShoppingBag} from 'lucide-react';
import {xonbayItemUrl} from '@/lib/live-catalog';
import type {Listing,RelatedShopItem} from '@/lib/xonbay/contracts';
export function RelatedShopping({item}:{item:Pick<Listing,'related_products'|'related_collections'>}){
 const groups=([{kind:'product',title:'Products',items:item.related_products||[],Icon:ShoppingBag},{kind:'collection',title:'Collections & kits',items:item.related_collections||[],Icon:Layers}] as const).map(group=>({...group,items:group.items.filter(row=>xonbayItemUrl(group.kind,row.id))}));
 if(!groups.some(group=>group.items.length))return null;
 return <section className="project-parts-links" aria-label="Parts and kits on Xonbay"><header><span className="maker-kicker">FROM PLAN TO PARTS</span><h3>Find parts on Xonbay.</h3><p>Explore the products and collections linked to this project. Check current prices and availability on Xonbay.</p></header><div>{groups.filter(group=>group.items.length).map(({kind,title,items,Icon})=><section key={kind}><h4>{title}</h4><ul>{items.map((row:RelatedShopItem)=><li key={row.id}><a href={xonbayItemUrl(kind,row.id)!} target="_blank" rel="noopener noreferrer" aria-label={`View ${row.name} on Xonbay (opens in a new tab)`}><Icon size={22}/><span><strong>{row.name}</strong><small>{row.shop_name?`${row.shop_name} · `:''}View {kind} on Xonbay</small></span><ArrowUpRight size={18}/></a></li>)}</ul></section>)}</div></section>;
}
