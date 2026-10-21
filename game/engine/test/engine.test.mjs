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
