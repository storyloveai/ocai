// Site-owned, account-scoped save envelope. Standalone xc.* keys remain untouched.
export const XICHUAN_KEY = 'ooc-session-v2-xichuan';
export const LATEST = 'game.xichuan';
export const SAVE_KEYS = ['auto', ...Array.from({length: 9}, (_, i) => 'slot' + (i + 1)), 'latest', 'seen', 'cg', 'ends', 'lang', 'music', 'tilt'];
const plain = v => v && typeof v === 'object' && !Array.isArray(v);
export function playable(v) {
  return Boolean(plain(v) && plain(v.G) && plain(v.G.v) && Number.isInteger(v.G.ch) && v.G.ch >= 0 && v.G.ch < 8 &&
    ['node', 'side', 'end'].includes(v.G.phase) && (v.G.phase !== 'node' || typeof v.G.cur === 'string') &&
    Array.isArray(v.G.log) && Array.isArray(v.G.ledger) && plain(v.G.echoes) &&
    plain(v.V) && Array.isArray(v.V.queue) && v.V.queue.every(op => plain(op) && typeof op.op === 'string') &&
    Number.isInteger(v.V.i) && v.V.i >= 0 && v.V.i <= v.V.queue.length && Array.isArray(v.V.log) &&
    plain(v.V.sprites) && Object.values(v.V.sprites).every(plain) &&
    [v.V.bg, v.V.cg].every(id => id == null || typeof id === 'string') &&
    Array.isArray(v.G.offer) && v.G.offer.every(id => typeof id === 'string') && Array.isArray(v.G.done));
}
export function validSave(key, value) {
  if (!SAVE_KEYS.includes(key)) return false;
  if (value === null) return true;
  if (key === 'lang') return ['zh', 'en'].includes(value);
  if (key === 'music' || key === 'tilt') return typeof value === 'boolean';
  if (['seen', 'cg', 'ends'].includes(key)) return Array.isArray(value) && value.length <= 5000 && value.every(x => typeof x === 'string' && x.length < 160);
  try { return playable(value) && JSON.stringify(value).length <= 100000; } catch { return false; }
}
export function cleanSaves(raw) {
  const out = {};
  for (const key of SAVE_KEYS) {
    const value = raw?.[key === 'latest' ? LATEST : key];
    if (value != null && validSave(key, value)) out[key === 'latest' ? LATEST : key] = structuredClone(value);
  }
  return out;
}
export function latestSave(raw) {
  // An explicit latest snapshot (including an ending or a manual rollback)
  // takes precedence. A broken latest must not silently resume an older branch.
  const current = raw?.[LATEST] ?? raw?.auto;
  return current != null && validSave('latest', current) ? current : null;
}
export function readXichuanProgress(read, account, storage) {
  if (account?.busy || account?.restored === false) return {};
  const raw = read(XICHUAN_KEY, {}) || {};
  if (account?.user || raw[LATEST] != null || raw.auto != null) return raw;
  try {
    const legacy = legacySaves(storage ?? globalThis.localStorage);
    if (latestSave(legacy)) return {...legacy, ...raw};
  } catch {}
  return raw;
}
export function xichuanStoryEntry(raw, lang) {
  const save = latestSave(raw), zh = lang === 'zh';
  if (!save) return {href: '/play/xichuan', label: zh ? '进入故事 →' : 'Enter the story →'};
  const ending = save.G.phase === 'end';
  return {href: '/play/xichuan?entry=resume', label: ending
    ? (zh ? '回顾结局 →' : 'Review ending →')
    : (zh ? '继续故事 →' : 'Continue story →')};
}
export function legacySaves(storage) {
  const raw = {};
  for (const key of SAVE_KEYS.filter(k => k !== 'latest')) {
    try { raw[key] = JSON.parse(storage.getItem('xc.' + key)); } catch {}
  }
  const out = cleanSaves(raw);
  // Older standalone players wrote xc.latest only on completion and cleared
  // xc.auto at that point. A later playthrough can create a newer autosave.
  let ending;
  try { ending = JSON.parse(storage.getItem('xc.latest')); } catch {}
  if (ending?.G?.phase === 'end' && validSave('latest', ending) && (!out.auto || ending.at > out.auto.at)) {
    out[LATEST] = ending;
    return out;
  }
  const last = [out.auto, ...SAVE_KEYS.filter(k => k.startsWith('slot')).map(k => out[k])].filter(playable).sort((a, b) => (b.at || 0) - (a.at || 0))[0];
  if (last) out[LATEST] = structuredClone(last);
  return out;
}
// Only a small typed projection reaches the model, never arbitrary save labels or logs.
export function storyContext(raw) {
  const s = latestSave(raw);
  if (!s) return null;
  const flags = {};
  for (const [key, value] of Object.entries(s.G.v)) {
    if (/^flag\.(joined_club|saw_last_spring|poster_sale|knows_mom|zhiyao_secret|route_zhiyao|route_shencheng|route_jibai|route_none|broken_zhiyao|z_[a-z_]+)$/.test(key) && typeof value === 'boolean') flags[key] = value;
    if (/^(rel\.zhiyao\.(warmth|trust|esteem|intimacy)|grudge\.zhiyao)$/.test(key) && Number.isFinite(value)) flags[key] = Math.max(0, Math.min(10, value));
  }
  return {chapter: s.G.ch, node: typeof s.G.cur === 'string' ? s.G.cur.slice(0, 80) : null, ended: s.G.phase === 'end', flags};
}
export function progressText(raw, lang = 'zh') {
  const s = latestSave(raw);
  if (!s) return lang === 'zh' ? '从序章开始，认识她的故事。' : 'Start at the prologue and discover her story.';
  const c = storyContext(raw), f = c.flags;
  const base = lang === 'zh' ? (c.ended ? '已到达结局' : c.chapter === 0 ? '序章进行中' : `第 ${c.chapter} 章进行中`) : (c.ended ? 'Ending reached' : c.chapter === 0 ? 'Prologue in progress' : `Chapter ${c.chapter} in progress`);
  const fact = f['flag.broken_zhiyao'] ? ['你们已经决裂。', 'You have broken with her.'] : f['flag.z_broke_promise'] ? ['你没能履行最后一场的约定。', 'You missed your promise at the last show.'] : f['flag.z_promised'] ? ['你答应最后一场站在她身边。', 'You promised to stand beside her at the last show.'] : f['flag.joined_club'] ? ['你已加入电影社。', 'You have joined the film club.'] : null;
  return base + (fact ? ' · ' + fact[lang === 'zh' ? 0 : 1] : '');
}
