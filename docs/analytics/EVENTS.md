# First-party analytics v1

## Events and denominators

| Area | Events | Measurement |
|---|---|---|
| Every route | page_view | One event per SPA route entry; no full URLs/query strings |
| Sidebar, mobile nav, banner, cards, detail, packs, chat controls | element_impression, ui_click | At least 50% visible; deduplicated per page view + placement + element + item |
| Discovery | character_view, chat_start | ID only; distinguishes detail discovery and direct banner entry |
| Conversation | message_send, reply_complete, reply_failed, generation_stop | No message contents; duration_ms measures whole reply; first_delta_ms measures first visible model content after sending |
| Auth | login_start, login_complete, login_failed, logout | Completion after session exchange; restored existing sessions are not new conversions |
| Check-in | checkin_start, checkin_complete, checkin_failed | Claimed vs already_claimed; duplicate claims excluded from successful-claim funnel |
| Payment | checkout_start, checkout_ready (Elements), checkout_redirect (hosted legacy), checkout_return, checkout_failed | Starting checkout requires logged-in user; return is not purchase |
| Verified payment | purchase_complete | Server-only event after Stripe verification + ledger grant; deterministic ID deduplicates retries |
| Creator | title_create_start, title_create_complete | Current creation is browser-local |
| Other controls | conversation_regenerate, conversation_restart, conversation_export | IDs only; export contents never collected |

CTR = unique page views with a matching impression and click / unique page views with an impression. Also report raw click count. Activation = page_view → chat_start → message_send → reply_complete; discovery is a separate optional detail-view path. Funnels require chronological stages within the same anonymous browser-tab session; they do not claim cross-device attribution or exact human user counts. Payment flow_id links the attempt/Stripe metadata for future attempt-level reporting; current dashboard is a session funnel and may span more than one attempt in a session.

Sessions use a random UUID in sessionStorage, never an email or account ID. Schema rejects arbitrary strings/properties and client-created purchase events. No dialogue content, input values, nickname, email, raw URLs, OAuth codes, API keys, IP or user-agent are included in application event records. Hosting-provider access logs are separate. DNT and Global Privacy Control are honored; `storyAnalytics.optOut()` stops collection. `?analytics_test=1` marks QA traffic excluded from reports. Preview deployment traffic and Stripe test mode are excluded.

## Storage and viewing

Netlify uses the site-wide private `storylove-events-v1` Blobs store; event records persist across deploys and can be inspected by the project owner under Data & storage → Blobs. SDK uses host-injected credentials; no new analytics API key is needed. Vercel uses Supabase service-only event RPCs after migration 202610130002_analytics.sql. Run the wallet/auth migration first too.

`/analytics.html` is the admin dashboard. It never exposes raw events anonymously: /api/analytics-report requires a verified Supabase user whose UUID is listed in server variable ANALYTICS_ADMIN_IDS (comma-separated). Configure Supabase/Google first; until then inspect events in the authenticated Netlify console. Add /analytics.html?auth=callback to Supabase redirect allow-list. Dashboard shows page counts, element CTR, per-character sends/replies/failures/average full-response/first-content duration and ordered funnels. Reports are bounded; a truncated flag explicitly marks incomplete totals. At larger scale use daily aggregates or a dedicated analytics warehouse instead of scanning individual blobs.

Deployment environment variables: existing Supabase credentials for Vercel or admin auth, optional ANALYTICS_ADMIN_IDS. Native Netlify event collection itself needs no Supabase. Event collection is not a training-data pipeline. There is currently no automatic raw-event retention deletion; choose retention/export policy before scaling.

## Verification limits

Tests cover privacy property filtering, bounded ingestion, cross-origin rejection, CTR denominators, deduplication, exclusion of test traffic, ordered same-session funnels and admin protection. Live storage and behavior are checked after deployment; real login/check-in/payment completions require those services to be configured.
