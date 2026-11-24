'use client';

import {usePathname} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, Bookmark, Menu, UserRound, X} from 'lucide-react';
import Link from '@/components/navigation-link';
import {useSiteAccount} from './site-account';
import {Brand} from './brand';
import {ThemeSwitcher} from './theme-switcher';

const links = [['Discover','/'], ['Projects','/projects'], ['Project Ideas','/project-ideas'], ['Library','/resources?view=library'], ['Courses','/courses'], ['About','/about']];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const path = usePathname();
  const signedIn = Boolean(useSiteAccount());
  const accountHref = signedIn ? '/account' : '/signin';
  const accountLabel = signedIn ? 'My account' : 'Sign in';
  const savedHref = signedIn ? '/account/saved' : '/library';
  const course = path === '/courses' || /esp32-first-connected-device|build-a-web-app/.test(path);
  const active = course ? 'Courses' : path === '/library' || path.startsWith('/resources') ? 'Library'
    : path.startsWith('/project-ideas/') ? 'Project Ideas' : links.find(([, href]) => href === path)?.[0];

  useEffect(() => {
    drawer.current?.close();
  }, [path]);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener('scroll', update, {passive: true});
    const desktop = window.matchMedia('(min-width: 1101px)');
    const resize = () => {if (desktop.matches) drawer.current?.close();};
    desktop.addEventListener('change', resize);
    return () => {
      window.removeEventListener('scroll', update);
      desktop.removeEventListener('change', resize);
    };
  }, []);

  useEffect(() => {
    const bar = header.current;
    const main = bar?.nextElementSibling;
    if (!bar || !(main instanceof HTMLElement) || main.id !== 'main-content') return;

    const measure = () => main.style.setProperty('--hero-header-height', `${bar.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      main.style.removeProperty('--hero-header-height');
    };
  }, []);

  function close() { drawer.current?.close(); }
  function openMenu() {
    if (drawer.current?.open) return;
    drawer.current?.showModal();
    setOpen(true);
  }

  return <header ref={header} className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
    <div className="header-inner">
      <div className="header-brand-group"><Brand emblem/></div>
      <nav className="desktop-nav" aria-label="Main navigation">{links.map(([label, href]) => <Link key={href} href={href}
        className={label === active ? 'active' : ''} aria-current={label === active ? 'page' : undefined}>{label}</Link>)}</nav>
      <div className="header-actions">
        <ThemeSwitcher className="header-theme-switch"/>
        <Link className="mobile-bookmarks" href={savedHref} aria-label="Saved resources"><Bookmark size={17}/></Link>
        <Link className="header-account-link" href={accountHref} aria-label={accountLabel}><UserRound size={16}/><span>{accountLabel}</span></Link>
        <Link className="button button-dark header-cta" href="/services/request">Request a service</Link>
        <button ref={trigger} type="button" className="icon-button mobile-menu" aria-label="Open navigation" aria-haspopup="dialog"
          aria-expanded={open} aria-controls="mobile-navigation" onClick={openMenu}><Menu size={20}/></button>
      </div>
    </div>
    <dialog id="mobile-navigation" className="mobile-drawer" ref={drawer} aria-labelledby="mobile-navigation-title"
      onClose={() => {setOpen(false); trigger.current?.focus();}}
      onClick={event => {if (event.target === event.currentTarget) close();}}>
      <div className="mobile-drawer-content">
        <header><h2 id="mobile-navigation-title">Explore LearnWithRich</h2><button type="button" className="icon-button" onClick={close} aria-label="Close navigation" autoFocus><X size={20}/></button></header>
        <nav aria-label="Mobile navigation">
          {links.map(([label, href]) => <Link key={href} href={href} aria-current={label === active ? 'page' : undefined} onClick={close}>{label}<ArrowUpRight size={16}/></Link>)}
          <Link href={savedHref} onClick={close}>Saved resources <Bookmark size={16}/></Link>
          <Link href={accountHref} onClick={close}>{accountLabel} <UserRound size={16}/></Link>
          <Link href="/admin" onClick={close}>Creator studio <ArrowUpRight size={16}/></Link>
        </nav>
        <footer><ThemeSwitcher className="drawer-theme-switch" showLabel/><Link href="/services/request" className="button button-dark" onClick={close}>Request a service <ArrowUpRight size={16}/></Link></footer>
      </div>
    </dialog>
  </header>;
}
