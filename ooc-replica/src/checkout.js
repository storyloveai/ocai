import { loadStripe } from "@stripe/stripe-js/pure/index.js";

// Card/wallet data stays inside Stripe-owned Elements. Only session IDs leave here.
export async function mountCheckout({
  root,
  publishableKey,
  clientSecret,
  onComplete,
  load = loadStripe,
  signal,
}) {
  let disposed = false,
    confirming = false,
    elements = [];
  const form = root.querySelector("form"),
    button = root.querySelector('[type="submit"]');
  const errorBox = root.querySelector("[data-payment-error]");
  const status = root.querySelector("[data-payment-status]");
  const wallets = root.querySelector("[data-wallet-section]");
  const separator = root.querySelector("[data-wallet-separator]");
  const message = (error) => {
    if (!disposed)
      errorBox.textContent = error?.message || "付款暂时不可用，请稍后重试。";
  };
  const dispose = () => {
    disposed = true;
    form.removeEventListener("submit", submit);
    signal?.removeEventListener("abort", dispose);
    elements.forEach((element) => element.destroy());
    elements = [];
  };
  const submit = (event) => {
    event.preventDefault();
    void confirm();
  };
  let actions,
    paymentLoadFailed = false;
  async function confirm(expressEvent) {
    if (disposed || confirming || !actions) {
      expressEvent?.paymentFailed?.();
      return;
    }
    confirming = true;
    button.disabled = true;
    errorBox.textContent = "";
    status.textContent = "正在确认付款…";
    try {
      const result = await actions.confirm({
        redirect: "if_required",
        ...(expressEvent ? { expressCheckoutConfirmEvent: expressEvent } : {}),
      });
      if (disposed) return;
      if (result.type === "error" || result.error) {
        message(result.error);
        expressEvent?.paymentFailed?.();
      } else {
        // Successful client confirmation is NOT fulfillment; caller queries webhook status.
        dispose();
        onComplete(result.session.id);
        return;
      }
    } catch (error) {
      message(error);
      expressEvent?.paymentFailed?.();
    } finally {
      confirming = false;
      if (!disposed) {
        button.disabled = paymentLoadFailed;
        status.textContent = "";
      }
    }
  }
  signal?.addEventListener("abort", dispose, { once: true });
  if (signal?.aborted) {
    dispose();
    return dispose;
  }
  try {
    const stripe = await load(publishableKey);
    if (disposed) return dispose;
    if (!stripe) throw Error("安全付款组件加载失败，请检查网络后重试。");
    const checkout = stripe.initCheckoutElementsSdk({
      clientSecret,
      elementsOptions: {
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#a8e7c4",
            colorBackground: "#15221e",
            colorText: "#f4faf7",
            colorDanger: "#ffaaaa",
            borderRadius: "12px",
            fontFamily: "system-ui, sans-serif",
          },
        },
      },
    });
    const express = checkout.createExpressCheckoutElement({
      buttonHeight: 48,
      layout: { maxColumns: 3, maxRows: 2, overflow: "auto" },
      // Stripe requires this for non-Safari desktop/cross-device Apple Pay.
      // It still checks platform/account/domain eligibility; we never draw our own button.
      paymentMethods: { applePay: "always", googlePay: "auto" },
    });
    const payment = checkout.createPaymentElement({ layout: "accordion" });
    elements = [express, payment];
    express.on("ready", ({ availablePaymentMethods }) => {
      if (disposed) return;
      const available = Boolean(
        availablePaymentMethods &&
          Object.values(availablePaymentMethods).some(Boolean),
      );
      // Keep mounted container measurable; hide its section only after Stripe reports availability.
      wallets.hidden = !available;
      separator.hidden = !available;
    });
    express.on("confirm", (event) => {
      void confirm(event);
    });
    express.on("loaderror", () => {
      wallets.hidden = true;
      separator.hidden = true;
    });
    payment.on("loaderror", ({ error }) => {
      paymentLoadFailed = true;
      message(error);
      button.disabled = true;
    });
    express.mount(root.querySelector("[data-express-element]"));
    payment.mount(root.querySelector("[data-payment-element]"));
    const loaded = await checkout.loadActions();
    if (disposed) return dispose;
    if (loaded.type === "error") throw Error(loaded.error.message);
    actions = loaded.actions;
    form.addEventListener("submit", submit);
    status.textContent = "";
    button.disabled = paymentLoadFailed;
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
