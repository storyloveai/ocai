import { pathToFileURL } from "node:url";
import {
  cacheCollections,
  cleanCreditCache,
} from "../server/credit-maintenance.js";
export async function run(
  args,
  {
    services = async () =>
      (await import("../server/firebase-admin.js")).firebaseServices(),
    log = console.log,
  } = {},
) {
  const mode = args.find((a) => a.startsWith("--mode="))?.slice(7) || "test",
    apply = args.includes("--apply");
  const collections = cacheCollections(mode);
  if (!args.includes("--scan") && !apply) {
    const plan = {
      dryRun: true,
      mode,
      ttlField: "expiresAt",
      collections,
      note: "Enable Firestore TTL for these collection groups. No credentials or remote services accessed.",
    };
    log(JSON.stringify(plan));
    return plan;
  }
  if (apply && mode === "live" && !args.includes("--allow-live"))
    throw Error("Live cleanup requires separate approval and --allow-live");
  const { db } = await services(),
    result = await cleanCreditCache(db, mode, { apply });
  log(JSON.stringify(result));
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  run(process.argv.slice(2)).catch(() => {
    console.error("Cache maintenance rejected; no credential details printed.");
    process.exitCode = 1;
  });
