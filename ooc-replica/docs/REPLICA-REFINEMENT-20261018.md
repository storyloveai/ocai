# Replica refinement — 2026-10-18

Observed in the signed-in original website: clicking a catalogue card opens a Story Information dialog without changing the page URL. The dialog is 768px wide and 80dvh high at the measured 1363×936 desktop viewport, with a fixed header/footer and its own scrolling body. This pass captures the public dialog contents for the five configured stories and adapts them to independent local/account state.

Implemented: quick-view from captured catalogue/search/collection views, bookmark state, avatar name, expandable description/prologue, default scenario selection, full-information navigation, Escape/backdrop close and focus restoration. New Play routes to the selected replica story. Captured private episode links, account-specific avatar text, runtime IDs and executable elements are excluded; a regression test checks this boundary. Raw authenticated observations remain outside the repository.

The original offers more starting scenarios for some stories. This pass exposes only the captured default scenario, which is the one currently backed by the independent prompt engine. It does not claim full scenario parity. Uncaptured stories continue to use the existing detail route.

Chat header/settings artwork now follows the selected title, unrelated Lumencia gallery thumbnails are removed for other stories, output length reopens with the saved choice, and the situation-image preference persists per title. No generated image backend is added by that preference.

Regenerate the sanitized dialog bundle with `node scripts/build-title-previews.mjs <private-capture-directory>`. The directory contains `<apex|sovereign|dating|knight|commander>-modal-observed.html`; never commit the raw authenticated captures.

Payment rollout: production Firebase Admin credentials and Stripe live key were supplied by the owner. The existing dedicated Firebase replica webhook endpoint is enabled, and STRIPE_LIVE_ENABLED is set only for Production. Live payment verification must distinguish successful session/Elements loading from a completed charge and webhook credit fulfillment. No live charge is performed by the agent.
