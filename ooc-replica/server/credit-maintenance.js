// This maintenance path cannot delete financial records or extend any TTL.
export const cacheCollections = (mode) => {
  if (!["test", "live"].includes(mode)) throw Error("Invalid mode");
  return [
    `replica-credit-responses-${mode}`,
    `replica-credit-response-parts-${mode}`,
  ];
};
export async function cleanCreditCache(
  db,
  mode,
  { now = Date.now(), apply = false, limit = 100 } = {},
) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 400)
    throw Error("Invalid cleanup limit");
  const result = {
    mode,
    apply,
    cutoff: new Date(now).toISOString(),
    collections: {},
  };
  for (const name of cacheCollections(mode)) {
    const page = await db
      .collection(name)
      .where("expiresAt", "<=", new Date(now))
      .limit(limit)
      .get();
    result.collections[name] = {
      expired: page.size,
      deleted: 0,
      morePossible: page.size === limit,
    };
    if (apply && page.size) {
      const batch = db.batch();
      for (const doc of page.docs)
        batch.delete(
          doc.ref,
          doc.updateTime ? { lastUpdateTime: doc.updateTime } : undefined,
        );
      await batch.commit();
      result.collections[name].deleted = page.size;
    }
  }
  return result;
}
