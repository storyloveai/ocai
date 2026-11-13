// Read-only operational export; no conversations or response-cache content.
// Uses the host's preconfigured Admin identity. Never pass a key on the command line.
import { firebaseServices } from "../server/firebase-admin.js";
const mode =
  process.argv.find((a) => a.startsWith("--mode="))?.slice(7) || "test";
if (!["test", "live"].includes(mode)) throw Error("Invalid mode");
const { db } = firebaseServices();
let cursor,
  accounts = 0,
  available = 0,
  reserved = 0;
const spent = { grant: 0, purchased: 0, legacy: 0 },
  issued = { grant: 0, purchased: 0, legacy: 0 };
const expired = { total: 0 };
const { FieldPath } = await import("firebase-admin/firestore");
while (true) {
  let query = db
    .collection(`replica-wallets-${mode}`)
    .orderBy(FieldPath.documentId())
    .limit(200);
  if (cursor) query = query.startAfter(cursor);
  const page = await query.get();
  if (page.empty) break;
  for (const doc of page.docs) {
    const w = doc.data();
    accounts++;
    available += w.balance || 0;
    reserved += Object.values(w.holds || {}).reduce((n, h) => n + h.amount, 0);
    for (const source of Object.keys(spent)) {
      spent[source] += w.stats?.spent?.[source] || 0;
      issued[source] += w.stats?.issued?.[source] || 0;
    }
    expired.total += w.stats?.expired || 0;
  }
  cursor = page.docs.at(-1);
}
console.log(
  JSON.stringify(
    {
      mode,
      accounts,
      available,
      reserved,
      issued,
      spent,
      expired,
      note: "Credit units, not revenue or provider cost. Snapshot may include expired gifts/leases until next wallet access; use durable ledger for reconciliation.",
    },
    null,
    2,
  ),
);
