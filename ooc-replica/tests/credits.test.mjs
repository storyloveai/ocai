import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createCredits, digest } from "../server/credits.js";
import { PRICE_VERSION, creditPolicy, quote } from "../server/credit-policy.js";
import { createWallet } from "../server/wallet.js";
import { database } from "./helpers/credit-db.mjs";
const request = (amount = 1) => ({
  id: randomUUID(),
  fingerprint: digest("private-message-never-stored"),
  amount,
  sku: amount === 2 ? "chat.long" : "chat.standard",
  version: PRICE_VERSION,
});
async function fixture({ amount = 10, budget = 100 } = {}) {
  const db = database();
  let now = Date.now();
  const store = createCredits(db, "test", { clock: () => now });
  const campaign = {
    id: "beta-1",
    amount,
    budget,
    recipients: [digest("alice"), digest("bob")],
    startsAt: now - 1,
    endsAt: now + 86400000,
    expiresAt: now + 2 * 86400000,
  };
  await store.registerCampaign(campaign);
  await store.grant("alice", campaign.id);
  return {
    db,
    store,
    campaign,
    advance: (ms) => {
      now += ms;
    },
  };
}
test("pricing is server-owned and unsafe live/Preview activation fails closed", () => {
  assert.equal(creditPolicy({}).enabled, false);
  assert.equal(
    quote({ outputLength: "LONG", amount: 0 }, { CREDIT_BILLING_MODE: "test" })
      .amount,
    2,
  );
  for (const env of [
    { CREDIT_BILLING_MODE: "typo" },
    {
      CREDIT_BILLING_MODE: "live",
      VERCEL_ENV: "preview",
      CREDIT_LIVE_ENABLED: "true",
    },
    { CREDIT_BILLING_MODE: "live", VERCEL_ENV: "production" },
  ])
    assert.throws(() => quote({}, env), { code: "BILLING_CONFIGURATION" });
  assert.equal(
    creditPolicy({
      CREDIT_BILLING_MODE: "live",
      VERCEL_ENV: "production",
      CREDIT_LIVE_ENABLED: "true",
    }).ready,
    true,
  );
  assert.equal(quote({task:"author"},{CREDIT_BILLING_MODE:"test"}).amount,3);
  assert.equal(quote({phase:"express"},{CREDIT_BILLING_MODE:"test"},"game").amount,1);
});
test("old balance survives migration unclassified, purchase and daily writes preserve holds", async () => {
  const { db, store } = await fixture();
  db.rows.set("replica-wallets-test/" + digest("old"), {
    balance: 123,
    ledger: [],
    checkedDay: null,
  });
  assert.deepEqual((await store.read("old")).breakdown, {
    legacy: 123,
    grant: 0,
    purchased: 0,
  });
  const held = request(2);
  await store.reserve("old", held);
  await createWallet(db, "test").rpc("storylove_purchase", {
    p_user: "old",
    p_session: "cs_old",
    p_credits: 200,
  });
  assert.equal((await store.read("old")).reserved, 2);
  assert.equal((await store.read("old")).balance, 321);
  await store.finish("old", held.id, false);
  assert.equal((await store.read("old")).balance, 323);
  assert.equal((await createCredits(db, "live").read("old")).balance, 0);
});
test("concurrent reservations never overspend and successful charges are idempotent", async () => {
  const { store } = await fixture({ amount: 3 });
  const attempts = Array.from({ length: 12 }, () => request());
  const results = await Promise.allSettled(
    attempts.map((a) => store.reserve("alice", a)),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 3);
  assert.equal((await store.read("alice")).balance, 0);
  assert.equal((await store.read("alice")).reserved, 3);
  const a = attempts[0];
  await Promise.all(
    Array.from({ length: 4 }, () =>
      store.finish("alice", a.id, true, "saved reply"),
    ),
  );
  assert.equal((await store.read("alice")).stats.spent.grant, 1);
  assert.equal((await store.status("alice", a.id)).reply, "saved reply");
  await assert.rejects(store.reserve("alice", a), {
    code: "OPERATION_SETTLED",
  });
});
test("failure, duplicate release and lease recovery restore each allocation exactly once", async () => {
  const { store, advance } = await fixture();
  const a = request(2);
  await store.reserve("alice", a);
  await store.finish("alice", a.id, false);
  await store.finish("alice", a.id, false);
  assert.equal((await store.read("alice")).balance, 10);
  const b = request();
  await store.reserve("alice", b);
  advance(600001);
  assert.equal((await store.read("alice")).balance, 10);
  assert.equal((await store.status("alice", b.id)).status, "released");
  assert.equal((await store.finish("alice", b.id, true)).status, "released");
  assert.equal((await store.read("alice")).stats.spent.grant, 0);
});
test("gift expiry during a hold is not revived by failure or recovery", async () => {
  const { store, advance, db } = await fixture();
  advance(2 * 86400000 - 100);
  const a = request(2);
  await store.reserve("alice", a);
  advance(200);
  await store.finish("alice", a.id, false);
  const w = await store.read("alice");
  assert.equal(w.balance, 0);
  assert.equal(w.reserved, 0);
  assert.equal(w.stats.expired, 10);
  const journal = [...db.rows]
    .filter(
      ([k, v]) =>
        k.startsWith("replica-credit-ledger-test/") && v.uid === "alice",
    )
    .map(([, v]) => v);
  assert.equal(
    journal.reduce((n, e) => n + e.amount, 0),
    w.balance,
  );
});
test("gifts are spent before preserved historical balance and unexpiring purchases", async () => {
  const { store } = await fixture({ amount: 1 });
  await store.purchase("alice", "cs_first", 200);
  const a = request(2);
  await store.reserve("alice", a);
  await store.finish("alice", a.id, true);
  assert.deepEqual((await store.read("alice")).stats.spent, {
    grant: 1,
    purchased: 1,
    legacy: 0,
  });
});
test("campaign audience, budget, period, immutable config and claim identity are enforced", async () => {
  const { store, campaign, advance } = await fixture({
    amount: 10,
    budget: 10,
  });
  const same = await Promise.all(
    Array.from({ length: 8 }, () => store.grant("alice", campaign.id)),
  );
  assert.ok(same.every((w) => !w.claimed));
  assert.equal((await store.read("alice")).balance, 10);
  await assert.rejects(store.grant("bob", campaign.id), {
    code: "CAMPAIGN_EXHAUSTED",
  });
  await assert.rejects(store.grant("mallory", campaign.id), {
    code: "GRANT_NOT_ELIGIBLE",
  });
  await assert.rejects(
    store.registerCampaign({ ...campaign, amount: 11 }),
    /immutable/,
  );
  advance(86400001);
  await assert.rejects(store.grant("bob", campaign.id), {
    code: "GRANT_NOT_ELIGIBLE",
  });
});
test("parallel grants to eligible accounts cannot exceed campaign budget", async () => {
  const db = database(),
    store = createCredits(db, "test"),
    now = Date.now();
  await store.registerCampaign({
    id: "race",
    amount: 10,
    budget: 15,
    recipients: [digest("alice"), digest("bob")],
    startsAt: now - 1,
    endsAt: now + 10000,
    expiresAt: now + 20000,
  });
  const results = await Promise.allSettled(
    ["alice", "bob"].map((u) => store.grant(u, "race")),
  );
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
});
test("operation IDs cannot cross accounts, change parameters or pollute holds", async () => {
  const { store } = await fixture();
  const a = request();
  await store.reserve("alice", a);
  await assert.rejects(store.status("bob", a.id), {
    code: "UNKNOWN_OPERATION",
  });
  await assert.rejects(
    store.reserve("alice", { ...a, fingerprint: digest("different") }),
    { code: "IDEMPOTENCY_CONFLICT" },
  );
  await assert.rejects(store.reserve("alice", { ...a, id: "__proto__" }), {
    code: "INVALID_OPERATION",
  });
  assert.equal((await store.read("alice")).reserved, 1);
});
test("daily subsidy claim is once per Shanghai day, source separated, expires after 7 days", async () => {
  const { store, advance } = await fixture();
  const claims = await Promise.all(
    Array.from({ length: 5 }, () => store.checkin("bob")),
  );
  assert.equal(claims.filter((x) => x.claimed).length, 1);
  assert.equal((await store.read("bob")).balance, 3);
  advance(7 * 86400000 + 1);
  assert.equal((await store.read("bob")).balance, 0);
});
test("durable audit persists beyond recent 50 entries and never includes user prompts", async () => {
  const { store, db, advance } = await fixture({ amount: 100 });
  for (let i = 0; i < 30; i++) {
    const a = request();
    await store.reserve("alice", a);
    await store.finish("alice", a.id, true, "result");
  }
  const w = await store.read("alice");
  assert.equal(w.ledger.length, 50);
  const events = [...db.rows].filter(([k]) =>
    k.startsWith("replica-credit-ledger-test/"),
  );
  assert.equal(events.length, 61);
  assert.doesNotMatch(JSON.stringify(events), /private-message-never-stored/);
  advance(86400001);
  const settled = [...db.rows].find(
    ([k, v]) =>
      k.startsWith("replica-credit-ops-test/") && v.status === "settled",
  )[1];
  assert.equal((await store.status("alice", settled.id)).reply, undefined);
});

