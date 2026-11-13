// Operator tool. Dry-run does not initialize Firebase or inspect credentials.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createCredits, digest } from "../server/credits.js";
export async function run(
  args,
  {
    env = process.env,
    read = readFile,
    services = async () =>
      (await import("../server/firebase-admin.js")).firebaseServices(env),
    log = console.log,
  } = {},
) {
  const file = args.find((a) => a.startsWith("--file="))?.slice(7),
    mode = args.find((a) => a.startsWith("--mode="))?.slice(7) || "test",
    apply = args.includes("--apply");
  if (!file || !["test", "live"].includes(mode))
    throw Error(
      "Use --file=/private/path/campaign.local.json --mode=test [--apply]",
    );
  const input = JSON.parse(await read(file, "utf8"));
  const users = input.uids;
  if (
    !Array.isArray(users) ||
    !users.length ||
    users.length > 5000 ||
    users.some((u) => typeof u !== "string" || !u || u.length > 128)
  )
    throw Error("uids must contain 1–5000 Firebase UIDs");
  const unique = [...new Set(users)],
    campaign = {
      id: input.id,
      amount: input.amount,
      budget: input.budget,
      recipients: unique.map(digest),
      startsAt: Date.parse(input.startsAt),
      endsAt: Date.parse(input.endsAt),
      expiresAt: Date.parse(input.expiresAt),
    };
  // Reuse authoritative validation on an isolated fake transaction; no remote reads.
  const validationDb = {
    collection: () => ({ doc: () => ({}) }),
    runTransaction: async (fn) =>
      fn({ get: async () => ({ exists: false }), create() {} }),
  };
  await createCredits(validationDb, mode).registerCampaign(campaign);
  const summary = {
    dryRun: !apply,
    mode,
    campaign: campaign.id,
    recipientCount: unique.length,
    creditsEach: campaign.amount,
    budget: campaign.budget,
    maximumIssue: Math.min(campaign.budget, unique.length * campaign.amount),
    expiresAt: input.expiresAt,
  };
  log(JSON.stringify(summary));
  if (!apply) return summary;
  if (
    mode === "live" &&
    (!args.includes("--allow-live") || env.CREDIT_LIVE_ENABLED !== "true")
  )
    throw Error(
      "Live grant requires separate approval and --allow-live with CREDIT_LIVE_ENABLED=true",
    );
  const { db } = await services(),
    store = createCredits(db, mode);
  await store.registerCampaign(campaign);
  let granted = 0,
    alreadyClaimed = 0,
    failed = 0;
  for (const uid of unique) {
    try {
      const r = await store.grant(uid, campaign.id);
      if (r.claimed) granted++;
      else alreadyClaimed++;
    } catch (e) {
      failed++;
      log(
        JSON.stringify({
          recipient: digest(uid).slice(0, 12),
          code: e.code || "GRANT_FAILED",
        }),
      );
    }
  }
  const result = { granted, alreadyClaimed, failed };
  log(JSON.stringify(result));
  if (failed) process.exitCode = 1;
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  run(process.argv.slice(2)).catch(() => {
    console.error(
      "Campaign rejected. Check policy, environment and approved access; no secret values are printed.",
    );
    process.exitCode = 1;
  });
