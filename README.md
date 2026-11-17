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
- SVG implementation of the selected LR/arrow brand concept and favicon.
- Searchable resource catalog with intersecting type, topic and access filters.
- Individual resource pages, planned course curricula, and an About page.
- Browser-local bookmarks and saved library, with no account required.
- Two real downloadable Markdown planning samples.
- Keyboard focus styles, semantic landmarks, mobile navigation and reduced-motion support.

## Preview content and integration boundaries

This is a foundation, not a launched course storefront. Catalog entries, book covers and course plans are examples. Photographic project imagery is AI-generated concept art; it does not document completed hardware or verified designs. The `public/images/maker-studio.webp` asset contains four photos in a 2×2 grid displayed using CSS background positions. Other covers are HTML/CSS and SVG.

Only resources with a `download` field in `lib/catalog.ts` provide a file. Premium resources are labeled in preparation; no payments or simulated purchases occur. Course interest and launch interest are stored on the current device only, and the UI explicitly states that notifications and mailing-list subscriptions are not connected. Bookmarks also stay in the current browser.

Next steps: connect a CMS or backend, authentication, durable library and purchase records, payments, verified download authorization, course video delivery and mailing-list consent/subscription handling. Replace all preview covers and content with final published materials.

Google Fonts provides DM Sans and DM Serif Display; system sans-serif and Georgia remain available if fonts are blocked. All core imagery is local.
