// Adapted from server/platform.mjs: same Stripe catalog, signed fulfillment and ownership checks.
import Stripe from "stripe";
import { firebaseServices, adminConfigured } from "./firebase-admin.js";
import { firebaseConfig } from "./firebase-config.js";
import { createWallet } from "./wallet.js";
import { packs, stripeMode, priceId } from "./credit-packs.mjs";
export { packs } from "./credit-packs.mjs";
import { createHmac, timingSafeEqual } from "node:crypto";
export const response = (data, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function sameOrigin(req) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    throw new HttpError(403, "不允许跨站请求。");
}
export function createPlatform({ env = process.env, fetchImpl = fetch, services = () => firebaseServices(env) } = {}) {
  env = { ...env, STRIPE_SECRET_KEY: env.STRIPE_LIVE_SECRET_KEY || env.STRIPE_SECRET_KEY };
  const configured = () => Boolean(firebaseConfig(env) && adminConfigured(env));
  const walletCompatible = configured;
  const validAppUrl = () => {
    try { return new URL(env.APP_URL).protocol === 'https:'; } catch { return false; }
  };
  const publishableKey = () => {
    const key = (env.STRIPE_PUBLISHABLE_KEY || "").trim();
    return key.startsWith("pk_" + stripeMode(env) + "_") ? key : null;
  };
  const webhookSecret = () => stripeMode(env) === "live"
    ? env.STRIPE_LIVE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET : env.STRIPE_WEBHOOK_SECRET;
  async function user(req) {
    if (!configured()) throw new HttpError(503, "账户钱包尚未配置。");
    const token = req.headers.get("authorization")?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) throw new HttpError(401, "请先登录。");
    const report=(error,stage)=>{
      const code=typeof error?.code==='string'&&/^[a-zA-Z0-9_/-]{1,80}$/.test(error.code)?error.code:'unknown';
      const upstream=error?.httpResponse?.data?.error;
      const safeEnum=value=>typeof value==='string'&&/^[A-Z][A-Z0-9_]{1,80}$/.test(value)?value:undefined;
      const reasons=Array.isArray(upstream?.details)?upstream.details.map(d=>safeEnum(d.reason)).filter(Boolean):[];
      console.warn(JSON.stringify({event:'firebase_auth_failed',stage,code,upstreamStatus:safeEnum(upstream?.status),upstreamCode:Number.isInteger(upstream?.code)?upstream.code:undefined,reasons}));
      return code;
    };
    let auth;
    try { auth=services().auth; }
    catch(error){report(error,'initialization');throw new HttpError(503,"账户服务配置异常，请联系站点管理员。");}
    try {
      const u = await auth.verifyIdToken(token, true);
      return { id: u.uid, email: u.email };
    } catch(error) {
      const code=report(error,'verification');
      if(code==='unknown'||['auth/id-token-expired','auth/id-token-revoked','auth/invalid-id-token','auth/argument-error','auth/user-disabled','auth/user-not-found'].includes(code))throw new HttpError(401,"登录已过期，请重新登录。");
      throw new HttpError(503,"账户服务暂时无法验证登录，请稍后重试。");
    }
  }
  const rpc = async (name, body) => {
    if (!configured()) throw new HttpError(503, "账户钱包尚未配置。");
    try { return await createWallet(services().db, stripeMode(env)).rpc(name, body); }
    catch(error) {
      const raw = error?.code;
      const code = Number.isInteger(raw) ? raw : typeof raw === 'string' && /^[a-zA-Z0-9_/-]{1,80}$/.test(raw) ? raw : 'unknown';
      console.warn(JSON.stringify({event:'firebase_wallet_failed',operation:name,code}));
      throw new HttpError(503, "钱包暂时无法读取，请联系站点管理员。");
    }
  };
  async function stripe(path, params, idempotencyKey) {
    if (!env.STRIPE_SECRET_KEY) throw new HttpError(503, "付款服务尚未配置。");
    if (stripeMode(env) === "live" && env.STRIPE_LIVE_ENABLED !== "true")
      throw new HttpError(503, "正式付款尚未启用。");
    const client = new Stripe(env.STRIPE_SECRET_KEY.trim(), {
      apiVersion: "2026-08-26.dahlia",
      httpClient: Stripe.createFetchHttpClient(fetchImpl),
      maxNetworkRetries: 0,
      timeout: 12000,
    });
    try {
      if (params)
        return await client.checkout.sessions.create(params, {
          idempotencyKey,
        });
      return await client.checkout.sessions.retrieve(
        path.replace("checkout/sessions/", "").split("?")[0],
        { expand: ["line_items"] },
      );
    } catch (error) {
      const safe = (value) =>
        typeof value === "string" && /^[a-zA-Z0-9_\[\].-]{1,100}$/.test(value)
          ? value
          : undefined;
      console.warn(
        JSON.stringify({
          event: "stripe_request_failed",
          providerStatus: error.statusCode,
          code: safe(error.code),
          param: safe(error.param),
          requestId: safe(error.requestId),
        }),
      );
      throw new HttpError(502, "付款服务暂时不可用。");
    }
  }

  function validateCheckout(s) {
    const credits = Number(s.metadata?.credits),
      p = packs[credits],
      uid = s.metadata?.user_id;
    const line = s.line_items?.data?.[0];
    if (
      !p ||
      s.mode !== "payment" ||
      s.currency !== "usd" ||
      s.amount_total !== p.amount ||
      s.client_reference_id !== uid ||
      !uid ||
      s.metadata?.wallet_backend !== "firebase-replica-v1" ||
      s.metadata?.firebase_project !== env.FIREBASE_PROJECT_ID ||
      s.line_items?.data?.length !== 1 ||
      line?.quantity !== 1 ||
      line.price?.id !== priceId(p, env)
    )
      throw new HttpError(400, "订单金额或方案不匹配。");
    return { credits, uid };
  }
  const safely = (fn) => async (req) => {
    try {
      return await fn(req);
    } catch (e) {
      return response(
        {
          error:
            e instanceof HttpError ? e.message : "服务暂时不可用，请重试。",
        },
        e.status || 503,
      );
    }
  };
  return {
    user,
    rpc,
    configured,
    config: safely(async (req) => {
      if (req.method !== "GET") throw new HttpError(405, "只支持 GET。");
      const auth = firebaseConfig(env);
      return response({
        auth,
        payments: Boolean(
          configured() &&
            env.STRIPE_SECRET_KEY &&
            validAppUrl() &&
            webhookSecret() &&
            Object.values(packs).every((p) => priceId(p, env)) &&
            (stripeMode(env) === "test" ||
              env.STRIPE_LIVE_ENABLED === "true") &&
            walletCompatible(),
        ),
        embeddedPayments: Boolean(publishableKey()),
        stripePublishableKey: publishableKey(),
        walletMode: stripeMode(env),
        creditPacks: Object.entries(packs).map(([credits, p]) => ({ credits: Number(credits), amount: p.amount, label: p.label })),
        walletConfigured: configured(),
        checkinTimezone: "Asia/Shanghai",
      });
    }),
    wallet: safely(async (req) => {
      if (req.method !== "GET") throw new HttpError(405, "只支持 GET。");
      const u = await user(req);
      return response(await rpc("storylove_wallet", { p_user: u.id }));
    }),
    checkin: safely(async (req) => {
      if (req.method !== "POST") throw new HttpError(405, "只支持 POST。");
      sameOrigin(req);
      const u = await user(req);
      return response(await rpc("storylove_checkin", { p_user: u.id }));
    }),
    checkout: safely(async (req) => {
      if (req.method !== "POST") throw new HttpError(405, "只支持 POST。");
      sameOrigin(req);
      const u = await user(req);
      if (Number(req.headers.get("content-length")) > 2000)
        throw new HttpError(413, "请求过长。");
      let input;
      try {
        input = JSON.parse(await readLimited(req, 2000));
      } catch (e) {
        if (e instanceof HttpError) throw e;
        throw new HttpError(400, "无效充值请求。");
      }
      if (!walletCompatible())
        throw new HttpError(503, "Firebase 钱包尚未配置。");
      const { pack, request_id } = input;
      const embedded = input.ui_mode === "elements";
      if (input.ui_mode && !embedded && input.ui_mode !== "hosted")
        throw new HttpError(400, "无效付款界面。");
      if (embedded && !publishableKey())
        throw new HttpError(503, "站内付款尚未配置。");
      const aid = (v) => typeof v === "string" && /^[a-f0-9-]{36}$/i.test(v);
      if (!aid(request_id)) throw new HttpError(400, "无效订单请求编号。");
      const p = packs[pack];
      if (!p || !priceId(p, env) || !webhookSecret())
        throw new HttpError(503, "此充值方案尚未开通。");
      let base;
      try {
        base = new URL(
          env.APP_URL ||
            (stripeMode(env) === "test" ? new URL(req.url).origin : ""),
        );
        if (base.protocol !== "https:") throw Error();
      } catch {
        throw new HttpError(503, "付款回调地址尚未配置。");
      }
      const returnUrl =
        base.origin +
        "/credit?checkout=success&session_id={CHECKOUT_SESSION_ID}";
      const params = {
        mode: "payment",
        line_items: [{ price: priceId(p, env), quantity: 1 }],
        client_reference_id: u.id,
        metadata: {
          user_id: u.id,
          wallet_backend: "firebase-replica-v1",
          firebase_project: env.FIREBASE_PROJECT_ID,
          credits: String(pack),
          wallet_mode: stripeMode(env),
        },
        integration_identifier: "storylove-elements-qrxkntva",
        adaptive_pricing: { enabled: false },
        managed_payments: { enabled: false },
        ...(embedded
          ? { ui_mode: "elements", return_url: returnUrl }
          : {
              ui_mode: "hosted_page",
              success_url: returnUrl,
              cancel_url: base.origin + "/credit?checkout=cancelled",
            }),
      };
      if (u.email) params.customer_email = u.email;
      // Do not open a new payment while the wallet database is unavailable.
      await rpc("storylove_wallet", { p_user: u.id });
      const s = await stripe(
        "checkout/sessions",
        params,
        "firebase-replica:" +
          env.FIREBASE_PROJECT_ID + ":" +
          stripeMode(env) +
          ":" +
          u.id +
          ":" +
          pack +
          ":" +
          (embedded ? "elements:" : "hosted-page:") +
          request_id,
      );
      if (embedded) {
        if (!s.client_secret || !s.id?.startsWith("cs_"))
          throw new HttpError(502, "无法打开安全付款界面。");
        return response({ client_secret: s.client_secret, session_id: s.id });
      }
      if (!s.url?.startsWith("https://checkout.stripe.com/"))
        throw new HttpError(502, "无法打开安全付款页面。");
      return response({ url: s.url, session_id: s.id });
    }),

    checkoutStatus: safely(async (req) => {
      if (req.method !== "GET") throw new HttpError(405, "只支持 GET。");
      const u = await user(req),
        id = new URL(req.url).searchParams.get("session_id");
      if (!/^cs_[\w]+$/.test(id || "")) throw new HttpError(400, "无效订单。");
      const s = await stripe(
        "checkout/sessions/" + id + "?expand[]=line_items",
      );
      if (s.client_reference_id !== u.id || s.metadata?.user_id !== u.id)
        throw new HttpError(404, "找不到这笔订单。");
      if (
        s.livemode !== (stripeMode(env) === "live") ||
        s.metadata?.wallet_mode !== stripeMode(env)
      )
        throw new HttpError(400, "订单环境不匹配。");
      validateCheckout(s);
      let credited = false;
      if (s.payment_status === "paid") {
        credited = await rpc("storylove_purchase_status", {
          p_user: u.id,
          p_session: id,
        });
      }
      return response({
        paid: s.payment_status === "paid",
        credited,
        status: s.status || "open",
      });
    }),
    webhook: safely(async (req) => {
      if (req.method !== "POST") throw new HttpError(405, "只支持 POST。");
      if (!webhookSecret()) throw new HttpError(503, "Webhook 尚未配置。");
      const raw = await readLimited(req, 262144);
      if (
        !verifySignature(
          raw,
          req.headers.get("stripe-signature"),
          webhookSecret(),
        )
      )
        throw new HttpError(400, "无效签名。");
      const event = JSON.parse(raw);
      if (event.livemode !== (stripeMode(env) === "live"))
        throw new HttpError(400, "付款环境不匹配。");
      if (
        ![
          "checkout.session.completed",
          "checkout.session.async_payment_succeeded",
        ].includes(event.type)
      )
        return response({ received: true });
      const id = event.data?.object?.id;
      if (!/^cs_[\w]+$/.test(id || "")) throw new HttpError(400, "无效订单。");
      const s = await stripe(
        "checkout/sessions/" + id + "?expand[]=line_items",
      );
      if (s.payment_status !== "paid") return response({ received: true });
      if (
        s.livemode !== (stripeMode(env) === "live") ||
        s.metadata?.wallet_mode !== stripeMode(env)
      )
        throw new HttpError(400, "订单钱包环境不匹配。");
      const { credits, uid } = validateCheckout(s);
      await rpc("storylove_purchase", {
        p_user: uid,
        p_session: s.id,
        p_credits: credits,
      });
      return response({ received: true });
    }),
  };
}
export async function readLimited(req, max) {
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "请求为空。");
  let total = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await reader.cancel();
      throw new HttpError(413, "请求过长。");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
export function verifySignature(raw, header, secret, now = Date.now()) {
  if (!header) return false;
  const parts = header.split(",").map((x) => x.split("="));
  const timestamp = parts.find((x) => x[0] === "t")?.[1];
  if (
    !/^\d+$/.test(timestamp || "") ||
    Math.abs(now / 1000 - Number(timestamp)) > 300
  )
    return false;
  const digest = createHmac("sha256", secret)
    .update(timestamp + "." + raw)
    .digest();
  return parts
    .filter((x) => x[0] === "v1")
    .some(
      ([, sig]) =>
        /^[a-f0-9]{64}$/i.test(sig || "") &&
        timingSafeEqual(digest, Buffer.from(sig, "hex")),
    );
}
export const platform = createPlatform();
