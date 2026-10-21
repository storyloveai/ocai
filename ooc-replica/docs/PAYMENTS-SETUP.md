# Firebase replica payments

The repository-root app already implements Stripe Elements and signed checkout fulfillment. This standalone `ooc-replica` app now adapts that implementation to verified Firebase ID tokens and an Admin-only Firestore wallet. `/credit` shows the real balance, daily +100 claim, three existing USD packs ($1.99/200, $19.99/2,500, $29.99/5,000), and the latest 50 ledger entries. Successful payments also have permanent receipt documents. Guests see no invented balance. Chat consumption is unchanged: it currently does not spend credits.

## Deployment configuration

Configure **ocai-ooc-replica**, Root Directory **ooc-replica**, not the original `ocai` project. Set the public Firebase variables already documented in FIREBASE-SETUP.md. Add `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` from a service account in **that same Firebase project**, server-side only. The SDK accepts a multiline private key or literal `\n` separators. The account must be able to verify Firebase Auth users (including revocation/disabled status) and transact against Firestore. Do not put these credentials in Git, a browser file or chat.

Set `APP_URL` to this application's exact canonical HTTPS origin. Set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, the three `STRIPE_PRICE_*` IDs and `STRIPE_WEBHOOK_SECRET` for the intended Stripe account/mode. Existing live prices can be reused, but each must be a one-time USD price with exactly the corresponding amount above. Original-app environment variables are **not automatically shared** with this separate Vercel project. Only set `STRIPE_LIVE_ENABLED=true` when enabling live payments. Optional Production-only `STRIPE_LIVE_SECRET_KEY` and `STRIPE_LIVE_WEBHOOK_SECRET` override the generic values without changing Preview sandbox keys. Test prices must also belong to your sandbox; configure all three explicitly rather than relying on historical fallback IDs.

Create a **separate Stripe webhook endpoint** at `https://YOUR-REPLICA-HOST/api/webhook`, subscribing to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Save its own signing secret in this replica's environment. Keep the original app's webhook intact: its Supabase wallet does not fulfill Firebase replica orders. This integration tags every Session with both `wallet_backend=firebase-replica-v1` and the Firebase project ID; other backends/projects are rejected. Do not point a shared old endpoint at this new wallet or replay old orders into it.

Register the replica's HTTPS hostname under Stripe Payment method domains in the corresponding mode. Card and wallet availability remains controlled by Stripe and the customer's device. Do not enable a sandbox test using live credentials. Webhooks must be publicly reachable, including any preview used for sandbox acceptance.

Build with `npm ci && npm run build && npm run check`, then deploy. Check `/api/config`: `walletConfigured`, `payments`, `embeddedPayments` should all be true and `walletMode` must be the intended mode. These booleans check configuration presence, not external credential validity or account approval. Only public Firebase configuration and the Stripe publishable key are returned.

## Storage and identity

Firestore collections `replica-wallets-test` / `replica-wallets-live` and `replica-receipts-test` / `replica-receipts-live` are Admin-only. Existing firestore.rules deny all client access to these paths; keep that default deny. Authenticated users access their wallet through `/api/wallet`, never by supplying a UID. Wallet document keys hash the verified UID, while receipt IDs use Stripe Session IDs. A Firestore transaction writes the receipt and credit increment atomically; replayed/concurrent callbacks cannot add credits twice. Daily claims use the Shanghai date and the same transaction model. Session status and the return page never grant credits.

This creates a new Firebase wallet. No Supabase, Netlify, or demo balances/receipts are imported. Preserve the old app and its data until a separately verified identity/ledger migration is implemented.

## Acceptance

1. In a sandbox deployment, sign in with the intended Firebase user. Check wallet, daily claim, refresh persistence and the ledger. A second claim must not add credits again.
2. Pay with a Stripe test card in test mode. Verify the Session, successful signed webhook delivery, one permanent receipt and exactly one credit increment. Reload the return page and resend the webhook: no extra credits.
3. Test declined payment, 3DS cancellation/success and delayed payment if available. Unpaid events must not credit. A different Firebase account must not see the order or balance. Switch/sign out during loading/confirmation: old callbacks must not update the new account's UI.
4. Test the real production hostname's wallet availability on the owner's devices. A successful SDK mock does not prove Apple Pay or Google Pay eligibility.
5. Once deployed in live mode, the account holder completes one small real purchase and checks Stripe, webhook delivery, Firestore receipt and displayed balance. Do not use test cards on a live page.

## Verification for this change

Local automated coverage includes verified identity, fixed catalog, return routing, signed webhook processing, duplicate/concurrent receipts, mode/project/account isolation, server-side daily claims, SDK lifecycle and frontend state. The Firestore transaction tests use an in-memory store, not a deployed emulator or production database. No actual Stripe payment, deployed Admin credentials, Firestore permissions or wallet device eligibility has been verified in this change. Target Vercel project inspection returned 403 for the connected account; no CLI was available. Deployment configuration remains blocked on authorized access to that project.


## Browser rollout update — 2026-10-16

GitHub and Vercel browser access succeeds under the owner's existing sessions. The complete change is in PR #9 targeting the actual production branch `feat/ooc-high-fidelity-replica`; the uploaded tree was compared byte-for-byte with the tested local files. `APP_URL=https://project-zhmv2.vercel.app` and the existing account's public live `STRIPE_PUBLISHABLE_KEY` are now saved in the replica's Production environment. Its three live price IDs already existed.

The first preview exposed a real cold-start failure: Vercel's loader cannot load `jwks-rsa`'s CommonJS require with ESM-only jose 6. The scoped dependency override uses compatible jose 5.10.x; a new regression test imports API modules with `--no-experimental-require-module`. Another test covers catalog refresh after asynchronous configuration without an auth-state change. Build and 40 tests pass.

Remaining credentials: `STRIPE_LIVE_SECRET_KEY` (or `STRIPE_SECRET_KEY`), a new replica endpoint's webhook signing secret, and `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`. The original Vercel project's private Stripe secrets are write-only; they cannot be copied or revealed through that UI. No credentials were rotated. Opening the Stripe dashboard was denied by automatic approval review because Stripe-account/credential access was not explicitly authorized; no alternate access route was attempted. Live enablement and a real paid transaction remain pending.
