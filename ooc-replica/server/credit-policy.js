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
    prices: {
      short: 1,
      standard: 1,
      long: 2,
      author: 3,
      authorLong: 8,
      authorCatalog: 20,
      image: 80,
      gameUnderstand: 1,
      gameExpress: 1,
    },
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
  if (route === "image")
    return { ...policy, sku: "image.cover", amount: policy.prices.image };
  if (route === "game") {
    if (!["understand", "express"].includes(body?.phase))
      fail(400, "INVALID_QUOTE", "无效游戏阶段。");
    return {
      ...policy,
      sku: "game." + body.phase,
      amount:
        body.phase === "understand"
          ? policy.prices.gameUnderstand
          : policy.prices.gameExpress,
    };
  }
  if (route !== "chat") fail(400, "INVALID_QUOTE", "未知生成类型。");
  if (body?.task === "author") {
    const kind =
      body.format === "catalog"
        ? "catalog"
        : body.field === "details"
          ? "long"
          : "field";
    return {
      ...policy,
      sku: "author." + kind,
      amount:
        kind === "catalog"
          ? policy.prices.authorCatalog
          : kind === "long"
            ? policy.prices.authorLong
            : policy.prices.author,
    };
  }
  if (body?.task === "suggestions")
    return { ...policy, sku: "suggestions", amount: 0 };
  const length = ["short", "standard", "long"].includes(
    String(body?.outputLength).toLowerCase(),
  )
    ? String(body.outputLength).toLowerCase()
    : "standard";
  return { ...policy, sku: "chat." + length, amount: policy.prices[length] };
}
