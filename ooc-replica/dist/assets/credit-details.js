const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function creditDetails(config, wallet) {
  const p = config.billing;
  if (!p?.enabled) return "";
  const b = wallet?.breakdown;
  return `${wallet?.fundingPaused ? '<p role="alert" data-no-i18n>退款或支付争议待核对，暂时停止 AI 消费。已有内容与存档仍可查看，请联系站点负责人。</p>' : ""}<section class="credits-free-card" data-no-i18n><h2>积分如何使用</h2><p>普通/短回复 ${p.prices.standard} 点，长回复 ${p.prices.long} 点。重新生成同价；静态故事阅读免费。</p><p>创作短字段 ${p.prices.author ?? 3} 点 / 详细设定 ${p.prices.authorLong ?? 8} 点；封面 ${p.prices.image ?? 80} 点 / 张。游戏意图解析 ${p.prices.gameUnderstand ?? 1} 点、生成回复 ${p.prices.gameExpress ?? 1} 点 / 阶段，均需主动开启；编排内容免费。</p><p>先预留，成功后结算。生成失败/生成中取消释放预留；已生成完成的回复按价结算，断线后可恢复。到期赠送积分不延长有效期。</p>${b ? `<p>赠送 ${b.grant} · 购买 ${b.purchased} · 历史余额 ${b.legacy} · 预留 ${wallet.reserved || 0}</p>${wallet.nextExpiry ? `<p>最近一笔赠送积分到期：${esc(new Date(wallet.nextExpiry).toLocaleString())}</p>` : ""}` : ""}<p>赠送积分优先使用，购买积分无有效期。历史余额完整保留，来源不追溯认定。</p><small>价格版本 ${esc(p.version)}${p.mode === "test" ? " · 测试积分，不代表真实付款" : ""}</small></section>`;
}
export function claimForm(config, user, busy) {
  return config.billing?.enabled
    ? `<div class="credits-free-card" data-no-i18n><h2>领取内测 / 活动积分</h2><p>仅获邀请的账号可领取，同一活动每个账号一次。</p><form data-credit-claim><label>活动编号 <input name="campaign" required maxlength="100" pattern="[a-zA-Z0-9_-]+" autocomplete="off"></label><button class="credits-small-button" ${busy || !user ? "disabled" : ""}>领取</button></form></div>`
    : "";
}
export const ledgerLabel = (item) =>
  ({
    purchase: "购买积分",
    migration: "历史余额接续",
    grant: "赠送积分",
    funding_reversal: "退款 / 争议冲正",
    funding_restored: "支付核对后恢复",
    funding_offset: "抵销已退款点数",
    reserve: "生成预留",
    spend: "已完成结算",
    release: "预留释放",
    expiry: "赠送到期",
    checkin: "Daily check-in",
  })[item.type] || item.type;
