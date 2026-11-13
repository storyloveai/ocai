import test from "node:test";
import {coverImage} from "./fixtures/cover-image.mjs";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { createCredits } from "../server/credits.js";
import { createChatBilling } from "../server/chat-billing.js";
import { quote, PRICE_VERSION } from "../server/credit-policy.js";
import { createHandler } from "../api/three-kingdoms.js";
import { createImageHandler } from "../api/image.js";
import { createChatHandler } from "../api/chat.js";
import { database } from "./helpers/credit-db.mjs";
const env = {
  CREDIT_BILLING_MODE: "test",
  STRIPE_SECRET_KEY: "sk_test_fixture",
};
function response() {
  const r = new EventEmitter();
  return Object.assign(r, {
    statusCode: 200,
    headers: {},
    events: [],
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(n) {
      this.statusCode = n;
      return this;
    },
    write(s) {
      this.headersSent = true;
      for (const line of s.trim().split("\n"))
        if (line) this.events.push(JSON.parse(line));
      return true;
    },
    json(data) {
      this.result = data;
      this.writableFinished = true;
      return this;
    },
    end(s) {
      if (s) this.write(s);
      this.writableFinished = true;
    },
  });
}
async function fixture(body, route) {
  const db = database(),
    store = createCredits(db, "test");
  await store.purchase("alice", "cs_test", 200);
  body.billing = {
    id: randomUUID(),
    version: PRICE_VERSION,
    amount: quote(body, env, route).amount,
  };
  const bill = createChatBilling({
    env,
    authenticate: async (req) => {
      if (req.headers.authorization !== "Bearer alice")
        throw Object.assign(Error(), { status: 401 });
      return { id: "alice" };
    },
    services: () => ({ db }),
  });
  const req = () => ({
    method: "POST",
    headers: {
      host: "test.invalid",
      origin: "https://test.invalid",
      "content-type": "application/json",
      authorization: "Bearer alice",
      "x-forwarded-for": randomUUID(),
    },
    body,
  });
  return { db, store, bill, body, req };
}
test("game stages settle independently at their displayed prices and replay without another model call", async () => {
  const f = await fixture(
    { phase: "express", context: { player_input: "hello" }, lang: "zh" },
    "game",
  );
  let calls = 0;const metered=[];
  const output = {
    blocks: [{ type: "dialogue", speaker: "npc", text: "Hello" }],
  };
  const handler = createHandler({
    bill: f.bill,
    meter: row=>metered.push(row),
    config: () => ({ kind: "google", name: "fixture", model: "fixture" }),
    model: () => ({}),
    stage: () => ({}),
    generate: async () => {
      calls++;
      return { text: JSON.stringify(output), finishReason: "stop", totalUsage:{inputTokens:80,outputTokens:20} };
    },
  });
  let r = response();
  await handler(f.req(), r);
  assert.equal(r.result.billing.status, "settled");
  assert.equal((await f.store.read("alice")).balance, 199);
  r = response();
  await handler(f.req(), r);
  assert.deepEqual(r.result.output, output);
  assert.equal(calls, 1);
  assert.equal(metered.length,1);assert.equal(metered[0].task,'game.express');assert.equal(metered[0].usage.inputTokens,80);
  assert.equal((await f.store.read("alice")).balance, 199);
});
test("game structured-stream errors and truncated results release their own reservation", async () => {
  const f = await fixture(
    { phase: "express", context: { player_input: "hello" }, lang: "zh" },
    "game",
  );
  const handler = createHandler({
    bill: f.bill,
    config: () => ({ kind: "google", name: "fixture", model: "fixture" }),
    model: () => ({}),
    stage: () => ({}),
    stream: () => ({
      partialOutputStream: (async function* () {
        yield { blocks: [{ text: "partial" }] };
        throw Error("broken");
      })(),
    }),
  });
  const req = f.req();
  req.headers.accept = "application/x-ndjson";
  const r = response();
  await handler(req, r);
  assert.equal(r.events.at(-1).type, "error");
  assert.equal((await f.store.read("alice")).balance, 200);
});
test("image success is cached/replayed, failures do not charge, and wrong quotes never reach upstream", async () => {
  const f = await fixture(
    { type: "story", prompt: "A quiet harbor", title: "test" },
    "image",
  );
  let calls = 0;const metered=[];
  const b64 = coverImage;
  const handler = createImageHandler({
    bill: f.bill,
    meter: row=>metered.push(row),
    configuration: () => ({
      key: "fake-provider-key",
      model: "gpt-image-fixture",
    }),
    fetchImpl: async () => {
      calls++;
      return Response.json({ data: [{ b64_json: b64 }],usage:{input_tokens:100,output_tokens:2000} });
    },
  });
  let r = response();
  await handler(f.req(), r);
  assert.equal(r.result.b64, b64);
  assert.equal((await f.store.read("alice")).balance, 120);
  r = response();
  await handler(f.req(), r);
  assert.equal(r.result.b64, b64);
  assert.equal(calls, 1);
  assert.equal(metered.length,1);assert.equal(metered[0].task,'image');assert.equal(metered[0].imageCount,1);assert.equal(metered[0].usage.outputTokens,2000);
  assert.doesNotMatch(JSON.stringify(metered),/quiet harbor|b64_json|fake-provider-key/);
  const g = await fixture({ type: "story", prompt: "Another" }, "image");
  g.body.billing.amount = 0;
  r = response();
  await createImageHandler({
    bill: g.bill,
    configuration: () => ({ key: "fake", model: "gpt-image-fixture" }),
    fetchImpl: async () => {
      throw Error("must not run");
    },
  })(g.req(), r);
  assert.equal(r.result.code, "PRICE_CHANGED");
  assert.equal((await g.store.read("alice")).balance, 200);
  const h = await fixture({ type: "story", prompt: "Another" }, "image");
  r = response();
  await createImageHandler({
    bill: h.bill,
    configuration: () => ({ key: "fake", model: "gpt-image-fixture" }),
    fetchImpl: async () =>
      Response.json({ error: { code: "moderation_blocked" } }, { status: 400 }),
  })(h.req(), r);
  assert.equal(r.statusCode, 422);
  assert.equal((await h.store.read("alice")).balance, 200);
});
test("creator authoring has a separate price and replay works across price-version changes", async () => {
  const f = await fixture(
    {
      task: "author",
      field: "title",
      type: "story",
      idea: "A harbor",
      draft: {},
      messages: [],
    },
    "chat",
  );
  let calls = 0;
  const handler = createChatHandler({
    bill: f.bill,
    provider: () => ({ kind: "google", name: "fixture", model: "fixture" }),
    model: () => ({}),
    stream: () => {
      calls++;
      return {
        stream: (async function* () {
          yield { type: "text-delta", text: "The harbor" };
          yield { type: "finish", finishReason: "stop" };
        })(),
      };
    },
  });
  const req = f.req();
  req.headers.accept = "application/x-ndjson";
  let r = response();
  await handler(req, r);
  assert.equal((await f.store.read("alice")).balance, 197);
  f.body.billing.version = "older-client-version";
  f.body.billing.amount = 999;
  r = response();
  await handler(req, r);
  assert.equal(r.events.at(-1).replayed, true);
  assert.equal(calls, 1);
  assert.equal((await f.store.read("alice")).balance, 197);
});
test("large recovery results are chunked, integrity checked, and inaccessible to another user", async () => {
  const f = await fixture({ phase: "express" }, "game"),
    q = quote(f.body, env, "game");
  const { digest } = await import("../server/credits.js");
  await f.store.reserve("alice", {
    id: f.body.billing.id,
    fingerprint: digest("test"),
    sku: q.sku,
    version: q.version,
    amount: q.amount,
  });
  const text = "图像结果" + "A".repeat(900000);
  await f.store.finish("alice", f.body.billing.id, true, text);
  assert.equal((await f.store.status("alice", f.body.billing.id)).reply, text);
  await assert.rejects(f.store.status("bob", f.body.billing.id), {
    code: "UNKNOWN_OPERATION",
  });
  const key = [...f.db.rows.keys()].find((k) =>
    k.startsWith("replica-credit-response-parts-test/"),
  );
  f.db.rows.delete(key);
  assert.equal(
    (await f.store.status("alice", f.body.billing.id)).reply,
    undefined,
  );
  assert.equal((await f.store.read("alice")).balance, 199);
});
test('game fallback attempts remain separately observable and do not double-charge',async()=>{
 const f=await fixture({phase:'understand',context:{player_input:'hello'},lang:'zh'},'game'),rows=[];
 let calls=0;
 const handler=createHandler({bill:f.bill,stage:()=>({}),config:()=>({name:'first',model:'first',kind:'google'}),fallback:()=>({name:'second',model:'second',kind:'google'}),model:()=>({}),meter:r=>rows.push(r),generate:async()=>{
  calls++;if(calls===1)throw Error('private provider detail');
  return {text:'{"kind":"talk"}',finishReason:'stop',usage:{inputTokens:120,outputTokens:4}};
 }});
 const r=response();await handler(f.req(),r);
 assert.equal(r.statusCode,200);assert.equal(calls,2);
 assert.deepEqual(rows.map(x=>[x.attempt,x.task,x.outcome]),[[1,'game.understand','failed'],[2,'game.understand','completed']]);
 assert.equal(rows[0].usage,undefined);assert.equal(rows[1].usage.inputTokens,120);
 assert.equal(rows[0].requestId,rows[1].requestId);
 assert.equal((await f.store.read('alice')).balance,199);
 assert.doesNotMatch(JSON.stringify(rows),/private provider detail|player_input|Bearer/);
});
test('an upstream 200 with corrupt image bytes releases credits and retains an unknown-cost attempt',async()=>{
 const f=await fixture({type:'story',prompt:'private cover idea'},'image'),rows=[];
 const handler=createImageHandler({bill:f.bill,meter:r=>rows.push(r),configuration:()=>({key:'fixture-only',model:'image-fixture'}),fetchImpl:async()=>Response.json({data:[{b64_json:'aW52YWxpZCBpbWFnZQ=='}],usage:{input_tokens:10,output_tokens:20}})});
 const r=response();await handler(f.req(),r);
 assert.equal(r.statusCode,502);assert.equal((await f.store.read('alice')).balance,200);
 assert.equal((await f.store.read('alice')).reserved,0);
 assert.equal(rows[0].outcome,'failed');assert.equal(rows[0].imageCount,1);
 assert.equal(rows[0].usage.outputTokens,20);
});
