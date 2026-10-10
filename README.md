# OOC AI — Character Chat MVP

Public site: https://oocai.netlify.app/ — GitHub main is connected and the character-chat build is deployed (2026-10-10).

Build: `npm run build`. Tests: `npm test`. Netlify publishes `dist` and deploys `netlify/functions`. Connect main from this repository; static Drop uploads do not deploy Functions.

Set `AI_API_KEY` securely in Netlify Functions environment, `AI_BASE_URL=https://openrouter.ai/api/v1`, `AI_MODEL=anthropic/claude-sonnet-4.6`. Key is not included. AI_BASE_URL and AI_MODEL are saved in Netlify. AI_API_KEY is still missing; production /api/status returns ready:false and valid /api/chat returns JSON 503. Before activation set a provider hard spending budget. Fixed Anthropic route, no fallback, no reasoning, max600 tokens. Per-IP/domain rate limit 8/minute; input limits enforced server-side. Missing key returns503, never simulated replies.

Three adult fan characters: Lara Croft, Tifa, Chun-Li. SSE streaming, recent20 messages, localStorage per character, retry, regenerate, new conversation. No account/database/long-term memory. Other stories, payments and custom publishing are UI previews.

See [full handoff](docs/HANDOFF.md) for research, source links, deployment verification and Astra 3D prompt. Paid model responses have not yet been verified. All three original PNG portraits are now committed. Portraits are generated 2D fan illustrations, not extracted game assets or 3D models. Browser checks passed for the three openings, image loading, failure/retry, refresh recovery, and new conversations. Production rate limiting returned 429; no paid model replies have been tested.
