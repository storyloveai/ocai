import { loadPublicConfig } from "./public-config.js";
const error = (code, message) => Object.assign(Error(message), { code });
export function createCreditClient(
  account,
  {
    config = () => loadPublicConfig(),
    storage = globalThis.sessionStorage,
  } = {},
) {
  return {
    async prepare(body) {
      const cfg = await config();
      if (!cfg?.billing?.enabled) return null;
      const owner = account?.user;
      if (!owner) {
        account?.login?.();
        throw error("LOGIN_REQUIRED", "请先登录，再使用积分聊天。");
      }
      const q = await account.api("wallet", {
        action: "quote",
        outputLength: body.outputLength,
      });
      if (account.user !== owner)
        throw error("ACCOUNT_CHANGED", "账号已更换，请重试。");
      const fingerprint = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(JSON.stringify(body)),
          ),
        ),
      )
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
      const key = `sd-credit-request:${cfg.walletMode}:${owner.uid}:${fingerprint}`;
      let id;
      try {
        id = storage?.getItem(key);
      } catch {}
      if (id) {
        try {
          const previous = await account.api("wallet", {
            action: "status",
            id,
          });
          if (previous.status === "reserved")
            throw error(
              "OPERATION_RESERVED",
              "回复仍在处理中。请稍后重试；预留积分最迟 10 分钟释放。",
            );
          if (previous.status === "released") {
            id = null;
          } else if (previous.status === "settled" && !previous.reply)
            throw error(
              "OPERATION_SETTLED",
              "这条回复已结算，恢复窗口已过，请核对积分记录。",
            );
        } catch (e) {
          if (e.code !== "UNKNOWN_OPERATION") throw e;
        }
      }
      // A settled operation can replay even if the remaining balance is now zero.
      if (!id && q.wallet.balance < q.amount)
        throw error(
          "INSUFFICIENT_CREDITS",
          "积分不足。可先领取活动额度或充值，你输入的内容会保留。",
        );
      id ||= crypto.randomUUID();
      try {
        storage?.setItem(key, id);
      } catch {}
      let settled = false;
      const token = await owner.getIdToken();
      if (account.user !== owner)
        throw error("ACCOUNT_CHANGED", "账号已更换，请重试。");
      return {
        headers: { Authorization: "Bearer " + token },
        billing: { id, version: q.version, amount: q.amount },
        owner,
        current: () => account.user === owner,
        get settled() {
          return settled;
        },
        complete: () => {
          settled = true;
          try {
            storage?.removeItem(key);
          } catch {}
          globalThis.dispatchEvent?.(new Event("sd-wallet-changed"));
        },
      };
    },
  };
}
