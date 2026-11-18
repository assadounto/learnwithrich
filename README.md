# LearnWithRich

A practical learning and project resource website by Richmond Adu-Kyere.

## Development

Requires Node.js 22.6 or later (Node.js 24 recommended).

```sh
npm install
npm run dev
```

Open http://localhost:3000.

```sh
npm test
npm run typecheck
npm run build
```

The production build now requires a Next.js server (`npm run build`, then `npm start`). Static export was removed for secure account and commerce endpoints. See [Xonbay setup](docs/xonbay-integration.md) for shop, Google OAuth and deployment configuration.

## Included

- Responsive editorial homepage using cream, burnt orange and olive.
- Reference-matched serif wordmark and retained LR favicon.
- Searchable resource catalog with intersecting type, topic and access filters.
- Individual resource pages, planned course curricula, and an About page.
- Browser-local bookmarks and saved library, with no account required.
- Two real downloadable Markdown planning samples.
- Keyboard focus styles, semantic landmarks, mobile navigation and reduced-motion support.

## Preview content and integration boundaries

This is a foundation, not a launched course storefront. Catalog entries, book covers and course plans are examples. Photographic project imagery is AI-generated concept art; it does not document completed hardware or verified designs. The `public/images/maker-studio.webp` asset contains four photos in a 2×2 grid displayed using CSS background positions. Other covers are HTML/CSS and SVG.

The local concept catalog remains a preview: only resources with a `download` field in `lib/catalog.ts` provide a sample file. Separately, live LearnWithRich shop listings support real checkout and account access once configured. Course interest is stored on the current device only. Newsletter submission does not store or send email; the UI reports that subscriptions are not connected. Bookmarks also stay in the current browser.

The Xonbay integration implements Google sign-in, secure sessions, live products, checkout/verification, account entitlements, private downloads and course progress. Production acceptance is pending the new shop, Google origin configuration and deployment of backend PR #135. Newsletter subscription handling remains unconnected. Replace all preview covers and content with final published materials.

Typography uses self-hosted Fraunces (roman and true italic) and DM Sans variable fonts, with Georgia/Arial fallbacks. Latin, Latin Extended and punctuation subsets are compressed as WOFF. Their SIL Open Font Licences are included in `public/fonts/`. No runtime Google Fonts requests are required. All core imagery is local.

Reusable decorative SVGs in `components/decorative-marks.tsx` provide tapered underlines, accent rays and the wordmark asterisk. `public/marks/torn-edge.svg` supplies a restrained paper edge.

## Homepage reference

The homepage follows the supplied maker-journal reference: two-line hero, transparent electronics/book collage, torn orange statement strip, bordered project cards, dark resource shelf, course cards, RA introduction and compact footer. `components/reference-art.tsx` uses CSS background windows to display only the artwork regions of the provided reference; text, navigation, search and actions are native HTML. The hero collage is a transparent AI-generated extraction/enhancement of the reference. The homepage switches to a stacked responsive layout below 580px.

The header sign-in link opens Google sign-in; signed-in customers see My dashboard. Newsletter submission displays a not-connected message and does not store or transmit email. See `/privacy` for the current preview behaviour.

The final homepage alignment pass adjusts hero/discovery type scale, project grid gutters, lower-section spacing and the RA divider position. It restores resource-format icons, the yellow book-shelf accent and orange introduction strokes. Tablet labels have minimum readable sizes, and the search action becomes visible on keyboard focus. Catalog and course availability labels remain truthful to the current preview content.

## Interior-page reference implementation

The resource catalog, project details, course details and personal library now follow the supplied four-page maker-journal board. `components/workspace-art.tsx` displays individual artwork regions from `public/images/page-reference.webp`; no webpage is rendered as a screenshot. Catalog search, type/topic/access filters and load-more are functional. Project thumbnails, an accessible native image dialog and keyboard-navigable information tabs are implemented. Course modules expand and the preview action explains video availability.

