// node --test game/engine/test
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CC = require(path.join(HERE, "../campaign_core.js"));
const TIERS = JSON.parse(readFileSync(path.join(HERE, "../tiers.json"), "utf8"));
const pack = id => JSON.parse(readFileSync(path.join(HERE, "../packs", id + ".json"), "utf8"));
const { migrate } = await import("../tools/migrate.mjs");

const num = (label, init = 0, max = 10) => ({ type: "num", init, min: 0, max, label });
// the smallest book that exercises the rules: one chapter, one scene, one ending
function tiny(spec, { axes = ["warmth", "trust", "esteem"], max = 10 } = {}) {
  const vars = { stones: num("灵石", 3), qi: num("灵力", 2), exposure: num("暴露"), "flag.done": { type: "bool", init: false, label: "完成" } };
  axes.forEach(a => { vars["rel.tao." + a] = num("陶岑 · " + a, 2, max); });
  return {
    spec, id: "tiny", title: "小书", volume: "卷一", vars, echoes: {}, debts: {},
    chars: { tao: { name: "陶岑", main: "trust", dims: Object.fromEntries(axes.map(a => [a, { label: a }])) } },
    dims: {}, chapters: [{ id: "c1", title: "一", intro: [], offer: 0 }],
    nodes: {
      c1_m1: { id: "c1_m1", chapter: "c1", kind: "main", lock: "free", order: 1, title: "山门", intro: [], cast: [{ id: "tao" }],
        choices: [
          { id: "buy", type: "strategy", label: "买", out: [], effects: [{ add: "stones", by: -2 }, { set: "flag.done", to: true }, { add: "qi", by: 2 }], req: { v: "stones", op: ">=", val: 2 } },
          { id: "walk", type: "strategy", label: "走", out: [], effects: [{ add: "rel.tao.trust", by: 1 }, { add: "exposure", by: 1 }] }] },
      x_seen: { id: "x_seen", chapter: "c1", kind: "interrupt", lock: "free", order: 9, title: "被盯上", intro: [], cast: [], when: { v: "exposure", op: ">=", val: 1 },
        choices: [{ id: "ok", type: "strategy", label: "好", out: [], effects: [{ add: "rel.tao.trust", by: 0 }] }] } },
    endings: [{ id: "path", title: "路", fragments: [{ id: "won", when: { all: [{ v: "qi", op: ">=", val: 4 }, { v: "flag.done", op: "==", val: true }] }, text: "成了" }, { id: "plain", text: "还在路上" }] }],
  };
}
const as04 = c => Object.assign(c, { spec: "storydate.campaign/0.4", tiers: TIERS, pack: pack("cultivation"), resources: { power: ["qi"], currency: ["stones"], risk: ["exposure"] } });
const has = (list, re) => list.some(m => re.test(m));

