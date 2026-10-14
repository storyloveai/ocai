import Stripe from "stripe";
import { packs, stripeMode, priceId } from "../data/credit-packs.mjs";
export { packs } from "../data/credit-packs.mjs";
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
export function createPlatform({ env = process.env, fetchImpl = fetch } = {}) {
  // A Production-only live key leaves Preview's existing sandbox key intact.
  env = {
    ...env,
    STRIPE_SECRET_KEY: env.STRIPE_LIVE_SECRET_KEY || env.STRIPE_SECRET_KEY,
  };
  const supabaseConfigured = () =>
    Boolean(
      env.SUPABASE_URL &&
        env.SUPABASE_ANON_KEY &&
        env.SUPABASE_SERVICE_ROLE_KEY,
    );
  const nativeIdentity = () =>
    env.AUTH_PROVIDER === "netlify" ||
    (!supabaseConfigured() &&
      Boolean(
        env.NETLIFY ||
          env.NETLIFY_BLOBS_CONTEXT ||
          globalThis.netlifyBlobsContext,
      ));
  const configured = () => supabaseConfigured() || nativeIdentity();
  const isolatedTestDatabase = () => {
    try {
      return (
        /^[a-z]{20}$/.test(env.SUPABASE_TEST_PROJECT_REF || "") &&
        new URL(env.SUPABASE_URL).origin ===
          "https://" + env.SUPABASE_TEST_PROJECT_REF + ".supabase.co"
      );
    } catch {
      return false;
    }
  };
  const publishableKey = () => {
    const key = (env.STRIPE_PUBLISHABLE_KEY || "").trim();
    return key.startsWith("pk_" + stripeMode(env) + "_") ? key : null;
  };
  const isolatedLiveWallet = () => {
    try {
      return (
        env.SUPABASE_LIVE_WALLET_ENABLED === "true" &&
        /^[a-z]{20}$/.test(env.SUPABASE_LIVE_PROJECT_REF || "") &&
        new URL(env.SUPABASE_URL).origin ===
          "https://" + env.SUPABASE_LIVE_PROJECT_REF + ".supabase.co"
      );
    } catch {
      return false;
    }
  };
  const webhookSecret = () =>
    stripeMode(env) === "live"
      ? env.STRIPE_LIVE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET
      : env.STRIPE_WEBHOOK_SECRET;
  const walletCompatible = () =>
    nativeIdentity() ||
    (stripeMode(env) === "test"
      ? isolatedTestDatabase()
      : env.SUPABASE_LIVE_WALLET_ENABLED === "true"
        ? isolatedLiveWallet()
        : !env.SUPABASE_TEST_PROJECT_REF);
  const identityRoot = (req) =>
    (env.IDENTITY_URL || env.URL || new URL(req.url).origin).replace(
      /\/$/,
      "",
    ) + "/.netlify/identity";
  async function sb(path, { token, body, method = "POST" } = {}) {
    if (!supabaseConfigured()) throw new HttpError(503, "账户服务尚未配置。");
    const r = await fetchImpl(env.SUPABASE_URL.replace(/\/$/, "") + path, {
      method,
      headers: {
        apikey: token ? env.SUPABASE_ANON_KEY : env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${token || env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok)
      throw new HttpError(
        r.status === 401 ? 401 : 503,
        r.status === 401 ? "登录已过期，请重新登录。" : "账户服务暂时不可用。",
      );
    return r.json();
  }
  async function user(req) {
    const token =
      req.headers.get("authorization")?.match(/^Bearer (\S+)$/)?.[1] ||
      (nativeIdentity()
        ? req.headers.get("cookie")?.match(/(?:^|;\s*)nf_jwt=([^;]+)/)?.[1]
        : null);
    if (!token) throw new HttpError(401, "请先使用 Google 登录。");
    let u;
    if (nativeIdentity()) {
      const r = await fetchImpl(identityRoot(req) + "/user", {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(12000),
      });
      if (!r.ok) throw new HttpError(401, "登录已过期，请重新登录。");
      u = await r.json();
    } else u = await sb("/auth/v1/user", { token, method: "GET" });
    if (!u.id) throw new HttpError(401, "请重新登录。");
    return u;
  }
  const rpc = async (name, body) => {
    if (nativeIdentity()) {
      const { netlifyWallet } = await import("./netlify-wallet.mjs");
      return (await netlifyWallet({ mode: stripeMode(env) })).rpc(name, body);
    }
    if (
      [
        "storylove_wallet",
        "storylove_checkin",
        "storylove_purchase",
        "storylove_purchase_status",
      ].includes(name) &&
      !walletCompatible()
    )
      throw new HttpError(503, "数据库与付款环境不匹配，请配置独立测试项目。");
    if (
      stripeMode(env) === "live" &&
      isolatedLiveWallet() &&
      [
        "storylove_wallet",
        "storylove_checkin",
        "storylove_purchase",
        "storylove_purchase_status",
      ].includes(name)
    )
      name = name.replace("storylove_", "storylove_live_");
    return sb("/rest/v1/rpc/" + name, { body });
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
      let auth = null;
      if (nativeIdentity()) {
        try {
          const r = await fetchImpl(identityRoot(req) + "/settings", {
            signal: AbortSignal.timeout(8000),
          });
          if (r.ok) {
            const settings = await r.json();
            if (settings.external?.google)
              auth = { provider: "netlify", url: identityRoot(req) };
          }
        } catch {}
      } else if (supabaseConfigured())
        auth = {
          provider: "supabase",
          url: env.SUPABASE_URL,
          key: env.SUPABASE_ANON_KEY,
          emailLoginEnabled: env.AUTH_EMAIL_LOGIN_ENABLED === "true",
        };
      return response({
        auth,
        payments: Boolean(
          auth &&
            env.STRIPE_SECRET_KEY &&
            webhookSecret() &&
            Object.values(packs).every((p) => priceId(p, env)) &&
            (stripeMode(env) === "test" ||
              env.STRIPE_LIVE_ENABLED === "true") &&
            walletCompatible(),
        ),
        embeddedPayments: Boolean(publishableKey()),
        stripePublishableKey: publishableKey(),
        walletMode: stripeMode(env),
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
        throw new HttpError(503, "测试钱包隔离尚未配置。");
      const { pack, request_id } = input;
      const embedded = input.ui_mode === "elements";
      if (input.ui_mode && !embedded)
        throw new HttpError(400, "无效付款界面。");
      if (embedded && !publishableKey())
        throw new HttpError(503, "站内付款尚未配置。");
      const aid = (v) => typeof v === "string" && /^[a-f0-9-]{36}$/i.test(v);
      const metric = input.analytics || {};
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
        "/?checkout=success&session_id={CHECKOUT_SESSION_ID}#credits";
      const params = {
        mode: "payment",
        line_items: [{ price: priceId(p, env), quantity: 1 }],
        client_reference_id: u.id,
        metadata: {
          user_id: u.id,
          credits: String(pack),
          wallet_mode: stripeMode(env),
          analytics_flow: request_id,
        },
        integration_identifier: "storylove-elements-qrxkntva",
        adaptive_pricing: { enabled: false },
        managed_payments: { enabled: false },
        ...(embedded
          ? { ui_mode: "elements", return_url: returnUrl }
          : {
              success_url: returnUrl,
              cancel_url: base.origin + "/?checkout=cancelled#credits",
            }),
      };
      if (u.email) params.customer_email = u.email;
      if (aid(metric.session_id))
        params.metadata.analytics_session = metric.session_id;
      const s = await stripe(
        "checkout/sessions",
        params,
        "storylove:" +
          stripeMode(env) +
          ":" +
          u.id +
          ":" +
          pack +
          ":" +
          (embedded ? "elements:" : "") +
          request_id,
      );
      if (embedded) {
        if (!s.client_secret || !s.id?.startsWith("cs_"))
          throw new HttpError(502, "无法打开安全付款界面。");
        return response({ client_secret: s.client_secret, session_id: s.id });
      }
      if (!s.url?.startsWith("https://checkout.stripe.com/"))
        throw new HttpError(502, "无法打开安全付款页面。");
      return response({ url: s.url });
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
      if (s.metadata?.analytics_session) {
        const { recordPurchase } = await import("./analytics.mjs");
        await recordPurchase(
          {
            sessionId: s.id,
            session_id: s.metadata.analytics_session,
            flow_id: s.metadata.analytics_flow,
            credits,
            test: !s.livemode,
          },
          env,
        );
      }
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
