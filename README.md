# StoryLove.ai

Interactive character chats and novels. The existing character banner is retained.

Build: `npm run build`. Tests: `npm test`. Netlify publishes `dist` with `netlify/functions`; Vercel uses the equivalent `api` handlers. See [setup and integration status](docs/STORYLOVE-SETUP.md) before deployment.

DeepSeek direct streaming is preferred when DEEPSEEK_API_KEY is configured; the existing OpenRouter route is retained for migration. Credentials belong only in the host's secret environment settings.

Google login uses native Netlify Identity on Netlify when Supabase is not configured, or Supabase OAuth/PKCE on Vercel. Sign-in, server wallets, daily check-in (Asia/Shanghai), and Stripe Checkout require the environment configuration and SQL migration described in the setup guide. Missing configuration is shown explicitly; there are no simulated login or payment successes. Conversations/custom titles are still browser-local. Credits are not yet charged for chat.

Nine adult fan characters use bounded recent-history SSE chat. Twelve editorial novel slots are marked coming soon and cannot start chat until real content is published. AI output may be inaccurate. Character assets are generated fan illustrations; existing fictional character names belong to their rights holders. Custom publishing, cloud conversation sync, long-term memory, credit usage/refunds and full localization remain future work.


## Role prompts and analytics

Nine independent private role contracts: [prompt engineering and fine-tuning preparation](docs/prompts/ROLE-ENGINEERING.md). Generate seed/evaluation JSONL with `npm run export:roles`; no user chat is harvested. First-party events and admin dashboard: [event definitions and setup](docs/analytics/EVENTS.md). Netlify stores events in native Blobs; Vercel uses the Supabase analytics migration. `/analytics.html` requires an allow-listed Supabase admin.

## Product flow refresh

Human-readable browser source is in `src/`; `npm run build` generates `dist/app.js`, `dist/account.js` and locally bundled auth SDKs. `npm run dev` serves the app and the same API handlers on port 4173. Original PNG art is retained in `dist/assets/`; the browser uses compressed WebP from the same directory (regenerate with `python scripts/optimize-assets.py`, Pillow required).

Sandbox wallet activation and verified limitations: [product refresh notes](docs/verification/2026-10-14-product-refresh.md). Apply the checkout-status migration before deploying; `SUPABASE_TEST_PROJECT_REF` must match a dedicated sandbox database for test Checkout. Never use test payments against a live wallet database.
