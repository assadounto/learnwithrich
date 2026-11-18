import type {Listing,ProjectDetails} from './xonbay/contracts';
export const categories=[['all','Everything'],['project','Projects'],['book','Books'],['guide','Guides'],['illustration','Illustrations'],['course','Courses'],['resource','Resources']] as const;
export function categoryOf(item:Listing){return item.category?item.category:(item.tags||[]).some(tag=>tag.trim().toLowerCase()==='project')?'project':item.content_type==='course'?'course':item.category|| (item.content_type==='article'?'guide':'resource')}
export function categoryLabel(item:Listing){const labels:Record<string,string>={project:'Project',book:'Book',guide:'Guide',illustration:'Illustration',course:'Course',resource:item.content_type==='bundle'?'Resource bundle':'Resource'};return labels[categoryOf(item)]||'Resource'}
export function isProject(item:Listing){return categoryOf(item)==='project'}
export function productHref(item:Listing){return `${isProject(item)?'/projects/':'/shop/'}${item.public_id}`}
export function filterListings(items:Listing[],query='',category='all',tag='all',level='all',price='all'){
 const q=query.trim().toLowerCase();
 return items.filter(item=>(category==='all'||categoryOf(item)===category)&&(tag==='all'||(item.tags||[]).some(value=>value.toLowerCase()===tag.toLowerCase()))&&(level==='all'||item.project_details?.difficulty===level)&&(price==='all'||(price==='free'?item.price_minor===0:item.price_minor>0))&&[item.title,item.description,...item.tags||[],...(item.project_details?.tools||[])].join(' ').toLowerCase().includes(q));
}
export function topicTags(items:Listing[]){const seen=new Map<string,string>();for(const item of items)for(const tag of item.tags||[])if(tag.toLowerCase()!=='project'&&!seen.has(tag.toLowerCase()))seen.set(tag.toLowerCase(),tag);return [...seen.values()].sort((a,b)=>a.localeCompare(b));}

/** Older free project guides may have their component list in article Markdown. */
export function projectDetails(item:Listing):ProjectDetails{
 const details={...item.project_details};
 if(!details.components?.length&&isFreeArticle(item)&&item.free_article?.body){
  const section=item.free_article.body.match(/^#{1,4} Components[ \t]*\r?\n([\s\S]*?)(?=^#{1,4} |$(?![\s\S]))/m)?.[1];
  const names=section?.split('\n').filter(line=>/^[-*]\s/.test(line)).map(line=>line.replace(/^[-*]\s/,'').trim()).filter(Boolean);
  if(names?.length)details.components=names.slice(0,100).map(name=>({name}));
 }
 return details;
}

export function isFreeArticle(item:Pick<Listing,'content_type'|'price_minor'>){return item.content_type==='article'&&item.price_minor===0}
export function xonbayItemUrl(kind:'product'|'collection',id:unknown){const value=String(id);return /^[1-9]\d*$/.test(value)?`https://www.xonbay.com/${kind==='product'?'products':'collections'}/${value}`:null}
