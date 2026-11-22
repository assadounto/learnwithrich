type Shape = 'eyebrow' | 'title' | 'title-short' | 'text' | 'text-short' | 'media' | 'button' | 'chip' | 'cover' | 'avatar';

function Block({shape}: {shape: Shape}) {
  return <span className={`page-skeleton__block page-skeleton__block--${shape}`} />;
}

function LoadingFrame({label, className, children}: {label: string; className: string; children: React.ReactNode}) {
  return <section className={`page-skeleton ${className}`} role="status" aria-label={label}>
    <span className="page-skeleton__status">{label}</span>
    <div className="page-skeleton__content" aria-hidden="true">{children}</div>
  </section>;
}

function CatalogCards({count = 3}: {count?: number}) {
  return <div className="page-skeleton__cards">{Array.from({length: count}, (_, index) => <div className="page-skeleton__card" key={index}>
    <Block shape="media" />
    <div className="page-skeleton__card-copy"><Block shape="eyebrow" /><Block shape="title-short" /><Block shape="text" /><Block shape="text-short" /></div>
  </div>)}</div>;
}

export function HomeLoading() {
  return <LoadingFrame label="Loading the homepage" className="page-skeleton--home">
    <div className="page-skeleton__home-hero">
      <div className="page-skeleton__home-copy"><Block shape="eyebrow" /><Block shape="title" /><Block shape="title-short" /><Block shape="text" /><Block shape="text-short" /><div className="page-skeleton__actions"><Block shape="button" /><Block shape="button" /></div></div>
      <Block shape="media" />
    </div>
    <Block shape="title-short" />
    <Block shape="text" />
    <div className="page-skeleton__chips"><Block shape="chip" /><Block shape="chip" /><Block shape="chip" /></div>
    <div className="page-skeleton__section-heading"><Block shape="title-short" /><Block shape="button" /></div>
    <CatalogCards />
  </LoadingFrame>;
}

export function ProjectsLoading() {
  return <LoadingFrame label="Loading projects" className="page-skeleton--catalog page-skeleton--projects">
    <Block shape="eyebrow" /><Block shape="title" /><Block shape="text" />
    <div className="page-skeleton__filters"><Block shape="text" /><Block shape="button" /><Block shape="button" /></div>
    <div className="page-skeleton__section-heading"><Block shape="title-short" /><Block shape="text-short" /></div>
    <CatalogCards />
  </LoadingFrame>;
}

export function ResourcesLoading() {
  return <LoadingFrame label="Loading resources" className="page-skeleton--catalog page-skeleton--resources">
    <Block shape="eyebrow" /><Block shape="title" /><Block shape="text" />
    <div className="page-skeleton__search"><Block shape="text" /><Block shape="button" /></div>
    <div className="page-skeleton__chips"><Block shape="chip" /><Block shape="chip" /><Block shape="chip" /><Block shape="chip" /></div>
    <CatalogCards />
  </LoadingFrame>;
}

export function CoursesLoading() {
  return <LoadingFrame label="Loading courses" className="page-skeleton--catalog page-skeleton--courses">
    <div className="page-skeleton__course-heading"><Block shape="eyebrow" /><Block shape="title" /><Block shape="text" /><div className="page-skeleton__actions"><Block shape="button" /><Block shape="button" /></div></div>
    <div className="page-skeleton__section-heading"><Block shape="title-short" /><Block shape="text-short" /></div>
    <CatalogCards count={2} />
  </LoadingFrame>;
}

export function LibraryLoading() {
  return <LoadingFrame label="Loading your library" className="page-skeleton--library">
    <Block shape="eyebrow" /><Block shape="title" /><Block shape="text" />
    <div className="page-skeleton__library-shelf"><div><Block shape="cover" /><Block shape="cover" /><Block shape="cover" /></div><div className="page-skeleton__library-copy"><Block shape="eyebrow" /><Block shape="title-short" /><Block shape="text" /><Block shape="text-short" /><Block shape="button" /></div></div>
    <div className="page-skeleton__section-heading"><Block shape="title-short" /><Block shape="text-short" /></div>
    <CatalogCards count={2} />
  </LoadingFrame>;
}

export function ResourceDetailLoading() {
  return <LoadingFrame label="Loading resource details" className="page-skeleton--detail">
    <div className="page-skeleton__breadcrumb"><Block shape="text-short" /><Block shape="text-short" /><Block shape="text-short" /></div>
    <div className="page-skeleton__detail-heading"><Block shape="eyebrow" /><Block shape="title" /><Block shape="text" /><div className="page-skeleton__byline"><Block shape="avatar" /><Block shape="text-short" /></div></div>
    <div className="page-skeleton__detail-layout"><div><Block shape="media" /><div className="page-skeleton__thumbs"><Block shape="media" /><Block shape="media" /><Block shape="media" /></div></div><aside><div className="page-skeleton__panel"><Block shape="title-short" /><Block shape="text" /><Block shape="button" /></div><div className="page-skeleton__panel"><Block shape="eyebrow" /><Block shape="text" /><Block shape="text" /><Block shape="text-short" /></div></aside></div>
    <div className="page-skeleton__tabs"><Block shape="text-short" /><Block shape="text-short" /><Block shape="text-short" /></div>
    <div className="page-skeleton__detail-copy"><div><Block shape="eyebrow" /><Block shape="title" /><Block shape="text" /><Block shape="text" /><Block shape="text-short" /></div><div><Block shape="eyebrow" /><Block shape="title-short" /><Block shape="text" /><Block shape="text-short" /></div></div>
  </LoadingFrame>;
}

export function AccountLoading() {
  return <LoadingFrame label="Loading your account" className="page-skeleton--account">
    <Block shape="eyebrow" /><Block shape="title" /><Block shape="text" />
    <div className="page-skeleton__account-layout"><aside><Block shape="text" /><Block shape="text" /><Block shape="text" /><Block shape="text-short" /></aside><div><div className="page-skeleton__section-heading"><Block shape="title-short" /><Block shape="button" /></div><div className="page-skeleton__account-summary"><div><Block shape="eyebrow" /><Block shape="title-short" /><Block shape="text-short" /></div><div><Block shape="eyebrow" /><Block shape="title-short" /><Block shape="text-short" /></div><div><Block shape="eyebrow" /><Block shape="title-short" /><Block shape="text-short" /></div></div><div className="page-skeleton__panel"><Block shape="title-short" /><Block shape="text" /><Block shape="text" /><Block shape="text-short" /></div></div></div>
  </LoadingFrame>;
}

export function InteriorLoading() {
  return <LoadingFrame label="Loading page" className="page-skeleton--interior">
    <div className="page-skeleton__breadcrumb"><Block shape="text-short" /><Block shape="text-short" /></div>
    <Block shape="eyebrow" /><Block shape="title" /><Block shape="text" /><Block shape="text-short" />
    <div className="page-skeleton__interior-columns"><div><Block shape="media" /><Block shape="title-short" /><Block shape="text" /><Block shape="text" /><Block shape="text-short" /></div><aside><div className="page-skeleton__panel"><Block shape="title-short" /><Block shape="text" /><Block shape="text-short" /></div></aside></div>
  </LoadingFrame>;
}
