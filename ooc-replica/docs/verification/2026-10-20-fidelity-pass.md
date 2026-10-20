# Storylove fidelity maintenance — 2026-10-20

## Result

Implementation and automated validation are complete for the changes below. GitHub organization installation was restored after the initial 403. Code commit `d89fbe2045da123534d87b1af13aad6c6a9c73a2` is deployed to production and the desktop flows below were browser-verified. This is not whole-site fidelity acceptance.

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

## Production browser acceptance

Production deployment `dpl_EXqrSabEemvrqrk4d26RK9XCbT9k` is READY, target production, commit `d89fbe2`, build duration about 86 seconds, alias `project-zhmv2.vercel.app` attached with no alias error.

Passed in the real browser on that domain:

- Story selection → Profile fields → Basic Settings → Intro; entered Chinese title, introduction, story details, prologue, opening and suggestion; preview updated across steps.
- Saved draft gained a stable URL; My Titles showed it; reopening and full page reload retained the data.
- Review correctly showed required fields complete and disclosed publishing unavailable; Escape closed it.
- Unsaved title change → back → leave-without-saving preserved the previous saved title.
- Created and saved a second Character draft; All counted 2, Story counted 1 and Character counted 1; ArrowRight switched the selected tab.
- Public filter counted 0; Private returned the saved draft; alphabetical sorting remained functional.
- Story New Ranking and Rankings each showed 100 stories; Character Today showed 53 characters. All six ranking destinations are also covered by automated tests.
- Credits rendered the configured 200 / 2,500 / 5,000-credit bundles with a sign-in requirement for balance. No purchase or OAuth flow was submitted.
- Browser error sample (up to 100 captured errors) contained no application errors after excluding browser-extension metadata errors. This is a scoped sample, not a complete production log audit.
- Screenshots were inspected for the desktop editor and My Titles. Test drafts exist only in the testing browser guest cache.

## Initial blockers and remaining unverified scope

- RESOLVED: After user confirmation, installed the official ChatGPT Codex Connector for only `storyloveai/ocai`; connector installation `173251339` is now visible. Initially Git HTTPS push failed because this runtime has no GitHub write credential. GitHub connector `create_tree` and `update_file` each returned HTTP 403 `Resource not accessible by integration`.
- RESOLVED: The original Vercel Git integration deployed the published branch without changing project settings or environment variables. Vercel build/runtime-log access still reports a team-scope 403; complete server log observability is unverified.
- The cloud browser could not reach this runtime's loopback server (`ERR_CONNECTION_REFUSED`), so browser acceptance was performed against the production deployment instead. No mobile viewport or physical handset browser acceptance was performed. Responsive CSS is implemented, not visually certified.
- The REA v42 investigation skill was retrieved from official `morluto/rea` and read, including connection/recovery and browser observation guidance. REA doctor failed with `capability_unavailable` because Linux process ownership inspection could not read procps process information. No MCP registration or system/security settings were changed. No REA fidelity score was produced.
- Creation is a private draft workflow. Full original publishing, Stat, Media, Keyword Book, Slash Command, Endings, advanced prompts, all creator settings, coupon/referral/challenge pages and exact original creation artwork remain incomplete.
- No new Firebase OAuth/cloud save acceptance, real model call or paid Checkout completion was performed. No real charge was made and no secrets were retrieved, changed or included in the patch.

## Next fidelity pass

Verify 390px and 768px viewports and a physical touch device. Continue original-page comparison for Stat, Media, Keyword Book, Slash Command, Endings, personalization, referral/coupon/challenges, full publishing and account/cloud integration. Keep source observations distinct from local adaptations and never report a whole-site pixel score from the earlier obstructed terms screenshot.
