#!/usr/bin/env node
// Backstories for a later volume: play the previous volume with typical player types and keep where they ended.
// Usage: node tools/presets.js <previous campaign.json> <out presets.json> [v2|v3|v4|v5|v6|v7|v8]
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
// Volume IV starts from Volume III (which carries II and I): the two places Volume III can leave you, plus the usual types.
const WANT_V4 = [
  { id: "chengdu", weights: Object.assign({}, CC.policies.loyal, { "flag.v3_to_jing": -12 }), ok: st => st.v.track === "liu" && !st.v.ended_early && !st.v["flag.post_jingzhou"] && !st.v["flag.v3_to_jing"],
    title: T("成都的谋士", "The Strategist in Chengdu"), desc: T("汉中打下来了，你留在汉中王身边。荆州的战报，你每一封都看两遍。", "Hanzhong is won, and you stayed at the King's side. You read every report from Jingzhou twice.") },
  { id: "guan", weights: Object.assign({}, CC.policies.loyal, { "flag.v3_to_jing": 12, "flag.post_jingzhou": 12, "rel.guanyu.trust": 3, "rel.guanyu.warmth": 3 }),
    ok: st => st.v.track === "liu" && !st.v.ended_early && (st.v["flag.post_jingzhou"] || st.v["flag.v3_to_jing"]),
    title: T("关羽身边的人", "The One Beside Guan Yu"), desc: T("关羽北上樊城，你在他的中军帐里。他说，有你在，他心里踏实些。", "Guan Yu marches on Fancheng, and you're in his headquarters tent. He says that with you there he feels steadier.") },
  { id: "romance", policy: "romance", ok: st => !st.v.ended_early && (st.v["flag.wz_west"] || st.v["flag.wz_jingzhou"]) && st.v["rel.wenzhi.intimacy"] >= 4,
    title: T("江边人", "The One by the River"), desc: T("温芷一直在你身边，从赤壁的火，到汉中的山。", "Wen Zhi has been at your side all along, from the fire at Red Cliffs to the mountains of Hanzhong.") },
  { id: "seer", policy: "seer", ok: st => !st.v.ended_early && st.v.uncanny >= 3,
    title: T("异人", "The Uncanny One"), desc: T("鸡肋两个字，你听出了一条人命。有人叫你先生，有人叫你妖人。", "In two words, 'chicken rib', you heard a man's death. Some call you Master; some call you a sorcerer.") },
  { id: "wanderer", policy: null, ok: st => !!st.v.ended_early,
    title: T("流落之人", "The Wanderer"), desc: T("你早早就离开了。汉中和荆州的事，你是从远处听说的。", "You left early. You heard about Hanzhong and Jingzhou from far away.") },
];
// Volume V starts from Volume IV: everyone still with Liu Bei is in Chengdu; the backstories differ in whether Guan Yu lived.
const SAVER = Object.assign({}, CC.policies.loyal, { "flag.v4_kept_rear": 20, "flag.v4_mf_path": 20, "flag.v4_relief": 20, "flag.v4_early_call": 20, "flag.warned_jing": 20, "flag.guan_alive": 40, "flag.bone_rest": 8, "flag.v4_to_jing": -5, "rel.guanyu.trust": 3, "rel.guanyu.warmth": 3 });
const WANT_V5 = [
  { id: "chengdu", policy: "loyal", ok: st => st.v.track === "liu" && !st.v.ended_early && !st.v["flag.guan_alive"],
    title: T("汉中王身边的人", "At the King's Side"), desc: T("荆州丢了，关羽没能回来。你留在汉中王身边，看着他一夜白了头。", "Jingzhou is lost and Guan Yu never came back. You stayed at the King's side and watched his hair go white in a night.") },
  { id: "guan", weights: SAVER, ok: st => st.v.track === "liu" && !st.v.ended_early && st.v["flag.guan_alive"],
    title: T("麦城走大路的人", "The One Who Took the Main Road"), desc: T("麦城那夜，你拉住了关羽的马。荆州丢了，他活着回到了成都。", "That night at Maicheng you caught Guan Yu's bridle. Jingzhou was lost, but he came back to Chengdu alive.") },
  { id: "romance", policy: "romance", ok: st => !st.v.ended_early && (st.v["flag.wz_west"] || st.v["flag.wz_jingzhou"] || st.v["flag.wz_huatuo"]) && st.v["rel.wenzhi.intimacy"] >= 4,
    title: T("江边人", "The One by the River"), desc: T("温芷一直在你身边。荆州的火，她也看见了。", "Wen Zhi has been at your side all along. She saw the fires of Jingzhou too.") },
  { id: "healer", weights: Object.assign({}, CC.policies.romance, { "flag.wz_huatuo": 15 }), ok: st => !st.v.ended_early && st.v["flag.wz_huatuo"],
    title: T("等她来信的人", "Waiting for Her Letters"), desc: T("刮骨疗毒那年，温芷跟着华佗学医去了。荆州丢的时候，她不在荆州。", "The year of the bone-scraping, Wen Zhi went off to learn from Hua Tuo. When Jingzhou fell, she wasn't there.") },
  { id: "seer", policy: "seer", ok: st => !st.v.ended_early && st.v.uncanny >= 3,
    title: T("异人", "The Uncanny One"), desc: T("荆州的事，你说中了太多。有人叫你先生，有人叫你妖人。", "You called too much of Jingzhou before it happened. Some call you Master; some call you a sorcerer.") },
  { id: "wanderer", policy: null, ok: st => !!st.v.ended_early,
    title: T("流落之人", "The Wanderer"), desc: T("你早早就离开了。荆州和麦城的事，你是从远处听说的。", "You left early. You heard about Jingzhou and Maicheng from far away.") },
];
// Volume VI starts from Volume V: Liu Bei is dead; the backstories differ in who else lived and what you were trusted with.
const WANT_V6 = [
  { id: "trusted", weights: Object.assign({}, CC.policies.loyal, { "flag.v5_entrusted": 30, "flag.v5_guard": 10, "flag.v5_firebreak": 10 }), ok: st => st.v.track === "liu" && !st.v.ended_early && st.v["flag.v5_entrusted"],
    title: T("受托孤的人", "The One Entrusted"), desc: T("白帝城里，先帝把你的手和丞相的手放在了一起。", "In Baidi, the late emperor laid your hand with the Chancellor's.") },
  { id: "brothers", weights: Object.assign({}, CC.policies.loyal, { "flag.fei_alive": 40, "flag.v5_fei_letter": 20, "flag.v5_langzhong": 20 }), ok: st => st.v.track === "liu" && !st.v.ended_early && st.v["flag.fei_alive"],
    title: T("阆中守夜的人", "The Watch at Langzhong"), desc: T("那一夜你守在张飞帐外。范疆、张达扔下刀跑了。", "That night you kept watch outside Zhang Fei's tent. Fan Jiang and Zhang Da dropped their knives and ran.") },
  { id: "romance", weights: Object.assign({}, CC.policies.romance, { "flag.wz_wed": 30 }), ok: st => !st.v.ended_early && st.v["flag.wz_wed"],
    title: T("说定成亲的人", "Promised"), desc: T("永安宫的偏殿里，你和温芷说定了：回成都就成亲。", "In a side hall of the Palace of Enduring Peace, you and Wen Zhi agreed: back in Chengdu, you'd marry.") },
  { id: "seer", policy: "seer", ok: st => !st.v.ended_early && st.v.uncanny >= 3,
    title: T("异人", "The Uncanny One"), desc: T("鱼腹浦的石头会动，你早就知道。有人叫你先生，有人叫你妖人。", "You knew the stones at Yufu Shore would move. Some call you Master; some call you a sorcerer.") },
  { id: "wanderer", policy: null, ok: st => !!st.v.ended_early,
    title: T("流落之人", "The Wanderer"), desc: T("你早早就离开了。白帝城的事，你是从远处听说的。", "You left early. You heard about Baidi from far away.") },
];
// Volume VII starts from Volume VI; Volume VI's own presets carry Volume V, so these keep the earlier flags (entrusted, married, Ma Su).
const WANT_V7 = [
  { id: "trusted", weights: Object.assign({}, CC.policies.loyal, { "flag.v6_mercy": 10, "flag.v6_lushui": 10 }), ok: st => st.v.track === "liu" && !st.v.ended_early && st.v["flag.v5_entrusted"],
    title: T("受托孤的人", "The One Entrusted"), desc: T("白帝城受托，南中七擒。丞相说：白帝城那天，先帝把你的手和亮的手放在一起。", "Entrusted at Baidi, through the seven captures in the south. The Chancellor says: that day the late emperor laid your hand with mine.") },
  { id: "romance", policy: "romance", ok: st => !st.v.ended_early && st.v["flag.wz_wed"],
    title: T("成了亲的人", "Married"), desc: T("你和温芷成了亲。院子里种了药，也种了一棵梅。", "You and Wen Zhi are married. The yard has herbs in it, and a plum tree.") },
  { id: "brothers", weights: Object.assign({}, CC.policies.loyal, { "rel.zhuge.esteem": 2 }), ok: st => st.v.track === "liu" && !st.v.ended_early && (st.v["flag.fei_alive"] || st.v["flag.guan_alive"]),
    title: T("阆中守夜的人", "The Watch at Langzhong"), desc: T("那一夜你守在张飞帐外。如今他老了，还在成都。", "That night you kept watch outside Zhang Fei's tent. He's old now, still in Chengdu.") },
  { id: "doubt", weights: Object.assign({}, CC.policies.loyal, { "flag.v6_masu_doubt": 30 }), ok: st => st.v.track === "liu" && !st.v.ended_early && st.v["flag.v6_masu_doubt"],
    title: T("记着先帝那句话的人", "The One Who Remembered"), desc: T("先帝说马谡言过其实。你把这句话告诉了丞相。", "The late emperor said Ma Su's words outran his worth. You told the Chancellor.") },
  { id: "seer", policy: "seer", ok: st => !st.v.ended_early && st.v.uncanny >= 3,
    title: T("异人", "The Uncanny One"), desc: T("南人说，丞相身边有个人，山里的事他都知道。", "The southerners say the Chancellor has a man who knows everything in the hills.") },
  { id: "wanderer", policy: null, ok: st => !!st.v.ended_early,
    title: T("流落之人", "The Wanderer"), desc: T("你早早就离开了。南中的事，你是从远处听说的。", "You left early. You heard about the south from far away.") },
];
const WANT_V8 = [
  { id: "married", policy: "romance", ok: st => !st.v.ended_early && st.v["flag.v7_child"],
    title: T("有了孩子的人", "The Parent"), desc: T("你和温芷的孩子会写自己的名字了。丞相走了，你护着灵车回成都。", "Your child with Wen Zhi can write their own name now. The Chancellor is gone, and you escort the hearse home.") },
  { id: "letter", weights: Object.assign({}, CC.policies.loyal, { "flag.v7_weiyan_word": 30, "flag.v7_ziwu": 10, "flag.v7_warned_weiyan": 10, "rel.weiyan.trust": 3 }), ok: st => st.v.track === "liu" && !st.v.ended_early && st.v["flag.v7_weiyan_word"] && st.v["rel.weiyan.trust"] >= 6,
    title: T("揣着那封信的人", "The One with the Letter"), desc: T("丞相临终写给魏延一封信，交给了你。全营只有你替魏延说过话。", "On his deathbed the Chancellor wrote Wei Yan a letter and gave it to you. In the whole camp, only you ever spoke up for Wei Yan.") },
  { id: "fan", weights: Object.assign({}, CC.policies.loyal, { "rel.zhuge.trust": 3, "rel.jiangwei.trust": 2 }), ok: st => st.v.track === "liu" && !st.v.ended_early && st.v["flag.v7_fan"] && !st.v["flag.v7_child"],
    title: T("受了羽扇的人", "The Keeper of the Fan"), desc: T("丞相把白羽扇放进你手里：替亮看着。你收了一个学生。", "The Chancellor put the white feather fan in your hand: watch over them for me. You took on a student.") },
  { id: "envoy", weights: Object.assign({}, CC.policies.schemer, { "flag.v7_envoy": 20 }), ok: st => !st.v.ended_early && st.v["flag.v7_envoy"] && !st.v["flag.v7_child"],
    title: T("见过司马懿的人", "The One Who Met Sima Yi"), desc: T("你在司马懿帐里喝过茶，他记住了你的名字。", "You drank tea in Sima Yi's tent, and he remembered your name.") },
  { id: "wanderer", policy: null, ok: st => !!st.v.ended_early,
    title: T("流落之人", "The Wanderer"), desc: T("你早早就离开了。五丈原的事，你是从远处听说的。", "You left early. You heard about Wuzhang from far away.") },
];
const res = [];
for (const w of (target === "v8" ? WANT_V8 : target === "v7" ? WANT_V7 : target === "v6" ? WANT_V6 : target === "v5" ? WANT_V5 : target === "v4" ? WANT_V4 : target === "v3" ? WANT_V3 : WANT)) {
  let found = null;
  for (let seed = 1; seed < 400 && !found; seed++) { const st = CC.playPolicy(camp, CC.rng(seed * 7919), w.weights || (w.policy ? CC.policies[w.policy] : null)); if (w.ok(st)) found = st; }
  if (!found) { console.error("no run for", w.id); process.exit(1); }
  const c = CC.carryOut(found);
  res.push({ id: w.id, title: w.title, desc: w.desc, carry: { vol: c.vol, v: c.v, ended_early: c.ended_early, mem: {}, commits: [], said: c.said } });
}
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log("presets", res.map(p => p.id).join(", "), "->", out);
