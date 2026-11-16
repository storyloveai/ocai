import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createPlatform } from "../server/payments.js";
import { createCredits } from "../server/credits.js";
import { database } from "./helpers/credit-db.mjs";
const env = {
  FIREBASE_PROJECT_ID: "test-project",
  FIREBASE_API_KEY: "public-test",
  FIREBASE_AUTH_DOMAIN: "test.invalid",
  FIREBASE_APP_ID: "test-app",
  FIREBASE_CLIENT_EMAIL: "test@example.invalid",
  FIREBASE_PRIVATE_KEY: "fake-only",
  STRIPE_SECRET_KEY: "sk_test_fixture",
  STRIPE_WEBHOOK_SECRET: "whsec_fixture",
  STRIPE_PRICE_200: "price_fixture",
};
function fixture() {
  const db = database(),
    store = createCredits(db, "test"),
    calls = [];
  const charge = {
    id: "ch_fixture",
    payment_intent: "pi_fixture",
    currency: "usd",
    amount: 199,
    amount_refunded: 0,
    livemode: false,
    disputed: false,
  };
  const dispute = {
    id: "du_fixture",
    charge: "ch_fixture",
    payment_intent: "pi_fixture",
    currency: "usd",
    amount: 199,
    status: "needs_response",
    livemode: false,
  };
  const session = {
    id: "cs_fixture",
    payment_intent: "pi_fixture",
    payment_status: "paid",
    mode: "payment",
    currency: "usd",
    amount_total: 199,
    livemode: false,
    client_reference_id: "alice",
    metadata: {
      user_id: "alice",
      credits: "200",
      wallet_mode: "test",
      wallet_backend: "firebase-replica-v1",
      firebase_project: "test-project",
    },
    line_items: { data: [{ quantity: 1, price: { id: "price_fixture" } }] },
  };
  const platform = createPlatform({
    env,
    services: () => ({ db }),
    fetchImpl: async (url, opts) => {
      assert.equal(opts.method, "GET");
      const path = new URL(url).pathname;
      calls.push(path);
      if (path === "/v1/charges/ch_fixture") return Response.json(charge);
      if (path === "/v1/disputes/du_fixture") return Response.json(dispute);
      if (path === "/v1/disputes")
        return Response.json({ data: [dispute], has_more: false });
      if (path === "/v1/checkout/sessions")
        return Response.json({ data: [session], has_more: false });
      if (path === "/v1/checkout/sessions/cs_fixture")
        return Response.json(session);
      throw Error("Unexpected external request");
    },
  });
  const event = (type, created = 100) => {
    const raw = JSON.stringify({
        type,
        livemode: false,
        created,
        data: {
          object: {
            id: type.startsWith("charge.dispute.")
              ? "du_fixture"
              : "ch_fixture",
          },
        },
      }),
      t = Math.floor(Date.now() / 1000),
      signature = createHmac("sha256", env.STRIPE_WEBHOOK_SECRET)
        .update(t + "." + raw)
        .digest("hex");
    return new Request("https://test.invalid/api/webhook", {
      method: "POST",
      headers: { "stripe-signature": `t=${t},v1=${signature}` },
      body: raw,
    });
  };
  return { db, store, platform, charge, dispute, session, event, calls };
}
test("signed refund uses authoritative charge/session data, and duplicates cannot reverse twice", async () => {
  const f = fixture();
  await f.store.purchase("alice", "cs_fixture", 200);
  await f.store.checkin("alice");
  f.charge.amount_refunded = 100;
  assert.equal(
    (await f.platform.webhook(f.event("charge.refunded"))).status,
    200,
  );
  assert.equal((await f.store.read("alice")).balance, 103);
  f.charge.amount_refunded = 199;
  await Promise.all(
    Array.from({ length: 3 }, () =>
      f.platform.webhook(f.event("charge.refunded")),
    ),
  );
  assert.equal((await f.store.read("alice")).balance, 3);
  assert.equal((await f.store.read("alice")).stats.reversed.purchased, 200);
});
test("signed dispute closure restores held credits while out-of-order callbacks cannot reopen the case", async () => {
  const f = fixture();
  f.charge.disputed = true;
  assert.equal(
    (await f.platform.webhook(f.event("charge.dispute.created", 10))).status,
    200,
  );
  assert.equal((await f.store.read("alice")).fundingPaused, true);
  f.dispute.status = "won";
  assert.equal(
    (await f.platform.webhook(f.event("charge.dispute.closed", 20))).status,
    200,
  );
  assert.equal((await f.store.read("alice")).balance, 200);
  assert.equal((await f.store.read("alice")).fundingPaused, false);
  f.dispute.status = "under_review";
  await f.platform.webhook(f.event("charge.dispute.updated", 15));
  assert.equal((await f.store.read("alice")).balance, 200);
});
test("unsigned, foreign backend, wrong amount and live-mode funding events cannot change this wallet", async () => {
  const f = fixture();
  const invalid = f.event("charge.refunded");
  invalid.headers.set("stripe-signature", "bad");
  assert.equal((await f.platform.webhook(invalid)).status, 400);
  assert.equal(f.calls.length, 0);
  f.session.metadata.wallet_backend = "foreign";
  assert.equal(
    (await f.platform.webhook(f.event("charge.refunded"))).status,
    200,
  );
  assert.equal((await f.store.read("alice")).balance, 0);
  f.session.metadata.wallet_backend = "firebase-replica-v1";
  f.charge.amount = 200;
  assert.equal(
    (await f.platform.webhook(f.event("charge.refunded"))).status,
    400,
  );
  assert.equal((await f.store.read("alice")).balance, 0);
  f.charge.amount = 199;
  f.charge.livemode = true;
  assert.equal(
    (await f.platform.webhook(f.event("charge.refunded"))).status,
    400,
  );
  assert.equal((await f.store.read("alice")).balance, 0);
});
