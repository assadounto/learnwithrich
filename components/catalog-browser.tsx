'use client';
import { useSearchParams } from 'next/navigation';
import { Search, ArrowRight, RotateCcw } from 'lucide-react';
import { resources, topics, filterResources } from '@/lib/catalog';
import { ResourceCard } from './resource-card';
const types = ['All','Project','Document','Book','Illustration','Course'];
export function CatalogBrowser(){
const params=useSearchParams();
const query=params.get('q')||'';
const type=types.includes(params.get('type')||'')?params.get('type')!:'All';
const topic=topics.includes(params.get('topic')||'')?params.get('topic')!:'All';
const access=['All','Free','Premium'].includes(params.get('access')||'')?params.get('access')!:'All';
function updateUrl(key:string,value:string){const url=new URL(window.location.href);if(value==='All'||!value)url.searchParams.delete(key);else url.searchParams.set(key,value);if(key==='type')url.searchParams.delete('view');window.history.replaceState(null,'',url)}
const collection=params.get('view')==='library'&&type==='All'?resources.filter(r=>['Book','Document','Illustration'].includes(r.type)):resources;
const filtered=filterResources(collection,query,type,topic,access);
return <><div className="catalog-controls"><form className="search-form catalog-search" onSubmit={e=>e.preventDefault()}><Search size={21}/><label htmlFor="catalog-search" className="sr-only">Search resource library</label><input id="catalog-search" type="search" placeholder="Search projects, resources, books…" value={query} onChange={e=>{updateUrl('q',e.target.value)}}/><button type="submit" aria-label="Search library"><ArrowRight size={19}/></button></form><div className="filter-bar"><div className="filter-tabs" aria-label="Resource types">{types.map(t=><button className="filter-tab" type="button" key={t} aria-pressed={type===t} onClick={()=>{updateUrl('type',t)}}>{t==='All'?'Everything':`${t}s`}</button>)}</div><label className="select-label">Topic<select value={topic} onChange={e=>{updateUrl('topic',e.target.value)}}>{topics.map(t=><option key={t}>{t}</option>)}</select></label><label className="select-label">Access<select value={access} onChange={e=>updateUrl('access',e.target.value)}><option>All</option><option>Free</option><option>Premium</option></select></label></div></div><p className="results-count" aria-live="polite">{filtered.length} {filtered.length===1?'resource':'resources'} · Sample catalog</p>{filtered.length?<div className="resource-grid catalog-grid">{filtered.map(r=><ResourceCard resource={r} key={r.slug}/>)}</div>:<div className="empty-state"><Search size={29}/><h2>A different kind of curiosity?</h2><p>No resources match these filters. Try a broader search.</p><button className="button button-outline" onClick={()=>{window.history.replaceState(null,'','/resources')}}><RotateCcw size={15}/>Clear filters</button></div>}</>}
