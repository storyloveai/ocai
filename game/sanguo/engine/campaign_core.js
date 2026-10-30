/* StoryDate campaign engine — shared by every book. Canonical copy: game/engine/campaign_core.js
 * (books keep a byte-identical copy; CI checks it). Engine version CC.VERSION; reads campaigns of spec
 * storydate.campaign/0.3 (legacy: relationship model not enforced) and /0.4 (unified relationships,
 * tiers and a genre pack). See game/engine/README.md.
 * Pure functions, no DOM. Works in the browser (window.CC) and in Node (require).
 *
 * Layers (see 研究文档 §6–§7):
 *   rules      — conditions, effects, clamps. Only the rules change state.
 *   ledger     — append-only record of every change and its cause; endings are explained from it.
 *   director   — picks which side storylets to offer this chapter (salience: base + specificity + due echoes).
 *   echoes     — major choices register an echo; later nodes pay it with a callback line.
 *   debts      — when a choice removes the cause of a locked plot function, a debt opens and must be
 *                resolved later by transform / reroute / cancel.
 */
(function (root) {
  "use strict";
  const CC = {};
  CC.VERSION = "0.4.4";
  CC.SPECS = ["storydate.campaign/0.3", "storydate.campaign/0.4"];
  // 3 for legacy campaigns, 4 for campaigns on the unified relationship model + tiers + genre pack
  CC.specLevel = camp => { const m = /^storydate\.campaign\/0\.(\d+)$/.exec(camp.spec || ""); return m ? +m[1] : 0; };

  /* ---------------- conditions ---------------- */
  function getVar(st, name) { return st.v[name]; }
  function resolveVal(st, val) { return (typeof val === "string" && val[0] === "@") ? st.v[val.slice(1)] : val; }
  function evalCond(st, c) {
    if (!c) return true;
    if (c.all) return c.all.every(x => evalCond(st, x));
    if (c.any) return c.any.some(x => evalCond(st, x));
    const a = getVar(st, c.v), b = resolveVal(st, c.val);
    switch (c.op) {
      case "==": return (a === undefined ? false : a) === b;
      case "!=": return (a === undefined ? false : a) !== b;
      case ">=": return (a || 0) >= b;
      case "<=": return (a || 0) <= b;
      case ">": return (a || 0) > b;
      case "<": return (a || 0) < b;
      default: throw new Error("bad op " + c.op);
    }
  }
  function atoms(c, out = []) {
    if (!c) return out;
    if (c.all) c.all.forEach(x => atoms(x, out));
    else if (c.any) c.any.forEach(x => atoms(x, out));
    else out.push(c);
    return out;
  }
  function condVars(c) {
    const s = new Set();
    atoms(c).forEach(a => { s.add(a.v); if (typeof a.val === "string" && a.val[0] === "@") s.add(a.val.slice(1)); });
    return [...s];
  }
  CC.evalCond = evalCond; CC.atoms = atoms; CC.condVars = condVars;

  /* ---------------- state ---------------- */
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  CC.rng = rng;

  /* A volume can start from where the previous one ended (carry = that volume's final state), or from a preset
   * (carry = { v: {...} } describing a typical earlier playthrough). Variables with the same name carry over,
   * except per-scene ones (heat.*) and narrative debts, which belong to their own volume. People also remember
   * what was said (mem) and promises still open stay open. */
  CC.carryable = (camp, name) => !!camp.vars[name] && camp.vars[name].carry !== false && !name.startsWith("heat.") && !name.startsWith("debt.") && name !== "ended_early";
  /* v2.3: each new volume pulls high relationship values back toward the middle (time passes; people change),
   * so a player who maxed someone out in an earlier volume still has room to grow. Values at or below the pivot
   * are kept as they are: a grudge or a cold shoulder carries over in full. */
  CC.compress = (camp, val) => {
    const cc = camp.carry_compress; if (!cc || val <= cc.pivot) return val;
    return Math.round(cc.pivot + (val - cc.pivot) * cc.k);
  };
  CC.tierOf = (camp, val) => { const t = camp.tiers; if (!t) return null; let k = 0; t.start.forEach((s, i) => { if (val >= s) k = i; }); return k; };
  CC.newGame = function (camp, carry) {
    const v = {};
    for (const [k, d] of Object.entries(camp.vars)) v[k] = d.init;
    for (const id of Object.keys(camp.debts)) v["debt." + id] = "none";
    const st = { v, vol: camp.id, ch: -1, phase: "start", cur: null, offer: [], lastOrder: -1, ledger: [], log: [], echoes: {}, seq: 0, done: [] };
    if (carry && carry.v) {
      const e = ledgerPush(st, { kind: "carry", node: null, choice: null, from: carry.vol || null, preset: carry.preset || null, changes: [], debts: [], echo: [] });
      for (let [k, val] of Object.entries(carry.v)) {
        if (!CC.carryable(camp, k) || val === undefined) continue;
        if (k.startsWith("rel.") && typeof val === "number") { const c = CC.compress(camp, val); if (c !== val) (e.compressed = e.compressed || []).push({ var: k, was: val, now: c }); val = c; }
        if (val === v[k]) continue;
        e.changes.push({ var: k, from: v[k], to: val }); v[k] = val;
      }
      if (carry.mem) st.mem = JSON.parse(JSON.stringify(carry.mem));
      if (carry.commits) st.commits = carry.commits.filter(k => k.status === "open").map(k => Object.assign({}, k, { prev: true }));
      if (carry.said) st.said = carry.said.slice();
      st.log.push({ k: "carry", from: carry.vol || null, preset: carry.preset || null, seq: e.seq });
    }
    enterChapter(camp, st, 0);
    return st;
  };
  // what a finished volume hands to the next one
  CC.carryOut = st => ({ vol: st.vol, v: Object.assign({}, st.v, st.v.ended_early ? { "prev.ended_early": true } : {}), ended_early: !!st.v.ended_early, mem: st.mem || {}, commits: st.commits || [], said: st.said || [] });
  CC.clone = st => JSON.parse(JSON.stringify(st));

  function chapterOf(camp, st) { return camp.chapters[st.ch]; }
  function nodesIn(camp, chId, kind) {
    return Object.values(camp.nodes).filter(n => n.chapter === chId && n.kind === kind).sort((a, b) => a.order - b.order);
  }

  function ledgerPush(st, e) { e.seq = ++st.seq; e.ch = st.ch; st.ledger.push(e); return e; }

  /* 0.4.1 hard tiers: camp.hard_tiers = { "rel.liubei.trust": 3 } means that once the value has reached that tier
   * (e.g. 倚重), ordinary gains no longer raise it; only an effect marked { key: true } (a key moment) can carry
   * it into the next tier. Losses always apply. The entry records what was held back (entry.held). */
  CC.heldBack = (camp, name, from, ef) => {
    const hard = camp.hard_tiers && camp.hard_tiers[name];
    if (hard === undefined || !ef.add || !(ef.by > 0) || ef.key) return false;
    const t = CC.tierOf(camp, from || 0); return t !== null && t >= hard;
  };
  function applyEffects(camp, st, effects, entry) {
    for (const ef of effects || []) {
      const name = ef.set || ef.add;
      const d = camp.vars[name];
      if (!d) throw new Error("unknown var " + name);
      const from = st.v[name];
      if (CC.heldBack(camp, name, from, ef)) { (entry.held = entry.held || []).push(name); continue; }
      let to = ef.set !== undefined && "to" in ef ? ef.to : (from || 0) + ef.by;
      if (d.type === "num") to = Math.max(d.min, Math.min(d.max, to));
      st.v[name] = to;
      if (from !== to) entry.changes.push({ var: name, from, to });
    }
  }
  function openDebt(st, id, entry) {
    const k = "debt." + id;
    if (st.v[k] === "none") { st.v[k] = "open"; entry.changes.push({ var: k, from: "none", to: "open" }); entry.debts.push([id, "open"]); }
  }
  function resolveDebt(st, id, mode, entry) {
    const k = "debt." + id;
    if (st.v[k] === "open") { st.v[k] = mode; entry.changes.push({ var: k, from: "open", to: mode }); entry.debts.push([id, mode]); return true; }
    return false;
  }

  /* ---------------- art layers & places ---------------- */
  // a layer without "choice" shows when its condition holds; a layer with "choice" appears only after that option is taken
  CC.layers = function (camp, st, defs, choiceId) {
    const out = [];
    for (const l of defs || []) {
      if (l.choice && l.choice !== choiceId) continue;
      if (!evalCond(st, l.when)) continue;
      if (!out.includes(l.id)) out.push(l.id);
    }
    return out;
  };
  CC.stops = function (camp, st) {
    const out = [];
    const push = p => { if (p && out[out.length - 1] !== p) out.push(p); };
    for (const e of st.log) {
      if (e.k === "node") push(camp.nodes[e.n].place);
      if (e.k === "choice") { const c = camp.nodes[e.n].choices.find(x => x.id === e.c); push(c.place); }
    }
    return out;
  };

  /* ---------------- director ---------------- */
  CC.director = function (camp, st, chId) {
    const chap = camp.chapters.find(c => c.id === chId);
    const out = [];
    for (const n of nodesIn(camp, chId, "side")) {
      const eligible = !st.done.includes(n.id) && evalCond(st, n.when);
      const spec = atoms(n.when).length;
      const due = (n.callbacks || []).filter(c => st.echoes[c.pays] && !st.echoes[c.pays].paid.length && evalCond(st, c.when)).length;
      out.push({ id: n.id, eligible, base: n.salience || 0, spec, due, score: (n.salience || 0) + 2 * spec + 3 * due });
    }
    const ranked = out.filter(x => x.eligible).sort((a, b) => b.score - a.score || camp.nodes[a.id].order - camp.nodes[b.id].order);
    const n = Math.max(1, (chap.offer || 2) - (st.v["flag.sidelined"] ? 1 : 0));
    return { all: out, offer: ranked.slice(0, n).map(x => x.id) };
  };

  function enterChapter(camp, st, i) {
    if (i >= camp.chapters.length) { checkCommits(camp, st, true); st.phase = "end"; st.cur = null; st.log.push({ k: "end" }); return; }
    st.ch = i; st.lastOrder = -1;
    const chap = chapterOf(camp, st);
    st.log.push({ k: "ch", c: chap.id, p: idxWhere(st, chap.intro) });
    checkCommits(camp, st, false);
    // interrupts: crises that pre-empt a chapter when a meter crosses its line (disfavor, exposure)
    const intr = Object.values(camp.nodes).filter(n => n.kind === "interrupt" && !st.done.includes(n.id) && evalCond(st, n.when)).sort((a, b) => a.order - b.order)[0];
    if (intr) return enterNode(camp, st, intr.id);
    chapterBody(camp, st);
  }
  function chapterBody(camp, st) {
    const chap = chapterOf(camp, st);
    // main_first: the chapter opens on its main scene (a cold open); its side storylets are offered afterwards
    if (chap.main_first && st.sidedCh !== chap.id && st.lastOrder === -1) return nextMain(camp, st);
    offerSides(camp, st);
  }
  function offerSides(camp, st) {
    const chap = chapterOf(camp, st);
    st.sidedCh = chap.id;
    const hasSides = nodesIn(camp, chap.id, "side").length > 0;
    const d = CC.director(camp, st, chap.id);
    if (d.offer.length) {
      st.phase = "side"; st.offer = d.offer; st.cur = null;
      st.log.push({ k: "offer", c: chap.id, ids: d.offer, scores: d.all });
      return;
    }
    if (hasSides) st.log.push({ k: "sys", key: "quiet" });
    nextMain(camp, st);
  }
  function idxWhere(st, paras) { const r = []; (paras || []).forEach((p, i) => { if (evalCond(st, p.when)) r.push(i); }); return r; }

  function nextMain(camp, st) {
    const chap = chapterOf(camp, st);
    const n = nodesIn(camp, chap.id, "main").find(n => n.order > st.lastOrder && !st.done.includes(n.id) && evalCond(st, n.when));
    if (!n) return chap.main_first && st.sidedCh !== chap.id ? offerSides(camp, st) : enterChapter(camp, st, st.ch + 1);
    st.lastOrder = n.order;
    enterNode(camp, st, n.id);
  }

  function enterNode(camp, st, id) {
    const n = camp.nodes[id];
    if (n.kind !== "flash") for (const k of Object.keys(st.v)) if (k.startsWith("heat.")) st.v[k] = 0; // tension is per scene
    st.cur = id; st.phase = "node"; st.offer = [];
    if (n.talk) { st.turns = st.turns || {}; st.turns[id] = n.talk.turns; }
    const oe = [];
    (n.on_enter || []).forEach((o, i) => {
      if (!evalCond(st, o.when)) return;
      const e = ledgerPush(st, { kind: "enter", node: id, choice: null, changes: [], debts: [], echo: [] });
      applyEffects(camp, st, o.effects, e);
      (o.resolve || []).forEach(([d, m]) => resolveDebt(st, d, m, e));
      oe.push(i);
    });
    // callbacks: pay pending echoes first, then most specific; at most two lines
    const cands = (n.callbacks || []).map((c, i) => ({ c, i })).filter(({ c }) => st.echoes[c.pays] && evalCond(st, c.when));
    cands.sort((a, b) => (st.echoes[a.c.pays].paid.length - st.echoes[b.c.pays].paid.length) || (st.echoes[b.c.pays].at - st.echoes[a.c.pays].at) || (atoms(b.c.when).length - atoms(a.c.when).length) || a.i - b.i);
    const cbs = cands.slice(0, 2).map(x => x.i);
    cbs.forEach(i => st.echoes[n.callbacks[i].pays].paid.push({ node: id, seq: st.seq }));
    st.log.push({ k: "node", n: id, p: idxWhere(st, n.intro), oe, cb: cbs, al: n.art ? CC.layers(camp, st, n.art.layers, null) : [], rel: Object.fromEntries(Object.entries(st.v).filter(([k]) => k.startsWith("rel."))) });
  }

  CC.pickSide = function (camp, st, id) {
    if (st.phase !== "side" || !st.offer.includes(id)) throw new Error("not offered: " + id);
    const missed = st.offer.filter(x => x !== id);
    missed.forEach(m => ledgerPush(st, { kind: "missed", node: m, choice: null, changes: [], debts: [], echo: [] }));
    st.log.push({ k: "pick", n: id, missed });
    enterNode(camp, st, id);
  };

  CC.choices = function (camp, st, nodeId) {
    const n = camp.nodes[nodeId || st.cur];
    return n.choices.map(c => ({ id: c.id, c, visible: evalCond(st, c.when), locked: !!c.req && !evalCond(st, c.req) })).filter(x => x.visible);
  };

  /* ---------------- open questions ----------------
   * A scene can open with someone asking you something there is no button for. You answer in your own words;
   * the model (or keywords) only sorts the answer into one of the authored kinds, and the rules settle it. */
  CC.ask = function (camp, st) {
    const n = st.phase === "node" && camp.nodes[st.cur];
    if (!n || !n.ask || (st.asked && st.asked[n.id]) || !evalCond(st, n.ask.when)) return null;
    if (!CC.castNow(camp, st).includes(n.ask.who)) return null;
    return n.ask;
  };
  CC.guessAnswer = function (camp, st, text) {
    const a = CC.ask(camp, st); if (!a) return null;
    const hit = a.answers.find(x => x.match && new RegExp(x.match, "i").test(text || ""));
    return hit ? hit.id : a.fallback;
  };
  CC.answer = function (camp, st, aid, said) {
    const n = camp.nodes[st.cur], a = CC.ask(camp, st);
    if (!a) throw new Error("nothing asked");
    const ans = a.answers.find(x => x.id === aid) || a.answers.find(x => x.id === a.fallback);
    st.asked = st.asked || {}; st.asked[n.id] = ans.id;
    const e = ledgerPush(st, { kind: "answer", node: n.id, choice: null, answer: ans.id, to: a.who, said: (said || "").slice(0, 40), changes: [], debts: [], echo: [] });
    applyEffects(camp, st, ans.effects, e);
    if (ans.id === "rude") { st.grudge = st.grudge || {}; st.grudge[a.who] = (st.grudge[a.who] || 0) + 1; e.offend = a.who; } // answering with an insult is an insult
    (ans.echo || []).forEach(id => { if (!st.echoes[id]) { st.echoes[id] = { at: e.seq, node: n.id, paid: [] }; e.echo.push(id); } });
    st.log.push({ k: "ans", n: n.id, a: ans.id, said: (said || "").slice(0, 120), p: idxWhere(st, ans.out), seq: e.seq });
    const fl = flare(camp, st, a.who); if (fl) e.flare = fl;
    return e;
  };

  CC.choose = function (camp, st, cid) {
    if (st.phase !== "node") throw new Error("no node");
    if (CC.ask(camp, st)) CC.answer(camp, st, CC.ask(camp, st).fallback, ""); // a choice without answering counts as the non-answer
    if (st.phase !== "node") throw new Error("scene ended");
    const n = camp.nodes[st.cur];
    const opt = CC.choices(camp, st).find(x => x.id === cid);
    if (!opt || opt.locked) throw new Error("choice unavailable: " + cid);
    const c = opt.c;
    const outIdx = idxWhere(st, c.out); // text reflects the state at the moment of choosing
    const e = ledgerPush(st, { kind: "choice", node: n.id, choice: c.id, changes: [], debts: [], echo: [] });
    const alt = (c.alt || []).find(a => evalCond(st, a.when)); // what was said in this scene can change what a choice does
    if (alt) e.alt = (c.alt || []).indexOf(alt);
    // someone you provoked in this scene doesn't warm to you from the choice that follows
    const cooled = [];
    const effs = (alt ? alt.effects : c.effects).filter(ef => {
      const m = /^rel\.(\w+)\.(\w+)$/.exec(ef.add || ""); if (!m || ef.by <= 0) return true;
      const ch = camp.chars[m[1]]; if (!ch || (ch.main || Object.keys(ch.dims)[0]) !== m[2] || (st.v["heat." + m[1]] || 0) < 2) return true;
      cooled.push(m[1]); return false; });
    if (cooled.length) e.cooled = cooled;
    const present = CC.castNow(camp, st);
    applyEffects(camp, st, effs, e);
    react(camp, st, c, effs, present, e);
    (c.debt || []).forEach(d => openDebt(st, d, e));
    (c.resolve || []).forEach(([d, m]) => resolveDebt(st, d, m, e));
    (c.echo || []).forEach(id => { if (!st.echoes[id]) { st.echoes[id] = { at: e.seq, node: n.id, paid: [] }; e.echo.push(id); } });
    st.log.push({ k: "choice", n: n.id, c: c.id, p: outIdx, seq: e.seq, al: n.art ? CC.layers(camp, st, n.art.layers, c.id) : [] });
    st.done.push(n.id);
    st.cur = null;
    if (c.ends) { st.v.ended_early = true; st.flash = null; enterChapter(camp, st, camp.chapters.length); }
    else if (n.kind === "flash") {
      const f = st.flash || {}; st.flash = null;
      if (f.resume) { st.cur = f.from; st.phase = "node"; st.log.push({ k: "resume", n: f.from }); }
      else { st.done.push(f.from); const fk = camp.nodes[f.from].kind; if (fk === "interrupt") chapterBody(camp, st); else nextMain(camp, st); }
    }
    else if (n.kind === "interrupt") chapterBody(camp, st);
    else nextMain(camp, st);
    return e;
  };

  /* everyone present reacts to what a choice stands for, by their own values (unless the author already wrote their reaction) */
  CC.AXES = ["warmth", "trust", "esteem"];
  function react(camp, st, c, effs, present, e) {
    if (!(c.values || []).length) return;
    const out = [];
    for (const cid of present) {
      const ch = camp.chars[cid]; if (!ch || !ch.values) continue;
      if (effs.some(ef => (ef.add || ef.set || "").startsWith(`rel.${cid}.`))) continue;
      const sum = {};
      c.values.forEach(tag => { const r = ch.values[tag]; if (r) sum[r[0]] = (sum[r[0]] || 0) + r[1]; });
      for (const [axis, by] of Object.entries(sum)) {
        const d = Math.max(-1, Math.min(1, by)), v = `rel.${cid}.${axis}`;
        if (!d || !camp.vars[v]) continue;
        if (d > 0 && (st.v["heat." + cid] || 0) >= 2) continue;
        out.push({ add: v, by: d });
      }
    }
    if (out.length) { e.reacted = out.map(x => x.add.split(".")[1]); applyEffects(camp, st, out, e); }
  }

  /* ---------------- night talks ---------------- */
  // A talk node has a turn budget. Topics are rule-backed (fixed reply + effects, once each);
  // free lines that match no topic only spend a turn. Leaving is an ordinary choice.
  CC.turnsLeft = (camp, st) => (st.turns && st.turns[st.cur]) || 0;
  CC.topics = function (camp, st) {
    const n = camp.nodes[st.cur]; if (!n || !n.talk) return [];
    const used = (st.used && st.used[n.id]) || [];
    return n.talk.topics.filter(t => !used.includes(t.id) && evalCond(st, t.when)).map(t => ({ id: t.id, t, locked: !!t.req && !evalCond(st, t.req) }));
  };
  // free talk tone: the model (or a keyword fallback) may only pick a label; the rule decides the effect, once per talk
  /* ---------------- free speech → consequences ----------------
   * The model (or the keyword fallback) only assigns a label. These rules turn labels into effects:
   * every line counts, repeats have diminishing returns, and each character's main bond moves at most ±2 a night.
   * Lines also leave lasting impressions (imp.<char>.<kind>) and a public name (renown.rash) that authored content reads. */
  CC.LABELS = ["warm", "rude", "romantic", "flatter", "nonsense", "threat", "flat"];
  CC.TONE = { warm: 1, rude: -1, romantic: 1, flatter: 1, nonsense: 0, threat: -2, flat: 0 }; // kept for compatibility
  function speechRule(camp, st, cid, label, k) {
    const ch = camp.chars[cid], main = `rel.${cid}.${ch.main || Object.keys(ch.dims)[0]}`;
    const imp = kind => `imp.${cid}.${kind}`;
    const has = v => !!camp.vars[v];
    const out = []; const add = (v, by) => { if (has(v) && by) out.push({ add: v, by }); };
    switch (label) {
      case "warm": add(main, k === 1 ? 1 : 0); break;
      case "flatter": add(main, k === 1 ? 1 : k === 2 ? 0 : -1); if (k >= 2) add(imp("flattery"), 1); break;
      case "rude": add(main, -1); add(imp("offended"), 1); add("renown.rash", 1); break;
      case "threat": add(main, -2); add(imp("offended"), 2); add("renown.rash", 2); break;
      case "nonsense": if (k >= 2) { add(main, -1); add("renown.rash", 1); } add(imp("odd"), 1); break;
      case "romantic":
        if (ch.romance) {
          if ((st.v[main] || 0) < 2) add(`rel.${cid}.trust`, -1);
          else add(main, k === 1 ? 1 : k === 2 ? 0 : -1);
        } else { if (k >= 2) add(imp("frivolous"), 1); if (k >= 3) add(main, -1); }
        break;
    }
    return out;
  }
  CC.speak = function (camp, st, label, said, who, values) {
    const n = camp.nodes[st.cur];
    const cid = who || (n && n.talk && n.talk.char);
    // what the line shows of the speaker (义 智 仁 勇 诚 利…): everyone present reads it by their own values
    const vt = [...new Set(values || [])].filter(v => (camp.value_tags || {})[v]).slice(0, 2);
    if (!n || !cid || !camp.chars[cid] || !CC.LABELS.includes(label) || (label === "flat" && !vt.length)) return null;
    const key = n.id + "|" + cid;
    st.labels = st.labels || {}; const L = (st.labels[key] = st.labels[key] || {}); L[label] = (L[label] || 0) + 1;
    let eff = speechRule(camp, st, cid, label, L[label]);
    // a grudge (0.4.4): insults and threats are remembered for the rest of the volume. While someone holds one, kind or
    // admiring words don't move them; sincere warmth first works the grudge off, one line at a time. Actions still count.
    st.grudge = st.grudge || {}; const held = st.grudge[cid] || 0; let mend = false, offend = 0;
    if (label === "rude" || label === "threat") { offend = label === "threat" ? 2 : 1; st.grudge[cid] = held + offend; }
    else if (held > 0 && ["warm", "flatter", "romantic"].includes(label)) {
      eff = eff.filter(ef => !(ef.by > 0 && ef.add.startsWith(`rel.${cid}.`)));
      if (label === "warm") { st.grudge[cid] = held - 1; mend = true; }
    }
    // cap: the main bond moves at most ±2 per night with one person
    st.night = st.night || {}; const used = st.night[key] || 0;
    const ch = camp.chars[cid], main = `rel.${cid}.${ch.main || Object.keys(ch.dims)[0]}`;
    eff = eff.map(ef => { if (ef.add !== main) return ef; const by = Math.max(-2 - used, Math.min(2 - used, ef.by)); return { add: ef.add, by }; }).filter(ef => ef.by);
    const mainBy = eff.filter(ef => ef.add === main).reduce((a, ef) => a + ef.by, 0);
    st.night[key] = used + mainBy;
    // each person reads provocation their own way: heat is this scene's tension with them
    const hv = heatOf(camp, cid, label, L[label]);
    if (hv && camp.vars["heat." + cid]) eff.push({ add: "heat." + cid, by: hv });
    const cast = CC.castNow(camp, st), blocked = [];
    if (vt.length) eff.push(...valueReactions(camp, st, n, [cid].concat(cast.filter(x => x !== cid)), vt, { hostile: offend ? cid : null, heatNow: { [cid]: (st.v["heat." + cid] || 0) + hv }, blocked }));
    // the others present hear it too
    st.witnessed = st.witnessed || {};
    (camp.witness || []).forEach((w, i) => {
      const wk = n.id + "|" + i;
      if (w.to === cid && w.labels.includes(label) && cast.includes(w.who) && !st.witnessed[wk]) { st.witnessed[wk] = 1; eff.push(...w.effects); }
    });
    if (held > 0 && !offend && !mend && ["flatter", "romantic"].includes(label)) blocked.push(cid);
    if (!eff.length && !mend && !offend && !blocked.length) return null;
    const e = ledgerPush(st, { kind: "talk", node: n.id, choice: null, topic: null, tone: label, to: cid, said: (said || "").slice(0, 40), changes: [], debts: [], echo: [] });
    if (vt.length) e.values = vt;
    if (offend) e.offend = cid; if (mend) e.mend = cid; if (blocked.length) e.grudge = [...new Set(blocked)];
    applyEffects(camp, st, eff, e);
    const fl = flare(camp, st, cid);
    if (fl) e.flare = fl;
    return e.changes.length || fl || e.offend || e.mend || e.grudge ? e : null;
  };
  // each person moves at most ±1 per axis per line, and ±2 per axis over a whole scene, from what your words showed
  function valueReactions(camp, st, n, people, vt, o = {}) {
    st.vcap = st.vcap || {}; const out = [];
    for (const c of people) {
      const ch = camp.chars[c]; if (!ch || !ch.values) continue;
      const sum = {}; vt.forEach(tag => { const r = ch.values[tag]; if (r) sum[r[0]] = (sum[r[0]] || 0) + r[1]; });
      for (const [axis, by] of Object.entries(sum)) {
        const v = `rel.${c}.${axis}`; if (!camp.vars[v]) continue;
        let d = Math.max(-1, Math.min(1, by)); if (!d) continue;
        // no one warms to you from a line that insults them, from someone you provoked here, or while they hold a grudge
        if (d > 0 && (c === o.hostile || ((o.heatNow || {})[c] ?? (st.v["heat." + c] || 0)) >= 2 || ((st.grudge || {})[c] || 0) > 0)) { if (o.blocked && c !== o.hostile) o.blocked.push(c); continue; }
        const k = n.id + "|" + v, used = st.vcap[k] || 0;
        d = Math.max(-2 - used, Math.min(2 - used, d)); if (!d) continue;
        st.vcap[k] = used + d; out.push({ add: v, by: d });
      }
    }
    return out;
  }
  function heatOf(camp, cid, label, k) { const h = (camp.chars[cid].heat || {})[label]; return h ? (h[Math.min(k, h.length) - 1] || 0) : 0; }
  // when tension with someone reaches their line, the scene breaks: an on-the-spot confrontation (flash), or they stop talking to you
  function flare(camp, st, cid) {
    const line = (camp.chars[cid].heat || {}).line, n = camp.nodes[st.cur];
    if (!line || (st.v["heat." + cid] || 0) < line) return null;
    st.free = st.free || {}; st.free[n.id] = 0; if (n.talk) { st.turns = st.turns || {}; st.turns[n.id] = 0; }
    const f = n.kind === "main" || n.kind === "side" ? (camp.flash || []).find(f => f.char === cid && (!f.nodes || f.nodes.includes(n.id)) && !(f.except || []).includes(n.id)) : null;
    if (!f) { st.log.push({ k: "walkout", who: cid, n: n.id }); return "walkout"; }
    st.flash = { from: n.id, who: cid, resume: !!f.resume };
    st.log.push({ k: "flare", who: cid, n: n.id });
    enterNode(camp, st, f.node);
    return "flash";
  }
  /* ---------------- speech moves: words that move the story ----------------
   * A scene (node.moves) or the whole book (camp.moves, filtered by nodes/except) lists things the player might SAY that
   * change what happens: threaten someone, talk them round, let a secret slip. The model (or a keyword fallback) only says
   * which move a free line is; the move's effects, its narration and where the story goes next are authored rules.
   * A move: { id, to, means, match?, labels?, when?, out, effects?, echo?, goto?, resume?, ends?, nodes?, except? }
   *   goto: a flash node the scene breaks into (resume: come back to the scene afterwards; otherwise the scene is over)
   *   ends: the volume ends here (like an ending choice) */
  CC.moves = function (camp, st) {
    const n = camp.nodes[st.cur]; if (!n || st.phase !== "node" || (n.kind !== "main" && n.kind !== "side")) return []; // not in crises or confrontations
    const cast = CC.castNow(camp, st), done = (st.moved || {})[n.id] || [];
    const glob = (camp.moves || []).filter(m => (!m.nodes || m.nodes.includes(n.id)) && !(m.except || []).includes(n.id));
    return (n.moves || []).concat(glob).filter(m => cast.includes(m.to) && !done.includes(m.id) && evalCond(st, m.when));
  };
  CC.findMove = (camp, nid, id) => ((camp.nodes[nid] || {}).moves || []).concat(camp.moves || []).find(m => m.id === id) || null;
  // offline: a move's own pattern first, then the tone label the line was given (scene moves before book-wide ones)
  CC.matchMove = function (camp, st, text, who, label) {
    const ms = CC.moves(camp, st).filter(m => !who || m.to === who);
    return ms.find(m => m.match && new RegExp(m.match, "i").test(text || "")) || (label ? ms.find(m => (m.labels || []).includes(label)) : null) || null;
  };
  CC.move = function (camp, st, id, said) {
    const n = camp.nodes[st.cur], m = CC.moves(camp, st).find(x => x.id === id);
    if (!m) throw new Error("move unavailable: " + id);
    st.moved = st.moved || {}; (st.moved[n.id] = st.moved[n.id] || []).push(m.id);
    const outIdx = idxWhere(st, m.out);
    const e = ledgerPush(st, { kind: "move", node: n.id, choice: null, move: m.id, to: m.to, said: (said || "").slice(0, 40), changes: [], debts: [], echo: [] });
    applyEffects(camp, st, m.effects || [], e);
    const hurt = (m.labels || []).includes("threat") ? 2 : (m.labels || []).includes("rude") ? 1 : 0; // a threat that changes the story is still a threat
    if (hurt && m.to) { st.grudge = st.grudge || {}; st.grudge[m.to] = (st.grudge[m.to] || 0) + hurt; e.offend = m.to; }
    (m.echo || []).forEach(x => { if (!st.echoes[x]) { st.echoes[x] = { at: e.seq, node: n.id, paid: [] }; e.echo.push(x); } });
    st.log.push({ k: "move", n: n.id, m: m.id, to: m.to, p: outIdx, seq: e.seq });
    if (m.ends) { st.v.ended_early = true; st.done.push(n.id); st.cur = null; st.flash = null; enterChapter(camp, st, camp.chapters.length); }
    else if (m.goto) { st.free = st.free || {}; st.free[n.id] = 0; st.flash = { from: n.id, who: m.to, resume: !!m.resume }; enterNode(camp, st, m.goto); }
    return e;
  };
  CC.castNow = function (camp, st, nid) {
    const n = camp.nodes[nid || st.cur]; if (!n) return [];
    if (n.talk) return [n.talk.char];
    const chI = id => camp.chapters.findIndex(c => c.id === id);
    return (n.cast || []).filter(c => evalCond(st, c.when) && !(camp.chars[c.id].from_chapter && st.ch < chI(camp.chars[c.id].from_chapter))).map(c => c.id);
  };
  CC.tone = (camp, st, tone) => CC.speak(camp, st, tone, "");
  const WARM = /谢|多谢|辛苦|保重|放心|别怕|我在|陪你|佩服|敬你|珍重|想你|担心你|thank|take care|sorry|i'm here|with you|worried about you|admire|respect you|miss you|be safe/i;
  const RUDE = /蠢|笨|废物|滚|闭嘴|可笑|懦夫|活该|无能|stupid|idiot|fool|shut up|coward|pathetic|useless|get lost/i;
  CC.guessTone = text => RUDE.test(text) ? "rude" : WARM.test(text) ? "warm" : "flat";
  // intent of a free line (for offline reactions): love / insult / praise / ask / small
  CC.intent = function (camp, text) {
    const P = camp.react_patterns || {};
    for (const k of ["threat", "love", "insult", "nonsense", "praise", "ask"]) if (P[k] && new RegExp(P[k], "i").test(text.trim())) return k;
    return "small";
  };
  const PROMISE = [
    ["loyalty", /(永远|一辈子|誓死|绝不|决不|永不).{0,6}(追随|跟着|效忠|背叛|离开)|跟定你了|never (betray|leave) you|follow you (to the end|forever|always)|swear (my )?loyalty/i],
    ["protect", /(我|吾).{0,4}(会|一定|必|保证|发誓|答应).{0,10}(回来|接你|护你|保护|娶你|守着你|带你走)|i('ll| will| promise to| swear to).{0,20}(come back|protect|marry|keep you safe|take you away)/i],
    ["other", /(我|吾).{0,3}(答应|保证|发誓|一定会|向你保证)|i (promise|swear|give you my word)/i],
  ];
  CC.guessPromise = text => { for (const [k, re] of PROMISE) if (re.test(text)) return k; return null; };
  CC.freeLeft = (camp, st) => {
    const n = camp.nodes[st.cur]; if (!n || st.phase !== "node" || n.kind === "flash") return 0; // no small talk in a confrontation
    const budget = n.talk ? (n.talk.free || 5) : (n.cast && n.cast.length ? (n.free_scene || 2) : 0);
    if (!budget) return 0;
    st.free = st.free || {}; if (st.free[n.id] === undefined) st.free[n.id] = budget; return st.free[n.id];
  };
  CC.chat = function (camp, st) { if (CC.freeLeft(camp, st) <= 0) throw new Error("no free lines left"); st.free[st.cur]--; };
  /* commitments: promises the player makes in free speech become story state.
   * camp.commit_rules decide when a promise is kept or broken (checked at each chapter start and at the end). */
  CC.commit = function (camp, st, c) {
    st.commits = st.commits || [];
    const id = "k" + (st.commits.length + 1);
    const item = Object.assign({ id, status: "open", ch: st.ch, node: st.cur }, c);
    st.commits.push(item);
    const e = ledgerPush(st, { kind: "commit", node: st.cur, choice: null, commit: id, to: c.char, said: (c.text || "").slice(0, 40), changes: [], debts: [], echo: [] });
    return item;
  };
  function checkCommits(camp, st, atEnd) {
    for (const k of st.commits || []) {
      if (k.status !== "open") continue;
      const rule = (camp.commit_rules || []).find(r => r.char === k.char && r.kind === k.kind);
      if (!rule) continue;
      let status = null;
      if (rule.broken && evalCond(st, rule.broken)) status = "broken";
      else if (rule.kept && evalCond(st, rule.kept) && (!rule.at_end || atEnd)) status = "kept";
      if (!status) continue;
      k.status = status;
      const e = ledgerPush(st, { kind: "commit", node: k.node, choice: null, commit: k.id, to: k.char, said: (k.text || "").slice(0, 40), status, changes: [], debts: [], echo: [] });
      applyEffects(camp, st, (rule[status + "_effects"] || []), e);
      st.log.push({ k: "commit", id: k.id, status, rule: (camp.commit_rules || []).indexOf(rule), seq: e.seq });
    }
  }
  CC.checkCommits = checkCommits;

  // what a character remembers from earlier talks (notable lines only)
  CC.remember = function (camp, st, char, item) { st.mem = st.mem || {}; (st.mem[char] = st.mem[char] || []).push(Object.assign({ ch: st.ch, node: st.cur }, item)); };

  CC.say = function (camp, st, topicId) {
    const n = camp.nodes[st.cur];
    if (!n || !n.talk || CC.turnsLeft(camp, st) <= 0) throw new Error("no talk turns");
    st.turns[n.id]--;
    if (!topicId) return null;
    const tp = CC.topics(camp, st).find(x => x.id === topicId);
    if (!tp || tp.locked) throw new Error("topic unavailable: " + topicId);
    st.used = st.used || {}; (st.used[n.id] = st.used[n.id] || []).push(topicId);
    const e = ledgerPush(st, { kind: "talk", node: n.id, choice: null, topic: topicId, changes: [], debts: [], echo: [] });
    applyEffects(camp, st, tp.t.effects, e);
    (tp.t.echo || []).forEach(id => { if (!st.echoes[id]) { st.echoes[id] = { at: e.seq, node: n.id, paid: [] }; e.echo.push(id); } });
    st.log.push({ k: "say", n: n.id, t: topicId, p: idxWhere(st, tp.t.reply), seq: e.seq });
    return e;
  };

  /* ---------------- endings ---------------- */
  CC.endings = function (camp, st) {
    const res = [];
    for (const g of camp.endings) {
      const hits = g.fragments.filter(f => evalCond(st, f.when));
      const pick = g.mode === "all" ? hits : hits.slice(0, 1);
      for (const f of pick) res.push({ group: g.id, frag: f.id, why: CC.why(camp, st, f.when) });
    }
    return res;
  };
  // causal chain: the ledger entries that changed each variable the fragment depends on
  CC.why = function (camp, st, cond) {
    const vars = condVars(cond);
    const out = [];
    for (const v of vars) {
      const es = st.ledger.filter(e => e.kind !== "missed" && e.changes.some(ch => ch.var === v));
      es.slice(-3).forEach(e => { const ch = e.changes.find(x => x.var === v); out.push({ seq: e.seq, ch: e.ch, node: e.node, choice: e.choice, var: v, from: ch.from, to: ch.to }); });
    }
    const seen = new Set();
    return out.sort((a, b) => a.seq - b.seq).filter(x => { const k = x.seq + x.var; if (seen.has(k)) return false; seen.add(k); return true; });
  };

  /* ---------------- free text → choice (offline fallback) ---------------- */
  const STOP = new Set("a an the i me my you your we our to of and or in on at for with is are was be it this that do does did will would can could should have has had he she him her his they them their what why how who where when so just please now then there here let lets ask tell say said".split(" "));
  function grams(s) {
    s = (s || "").toLowerCase();
    const out = new Set();
    const words = s.match(/[a-z']+/g) || [];
    words.filter(w => w.length > 2 && !STOP.has(w)).forEach(w => out.add(w.replace(/(ing|ed|es|s)$/, "")));
    const han = s.replace(/[^一-鿿]/g, "");
    for (let i = 0; i < han.length - 1; i++) out.add(han.slice(i, i + 2));
    return out;
  }
  CC.matchChoice = function (camp, st, text) {
    const g = grams(text);
    if (!g.size) return null;
    let best = null;
    for (const o of CC.choices(camp, st)) {
      if (o.locked) continue;
      const lab = grams(o.c.label.zh + " " + o.c.label.en + " " + (o.c.intent ? o.c.intent.zh + " " + o.c.intent.en : ""));
      let inter = 0; g.forEach(x => { if (lab.has(x)) inter++; });
      const dice = 2 * inter / (g.size + lab.size);
      if (!best || dice > best.score) best = { id: o.id, score: dice };
    }
    return best && best.score >= 0.18 ? best : null;
  };
  // terms that are still in the future at chapter index `ch` (characters may not say them; the player saying them is foresight)
  CC.futureTerms = function (camp, ch) {
    const idx = id => { const i = camp.chapters.findIndex(c => c.id === id); return i < 0 ? 999 : i; };
    return camp.future_terms.filter(f => idx(f.from) > ch).map(f => f.term);
  };
  CC.mentionsFuture = function (camp, st, text, lang) {
    const t = (text || "").toLowerCase();
    return CC.futureTerms(camp, st.ch).filter(x => t.includes(x.zh.toLowerCase()) || t.includes(x.en.toLowerCase()));
  };

  // the player typed something that hasn't happened yet: people notice (one ledger entry per term)
  CC.foresight = function (camp, st, terms) {
    st.said = st.said || [];
    const fresh = terms.filter(t => !st.said.includes(t.zh));
    if (!fresh.length) return null;
    fresh.forEach(t => st.said.push(t.zh));
    const e = ledgerPush(st, { kind: "free", node: st.cur, choice: null, changes: [], debts: [], echo: [], terms: fresh });
    applyEffects(camp, st, [{ add: "uncanny", by: 1 }], e);
    return e;
  };

  /* ---------------- static validation ---------------- */
  CC.validate = function (camp) {
    const errors = [], warnings = [];
    const E = (m) => errors.push(m), W = (m) => warnings.push(m);
    const CJK = /[一-鿿]/;
    (function walk(o, path) {
      if (Array.isArray(o)) return o.forEach((x, i) => walk(x, path + "[" + i + "]"));
      if (o && typeof o === "object") {
        const ks = Object.keys(o);
        if (ks.length === 2 && "zh" in o && "en" in o) {
          if (!o.zh || !CJK.test(o.zh)) E(`${path}: zh missing or has no Chinese`);
          if (!o.en || CJK.test(o.en)) E(`${path}: en missing or contains Chinese`);
          if (o.zh && o.zh.length > 260) W(`${path}: zh ${o.zh.length} chars (long for one beat)`);
          return;
        }
        for (const k of ks) walk(o[k], path + "." + k);
      }
    })(camp, "camp");

    // spec level: 0.4 enforces the unified relationship model, tiers and a genre pack; 0.3 only warns about them
    const lvl = CC.specLevel(camp), strict = lvl >= 4;
    if (!lvl || lvl > 4) E(`spec ${camp.spec}: this engine (${CC.VERSION}) reads ${CC.SPECS.join(" and ")}`);
    const RM = strict ? E : (m => W(`${m} [required from spec 0.4]`));
    if (strict && !camp.tiers) E("spec 0.4: tiers missing (copy game/engine/tiers.json into camp.tiers)");
    if (strict && !camp.pack) E("spec 0.4: genre pack missing (camp.pack, from game/engine/packs/)");
    const VT = (camp.pack && camp.pack.values) || camp.value_tags || {};
    // 0.4.1 hard tiers: the var must be a number with tiers, and at least one key-moment effect must raise it
    for (const [v, t] of Object.entries(camp.hard_tiers || {})) {
      if (!camp.vars[v] || camp.vars[v].type !== "num") E(`hard_tiers: ${v} is not a number var`);
      if (!camp.tiers || !Number.isInteger(t) || t < 1 || t >= camp.tiers.start.length) E(`hard_tiers: ${v} tier ${t} out of range`);
      const keyed = JSON.stringify(camp.nodes).includes(`"add":"${v}","by":`) && Object.values(camp.nodes).some(n => JSON.stringify(n).match(new RegExp(`\\{[^{}]*"add":"${v.replace(/\./g, "\\.")}"[^{}]*"key":true[^{}]*\\}`)));
      if (!keyed) W(`hard_tiers: no key-moment effect ({key:true}) raises ${v}; its top tier can only come from carry-over`);
    }

    const varOk = v => v in camp.vars || (v.startsWith("debt.") && v.slice(5) in camp.debts);
    const reads = new Set(), writes = new Set();
    // v2.3: relationship thresholds must sit on a tier boundary, so "trusted" means the same number everywhere
    const tierOk = a => {
      if (!camp.tiers || !/^rel\./.test(a.v) || typeof a.val !== "number") return true;
      if (a.op === ">=") return camp.tiers.start.includes(a.val);
      if (a.op === "<=") return camp.tiers.end.includes(a.val);
      return false;
    };
    (function scan(o, path) {   // catch rel thresholds anywhere, not only in the places checkCond visits
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o)) { o.forEach((x, i) => scan(x, path + "[" + i + "]")); return; }
      if (typeof o.v === "string" && typeof o.op === "string" && "val" in o && !tierOk(o)) E(`${path}: ${o.v} ${o.op} ${o.val} is not on a tier boundary (use AT/UPTO)`);
      for (const k of Object.keys(o)) if (k !== "tiers") scan(o[k], path + "." + k);
    })(camp, "camp");
    const checkCond = (c, where) => { atoms(c).forEach(a => { if (!varOk(a.v)) E(`${where}: unknown var ${a.v}`); }); condVars(c).forEach(v => reads.add(v)); };
    const chIdx = id => camp.chapters.findIndex(c => c.id === id);
    const reqReads = new Set();
    Object.values(camp.nodes).forEach(n => n.choices.forEach(c => condVars(c.req).forEach(v => reqReads.add(v))));
    const echoReg = {}, echoPay = {}, debtOpen = {}, debtRes = {};
    function checkMoves(ms, at, n) {
      const ids = new Set();
      (ms || []).forEach(m => {
        const w = at + ".move." + m.id;
        if (!m.id || ids.has(m.id)) E(`${w}: missing or duplicate move id`); ids.add(m.id);
        if (!camp.chars[m.to]) E(`${w}: unknown character ${m.to}`);
        else if (n && !(n.cast || []).some(c => c.id === m.to) && !(n.talk && n.talk.char === m.to)) E(`${w}: ${m.to} is not in the scene`);
        if (!m.means) E(`${w}: no meaning (the model can't recognise it)`);
        if (!(m.out || []).length) E(`${w}: no narration`);
        if (m.match) { try { new RegExp(m.match); } catch { E(`${w}: bad match pattern`); } }
        (m.labels || []).forEach(l => { if (!CC.LABELS.includes(l)) E(`${w}: unknown label ${l}`); });
        if (m.goto && (!camp.nodes[m.goto] || camp.nodes[m.goto].kind !== "flash")) E(`${w}: goto ${m.goto} is not a flash node`);
        (m.nodes || []).concat(m.except || []).forEach(x => { if (!camp.nodes[x]) E(`${w}: unknown node ${x}`); });
        checkCond(m.when, w); (m.out || []).forEach(p => checkCond(p.when, w));
        (m.effects || []).forEach(ef => { const v = ef.set || ef.add; if (!varOk(v)) E(`${w}: effect on unknown var ${v}`); writes.add(v); });
        (m.echo || []).forEach(id => { if (!camp.echoes[id]) E(`${w}: unknown echo ${id}`); (echoReg[id] = echoReg[id] || []).push(n ? chIdx(n.chapter) : 0); });
      });
    }
    camp.chapters.forEach(ch => (ch.intro || []).forEach(p => checkCond(p.when, ch.id)));
    for (const n of Object.values(camp.nodes)) {
      const at = n.id;
      if (n.kind !== "interrupt" && n.kind !== "flash" && chIdx(n.chapter) < 0) E(`${at}: unknown chapter ${n.chapter}`);
      if (!["main", "side", "interrupt", "flash"].includes(n.kind)) E(`${at}: bad kind`);
      if (n.kind === "flash" && !(camp.flash || []).some(f => f.node === n.id) && !Object.values(camp.nodes).concat([{ moves: camp.moves }]).some(x => (x.moves || []).some(m => m.goto === n.id))) E(`${at}: flash node nothing can trigger`);
      if (n.kind === "interrupt" && !n.when) E(`${at}: interrupt without a trigger`);
      if (n.talk) {
        if (!camp.chars[n.talk.char]) E(`${at}: talk with unknown character ${n.talk.char}`);
        if (!n.talk.topics.length) E(`${at}: talk without topics`);
        n.talk.topics.forEach(tp => { const w = at + ".topic." + tp.id; checkCond(tp.when, w); checkCond(tp.req, w); (tp.reply || []).forEach(p => checkCond(p.when, w));
          (tp.effects || []).forEach(ef => { const v = ef.set || ef.add; if (!varOk(v)) E(`${w}: effect on unknown var ${v}`); writes.add(v); });
          (tp.echo || []).forEach(id => { if (!camp.echoes[id]) E(`${w}: unknown echo ${id}`); (echoReg[id] = echoReg[id] || []).push(chIdx(n.chapter)); }); });
      }
      if (!["literal", "functional", "free"].includes(n.lock)) E(`${at}: bad lock`);
      checkCond(n.when, at);
      (n.intro || []).forEach(p => checkCond(p.when, at));
      (n.on_enter || []).forEach(o => { checkCond(o.when, at); (o.effects || []).forEach(ef => writes.add(ef.set || ef.add)); (o.resolve || []).forEach(([d]) => (debtRes[d] = debtRes[d] || []).push(chIdx(n.chapter))); });
      (n.callbacks || []).forEach(cbk => { checkCond(cbk.when, at); if (!camp.echoes[cbk.pays]) E(`${at}: callback pays unknown echo ${cbk.pays}`); (echoPay[cbk.pays] = echoPay[cbk.pays] || []).push(chIdx(n.chapter)); });
      if (!n.choices.length) E(`${at}: no choices`);
      checkMoves(n.moves, at, n);
      if (n.ask) {
        const a = n.ask, ids = a.answers.map(x => x.id);
        if (!camp.chars[a.who]) E(`${at}.ask: unknown character ${a.who}`);
        if (!(n.cast || []).some(c => c.id === a.who) && !(n.talk && n.talk.char === a.who)) E(`${at}.ask: ${a.who} is not in the scene`);
        if (!ids.includes(a.fallback)) E(`${at}.ask: fallback ${a.fallback} is not an answer`);
        if (new Set(ids).size !== ids.length) E(`${at}.ask: duplicate answer id`);
        checkCond(a.when, at + ".ask");
        a.answers.forEach(x => { (x.out || []).forEach(p => checkCond(p.when, at + ".ask." + x.id)); (x.effects || []).forEach(ef => { const v = ef.set || ef.add; if (!varOk(v)) E(`${at}.ask.${x.id}: unknown var ${v}`); writes.add(v); });
          (x.echo || []).forEach(id => { if (!camp.echoes[id]) E(`${at}.ask.${x.id}: unknown echo ${id}`); (echoReg[id] = echoReg[id] || []).push(chIdx(n.chapter)); });
          if (x.match) { try { new RegExp(x.match); } catch { E(`${at}.ask.${x.id}: bad match pattern`); } } });
      }
      if (!n.art) W(`${at}: no art`); else (n.art.layers || []).forEach(l => { checkCond(l.when, at + ".art"); if (l.choice && !n.choices.some(c => c.id === l.choice)) E(`${at}: art layer ${l.id} waits for unknown choice ${l.choice}`); });
      if (!n.place && n.kind !== "interrupt" && n.kind !== "flash") W(`${at}: no place on the map`);
      const ids = new Set();
      for (const c of n.choices) {
        const w = at + "." + c.id;
        if (ids.has(c.id)) E(`${w}: duplicate choice id`); ids.add(c.id);
        if (!["dilemma", "strategy", "expression"].includes(c.type)) E(`${w}: bad type`);
        checkCond(c.when, w); checkCond(c.req, w);
        if (c.req && !c.hint) W(`${w}: locked choice has no hint`);
        (c.out || []).forEach(p => checkCond(p.when, w));
        for (const ef of c.effects.concat(...(c.alt || []).map(a => a.effects))) { const v = ef.set || ef.add; if (!varOk(v)) E(`${w}: effect on unknown var ${v}`); writes.add(v); }
        (c.alt || []).forEach(a => { if (!a.when) E(`${w}: alt without a condition`); checkCond(a.when, w + ".alt"); });
        if (c.type !== "expression" && !c.effects.length && !(c.resolve || []).length) W(`${w}: ${c.type} choice changes nothing (fake choice?)`);
        (c.echo || []).forEach(id => { if (!camp.echoes[id]) E(`${w}: unknown echo ${id}`); (echoReg[id] = echoReg[id] || []).push(chIdx(n.chapter)); });
        (c.debt || []).forEach(id => { if (!camp.debts[id]) E(`${w}: unknown debt ${id}`); (debtOpen[id] = debtOpen[id] || []).push(chIdx(n.chapter)); });
        (c.resolve || []).forEach(([id, m]) => { if (!camp.debts[id]) E(`${w}: resolves unknown debt ${id}`); if (!["transform", "reroute", "cancel"].includes(m)) E(`${w}: bad resolve mode ${m}`); (debtRes[id] = debtRes[id] || []).push(chIdx(n.chapter)); });
        // a major choice must become visible later: by an echo, a debt resolution, unlocking a choice, or (in the last chapter) the epilogue
        const flags = c.effects.filter(ef => (ef.set || "").startsWith("flag.") || ef.set === "track").map(ef => ef.set);
        const major = flags.length || (c.debt || []).length;
        const unlocks = flags.length && flags.every(f => reqReads.has(f));
        const last = chIdx(n.chapter) === camp.chapters.length - 1;
        if (major && !(c.echo || []).length && !(c.resolve || []).length && !unlocks && !last && !c.ends && n.kind !== "interrupt" && n.kind !== "flash") W(`${w}: major choice registers no echo (consequence may stay invisible)`);
      }
    }
    checkMoves(camp.moves, "moves", null);
    for (const id of Object.keys(camp.echoes)) {
      if (!echoReg[id]) W(`echo ${id}: never registered`);
      else if (!echoPay[id]) E(`echo ${id}: registered but no callback pays it`);
      else if (Math.max(...echoPay[id]) < Math.min(...echoReg[id])) E(`echo ${id}: every payoff comes before it can be registered`);
    }
    for (const id of Object.keys(debtOpen)) {
      if (!debtRes[id]) E(`debt ${id}: opened but never resolved anywhere`);
      else if (Math.max(...debtRes[id]) < Math.min(...debtOpen[id])) E(`debt ${id}: resolution site is before the debt can open`);
    }
    for (const ch of camp.chapters) if (!nodesIn(camp, ch.id, "main").length) E(`chapter ${ch.id}: no main node`);
    Object.keys(camp.vars).filter(v => v.startsWith("imp.") || v.startsWith("heat.") || v === "renown.rash").forEach(v => writes.add(v)); // written by free speech (CC.speak)
    if (camp.prev) Object.keys(camp.vars).filter(v => camp.vars[v].carry !== false && !v.startsWith("heat.")).forEach(v => writes.add(v)); // may arrive from the previous volume
    for (const [cid, ch] of Object.entries(camp.chars)) {
      const ds = Object.keys(ch.dims || {});
      CC.AXES.forEach(a => { if (!ds.includes(a)) RM(`char ${cid}: missing the ${a} axis (every character has warmth, trust and esteem)`); });
      ds.forEach(d => { if (!CC.AXES.includes(d) && !(d === "intimacy" && ch.romance)) RM(`char ${cid}: dimension ${d} is not part of the relationship model`); });
      if (ch.main && !ds.includes(ch.main)) E(`char ${cid}: main axis ${ch.main} missing`);
      if (strict && !ch.main) E(`char ${cid}: no main axis (which axis does the story read for this person?)`);
      ds.forEach(d => { const rv = camp.vars[`rel.${cid}.${d}`]; if (rv && (rv.min !== 0 || rv.max !== 10)) RM(`var rel.${cid}.${d}: range ${rv.min}–${rv.max}, the relationship scale is 0–10`); });
      Object.entries(ch.values || {}).forEach(([tag, r]) => { if (!VT[tag]) E(`char ${cid}: unknown value ${tag}`); if (!ds.includes(r[0])) E(`char ${cid}: value ${tag} moves unknown axis ${r[0]}`); });
    }
    for (const n of Object.values(camp.nodes)) for (const c of n.choices) (c.values || []).forEach(tag => { if (!VT[tag]) E(`${n.id}.${c.id}: unknown value ${tag}`); });
    if (strict && !Object.values(camp.chars).some(ch => ch.values && Object.keys(ch.values).length)) W("no character has values: choices will never draw automatic reactions");

    // genre pack (题材包): every resource role the pack requires is mapped to the book's own variables, and the pack's rules hold
    if (camp.pack) {
      const P = camp.pack, roles = P.roles || {}, res = camp.resources || {};
      for (const [r, d] of Object.entries(roles)) if (d.required && !(res[r] || []).length) E(`pack ${P.id}: resource role ${r} is not mapped (camp.resources.${r})`);
      for (const [r, vs] of Object.entries(res)) { if (!roles[r]) E(`resources.${r}: pack ${P.id} has no such role`); vs.forEach(v => { if (!camp.vars[v]) E(`resources.${r}: unknown var ${v}`); }); }
      const resVars = new Set(Object.values(res).flat()), earned = new Set(Object.entries(res).filter(([r]) => (roles[r] || {}).earned).flatMap(([, vs]) => vs));
      const rules = new Set(P.rules || []);
      if (rules.has("alt_path")) for (const n of Object.values(camp.nodes)) {
        // a choice gated on a resource needs a sibling that is never locked: running short slows you down, it doesn't stop the story
        const gated = n.choices.filter(c => condVars(c.req).some(v => resVars.has(v)));
        if (gated.length && !n.choices.some(c => !c.req)) E(`${n.id}: every choice is locked behind something and ${gated.map(c => c.id).join(", ")} needs resources — add a way through that costs nothing (rule alt_path)`);
      }
      if (rules.has("earned_victory")) for (const g of camp.endings) for (const f of g.fragments) {
        const vs = condVars(f.when);
        if (vs.some(v => earned.has(v)) && !vs.some(v => !resVars.has(v) && !v.startsWith("rel."))) E(`ending ${g.id}.${f.id}: success decided by resources alone — also require something the player did (a flag) (rule earned_victory)`);
      }
      if (rules.has("risk_bites")) (res.risk || []).forEach(v => {
        if (!Object.values(camp.nodes).some(n => condVars(n.when).includes(v))) E(`risk ${v}: no scene is triggered by it — crossing the line must make something happen (rule risk_bites)`);
      });
    }
    for (const [cid, ch] of Object.entries(camp.chars)) if (ch.heat) { if (!camp.vars["heat." + cid]) E(`char ${cid}: heat table but no heat.${cid} var`); else if (ch.heat.line) reads.add("heat." + cid); }
    (camp.flash || []).forEach((f, i) => { const fn = camp.nodes[f.node]; if (!fn || fn.kind !== "flash") E(`flash[${i}]: node ${f.node} missing or not a flash node`); if (!camp.chars[f.char] || !(camp.chars[f.char].heat || {}).line) E(`flash[${i}]: ${f.char} has no heat line`); (f.nodes || []).concat(f.except || []).forEach(x => { if (!camp.nodes[x]) E(`flash[${i}]: unknown node ${x}`); }); });
    (camp.witness || []).forEach((w, i) => { if (!camp.chars[w.who] || !camp.chars[w.to]) E(`witness[${i}]: unknown character`); w.effects.forEach(ef => { const v = ef.set || ef.add; if (!varOk(v)) E(`witness[${i}]: unknown var ${v}`); writes.add(v); }); });
    for (const g of camp.endings) for (const f of g.fragments) {
      checkCond(f.when, `ending ${g.id}.${f.id}`);
      if (f.when && !condVars(f.when).some(v => writes.has(v))) E(`ending ${g.id}.${f.id}: depends on nothing a choice can change (untraceable)`);
    }
    ["flag.sidelined"].forEach(v => reads.add(v)); // read by the director in code
    // relationship axes are always on screen and carry into later volumes, so an axis no condition reads still matters
    for (const v of writes) if (!reads.has(v) && !v.startsWith("debt.") && !(v.startsWith("rel.") && CC.AXES.concat("intimacy").includes(v.split(".")[2]))) W(`var ${v}: written but never read (drop it, or make it matter)`);
    for (const v of reads) if (!writes.has(v) && !v.startsWith("debt.")) W(`var ${v}: read but never written`);
    return { errors, warnings };
  };

  /* ---------------- Monte Carlo playtester ---------------- */
  CC.playRandom = function (camp, r) {
    const st = CC.newGame(camp);
    let guard = 0;
    while (st.phase !== "end" && guard++ < 500) {
      if (st.phase === "side") CC.pickSide(camp, st, st.offer[Math.floor(r() * st.offer.length)]);
      else if (CC.ask(camp, st)) { const q = CC.ask(camp, st); CC.answer(camp, st, q.answers[Math.floor(r() * q.answers.length)].id, ""); }
      else { const os = CC.choices(camp, st).filter(o => !o.locked); CC.choose(camp, st, os[Math.floor(r() * os.length)].id); }
    }
    return st;
  };
  /* policies: how a simulated player decides. utility = weighted sum of a choice's numeric effects */
  function utility(camp, st, effects, w) {
    let u = 0;
    for (const ef of effects || []) { const k = ef.set || ef.add; const wt = w[k] || 0; if (!wt) continue; u += wt * (ef.add ? ef.by : (ef.to === true ? 1 : ef.to === false ? -1 : (k === "track" ? (ef.to === w.trackPref ? 1 : -1) : 0))); }
    return u;
  }
  CC.policies = {
    random: null,
    romance: { "rel.wenzhi.intimacy": 3, "rel.wenzhi.trust": 2, "flag.wenzhi_with_you": 8, "flag.wenzhi_together": 8, "flag.promise_wenzhi": 5, "flag.wenzhi_warned": 3, "flag.wenzhi_safe": 3, "flag.wenzhi_used": -8, "flag.asked_wenzhi": 1, "uncanny": -.6, track: 1, trackPref: "liu", "rel.liubei.trust": .4 },
    loyal: { "rel.liubei.trust": 2, "renown.loyal": 2, "rel.guanyu.esteem": 1, "rel.guanyu.warmth": 1, "uncanny": -1, track: 6, trackPref: "liu" },
    schemer: { "renown.cunning": 2, "rel.caocao.esteem": 2, "rel.zhuge.esteem": .5, "uncanny": -.5, track: 6, trackPref: "cao" },
    seer: { "uncanny": 2, "rel.liubei.trust": .5, foresight: 3, track: 1, trackPref: "liu" },
    provoker: { provoke: true },
  };
  function decide(camp, st, r, w) {
    if (st.phase === "side") {
      if (!w) return ["side", st.offer[Math.floor(r() * st.offer.length)]];
      const sc = id => Math.max(...camp.nodes[id].choices.map(c => utility(camp, st, c.effects, w) + (c.foresight ? (w.foresight || 0) : 0))) + (camp.nodes[id].talk ? 0 : 0);
      return ["side", st.offer.slice().sort((a, b) => sc(b) - sc(a) || r() - .5)[0]];
    }
    const n = camp.nodes[st.cur];
    const q = CC.ask(camp, st);
    if (q) {
      if (!w || w.provoke) return ["answer", w && w.provoke ? (q.answers.find(a => (a.effects || []).some(ef => (ef.add || "").startsWith("heat."))) || q.answers[0]).id : q.answers[Math.floor(r() * q.answers.length)].id];
      return ["answer", q.answers.map(a => [a.id, utility(camp, st, a.effects, w) + r() * .3]).sort((a, b) => b[1] - a[1])[0][0]];
    }
    // random players also chat freely now and then, so speech consequences get exercised
    const cast = CC.castNow(camp, st);
    const mv = CC.moves(camp, st);
    if (mv.length && CC.freeLeft(camp, st) > 0) {
      const hot = mv.filter(m => (m.labels || []).some(l => l === "threat" || l === "rude"));
      if (w && w.provoke && hot.length) return ["move", hot[0].id];
      if (!w && r() < .2) return ["move", mv[Math.floor(r() * mv.length)].id];
    }
    if (w && w.provoke && cast.length && CC.freeLeft(camp, st) > 0) return ["speak", "rude", cast.includes("caocao") ? "caocao" : cast[0]];
    if (!w && cast.length && CC.freeLeft(camp, st) > 0 && r() < (n.talk ? .35 : .15)) {
      const x = r(); const lab = x < .4 ? "flat" : x < .6 ? "warm" : x < .7 ? "rude" : x < .8 ? "romantic" : x < .9 ? "flatter" : x < .95 ? "nonsense" : "threat";
      const tags = Object.keys(camp.value_tags || {}), vt = tags.length && r() < .5 ? [tags[Math.floor(r() * tags.length)]] : [];
      return ["speak", lab, cast[Math.floor(r() * cast.length)], vt];
    }
    if (n.talk && CC.turnsLeft(camp, st) > 0) {
      const tps = CC.topics(camp, st).filter(x => !x.locked);
      if (tps.length) {
        if (!w) { if (r() < .75) return ["say", tps[Math.floor(r() * tps.length)].id]; }
        else { const best = tps.map(x => [x.id, utility(camp, st, x.t.effects, w) + (x.t.foresight ? (w.foresight || 0) : 0)]).sort((a, b) => b[1] - a[1])[0]; if (best[1] >= 0) return ["say", best[0]]; }
      }
    }
    const open = CC.choices(camp, st).filter(o => !o.locked);
    if (!open.length) throw new Error("dead end at " + st.cur);
    if (!w) return ["choose", open[Math.floor(r() * open.length)].id];
    if (w.provoke) { const safe = open.filter(o => !o.c.ends), pool = safe.length ? safe : open; return ["choose", pool[Math.floor(r() * pool.length)].id]; }
    const scored = open.map(o => [o.id, utility(camp, st, o.c.effects, w) + (o.c.foresight ? (w.foresight || 0) : 0) + (o.c.ends ? -20 : 0) + r() * .3]);
    return ["choose", scored.sort((a, b) => b[1] - a[1])[0][0]];
  }
  CC.playPolicy = function (camp, r, w) {
    const presets = camp.presets || [], pol = Object.keys(CC.policies).find(k => CC.policies[k] === w), pr = presets.find(p => p.id === pol) || (presets.length ? presets[Math.floor(r() * presets.length)] : null);
    const st = CC.newGame(camp, pr ? Object.assign({}, pr.carry, { preset: pr.id }) : null); let guard = 0;
    while (st.phase !== "end" && guard++ < 800) { const [k, id, who, vals] = decide(camp, st, r, w); if (k === "side") CC.pickSide(camp, st, id); else if (k === "say") CC.say(camp, st, id); else if (k === "speak") { CC.chat(camp, st); CC.speak(camp, st, id, "", who, vals); } else if (k === "move") { CC.chat(camp, st); CC.move(camp, st, id, ""); } else if (k === "answer") CC.answer(camp, st, id, ""); else CC.choose(camp, st, id); }
    return st;
  };
  CC.simulate = function (camp, runs = 2000, seed = 7, policy = null, opts = {}) {
    const r = rng(seed); const w = policy && CC.policies[policy];
    const S = { runs, policy: policy || "random", topics: {}, speech: {}, answers: {}, flares: {}, provokedReward: {}, early: {}, nodes: {}, choiceSeen: {}, choiceOpen: {}, choicePick: {}, frags: {}, combos: new Set(), echoReg: {}, echoPaid: {}, debtsLeft: {}, debtModes: {}, track: {}, deviation: {}, uncanny: {}, length: 0, offered: {}, rel: {} };
    const inc = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
    const presets = camp.presets || [];
    for (let i = 0; i < runs; i++) {
      // a later volume is played from earlier endings: most simulated runs start from a preset backstory
      const pr = presets.length && r() < .85 ? (presets.find(p => p.id === policy) || presets[Math.floor(r() * presets.length)]) : null;
      // opts.carries: real end states of the previous volume (a chained, book-level run) instead of presets
      const st = opts.carries ? CC.newGame(camp, opts.carries[i % opts.carries.length]) : CC.newGame(camp, pr ? Object.assign({}, pr.carry, { preset: pr.id }) : null);
      const relStart = {}; for (const k of Object.keys(st.v)) if (k.startsWith("rel.")) relStart[k] = st.v[k];
      let guard = 0;
      let lastNode = null;
      while (st.phase !== "end" && guard++ < 800) {
        if (st.phase === "side") { st.offer.forEach(o => inc(S.offered, o)); CC.pickSide(camp, st, decide(camp, st, r, w)[1]); continue; }
        const nid = st.cur; if (nid !== lastNode) { inc(S.nodes, nid); lastNode = nid; }
        const [k, id, who, vals] = decide(camp, st, r, w);
        if (k === "say") { inc(S.topics, nid + "." + id); CC.say(camp, st, id); continue; }
        if (k === "answer") { inc(S.answers, nid + "." + id); CC.answer(camp, st, id, ""); continue; }
        if (k === "speak") { inc(S.speech, id); CC.chat(camp, st); const se = CC.speak(camp, st, id, "", who, vals); if (se && se.flare) inc(S.flares, nid + ":" + se.flare + ":" + who); continue; }
        if (k === "move") { inc(S.moves = S.moves || {}, nid + "." + id); CC.chat(camp, st); CC.move(camp, st, id, ""); continue; }
        CC.choices(camp, st).forEach(o => { inc(S.choiceSeen, nid + "." + o.id); if (!o.locked) inc(S.choiceOpen, nid + "." + o.id); });
        inc(S.choicePick, nid + "." + id);
        const hot = Object.keys(camp.chars).filter(c => (st.v["heat." + c] || 0) >= 2);
        const ce = CC.choose(camp, st, id);
        // provoking someone in this scene and then being rewarded by them is the bug the player reported: flag it
        hot.forEach(c => { const mv = `rel.${c}.${camp.chars[c].main || Object.keys(camp.chars[c].dims)[0]}`; const ch = ce.changes.find(x => x.var === mv); if (ch && ch.to > ch.from) inc(S.provokedReward, nid + "." + id + "→" + c); });
      }
      if (st.v.ended_early) inc(S.early, st.log.filter(x => x.k === "choice").slice(-1)[0].n);
      const ends = CC.endings(camp, st);
      ends.forEach(e => inc(S.frags, e.group + "." + e.frag));
      S.combos.add(ends.map(e => e.group + "." + e.frag).join("|"));
      for (const [id, e] of Object.entries(st.echoes)) { inc(S.echoReg, id); if (e.paid.length) inc(S.echoPaid, id); }
      for (const id of Object.keys(camp.debts)) { const m = st.v["debt." + id]; if (m === "open" && !st.v.ended_early) inc(S.debtsLeft, id); if (m !== "none") inc(S.debtModes, id + ":" + m); }
      for (const [k, a] of Object.entries(relStart)) {   // v2.3: where each relationship ends up, by tier
        const R = S.rel[k] = S.rel[k] || { tiers: [0, 0, 0, 0, 0], moved: 0, max: 0 }, b = st.v[k];
        const t = CC.tierOf(camp, b); if (t !== null) R.tiers[t]++;
        if (b !== a) R.moved++; if (b >= 10) R.max++;
      }
      if (opts.keep) (S.carries = S.carries || []).push(CC.carryOut(st));
      inc(S.track, st.v.track); inc(S.deviation, st.v.deviation); inc(S.uncanny, st.v.uncanny);
      S.length += st.done.length;
    }
    S.length /= runs; S.distinctEndings = S.combos.size; delete S.combos;
    // findings
    const F = [];
    for (const id of Object.keys(camp.nodes)) if (!S.nodes[id]) F.push({ level: camp.nodes[id].kind === "interrupt" || policy ? "warn" : "error", msg: `node ${id} never reached in ${runs} runs` });
    for (const n of Object.values(camp.nodes)) for (const c of n.choices) {
      const k = n.id + "." + c.id;
      if (S.nodes[n.id] && !S.choiceOpen[k]) F.push({ level: "warn", msg: `choice ${k} never available` });
    }
    for (const g of camp.endings) for (const f of g.fragments) if (!S.frags[g.id + "." + f.id]) F.push({ level: "warn", msg: `ending ${g.id}.${f.id} never reached` });
    for (const [id, n] of Object.entries(S.echoReg)) { const p = (S.echoPaid[id] || 0) / n; if (p < 0.6) F.push({ level: "warn", msg: `echo ${id} paid off in only ${(p * 100).toFixed(0)}% of runs that registered it` }); }
    for (const [k, n] of Object.entries(S.provokedReward)) F.push({ level: "warn", msg: `provoked ${k.split("→")[1]} in this scene, yet choice ${k.split("→")[0]} raised their regard (${n} runs)` });
    // v2.3 budget check, on each person's main axis: does it pile up at the top, or never move at all?
    if (!policy && opts.budget !== false) for (const [c, ch] of Object.entries(camp.chars)) {
      const R = S.rel[`rel.${c}.${ch.main}`]; if (!R) continue;
      const top = R.tiers[4] / runs, moved = R.moved / runs;
      if (top >= 0.4) F.push({ level: "warn", msg: `${c}.${ch.main} ends in the top tier in ${(100 * top).toFixed(0)}% of random runs (saturating)` });
      if (moved < 0.05) F.push({ level: "warn", msg: `${c}.${ch.main} changes in only ${(100 * moved).toFixed(0)}% of random runs (barely moves)` });
    }
    for (const [id, n] of Object.entries(S.debtsLeft)) F.push({ level: "error", msg: `debt ${id} still open at the end in ${n} runs` });
    S.findings = F;
    return S;
  };

  if (typeof module === "object" && module.exports) module.exports = CC; else root.CC = CC;
})(typeof self !== "undefined" ? self : this);
