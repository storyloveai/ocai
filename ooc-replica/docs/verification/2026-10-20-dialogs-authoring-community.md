# Dialog, authoring and community maintenance — 2026-10-20

Baseline: `9c62b9fc2828afb247f06224c8feabc00b21161c`, branch `feat/ooc-high-fidelity-replica`, app `ooc-replica/`, existing production `https://project-zhmv2.vercel.app/`.

## Source observations and tool limits

Read both repository READMEs and the prior acceptance report. Read official `morluto/rea` `.agents/skills/reverse-engineer-anything/SKILL.md` v42 and its connection/recovery and runtime-observation references. REA doctor failed with `capability_unavailable`: process ownership inspection cannot read procps process information. No system or MCP configuration was changed, and no REA score is claimed.

The supported cloud browser loaded the original home, Lumencia Academy, OOC Creator Profile and Your New beautiful neighbour. Public DOM confirmed descriptions, settings, prologue/intro, comments and profile links, Titles/Feed, Story/Character and Follow. Original terms and content-preference overlays remain present in this new browser session; no terms were accepted and no original social actions were submitted. Existing captured public HTML supplies the comments and usernames; these are snapshots, not current original-service accounts.

## Implementation

- Search opens a native dialog above the current page with an independent scroll region, 44px back target, content-type filters and creator results. Direct `/search` uses the same dialog over the browsing shell.
- Every catalogue story and character card supports a quick-view dialog, including Three Kingdoms. Six complete captured story previews and the captured neighbour character keep their actual public descriptions. Other titles have a consistent layout and explicitly disclose when their full description has not been captured. Explicit full-information navigation remains available.
- Home ranking/genre tabs keep the hero, sidebar and tab strip mounted, update the content below, preserve the URL and offer sorting. Collection routes remain available for View All.
- Shared history handles both message arrays and Three Kingdoms chapter objects; other chat sessions no longer drop the latter from their sidebar. Opening a Three Kingdoms play session registers it in account-scoped history.
- All eight text authoring fields offer real AI expansion through the existing same-origin `/api/chat` stream, its rate limits, DeepSeek primary and Gemini fallback. Server-owned author prompts validate the field and bound the draft text. Cover data is omitted from requests. Generated text streams into a review box and supports stop, retry, editing and explicit apply. Applying does not silently save or publish. Cover generation remains disconnected; uploads remain available.
- Captured creator/comment names open independent Storylove creator profiles. Titles and Feed tabs, Story/Character filtering, sorting, follow/unfollow, share/copy, comment likes and threaded local replies work. Activity uses existing owner-only account storage and the already-permitted `ooc-comments-*` namespace; no Firestore rule or schema change is needed. Disclosures explain that this is private Storylove activity, not interaction with original OOC users.
- Notification typography is reduced to the shared UI scale. Dialogs, creation controls and creator grids include narrow-screen rules.

## Validation before publication

`npm run build`, `npm run check` (89 passed, 0 failed/skipped) and `git diff --check` passed. Existing Firebase isolation, hosted checkout, streaming, fallback and Three Kingdoms tests remain green. New tests exercise object-shaped history, all eight author prompts, uncaptured and captured story/character dialogs, search background preservation, local category rendering, comment likes/replies, follow restoration, streamed author review/apply, omitted cover payload, and error recovery.

These are automated checks. Production browser acceptance is recorded separately after the deployment completes. Mobile CSS checks do not certify a real mobile viewport or physical handset. Shared multi-user publishing/notifications are not implemented; the user requested an initial demonstration user library.
