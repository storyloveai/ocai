# Firebase account cutover

## Scope and source code found

- `storylove/netlify-google-identity:dist/account.js`: Google OAuth, auth callback, session restoration, account change and logout via Netlify Identity / Supabase.
- `vercel-supabase-sandbox:dist/account.js`: Supabase PKCE implementation.
- Current branch `src/account.js` and `server/platform.mjs`: newer root application auth, wallet and payments. These files belong to the original app, not the standalone replica.
- Replica now uses the Firebase JS SDK for Google/Apple sign-in and persistent auth, and Firestore for private profile, bookmarks, drafts, preferences, notes and story sessions. No Admin credential is required in Vercel for these client SDK operations. Firestore rules enforce the verified UID.

This change does not migrate existing Supabase records, wallets, payment receipts or analytics. The original root application retains its existing backend. Do not delete Supabase or point the root application's wallet at Firebase.

## Required configuration

1. Create or select the intended Firebase project and register a Web app.
2. Enable Authentication → Google with a support email. In Authentication settings, add the exact production Vercel/custom hostname to Authorized domains. Add only stable preview hosts that you will test; authorize `localhost` explicitly if needed.
3. Create Firestore in production mode and choose the intended data location. From this `ooc-replica` directory, publish the checked-in rules with `firebase deploy --only firestore:rules --project YOUR_PROJECT_ID` using your authorized Firebase CLI. The project is explicit to avoid deploying to a default project accidentally.
4. In Vercel project `lindsey-cybers-projects/ocai-ooc-replica`, verify Git branch `feat/ooc-high-fidelity-replica` and **Root Directory `ooc-replica`**. Build command `npm run build`, output `dist`, Node >=22.12. Do not use the repository-root Vercel config for this standalone application.
5. Add the four public Web app config values from `.env.example` to the desired Vercel environments: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`. Use the exact SDK config provided by Firebase. Never put a service-account private key or Supabase service key here. Redeploy after configuration. `/api/config` returns `auth: null` until all four are set.
6. Google sign-in uses a user-initiated popup. If a browser blocks it, allow popups for this host and retry. No automatic redirect fallback is used: cross-domain redirect auth requires additional hosting/proxy setup under modern browser storage restrictions.

## Apple activation

Set up Sign in with Apple in Apple Developer: App ID, Services ID for web, Team ID, Key ID and signing key. Register the Firebase-provided auth handler return URL (normally `https://PROJECT_ID.firebaseapp.com/__/auth/handler`) and the required domain. Configure these credentials in Firebase Authentication → Apple. Apple private keys stay in the provider console, never in frontend config or this repository. If using Firebase email features with anonymized Apple addresses, configure Apple's private email relay.

Only then set `FIREBASE_APPLE_ENABLED=true` in Vercel and redeploy. The Apple button remains hidden otherwise. Apple and Google accounts are not silently linked by email; a provider conflict asks the user to sign in using the original method. Explicit account-linking can be added as a separate account settings flow with consent.

## Data behavior

- Guests keep their existing browser-local data. Signing in does not silently upload guest conversations from a shared device.
- Every Firebase UID has a separate local cache and private `users/{uid}/state/{key}` documents. JSON state documents are bounded to 750 KB by rules; large conversations produce a visible sync error and remain local.
- Cloud writes are debounced; failure keeps a local pending marker for retry after reload. Logout waits for pending writes and stays signed in if saving fails. Switching accounts invalidates old chat callbacks.
- Initial load restores cloud state; local unsynced keys take precedence. Simultaneous edits on multiple devices use last successful write per key. This is not collaborative editing.
- Credits remain explicitly demo-only. These rules allow no client wallet, receipt, entitlement or balance updates. Public comments/creator publishing still need a separate server-authorized data model.

## Supabase migration still required before full cutover

1. With authorized access, inventory Supabase Auth identities, tables, Storage objects, RLS, RPCs, Stripe IDs and backups. Record counts and checksums before writing anything.
2. Export auth through Admin access; preserve original Supabase UUIDs as Firebase UIDs where possible, importing supported Google/Apple provider subject identifiers through Firebase Admin. Do not infer identity solely from email (including Apple relay email). Unsupported/password identities require a verified re-authentication migration flow.
3. Map each table to Firestore documents and object assets to Cloud Storage. Preserve stable source IDs and store a migration version; use idempotent imports and a dry-run report. Large SQL queries, joins, transactions and wallet RPCs need explicit backend rewrites, not mechanical row copies.
4. Reconcile record counts, identity ownership, balances and payment deduplication. Run security-rule tests against the actual schema and staging project. Retain source backups and a rollback path.
5. Schedule the final delta import/cutover after staging validation. Do not delete or disable the old database until reconciliation and production acceptance succeed.

## Acceptance checks

`npm ci && npm run build && npm run check` covers SDK bundling, mock auth integration, account isolation, failure retry, stale chat writes, safe config and existing AI/stream regressions. It does not prove provider setup or deployed rules.

On the deployed exact host: check `/api/config`, sign in with Google, complete onboarding, refresh, add a bookmark and a chat, open a second device with the same account and verify synchronization, sign out and verify guest state, then sign in with a different account and confirm isolation. Test denied access to another UID via the Firestore emulator/Rules Playground. Test popup cancellation and mobile Safari. Enable and repeat with Apple only after its console setup. Verify that root app wallets and Stripe remain intact.

## Production rollout verified (2026-10-15)

PR #8 was merged into `feat/ooc-high-fidelity-replica`; Vercel production deployment for merge commit `672518e` reached Ready. Both production domains remain assigned to this project: `ocai-ooc-replica.vercel.app` and `project-zhmv2.vercel.app`. Vercel Root Directory is `ooc-replica`, with Node 24 and `npm run build && npm run check`. The four public Firebase config values are scoped to Production; Preview intentionally has no production Firebase config.

Firebase project `storylove-zzy` has the `ocai-ooc-replica` Web app. Google sign-in is enabled, both production hosts are authorized, and the default Firestore Standard database is in `asia-northeast1` (Tokyo). The project remains on the no-cost Spark plan. The checked-in owner-only rules were published and compiled successfully.

Verification evidence:

- Build succeeded; 24 automated checks passed. GitHub showed all checks passing and no merge conflicts. The uploaded tree was compared against the tested local tree and matched exactly.
- Live Rules Playground: an authenticated owner could read `users/{sameUID}/state/ooc-profile`; a different UID was denied for that same path. These were simulations, not test user creation.
- A real Google OAuth flow completed on the primary production host using the owner's selected account. Firebase Authentication listed the resulting Google user; the app displayed the signed-in name and Sign out control.
- A bookmark added through the real UI created the expected private Firestore `ooc-favorites` document with a server timestamp. After refresh, the session was restored and the bookmark remained selected. The test bookmark was then removed through the UI, and the cloud document returned to an empty list.
- Sign out returned to the Google sign-in control. The site remained a guest after refresh. The account is left signed out for the owner.
- First-login onboarding opens as designed; no real birthday or personal preference values were invented or submitted. Full onboarding can be completed by the account owner.

Limits: Apple is implemented but disabled pending Apple Developer credentials and provider setup. Existing Supabase records, wallets, payments and analytics were not migrated or deleted. Cross-device synchronization, mobile Safari and Apple OAuth were not independently verified. This replica's credits and billing remain demo-only. Do not retire Supabase until the separate data/identity migration and wallet reconciliation are complete.
