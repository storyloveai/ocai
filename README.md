# OOC AI — Character Chat MVP

Existing public site: https://oocai.netlify.app/ (new build deployment pending).

Build: `npm run build`. Tests: `npm test`. Netlify publishes `dist` and deploys `netlify/functions`. Connect main from this repository; static Drop uploads do not deploy Functions.

Set `AI_API_KEY` securely in Netlify Functions environment, `AI_BASE_URL=https://openrouter.ai/api/v1`, `AI_MODEL=anthropic/claude-sonnet-4.6`. Key is not included. Before activation set a provider hard spending budget. Fixed Anthropic route, no fallback, no reasoning, max600 tokens. Per-IP/domain rate limit 8/minute; input limits enforced server-side. Missing key returns503, never simulated replies.

Three adult fan characters: Lara Croft, Tifa, Chun-Li. SSE streaming, recent20 messages, localStorage per character, retry, regenerate, new conversation. No account/database/long-term memory. Other stories, payments and custom publishing are UI previews.

See [full handoff](docs/HANDOFF.md) for research, source links, pending deployment and Astra 3D prompt. Paid model responses have not yet been verified. Portraits are generated 2D fan illustrations, not extracted game assets or 3D models.