test("a v1 writer during rolling deployment cannot erase newly credited funds", async () => {
  const { db, store } = await fixture();
  const key = "replica-wallets-test/" + digest("alice");
  const raw = db.rows.get(key);
  raw.balance += 200;
  db.rows.set(key, raw);
  const w = await store.read("alice");
  assert.equal(w.balance, 210);
  assert.equal(w.breakdown.legacy, 200);
  assert.equal(w.breakdown.grant, 10);
});

test("mixed reserve/settle/release/expiry operations conserve total credits and reconcile the durable journal", async () => {
  const { store, db, advance } = await fixture({ amount: 100 });
  await store.purchase("alice", "cs_conservation", 200);
  let seed = 17;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed;
  };
  const pending = [];
  for (let i = 0; i < 100; i++) {
    if (random() % 3 && pending.length) {
      const id = pending.splice(random() % pending.length, 1)[0];
      await store.finish("alice", id, random() % 2 === 0);
    } else {
      const a = request(1 + (random() % 2));
      try {
        await store.reserve("alice", a);
        pending.push(a.id);
      } catch (e) {
        assert.ok(
          ["TOO_MANY_PENDING", "INSUFFICIENT_CREDITS"].includes(e.code),
        );
      }
    }
    if (i === 50) advance(2 * 86400000 + 1);
    else advance(20000);
    const w = await store.read("alice"),
      issued = Object.values(w.stats.issued).reduce((a, b) => a + b, 0),
      spent = Object.values(w.stats.spent).reduce((a, b) => a + b, 0);
    assert.equal(issued, w.balance + w.reserved + spent + w.stats.expired);
    const journal = [...db.rows]
      .filter(
        ([k, v]) =>
          k.startsWith("replica-credit-ledger-test/") && v.uid === "alice",
      )
      .map(([, v]) => v);
    assert.equal(
      journal.reduce((n, e) => n + e.amount, 0),
      w.balance,
    );
  }
});
