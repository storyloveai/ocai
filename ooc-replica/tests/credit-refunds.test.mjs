import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createCredits, digest } from "../server/credits.js";
import { database } from "./helpers/credit-db.mjs";
import { PRICE_VERSION } from "../server/credit-policy.js";
const request = () => ({
  id: randomUUID(),
  fingerprint: digest("hi"),
  amount: 1,
  sku: "chat.standard",
  version: PRICE_VERSION,
});
function conserved(w) {
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  assert.equal(
    sum(w.stats.issued),
    w.balance +
      w.reserved +
      sum(w.stats.spent) +
      w.stats.expired +
      sum(w.stats.reversed) -
      w.debt,
  );
}
function journal(db, w) {
  assert.equal(
    [...db.rows]
      .filter(([k]) => k.startsWith("replica-credit-ledger-test/"))
      .reduce((n, [, v]) => n + v.amount, 0),
    w.balance,
  );
}
test("partial/full refunds reverse purchased units once, leaving gifts intact", async () => {
  const db = database(),
    s = createCredits(db, "test");
  await s.purchase("alice", "cs_paid", 200);
  await s.checkin("alice");
  await s.reconcilePurchase("alice", "cs_paid", 200, { refundCredits: 100 });
  let w = await s.read("alice");
  assert.equal(w.balance, 103);
  assert.equal(w.breakdown.grant, 3);
  conserved(w);
  journal(db, w);
  await Promise.all(
    Array.from({ length: 4 }, () =>
      s.reconcilePurchase("alice", "cs_paid", 200, { refundCredits: 200 }),
    ),
  );
  w = await s.read("alice");
  assert.equal(w.balance, 3);
  assert.equal(w.debt, 0);
  conserved(w);
  journal(db, w);
  // Older refund snapshots can never restore refunded credits.
  await s.reconcilePurchase("alice", "cs_paid", 200, { refundCredits: 100 });
  assert.equal((await s.read("alice")).balance, 3);
});
test("refund arriving before purchase fulfillment is atomic and cannot later re-grant funds", async () => {
  const db = database(),
    s = createCredits(db, "test");
  await s.reconcilePurchase("alice", "cs_early", 200, { refundCredits: 200 });
  await s.purchase("alice", "cs_early", 200);
  const w = await s.read("alice");
  assert.equal(w.balance, 0);
  conserved(w);
  journal(db, w);
});
test("already consumed refunded units are tracked without negative available balance or taking gifts", async () => {
  const db = database(),
    s = createCredits(db, "test");
  await s.purchase("alice", "cs_spent", 200);
  const a = request();
  await s.reserve("alice", a);
  await s.finish("alice", a.id, true);
  await s.reconcilePurchase("alice", "cs_spent", 200, { refundCredits: 200 });
  let w = await s.read("alice");
  assert.equal(w.balance, 0);
  assert.equal(w.debt, 1);
  assert.equal(w.fundingPaused, true);
  conserved(w);
  journal(db, w);
  await assert.rejects(s.reserve("alice", request()), {
    code: "FUNDING_REVIEW_REQUIRED",
  });
  await s.checkin("alice");
  assert.equal((await s.read("alice")).debt, 1);
  await s.purchase("alice", "cs_new", 200);
  w = await s.read("alice");
  assert.equal(w.debt, 0);
  assert.equal(w.balance, 202);
  conserved(w);
  journal(db, w);
});
test("held credits returned after refund offset uncovered units instead of reappearing", async () => {
  const db = database(),
    s = createCredits(db, "test");
  await s.purchase("alice", "cs_held", 200);
  const a = request();
  await s.reserve("alice", a);
  await s.reconcilePurchase("alice", "cs_held", 200, { refundCredits: 200 });
  assert.equal((await s.read("alice")).debt, 1);
  await s.finish("alice", a.id, false);
  const w = await s.read("alice");
  assert.equal(w.balance, 0);
  assert.equal(w.debt, 0);
  assert.equal(w.reserved, 0);
  conserved(w);
  journal(db, w);
});
test("open dispute pauses generation; winning restores funds once; stale callbacks cannot reopen it", async () => {
  const db = database(),
    s = createCredits(db, "test");
  await s.purchase("alice", "cs_disputed", 200);
  await s.reconcilePurchase("alice", "cs_disputed", 200, {
    disputeCredits: 200,
    disputeStatus: "needs_response",
    revision: 100,
  });
  let w = await s.read("alice");
  assert.equal(w.fundingPaused, true);
  assert.equal(w.balance, 0);
  conserved(w);
  await s.reconcilePurchase("alice", "cs_disputed", 200, {
    disputeCredits: 200,
    disputeStatus: "won",
    revision: 200,
  });
  w = await s.read("alice");
  assert.equal(w.balance, 200);
  assert.equal(w.fundingPaused, false);
  conserved(w);
  journal(db, w);
  await s.reconcilePurchase("alice", "cs_disputed", 200, {
    disputeCredits: 200,
    disputeStatus: "under_review",
    revision: 150,
  });
  assert.equal((await s.read("alice")).balance, 200);
  await s.reconcilePurchase("alice", "cs_disputed", 200, {
    disputeCredits: 200,
    disputeStatus: "won",
    revision: 200,
  });
  assert.equal((await s.read("alice")).balance, 200);
});
test("winning a dispute does not reverse an actual refund", async () => {
  const db = database(),
    s = createCredits(db, "test");
  await s.purchase("alice", "cs_refund_dispute", 200);
  await s.reconcilePurchase("alice", "cs_refund_dispute", 200, {
    refundCredits: 100,
    disputeCredits: 200,
    disputeStatus: "under_review",
    revision: 10,
  });
  await s.reconcilePurchase("alice", "cs_refund_dispute", 200, {
    refundCredits: 100,
    disputeCredits: 200,
    disputeStatus: "won",
    revision: 20,
  });
  const w = await s.read("alice");
  assert.equal(w.balance, 100);
  conserved(w);
  journal(db, w);
});
test("receipt adjustments cannot cross accounts or change the purchased pack", async () => {
  const s = createCredits(database(), "test");
  await s.purchase("alice", "cs_owner", 200);
  await assert.rejects(
    s.reconcilePurchase("bob", "cs_owner", 200, { refundCredits: 200 }),
    /Receipt conflict/,
  );
  await assert.rejects(
    s.reconcilePurchase("alice", "cs_owner", 2500, { refundCredits: 200 }),
    /Receipt conflict/,
  );
});
