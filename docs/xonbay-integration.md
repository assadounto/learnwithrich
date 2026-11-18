# LearnWithRich × Xonbay

## Deployment

This is now a **server-backed Next.js application**, not a static export. Run `npm run build` then `npm start` on a Node-capable host. Keep existing styling and homepage assets. No new database or commerce admin is needed for this phase.

Set `.env.example` values in deployment:
- `XONBAY_SHOP_ID`: numeric ID of the new LearnWithRich shop. Never use RichMade’s ID 8.
- `XONBAY_SHOP_HANDLE=learnwithrich`: must match the actual shop subdomain.
- `GOOGLE_CLIENT_ID`: the same Google web client ID accepted by the Xonbay backend. Add the exact public origin to that client’s Authorized JavaScript origins in Google Console. Do not create a different audience without configuring Xonbay’s verifier.
- `APP_URL`: exact HTTPS public origin. Development can use `http://localhost:3000`.
- `XONBAY_API_URL`: API origin, normally `https://api.xonbay.com`.

Deploy the accompanying Xonbay backend change before enabling the customer library. It adds shop IDs to purchase/entitlement snapshots, supports shop-scoped lists and a shop-specific checkout callback. Until then, entitlement checks intentionally fail closed rather than displaying another shop’s purchases.

On the Rails server set `LEARNWITHRICH_SHOP_ID` and `LEARNWITHRICH_FRONTEND_URL` (exact HTTPS origin, no path/query/fragment). The callback is selected only for that shop ID and handle. Existing Xonbay/VEZAKU behavior remains intact.

## Shop setup

Create a **new** shop named LearnWithRich, handle `learnwithrich`, under Richmond’s owner account. The connected Business tool currently targets RichMade and cannot create or switch shops. Do not rename that shop or use its credentials in this website.

After creation, record its returned numeric ID in both deployments. Configure and publish its storefront in Xonbay Business, upload real digital content, mark content ready, and publish its shop listings. These are required by Xonbay’s existing availability rules. The website fetches only public listings and checks both numeric shop ID and subdomain on every product read and checkout. It never fetches owner-only files or exposes business credentials.

## Customer journey

Sign in → Google popup on LearnWithRich → Xonbay verifies identity → HTTP-only same-site session cookie → `/dashboard`.

`/`, `/resources` and `/courses` show live shop products alongside the existing marked project/course concepts. `/shop/[public_id]` displays the current server quote, including payment fees. Claiming a free item uses Xonbay’s entitlement flow. Paid checkout initializes through Xonbay, redirects only to `checkout.paystack.com`, then returns to `/checkout/return`. Customers confirm payment there; access is granted only after Xonbay verifies it, never from URL parameters.

The dashboard displays actual accessible LearnWithRich entitlements. Purchased downloads request temporary private links. Course pages show modules, private video/resources and saved lesson progress. Articles render as text. Local project bookmarks remain separate and sample library data is off by default.

## Security and validation

All BFF paths are explicitly routed; there is no arbitrary API proxy. Mutations require the same request origin. Google sign-in uses an HTTP-only nonce bound to the ID token; Xonbay performs signature/audience validation. No session tokens are exposed to client JavaScript or local storage. All account responses are no-store. Product, purchase, course and download access is checked against the configured shop and signed-in customer. Logout revokes the upstream token before clearing the session.

Run `npm test`, `npm run typecheck`, `npm run build`. Rails callback tests are included in the backend PR. Before launch, verify real Google login on the authorized origin, free entitlement, provider test checkout, return/verification, private downloads, course completion, access revocation, sign-out, and a foreign-shop ID. These require the real shop, OAuth configuration and deployed backend. Do not treat placeholder credentials or mocked payments as a completed production purchase.

Existing password-only Xonbay accounts follow Xonbay’s provider-linking policy; this integration does not silently link a Google identity to a different sign-in method.
