# StoryLove configuration and remaining verification

## Implemented

Book/heart SVG branding; existing sliding character banner; frame-batched SSE; stop/retry; drafts; request-switch isolation; nine characters and twelve interactive novels. Google OAuth/PKCE and session persistence use Supabase. Credits come from a server wallet, not the old browser demo. Check-in resets at midnight Asia/Shanghai, grants 100 once daily, and records a ledger entry. Stripe Checkout grants credits only after verified webhook fulfillment. Conversations and custom titles remain local. Credits are currently not charged for chatting. Cloud sync, custom public publishing, long-term memory, refund/reversal automation and full localization are not implemented.

## Supabase + Google

Run `supabase/migrations/202610130001_storylove_wallet.sql` once in Supabase SQL Editor. Store SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in deployment environment settings. Only URL and anon key are public. Authenticated clients have read-only access to their own wallet/ledger. Mutations and RPCs are service-role only.

Create a Google Web OAuth client, use the Supabase callback URL displayed in its dashboard as the Google authorized redirect URI, and enable Google in Supabase Auth with the client ID/secret. Set Supabase Site URL to https://storylove.ai. Allow the exact return URLs `https://storylove.ai/` and `https://storylove.ai/?auth=callback`, plus equivalent URLs for the chosen test deployment. Verify redirect sign-in, callback, refresh, cancellation and logout on desktop/mobile. Sign-in uses redirects for mobile reliability.

## DeepSeek

Store DEEPSEEK_API_KEY securely in the host's secret environment settings. DEEPSEEK_MODEL defaults to `deepseek-flash`. The direct endpoint is https://api.deepseek.com/chat/completions, thinking is disabled, only final answer content is forwarded. This key takes precedence over retained OpenRouter settings, which allow migration/rollback without deleting the old key. Recent-history limits remain 20 messages / 20,000 characters. Official references: https://api-docs.deepseek.com/news/news260910/ and https://api-docs.deepseek.com/guides/thinking_mode/ . Real responses and latency need a configured key.

Once Supabase is configured, chat requires verified login and a persistent per-user 8 requests/60 seconds limit. Vercel requires complete Supabase configuration before exposing chat. Existing Netlify keeps its IP/domain platform limit during migration. Set provider spending limits separately.

## Stripe test mode

Create one-time USD prices: 200 credits/$1.99, 2500/$19.99, 5000/$29.99. Set STRIPE_PRICE_200, STRIPE_PRICE_2500, STRIPE_PRICE_5000, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and APP_URL (exact HTTPS deployment origin).

Register `https://<deployment>/api/webhook` for checkout.session.completed and checkout.session.async_payment_succeeded. The raw-body signature is checked, then the session is retrieved from Stripe to validate paid status, currency, total, price, quantity, user and metadata. Database transactions and unique Stripe-session references prevent duplicate grants. Pending/cancelled/failed payments grant nothing; success URL alone cannot add credits. Methods available depend on the merchant account/region and its Stripe configuration.

Before live payments: verify success, cancellation, decline, delayed fulfillment and webhook retries; decide credit consumption and refunds; publish your own terms/privacy/support contact. Test and live keys/prices must not be mixed.

## Hosting

Netlify: build `npm run build`, output `dist`, functions `netlify/functions`, use existing netlify.toml. Vercel: import allliiita/ocai (canonical repository: https://github.com/allliiita/ocai), Framework Other, build `npm run build`, output `dist`; `api/*.mjs` uses Vercel Web method handlers, API routes bypass static rewrites. Node 22+, chat maxDuration 60 seconds and request cancellation. Add secrets via host settings and redeploy. Check /api/status and /api/config, then bind storylove.ai using DNS records provided by the host. Google OAuth is supported on either host when callbacks are configured correctly.

## Verification limits

18 local tests cover mocked provider streams, DeepSeek routing/non-thinking, story prompts/user agency, authentication rejection, frontend frame batching and switching races, fixed checkout pricing, webhook signature/replay/tampering, and Stripe amount checks. `npm run build` regenerates manifests. These are not live Google OAuth, database concurrency or Stripe/DeepSeek integration tests. Complete those after configuration. No production secrets were changed.

## Live Netlify verification — 2026-10-13

Merged PR #1 and confirmed auto-deployment at https://oocai.netlify.app/. Browser verified StoryLove logo/banner, honest unconfigured wallet/login/payment states, one real Lara response and one real novel continuation via the retained OpenRouter configuration. DeepSeek is still awaiting its key. Vercel dashboard is signed into lindsey-cyber, but importing all liiita/ocai (allliiita/ocai) returns “Could not access the repository”; no new Vercel project was created. Netlify admin currently requires sign-in for environment configuration.

## Netlify native Google login path (added 2026-10-13)

On Netlify, when no Supabase credentials are configured, the app now uses Netlify Identity and a site-wide `storylove-wallets-v1` Blobs store. Enable Identity for oocai, enable Google under Registration → External providers, keep Open registration for public Google sign-in. Netlify's default OAuth app is adequate for test-mode payment verification; visitors see Netlify Identity on the Google consent screen. Branded StoryLove OAuth still needs your Google client credentials. No password signup form is added by this implementation.

The locally bundled @netlify/identity SDK handles OAuth callback/session refresh/logout. Backend verifies the nf_jwt cookie or bearer token at the canonical site's Identity /user endpoint; it never trusts a client user ID. Check-in and Stripe wallet grants use strong reads and ETag compare-and-swap, with deterministic ledger references. Concurrent requests preserve balances; duplicate daily claims/Stripe sessions do not double-grant. There is no anonymous wallet API.

Production Stripe secrets, test prices and signed webhook setup are still required. Use test mode first; signing into Google alone does not imply payment is configured. Native Netlify Identity users can be allow-listed by UUID in ANALYTICS_ADMIN_IDS for the analytics dashboard.

Vercel continues to use the Supabase path and its SQL migrations; exporting users/wallets and establishing identity mapping is required before moving an existing native-Netlify account system. Do not silently change auth providers once real paid accounts exist.

Sandbox keys select the built-in StoryLove sandbox price IDs and an isolated Netlify wallet namespace (`wallet/test/`). Live payments require explicit `STRIPE_LIVE_ENABLED=true` plus all three live price environment variables. Sandbox balances never change existing live wallets. Supabase sandbox wallet mutations fail closed; use a separate test project with an explicit isolated wallet adapter before enabling them.

Checkout requires a per-attempt UUID `request_id`; the browser preserves it for network retries and clears it on a checkout return. Server Stripe API requests use a user/mode/pack/request-scoped Idempotency-Key. Adaptive Pricing is explicitly disabled while fulfillment verifies exact USD totals. The Stripe API version is pinned to 2026-08-26.dahlia.

For sandbox-only deployments, omitted APP_URL defaults to the request origin, so checkout returns to the unpublished preview. Live deployment still requires an explicit HTTPS APP_URL. Apply migration 202610130003_credit_packs.sql for the changed Supabase pack allowlist. Current Netlify wallet does not need SQL.
