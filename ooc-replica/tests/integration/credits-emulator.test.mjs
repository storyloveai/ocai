// Real Firebase SDK / emulator protocol. Demo project, loopback hosts, no secrets.
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createCredits, digest } from "../../server/credits.js";
import { createPlatform } from "../../server/payments.js";
import { PRICE_VERSION } from "../../server/credit-policy.js";
const project = "demo-storydate-credits";
for (const key of ["FIREBASE_AUTH_EMULATOR_HOST", "FIRESTORE_EMULATOR_HOST"])
  assert.match(
    process.env[key] || "",
    /^127\.0\.0\.1:\d+$/,
    "Emulator must only use loopback",
  );
assert.equal(process.env.GCLOUD_PROJECT, project);
assert.equal(process.env.VERCEL_ENV, undefined);
const app = initializeApp({ projectId: project }, "emulator-" + randomUUID()),
  auth = getAuth(app),
  db = getFirestore(app);
const env = {
  FIREBASE_PROJECT_ID: project,
  FIREBASE_API_KEY: "emulator-public",
  FIREBASE_APP_ID: "emulator-app",
  FIREBASE_AUTH_DOMAIN: "localhost",
  FIREBASE_CLIENT_EMAIL: "not-used@emulator.invalid",
  FIREBASE_PRIVATE_KEY: "not-used-emulator",
  STRIPE_SECRET_KEY: "sk_test_emulator",
  CREDIT_BILLING_MODE: "test",
};
const platform = createPlatform({ env, services: () => ({ db, auth }) });
async function signup() {
  const r = await fetch(
    "http://" +
      process.env.FIREBASE_AUTH_EMULATOR_HOST +
      "/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-public",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: randomUUID() + "@example.invalid",
        password: "Emulator-only-password",
        returnSecureToken: true,
      }),
    },
  );
  assert.equal(r.status, 200);
  const d = await r.json();
  return { uid: d.localId, token: d.idToken };
}
const req = (token, body) =>
  new Request("https://emulator.invalid/api/wallet", {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + token,
      Origin: "https://emulator.invalid",
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
test("SDK integration: real auth verification, atomic Firestore transactions, cross-account rules and response recovery", async () => {
  try {
    const [alice, bob] = await Promise.all([signup(), signup()]);
    const store = createCredits(db, "test");
    await store.checkin(alice.uid);
    const payloads = Array.from({ length: 4 }, () => ({
      id: randomUUID(),
      fingerprint: digest("request"),
      amount: 1,
      sku: "chat.standard",
      version: PRICE_VERSION,
    }));
    const results = await Promise.allSettled(
      payloads.map((p) => store.reserve(alice.uid, p)),
    );
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 3);
    assert.equal((await store.read(alice.uid)).balance, 0);
    assert.equal((await store.read(alice.uid)).reserved, 3);
    const chosen = payloads[results.findIndex((r) => r.status === "fulfilled")];
    const text = "Recovery image result " + "a".repeat(700000);
    await store.finish(alice.uid, chosen.id, true, text);
    const recovered = await (
      await platform.wallet(
        req(alice.token, { action: "status", id: chosen.id }),
      )
    ).json();
    assert.equal(recovered.reply, text);
    const denied = await platform.wallet(
      req(bob.token, { action: "status", id: chosen.id }),
    );
    assert.equal(denied.status, 404);
    const direct = await fetch(
      "http://" +
        process.env.FIRESTORE_EMULATOR_HOST +
        "/v1/projects/" +
        project +
        "/databases/(default)/documents/replica-wallets-test/" +
        digest(alice.uid),
      { headers: { Authorization: "Bearer " + alice.token } },
    );
    assert.equal(direct.status, 403);
    const w = await (await platform.wallet(req(bob.token))).json();
    assert.equal(w.balance, 0);
    await auth.updateUser(bob.uid, { disabled: true });
    assert.equal((await platform.wallet(req(bob.token))).status, 401);
    assert.equal((await createCredits(db, "live").read(alice.uid)).balance, 0);
  } finally {
    await db.terminate();
    await deleteApp(app);
  }
});
