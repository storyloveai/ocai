# OOC interface replica

Latest responsiveness pass (2026-10-20): hero motion is 320 ms, background blend 420 ms and text fade 200 ms. Ordinary AI story/character sessions generate three context-aware next actions independently of narration and cache them per reply. [API and batch content handoff](content/original-catalog/API-HANDOFF.md).

Latest brand/layout pass (2026-10-20): [book badges, notification navigation, smooth hero shelf and 80 original catalogue drafts](docs/verification/2026-10-20-brand-layout-catalog.md). [Batch content and image-job instructions](content/original-catalog/README.md). Cover generation and live catalogue replacement are pending the user’s image API.

Three Kingdoms update (2026-10-20): [team branch comparison and v2.0 campaign integration](sanguo/SOURCE.md). The default play route now follows Ziheng across eight chapters; the classic three chapters and their saves remain available. Website build and 94 regression checks pass; upstream static checks and 5,000 random runs pass.

Latest maintenance: [dialogs, AI authoring and creator interactions](docs/verification/2026-10-20-dialogs-authoring-community.md).

Current maintenance status (2026-10-20): [fidelity pass and verified limitations](docs/verification/2026-10-20-fidelity-pass.md). This pass adds a typed private-draft editor and fixes ranking, onboarding and session-mode navigation. GitHub organization access is restored. Code commit `d89fbe2` is deployed to production; the linked report records desktop browser acceptance and remaining mobile/full-site gaps. Historical model/configuration notes below are not the source of truth for current production; use server configuration and `/api/config`.

A standalone, interactive reproduction of the publicly observed OOC interface. The precision pass on 2026-10-14 uses complete read-only browser DOM captures, original CSS, 12 local font faces and 299 downloaded image variants. Run `npm ci && npm run build` to bundle the Firebase SDK.

## Run and deploy

Run `npm start`, then open http://127.0.0.1:3000. `npm run check` validates both JavaScript modules. Vercel serves `dist/` with the supplied SPA fallback. The application lives in `ooc-replica/` so the existing repository application is preserved.

## Precision pass

- Exact public home and character catalogue structure, original SVG icons/logo, three-cover carousel stack, gradients, badges, ranking cards, rails, genre strip and responsive rules.
- 99 observed story records and 50 character records, plus featured characters. Search, collections and local bookmarks work independently.
- Captured full details for Lumencia Academy, SOVEREIGN SA, APEX Heroes Academy, Dating the Strongest Hero, and Your New beautiful neighbour.
- A 552 KB core image pack renders the first viewport; the complete local asset pack loads in the background.
- At 1363 × 936, measured home landmarks match the reference: main x=336; Top Ranked y=548; first cover x=337, y=586.59375, 190×286 inside its 192×288 frame; OOC Originals y=1172.75. The initial text-width and wrapping differences were resolved by loading the real Inter fonts.
- Browser-local scripted play sessions, saved history, preferences, drafts and comments remain available. Their demo status is explicit.

## Verification and limits

All four REA skills were reread. REA screenshot comparison was run on the real original and replica in the same carousel/consent-modal state. See `research/precision/REPORT.md`; the source screenshot is obstructed by an unaccepted binding terms modal, so the result is not a whole-site pixel-equivalence score. `?inspection=reference-terms` reproduces that read-only captured state for inspection and performs no consent acceptance.

This is an independent interface reproduction, not an official OOC client. Original OOC backend and balances are not connected. This replica has independent Firebase sign-in and an optional Stripe/Firestore wallet; see [payment setup](docs/PAYMENTS-SETUP.md). AI inference uses this replica’s independent server-side provider adapter when configured. Uncaptured details use clearly identified local previews. Genre assignments for uncaptured records are not authoritative. Desktop search combines observed mobile search structure with a functional desktop adaptation because its original interactive state remains blocked by consent. Mobile CSS is preserved; mobile browser screenshots were not independently verified in this environment.

### Onboarding and authenticated interaction reproduction

The replica now includes `/onboarding/1` through `/onboarding/4`: birthday selection, editable display name, audience and all twelve genre preferences, and the recommendation carousel. Default demo profile: nezuko, Male, all genres. No original account birthday, credentials, or private episode identifiers are published. Birthday validation happens locally; the date is not retained.

