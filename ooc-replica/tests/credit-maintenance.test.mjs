import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../scripts/credit-maintenance.mjs";
import { cleanCreditCache } from "../server/credit-maintenance.js";
test("maintenance default plan needs no identity and only targets ephemeral cache collections", async () => {
  let touched = false;
  const plan = await run([], {
    services: async () => {
      touched = true;
    },
    log() {},
  });
  assert.equal(touched, false);
  assert.deepEqual(plan.collections, [
    "replica-credit-responses-test",
    "replica-credit-response-parts-test",
  ]);
  assert.equal(plan.ttlField, "expiresAt");
});
test("cleanup only deletes expired cached content, with a checked update timestamp", async () => {
  const calls = [],
    deleted = [];
  const db = {
    collection: (name) => ({
      where(field, op, cutoff) {
        calls.push({ name, field, op, cutoff });
        return {
          limit: () => ({
            get: async () => ({
              size: 1,
              docs: [
                { ref: { path: name + "/expired" }, updateTime: "version-1" },
              ],
            }),
          }),
        };
      },
    }),
    batch: () => ({
      delete: (ref, precondition) => deleted.push({ ref, precondition }),
      commit: async () => {},
    }),
  };
  await cleanCreditCache(db, "test", { now: 1000 });
  assert.equal(deleted.length, 0);
  const result = await cleanCreditCache(db, "test", { now: 1000, apply: true });
  assert.equal(deleted.length, 2);
  assert.ok(
    calls.every(
      (c) =>
        c.field === "expiresAt" && c.op === "<=" && c.cutoff.getTime() === 1000,
    ),
  );
  assert.ok(
    deleted.every((d) => d.precondition.lastUpdateTime === "version-1"),
  );
  assert.equal(result.collections["replica-credit-responses-test"].deleted, 1);
});
test("live cleanup requires separate explicit approval", async () => {
  let touched = false;
  await assert.rejects(
    run(["--mode=live", "--apply"], {
      services: async () => {
        touched = true;
      },
      log() {},
    }),
    /Live cleanup/,
  );
  assert.equal(touched, false);
});
