# OOC interface replica

A standalone, interactive reproduction of the publicly observed OOC interface. The precision pass on 2026-10-14 uses complete read-only browser DOM captures, original CSS, 12 local font faces and 299 downloaded image variants. No build dependencies are required.

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

This is an independent interface reproduction, not an official OOC client. No original backend, OAuth, payments, real credit balance or AI model is connected. Uncaptured details use clearly identified local previews. Genre assignments for uncaptured records are not authoritative. Desktop search combines observed mobile search structure with a functional desktop adaptation because its original interactive state remains blocked by consent. Mobile CSS is preserved; mobile browser screenshots were not independently verified in this environment.

### Onboarding and authenticated interaction reproduction

The replica now includes `/onboarding/1` through `/onboarding/4`: birthday selection, editable display name, audience and all twelve genre preferences, and the recommendation carousel. Default demo profile: nezuko, Male, all genres. No original account birthday, credentials, or private episode identifiers are published. Birthday validation happens locally; the date is not retained.

`/play/<public-title-id>` distinguishes story narration from character bubbles. The captured shell preserves the 256 px navigation, 56 px header, 768 px message container, model chooser and composer. Simulated transport feeds a separate grapheme-aware typewriter, with waiting spinner, cancellable stop control, partial response persistence, suggestions, message editing/regeneration, settings and local notes. Reading above the bottom pauses automatic following.

Responses are explicitly marked Demo. Google/Apple buttons open the local onboarding demonstration; they do not perform OAuth. Current model tiers and credits are visual demo controls. Real AI is not connected. A future server can accept `POST /api/chat` with `{messages: [{role, content}]}` and return UTF-8 `text/plain` streaming content. Only the server may hold a provider key; add authentication and usage controls before enabling paid inference. `httpStream` already supports split UTF-8 chunks and AbortSignal cancellation, and rejects a static HTML fallback.

Validation: `npm run check` includes stream drain, split Unicode graphemes, cancellation, failure recovery and unsafe markup escaping. Authenticated observation reports are sanitized; raw account captures remain outside the repository.