The personal library includes sidebar views, actual browser-local bookmarks and an explicitly labeled sample-data switch. Preview progress, example prices and receipt dialogs are illustrative; switching preview data off shows no fabricated purchases. Download actions point only to existing Markdown files. That local preview is separate from the real /dashboard account library. Sample data is off by default; the dashboard never fabricates purchases.

The shared header stays pinned during scrolling, retains its height and shows the orange LR mark beside the wordmark. Homepage motion includes a brief hero entrance, one-time scroll reveals and hover feedback. Reduced-motion preferences disable animations; all content stays available without JavaScript. Desktop and narrow-screen browser checks verified the pinned header, mobile menu and absence of horizontal overflow.

The homepage also includes three maker-interest paths linked to live catalog filters, an illustrated solar-project spotlight with the existing free planning download, and three original expandable workbench notes. The sections use responsive layouts and the existing reduced-motion-aware reveals. No external content feed is required.

Homepage recommendation cards are design examples, clearly labelled as sample quotes with placeholder names and roles. Replace the examples in components/home-testimonials.tsx with real, permissioned quotes and attribution before presenting them as endorsements. No ratings, review counts or real identities are invented.

The dedicated /projects page adds an illustrated featured project, search, topic and suggested-level filters, tool tags, empty-state reset and links to the existing planning downloads and detail pages. About includes Richmond’s maker story, software/electronics/documentation focus, selected work and the existing GitHub contact link. The hero uses RA identity artwork and illustrative workbench imagery, not a fabricated portrait or unverified achievements. Header, footer, homepage project buttons and project breadcrumbs now lead to /projects.

Project detail pages now use individual guide content for solar hybrid power, energy monitoring and the maker marketplace. Each includes a question/approach overview, conceptual flow, proposed toolkit, staged planning checkpoints, limitations, prerequisites and related projects. Hardware thumbnails are no longer shown on the software project, and the energy project has an appropriate illustrative image. Project sidebars use useful facts instead of example purchase bundles. A third original Markdown planning sample is available at /downloads/marketplace-project-outline.md. These are project plans, not completed builds or verified engineering specifications.

The site now uses one consistent header across home and interior pages: the same LR wordmark, dimensions, navigation spacing, Sign in and Start exploring actions, sticky behaviour and mobile menu. The interior-only byline and RA profile badge have been removed. Stable scrollbar space prevents horizontal movement between shorter and longer pages. Browser measurements matched across seven desktop page types and between home/About on phone; only the active navigation state changes.

Homepage skills marquee (/#skills-playground): two continuous rows of skill pills glide in opposite directions. A pause/resume button and hover-to-pause keep the motion controllable. Duplicate visual tracks are hidden from assistive technology; reduced motion shows the complete skill collection as a static grid. Without JavaScript, the two original rows remain horizontally scrollable. The former falling/drag physics has been removed.

Homepage motion now sequences the eyebrow, two headline lines, supporting copy, calls to action and collage entrance. Underlines reveal from left to right when their headings enter view. Reusable decorative paper edges connect the spotlight, library, skills playground and newsletter without changing content layout. All effects respect reduced motion; the content remains visible without JavaScript. Browser checks confirmed staggered delays, the pen-reveal trigger, eight coloured paper edges and no horizontal overflow at desktop/phone sizes.


### Shared styling and navigation feedback

Collection cards share borders, corner radii, serif headings and readable copy. Controls use a consistent 44px minimum height; phone collections retain two columns. Mobile navigation includes the active-page state, and Discover links to the homepage.

Internal links retain Next.js prefetch, keyboard/modifier behavior and native anchor semantics through a shared NavigationLink. A React transition drives the orange progress bar, accessible loading announcement and compact spinner while a route opens. Same-page hashes and download links keep their native behavior. Homepage search uses the same navigation feedback. Loading boundaries show a quiet skeleton; route failures have retry and project-navigation actions. Reduced motion keeps a static progress line and text.

Mobile collection cards now use native two-column masonry: cards retain their natural height with 12px gutters and cannot split between columns. Desktop grids stay unchanged; the layout works without JavaScript.
