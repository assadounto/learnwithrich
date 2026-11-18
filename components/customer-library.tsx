'use client';
import {useState} from 'react';
import Link from '@/components/navigation-link';
import {ArrowRight,BookOpen,CheckCircle2,Download,FileText,Layers,LoaderCircle} from 'lucide-react';
import type {Entitlement} from '@/lib/xonbay/contracts';
import {courseProgress,type LibraryView} from '@/lib/dashboard';
import {imageUrl} from '@/lib/account';
const formats:Record<string,string>={course:'Course',article:'Guide',download:'Download',bundle:'Bundle'};
export function CustomerLibrary({items,view='all'}:{items:Entitlement[];view?:LibraryView}){
 const [busy,setBusy]=useState('');const [error,setError]=useState('');
 const shown=items.filter(item=>view==='all'||(view==='courses'?item.content_type==='course':item.content_type!=='course'));
 async function file(item:Entitlement,id:number){setBusy(`${item.id}-${id}`);setError('');try{const response=await fetch(`/api/commerce/download/${item.id}/${id}`,{cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error);window.location.assign(data.url)}catch(e){setError((e as Error).message)}finally{setBusy('')}}
 return <section className="dashboard-library" aria-labelledby="dashboard-library-title">
  <div className="dashboard-section-heading"><div><span className="maker-kicker">YOURS TO EXPLORE</span><h2 id="dashboard-library-title">{view==='courses'?'My courses':view==='resources'?'My resources':'My library'}<span>{shown.length}</span></h2></div><Link href="/resources" className="text-link">Find something new<ArrowRight size={15}/></Link></div>
  <nav className="dashboard-library-tabs" aria-label="Filter your library">{([['all','Everything'],['courses','Courses'],['resources','Resources']] as const).map(([key,label])=><Link key={key} href={key==='all'?'/dashboard':`/dashboard?view=${key}`} aria-current={view===key?'page':undefined}>{label}</Link>)}</nav>
  {error&&<p role="alert" className="account-notice">{error}</p>}
  {shown.length?<div className="dashboard-resource-grid">{shown.map(item=>{
   const Icon=item.content_type==='course'?BookOpen:item.content_type==='bundle'?Layers:FileText;
   const progress=courseProgress(item);const cover=imageUrl(item.cover_url);
   return <article className="dashboard-resource-card" key={item.id}>
    <div className={`dashboard-resource-cover resource-${item.content_type}`}>{cover?<img src={cover} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<><Icon size={38} strokeWidth={1.2}/><span>LearnWithRich</span></>}<span className="dashboard-resource-format">{formats[item.content_type]||'Resource'}</span></div>
    <div className="dashboard-resource-body"><span className="dashboard-access-label"><CheckCircle2 size={12}/>In your library</span><h3>{item.title}</h3>
     {item.content_type==='course'?<><div className="dashboard-card-progress"><span>{progress.total?`${progress.completed} of ${progress.total} lessons`:'Ready when you are'}<strong>{progress.percent}%</strong></span><progress max={progress.total||1} value={progress.completed} aria-label={`${item.title}: ${progress.completed} of ${progress.total} lessons completed`}/></div><Link className="button button-outline" href={'/dashboard/learning/'+item.digital_product_public_id}>{progress.completed>0?'Continue learning':'Start learning'}<ArrowRight size={15}/></Link></>:item.content_type==='article'?<><p>Open your guide and explore it at your own pace.</p><Link className="button button-outline" href={'/dashboard/articles/'+item.digital_product_public_id}>Read guide<ArrowRight size={15}/></Link></>:item.files.length?<details className="dashboard-file-list"><summary><Download size={16}/>{item.files.length===1?'Download resource':`Download files (${item.files.length})`}</summary><div>{item.files.map(f=><button key={f.id} disabled={!!busy} onClick={()=>file(item,f.id)}>{busy===`${item.id}-${f.id}`?<LoaderCircle className="dashboard-spinning" size={15}/>:<Download size={15}/>}<span>{f.filename}</span></button>)}</div></details>:<p>Your files are not available right now. Please try again shortly.</p>}
    </div>
   </article>;
  })}</div>:<div className="dashboard-empty"><span className="dashboard-empty-icon"><BookOpen size={30} strokeWidth={1.4}/></span><h3>{view==='courses'?'Your next skill starts here.':view==='resources'?'Good ideas need good resources.':'Make room for your next idea.'}</h3><p>{view==='courses'?'Courses you enrol in will appear here, ready to continue whenever you are.':'Books, guides and resources you buy or claim for free will appear here.'}</p><Link className="button button-orange" href={view==='courses'?'/courses':'/resources'}>Explore {view==='courses'?'courses':'the collection'}<ArrowRight size={16}/></Link></div>}
 </section>;
}
