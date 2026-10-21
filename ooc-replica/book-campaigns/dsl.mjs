// Authoring helpers for the book campaigns. They emit the storydate.campaign/0.3 shape that the
// Three Kingdoms engine (CC) validates and plays. Texts are written in Chinese only; `en` is a
// placeholder the build fills so the shared validator accepts the file (the reader page is zh-only).
export const EN = '(Chinese edition)';
export const T = zh => ({ zh, en: EN });

// ---- conditions ----
export const V = (v, op, val = true) => ({ v, op, val });
export const F = v => V(v, '==', true);
export const NF = v => V(v, '!=', true);
export const ALL = (...a) => ({ all: a });
export const ANY = (...a) => ({ any: a });
export const IS = (v, val) => V(v, '==', val);
export const GE = (v, n) => V(v, '>=', n);
export const LE = (v, n) => V(v, '<=', n);

// relationship tiers: 0–1 / 2–3 / 4–5 / 6–7 / 8–10, so a condition always sits on a boundary
export const TIER_START = [0, 2, 4, 6, 8];
export const TIER_END = [1, 3, 5, 7, 10];
export const AT = (c, axis, k) => V(`rel.${c}.${axis}`, '>=', TIER_START[k]);
export const UPTO = (c, axis, k) => V(`rel.${c}.${axis}`, '<=', TIER_END[k]);

// ---- effects ----
export const setv = (name, to = true) => ({ set: name, to });
export const add = (name, by = 1) => ({ add: name, by });
export const rel = (c, axis, by) => ({ add: `rel.${c}.${axis}`, by });

// ---- text blocks ----
export const P = (text, when) => (when ? { text: T(text), when } : { text: T(text) });
export const paras = x => (Array.isArray(x) ? x : [x]).map(p => (typeof p === 'string' ? P(p) : { text: T(p.text), ...(p.when ? { when: p.when } : {}) }));

export function choice(id, type, label, out, o = {}) {
  const c = { id, type, label: T(label), out: paras(out), effects: o.fx || [] };
  if (o.when) c.when = o.when;
  if (o.req) { c.req = o.req; c.hint = T(o.hint || '条件尚未满足'); }
  if (o.echo) c.echo = o.echo;
  if (o.debt) c.debt = o.debt;
  if (o.resolve) c.resolve = o.resolve;
  if (o.values) c.values = o.values;
  if (o.cg) c.cg = o.cg;
  if (o.ends) c.ends = true;
  if (o.alt) c.alt = o.alt;
  if (o.layer) c.layer = o.layer;
  return c;
}
export const callback = (pays, text, when) => ({ pays, text: T(text), ...(when ? { when } : {}) });

let order = 0;
export function node(id, chapter, kind, title, spec) {
  const n = {
    id, chapter, kind, title: T(title), lock: spec.lock || 'free', canon: T(spec.canon || '原创'),
    intro: paras(spec.intro), choices: spec.choices, salience: spec.salience ?? 1, order: spec.order ?? ++order,
  };
  for (const k of ['when', 'callbacks', 'on_enter', 'cast', 'art', 'place', 'talk', 'ask', 'quote', 'speaker', 'free_scene'])
    if (spec[k] !== undefined) n[k] = spec[k];
  return n;
}
export const resetOrder = () => { order = 0; };

export function talk(char, turns, topics, free = 3) {
  return { char, turns, free, topics: topics.map(t => ({ id: t.id, label: T(t.label), reply: paras(t.reply), effects: t.fx || [], ...(t.when ? { when: t.when } : {}), ...(t.req ? { req: t.req, hint: T(t.hint || '再熟一些才聊得到') } : {}), ...(t.echo ? { echo: t.echo } : {}), ...(t.mood ? { mood: t.mood } : {}), ...(t.cg ? { cg: t.cg } : {}) })) };
}
export function ask(who, q, answers, fallback, when) {
  return { who, q: T(q), fallback, ...(when ? { when } : {}), answers: answers.map(a => ({ id: a.id, means: T(a.means), match: a.match, out: paras(a.out), effects: a.fx || [], ...(a.echo ? { echo: a.echo } : {}) })) };
}

// ---- vars ----
export const numVar = (label, init, min, max, o = {}) => ({ type: 'num', init, min, max, label: T(label), ...o });
export const flagVar = label => ({ type: 'flag', init: false, label: T(label) });
export const enumVar = (label, init, values) => ({ type: 'enum', init, values, label: T(label) });

const DIM_LABEL = { warmth: '交情', trust: '信任', esteem: '看重', intimacy: '亲近' };
export function character(id, c) {
  const dims = { warmth: [c.warmth ?? 1, 0, 10], trust: [c.trust ?? 2, 0, 10], esteem: [c.esteem ?? 1, 0, 10] };
  if (c.romance) dims.intimacy = [c.intimacy ?? 0, 0, 10];
  const ch = {
    name: T(c.name), dims, main: c.main || 'trust', persona: T(c.persona), romance: !!c.romance,
    lens: Object.fromEntries(Object.entries(c.lens || {}).map(([k, v]) => [k, T(v)])),
    values: c.values || {}, seal: c.seal || [...c.name][0], ...(c.from_chapter ? { from_chapter: c.from_chapter } : {}),
  };
  if (c.react) ch.react = Object.fromEntries(Object.entries(c.react).map(([k, a]) => [k, a.map(T)]));
  if (c.openers) ch.openers = Object.fromEntries(Object.entries(c.openers).map(([k, v]) => [k, T(v)]));
  if (c.heat) ch.heat = c.heat;
  return ch;
}
export function relVars(chars) {
  const vars = {};
  for (const [id, c] of Object.entries(chars)) {
    for (const [d, [init, min, max]] of Object.entries(c.dims)) {
      const lens = c.lens[d] ? c.lens[d].zh : DIM_LABEL[d];
      vars[`rel.${id}.${d}`] = { type: 'num', init, min, max, label: T(`${c.name.zh}·${lens}`), char: id, dim: d };
    }
  }
  return vars;
}

export const dump = o => JSON.stringify(o);