`/play/<public-title-id>` distinguishes story narration from character bubbles. The captured shell preserves the 256 px navigation, 56 px header, 768 px message container, model chooser and composer. Simulated transport feeds a separate grapheme-aware typewriter, with waiting spinner, cancellable stop control, partial response persistence, suggestions, message editing/regeneration, settings and local notes. Reading above the bottom pauses automatic following.

Chat mode is explicit: Demo uses simulated replies; AI uses `/api/chat` and the configured server-side model. `/api/config` exposes availability, model name and prompt version, never a key. New sessions default to AI when configured; an explicitly saved Demo preference is preserved. Google/Apple account integration is implemented using Firebase; see [Firebase setup and migration status](docs/FIREBASE-SETUP.md). Providers require console and Vercel configuration. Credits remain a visual demo control and are not charged.

See [可迁移提示词工程](docs/PROMPT-ENGINEERING.md) for the shared character/story system, provider rotation and regression rubric. Existing `DEEPSEEK_API_KEY` + `DEEPSEEK_MODEL` are supported. An alternative OpenAI-compatible provider uses the complete `AI_API_KEY` + `AI_BASE_URL` + `AI_MODEL` group. Only the server sees secrets.

Validation: `npm run check` includes stream drain, split Unicode graphemes, cancellation, failure recovery and unsafe markup escaping. Authenticated observation reports are sanitized; raw account captures remain outside the repository.

### Five independent story profiles and timeout repair

`server/story-prompts.js` adds SOVEREIGN SA, APEX Heroes Academy, Dating the Strongest Hero, Failed Knight of the Swordsmanship Family SA and I Became the Commander of the Trash Knight Order. See [five complete prompt templates and trial cases](docs/FIVE-STORY-PROMPTS.md). Their openings and suggested prompts are exported to `dist/assets/scenarios.json`; public source premises and original adaptation details are labeled separately.

The prior generic provider error was reproduced as a 55-second timeout. Interactive DeepSeek requests explicitly disable thinking; other providers receive no DeepSeek-only parameter. Error codes distinguish timeout, authentication, insufficient balance, rate limiting, invalid upstream configuration, exhausted output budget and empty responses. Failed assistant placeholders are filtered from subsequent requests and can be retried without duplicating the user message. Diagnostic logs omit secrets and conversation content.


## Gemini provider configuration

Production now automatically prefers `GEMINI_API_KEY` (also accepts `GOOGLE_GENERATIVE_AI_API_KEY`). The native `@ai-sdk/google` adapter sends the key only to Google's official Gemini API, through a server-side header. Keys are never returned by `/api/config` or included in prompts.

- Default model: `gemini-3.8-flash`, verified against Google's stable model catalog on 2026-10-15. Override with `GEMINI_MODEL`.
- Optional `AI_PROVIDER`: `gemini` / `google`, `deepseek`, or `compatible`. An explicit incomplete selection fails closed; it never borrows another provider's key.
- Auto selection order: Gemini key, custom `AI_*` configuration, DeepSeek configuration. Existing DeepSeek variables may remain while Gemini is active.
- Shared role prompts, history, stream framing, cancel and retry work across providers. Gemini 3 Flash uses low thinking depth; thought summaries are not displayed. Redeploy after changing Vercel environment variables.
- Production-only keys do not apply to Preview deployments. Verify the production domain after deployment.

## Firebase accounts

See [Firebase setup](docs/FIREBASE-SETUP.md) for deployment variables, Google and Apple activation, Firestore rules, verification and the separate Supabase data migration plan. The implementation is ready for configuration; provider setup and production OAuth have not yet been verified.

## 名著互动与原创文字内容

[两部名著战役](book-campaigns/README.md)开放《凡人修仙传·谷外微尘》《基督山伯爵·余烬与潮汐》卷一，复用三国CC规则核心，各8章41场景，账号独立存档与AI流式对白。访问 `/play/mortal-path` 与 `/play/monte-cristo`。

[DeepSeek完整文字批次](content/original-catalog/generated-text/INDEX.md)包含40个故事、40个角色，仍为待编辑、待图片的草稿，不自动替换现有目录。
