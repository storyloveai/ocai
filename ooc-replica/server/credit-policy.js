// Product prices are derived by the server, never supplied by a model/browser.
export const PRICE_VERSION = "credits-2026-11-12-v1";
export class CreditError extends Error {
  constructor(status, code, message) {
    super(message);
    Object.assign(this, { status, code });
  }
}
export const fail = (status, code, message) => {
  throw new CreditError(status, code, message);
};
export function creditPolicy(env = process.env) {
  const mode = env.CREDIT_BILLING_MODE || "off";
  const invalid =
    !["off", "test", "live"].includes(mode) ||
    (mode === "live" &&
      (env.VERCEL_ENV !== "production" || env.CREDIT_LIVE_ENABLED !== "true"));
  return {
    mode,
    enabled: mode !== "off",
    ready: !invalid,
    version: PRICE_VERSION,
    prices: { short: 1, standard: 1, long: 2 },
    checkinCredits: mode === "off" ? 100 : 3,
    checkinDays: 7,
    holdSeconds: 600,
    giftFirst: true,
  };
}
export function quote(body, env = process.env, route = "chat") {
  const policy = creditPolicy(env);
  if (!policy.ready)
    fail(503, "BILLING_CONFIGURATION", "积分配置尚未就绪，请稍后重试。");
  // Clients without a visible quote cannot become a free paid-model bypass.
  if (route !== "chat" || body?.task === "author")
    fail(
      503,
      "BILLING_NOT_AVAILABLE",
      "此 AI 功能正在接入积分报价，请先使用角色聊天。",
    );
  if (body?.task === "suggestions")
    return { ...policy, sku: "suggestions", amount: 0 };
  const length = ["short", "standard", "long"].includes(
    String(body?.outputLength).toLowerCase(),
  )
    ? String(body.outputLength).toLowerCase()
    : "standard";
  return { ...policy, sku: "chat." + length, amount: policy.prices[length] };
}
