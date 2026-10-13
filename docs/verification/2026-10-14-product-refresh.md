# Product flow refresh — 2026-10-14

## Implemented

- Default landing is a novel shelf with 12 editorial placeholders, genre filters, bespoke lightweight CSS covers and clear coming-soon detail pages. Placeholder novels cannot call the chat provider. No invented play counts or published content.
- Unified Chinese navigation, rounded SVG icon set, deep green visual system, desktop and mobile layouts. Removed empty notifications and simulated publishing/settings controls; existing browser drafts, favorites and conversations are preserved.
- Login preserves destination and typed chat draft across OAuth. A checkout/check-in intent resumes after login; repeated clicks share one login. SDK is bundled locally. Account readiness does not await its own wallet API calls; wallet refreshes deduplicate and ignore stale responses for a prior user.
- Checkout has stable retry IDs, fixed server-side price catalog, verified ownership on return, and bounded payment confirmation polling. Only signed paid webhook events grant credits. The return/status endpoint only queries fulfillment. Unpaid asynchronous events do not grant credits.
- Preserved dedicated Supabase sandbox database isolation. Test payments are allowed only when SUPABASE_TEST_PROJECT_REF exactly matches SUPABASE_URL. Live payments cannot use a marked sandbox. Added server-only read-only fulfillment status and ledger index.
- Nine original PNG sources are retained. The browser uses compressed WebP. Browser WebP assets total about 1.1 MiB instead of 26.3 MiB. Existing streaming text remains batched once per animation frame.

## Activation evidence — 2026-10-14

User authorized browser sign-in fallback and connected Supabase. Vercel and GitHub browser sessions already have access to the exact project/repository. UI-created `product-flow-refresh` branch exists.

The actual deployed source is `vercel-supabase-sandbox@64505df`, while main is older. Preserved its dedicated sandbox guard, explicit managed_payments=false and sanitized Stripe diagnostic logging in the refresh.

Supabase project gixohkydrqoabmjcqquq is ACTIVE_HEALTHY, with existing wallets, ledger and Google user data. It is the dedicated sandbox referenced by SUPABASE_TEST_PROJECT_REF. No replacement test tables or balance reset is needed. Migration 20261013174627_checkout_fulfillment_status was applied: read-only server-only order-status function plus ledger history index. Verified nonexistent order returns false; anon/authenticated cannot execute; service_role can execute. Existing privileged wallet functions likewise deny anon/authenticated. RLS-only analytics/rate-limit tables deliberately have no user policies. Password protection advisory is outside the Google-only login flow.

The currently selected Stripe account is storylove sandbox. Existing webhook endpoint is enabled at https://ocai-murex.vercel.app/api/webhook. No real payments have been charged.

Build and 43 tests pass after retaining deployment-specific fixes. Browser visual QA and test payment follow deployment; see subsequent evidence below.
