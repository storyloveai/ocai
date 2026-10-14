# OOC interactive interface replica

A standalone HTML/CSS/JavaScript reproduction of the observed public OOC interface, captured on 2026-10-14. No build dependencies are required.

## Run locally

```sh
npm start
```

Open http://127.0.0.1:3000. The server supports direct links and refreshing application routes. `npm run check` checks JavaScript syntax. Deploy `dist/` on a static host with SPA fallback; `vercel.json` is included.

## Implemented

- Dark sidebar, six-slide carousel, category strip, horizontal ranking rails, originals, tags, and responsive mobile layout.
- 28 downloaded original story covers and source metadata.
- Search by title, creator and genre; category filtering; collection pages.
- Story information pages, bookmarks, avatar settings, character/prologue tabs.
- Browser-local drafts, comments, bookmarks, conversation history and content preference.
- Clearly labeled scripted story demo with persisted sessions.
- Character page, credits display, notification and sign-in explanation dialogs.

## Boundaries

This is an independent interface replica, not an official OOC client. No original backend, OAuth, payments, actual credit balance or AI model is connected. Detail content other than the observed Lumencia Academy description is demo content. Character asset downloads returned HTTP 403, so character previews use story-cover demo artwork. Genre assignments are local demo metadata. Preferences are stored locally and do not personalize the catalogue.

## Investigation

GitHub plugin retrieved REA's browser-observation documentation. REA CLI 6.4.0 was installed through its official npm package and invoked against the downloaded public JavaScript. See `research/REPORT.md` for capture evidence and limitations.

The original site displayed a binding terms-confirmation modal. It was not accepted. Public DOM structure behind the modal was read without changing it. Authenticated behavior and interactions blocked by that modal have not been verified. Managed preview browser QA was unavailable because the required control-browser skill is not installed; no pixel-equivalence claim is made.
