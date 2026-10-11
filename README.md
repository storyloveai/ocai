# OOC AI — Character Chat MVP

Public site: https://oocai.netlify.app/ — GitHub main is connected and the character-chat build is deployed (2026-10-10).

Build: `npm run build`. Tests: `npm test`. Netlify publishes `dist` and deploys `netlify/functions`. Connect main from this repository; static Drop uploads do not deploy Functions.

Set `AI_API_KEY` securely in Netlify Functions environment, `AI_BASE_URL=https://openrouter.ai/api/v1`, `AI_MODEL=anthropic/claude-sonnet-4.6`. Key is not included. AI_BASE_URL and AI_MODEL are saved in Netlify. AI_API_KEY has been securely saved as a production secret; production /api/status returns ready:true. Real production chat replies were verified on 2026-10-10. Before activation set a provider hard spending budget. Fixed Anthropic route, no fallback, no reasoning, max600 tokens. Per-IP/domain rate limit 8/minute; input limits enforced server-side. Missing key returns503, never simulated replies.

Nine adult fan characters: Lara Croft, Tifa, Chun-Li, Mai Shiranui, Fujiko Mine, Nami, Nico Robin, Boa Hancock, and an adult daily-life fan version of Misa Amane. See [character configuration](docs/characters.md). SSE streaming, recent20 messages, localStorage per character, retry, regenerate, new conversation. No account/database/long-term memory. Other stories, payments and custom publishing are UI previews.

See [full handoff](docs/HANDOFF.md) for research, source links, deployment verification and Astra 3D prompt. Three real Chinese character replies and a two-turn browser context test passed on 2026-10-10. All nine original PNG portraits are committed. Portraits are generated 2D fan illustrations, not extracted game assets or 3D models. Browser checks passed for the three openings, image loading, failure/retry, refresh recovery, and new conversations. Production rate limiting returned 429; real streamed replies and browser context retention were tested.
