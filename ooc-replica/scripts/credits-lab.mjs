// Local-only acceptance server. It has no provider/auth/payment credentials.
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { database } from "../tests/helpers/credit-db.mjs";
import { createCredits, digest } from "../server/credits.js";
import { creditPolicy, quote } from "../server/credit-policy.js";
import { createChatBilling } from "../server/chat-billing.js";
import { createChatHandler } from "../api/chat.js";
const db = database(),
  store = createCredits(db, "test"),
  uid = "qa-alice",
  now = Date.now(),
  env = { CREDIT_BILLING_MODE: "test", STRIPE_SECRET_KEY: "sk_test_fixture" };
await store.purchase(uid, "cs_qa_fixture", 200);
await store.registerCampaign({
  id: "beta-preview",
  amount: 30,
  budget: 30,
  recipients: [digest(uid)],
  startsAt: now - 1000,
  endsAt: now + 86400000,
  expiresAt: now + 7 * 86400000,
});
const authenticate = async (req) => {
  if (req.headers.authorization !== "Bearer qa-only")
    throw Object.assign(Error("QA sign-in required"), { status: 401 });
  return { id: uid };
};
let bodyForModel;
const bill = createChatBilling({ env, authenticate, services: () => ({ db }) });
const chat = createChatHandler({
  bill,
  provider: () => ({ name: "qa-model", model: "qa-model", kind: "google" }),
  model: () => ({}),
  stream: () => ({
    stream: (async function* () {
      for (const text of [
        "今天终于有时间一起坐下来聊聊了。",
        "你想从今天发生的哪件事说起？",
      ]) {
        await new Promise((r) => setTimeout(r, 250));
        yield { type: "text-delta", text };
        if (bodyForModel.qaFailure) throw Error("Simulated upstream failure");
      }
      yield { type: "finish", finishReason: "stop" };
    })(),
  }),
});
const root = path.resolve("dist");
http
  .createServer(async (req, res) => {
    res.status = (n) => {
      res.statusCode = n;
      return res;
    };
    res.json = (data) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
      return res;
    };
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname.startsWith("/api/")) {
        let text = "";
        for await (const chunk of req) {
          text += chunk;
          if (text.length > 120000) throw Error("too long");
        }
        const body = text ? JSON.parse(text) : {};
        req.body = body;
        if (url.pathname === "/api/config")
          return res.json({
            billing: creditPolicy(env),
            walletMode: "test",
            walletConfigured: true,
            payments: false,
            creditPacks: [],
            auth: null,
          });
        await authenticate(req);
        if (url.pathname === "/api/chat") {
          bodyForModel = body;
          req.headers.origin = "https://" + req.headers.host;
          return await chat(req, res);
        }
        if (url.pathname === "/api/checkin")
          return res.json(await store.checkin(uid));
        if (url.pathname === "/api/wallet") {
          if (body.action === "quote")
            return res.json({
              ...quote(body, env),
              wallet: await store.read(uid),
            });
          if (body.action === "claim")
            return res.json(await store.grant(uid, body.campaign));
          if (body.action === "status")
            return res.json(await store.status(uid, body.id));
          return res.json(await store.read(uid));
        }
        return res.status(404).json({ error: "Unknown QA API" });
      }
      const file =
        url.pathname === "/"
          ? path.resolve("tests/fixtures/credits-lab.html")
          : path.resolve(root, "." + decodeURIComponent(url.pathname));
      if (
        file !== path.resolve("tests/fixtures/credits-lab.html") &&
        !file.startsWith(root + path.sep)
      )
        throw Error("invalid path");
      const bytes = await readFile(file);
      res.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "text/javascript; charset=utf-8"
          : file.endsWith(".css")
            ? "text/css; charset=utf-8"
            : "text/html; charset=utf-8",
      );
      res.end(bytes);
    } catch (e) {
      res
        .status(e.status || 503)
        .json({ code: e.code, error: e.code ? e.message : "QA service error" });
    }
  })
  .listen(3112, "127.0.0.1", () =>
    console.log("Credits QA: http://127.0.0.1:3112/?creditTab=free"),
  );
