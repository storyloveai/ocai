#!/usr/bin/env node
// 状态一致性检查（决策记录 v0.22）：AI 改变了人物状态以后，剧本有没有“装作没发生”。
//   决裂：模拟玩家一有机会就对某位女主说下流话（走向 crude_<她>）。之后实际会演出的每一句台词里，她都不能再出场或说话
//         （决裂那场戏本身除外）。
//   记仇：模拟玩家对她说一句难听话（语气 rude，记一笔仇）。之后她每次出场，紧跟着都要有那句“冷场”旁白，直到和好。
// 用法：node tools/stance_check.mjs [campaign.json] [每种情况模拟的局数]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const CC = require("../../engine/campaign_core.js");
const camp = JSON.parse(readFileSync(process.argv[2] || new URL("../content/campaign.json", import.meta.url), "utf8"));
const RUNS = Number(process.argv[3] || 400);
const HEROINES = Object.keys(camp.chars).filter(c => camp.chars[c].romance);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const active = (st, op) => !op.when || CC.evalCond(st, op.when);
const problems = new Map();
const report = (k, where) => problems.set(k, (problems.get(k) || 0) + 1) && problems.get(k) === 1 && console.log("  ✗ " + k + "  @ " + where);

let coldShown = false;      // 这一幕里冷场已经出现过了（一幕一次就够）
function lines(st, ops, where, h, mode) {
  ops = ops || [];
  ops.forEach((op, i) => {
    if (!active(st, op) || op.who !== h || (op.op !== "say" && op.op !== "show")) return;
    if (mode === "broken" && st.v[`flag.broken_${h}`] && !where.startsWith(`x_break_${h}`))
      report(`决裂后${h}还在出场：${where}`, `${op.op} ${(op.t && (op.t.zh || "").slice(0, 24)) || ""}`);
    if (mode === "hurt" && op.op === "show" && !coldShown && st.v[`grudge.${h}`] >= 1 && !st.v[`flag.broken_${h}`]) {
      const next = ops.slice(i + 1, i + 3).find(o => active(st, o));
      if (!next || next.who || !(next.when && JSON.stringify(next.when).includes(`grudge.${h}`))) report(`记仇时${h}出场没有冷场：${where}`, "show");
      coldShown = true;
    }
  });
}

function play(h, mode) {
  const st = CC.newGame(camp); let acted = false, guard = 0, last = null;
  while (st.phase !== "end" && guard++ < 600) {
    if (st.phase === "side") { CC.pickSide(camp, st, st.offer[Math.floor(rnd() * st.offer.length)]); continue; }
    const n = camp.nodes[st.cur];
    if (st.cur !== last) { last = st.cur; coldShown = false; lines(st, n.script, n.id, h, mode); }
    // 玩家开口的那一刻：她在场、这一幕还能说话
    if (!acted && CC.castNow(camp, st).includes(h) && CC.freeLeft(camp, st) > 0) {
      if (mode === "broken") { const m = CC.moves(camp, st).find(x => x.id === `crude_${h}`); if (m) { acted = true; CC.chat(camp, st); CC.move(camp, st, m.id, "（下流话）"); continue; } }
      else { acted = true; coldShown = true; CC.chat(camp, st); CC.speak(camp, st, "rude", "（难听话）", h, []); }   // 当场她的回话就是冷的，这一幕不用再补冷场
    }
    const os = CC.choices(camp, st).filter(o => !o.locked);
    if (!os.length) { report(`卡住：${st.cur}`, "no open choice"); break; }
    const o = os[Math.floor(rnd() * os.length)];
    lines(st, o.c.script, `${n.id}.${o.id}`, h, mode);
    CC.choose(camp, st, o.id);
  }
  return acted;
}

let triggered = 0;
for (const h of HEROINES) for (const mode of ["broken", "hurt"]) {
  console.log(`${h} · ${mode === "broken" ? "说下流话（决裂）" : "说难听话（记仇）"}`);
  for (let r = 0; r < RUNS; r++) triggered += play(h, mode) ? 1 : 0;
}
console.log(`\n${HEROINES.length * 2 * RUNS} 局，其中 ${triggered} 局真的开了口`);
if (problems.size) { console.log(`FAIL: ${problems.size} 处剧本没跟上她的状态`); process.exit(1); }
console.log("PASS: 决裂后她不再出场；记仇时她一出场就有冷场");
