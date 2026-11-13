import { createCredits, digest } from "./credits.js";
import { creditPolicy, quote, fail, CreditError } from "./credit-policy.js";
import { platform, HttpError } from "./payments.js";
import { firebaseServices } from "./firebase-admin.js";
import { stripeMode } from "./credit-packs.mjs";
// Validation and pricing happen before a model is contacted. No user text in the ledger.
export function createChatBilling({
  env = process.env,
  authenticate = (req) =>
    platform.user(
      new Request(`https://${req.headers.host}/api/chat`, {
        headers: req.headers,
      }),
    ),
  services = () => firebaseServices(env),
} = {}) {
  return async (req, body, route = "chat") => {
    const policy = creditPolicy(env);
    if (!policy.enabled) return null;
    const q = quote(body, env, route);
    if (q.amount === 0)
      fail(
        409,
        "INCLUDED_SUGGESTIONS",
        "推荐操作使用免费本地选项，不单独调用模型。",
      );
    const effective = {
      ...env,
      STRIPE_SECRET_KEY:
        (env.VERCEL_ENV !== "preview" && env.STRIPE_LIVE_SECRET_KEY) ||
        env.STRIPE_SECRET_KEY,
    };
    if (stripeMode(effective) !== q.mode)
      fail(503, "BILLING_CONFIGURATION", "积分与支付环境不一致。");
    if (
      body.billing?.version !== q.version ||
      body.billing?.amount !== q.amount
    )
      fail(409, "PRICE_CHANGED", "价格已更新，请核对价格后重新发送。");
    const u = await authenticate(req),
      store = createCredits(services().db, q.mode, {
        holdSeconds: q.holdSeconds,
      });
    const { billing, ...input } = body;
    const fingerprint = digest(JSON.stringify(input));
    let reservation;
    try {
      reservation = await store.reserve(u.id, {
        id: billing.id,
        fingerprint,
        amount: q.amount,
        sku: q.sku,
        version: q.version,
      });
    } catch (e) {
      if (e.code === "OPERATION_SETTLED") {
        const previous = await store.status(u.id, billing.id);
        if (previous.reply) return { replay: previous };
      }
      throw e;
    }
    let finished;
    return {
      reservation,
      async finish(success, reply) {
        if (finished) return finished;
        const result = await store.finish(u.id, billing.id, success, reply);
        finished = result;
        return result;
      },
    };
  };
}
export const beginChatBilling = createChatBilling();
export function billingError(error) {
  const known=error instanceof CreditError;
  const auth=error instanceof HttpError;
  return {
    status:known||auth?error.status:[401,403].includes(error.status)?error.status:503,
    code:known?error.code:'BILLING_UNAVAILABLE',
    error:known||auth?error.message:'积分暂时无法核对，请稍后重试。',
    retryable:false,
  };
}
