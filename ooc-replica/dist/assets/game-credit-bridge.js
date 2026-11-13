import { createCreditClient } from "./credit-client.js";
import { loadPublicConfig } from "./public-config.js";
import { observeCreditResponse } from "./credit-fetch.js";
export function attachGameCredits(frame, account, { lang = "zh" } = {}) {
  const client = createCreditClient(account);
  let active = true,
    enabled = false,
    configuration,
    installed = null;
  const zh = lang === "zh",
    bar = frame.ownerDocument.createElement("aside");
  bar.dataset.gameCredits = "";
  bar.dataset.noI18n = "";
  bar.style.cssText =
    "padding:10px 16px;background:#26202e;color:#eee;border-bottom:1px solid #60526a;font:13px system-ui;line-height:1.6";
  const label = frame.ownerDocument.createElement("label"),
    check = frame.ownerDocument.createElement("input"),
    copy = frame.ownerDocument.createElement("span"),
    status = frame.ownerDocument.createElement("span");
  check.type = "checkbox";
  label.append(check, copy);
  bar.append(label, status);
  bar.hidden = true;
  frame.before(bar);
  check.onchange = () => {
    enabled = check.checked;
  };
  const ready = loadPublicConfig()
    .then((cfg) => {
      configuration = cfg;
      if (!active || !cfg.billing?.enabled) return;
      bar.hidden = false;
      copy.textContent = zh
        ? ` 开启可选 AI：意图解析 ${cfg.billing.prices.gameUnderstand} 点/次，生成回复 ${cfg.billing.prices.gameExpress} 点/次（经典自由发言最多两阶段）；编排内容免费。`
        : ` Enable optional AI: intent ${cfg.billing.prices.gameUnderstand} credit, reply ${cfg.billing.prices.gameExpress} credit per stage (classic free input may use both). Authored story is free.`;
    })
    .catch(() => {});
  async function request(input, init = {}, original) {
    const url = new URL(
      typeof input === "string" ? input : input.url,
      location.href,
    );
    if (
      url.origin !== location.origin ||
      !["/api/sanguo", "/api/three-kingdoms", "/api/book-campaign"].includes(
        url.pathname,
      )
    )
      return original(input, init);
    await ready;
    if (!configuration?.billing?.enabled) return original(input, init);
    if (!active || !frame.isConnected) throw Error("Game view closed");
    if (!enabled) {
      status.textContent = zh
        ? " 使用编排内容；开启 AI 后按标价生成。"
        : " Using authored content. Enable AI to generate at the displayed price.";
      throw Object.assign(Error(status.textContent), {
        code: "AI_OPT_IN_REQUIRED",
      });
    }
    const body = JSON.parse(init.body),
      payment = await client.prepare(body, { route: "game" });
    if (!active || !frame.isConnected || init.signal?.aborted)
      throw new DOMException("Cancelled", "AbortError");
    status.textContent = zh
      ? " 正在生成，成功后结算。"
      : " Generating; charged on success.";
    try {
      return await observeCreditResponse(
        await original(input, {
          ...init,
          headers: { ...init.headers, ...payment?.headers },
          body: JSON.stringify({
            ...body,
            ...(payment ? { billing: payment.billing } : {}),
          }),
        }),
        payment,
        state => {
          if (!active || !frame.isConnected || !payment?.current()) return;
          status.textContent = state === 'settled'
            ? (zh ? ` 已完成，本阶段结算 ${payment.billing.amount} 点。` : ` Completed; ${payment.billing.amount} credits charged for this stage.`)
            : state === 'released'
              ? (zh ? ' 本次未结算，预留积分已释放。' : ' Not charged; reserved credits released.')
              : (zh ? ' 生成未完成或结算待核对，请查看积分记录后重试。' : ' Generation or settlement unconfirmed; check your credit history before retrying.');
        },
      );
    } catch (e) {
      status.textContent = e.message;
      throw e;
    }
  }
  function install() {
    if (!active) return;
    const target = frame.contentWindow;
    if (
      !target ||
      typeof target.fetch !== "function" ||
      installed === target.fetch
    )
      return;
    const original = target.fetch.bind(target);
    const wrapped = (input, init) => request(input, init, original);
    target.fetch = wrapped;
    installed = wrapped;
  }
  frame.addEventListener("load", install);
  return {
    install,
    dispose() {
      active = false;
      frame.removeEventListener("load", install);
      bar.remove();
    },
  };
}
