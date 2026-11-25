import type {ReactNode} from 'react';

export function ProjectCatalogHero({label, title, children, actions, artwork}: {
  label: string; title: ReactNode; children: ReactNode; actions: ReactNode; artwork: ReactNode;
}) {
  return <header className="owned-projects-hero">
    <div>
      <span className="maker-kicker">{label}</span>
      <h1>{title}</h1>
      {children}
      <div className="project-hero-actions">{actions}</div>
    </div>
    <div className="owned-projects-art" aria-hidden="true">{artwork}</div>
  </header>;
}
