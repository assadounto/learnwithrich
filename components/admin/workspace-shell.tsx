'use client';

import {createContext, useContext, useEffect, useRef, useState} from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {ChevronRight, FileArchive, FileText, Files, FolderOpen, Globe, Library, Menu, MessageSquareQuote, PanelsTopLeft, Plus, Search, ShieldCheck, X} from 'lucide-react';
import Link from '@/components/navigation-link';
import {resourceDefinitions} from '@/lib/resource-types';
import {OwnerSignout} from './session-buttons';

const sections = [
  {href: '/admin/project-ideas', label: 'Project ideas', icon: FileText},
  {href: '/admin/resources', label: 'Resources', icon: Library},
  {href: '/admin/files', label: 'Files', icon: FolderOpen},
  {href: '/admin/site-contact', label: 'Contact & socials', icon: Globe},
  {href: '/admin/homepage', label: 'Homepage', icon: PanelsTopLeft},
  {href: '/admin/community/guestbook', label: 'Guest book', icon: MessageSquareQuote},
  {href: '/admin/community/service-requests', label: 'Service requests', icon: FileText},
  {href: '/admin/community/newsletter', label: 'Newsletter', icon: FileText},
  {href: '/admin/community/reviews', label: 'Reviews', icon: MessageSquareQuote},
  {href: '/admin/resource-api', label: 'Resource API', icon: FileText},
  {href: '/admin/security', label: 'Account & security', icon: ShieldCheck},
];
const actions = [
  {href: '/admin/resources/new', label: 'New resource', icon: Plus},
  {href: '/admin/resources/import', label: 'Import ZIP', icon: FileArchive},
];

type ResourceEntry = {id: string; title: string; type: keyof typeof resourceDefinitions; status: string};
type WorkspaceTab = {href: string; label: string; type?: string};
function tabDestination(tab: WorkspaceTab) {
  return tab.href === '/admin/resources/new' && tab.type ? `${tab.href}?type=${encodeURIComponent(tab.type)}` : tab.href;
}
const tabStore = 'learnwithrich.studio.tabs';
const home = '/admin/resources';
const tabPath = /^\/admin\/(?:resources\/(?:new|import|[a-f0-9-]{36})|files\/[a-f0-9-]{36}|files|homepage|site-contact|community\/(?:guestbook|service-requests|reviews|newsletter)|project-ideas(?:\/new|\/[a-z0-9-]{1,120}\/edit)?|resource-api|security)$/;
const WorkspaceContext = createContext({
  trackDirty: (_key: object, _dirty: boolean) => {},
  namePage: (_path: string, _label: string) => {},
});

export function useAdminDirty(value: boolean) {
  const {trackDirty} = useContext(WorkspaceContext);
  const key = useRef({});
  useEffect(() => {
    const id = key.current;
    trackDirty(id, value);
    return () => trackDirty(id, false);
  }, [value, trackDirty]);
}

export function WorkspacePageTitle({title}: {title: string}) {
  const {namePage} = useContext(WorkspaceContext);
  const path = usePathname();
  useEffect(() => namePage(path, title), [namePage, path, title]);
  return null;
}

