# Brand details, navigation and catalogue preparation — 2026-10-20

Baseline: `9d3ff12`, app `ooc-replica/`, production branch `feat/ooc-high-fidelity-replica`.

## Changes

- ORIGINAL badges use a yellow book mark derived from the current StoryDate logo. Hydration and quick-view dialogs use the same SVG, so later rendering cannot restore the original site's star image.
- The signed-in sidebar Notification item copies the Credits label's original typography class. Its text uses the same 14px / 21px / 400 scale. Its icon and hit area remain aligned with its peers.
- Announcement back now follows the application-owned source history entry. A notice opened from home returns home; a detail opened from the list returns to the list. Direct visits use deterministic list/home fallbacks rather than an unrelated profile or external history entry. In-app history entries also record scroll positions for restoration.
- Desktop featured covers are persistent linked nodes. Covers move between depth/scale/opacity positions with a 650ms easing curve; the title/description fade into the next selection. Mouse/pointer dragging, horizontal trackpad gestures, keyboard arrows, next/previous and wraparound share the same active slide. Vertical gestures remain available for page scrolling. Dragging cannot accidentally follow a cover link. Autoplay pauses while hovering/focusing the hero; reduced motion disables it and transitions. The mobile track retains its swipe behavior with eased movement.

## Original content preparation

Following the user's updated instruction, prepare text and generation jobs only. `content/original-catalog/` contains 40 stories and 40 characters with independent titles, premises, openings, category/tags, adult character ages/personas, unique English cover prompts and stable IDs/image filenames. JSON, JSONL, a generation-job JSONL and a review index are supplied. `npm run originals:export` regenerates outputs from the authored ideas.

The 80 candidates cover 51.95% of the current 154 unique catalogue IDs. This is a future replacement plan, not a claim that live art or content has already changed. All covers remain pending, `assetUrl` stays null, and no image API is configured or called by the website. Generated/reviewed images and matching text must be activated together under new IDs; existing user sessions remain tied to their old IDs. These are authored premises, not completed Three Kingdoms-depth rule campaigns. No plays, human creators or comments are fabricated. Book decomposition is deferred as requested.

## Reference observations and verification boundary

The original home loaded in the supported cloud browser. Its current Terms dialog blocks interaction; no terms were accepted. Read-only DOM inspection of the rendered carousel confirms a 280px desktop hero with three overlapping cover layers and 300ms `all` transitions. The new website shelf keeps that composition, with a longer easing curve for the requested smoothness. This is a browser observation, not a REA score or a claim that the blocked original interaction was exercised.

Local validation: `npm run build`, `npm run check` — 99 tests pass. Added checks cover book badge persistence, Notification typography inheritance, owned navigation/direct-entry fallbacks, persistent cover nodes across wraparound and drag suppression, and completeness/uniqueness/pending status of all 80 draft/image jobs. Production browser acceptance is reported after deployment. Mobile viewport/physical handset and fresh signed-in account UI are not certified by these node fixtures.

Existing Firebase, Stripe, DeepSeek/Gemini and Three Kingdoms configuration/content remain unchanged. No keys are read, edited or committed; no real payment is made.

## Production acceptance

Production `fc27b3a` reached READY with `project-zhmv2.vercel.app` attached (88s build). Browser verified six persistent hero cover nodes, 650ms cover transitions, matching active cover/Explore href, book badge SVG URLs, home announcement → Back → home, and direct announcement → list. Follow-up hardens direct-entry list Back so it cannot cycle to the detail, and keeps keyboard focus on the newly active cover. The signed-in cloned sidebar typography is verified by DOM fixtures; mobile/physical handset remains unverified. Original catalogue content remains unchanged pending image production.

Session-sidebar production check: Notifications and Credits both measure 14px with 21px line-height. Opened Notifications, switched to Comment, closed the dialog; the play-session URL was unchanged. No model generation or charge was initiated.