test("engine reports its version and both specs", () => {
  assert.match(CC.VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(CC.specLevel({ spec: "storydate.campaign/0.3" }), 3);
  assert.equal(CC.specLevel({ spec: "storydate.campaign/0.4" }), 4);
});

test("0.3 campaigns keep working: the relationship model only warns", () => {
  const v = CC.validate(tiny("storydate.campaign/0.3", { axes: ["trust"], max: 8 }));
  assert.ok(!has(v.errors, /axis|scale/), v.errors.join("\n"));
  assert.ok(has(v.warnings, /missing the warmth axis.*required from spec 0\.4/));
});

test("0.4 enforces axes, the 0–10 scale, tiers and the pack", () => {
  const v = CC.validate(as04(tiny("x", { axes: ["trust"], max: 8 })));
  assert.ok(has(v.errors, /missing the warmth axis/)); assert.ok(has(v.errors, /relationship scale is 0–10/));
  const ok = CC.validate(as04(tiny("x")));
  assert.deepEqual(ok.errors, []);
  const noPack = tiny("storydate.campaign/0.4"); noPack.tiers = TIERS;
  assert.ok(has(CC.validate(noPack).errors, /genre pack missing/));
});

test("relationship thresholds must sit on a tier boundary", () => {
  const c = as04(tiny("x")); c.nodes.c1_m1.choices[1].req = { v: "rel.tao.trust", op: ">=", val: 5 };
  assert.ok(has(CC.validate(c).errors, /not on a tier boundary/));
  c.nodes.c1_m1.choices[1].req = { v: "rel.tao.trust", op: ">=", val: 4 };
  assert.ok(!has(CC.validate(c).errors, /tier boundary/));
});

test("pack rules: a way through, earned success, risk that bites", () => {
  const a = as04(tiny("x")); a.nodes.c1_m1.choices[1].req = { v: "flag.done", op: "==", val: true };
  assert.ok(has(CC.validate(a).errors, /rule alt_path/));
  const b = as04(tiny("x")); b.endings[0].fragments[0].when = { v: "qi", op: ">=", val: 4 };
  assert.ok(has(CC.validate(b).errors, /rule earned_victory/));
  const c = as04(tiny("x")); delete c.nodes.x_seen.when;
  assert.ok(has(CC.validate(c).errors, /rule risk_bites/));
  const d = as04(tiny("x")); d.resources = { power: ["qi"] };
  assert.ok(has(CC.validate(d).errors, /role currency is not mapped/));
});

test("carrying into a new volume pulls high values back, keeps low ones", () => {
  const camp = { carry_compress: { pivot: 4, k: 0.5 } };
  assert.deepEqual([0, 3, 4, 6, 8, 10].map(x => CC.compress(camp, x)), [0, 3, 4, 5, 6, 7]);
  assert.equal(CC.compress({}, 10), 10);
});

test("migrate turns a 0.3 book into a valid 0.4 one and says what it changed", () => {
  const old = tiny("storydate.campaign/0.3", { axes: ["trust"], max: 8 });
  old.vars["rel.tao.trust"].init = 4;
  old.nodes.c1_m1.choices[1].req = { v: "rel.tao.trust", op: ">=", val: 3 };
  const { camp, log } = migrate(old, { pack: "cultivation", res: { power: ["qi"], currency: ["stones"], risk: ["exposure"] } });
  assert.equal(camp.vars["rel.tao.trust"].init, 5);
  assert.equal(camp.nodes.c1_m1.choices[1].req.val, 4);       // 3 of 8 = 3.75 of 10 → nearest tier start 4 (ties go to the lower tier)
  assert.ok(camp.chars.tao.dims.warmth && camp.chars.tao.dims.esteem);
  assert.ok(log.some(l => /added warmth/.test(l)));
  // the threshold now locks the only other way through, which the pack rules rightly catch; drop it and all is clean
  delete camp.nodes.c1_m1.choices[1].req;
  assert.deepEqual(CC.validate(camp).errors, []);
});

test("hard tiers: once at the tier, only key moments raise the value; losses always apply", () => {
  const camp = { tiers: { start: [0, 2, 4, 6, 8] }, hard_tiers: { "rel.a.trust": 3 } };
  assert.equal(CC.heldBack(camp, "rel.a.trust", 5, { add: "rel.a.trust", by: 1 }), false);   // below 倚重: ordinary gains work
  assert.equal(CC.heldBack(camp, "rel.a.trust", 6, { add: "rel.a.trust", by: 1 }), true);    // at 倚重: held back
  assert.equal(CC.heldBack(camp, "rel.a.trust", 6, { add: "rel.a.trust", by: 2, key: true }), false);
  assert.equal(CC.heldBack(camp, "rel.a.trust", 7, { add: "rel.a.trust", by: -1 }), false);
  assert.equal(CC.heldBack(camp, "rel.b.trust", 9, { add: "rel.b.trust", by: 1 }), false);   // other vars untouched
});

test("main_first: a chapter can open on its main scene and offer its sides afterwards", () => {
  const c = as04(tiny("storydate.campaign/0.4"));
  c.chapters = [{ id: "c1", title: "一", intro: [], offer: 1, main_first: true }, { id: "c2", title: "二", intro: [], offer: 0 }];
  c.nodes.c1_s1 = { id: "c1_s1", chapter: "c1", kind: "side", lock: "free", order: 2, salience: 1, title: "支线", intro: [], cast: [],
    choices: [{ id: "go", type: "strategy", label: "去", out: [], effects: [{ add: "rel.tao.trust", by: 0 }] }] };
  c.nodes.c2_m1 = { id: "c2_m1", chapter: "c2", kind: "main", lock: "free", order: 1, title: "下山", intro: [], cast: [],
    choices: [{ id: "on", type: "strategy", label: "走", out: [], effects: [{ add: "rel.tao.trust", by: 0 }] }] };
  delete c.nodes.x_seen;
  const st = CC.newGame(c);
  assert.equal(st.phase, "node"); assert.equal(st.cur, "c1_m1");          // the main scene comes first
  CC.choose(c, st, "walk");
  assert.equal(st.phase, "side"); assert.deepEqual(st.offer, ["c1_s1"]);  // then the side storylet
  CC.pickSide(c, st, "c1_s1"); CC.choose(c, st, "go");
  assert.equal(st.cur, "c2_m1");                                           // then the next chapter, which runs as usual
});

test("speech moves: words change the story by rule, and the validator checks them", () => {
  const c = as04(tiny("x"));
  c.nodes.x_rage = { id: "x_rage", chapter: "*", kind: "flash", lock: "free", order: 0, title: "翻脸", intro: [], cast: [{ id: "tao" }],
    choices: [{ id: "bow", type: "expression", label: "认错", out: [], effects: [] }] };
  c.nodes.c1_m1.moves = [
    { id: "threat", to: "tao", means: "threatens Tao", match: "杀了你", labels: ["threat"], out: [{ text: "陶岑拔剑。" }], effects: [{ add: "rel.tao.trust", by: -2 }], goto: "x_rage" },
    { id: "praise", to: "tao", means: "praises Tao's sect", match: "好门派", out: [{ text: "陶岑笑了。" }], effects: [{ add: "rel.tao.warmth", by: 1 }] }];
  assert.deepEqual(CC.validate(c).errors, []);
  const st = CC.newGame(c);
  assert.equal(st.cur, "c1_m1");
  assert.deepEqual(CC.moves(c, st).map(m => m.id), ["threat", "praise"]);
  assert.equal(CC.matchMove(c, st, "你们真是好门派", "tao", "flat").id, "praise");
  assert.equal(CC.matchMove(c, st, "……", "tao", "threat").id, "threat");   // the model's tone label counts too
  CC.move(c, st, "praise", "你们真是好门派");
  assert.equal(st.cur, "c1_m1"); assert.equal(st.v["rel.tao.warmth"], 3);
  assert.ok(!CC.moves(c, st).some(m => m.id === "praise"), "a move happens once per scene");
  CC.move(c, st, "threat", "我杀了你");
  assert.equal(st.cur, "x_rage"); assert.equal(st.v["rel.tao.trust"], 0);
  CC.choose(c, st, "bow");
  assert.ok(st.done.includes("c1_m1"), "a move without resume ends the scene it broke");
  // the validator: a move must name someone in the scene and go to a flash node
  c.nodes.c1_m1.moves[0].goto = "x_seen"; c.nodes.c1_m1.moves[1].to = "nobody";
  const v = CC.validate(c);
  assert.ok(has(v.errors, /goto x_seen is not a flash node/)); assert.ok(has(v.errors, /unknown character nobody/));
});

test("speech values: what a line shows moves people by their own values, capped per scene", () => {
  const c = as04(tiny("x"));
  c.value_tags = { zhi: { zh: "智", en: "cleverness" }, li: { zh: "利", en: "self-interest" } };
  c.chars.tao.values = { zhi: ["esteem", 1], li: ["trust", -1] };
  const st = CC.newGame(c);
  assert.equal(CC.speak(c, st, "flat", "……", "tao", []), null, "a flat line that shows nothing changes nothing");
  const e = CC.speak(c, st, "flat", "此计可行", "tao", ["zhi"]);
  assert.deepEqual(e.values, ["zhi"]); assert.equal(st.v["rel.tao.esteem"], 3);
  CC.speak(c, st, "flat", "", "tao", ["zhi"]); CC.speak(c, st, "flat", "", "tao", ["zhi"]);
  assert.equal(st.v["rel.tao.esteem"], 4, "at most +2 on one axis in one scene");
  CC.speak(c, st, "flat", "", "tao", ["li", "nonsense-tag"]);
  assert.equal(st.v["rel.tao.trust"], 1, "unknown tags are ignored");
});
