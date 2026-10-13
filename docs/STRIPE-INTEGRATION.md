# StoryLove Stripe integration plan and review
Generated with Stripe implementation planner on 2026-10-13.
Guide: iguide_61VZNgFBlIRGNohya41PIQul5mfy0. Accepted path: Stripe only → browser → standard direct merchant checkout → no invoices → integrated hosted Checkout.
Connected environment: storylove sandbox (acct_1UPzayPIQul5mfy0), test mode only.

## Approved one-time packs
| Credits | USD amount | Sandbox price |
|---:|---:|---|
| 200 | 1.99 | price_1UPzrFPIQul5mfy0iwXH9uK2 |
| 2500 | 19.99 | price_1UPzrLPIQul5mfy05ObsbLvj |
| 5000 | 29.99 | price_1UPzrRPIQul5mfy0pB3wcA0l |

The earlier live IDs belong to the user's separate live environment and must not be combined with the connected sandbox key.

## Implemented safeguards
- Shared server/browser credit pack source, generated public manifest; Stripe key and server price settings stay private.
- Google-verified server identity determines wallet owner; browser cannot set an arbitrary user or amount.
- Allowlisted Stripe prices and exact USD totals, quantity 1 and one-time mode verified by fetching the actual paid Checkout Session.
- Raw webhook HMAC verification, timestamp tolerance, paid-state gate and both synchronous/asynchronous success events.
- Stripe event mode, fetched Session mode and wallet metadata must match the configured key mode.
- Native Netlify sandbox wallet keys use wallet/test/{user}; existing live keys wallet/{user} are preserved. Test check-ins/credits do not affect live wallets.
- Checkout request UUID retained by the browser for network retries. Stripe Idempotency-Key is scoped to mode, authenticated user, pack and request.
- Live payment calls require explicit STRIPE_LIVE_ENABLED=true and all three live price variables. No live rollout is enabled by this change.
- REST API version pinned to 2026-08-26.dahlia. Hosted Checkout integration_identifier is storylove-hosted-qrxkntva.
- Dynamic payment methods remain available (no payment_method_types allowlist). Adaptive Pricing remains disabled while exact USD fulfillment is enforced. Tax settings are not enabled without registration and fulfillment changes.
- Test purchases stay excluded from production analytics.

## Outstanding operational verification
- Key-to-catalog verification in the trusted Netlify build using scripts/verify-stripe-catalog.mjs.
- Sandbox webhook registration and STRIPE_WEBHOOK_SECRET configuration.
- Real hosted test-card checkout, webhook delivery, wallet grant and duplicate-delivery checks.
- Production publishing remains locked at the previously approved deployed version.
- Supabase sandbox wallet access fails closed to avoid mixing wallets; a dedicated isolated adapter/project is required before sandbox payments on that path. Supabase live pack migration: 202610130003_credit_packs.sql.

## Billing phase (no subscription offers created)
Recurring products are not yet defined. Before implementing Billing, specify price, monthly/yearly interval, credits per paid cycle, carry-over/expiry, cancellation and failed-payment behavior.
Use a persistent user↔Stripe customer mapping scoped by Stripe account and mode; subscription-mode Checkout; a customer portal; verified invoice.paid fulfillment deduplicated by invoice ID; subscription update/deletion and payment-failure handling. Do not award renewal credits from success URLs.
Refunds/dispute reversals and chat credit consumption also remain unimplemented. No billing-ready production claim should be made yet.

## References
- https://docs.stripe.com/payments/accept-a-payment?payment-ui=checkout&ui=stripe-hosted
- https://docs.stripe.com/checkout/fulfillment
- https://docs.stripe.com/keys
- https://docs.stripe.com/webhooks

