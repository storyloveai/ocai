#!/usr/bin/env node
// Book-independent check for any campaign: static validation, random players, relationship budget.
//   node game/engine/tools/check.mjs path/to/campaign.json [runs] [--prev path/to/previous-volume.json]
// Exit code 1 when there is a blocking error. A book can add its own checks on top (game/sanguo/tools/check.js).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const require = createRequire(import.meta.url);
const CC = require(path.join(path.dirname(fileURLToPath(import.meta.url)), "../campaign_core.js"));

export function check(camp, runs = 2000, prev = null) {
  const out = [], pct = (a, b) => (100 * a / b).toFixed(1) + "%";
  const v = CC.validate(camp);
  out.push(`# ${typeof camp.title === "object" ? camp.title.zh : camp.title} · spec ${camp.spec} · engine ${CC.VERSION}${camp.pack ? " · pack " + camp.pack.id : ""}`);
  out.push(`\n## static: ${v.errors.length} errors, ${v.warnings.length} warnings`);
  v.errors.forEach(e => out.push("  ERROR " + e)); v.warnings.forEach(e => out.push("  warn  " + e));
  const S = CC.simulate(camp, runs, 11, null, { budget: !prev });
  let chained = null;
  if (prev) {
    const P = CC.simulate(prev, Math.min(runs, 3000), 5, null, { keep: true, budget: false });
    chained = CC.simulate(camp, Math.min(runs, 3000), 13, null, { carries: P.carries });
    chained.findings.filter(f => /saturating|barely moves/.test(f.msg)).forEach(f => S.findings.push(f));
  }
  out.push(`\n## ${runs} random players: ${S.length.toFixed(1)} scenes per run, ${S.distinctEndings} distinct endings`);
  const table = (title, X) => {
    out.push(`\n${title} (share of runs per tier 0–4 · moved at all · at 10; * = the axis the story reads)`);
    for (const [c, ch] of Object.entries(camp.chars)) for (const ax of Object.keys(ch.dims || {})) {
      const R = X.rel[`rel.${c}.${ax}`]; if (!R) continue;
      out.push(`  ${(c + "." + ax + (ax === ch.main ? "*" : "")).padEnd(22)}` + R.tiers.map(n => pct(n, X.runs).padStart(7)).join("") + `  · moved ${pct(R.moved, X.runs)} · max ${pct(R.max, X.runs)}`);
    }
  };
  if (camp.tiers) table("relationships at the end", S);
  if (chained) table("relationships at the end, played on from the previous volume", chained);
  out.push("\nending fragments:");
  for (const g of camp.endings) out.push(`  ${typeof g.title === "object" ? g.title.zh : g.title}: ` + g.fragments.map(f => `${f.id} ${pct(S.frags[g.id + "." + f.id] || 0, runs)}`).join(" · "));
  out.push(`\n## findings (${S.findings.length})`); S.findings.forEach(f => out.push(`  ${f.level.toUpperCase()} ${f.msg}`));
  const hard = v.errors.length + S.findings.filter(f => f.level === "error").length;
  out.push(hard ? `\nFAIL: ${hard} blocking issue(s)` : "\nPASS: no blocking issues");
  return { ok: !hard, text: out.join("\n"), validation: v, sim: S, chained };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), pi = args.indexOf("--prev");
  const prev = pi >= 0 ? JSON.parse(readFileSync(args.splice(pi, 2)[1], "utf8")) : null;
  const camp = JSON.parse(readFileSync(args[0], "utf8"));
  const r = check(camp, +(args[1] || 2000), prev);
  console.log(r.text); process.exit(r.ok ? 0 : 1);
}
