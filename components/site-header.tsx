'use client';
import Link from '@/components/navigation-link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X, Bookmark, UserRound } from 'lucide-react';
import { Brand } from './brand';

const links = [['Discover','/'],['Projects','/projects'],['Library','/resources?view=library'],['Courses','/courses'],['About','/about']];

export function Header() {
 const [open,setOpen] = useState(false); const [scrolled,setScrolled] = useState(false); const [signedIn,setSignedIn] = useState(false); const path = usePathname();
 const isCourse=path==='/courses'||path.includes('esp32-first-connected-device')||path.includes('build-a-web-app');const active=path.startsWith('/services')?'':isCourse?'Courses':path==='/resources'||path==='/library'?'Library':path==='/projects'?'Projects':path==='/about'?'About':path==='/'?'Discover':'';
 useEffect(()=>setOpen(false),[path]);
 useEffect(()=>{let active=true;fetch('/api/account/me',{cache:'no-store'}).then(r=>{if(active)setSignedIn(r.ok)}).catch(()=>{});return()=>{active=false}},[path]);
 useEffect(()=>{const update=()=>setScrolled(window.scrollY>12);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update)},[]);
 return <header className={`site-header ${scrolled?'is-scrolled':''}`}><div className="header-inner"><div className="header-brand-group"><Brand emblem/></div><nav className="desktop-nav" aria-label="Main navigation">{links.map(([label,href])=><Link key={label} href={href} className={label===active?'active':''} aria-current={label===active?'page':undefined}>{label}</Link>)}</nav><div className="header-actions"><Link className="header-account-link" aria-label={signedIn?'My account':'Sign in'} href={signedIn?'/account':'/signin'}><UserRound size={16}/><span>{signedIn?'My account':'Sign in'}</span></Link><Link className="button button-dark header-cta" href="/services/request">Request a service</Link><button className="icon-button mobile-menu" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></div>{open&&<nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">{links.map(([label,href])=><Link key={label} href={href} className={label===active?'active':''} aria-current={label===active?'page':undefined} onClick={()=>setOpen(false)}>{label}<ArrowUpRight size={17}/></Link>)}<Link href="/services/request" className="mobile-service-link" onClick={()=>setOpen(false)}>Request a service <ArrowUpRight size={17}/></Link><Link href="/library" onClick={()=>setOpen(false)}>My saved library <Bookmark size={17}/></Link><Link href={signedIn?'/account':'/signin'} onClick={()=>setOpen(false)}>{signedIn?'My account':'Sign in'}<UserRound size={17}/></Link><Link href="/admin" onClick={()=>setOpen(false)}>Creator studio <ArrowUpRight size={17}/></Link></nav>}</header>;
}