export function WorkspaceShell({name, email, resources, children}: {
  name: string;
  email: string;
  resources: ResourceEntry[];
  children: React.ReactNode;
}) {
  const path = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [restored, setRestored] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [dirtyEditors, setDirtyEditors] = useState<Set<object>>(() => new Set());
  const dirty = dirtyEditors.size > 0;
  const menu = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const palette = useRef<HTMLDialogElement>(null);
  const tabStrip = useRef<HTMLElement>(null);
  const paletteInput = useRef<HTMLInputElement>(null);
  const [context] = useState(() => ({
    trackDirty(key: object, value: boolean) {
      setDirtyEditors(previous => {
        if (previous.has(key) === value) return previous;
        const next = new Set(previous);
        if (value) next.add(key);
        else next.delete(key);
        return next;
      });
    },
    namePage(href: string, label: string) {
      setLabels(previous => previous[href] === label ? previous : {...previous, [href]: label});
    },
  }));

  const resource = resources.find(row => path === `/admin/resources/${row.id}`);
  const label = labels[path] ?? resource?.title ?? [...sections, ...actions].find(item => item.href === path)?.label
    ?? tabs.find(tab => tab.href === path)?.label ?? (path === '/admin/project-ideas/new' ? 'New project idea' : path.startsWith('/admin/project-ideas/') ? 'Edit project idea' : path.startsWith('/admin/files/') ? 'File preview' : 'Resource editor');
  const newType = path === '/admin/resources/new' ? params.get('type') ?? undefined : undefined;
  const activeTab = path === home || tabPath.test(path) ? path : home;
  const matching = resources.filter(row => row.title.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(sessionStorage.getItem(tabStore) ?? '[]');
      if (Array.isArray(stored)) {
        setTabs(stored.filter(tab => typeof tab?.href === 'string' && tabPath.test(tab.href) && typeof tab.label === 'string').slice(0, 30));
      }
    } catch { /* Workspace storage is optional. */ }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored || !tabPath.test(path)) return;
    setTabs(previous => {
      const current = previous.find(tab => tab.href === path);
      if (current && current.label === label && current.type === newType) return previous;
      const next = {href: path, label, type: newType};
      if (current) return previous.map(tab => tab.href === path ? next : tab);
      return [...previous.slice(-29), next];
    });
  }, [restored, path, label, newType]);
  useEffect(() => {
    if (!restored) return;
    try { sessionStorage.setItem(tabStore, JSON.stringify(tabs)); } catch { /* Workspace storage is optional. */ }
  }, [restored, tabs]);
  useEffect(() => {
    const strip = tabStrip.current;
    const current = strip?.querySelector<HTMLElement>('[aria-current="page"]')?.parentElement;
    if (!strip || !current) return;
    const bounds = current.getBoundingClientRect();
    const viewport = strip.getBoundingClientRect();
    if (bounds.left < viewport.left) strip.scrollLeft -= viewport.left - bounds.left;
    else if (bounds.right > viewport.right) strip.scrollLeft += bounds.right - viewport.right;
  }, [activeTab, tabs]);
  useEffect(() => {
    setDrawer(false);
    palette.current?.close();
  }, [path, params]);
  useEffect(() => {
    const openPalette = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (!palette.current?.open) palette.current?.showModal();
        paletteInput.current?.focus();
      }
    };
    window.addEventListener('keydown', openPalette);
    return () => window.removeEventListener('keydown', openPalette);
  }, []);
  useEffect(() => {
    const viewport = window.matchMedia('(max-width: 950px)');
    const sync = () => {
      setNarrow(viewport.matches);
      if (!viewport.matches) setDrawer(false);
    };
    sync();
    viewport.addEventListener('change', sync);
    return () => viewport.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!drawer) return;
    sidebar.current?.querySelector<HTMLElement>('a,button')?.focus();
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawer(false);
        menu.current?.focus();
      } else if (event.key === 'Tab') {
        const nodes = Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a,button,summary') ?? [])
          .filter(element => element.getClientRects().length > 0);
        const first = nodes[0];
        const last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first && last) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last && first) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', dismiss);
    return () => {
      window.removeEventListener('keydown', dismiss);
    };
  }, [drawer]);

  function closeTab(href: string) {
    if (href === activeTab && dirty && !window.confirm('Close this tab without saving your changes?')) return;
    const index = tabs.findIndex(tab => tab.href === href);
    const next = tabs.filter(tab => tab.href !== href);
    setTabs(next);
    if (href === activeTab) {
      const neighbor = next[Math.max(0, index - 1)];
      router.push(neighbor ? tabDestination(neighbor) : home);
    }
  }

  return <WorkspaceContext.Provider value={context}>
    <div className={`workspace-shell studio-shell${collapsed ? ' explorer-collapsed' : ''}`} onClickCapture={event => {
      const anchor = event.target instanceof Element ? event.target.closest('a') : null;
      if (!dirty || !anchor || anchor.target === '_blank' || anchor.hasAttribute('download') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.origin === window.location.origin) return;
      if (!window.confirm('Leave without saving your changes?')) {
        event.preventDefault();
        event.stopPropagation();
      }
    }}>
      <header className="workspace-header">
        <div className="workspace-brand">
          <button ref={menu} type="button" className="workspace-menu" aria-label="Toggle explorer" aria-controls="workspace-sidebar"
            aria-expanded={narrow ? drawer : !collapsed} onClick={() => narrow ? setDrawer(!drawer) : setCollapsed(!collapsed)}>
            <Menu size={20}/>
          </button>
          <Link href={home}><strong>learn<span>WithRich</span></strong><span className="workspace-label">STUDIO</span></Link>
        </div>
        <button type="button" className="studio-quick-open" onClick={() => palette.current?.showModal()}>
          <Search size={16}/><span>Quick open</span><kbd>Ctrl / ⌘ K</kbd>
        </button>
        <div className="workspace-header-actions"><Link href="/" className="workspace-site-link"><Globe size={16}/>View website</Link></div>
      </header>
      {drawer && <button type="button" className="workspace-backdrop" aria-label="Close explorer" onClick={() => {setDrawer(false); menu.current?.focus();}}/>}
      <aside id="workspace-sidebar" ref={sidebar} role={drawer ? 'dialog' : undefined} aria-modal={drawer || undefined} className={`workspace-sidebar${drawer ? ' is-open' : ''}`} aria-label="Studio explorer">
        <div className="studio-explorer-heading"><Files size={16}/> Explorer</div>
        <div className="studio-explorer-actions">{actions.map(({href, label: title, icon: Icon}) =>
          <Link key={href} href={href}><Icon size={16}/>{title}</Link>)}</div>
        <nav aria-label="Content">
          <Link className="workspace-nav-item" href={home} aria-current={path === home && !params.get('type') && !params.get('status') ? 'page' : undefined}><Library size={16}/>All resources</Link>
          <Link className="workspace-nav-item" href={`${home}?status=DRAFT`}> <FileText size={16}/>Drafts</Link>
          {(Object.keys(resourceDefinitions) as ResourceEntry['type'][]).map(type => {
            const entries = resources.filter(row => row.type === type);
            return <details key={type} className="studio-tree-group" open={resource?.type === type || params.get('type') === type ? true : undefined}>
              <summary><ChevronRight size={14}/><FolderOpen size={15}/><span>{resourceDefinitions[type].plural}</span><small>{entries.length}</small></summary>
              <Link className="workspace-nav-item studio-tree-file" href={`${home}?type=${type}`}>Browse {resourceDefinitions[type].plural.toLowerCase()}</Link>
              {entries.slice(0, 12).map(row => <Link className="workspace-nav-item studio-tree-file" key={row.id} href={`${home}/${row.id}`} prefetch={false} aria-current={resource?.id === row.id ? 'page' : undefined}>
                <FileText size={14}/><span title={row.title}>{row.title}</span>{row.status === 'DRAFT' && <small>Draft</small>}
              </Link>)}
            </details>;
          })}
        </nav>
        <nav className="studio-tools" aria-label="Studio tools">
          {sections.filter(item => item.href !== home).map(({href, label: title, icon: Icon}) => <Link key={href} className="workspace-nav-item" href={href}
            aria-current={path === href || path.startsWith(href + '/') ? 'page' : undefined}><Icon size={16}/>{title}</Link>)}
        </nav>
        <div className="workspace-sidebar-account">
          <span className="workspace-account-name">{name}</span><span title={email}>{email}</span>
          <OwnerSignout beforeSignout={() => !dirty || window.confirm('Sign out without saving your changes?')}/>
        </div>
      </aside>
      <div className="workspace-main" inert={drawer}>
        <nav ref={tabStrip} className="studio-tabs" aria-label="Open workspace tabs">
          <div className="studio-tab"><Link href={home} aria-current={activeTab === home ? 'page' : undefined}><Library size={15}/>Resources</Link></div>
          {tabs.map(tab => <div className="studio-tab" key={tab.href}>
            <Link href={tabDestination(tab)} title={tab.label} prefetch={false} aria-current={activeTab === tab.href ? 'page' : undefined}><FileText size={14}/><span>{tab.label}</span></Link>
            <button type="button" aria-label={`Close ${tab.label}`} onClick={() => closeTab(tab.href)}>{dirty && activeTab === tab.href ? <span className="studio-dirty-dot"/> : <X size={15}/>}</button>
          </div>)}
        </nav>
        <div className="workspace-content">{children}</div>
        <footer className="workspace-footer"><span><span className="studio-status-dot"/> LearnWithRich Studio</span><span>{dirty ? 'Unsaved changes' : label}</span></footer>
      </div>
      <dialog ref={palette} className="studio-palette" aria-label="Quick open" onClose={() => setQuery('')}>
        <div className="studio-palette-search"><Search size={18}/>
          <input ref={paletteInput} onKeyDown={event => {
            const first = palette.current?.querySelector<HTMLAnchorElement>('.studio-palette-results a[href]');
            if (!first) return;
            if (event.key === 'ArrowDown') {event.preventDefault(); first.focus();}
            if (event.key === 'Enter') {event.preventDefault(); first.click();}
          }} type="search" aria-label="Find resources or studio tools" placeholder="Find resources or studio tools…" value={query} onChange={event => setQuery(event.target.value)}/>
          <button type="button" aria-label="Close quick open" onClick={() => palette.current?.close()}><X size={18}/></button>
        </div>
        <div className="studio-palette-results">
          {[...actions, ...sections].filter(item => item.label.toLowerCase().includes(query.trim().toLowerCase())).map(({href, label: title, icon: Icon}) =>
            <Link key={href} href={href} onClick={() => palette.current?.close()}><Icon size={16}/>{title}</Link>)}
          {matching.slice(0, 30).map(row => <Link key={row.id} href={`${home}/${row.id}`} prefetch={false} onClick={() => palette.current?.close()}>
            <FileText size={16}/><span>{row.title}</span><small>{resourceDefinitions[row.type].name}</small>
          </Link>)}
          {query.trim() && !matching.length && <Link href={`${home}?q=${encodeURIComponent(query.trim().slice(0, 200))}`} onClick={() => palette.current?.close()}><Search size={16}/>Search the full catalog</Link>}
        </div>
      </dialog>
    </div>
  </WorkspaceContext.Provider>;
}
