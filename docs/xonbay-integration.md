# LearnWithRich × Xonbay

## Deployment

This is now a **server-backed Next.js application**, not a static export. Use the supplied Dockerfile and Compose deployment, which run the standalone Next.js server on a Node-capable host. Keep existing styling and homepage assets. No new database or commerce admin is needed for this phase.

Set `.env.example` values in deployment:
- `XONBAY_SHOP_ID`: verified numeric shop ID **46** (Learn With Rich). Never use RichMade’s ID 8.
- `XONBAY_SHOP_HANDLE=learnwithrich`: must match the canonical shop handle; a storefront subdomain is optional.
- `GOOGLE_CLIENT_ID`: the same Google web client ID accepted by the Xonbay backend (the verified public client ID is already the default and is included in .env.example). Add the exact public origin to that client’s Authorized JavaScript origins in Google Console. The final public origin must be authorized before real sign-in. Rendering the Google button alone does not verify account login. Do not create a different audience without configuring Xonbay’s verifier.
- `APP_URL`: exact HTTPS public origin. Development can use `http://localhost:3000`.
- `XONBAY_API_URL`: API origin, normally `https://api.xonbay.com`.

Deploy the accompanying Xonbay backend change before enabling the customer library. It adds shop IDs to purchase/entitlement snapshots, supports shop-scoped lists and a shop-specific checkout callback. Until then, entitlement checks intentionally fail closed rather than displaying another shop’s purchases.

On the Rails server set `LEARNWITHRICH_SHOP_ID` and `LEARNWITHRICH_FRONTEND_URL` (exact HTTPS origin, no path/query/fragment). The callback is selected only for that shop ID and handle. Existing Xonbay/VEZAKU behavior remains intact.

## Shop setup

The owner created **Learn With Rich**, handle `learnwithrich`, shop ID **46**. Its storefront public metadata and scoped digital catalog were verified on 18 November 2026. The public digital catalog was empty at verification; do not substitute example products or RichMade products. The connected Business tool currently targets RichMade and cannot create or switch shops. Do not rename that shop or use its credentials in this website.

Use shop ID 46 in both deployments. Configure and publish its storefront in Xonbay Business, upload real digital content, mark content ready, and publish its shop listings. These are required by Xonbay’s existing availability rules. The website fetches only public listings and checks both numeric shop ID and canonical handle (or subdomain for older snapshots) on every product read and checkout. It never fetches owner-only files or exposes business credentials.

## Customer journey

Sign in → Google popup on LearnWithRich → Xonbay verifies identity → HTTP-only same-site session cookie → `/dashboard`.

`/`, `/resources` and `/courses` show live shop products alongside the existing marked project/course concepts. `/shop/[public_id]` displays the current server quote, including payment fees. Claiming a free item uses Xonbay’s entitlement flow. Paid checkout initializes through Xonbay, redirects only to `checkout.paystack.com`, then returns to `/checkout/return`. Customers confirm payment there; access is granted only after Xonbay verifies it, never from URL parameters.

The dashboard displays actual accessible LearnWithRich entitlements. Purchased downloads request temporary private links. Course pages show modules, private video/resources and saved lesson progress. Articles render as text. Local project bookmarks remain separate and sample library data is off by default.

## Security and validation

All BFF paths are explicitly routed; there is no arbitrary API proxy. Mutations require the same request origin. Google sign-in uses an HTTP-only nonce bound to the ID token; Xonbay performs signature/audience validation. No session tokens are exposed to client JavaScript or local storage. All account responses are no-store. Product, purchase, course and download access is checked against the configured shop and signed-in customer. Logout revokes the upstream token before clearing the session.

Run `npm test`, `npm run typecheck`, `npm run build`. Rails callback tests are included in the backend PR. Before launch, verify real Google login on the authorized origin, free entitlement, provider test checkout, return/verification, private downloads, course completion, access revocation, sign-out, and a foreign-shop ID. These require the real shop, OAuth configuration and deployed backend. Do not treat placeholder credentials or mocked payments as a completed production purchase.

Existing password-only Xonbay accounts follow Xonbay’s provider-linking policy; this integration does not silently link a Google identity to a different sign-in method.

Confirmed shop setup: `XONBAY_SHOP_ID=46`, `XONBAY_SHOP_HANDLE=learnwithrich`. On Rails use `LEARNWITHRICH_SHOP_ID=46`; set the HTTPS frontend origin as `https://learnwithrich.com`. Google’s live public client configuration was read from Xonbay’s `/api/auth/google-config` endpoint. No client secret is required or stored in this repository.

The chosen production domain is **learnwithrich.com**. Use the deployment files in `deploy/` for the existing `app_edge` Docker network.
