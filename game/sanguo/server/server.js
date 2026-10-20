#!/usr/bin/env node
/* 三国互动原型 · 本地服务器（零依赖，Node 18+）
 *
 *   node server/server.js            # 只提供页面 + 试玩埋点；打字用关键词匹配
 *   ANTHROPIC_API_KEY=... node server/server.js     # 接 Claude
 *   LLM_PROVIDER=openai OPENAI_API_KEY=... OPENAI_BASE_URL=... OPENAI_MODEL=... node server/server.js   # 接任意 OpenAI 兼容接口
 *
 * 接口（页面里的 useLocalServer() 调用，形状与 claude.ai 的 sample/db 一致）：
 *   GET  /api/health   → {ai: bool, provider, model, creator: bool}   (creator view only when CREATOR_VIEW=1, for local playtest)
 *   POST /api/sample   {input: string | [{role, content}], tier} → {text} 或 {code, message}
 *   POST /api/events   埋点事件（一行一条写入 data/events.jsonl）
 *   GET  /api/events   读取全部事件（页面“试玩数据”用）
 * 密钥只在服务器端读取，不会发给浏览器。
 */
const http = require("http"), fs = require("fs"), path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WEB = path.join(ROOT, "web");
const DATA = path.join(ROOT, "data");
const EVENTS = path.join(DATA, "events.jsonl");
const PORT = +process.env.PORT || 8787;

const PROVIDER = (process.env.LLM_PROVIDER || (process.env.ANTHROPIC_API_KEY ? "anthropic" : process.env.OPENAI_API_KEY ? "openai" : "none")).toLowerCase();
const CFG = {
  anthropic: {
    key: process.env.ANTHROPIC_API_KEY,
    base: (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, ""),
    model: { quick: process.env.ANTHROPIC_MODEL_QUICK || process.env.ANTHROPIC_MODEL || "claude-haiku-5-5", default: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5" },
  },
  openai: {
    key: process.env.OPENAI_API_KEY,
    base: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
    model: { quick: process.env.OPENAI_MODEL_QUICK || process.env.OPENAI_MODEL, default: process.env.OPENAI_MODEL },
  },
};
const cfg = CFG[PROVIDER];
const AI_ON = !!(cfg && cfg.key && cfg.model.quick);
const MAX_TOKENS = +process.env.MAX_TOKENS || 1024;
const TIMEOUT_MS = +process.env.LLM_TIMEOUT_MS || 30000;

function toMessages(input) {
  if (typeof input === "string") return [{ role: "user", content: input }];
  if (Array.isArray(input) && input.every(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")) return input;
  throw { status: 400, code: "invalid_request", message: "input must be a string or [{role, content}]" };
}
async function sample(input, tier) {
  if (!AI_ON) throw { status: 503, code: "sampling_disabled", message: "no model configured on the server" };
  const messages = toMessages(input);
  if (JSON.stringify(messages).length > 64 * 1024) throw { status: 413, code: "prompt_too_large", message: "input over 64 KiB" };
  const model = cfg.model[tier] || cfg.model.quick;
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    let r, d;
    if (PROVIDER === "anthropic") {
      r = await fetch(cfg.base + "/v1/messages", { method: "POST", signal: ctl.signal,
        headers: { "content-type": "application/json", "x-api-key": cfg.key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: MAX_TOKENS, messages }) });
      d = await r.json().catch(() => ({}));
      if (!r.ok) throw { status: r.status === 429 ? 429 : 502, code: r.status === 429 ? "rate_limited" : "upstream_error", message: (d.error && d.error.message) || ("upstream HTTP " + r.status) };
      return { text: (d.content || []).filter(b => b.type === "text").map(b => b.text).join(""), truncated: d.stop_reason === "max_tokens" };
    }
    r = await fetch(cfg.base + "/chat/completions", { method: "POST", signal: ctl.signal,
      headers: { "content-type": "application/json", authorization: "Bearer " + cfg.key },
      body: JSON.stringify({ model, max_tokens: MAX_TOKENS, messages }) });
    d = await r.json().catch(() => ({}));
    if (!r.ok) throw { status: r.status === 429 ? 429 : 502, code: r.status === 429 ? "rate_limited" : "upstream_error", message: (d.error && d.error.message) || ("upstream HTTP " + r.status) };
    const c = (d.choices || [])[0] || {};
    return { text: (c.message && c.message.content) || "", truncated: c.finish_reason === "length" };
  } catch (e) {
    if (e && e.name === "AbortError") throw { status: 504, code: "upstream_error", message: "timeout" };
    throw e.code ? e : { status: 502, code: "upstream_error", message: String(e) };
  } finally { clearTimeout(timer); }
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
const send = (res, status, body, type = "application/json; charset=utf-8") => { res.writeHead(status, { "content-type": type, "cache-control": "no-store" }); res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
const readBody = req => new Promise((ok, bad) => { let n = 0; const ch = []; req.on("data", c => { n += c.length; if (n > 256 * 1024) { bad({ status: 413, code: "invalid_request", message: "body too large" }); req.destroy(); } else ch.push(c); }); req.on("end", () => { try { ok(JSON.parse(Buffer.concat(ch).toString("utf8") || "{}")); } catch { bad({ status: 400, code: "invalid_request", message: "bad JSON" }); } }); });

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname === "/api/health") return send(res, 200, { ai: AI_ON, provider: AI_ON ? PROVIDER : "none", model: AI_ON ? cfg.model.quick : null, creator: process.env.CREATOR_VIEW === "1" });
    if (url.pathname === "/api/sample" && req.method === "POST") { const b = await readBody(req); return send(res, 200, await sample(b.input, b.tier)); }
    if (url.pathname === "/api/events" && req.method === "POST") {
      const ev = await readBody(req);
      if (!ev || typeof ev.event !== "string") throw { status: 400, code: "invalid_request", message: "event required" };
      fs.mkdirSync(DATA, { recursive: true }); fs.appendFileSync(EVENTS, JSON.stringify(Object.assign({ received_at: Date.now() }, ev)) + "\n");
      return send(res, 200, { ok: true });
    }
    if (url.pathname === "/api/events" && req.method === "GET") {
      const lines = fs.existsSync(EVENTS) ? fs.readFileSync(EVENTS, "utf8").split("\n").filter(Boolean) : [];
      return send(res, 200, lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean));
    }
    // 静态文件
    let p = decodeURIComponent(url.pathname); if (p === "/") p = "/index.html";
    const file = path.join(WEB, path.normalize(p).replace(/^([.][.][\/\\])+/, ""));
    if (!file.startsWith(WEB) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, "not found", "text/plain");
    return send(res, 200, fs.readFileSync(file), TYPES[path.extname(file)] || "application/octet-stream");
  } catch (e) {
    return send(res, e.status || 500, { code: e.code || "upstream_error", message: e.message || String(e) });
  }
}).listen(PORT, () => {
  console.log(`三国·谋士 原型：http://localhost:${PORT}`);
  console.log(AI_ON ? `模型：${PROVIDER} / ${cfg.model.quick}` : "未配置模型：打字用关键词匹配（设置 ANTHROPIC_API_KEY 或 OPENAI_* 可接模型）");
  console.log(`试玩埋点写入：${path.relative(process.cwd(), EVENTS)}`);
});
