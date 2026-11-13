import assert from "node:assert/strict";
// Serial commit model. Also rejects reads after writes, like Firestore transactions.
export function database() {
  const rows = new Map();
  let queue = Promise.resolve();
  const ref = (key) => ({
    key,
    id: key.split("/").at(-1),
    async get() {
      const value = rows.get(key);
      return {
        exists: value !== undefined,
        data: () => structuredClone(value),
      };
    },
  });
  return {
    rows,
    collection: (name) => ({ doc: (id) => ref(name + "/" + id) }),
    runTransaction(fn) {
      const job = queue.then(async () => {
        const staged = new Map();
        let writing = false;
        const result = await fn({
          get: (r) => {
            assert.equal(
              writing,
              false,
              "Firestore reads must precede all writes",
            );
            return r.get();
          },
          set: (r, v) => {
            writing = true;
            staged.set(r.key, structuredClone(v));
          },
          create: (r, v) => {
            writing = true;
            assert.equal(rows.has(r.key) || staged.has(r.key), false);
            staged.set(r.key, structuredClone(v));
          },
        });
        for (const [k, v] of staged) rows.set(k, v);
        return result;
      });
      queue = job.catch(() => {});
      return job;
    },
  };
}
