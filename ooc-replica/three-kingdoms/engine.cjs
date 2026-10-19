/* 校验核心 v0.2 —— 与 reference/engine.py 行为一致（由 parity_test.js 对照验证）。
   浏览器中挂到 window.SV；Node 中 module.exports。无任何外部依赖。 */
(function (root) {
  "use strict";
  // ------------------------------------------------------------ 精简 JSON Schema 校验（仅覆盖本规格用到的关键字）
  function typeOf(v) { if (v === null) return "null"; if (Array.isArray(v)) return "array"; if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number"; return typeof v; }
  function typeOk(v, t) { const a = typeOf(v); if (t === "number") return a === "number" || a === "integer"; return a === t; }
  function deepEq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function makeValidator(schemas) {
    const byId = {}; schemas.forEach(s => byId[s.$id] = s);
    function resolve(ref, base) {
      let [file, frag] = ref.split("#"); const doc = file ? byId[file] : base;
      if (!doc) throw new Error("unknown $ref " + ref);
      let node = doc; if (frag) frag.split("/").filter(Boolean).forEach(p => node = node[p]);
      return { node, doc };
    }
    function v(s, x, path, base, errs) {
      if (s.$ref) { const r = resolve(s.$ref, base); v(r.node, x, path, r.doc, errs); }
      if ("const" in s && !deepEq(s.const, x)) errs.push([path, `应为 ${JSON.stringify(s.const)}`]);
      if (s.enum && !s.enum.some(e => deepEq(e, x))) errs.push([path, `取值 ${JSON.stringify(x)} 不在允许范围 ${JSON.stringify(s.enum)}`]);
      if (s.type) { const ts = Array.isArray(s.type) ? s.type : [s.type]; if (!ts.some(t => typeOk(x, t))) { errs.push([path, `类型应为 ${ts.join("/")}，实际是 ${typeOf(x)}`]); return; } }
      if (s.oneOf) {
        const res = s.oneOf.map(sub => { const e = []; v(sub, x, path, base, e); return e; });
        const n = res.filter(e => e.length === 0).length;
        if (n !== 1) errs.push([path, n === 0 ? `写法不被支持：${JSON.stringify(x).slice(0, 120)}` : "同时符合多种写法（有歧义）"]);
      }
      if (s.allOf) s.allOf.forEach(sub => {
        if (sub.if) { const e = []; v(sub.if, x, path, base, e); if (!e.length && sub.then) v(sub.then, x, path, base, errs); }
        else v(sub, x, path, base, errs);
      });
      const t = typeOf(x);
      if (t === "object") {
        (s.required || []).forEach(k => { if (!(k in x)) errs.push([path, `缺少必填字段 "${k}"`]); });
        const props = s.properties || {};
        Object.keys(x).forEach(k => {
          if (k in props) v(props[k], x[k], path + "/" + k, base, errs);
          else if (s.additionalProperties === false) errs.push([path, `不允许的字段 "${k}"（拼写错误或规格里没有）`]);
          else if (s.additionalProperties && typeof s.additionalProperties === "object") v(s.additionalProperties, x[k], path + "/" + k, base, errs);
        });
      }
      if (t === "array") {
        if (s.minItems != null && x.length < s.minItems) errs.push([path, `至少需要 ${s.minItems} 项`]);
        if (s.maxItems != null && x.length > s.maxItems) errs.push([path, `最多 ${s.maxItems} 项`]);
        if (s.uniqueItems && new Set(x.map(i => JSON.stringify(i))).size !== x.length) errs.push([path, "有重复项"]);
        if (s.items) x.forEach((it, i) => v(s.items, it, path + "/" + i, base, errs));
      }
      if (t === "string") {
        if (s.minLength != null && x.length < s.minLength) errs.push([path, s.minLength === 1 ? "不能为空" : `至少 ${s.minLength} 个字符`]);
        if (s.maxLength != null && x.length > s.maxLength) errs.push([path, `最多 ${s.maxLength} 个字符`]);
        if (s.pattern && !new RegExp(s.pattern).test(x)) errs.push([path, `格式不对："${x}"（id 只能用小写字母、数字、下划线，以字母开头）`]);
      }
      if ((t === "integer" || t === "number")) {
        if (s.minimum != null && x < s.minimum) errs.push([path, `不能小于 ${s.minimum}`]);
        if (s.maximum != null && x > s.maximum) errs.push([path, `不能大于 ${s.maximum}`]);
      }
    }
    return function validate(id, x) { const errs = []; v(byId[id], x, "", byId[id], errs); return errs.map(([p, m]) => `${p || "(根)"}: ${m}`); };
  }

  // ------------------------------------------------------------ 规则层（与 engine.py 一致）
  const clone = o => JSON.parse(JSON.stringify(o));
  function canon(o) { if (Array.isArray(o)) return "[" + o.map(canon).join(",") + "]"; if (o && typeof o === "object") return "{" + Object.keys(o).sort().map(k => JSON.stringify(k) + ":" + canon(o[k])).join(",") + "}"; return JSON.stringify(o); }
  const atomsOf = c => !c ? [] : c.all ? c.all : c.any ? c.any : [c];

  function lint(pack) {
    const E = [], W = [];
    const info = Object.fromEntries(pack.info.map(i => [i.id, i]));
    const chars = Object.fromEntries(pack.characters.map(c => [c.id, c]));
    const locs = new Set(pack.locations.map(l => l.id)), outs = new Set(pack.outcomes.map(o => o.id));
    const assets = new Set((pack.assets || []).map(a => a.id));
    const state = Object.fromEntries(pack.state.map(s => [s.id, s]));
    const exts = new Set(pack.extensions || []), ext = pack.ext || {};
    const items = new Set(((ext.inventory || {}).items || []).map(i => i.id));
    const sameSet = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
    if (!sameSet(exts, new Set(Object.keys(ext)))) E.push(`extensions [${[...exts].sort()}] 与 ext 区块 [${Object.keys(ext).sort()}] 不一致`);
    if (!locs.has(pack.player.starting_location)) E.push("player.starting_location 不存在");
    pack.player.starting_known.forEach(k => { if (!info[k]) E.push(`starting_known 引用了不存在的 info: ${k}`); else if (info[k].visibility === "author_only") E.push(`starting_known 不能包含 author_only: ${k}`); });
    const sp = pack.opening.speaker; if (sp && !chars[sp]) E.push(`opening.speaker 不存在: ${sp}`);
    function checkCond(cond, where) {
      atomsOf(cond).forEach(a => {
        if ("flag" in a && (state[a.flag] || {}).type !== "bool") E.push(`${where}: flag ${a.flag} 未声明为 bool`);
        if ("int" in a && (state[a.int] || {}).type !== "int") E.push(`${where}: int ${a.int} 未声明为 int`);
        if ("enum" in a) { const s = state[a.enum]; if (!s || s.type !== "enum") E.push(`${where}: enum ${a.enum} 未声明为 enum`); else { const v = "is" in a ? a.is : a.is_not; if (!(s.values || []).includes(v)) E.push(`${where}: enum ${a.enum} 没有取值 ${v}`); } }
        ["knows", "not_knows"].forEach(k => { if (k in a && !info[a[k]]) E.push(`${where}: ${k} 引用了不存在的 info ${a[k]}`); });
        ["has_item", "not_has_item"].forEach(k => { if (k in a) { if (!exts.has("inventory")) E.push(`${where}: 使用 ${k} 需要启用 inventory 扩展`); else if (!items.has(a[k])) E.push(`${where}: 物品 ${a[k]} 不存在`); } });
        if ("at" in a && !locs.has(a.at)) E.push(`${where}: 地点 ${a.at} 不存在`);
      });
    }
    const setTargets = new Set();
    function checkEff(effs, where) {
      (effs || []).forEach(e => {
        if ("set" in e) {
          const s = state[e.set]; if (!s) { E.push(`${where}: set 未声明的变量 ${e.set}`); return; }
          setTargets.add(e.set + "=" + JSON.stringify(e.to));
          const okT = { bool: typeof e.to === "boolean", int: Number.isInteger(e.to), enum: typeof e.to === "string" && (s.values || []).includes(e.to) }[s.type];
          if (!okT) E.push(`${where}: set ${e.set} 的值 ${JSON.stringify(e.to)} 与类型 ${s.type} 不符`);
        }
        if ("add" in e && (state[e.add] || {}).type !== "int") E.push(`${where}: add 只能用于 int 变量 (${e.add})`);
        if ("reveal" in e) { if (!info[e.reveal]) E.push(`${where}: reveal 不存在的 info ${e.reveal}`); else if (info[e.reveal].visibility === "author_only") E.push(`${where}: 不能 reveal author_only 信息 ${e.reveal}`); }
        ["give_item", "remove_item"].forEach(k => { if (k in e && !items.has(e[k])) E.push(`${where}: ${k} 物品 ${e[k]} 不存在或未启用 inventory`); });
        if ("move_to" in e && !locs.has(e.move_to)) E.push(`${where}: move_to 地点不存在 ${e.move_to}`);
        if ("end" in e && !outs.has(e.end)) E.push(`${where}: end 结局不存在 ${e.end}`);
      });
    }
    pack.state.forEach(s => {
      const t = s.type, v = s.initial;
      if (t === "bool" && typeof v !== "boolean") E.push(`state ${s.id} 初值类型不符`);
      if (t === "int" && !Number.isInteger(v)) E.push(`state ${s.id} 初值类型不符`);
      if (t === "enum" && !(s.values || []).includes(v)) E.push(`state ${s.id} 初值不在 values 中`);
    });
    pack.characters.forEach(c => {
      const w = `character ${c.id}`;
      if (!locs.has(c.location)) E.push(`${w}: 地点不存在`);
      if (c.image && !assets.has(c.image)) E.push(`${w}: 图片 ${c.image} 不在 assets`);
      const tids = new Set(c.topics.map(t => t.id));
      c.knows.concat(c.claims || []).forEach(k => { if (!info[k]) E.push(`${w}: 引用不存在的 info ${k}`); else if (info[k].visibility === "author_only") E.push(`${w}: knows/claims 不能包含 author_only 信息 ${k}`); });
      (c.claims || []).forEach(k => { if (info[k] && info[k].kind !== "claim") W.push(`${w}: claims 中的 ${k} 不是 claim 类型`); });
      c.disclosures.forEach(d => {
        if (!info[d.info]) E.push(`${w}: disclosure 引用不存在的 info ${d.info}`); else if (info[d.info].visibility === "author_only") E.push(`${w}: 不能披露 author_only 信息 ${d.info}`);
        if (!tids.has(d.topic)) E.push(`${w}: disclosure 的 topic ${d.topic} 不属于该角色`);
        checkCond(d.when, `${w}.disclosure.${d.info}`);
      });
      checkCond(c.present_when, `${w}.present_when`);
      c.topics.forEach(t => { checkCond(t.available_when, `${w}.topic.${t.id}`); checkEff(t.effects, `${w}.topic.${t.id}`); });
    });
    (pack.objects || []).forEach(o => { if (!locs.has(o.location)) E.push(`object ${o.id}: 地点不存在`); });
    pack.actions.forEach(a => {
      checkCond(a.conditions, `action ${a.id}`); checkCond(a.suggest_when, `action ${a.id}.suggest_when`);
      checkEff(a.effects, `action ${a.id}`); checkEff(a.effects_on_denied, `action ${a.id}.effects_on_denied`);
      if (a.conditions && !a.text_denied.trim()) E.push(`action ${a.id}: 有条件但缺少 text_denied`);
    });
    (pack.events || []).forEach(ev => { checkCond(ev.when, `event ${ev.id}`); checkEff(ev.effects, `event ${ev.id}`); });
    pack.outcomes.forEach(o => { checkCond(o.when, `outcome ${o.id}`); (o.text_variants || []).forEach(v => checkCond(v.when, `outcome ${o.id}.variant`)); });
    if (ext.deduction) {
      const d = ext.deduction;
      d.suspects.forEach(s => { if (!chars[s]) E.push(`deduction: 嫌疑人 ${s} 不存在`); });
      d.rules.forEach(r => { (r.evidence_all || []).forEach(k => { if (!info[k]) E.push(`deduction: 证据 ${k} 不存在`); }); if (r.outcome && !outs.has(r.outcome)) E.push(`deduction: 结局 ${r.outcome} 不存在`); checkEff(r.effects, `deduction.rule.${r.suspect}`); });
    }
    if (ext.inventory) ext.inventory.starting_items.forEach(i => { if (!items.has(i)) E.push(`inventory: 初始物品 ${i} 不存在`); });
    pack.actions.forEach(a => atomsOf(a.conditions).forEach(at => {
      if ("flag" in at && at.is !== state[at.flag].initial && !setTargets.has(at.flag + "=" + JSON.stringify(at.is)))
        W.push(`action ${a.id}: 条件 ${at.flag}=${at.is} 在本内容包里永远无法达成（若是有意预留请忽略）`);
    }));
    const reachable = new Set(pack.player.starting_known);
    const effLists = [];
    pack.actions.forEach(a => { effLists.push(a.effects, a.effects_on_denied || []); });
    (pack.events || []).forEach(ev => effLists.push(ev.effects));
    pack.characters.forEach(c => c.topics.forEach(t => effLists.push(t.effects || [])));
    (((pack.ext || {}).deduction || {}).rules || []).forEach(r => effLists.push(r.effects || []));
    effLists.forEach(l => l.forEach(e => { if ("reveal" in e) reachable.add(e.reveal); }));
    pack.characters.forEach(c => c.disclosures.forEach(d => reachable.add(d.info)));
    pack.info.forEach(i => { if (i.visibility !== "author_only" && i.kind !== "fact" && !reachable.has(i.id) && i.visibility !== "public") W.push(`info ${i.id}: 没有任何行动或披露能让玩家获得`); });
    return [E, W];
  }

  function newSave(pack) {
    const inv = (pack.ext || {}).inventory || {};
    return { pack_id: pack.pack_id, pack_version: pack.version, turn: 0, location: pack.player.starting_location,
      state: Object.fromEntries(pack.state.map(s => [s.id, s.initial])), known: pack.player.starting_known.slice(),
      items: (inv.starting_items || []).slice(), fired_events: [], done_actions: [], asked_topics: [], ended: null, history: [] };
  }
  const snapshot = s => canon({ location: s.location, state: s.state, known: s.known, items: s.items, ended: s.ended });
  function atom(a, s) {
    if ("flag" in a) return s.state[a.flag] === a.is;
    if ("int" in a) { const v = s.state[a.int], x = a.value; return { "==": v === x, "!=": v !== x, ">": v > x, ">=": v >= x, "<": v < x, "<=": v <= x }[a.op]; }
    if ("enum" in a) return "is" in a ? s.state[a.enum] === a.is : s.state[a.enum] !== a.is_not;
    if ("knows" in a) return s.known.includes(a.knows);
    if ("not_knows" in a) return !s.known.includes(a.not_knows);
    if ("has_item" in a) return s.items.includes(a.has_item);
    if ("not_has_item" in a) return !s.items.includes(a.not_has_item);
    if ("at" in a) return s.location === a.at;
    throw new Error("bad atom");
  }
  function ok(c, s) { if (!c) return true; if (c.all) return c.all.every(a => atom(a, s)); if (c.any) return c.any.some(a => atom(a, s)); return atom(c, s); }
  function apply(effs, s, pack, log) {
    const sv = Object.fromEntries(pack.state.map(v => [v.id, v]));
    (effs || []).forEach(e => {
      if ("set" in e) s.state[e.set] = e.to;
      else if ("add" in e) { const v = sv[e.add]; let x = s.state[e.add] + e.by; if ("min" in v) x = Math.max(v.min, x); if ("max" in v) x = Math.min(v.max, x); s.state[e.add] = x; }
      else if ("reveal" in e) { if (s.known.includes(e.reveal)) return; s.known.push(e.reveal); }
      else if ("give_item" in e) { if (!s.items.includes(e.give_item)) s.items.push(e.give_item); }
      else if ("remove_item" in e) { const i = s.items.indexOf(e.remove_item); if (i >= 0) s.items.splice(i, 1); }
      else if ("move_to" in e) s.location = e.move_to;
      else if ("end" in e) s.ended = s.ended || e.end;
      log.push(e);
    });
  }
  const present = (c, s) => "present_when" in c ? ok(c.present_when, s) : c.location === s.location;
  function suggestions(pack, s, n = 3) {
    const acts = [], topics = [];
    pack.actions.forEach(a => { if (a.suggest_when && ok(a.suggest_when, s) && ok(a.conditions, s) && (a.repeatable || !s.done_actions.includes(a.id))) acts.push({ id: a.id, label: a.label, kind: "action", intent: { kind: "action", action: a.id } }); });
    pack.characters.forEach(c => { if (!present(c, s)) return; c.topics.forEach(t => { const key = `${c.id}.${t.id}`; if (s.asked_topics.includes(key) || !ok(t.available_when, s)) return; topics.push({ id: `topic:${key}`, label: `Ask ${c.short_name || c.name}: ${t.label}`, kind: "topic", intent: { kind: "talk", character: c.id, topic: t.id } }); }); });
    return acts.slice(0, 2).concat(topics).concat(acts.slice(2)).slice(0, n);
  }
  const labels = (pack, s) => suggestions(pack, s).map(x => x.label).join(", ") || "looking around";
  const SYS = { clarify: "Do you mean: {opts}?", unsupported: "That isn't something you can do in this story. You could try: {opts}.", contradiction: "That doesn't match what you know so far.", unclear: "Sorry—I didn't follow that. You could try: {opts}.", ended: "This story has ended.", not_here: "{name} isn't here." };

  function processTurn(pack, save, intent) {
    const s = clone(save), before = snapshot(save), knownBefore = new Set(save.known);
    const log = []; let texts = [], speaker = null, status = "ok";
    const chars = Object.fromEntries(pack.characters.map(c => [c.id, c])), acts = Object.fromEntries(pack.actions.map(a => [a.id, a]));
    const kind = intent.kind;
    if (s.ended) return finish(pack, save, s, "ended", [SYS.ended], log, null, knownBefore, before);
    if (kind === "talk") {
      const c = chars[intent.character]; let topic = null;
      if (c) topic = c.topics.find(t => t.id === intent.topic) || null;
      if (!c || (intent.topic && !topic)) { status = "unclear"; texts = [SYS.unclear.replace("{opts}", labels(pack, s))]; }
      else if (!present(c, s)) { status = "denied"; texts = [SYS.not_here.replace("{name}", c.name)]; }
      else {
        speaker = c.id;
        if (topic && ok(topic.available_when, s)) {
          s.asked_topics.push(`${c.id}.${topic.id}`);
          apply(topic.effects, s, pack, log);
          const lines = [];
          c.disclosures.forEach(d => { if (d.topic === topic.id && !s.known.includes(d.info) && ok(d.when, s)) { apply([{ reveal: d.info }], s, pack, log); lines.push(d.line); } });
          texts = lines.length ? lines : [topic.fallback];
        } else texts = topic ? [topic.fallback] : ["(small talk — public information only)"];
      }
    } else if (kind === "action") {
      const a = acts[intent.action];
      if (!a) { status = "unclear"; texts = [SYS.unclear.replace("{opts}", labels(pack, s))]; }
      else if (!ok(a.conditions, s)) { status = "denied"; apply(a.effects_on_denied, s, pack, log); texts = [a.text_denied]; }
      else if (!a.repeatable && s.done_actions.includes(a.id)) texts = [a.text_success];
      else { apply(a.effects, s, pack, log); s.done_actions.push(a.id); texts = [a.text_success]; }
    } else if (kind === "accuse") {
      const d = (pack.ext || {}).deduction;
      if (!d || !d.suspects.includes(intent.suspect)) { status = "unclear"; texts = [SYS.unclear.replace("{opts}", labels(pack, s))]; }
      else {
        const cited = (intent.evidence || []).filter(e => s.known.includes(e));
        if (cited.length < d.min_evidence) { status = "denied"; texts = [d.no_evidence_text]; }
        else {
          let hit = false;
          for (const r of d.rules) {
            if (r.suspect !== intent.suspect) continue;
            if (!(r.evidence_all || []).every(e => cited.includes(e))) continue;
            if (cited.length < (r.evidence_min || 0)) continue;
            apply(r.effects, s, pack, log); if (r.outcome) apply([{ end: r.outcome }], s, pack, log);
            texts = [r.text]; hit = true; break;
          }
          if (!hit) { status = "denied"; texts = [d.no_evidence_text]; }
        }
      }
    } else if (kind === "clarify") { const l = (intent.candidates || []).filter(c => acts[c]).map(c => acts[c].label); status = "clarify"; texts = [SYS.clarify.replace("{opts}", l.join(" / ") || "something else")]; }
    else if (kind === "unsupported" || kind === "meta") { status = "unsupported"; texts = [SYS.unsupported.replace("{opts}", labels(pack, s))]; }
    else if (kind === "contradiction") { status = "contradiction"; texts = [SYS.contradiction]; }
    else { status = "unclear"; texts = [SYS.unclear.replace("{opts}", labels(pack, s))]; }
    if (status === "ok" || status === "denied") {
      for (let i = 0; i < 5; i++) {
        let fired = false;
        (pack.events || []).forEach(ev => {
          if ((ev.once !== false) && s.fired_events.includes(ev.id)) return;
          if (ok(ev.when, s)) { apply(ev.effects, s, pack, log); s.fired_events.push(ev.id); texts.push(ev.text); fired = true; }
        });
        if (!fired) break;
      }
      if (!s.ended) for (const o of pack.outcomes) { if (o.when && ok(o.when, s)) { s.ended = o.id; break; } }
    }
    return finish(pack, save, s, status, texts, log, speaker, knownBefore, before);
  }
  function finish(pack, save, s, status, texts, log, speaker, knownBefore, before) {
    let outcomeText = null;
    if (s.ended && !save.ended) {
      const o = pack.outcomes.find(o => o.id === s.ended);
      outcomeText = o.text + (o.text_variants || []).filter(v => ok(v.when, s)).map(v => " " + v.append).join("");
      status = "ended";
    }
    const revealed = s.known.filter(k => !knownBefore.has(k));
    if (!save.ended) s.turn += 1;
    return [{ status, effects_applied: log, revealed, outcome: status === "ended" ? s.ended : null, speaker,
      texts: texts.filter(Boolean), outcome_text: outcomeText,
      fallback_text: texts.concat(outcomeText ? [outcomeText] : []).filter(Boolean).join("\n\n"),
      suggestions: s.ended ? [] : suggestions(pack, s),
      generation_context: genCtx(pack, s, speaker, revealed, status, texts, outcomeText),
      changed: snapshot(s) !== before }, s];
  }
  function genCtx(pack, s, speaker, revealed, status, texts, outcomeText) {
    const info = Object.fromEntries(pack.info.map(i => [i.id, i]));
    const loc = pack.locations.find(l => l.id === s.location);
    const ctx = { location: { name: loc.name, description: loc.description }, characters_present: pack.characters.filter(c => present(c, s)).map(c => c.name),
      status, approved_result: texts, outcome: outcomeText, newly_revealed: revealed.map(k => info[k].text), player_knows: s.known.map(k => info[k].text) };
    if (speaker) { const c = pack.characters.find(c => c.id === speaker); ctx.speaker = { id: c.id, name: c.name, voice: c.voice, goal: c.goal, can_mention: c.knows.map(k => info[k].text), insists_on: (c.claims || []).map(k => info[k].text), refusals: c.refusals || [] }; }
    return ctx;
  }
  function leakCheck(pack, saveAfter, text) {
    const hits = [], low = text.toLowerCase();
    pack.info.forEach(i => { if (saveAfter.known.includes(i.id)) return; (i.leak_terms || []).forEach(t => { if (low.includes(t.toLowerCase())) hits.push([i.id, t]); }); });
    return hits;
  }
  function runTests(pack) {
    return pack.tests.map(t => {
      if (t.layer !== "rules") return { id: t.id, result: "SKIP", fails: [], description: t.description };
      const s = newSave(pack), st = t.setup || {};
      if ("location" in st) s.location = st.location;
      Object.assign(s.state, st.state || {});
      (st.known || []).forEach(k => { if (!s.known.includes(k)) s.known.push(k); });
      if ("items" in st) s.items = st.items.slice();
      const [res, s2] = processTurn(pack, s, t.intent || {});
      const ex = t.expect || {}, f = [];
      if ("status" in ex && res.status !== ex.status) f.push(`状态应为 ${ex.status}，实际为 ${res.status}`);
      Object.entries(ex.state || {}).forEach(([k, v]) => { if (s2.state[k] !== v) f.push(`变量 ${k} 应为 ${JSON.stringify(v)}，实际为 ${JSON.stringify(s2.state[k])}`); });
      (ex.reveals || []).forEach(k => { if (!res.revealed.includes(k)) f.push(`应获知 ${k}，但没有`); });
      (ex.must_not_reveal || []).forEach(k => {
        if (s2.known.includes(k)) f.push(`不应获知 ${k}，但获知了`);
        const i = pack.info.find(i => i.id === k);
        if (i && JSON.stringify(res.generation_context).includes(JSON.stringify(i.text).slice(1, -1))) f.push(`发给模型的上下文里出现了 ${k} 的原文`);
      });
      if ("items_after" in ex && canon(s2.items.slice().sort()) !== canon(ex.items_after.slice().sort())) f.push(`物品应为 ${JSON.stringify(ex.items_after)}，实际为 ${JSON.stringify(s2.items)}`);
      if ("outcome" in ex && res.outcome !== ex.outcome) f.push(`结局应为 ${ex.outcome}，实际为 ${res.outcome}`);
      if ("location" in ex && s2.location !== ex.location) f.push(`地点应为 ${ex.location}，实际为 ${s2.location}`);
      if (ex.no_change && res.changed) f.push("不应有任何状态变化，但有变化");
      const lk = leakCheck(pack, s2, res.fallback_text); if (lk.length) f.push(`兜底文本泄露：${JSON.stringify(lk)}`);
      return { id: t.id, result: f.length ? "FAIL" : "PASS", fails: f, description: t.description };
    });
  }
  // 测试覆盖检查（建议性）
  function coverage(pack) {
    const rules = pack.tests.filter(t => t.layer === "rules"), W = [];
    const need = { light: 4, medium: 8, heavy: 12 }[pack.intensity];
    if (rules.length < need) W.push(`intensity=${pack.intensity} 建议至少 ${need} 条规则层测试，目前 ${rules.length} 条`);
    const reached = new Set(rules.map(t => (t.expect || {}).outcome).filter(Boolean));
    pack.outcomes.forEach(o => { if (!reached.has(o.id)) W.push(`结局 ${o.id} 没有到达测试`); });
    if (pack.intensity === "heavy") {
      const st = new Set(rules.map(t => (t.expect || {}).status));
      [["denied", "条件不满足"], ["unsupported", "元指令/超出能力"]].forEach(([k, n]) => { if (!st.has(k)) W.push(`缺少“${n}”类测试（status=${k}）`); });
      if (!rules.some(t => (t.expect || {}).must_not_reveal)) W.push("缺少“提前索取秘密”类测试（must_not_reveal）");
    }
    return W;
  }
  function checkPlan(plan, validate) {
    const E = validate("segment_plan.schema.json", plan), W = [];
    if (!E.length) {
      if (plan.source.rights_status === "NOT_CONFIRMED") W.push("权利未确认（NOT_CONFIRMED）：可以评估切分，但不要进入步骤 B");
      const ids = plan.segments.map(s => s.segment_id); if (new Set(ids).size !== ids.length) E.push("segment_id 有重复");
      plan.segments.forEach(s => { if (s.minors_present && /romance|relationship/.test(s.template) && s.template === "relationship") W.push(`${s.segment_id}: 关系模板且有未成年人出场，请人工确认不涉及未成年人的恋爱内容`); });
      if (!plan.segments.some(s => s.priority === "signature")) W.push("没有任何 signature（卖点）段");
    }
    return [E, W];
  }
  const SV = { makeValidator, lint, newSave, processTurn, runTests, coverage, checkPlan, leakCheck, suggestions, ok };
  if (typeof module !== "undefined" && module.exports) module.exports = SV; else root.SV = SV;
})(typeof window !== "undefined" ? window : globalThis);
