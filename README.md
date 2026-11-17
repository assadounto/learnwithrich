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

The production build statically exports the site to `out/`. Deploy that directory on any static hosting service, or remove `output: 'export'` from `next.config.ts` when introducing a server backend.

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

Only resources with a `download` field in `lib/catalog.ts` provide a file. Premium resources are labeled in preparation; no payments or simulated purchases occur. Course interest is stored on the current device only. Newsletter submission does not store or send email; the UI reports that subscriptions are not connected. Bookmarks also stay in the current browser.

Next steps: connect a CMS or backend, authentication, durable library and purchase records, payments, verified download authorization, course video delivery and mailing-list consent/subscription handling. Replace all preview covers and content with final published materials.

Typography uses self-hosted Fraunces (roman and true italic) and DM Sans variable fonts, with Georgia/Arial fallbacks. Latin, Latin Extended and punctuation subsets are compressed as WOFF. Their SIL Open Font Licences are included in `public/fonts/`. No runtime Google Fonts requests are required. All core imagery is local.

Reusable decorative SVGs in `components/decorative-marks.tsx` provide tapered underlines, accent rays and the wordmark asterisk. `public/marks/torn-edge.svg` supplies a restrained paper edge.

## Homepage reference

The homepage follows the supplied maker-journal reference: two-line hero, transparent electronics/book collage, torn orange statement strip, bordered project cards, dark resource shelf, course cards, RA introduction and compact footer. `components/reference-art.tsx` uses CSS background windows to display only the artwork regions of the provided reference; text, navigation, search and actions are native HTML. The hero collage is a transparent AI-generated extraction/enhancement of the reference. The homepage switches to a stacked responsive layout below 580px.

The header sign-in link opens an honest account-availability page. Newsletter submission displays a not-connected message and does not store or transmit email. See `/privacy` for the current preview behaviour.
