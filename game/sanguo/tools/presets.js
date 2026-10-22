#!/usr/bin/env node
// Backstories for a later volume: play the previous volume with typical player types and keep where they ended.
// Usage: node tools/presets.js <previous campaign.json> <out presets.json> [v2|v3]
// The last argument says which volume the backstories are for (default v2: backstories from Volume I).
const fs = require("fs");
const CC = require("../engine/campaign_core.js");
const [, , src, out, target = "v2"] = process.argv;
const camp = JSON.parse(fs.readFileSync(src, "utf8"));
const T = (zh, en) => ({ zh, en });
const WANT = [
  { id: "loyal", policy: "loyal", ok: st => st.v.track === "liu" && st.v["rel.liubei.trust"] >= 8 && !st.v.ended_early,
    title: T("忠义之士", "The Loyal Retainer"), desc: T("你一路跟着刘备，从许都到赤壁。刘备把你当心腹。", "You followed Liu Bei all the way from Xuchang to Red Cliffs. He counts you among his closest.") },
  { id: "romance", policy: "romance", ok: st => st.v["flag.wenzhi_with_you"] && st.v.track === "liu" && !st.v.ended_early,
    title: T("江边人", "The One by the River"), desc: T("赤壁那一夜，你划船进火海接回了温芷。她现在就在你身边。", "On the night of the fire you rowed into the flames and brought Wen Zhi back. She's at your side now.") },
  { id: "schemer", policy: "schemer", ok: st => st.v.track === "cao" && !st.v.ended_early,
    title: T("曹营谋士", "Cao Cao's Strategist"), desc: T("你留在了曹营，曹操器重你。赤壁之后，你随他北还。", "You stayed with Cao Cao, who values you. After Red Cliffs, you went north with him.") },
  { id: "seer", policy: "seer", ok: st => !st.v.ended_early && st.v.uncanny >= 3,
    title: T("异人", "The Uncanny One"), desc: T("你知道的太多，说出来的也太多。有人叫你先生，有人叫你妖人。", "You knew too much, and said too much. Some called you Master; some called you a sorcerer.") },
  { id: "wanderer", policy: "random", ok: st => !!st.v.ended_early,
    title: T("流落之人", "The Wanderer"), desc: T("卷一还没结束，你就离开了。赤壁的火，你是在远处看见的。", "You left before Volume I was over. You saw the fire at Red Cliffs from far away.") },
];
// Volume III starts from Volume II; Volume II's own presets carry Volume I, so these are full two-volume histories.
const WANT_V3 = [
  { id: "loyal", policy: "loyal", ok: st => st.v.track === "liu" && !st.v.ended_early && !st.v["flag.post_jingzhou"],
    title: T("成都的谋士", "The Strategist in Chengdu"), desc: T("你跟着刘备入了川。益州到手那天，你留在了他身边。", "You followed Liu Bei into the west. The day Yi province was won, you stayed at his side.") },
  { id: "guan", weights: Object.assign({}, CC.policies.loyal, { "flag.post_jingzhou": 12, "rel.guanyu.esteem": 2 }), ok: st => st.v.track === "liu" && !st.v.ended_early && st.v["flag.post_jingzhou"],
    title: T("关羽身边的人", "The One Beside Guan Yu"), desc: T("益州到手后，你请命回了荆州。关羽说，有你在旁边，他放心些。", "Once Yi province was won, you asked to go back to Jingzhou. Guan Yu said that with you beside him he rested easier.") },
  { id: "romance", policy: "romance", ok: st => !st.v.ended_early && (st.v["flag.wz_west"] || st.v["flag.wz_jingzhou"]) && st.v["rel.wenzhi.intimacy"] >= 4,
    title: T("江边人", "The One by the River"), desc: T("温芷一直在你身边，从赤壁的火到西川的路。", "Wen Zhi has been at your side all along, from the fire at Red Cliffs to the roads of the west.") },
  { id: "seer", policy: "seer", ok: st => !st.v.ended_early && st.v.uncanny >= 3,
    title: T("异人", "The Uncanny One"), desc: T("落凤坡的事，你说中了。有人叫你先生，有人叫你妖人。", "You called Fallen Phoenix Slope before it happened. Some call you Master; some call you a sorcerer.") },
  { id: "wanderer", policy: null, ok: st => !!st.v.ended_early,
    title: T("流落之人", "The Wanderer"), desc: T("你早早就离开了。荆州和西川的事，你是从远处听说的。", "You left early. You heard about Jingzhou and the west from far away.") },
];
const res = [];
for (const w of (target === "v3" ? WANT_V3 : WANT)) {
  let found = null;
  for (let seed = 1; seed < 400 && !found; seed++) { const st = CC.playPolicy(camp, CC.rng(seed * 7919), w.weights || (w.policy ? CC.policies[w.policy] : null)); if (w.ok(st)) found = st; }
  if (!found) { console.error("no run for", w.id); process.exit(1); }
  const c = CC.carryOut(found);
  res.push({ id: w.id, title: w.title, desc: w.desc, carry: { vol: c.vol, v: c.v, ended_early: c.ended_early, mem: {}, commits: [], said: c.said } });
}
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log("presets", res.map(p => p.id).join(", "), "->", out);
