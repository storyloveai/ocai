# Storylove fidelity maintenance — 2026-10-20

## Result

Implementation and automated validation are complete for the changes below. GitHub organization installation was restored after the initial 403; release and browser validation are in progress. This is not whole-site fidelity acceptance.

Baseline: branch `feat/ooc-high-fidelity-replica`, commit `6b626b39f447f1ad45bdf944cb6ed4bf59a5b298`. Application: `ooc-replica/`. Existing production: https://project-zhmv2.vercel.app/ .

## Observed in the real browser

- Original home: navigation, rankings, collections, tags and notification banner.
- Existing replica home and My Titles: Storylove brand, first-ranked Three Kingdoms story, catalogue and creation entry point.
- Original My Titles: All / Story / Character / Unregistered tabs, visibility menu (All / Public / Private / Link Only), Latest sorting, empty state and Create Title.
- Original `/builder`: Story / Character selection. Original Story editor: header save/review area, creation navigation, Profile fields, Basic Settings, Intro, and Stat empty state. No original Save or Publish was submitted. Entering its Story editor opened a generated draft route; no content was entered.
- Original MY page: profile, content settings, benefits, creator, support and social navigation. Original account values and private episode identifiers were not copied into code or this report.

These observations were made through the supported cloud browser. They are ordinary browser evidence, not REA-produced Evidence records.

## Implemented

1. Create Title now routes to `/builder`, then `/builder/story/new` or `/builder/character/new`. The editor provides Profile, Basic Settings and Intro; counters; live preview; validated image upload/compression; explicit save; save failure feedback; review of required fields; and a save-or-leave dialog.
2. Drafts are stored through existing account-scoped `ooc-custom` storage. Saved drafts reopen from My Titles, retain stable IDs and edit in place. Legacy title/description drafts remain readable and preserve extra fields. Story and Character tabs filter actual draft types. Visibility and alphabetical/latest sorting work on local entries. Private drafts are never presented as published titles.
3. Creator layout hides the browsing sidebar, supports narrow screens with a single editing column and a separate preview panel, wraps library controls and handles safe-area bottom spacing. Library tabs support arrow keys, Home and End.
4. Onboarding accepts old profiles missing `genres`, invalid genres values, and explicitly empty genre selections.
5. New Ranking / Rankings / Today links no longer produce an empty genre query. They populate the captured local catalogue for story and character types. These are not live upstream rankings.
6. Demo / AI switching remounts the current session even when the URL is unchanged, updating model state and preserving messages.
7. Community page titles now say Storylove.

## Validation actually completed

- `npm run build`: passed.
- `npm run check`: 85 tests passed, 0 failed, 0 skipped.
- New creator regression: create a character draft, fill fields across steps, save, reopen, edit without duplication, filter by type, reopen a legacy draft, preserve legacy fields, and surface storage failure without falsely reporting success.
- Ranking regression: 2 content types × 3 ranking routes, nonempty valid destinations and sorting preservation.
- Expanded chat regression: old-profile genre cases and same-route mode switching.
- Existing Firebase isolation, payment/checkout behavior, streaming, provider fallback and Three Kingdoms rule/save tests remained green. These are automated fixtures, not new live-service acceptance.
- `git diff --check`: passed.

## Initial blockers and remaining unverified scope

- RESOLVED: After user confirmation, installed the official ChatGPT Codex Connector for only `storyloveai/ocai`; connector installation `173251339` is now visible. Initially Git HTTPS push failed because this runtime has no GitHub write credential. GitHub connector `create_tree` and `update_file` each returned HTTP 403 `Resource not accessible by integration`.
- The intended Vercel project and production domain were verified. Existing deployment `dpl_963T7je8XGaiyYGf5rYjkM3FoULs` is READY at the baseline commit. Its Git source does not expose a reusable file tree. No new production deployment was created from the unpublished local changes.
- The cloud browser cannot reach this runtime's loopback server (`ERR_CONNECTION_REFUSED`). Therefore the new editor has DOM/integration validation but has not received live browser visual acceptance. No mobile viewport or physical handset browser acceptance was performed. Responsive CSS is implemented, not visually certified.
- The REA v42 investigation skill was retrieved from official `morluto/rea` and read, including connection/recovery and browser observation guidance. REA doctor failed with `capability_unavailable` because Linux process ownership inspection could not read procps process information. No MCP registration or system/security settings were changed. No REA fidelity score was produced.
- Creation is a private draft workflow. Full original publishing, Stat, Media, Keyword Book, Slash Command, Endings, advanced prompts, all creator settings, coupon/referral/challenge pages and exact original creation artwork remain incomplete.
- No new Firebase OAuth/cloud save acceptance, real model call or paid Checkout completion was performed. No real charge was made and no secrets were retrieved, changed or included in the patch.

## Continue after write access is restored

Apply the accompanying patch to the baseline branch, run `npm ci`, `npm run build`, `npm run check` from `ooc-replica/`, push this branch, and deploy the same Vercel project with its existing production settings. Then browser-test My Titles → Create Title → both content types → save → return → reopen, keyboard dialogs, 390px and 768px layouts, rankings, preferences and session-mode switching. Recheck production `/api/config` availability without disclosing private environment values.
