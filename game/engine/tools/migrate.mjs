#!/usr/bin/env node
// Upgrade a spec 0.3 campaign to 0.4 (unified relationships, tiers, a genre pack).
//
//   node game/engine/tools/migrate.mjs in.json out.json --pack cultivation \
//        --res power=qi --res currency=stones --res body=health --res risk=exposure
//
// What it does, all reported line by line so an author can check it:
//   1. every relationship variable moves to the 0–10 scale (init values are rescaled; +1/-1 effects stay as written)
//   2. every relationship threshold snaps to the nearest tier boundary (>= to a tier start, <= to a tier end)
//   3. characters get the axes they lack (warmth / trust / esteem), starting at tier 1
//   4. the pack, the tiers and the resource mapping are written in, and the spec becomes 0.4
// It does not tag choices with values or give characters value tables: that is writing, not conversion.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CC = require(path.join(HERE, "../campaign_core.js"));
const TIERS = JSON.parse(readFileSync(path.join(HERE, "../tiers.json"), "utf8"));

export function migrate(src, { pack, res = {}, axisInit = 2 } = {}) {
  const camp = structuredClone(src), log = [];
  if (CC.specLevel(camp) !== 3) throw new Error(`expected a spec 0.3 campaign, got ${camp.spec}`);
  const P = JSON.parse(readFileSync(path.join(HERE, "../packs", pack + ".json"), "utf8"));
  const zh = x => (x && typeof x === "object" ? x.zh : x);
  // 1. rescale relationship variables
  const scale = {};
  for (const [k, d] of Object.entries(camp.vars)) if (k.startsWith("rel.")) {
    const f = 10 / ((d.max ?? 10) - (d.min ?? 0)); scale[k] = f;
    if (f !== 1) { const init = Math.round((d.init || 0) * f); log.push(`${k}: scale ${d.min ?? 0}–${d.max} → 0–10, start ${d.init} → ${init}`); d.init = init; }
    d.min = 0; d.max = 10;
  }
  // 2. snap thresholds to tiers, wherever conditions appear
  const near = (list, x) => list.reduce((b, s) => (Math.abs(s - x) < Math.abs(b - x) || (Math.abs(s - x) === Math.abs(b - x) && s < b) ? s : b), list[0]);
  (function walk(o, at) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) return o.forEach((x, i) => walk(x, `${at}[${i}]`));
    if (typeof o.v === "string" && o.v.startsWith("rel.") && typeof o.op === "string" && typeof o.val === "number") {
      const f = scale[o.v] || 1, before = `${o.op} ${o.val}`;
      let op = o.op, x = o.val;
      if (op === ">") { op = ">="; x += 1; } if (op === "<") { op = "<="; x -= 1; }
      if (op === ">=") o.val = near(TIERS.start, x * f); else if (op === "<=") o.val = near(TIERS.end, x * f);
      else { log.push(`${at}: ${o.v} ${before} — left as is, check by hand`); return; }
      o.op = op;
      if (`${o.op} ${o.val}` !== before) log.push(`${at}: ${o.v} ${before} → ${o.op} ${o.val}`);
      return;
    }
    for (const k of Object.keys(o)) walk(o[k], `${at}.${k}`);
  })({ nodes: camp.nodes, endings: camp.endings, chapters: camp.chapters, witness: camp.witness, commit_rules: camp.commit_rules }, "camp");
  // 3. fill in missing axes
  for (const [cid, ch] of Object.entries(camp.chars)) {
    ch.dims = ch.dims || {};
    for (const a of CC.AXES) if (!ch.dims[a]) {
      ch.dims[a] = { label: zh(TIERS.axis_names[a]) };
      camp.vars[`rel.${cid}.${a}`] = { type: "num", init: axisInit, min: 0, max: 10, label: `${zh(ch.name)} · ${zh(TIERS.axis_names[a])}`, show: true, char: cid, dim: a };
      log.push(`${cid}: added ${a}, starting at ${axisInit}`);
    }
    if (!ch.main) { ch.main = "trust"; log.push(`${cid}: main axis set to trust`); }
  }
  camp.dims = Object.fromEntries(CC.AXES.map(a => [a, { label: zh(TIERS.axis_names[a]) }]));
  // 4. spec, tiers, pack, resources
  camp.spec = "storydate.campaign/0.4"; camp.tiers = { start: TIERS.start, end: TIERS.end, names: TIERS.names };
  camp.pack = P; camp.resources = res; camp.value_tags = P.values;
  return { camp, log };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [inp, out, ...rest] = process.argv.slice(2); const opt = { res: {} };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--pack") opt.pack = rest[++i];
    else if (rest[i] === "--res") { const [r, v] = rest[++i].split("="); (opt.res[r] = opt.res[r] || []).push(...v.split(",")); }
  }
  if (!inp || !out || !opt.pack) { console.error("usage: migrate.mjs in.json out.json --pack <id> [--res role=var,var]..."); process.exit(2); }
  const { camp, log } = migrate(JSON.parse(readFileSync(inp, "utf8")), opt);
  writeFileSync(out, JSON.stringify(camp, null, 1));
  console.log(log.join("\n"));
  const v = CC.validate(camp);
  console.log(`\nvalidate: ${v.errors.length} errors, ${v.warnings.length} warnings`); v.errors.forEach(e => console.log("  ERROR " + e));
}
