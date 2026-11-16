import test from "node:test";
import assert from "node:assert/strict";
import { createCreditClient } from "../dist/assets/credit-client.js";
import { run } from "../scripts/credit-campaign.mjs";
const memory = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k),
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
function fixture() {
  let amount = 2,
    status = null,
    balance = 10;
  const store = memory(),
    account = {
      user: { uid: "alice", getIdToken: async () => "token" },
      api: async (path, body) => {
        if (body.action === "quote")
          return { amount, version: "v1", wallet: { balance } };
        if (!status)
          throw Object.assign(Error("missing"), { code: "UNKNOWN_OPERATION" });
        return status;
      },
    };
  const cfg = { walletMode: "test", billing: { enabled: true } },
    client = createCreditClient(account, {
      config: async () => cfg,
      storage: store,
    });
  return {
    account,
    client,
    cfg,
    set: (s) => {
      ({ amount = amount, status = status, balance = balance } = s);
    },
  };
}
test("no login or insufficient credits prevents sending and never clears a draft", async () => {
  const f = fixture();
  f.account.user = null;
  await assert.rejects(f.client.prepare({ messages: [] }), {
    code: "LOGIN_REQUIRED",
  });
  const g = fixture();
  g.set({ balance: 0 });
  await assert.rejects(g.client.prepare({ messages: [] }), {
    code: "INSUFFICIENT_CREDITS",
  });
});
test("ambiguous retry reuses request ID, settled replay works at zero balance, released retry gets a new ID", async () => {
  const f = fixture(),
    body = {
      outputLength: "long",
      messages: [{ role: "user", content: "Hello" }],
    };
  const a = await f.client.prepare(body),
    b = await f.client.prepare(body);
  assert.equal(a.billing.id, b.billing.id);
  f.set({ status: { status: "settled", reply: "saved" }, balance: 0 });
  const replay = await f.client.prepare(body);
  assert.equal(replay.billing.id, a.billing.id);
  f.set({ status: { status: "released" }, balance: 0 });
  await assert.rejects(f.client.prepare(body), {
    code: "INSUFFICIENT_CREDITS",
  });
  f.set({ balance: 4 });
  const next = await f.client.prepare(body);
  assert.notEqual(next.billing.id, a.billing.id);
});
test("account change during quote/token retrieval invalidates pending billing work", async () => {
  const f = fixture();
  f.account.api = async () => {
    f.account.user = { uid: "bob" };
    return { wallet: { balance: 10 } };
  };
  await assert.rejects(f.client.prepare({}), { code: "ACCOUNT_CHANGED" });
});
test("campaign dry-run validates without initializing credentials or exposing user identifiers", async () => {
  let initialized = false;
  const logs = [],
    input = {
      id: "beta",
      amount: 100,
      budget: 200,
      uids: ["secret-alice", "secret-alice", "secret-bob"],
      startsAt: "2026-11-13T00:00:00Z",
      endsAt: "2026-11-20T00:00:00Z",
      expiresAt: "2026-12-01T00:00:00Z",
    };
  const result = await run(["--file=fixture"], {
    read: async () => JSON.stringify(input),
    services: async () => {
      initialized = true;
      throw Error();
    },
    log: (v) => logs.push(v),
  });
  assert.equal(initialized, false);
  assert.equal(result.recipientCount, 2);
  assert.equal(result.maximumIssue, 200);
  assert.doesNotMatch(JSON.stringify(logs), /secret-alice|secret-bob/);
});
test("live grant tool requires explicit apply and separate live guard", async () => {
  const input = {
    id: "beta",
    amount: 100,
    budget: 100,
    uids: ["alice"],
    startsAt: "2026-11-13T00:00:00Z",
    endsAt: "2026-11-20T00:00:00Z",
    expiresAt: "2026-12-01T00:00:00Z",
  };
  let touched = false;
  await assert.rejects(
    run(["--file=fixture", "--mode=live", "--apply"], {
      env: {},
      read: async () => JSON.stringify(input),
      services: async () => {
        touched = true;
      },
      log() {},
    }),
    /Live grant/,
  );
  assert.equal(touched, false);
});
