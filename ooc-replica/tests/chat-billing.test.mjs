import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { createChatBilling } from "../server/chat-billing.js";
import { createChatHandler } from "../api/chat.js";
import { createCredits, digest } from "../server/credits.js";
import { PRICE_VERSION } from "../server/credit-policy.js";
import { database } from "./helpers/credit-db.mjs";
async function fixture() {
  const db = database(),
    store = createCredits(db, "test");
  await store.purchase("alice", "cs_seed", 200);
  let calls = 0;
  const env = {
    CREDIT_BILLING_MODE: "test",
    STRIPE_SECRET_KEY: "sk_test_fake",
  };
  const bill = createChatBilling({
    env,
    authenticate: async (req) => {
      if (req.headers.authorization !== "Bearer alice")
        throw Object.assign(Error("Please sign in"), { status: 401 });
      return { id: "alice" };
    },
    services: () => ({ db }),
  });
  const body = {
    titleId: "sgc-007",
    messages: [{ role: "user", content: "Can we talk?" }],
    billing: { id: randomUUID(), version: PRICE_VERSION, amount: 1 },
  };
  const req = () => ({
    method: "POST",
    headers: {
      host: "test.example",
      origin: "https://test.example",
      "content-type": "application/json",
      accept: "application/x-ndjson",
      authorization: "Bearer alice",
      "x-forwarded-for": randomUUID(),
    },
    body,
  });
  const res = () => {
    const r = new EventEmitter();
    Object.assign(r, {
      events: [],
      headers: {},
      statusCode: 200,
      writableFinished: false,
      writableEnded: false,
      destroyed: false,
      setHeader(k, v) {
        this.headers[k] = v;
      },
      status(n) {
        this.statusCode = n;
        return this;
      },
      json(v) {
        this.result = v;
        this.end();
        return this;
      },
      write(s) {
        this.events.push(...s.trim().split("\n").map(JSON.parse));
        return true;
      },
      end(s) {
        if (s) this.write(s);
        this.writableEnded = true;
        this.writableFinished = true;
      },
    });
    return r;
  };
  const handler = (options) =>
    createChatHandler({
      bill,
      provider: () => ({ name: "fixture", model: "fixture", kind: "google" }),
      model: () => ({}),
      stream: () => {
        calls++;
        return {
          stream: (async function* () {
            yield { type: "text-delta", text: "A complete reply." };
            yield { type: "finish", finishReason: "stop" };
          })(),
        };
      },
      ...options,
    });
  return {
    db,
    store,
    bill,
    body,
    req,
    res,
    handler,
    get calls() {
      return calls;
    },
  };
}
test("real chat handler reserves before generation, settles once and replays without provider cost", async () => {
  const f = await fixture(),
    handler = f.handler(),
    r = f.res();
  await handler(f.req(), r);
  assert.equal(r.events.at(-1).type, "done");
  assert.equal(f.calls, 1);
  assert.equal((await f.store.read("alice")).balance, 199);
  assert.equal((await f.store.read("alice")).reserved, 0);
  const replay = f.res();
  await handler(f.req(), replay);
  assert.equal(f.calls, 1);
  assert.equal(replay.events.at(-1).replayed, true);
  assert.equal(
    replay.events.find((e) => e.type === "text").text,
    "A complete reply.",
  );
  assert.equal((await f.store.read("alice")).balance, 199);
});
test("altered price, auth and idempotency input fail before any provider call", async () => {
  const f = await fixture(),
    h = f.handler();
  f.body.billing.amount = 0;
  let r = f.res();
  await h(f.req(), r);
  assert.equal(r.result.code, "PRICE_CHANGED");
  assert.equal(f.calls, 0);
  f.body.billing.amount = 1;
  const unauth = f.req();
  delete unauth.headers.authorization;
  r = f.res();
  await h(unauth, r);
  assert.equal(r.statusCode, 401);
  assert.equal(f.calls, 0);
  await h(f.req(), f.res());
  f.body.messages[0].content = "changed";
  r = f.res();
  await h(f.req(), r);
  assert.equal(r.result.code, "IDEMPOTENCY_CONFLICT");
  assert.equal(f.calls, 1);
});
test("partial output failure releases the hold; an incomplete visible reply is not charged", async () => {
  const f = await fixture(),
    h = f.handler({
      stream: () => ({
        stream: (async function* () {
          yield { type: "text-delta", text: "partial" };
          throw Error("provider failure");
        })(),
      }),
    });
  const r = f.res();
  await h(f.req(), r);
  assert.equal(r.events.at(-1).type, "error");
  assert.equal((await f.store.read("alice")).balance, 200);
  assert.equal((await f.store.read("alice")).stats.spent.purchased, 0);
});
test("client disconnect during generation releases the hold", async () => {
  const f = await fixture(),
    r = f.res(),
    h = f.handler({
      stream: () => ({
        stream: (async function* () {
          yield { type: "text-delta", text: "partial" };
          r.emit("close");
          yield { type: "finish", finishReason: "stop" };
        })(),
      }),
    });
  await h(f.req(), r);
  assert.equal((await f.store.read("alice")).balance, 200);
  assert.equal((await f.store.read("alice")).reserved, 0);
});
test("enabled mode blocks unpriced creator/game/image routes and free model suggestions", async () => {
  const f = await fixture();
  await assert.rejects(f.bill(f.req(), { ...f.body, task: "author" }), {
    code: "BILLING_NOT_AVAILABLE",
  });
  await assert.rejects(f.bill(f.req(), f.body, "game"), {
    code: "BILLING_NOT_AVAILABLE",
  });
  await assert.rejects(f.bill(f.req(), { ...f.body, task: "suggestions" }), {
    code: "INCLUDED_SUGGESTIONS",
  });
  assert.equal(f.calls, 0);
  const off = createChatBilling({
    env: {},
    services: () => {
      throw Error("Off billing must not access database");
    },
  });
  assert.equal(await off(f.req(), f.body), null);
});
test("test billing cannot touch live wallets; store unavailability cannot run generation", async () => {
  const f = await fixture(),
    mismatch = createChatBilling({
      env: { CREDIT_BILLING_MODE: "test", STRIPE_SECRET_KEY: "sk_live_fake" },
      services: () => {
        throw Error("not reached");
      },
    });
  await assert.rejects(mismatch(f.req(), f.body), {
    code: "BILLING_CONFIGURATION",
  });
  const unavailable = async () => {
      throw Error("private database error");
    },
    r = f.res();
  await f.handler({ bill: unavailable })(f.req(), r);
  assert.equal(r.result.code, "BILLING_UNAVAILABLE");
  assert.equal(f.calls, 0);
  assert.doesNotMatch(JSON.stringify(r.result), /private database/);
});

test("truncated or unconfirmed output is not charged", async () => {
  for (const reason of ["length", undefined, "content-filter"]) {
    const f = await fixture(),
      r = f.res();
    await f.handler({
      stream: () => ({
        stream: (async function* () {
          yield { type: "text-delta", text: "unfinished" };
          if (reason) yield { type: "finish", finishReason: reason };
        })(),
      }),
    })(f.req(), r);
    assert.equal(r.events.at(-1).code, "AI_INCOMPLETE");
    assert.equal((await f.store.read("alice")).balance, 200);
  }
});

test('unknown SDK error codes cannot expose provider credential diagnostics',async()=>{
 const f=await fixture(),r=f.res();await f.handler({bill:async()=>{throw Object.assign(Error('PRIVATE key diagnostic'),{code:'app/invalid-credential'});}})(f.req(),r);assert.equal(r.statusCode,503);assert.equal(r.result.code,'BILLING_UNAVAILABLE');assert.doesNotMatch(JSON.stringify(r.result),/PRIVATE|invalid-credential/);
});
