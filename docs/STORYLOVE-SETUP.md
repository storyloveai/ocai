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

Create one-time USD prices: 1000 credits/$4.99, 5500/$24.99, 12000/$49.99. Set STRIPE_PRICE_1000, STRIPE_PRICE_5500, STRIPE_PRICE_12000, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and APP_URL (exact HTTPS deployment origin).

Register `https://<deployment>/api/webhook` for checkout.session.completed and checkout.session.async_payment_succeeded. The raw-body signature is checked, then the session is retrieved from Stripe to validate paid status, currency, total, price, quantity, user and metadata. Database transactions and unique Stripe-session references prevent duplicate grants. Pending/cancelled/failed payments grant nothing; success URL alone cannot add credits. Methods available depend on the merchant account/region and its Stripe configuration.

Before live payments: verify success, cancellation, decline, delayed fulfillment and webhook retries; decide credit consumption and refunds; publish your own terms/privacy/support contact. Test and live keys/prices must not be mixed.

## Hosting

Netlify: build `npm run build`, output `dist`, functions `netlify/functions`, use existing netlify.toml. Vercel: import all liiita/ocai (canonical repository: https://github.com/allliiita/ocai), Framework Other, build `npm run build`, output `dist`; `api/*.mjs` uses Vercel Web method handlers, API routes bypass static rewrites. Node 22+, chat maxDuration 60 seconds and request cancellation. Add secrets via host settings and redeploy. Check /api/status and /api/config, then bind storylove.ai using DNS records provided by the host. Google OAuth is supported on either host when callbacks are configured correctly.

## Verification limits

17 local tests cover mocked provider streams, DeepSeek routing/non-thinking, story prompts/user agency, authentication rejection, frontend frame batching and switching races, fixed checkout pricing, webhook signature/replay/tampering, and Stripe amount checks. `npm run build` regenerates manifests. These are not live Google OAuth, database concurrency or Stripe/DeepSeek integration tests. Complete those after configuration. No production secrets were changed.
