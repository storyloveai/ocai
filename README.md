# StoryLove.ai

Interactive character chats and novels. The existing character banner is retained.

Build: `npm run build`. Tests: `npm test`. Netlify publishes `dist` with `netlify/functions`; Vercel uses the equivalent `api` handlers. See [setup and integration status](docs/STORYLOVE-SETUP.md) before deployment.

DeepSeek direct streaming is preferred when DEEPSEEK_API_KEY is configured; the existing OpenRouter route is retained for migration. Credentials belong only in the host's secret environment settings.

Google login uses Supabase OAuth/PKCE. Sign-in, server wallets, daily check-in (Asia/Shanghai), and Stripe Checkout require the environment configuration and SQL migration described in the setup guide. Missing configuration is shown explicitly; there are no simulated login or payment successes. Conversations/custom titles are still browser-local. Credits are not yet charged for chat.

Nine adult fan characters and twelve original interactive story scenarios share bounded recent-history SSE chat. AI output may be inaccurate. Character assets are generated fan illustrations; existing fictional character names belong to their rights holders. Custom publishing, cloud conversation sync, long-term memory, credit usage/refunds and full localization remain future work.
