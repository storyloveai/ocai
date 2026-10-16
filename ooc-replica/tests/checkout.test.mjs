import test from "node:test";
import assert from "node:assert/strict";
import { mountCheckout } from "../src/checkout.js";
function harness(
  confirm = async () => ({ type: "success", session: { id: "cs_fixture" } }),
) {
  const events = {},
    nodes = {},
    destroyed = [],
    options = {};
  let calls = 0,
    completed = [];
  for (const selector of [
    "form",
    '[type="submit"]',
    "[data-payment-error]",
    "[data-payment-status]",
    "[data-wallet-section]",
    "[data-wallet-separator]",
    "[data-express-element]",
    "[data-payment-element]",
  ])
    nodes[selector] = {
      textContent: "",
      hidden: false,
      disabled: true,
      addEventListener(name, fn) {
        events[name] = fn;
      },
      removeEventListener(name) {
        delete events[name];
      },
    };
  const element = (name) => ({
    on(type, fn) {
      events[name + ":" + type] = fn;
    },
    mount(node) {
      assert.ok(node);
    },
    destroy() {
      destroyed.push(name);
    },
  });
  const checkout = {
    createExpressCheckoutElement(o) {
      options.express = o;
      return element("express");
    },
    createPaymentElement() {
      return element("payment");
    },
    async loadActions() {
      return {
        type: "success",
        actions: {
          confirm: async (o) => {
            calls++;
            options.confirm = o;
            return confirm(o);
          },
        },
      };
    },
  };
  const controller = new AbortController();
  const args = {
    root: { querySelector: (s) => nodes[s] },
    publishableKey: "pk_test_fixture",
    clientSecret: "cs_fixture_secret",
    signal: controller.signal,
    load: async () => ({
      initCheckoutElementsSdk(o) {
        options.init = o;
        return checkout;
      },
    }),
    onComplete: (id) => completed.push(id),
  };
  return {
    args,
    events,
    nodes,
    options,
    destroyed,
    controller,
    completed,
    calls: () => calls,
  };
}
test("wallet availability comes from Stripe and layout permits horizontal rows", async () => {
  const h = harness();
  await mountCheckout(h.args);
  h.events["express:ready"]({ availablePaymentMethods: undefined });
  assert.equal(h.nodes["[data-wallet-section]"].hidden, true);
  h.events["express:ready"]({ availablePaymentMethods: { applePay: true } });
  assert.equal(h.nodes["[data-wallet-section]"].hidden, false);
  assert.equal(h.nodes["[data-wallet-separator]"].hidden, false);
  assert.equal(h.options.express.paymentMethods.googlePay, "auto");
  assert.equal(h.options.express.paymentMethods.applePay, "always");
  assert.equal(h.options.express.layout.maxColumns, 3);
});
test("card confirmation ignores duplicate submit and reports session for webhook status only", async () => {
  let release;
  const h = harness(() => new Promise((r) => (release = r)));
  await mountCheckout(h.args);
  h.events.submit({ preventDefault() {} });
  h.events.submit({ preventDefault() {} });
  assert.equal(h.calls(), 1);
  assert.equal(h.nodes['[type="submit"]'].disabled, true);
  release({ type: "success", session: { id: "cs_fixture" } });
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(h.completed, ["cs_fixture"]);
  assert.equal(h.options.confirm.redirect, "if_required");
  assert.deepEqual(h.destroyed, ["express", "payment"]);
});
test("wallet confirmation passes original SDK event; failure stays in form and permits retry", async () => {
  const h = harness(async () => ({
    type: "error",
    error: { message: "Card declined" },
  }));
  await mountCheckout(h.args);
  let failures = 0;
  const event = {
    paymentFailed() {
      failures++;
    },
  };
  h.events["express:confirm"](event);
  await new Promise((r) => setImmediate(r));
  assert.equal(h.options.confirm.expressCheckoutConfirmEvent, event);
  assert.equal(failures, 1);
  assert.equal(h.nodes["[data-payment-error]"].textContent, "Card declined");
  assert.equal(h.nodes['[type="submit"]'].disabled, false);
  assert.deepEqual(h.completed, []);
});
test("closing payment during SDK loading prevents stale Elements from mounting", async () => {
  const h = harness();
  let release;
  h.args.load = () => new Promise((r) => (release = r));
  const pending = mountCheckout(h.args);
  h.controller.abort();
  release(null);
  await pending;
  assert.equal(h.calls(), 0);
  assert.deepEqual(h.completed, []);
});
test("closing during confirmation does not report client success or leave Elements behind", async () => {
  let release;
  const h = harness(() => new Promise((r) => (release = r)));
  await mountCheckout(h.args);
  h.events.submit({ preventDefault() {} });
  h.controller.abort();
  release({ type: "success", session: { id: "cs_fixture" } });
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(h.completed, []);
  assert.deepEqual(h.destroyed, ["express", "payment"]);
});
