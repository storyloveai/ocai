# 三国·谋士 website integration

Upstream: `storyloveai/ocai`, `game/sanguo-v2.0` at `1b3ba1bc6cc0b84324b03db675862b6826af119d` (2026-10-20 integration).

`game/sanguo/` is imported verbatim from that commit. Its content, engine, art and published page remain owned by the gameplay team. The contract’s three files are packaged verbatim in `sanguo/upstream/`, with identical Git blob SHAs, because Vercel isolates the `ooc-replica/` root. Website builds consume only the contract's published `web/index.html`, `content/campaign.json` and `engine/campaign_core.js`.

## Branch comparison

`game/sanguo-strategist` at `80a7482` introduces the v1.9.1 continuous original-strategist campaign, rather than the website's three independent original-character scenes. It includes eight chapters from Xuchang to Huarong, five speaking characters, Cao/Liu routes, authored side-story selection, relationships and impressions, consequences for free speech, promises and memories, foresight costs, echoes, narrative debts, maps, layered SVG scenes/portraits, cross-run gallery and ending causality. It also introduces ownership documentation.

`game/sanguo-v2.0` is one commit ahead: three open questions (Cao Cao, Zhuge Liang, Wen Zhi), a playable prison interlude with three escape routes, chapter recaps, Guan Yu's intervention, and a creator-only 17-input model test bench. The public website deliberately hides the creator/test-bench and prototype telemetry features.

## Website adapter

- `build.mjs` copies the published standalone page with checked string markers and website-only adapters. Upstream changes that remove a required marker fail the build explicitly.
- `adapter.js` replaces the prototype capability calls with typed `/api/sanguo` requests. The server pins scene/persona/options to authoritative campaign data; it does not accept arbitrary prompts. Existing DeepSeek default and Gemini-before-visible-output fallback, origin validation, input limits, concurrency limits and timeouts are reused.
- AI assigns authored answer/action IDs and speech labels; the unchanged `CC` engine applies every outcome. Live replies and authored narrative use the site's shared grapheme-aware `typeStream`. Stop rolls back the uncommitted model turn and restores the draft. Completed narration can be revealed immediately.
- `bridge.js` waits for an origin/source-checked parent handshake. Campaign save/settings/gallery use separate `campaign.*` keys within the existing account-scoped Three Kingdoms document. Embedded gameplay never reads prototype-global localStorage. Tab switches affect only the sidebar.
- `/play/three-kingdoms` defaults to the campaign; `?edition=classic` opens the existing three-chapter edition and its unchanged saves. Both appear as the same persistent sidebar title.
- Public styles follow the website's near-black surfaces; upstream SVG scenes and portraits remain. Responsive panel controls and reduced-motion behavior are retained/adapted.

## Update and verification

After updating the untouched upstream folder, copy its three contract files into `sanguo/upstream/` and verify their blob SHAs, then run `npm run build && npm run check` in `ooc-replica/` and `node tools/check.js content/campaign.json 5000` in `game/sanguo/`. No Python runs in the website build. API-generated companion data/core files are build outputs; never edit them manually. No credentials are added or changed by this integration.

Gameplay review: zhouzeya. Website review: allliiita / Lindsey-cyber. Integration changes stay in `ooc-replica/`; no upstream gameplay interface change is required.
