'use client';
import {createContext, useContext, useEffect, useRef, useState} from 'react';
import {usePathname, useSearchParams} from 'next/navigation';
import Link from '@/components/navigation-link';
import {BookOpen, Boxes, FileText, FolderOpen, GraduationCap, Image, Layers3, Library, Menu, Plus, ShieldCheck, X, Download, Wrench, Globe, PanelsTopLeft, MessageSquareQuote, ClipboardList, Star} from 'lucide-react';
import {OwnerSignout} from './session-buttons';
import {resourceDefinitions} from '@/lib/resource-types';
import {resourceTypes} from '@/lib/server/resources/validation';
const icons = {PROJECT: Wrench, ARTICLE: FileText, COURSE: GraduationCap, PATH: Layers3, LESSON: BookOpen, DOWNLOAD: Download, BOOK: Library, GUIDE: FolderOpen, ILLUSTRATION: Image};
const DirtyContext = createContext<(value: boolean) => void>(() => {});
export function useAdminDirty(value: boolean) {
  const setDirty = useContext(DirtyContext);
  useEffect(() => {setDirty(value); return () => setDirty(false);}, [value, setDirty]);
}
export function WorkspaceShell({name, email, children}: {name: string; email: string; children: React.ReactNode}) {
  const path = usePathname(), params = useSearchParams();
  const type = params.get('type'), status = params.get('status');
  const [open, setOpen] = useState(false), [dirty, setDirty] = useState(false);
  const menu = useRef<HTMLButtonElement>(null), sidebar = useRef<HTMLElement>(null);
  useEffect(() => setOpen(false), [path, type, status]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const resize = () => {if (window.innerWidth > 950) setOpen(false);};
    window.addEventListener('resize', resize);
    sidebar.current?.querySelector<HTMLElement>('a,button')?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {setOpen(false); menu.current?.focus();}
      if (event.key === 'Tab') {
        const nodes = sidebar.current?.querySelectorAll<HTMLElement>('a,button');
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
        else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
      }
    };
    document.addEventListener('keydown', close);
    return () => {document.removeEventListener('keydown', close); window.removeEventListener('resize', resize); document.body.style.overflow = previousOverflow;};
  }, [open]);
  const libraryActive = path === '/admin/resources' && !type && !status;
  return <DirtyContext.Provider value={setDirty}><div className="workspace-shell" onClickCapture={event => {
    const target = (event.target as HTMLElement).closest('a');
    if (dirty && target && target.target !== '_blank' && new URL(target.href).href !== window.location.href && !window.confirm('Leave without saving your changes?')) {event.preventDefault(); event.stopPropagation();}
  }}><header className="workspace-header"><div className="workspace-brand"><button ref={menu} className="workspace-menu" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="workspace-sidebar" onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button><Link href="/admin/resources"><strong>learn<span>WithRich</span></strong><span className="workspace-label">STUDIO</span></Link></div><div className="workspace-header-trail"><span>Workspace</span><span>/</span><strong>{path.includes('/security') ? 'Security' : path.includes('/community/guestbook') ? 'Guest book' : path.includes('/community/service-requests') ? 'Service requests' : path.includes('/community/reviews') ? 'Reviews' : path.includes('/homepage') ? 'Homepage builder' : path.includes('/resources/new') ? 'New resource' : path.includes('/resources/') ? 'Resource editor' : 'Resources'}</strong></div><div className="workspace-header-actions"><Link href="/" className="workspace-site-link"><Globe size={16}/>View website</Link><span className="workspace-avatar" aria-label={`Signed in as ${name}`}>{name.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase()}</span></div></header>
      {open && <button type="button" className="workspace-backdrop" aria-label="Close navigation" onClick={() => {setOpen(false); menu.current?.focus();}}/>}
      <aside id="workspace-sidebar" ref={sidebar} role={open ? 'dialog' : undefined} aria-modal={open || undefined} className={`workspace-sidebar${open ? ' is-open' : ''}`} aria-label="Workspace navigation"><div className="workspace-sidebar-intro"><span className="workspace-space-icon"><Boxes size={19}/></span><div><strong>Your creator workspace</strong><span>LearnWithRich</span></div></div><Link href="/admin/resources/new" className="workspace-create"><Plus size={17}/>Create resource</Link><nav><p className="workspace-nav-label">WORKSPACE</p><Link href="/admin/resources" className={`workspace-nav-item${libraryActive ? ' active' : ''}`} aria-current={libraryActive ? 'page' : undefined}><Library size={18}/>All resources</Link><Link href="/admin/homepage" className={`workspace-nav-item${path.startsWith('/admin/homepage') ? ' active' : ''}`} aria-current={path.startsWith('/admin/homepage') ? 'page' : undefined}><PanelsTopLeft size={18}/>Homepage builder</Link><Link href="/admin/resources?status=DRAFT" className={`workspace-nav-item${status === 'DRAFT' ? ' active' : ''}`} aria-current={status === 'DRAFT' ? 'page' : undefined}><FileText size={18}/>Drafts</Link><p className="workspace-nav-label">RESOURCE TYPES</p>{resourceTypes.map(key => {const Icon = icons[key]; const active = path === '/admin/resources' && type === key; return <Link href={`/admin/resources?type=${key}`} className={`workspace-nav-item${active ? ' active' : ''}`} key={key} aria-current={active ? 'page' : undefined}><Icon size={17}/>{resourceDefinitions[key].plural}</Link>;})}<p className="workspace-nav-label">SETTINGS</p><Link href="/admin/security" className={`workspace-nav-item${path === '/admin/security' ? ' active' : ''}`} aria-current={path === '/admin/security' ? 'page' : undefined}><ShieldCheck size={18}/>Account & security</Link></nav><nav className="workspace-community-nav"><p className="workspace-nav-label">COMMUNITY & SERVICES</p><Link href="/admin/community/guestbook" className={`workspace-nav-item${path.startsWith("/admin/community/guestbook") ? " active" : ""}`}><MessageSquareQuote size={17}/>Guest book</Link><Link href="/admin/community/service-requests" className={`workspace-nav-item${path.startsWith("/admin/community/service-requests") ? " active" : ""}`}><ClipboardList size={17}/>Service requests</Link><Link href="/admin/community/reviews" className={`workspace-nav-item${path.startsWith("/admin/community/reviews") ? " active" : ""}`}><Star size={17}/>Reviews</Link></nav><div className="workspace-sidebar-account"><span className="workspace-account-name">{name}</span><span title={email}>{email}</span><OwnerSignout beforeSignout={() => !dirty || window.confirm('Sign out without saving your changes?')}/></div></aside><div className="workspace-main" inert={open}><div className="workspace-content">{children}</div><footer className="workspace-footer"><span>LearnWithRich Studio</span><span>A space to make knowledge useful.</span></footer></div></div></DirtyContext.Provider>;
}
