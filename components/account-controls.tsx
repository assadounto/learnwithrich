'use client';
import Link from '@/components/navigation-link';
import {usePathname,useRouter} from 'next/navigation';
import {useEffect,useId,useRef,useState} from 'react';
import {Bookmark,BookOpen,ChevronDown,LayoutDashboard,LogOut,ShoppingBag} from 'lucide-react';
import {AccountAvatar} from './account-avatar';
import type {AccountUser} from '@/lib/account';

export function AccountLink(){
  const [user,setUser]=useState<AccountUser|null>(null);
  const [ready,setReady]=useState(false);
  const path=usePathname();
  useEffect(()=>{
    let active=true;
    let request:AbortController|undefined;
    async function read(){
      request?.abort(); request=new AbortController();
      try{
        const response=await fetch('/api/auth/session',{cache:'no-store',signal:request.signal});
        if(!response.ok)return;
        const data=await response.json();
        if(active)setUser(data.user||null);
      }catch{/* Keep the current identity during temporary network failures. */}
      finally{if(active)setReady(true)}
    }
    void read();
    window.addEventListener('lwr-account-change',read);
    window.addEventListener('focus',read);
    return()=>{active=false;request?.abort();window.removeEventListener('lwr-account-change',read);window.removeEventListener('focus',read)};
  },[path]);
  if(!ready)return <span className="account-checking" role="status"><span aria-hidden="true"/><span className="sr-only">Checking your account…</span></span>;
  return user?<ProfileMenu user={user}/>:<Link href="/signin" className="sign-in-link">Sign in</Link>;
}

export function ProfileMenu({user}:{user:AccountUser}){
  const [open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const firstLink=useRef<HTMLAnchorElement>(null);
  const id=useId();
  const path=usePathname();
  useEffect(()=>setOpen(false),[path]);
  useEffect(()=>{
    if(!open)return;
    const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus()}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)};
  },[open]);
  return <div className="account-profile" ref={root} onBlur={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget as Node))setOpen(false)}}>
    <button ref={trigger} className="account-trigger" aria-label={`${user.name}: account options`} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();setOpen(true);requestAnimationFrame(()=>firstLink.current?.focus())}}}>
      <AccountAvatar user={user}/><span className="account-trigger-name">{user.name.split(/\s+/)[0]}</span><ChevronDown size={14} aria-hidden="true"/>
    </button>
    {open&&<div id={id} className="account-dropdown">
      <div className="account-dropdown-identity"><AccountAvatar user={user}/><div><strong>{user.name}</strong><span>Your LearnWithRich account</span></div></div>
      <nav aria-label="Your account">
        <Link ref={firstLink} href="/dashboard" onClick={()=>setOpen(false)}><LayoutDashboard size={17}/>My dashboard</Link>
        <Link href="/dashboard?view=courses" onClick={()=>setOpen(false)}><BookOpen size={17}/>My courses</Link>
        <Link href="/dashboard?view=resources" onClick={()=>setOpen(false)}><ShoppingBag size={17}/>My resources</Link>
        <Link href="/library" onClick={()=>setOpen(false)}><Bookmark size={17}/>Saved bookmarks<span className="account-local-tag">This browser</span></Link>
      </nav>
      <SignOut compact/>
    </div>}
  </div>;
}

export function SignOut({compact=false}:{compact?:boolean}){
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const router=useRouter();
  return <div className={compact?'account-signout':''}><button className={compact?'account-signout-button':'button button-outline'} disabled={busy} onClick={async()=>{
    setBusy(true);setError('');
    try{const response=await fetch('/api/auth/logout',{method:'POST'});if(!response.ok)throw Error('Could not sign out. Try again.');window.dispatchEvent(new Event('lwr-account-change'));router.replace('/signin');router.refresh()}
    catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }}><LogOut size={16} aria-hidden="true"/>{busy?'Signing out…':'Sign out'}</button>{error&&<p className="account-signout-error" role="alert">{error}</p>}</div>;
}
