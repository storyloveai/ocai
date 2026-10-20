#!/usr/bin/env node
// Static checks + Monte Carlo playtest for a campaign. Usage: node tools/check.js [campaign.json] [runs]
const fs = require("fs"), path = require("path");
const CC = require("../engine/campaign_core.js");
const file = process.argv[2] || path.join(__dirname, "../content/campaign.json");
const runs = +(process.argv[3] || 5000);
const camp = JSON.parse(fs.readFileSync(file, "utf8"));
const v = CC.validate(camp);
const ART = require("../engine/art.js");
for (const n of Object.values(camp.nodes)) if (n.art && !ART.scenes.includes(n.art.scene)) v.errors.push(`${n.id}: unknown art scene ${n.art.scene}`);
for (const sc of ART.scenes) if (!(camp.art_prompts || {})[sc]) v.warnings.push(`art scene ${sc}: no replacement prompt`);
for (const n of Object.values(camp.nodes)) { if (n.place && !ART.places.includes(n.place)) v.errors.push(`${n.id}: unknown place ${n.place}`); n.choices.forEach(c => { if (c.place && !ART.places.includes(c.place)) v.errors.push(`${n.id}.${c.id}: unknown place ${c.place}`); }); }
const PORTRAIT = require("../engine/portraits.js");
for (const n of Object.values(camp.nodes)) (n.cast || []).forEach(c => { if (!PORTRAIT.ids.includes(c.id)) v.errors.push(`${n.id}: cast has no portrait for ${c.id}`); });
for (const n of Object.values(camp.nodes)) if (n.talk) n.talk.topics.forEach(t => { if (t.mood && !PORTRAIT.moods.includes(t.mood)) v.errors.push(`${n.id}.${t.id}: unknown mood ${t.mood}`); });
for (const n of Object.values(camp.nodes)) { n.choices.forEach(c => { if (c.cg && !ART.cgs.includes(c.cg)) v.errors.push(`${n.id}.${c.id}: unknown cg ${c.cg}`); }); if (n.talk) n.talk.topics.forEach(t => { if (t.cg && !ART.cgs.includes(t.cg)) v.errors.push(`${n.id}.${t.id}: unknown cg ${t.cg}`); }); }
if (camp.realm) { for (const ch of camp.chapters) { const c = camp.realm.control[ch.id]; if (!c) v.errors.push(`realm: no control for ${ch.id}`); else for (const [pv, f] of Object.entries(c)) { if (!ART.provinces.includes(pv)) v.errors.push(`realm ${ch.id}: unknown province ${pv}`); [].concat(f).forEach(x => { if (!camp.realm.factions[x]) v.errors.push(`realm ${ch.id}: unknown faction ${x}`); }); } } }
const pct = (a, b) => (100 * a / b).toFixed(1) + "%";
console.log(`# ${camp.title.zh} · ${camp.volume.zh}`);
console.log(`nodes ${Object.keys(camp.nodes).length}, chapters ${camp.chapters.length}, echoes ${Object.keys(camp.echoes).length}, debts ${Object.keys(camp.debts).length}`);
console.log(`\n## static: ${v.errors.length} errors, ${v.warnings.length} warnings`);
v.errors.forEach(e => console.log("  ERROR " + e));
v.warnings.forEach(e => console.log("  warn  " + e));
const S = CC.simulate(camp, runs, 11);
console.log(`\n## simulate: ${runs} random players`);
console.log(`avg scenes per run ${S.length.toFixed(1)}, distinct ending combinations ${S.distinctEndings}`);
console.log("track:", Object.entries(S.track).map(([k, n]) => `${k} ${pct(n, runs)}`).join(", "));
console.log("deviation:", Object.entries(S.deviation).map(([k, n]) => `${k}:${pct(n, runs)}`).join(" "));
console.log("uncanny:", Object.entries(S.uncanny).map(([k, n]) => `${k}:${pct(n, runs)}`).join(" "));
console.log("\nending fragments:");
for (const g of camp.endings) console.log(`  ${g.title.zh}: ` + g.fragments.map(f => `${f.id} ${pct(S.frags[g.id + "." + f.id] || 0, runs)}`).join(" · "));
console.log("\nechoes (registered → paid):");
for (const id of Object.keys(camp.echoes)) console.log(`  ${id}: ${S.echoReg[id] || 0} → ${S.echoPaid[id] || 0}`);
console.log("\ndebts:", JSON.stringify(S.debtModes));
console.log("\nside offers (times offered):", JSON.stringify(S.offered));
// archetype players: does each kind of player reach the ending they are playing for?
const GOALS = {
  romance: [["g_wenzhi", ["married", "with_you", "together", "cao_saved"]], ["g_wenzhi", ["married", "with_you", "together", "cao_saved", "safe"]]],
  loyal: [["g_lord", ["liu_high"]], ["g_name", ["loyal"]]],
  schemer: [["g_side", ["cao"]], ["g_lord", ["cao_high"]], ["g_name", ["cunning"]]],
  seer: [["g_name", ["uncanny"]], ["g_side", ["exposed"]]],
  provoker: [["g_lives", ["flogged"]], ["g_lives", ["jail"]], ["g_side", ["miheng"]], ["g_name", ["rash"]]],
};
const arche = {};
console.log("\n## archetype players (1000 runs each)");
for (const [pol, goals] of Object.entries(GOALS)) {
  const A = CC.simulate(camp, 1000, 23, pol); arche[pol] = A;
  const rate = (g, fs) => fs.reduce((t, f) => t + (A.frags[g + "." + f] || 0), 0) / A.runs;
  const early = Object.values(A.early).reduce((a, b) => a + b, 0) / A.runs;
  console.log(`  ${pol.padEnd(8)} ` + goals.map(([g, fs]) => `${g}:${fs.join("|")} ${(100 * rate(g, fs)).toFixed(0)}%`).join(" · ") + ` · early end ${(100 * early).toFixed(0)}% · scenes ${A.length.toFixed(1)}`);
  A.findings.filter(f => f.level === "error" || f.msg.startsWith("provoked")).forEach(f => S.findings.push(f));
  if (pol === "provoker") {
    console.log("    on-the-spot breaks (scene:kind:who):", JSON.stringify(Object.fromEntries(Object.entries(A.flares).sort((a, b) => b[1] - a[1]).slice(0, 12))));
    // a choice the provoker reaches is not dead content, even if random players never see it
    S.findings = S.findings.filter(f => { const m = /^choice (\S+) never available/.exec(f.msg); return !(m && A.choiceOpen[m[1]]); });
  }
}
console.log("\ntalk topics taken (random):", JSON.stringify(S.topics));
console.log("early endings (random):", JSON.stringify(S.early));
console.log(`\n## findings (${S.findings.length})`);
S.findings.forEach(f => console.log(`  ${f.level.toUpperCase()} ${f.msg}`));
const hard = v.errors.length + S.findings.filter(f => f.level === "error").length;
console.log(hard ? `\nFAIL: ${hard} blocking issues` : "\nPASS: no blocking issues");
process.exit(hard ? 1 : 0);
