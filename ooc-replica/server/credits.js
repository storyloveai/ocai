import { createHash, randomUUID } from "node:crypto";
import { fail, PRICE_VERSION } from "./credit-policy.js";
export const digest = (v) => createHash("sha256").update(v).digest("hex");
const integer = (v, max = 1_000_000) =>
  Number.isSafeInteger(v) && v > 0 && v <= max;
const day = (now) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
const iso = (now) => new Date(now).toISOString();
const validId = (v) =>
  typeof v === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(v);
const uidKey = (uid) => {
  if (typeof uid !== "string" || !uid || uid.length > 128)
    throw Error("Invalid UID");
  return digest(uid);
};
const totals = (lots) =>
  lots.reduce(
    (r, l) => {
      r[l.source] += l.remaining;
      return r;
    },
    { grant: 0, purchased: 0, legacy: 0 },
  );
function record(data, entry, now) {
  (data._events ??= []).push({ ...entry, at: iso(now) });
  data.ledger = [{ ...entry, at: iso(now) }, ...(data.ledger || [])].slice(
    0,
    50,
  );
}
function restore(data, hold, now) {
  for (const a of hold.allocations) {
    if (a.expiresAt && a.expiresAt <= now) {
      data.stats.expired += a.amount;
      record(
        data,
        {
          type: "expiry",
          amount: -a.amount,
          id: a.id,
          source: a.source,
          reason: "expired_during_hold",
        },
        now,
      );
      continue;
    }
    let lot = data.lots.find((l) => l.id === a.id);
    if (!lot) {
      lot = { ...a, remaining: 0 };
      delete lot.amount;
      data.lots.push(lot);
    }
    lot.remaining += a.amount;
  }
  data.stats.released += hold.amount;
}
function normalize(raw, now) {
  const data = structuredClone(
    raw || { balance: 0, checkedDay: null, ledger: [] },
  );
  if (data.schema !== 2) {
    if (!Number.isSafeInteger(data.balance) || data.balance < 0)
      throw Error("Invalid legacy balance");
    data.schema = 2;
    data.lots = data.balance
      ? [
          {
            id: "legacy",
            source: "legacy",
            remaining: data.balance,
            expiresAt: null,
          },
        ]
      : [];
    if (data.balance)
      record(
        data,
        {
          type: "migration",
          amount: data.balance,
          id: "legacy",
          source: "legacy",
        },
        now,
      );
    data.holds = {};
    data.stats = {
      issued: { grant: 0, purchased: 0, legacy: data.balance },
      spent: { grant: 0, purchased: 0, legacy: 0 },
      released: 0,
      expired: 0,
    };
  }
  // During a rolling deploy an older wallet writer can increment the scalar
  // balance without adding a lot. Preserve that credit as unclassified legacy.
  const lotTotal = data.lots.reduce((sum, l) => sum + l.remaining, 0);
  if (data.balance !== lotTotal) {
    if (!Number.isSafeInteger(data.balance) || data.balance < lotTotal)
      throw Error("Wallet reconciliation required");
    const delta = data.balance - lotTotal;
    add(data, { id: "legacy", source: "legacy", amount: delta }, now);
    data.balance -= delta; // add() also changes the scalar; the final sum is authoritative.
  }
  for (const [id, hold] of Object.entries(data.holds))
    if (hold.until <= now) {
      restore(data, hold, now);
      delete data.holds[id];
      record(
        data,
        { type: "release", amount: hold.amount, id, reason: "lease_expired" },
        now,
      );
    }
  for (const lot of data.lots)
    if (lot.expiresAt && lot.expiresAt <= now && lot.remaining) {
      record(
        data,
        {
          type: "expiry",
          amount: -lot.remaining,
          id: lot.id,
          source: lot.source,
        },
        now,
      );
      data.stats.expired += lot.remaining;
      lot.remaining = 0;
    }
  data.lots = data.lots.filter((l) => l.remaining > 0);
  data.balance = data.lots.reduce((sum, l) => sum + l.remaining, 0);
  if (!Number.isSafeInteger(data.balance) || data.balance > 1_000_000_000)
    throw Error("Invalid balance");
  return data;
}
function view(data, now) {
  return {
    schema: 2,
    balance: data.balance,
    available: data.balance,
    reserved: Object.values(data.holds).reduce((n, h) => n + h.amount, 0),
    breakdown: totals(data.lots),
    checked: data.checkedDay === day(now),
    ledger: data.ledger,
    stats: data.stats,
    nextExpiry:
      data.lots
        .filter((l) => l.expiresAt)
        .sort((a, b) => a.expiresAt - b.expiresAt)[0]?.expiresAt || null,
  };
}
function add(data, { id, source, amount, expiresAt = null }, now) {
  const lot = data.lots.find((l) => l.id === id);
  if (lot) lot.remaining += amount;
  else {
    if (data.lots.length >= 128)
      fail(409, "TOO_MANY_GRANTS", "请先使用已有活动积分。");
    data.lots.push({ id, source, remaining: amount, expiresAt });
  }
  data.stats.issued[source] += amount;
  data.balance += amount;
  record(
    data,
    {
      id,
      source,
      type: source === "purchased" ? "purchase" : "grant",
      amount,
      expiresAt,
    },
    now,
  );
}
export function createCredits(
  db,
  mode,
  { clock = Date.now, holdSeconds = 600 } = {},
) {
  if (!["test", "live"].includes(mode)) throw Error("Invalid credits mode");
  const wallets = db.collection(`replica-wallets-${mode}`),
    operations = db.collection(`replica-credit-ops-${mode}`),
    receipts = db.collection(`replica-receipts-${mode}`),
    campaigns = db.collection(`replica-credit-campaigns-${mode}`),
    responses = db.collection(`replica-credit-responses-${mode}`),
    events = db.collection(`replica-credit-ledger-${mode}`);
  const ref = (uid) => wallets.doc(uidKey(uid));
  const opRef = (uid, id) => {
    if (
      typeof id !== "string" ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        id,
      )
    )
      fail(400, "INVALID_OPERATION", "无效请求编号。");
    return operations.doc(digest(uidKey(uid) + ":" + id));
  };
  const mutate = async (uid, fn) =>
    db.runTransaction(async (tx) => {
      const r = ref(uid),
        now = clock(),
        s = await tx.get(r),
        data = normalize(s.exists ? s.data() : null, now);
      const result = await fn(tx, data, now);
      const entries = data._events || [];
      delete data._events;
      for (const entry of entries)
        tx.create(events.doc(randomUUID()), { ...entry, uid });
      tx.set(r, {
        ...data,
        uid,
        balance: data.lots.reduce((n, l) => n + l.remaining, 0),
      });
      return result ?? view(data, now);
    });
  return {
    read: (uid) => mutate(uid, () => {}),
    async purchase(uid, session, amount) {
      if (
        !/^cs_[\w]+$/.test(session || "") ||
        ![200, 2500, 5000].includes(amount)
      )
        throw Error("Invalid purchase");
      return mutate(uid, async (tx, data, now) => {
        const r = receipts.doc(session),
          s = await tx.get(r);
        if (s.exists) {
          if (s.data().uid !== uid || s.data().credits !== amount)
            throw Error("Receipt conflict");
          return;
        }
        add(data, { id: "purchased", source: "purchased", amount }, now);
        tx.create(r, { uid, credits: amount, at: iso(now) });
      });
    },
    async purchased(uid, session) {
      uidKey(uid);
      if (!/^cs_[\w]+$/.test(session || "")) throw Error("Invalid session");
      const s = await receipts.doc(session).get();
      return s.exists && s.data().uid === uid;
    },
    async checkin(uid, { amount = 3, days = 7 } = {}) {
      if (!integer(amount, 100) || !integer(days, 365))
        throw Error("Invalid checkin policy");
      return mutate(uid, (tx, data, now) => {
        const claimed = data.checkedDay !== day(now);
        if (claimed) {
          data.checkedDay = day(now);
          add(
            data,
            {
              id: "checkin:" + day(now),
              source: "grant",
              amount,
              expiresAt: amount === 100 ? null : now + days * 86400000,
            },
            now,
          );
        }
        return { ...view(data, now), claimed };
      });
    },
    async reserve(uid, { id, fingerprint, amount, sku, version }) {
      if (
        !integer(amount) ||
        typeof fingerprint !== "string" ||
        !/^[a-f0-9]{64}$/.test(fingerprint) ||
        version !== PRICE_VERSION ||
        !/^chat\.(short|standard|long)$/.test(sku || "")
      )
        fail(400, "INVALID_QUOTE", "无效报价。");
      const op = opRef(uid, id);
      return mutate(uid, async (tx, data, now) => {
        const previous = await tx.get(op);
        if (previous.exists) {
          const old = previous.data();
          if (
            old.fingerprint !== fingerprint ||
            old.amount !== amount ||
            old.sku !== sku ||
            old.version !== version
          )
            fail(409, "IDEMPOTENCY_CONFLICT", "请求编号已用于另一条消息。");
          const status =
            old.status === "reserved" && !data.holds[id]
              ? "released"
              : old.status;
          fail(
            409,
            "OPERATION_" + status.toUpperCase(),
            status === "settled"
              ? "该回复已结算，请检查已保存的回复。"
              : "该请求已处理或仍在处理中，请先核对账单。",
          );
        }
        if (data.balance < amount)
          fail(402, "INSUFFICIENT_CREDITS", "积分不足，请领取赠送积分或充值。");
        if (Object.keys(data.holds).length >= 4)
          fail(429, "TOO_MANY_PENDING", "请等待正在生成的回复。");
        const rank = { grant: 0, legacy: 1, purchased: 2 };
        data.lots.sort(
          (a, b) =>
            rank[a.source] - rank[b.source] ||
            (a.expiresAt || Infinity) - (b.expiresAt || Infinity),
        );
        let remaining = amount;
        const allocations = [];
        for (const lot of data.lots) {
          const taken = Math.min(remaining, lot.remaining);
          if (taken) {
            allocations.push({
              id: lot.id,
              source: lot.source,
              expiresAt: lot.expiresAt,
              amount: taken,
            });
            lot.remaining -= taken;
            remaining -= taken;
          }
          if (!remaining) break;
        }
        const until = now + holdSeconds * 1000;
        data.holds[id] = { amount, allocations, until };
        data.balance -= amount;
        record(data, { type: "reserve", amount: -amount, id, sku }, now);
        tx.create(op, {
          uid,
          id,
          fingerprint,
          amount,
          sku,
          version,
          status: "reserved",
          createdAt: iso(now),
          until,
        });
        return { id, amount, sku, version, until, wallet: view(data, now) };
      });
    },
    async finish(uid, id, success, reply) {
      const op = opRef(uid, id);
      return mutate(uid, async (tx, data, now) => {
        const s = await tx.get(op);
        if (!s.exists) fail(404, "UNKNOWN_OPERATION", "找不到这条消费记录。");
        const old = s.data();
        if (old.status !== "reserved")
          return { status: old.status, wallet: view(data, now) };
        const hold = data.holds[id];
        let status = "released";
        if (hold) {
          if (success) {
            status = "settled";
            for (const a of hold.allocations)
              data.stats.spent[a.source] += a.amount;
            record(
              data,
              {
                type: "spend",
                amount: 0,
                charged: hold.amount,
                id,
                sku: old.sku,
                sources: totals(
                  hold.allocations.map((a) => ({ ...a, remaining: a.amount })),
                ),
              },
              now,
            );
          } else {
            restore(data, hold, now);
            record(
              data,
              {
                type: "release",
                amount: hold.amount,
                id,
                reason: "generation_failed",
              },
              now,
            );
          }
          delete data.holds[id];
        }
        tx.set(op, {
          ...old,
          status,
          finishedAt: iso(now),
          sources: hold
            ? totals(
                hold.allocations.map((a) => ({ ...a, remaining: a.amount })),
              )
            : null,
        });
        if (
          status === "settled" &&
          typeof reply === "string" &&
          reply.length <= 50000
        )
          tx.set(responses.doc(digest(uidKey(uid) + ":" + id)), {
            uid,
            reply,
            expiresAt: new Date(now + 86400000),
          });
        data.balance = data.lots.reduce((n, l) => n + l.remaining, 0);
        return { status, wallet: view(data, now) };
      });
    },
    async status(uid, id) {
      const op = opRef(uid, id);
      return mutate(uid, async (tx, data, now) => {
        const [s, r] = await Promise.all([
          tx.get(op),
          tx.get(responses.doc(digest(uidKey(uid) + ":" + id))),
        ]);
        if (!s.exists) fail(404, "UNKNOWN_OPERATION", "找不到这条消费记录。");
        const o = s.data(),
          cached = r.exists ? r.data() : null;
        return {
          ...(cached &&
          new Date(cached.expiresAt?.toDate?.() || cached.expiresAt).getTime() >
            now
            ? { reply: cached.reply }
            : {}),
          id,
          amount: o.amount,
          sku: o.sku,
          version: o.version,
          status:
            o.status === "reserved" && !data.holds[id] ? "released" : o.status,
          wallet: view(data, now),
        };
      });
    },
    async registerCampaign(c) {
      if (
        !validId(c?.id) ||
        !integer(c.amount) ||
        !integer(c.budget, 100_000_000) ||
        !Array.isArray(c.recipients) ||
        !c.recipients.length ||
        c.recipients.length > 5000 ||
        c.recipients.some(
          (v) => typeof v !== "string" || !/^[a-f0-9]{64}$/.test(v),
        ) ||
        !Number.isSafeInteger(c.startsAt) ||
        !Number.isSafeInteger(c.endsAt) ||
        c.endsAt <= c.startsAt ||
        !Number.isSafeInteger(c.expiresAt) ||
        c.expiresAt < c.endsAt
      )
        throw Error("Invalid campaign");
      const config = {
          id: c.id,
          amount: c.amount,
          budget: c.budget,
          recipients: [...new Set(c.recipients)].sort(),
          startsAt: c.startsAt,
          endsAt: c.endsAt,
          expiresAt: c.expiresAt,
        },
        configHash = digest(JSON.stringify(config)),
        r = campaigns.doc(c.id);
      return db.runTransaction(async (tx) => {
        const s = await tx.get(r);
        if (s.exists) {
          if (s.data().configHash !== configHash)
            throw Error("Campaign immutable: use a new campaign id");
          return { created: false };
        }
        tx.create(r, { ...config, configHash, issued: 0, count: 0 });
        return { created: true };
      });
    },
    async grant(uid, campaignId) {
      if (!validId(campaignId)) throw Error("Invalid campaign");
      return mutate(uid, async (tx, data, now) => {
        const r = campaigns.doc(campaignId),
          g = operations.doc(digest(uidKey(uid) + ":grant:" + campaignId));
        const [cs, previous] = await Promise.all([tx.get(r), tx.get(g)]);
        if (previous.exists) return { ...view(data, now), claimed: false };
        const c = cs.exists ? cs.data() : null;
        if (
          !c ||
          !c.recipients.includes(uidKey(uid)) ||
          now < c.startsAt ||
          now >= c.endsAt
        )
          fail(403, "GRANT_NOT_ELIGIBLE", "此账号不在活动发放范围内。");
        if (c.issued + c.amount > c.budget)
          fail(409, "CAMPAIGN_EXHAUSTED", "活动额度已发完。");
        add(
          data,
          {
            id: "campaign:" + campaignId,
            source: "grant",
            amount: c.amount,
            expiresAt: c.expiresAt,
          },
          now,
        );
        tx.set(r, { ...c, issued: c.issued + c.amount, count: c.count + 1 });
        tx.create(g, {
          uid,
          type: "grant",
          campaign: campaignId,
          amount: c.amount,
          at: iso(now),
        });
        return { ...view(data, now), claimed: true };
      });
    },
  };
}
