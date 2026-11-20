import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { attachGameCredits } from "../dist/assets/game-credit-bridge.js";
const tick = () => new Promise((r) => setTimeout(r, 0));
test("game AI requires explicit opt-in and forwards only authenticated quoted requests", async () => {
  const { document, window } = parseHTML(
      "<html><body><iframe></iframe></body></html>",
    ),
    originalFetch = globalThis.fetch,
    originalLocation = globalThis.location;
  globalThis.location = {
    origin: "https://test.invalid",
    href: "https://test.invalid/play/xichuan",
  };
  const cfg = {
    walletMode: "test",
    billing: { enabled: true, prices: { gameUnderstand: 1, gameExpress: 1 } },
  };
  globalThis.fetch = async () => Response.json(cfg);
  const calls = [],
    frame = document.querySelector("iframe"),
    peer = {
      fetch: async (url, init) => {
        calls.push({ url, init });
        return new Response(
          '{"type":"done","output":{"reply":"hello"},"billing":{"status":"settled"}}\n',
          { headers: { "Content-Type": "application/x-ndjson" } },
        );
      },
    };
  Object.defineProperty(frame, "contentWindow", { value: peer });
  const account = {
    user: { uid: "alice", getIdToken: async () => "test-token" },
    api: async (path, b) => ({
      amount: 1,
      version: "test-v1",
      wallet: { balance: 10 },
    }),
  };
  try {
    const bridge = attachGameCredits(frame, account, { lang: "zh" });
    bridge.install();
    await tick();
    const init = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: "express", game: "xichuan" }),
    };
    await assert.rejects(peer.fetch("/api/sanguo", init), {
      code: "AI_OPT_IN_REQUIRED",
    });
    assert.equal(calls.length, 0);
    assert.match(document.body.textContent, /意图解析 1/);
    const check = document.querySelector("input");
    check.checked = true;
    check.onchange();
    const response = await peer.fetch("/api/sanguo", init);
    await response.text();
    assert.match(document.body.textContent,/已完成，本阶段结算 1/);
    assert.doesNotMatch(document.body.textContent,/正在生成/);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].init.headers.Authorization, "Bearer test-token");
    assert.equal(JSON.parse(calls[0].init.body).billing.amount, 1);
    bridge.dispose();
    await assert.rejects(peer.fetch("/api/sanguo", init), /closed/);
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.location = originalLocation;
  }
});
