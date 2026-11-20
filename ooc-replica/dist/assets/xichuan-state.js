import {ZHIYAO_ID, SHENCHENG_ID, JIBAI_ID, heroineCanKnowFact, xichuanCharacterById} from './xichuan-character.js';
import {XICHUAN_FACT_LABELS} from './flywheel/cards-data.js';

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
// Project just the current save. Other routes' node names, dialogue, logs and
// player-entered save labels are not part of a companion's story memory.
export function storyContext(raw, characterId = ZHIYAO_ID) {
  const save = latestSave(raw), character = xichuanCharacterById(characterId);
  if (!save || !character) return null;
  const values = save.G.v, flags = {};
  for (const key of Object.keys(XICHUAN_FACT_LABELS)) {
    if (heroineCanKnowFact(characterId, key) && typeof values[key] === 'boolean') flags[key] = values[key];
  }
  const numericKeys = ['warmth', 'trust', 'esteem', 'intimacy'].map(dim => `rel.${character.key}.${dim}`);
  for (const key of [...numericKeys, 'grudge.' + character.key]) {
    if (Number.isFinite(values[key])) flags[key] = Math.max(0, Math.min(10, values[key]));
  }
  return {chapter: save.G.ch, ended: save.G.phase === 'end', flags};
}

const milestones = {
  [ZHIYAO_ID]: [
    ['broken_zhiyao', '你们已经决裂。', 'You have broken with her.'],
    ['z_broke_promise', '你没能履行最后一场的约定。', 'You missed your promise at the last show.'],
    ['z_promised', '你答应最后一场站在她身边。', 'You promised to stand beside her at the last show.'],
    ['joined_club', '你已加入电影社。', 'You have joined the film club.']
  ],
  [SHENCHENG_ID]: [
    ['broken_shencheng', '你们已经决裂。', 'You have broken with her.'],
    ['c_good', '你和她一起写下了第七封信。', 'You wrote the seventh letter together.'],
    ['c_keep', '你决定留下老房子。', 'You decided to keep the old house.'],
    ['c_sold', '你卖掉了老房子。', 'You sold the old house.'],
    ['c_tore', '你撕开了她的一封信。', 'You tore open one of her letters.'],
    ['c_letters', '你没有拆她的信。', 'You left her letters unopened.'],
    ['cheng_promise', '你想起了七年前的约定。', 'You remembered the promise from seven years ago.'],
    ['third_cheng', '她加入了电影社。', 'She joined the film club.'],
    ['cheng_coffee', '你在她的店里点了小时候那杯热可可。', 'You ordered your childhood cocoa at her café.']
  ],
  [JIBAI_ID]: [
    ['broken_jibai', '你们已经决裂。', 'You have broken with her.'],
    ['j_good', '海堤上，她决定留下来。', 'On the seawall, she chose to stay.'],
    ['j_whole', '你们把第七卷胶片接完整了。', 'You restored reel seven in full.'],
    ['j_projector', '你买下了放映机。', 'You bought the projector.'],
    ['j_watched', '你陪她看完了最后一卷。', 'You watched the final reel with her.'],
    ['reel_together', '你答应和她一起看第七卷。', 'You promised to watch reel seven with her.'],
    ['third_jibai', '她加入了电影社。', 'She joined the film club.'],
    ['saw_reel', '你看见了那盘没有标签的胶片。', 'You saw the unlabeled reel.']
  ]
};
export function progressText(raw, lang = 'zh', characterId = null) {
  const save = latestSave(raw), zh = lang === 'zh';
  if (!save) return zh ? '从序章开始，认识她的故事。' : 'Start at the prologue and discover her story.';
  const g = save.G, ended = g.phase === 'end';
  const base = zh ? (ended ? '已到达结局' : g.ch === 0 ? '序章进行中' : `第 ${g.ch} 章进行中`) :
    (ended ? 'Ending reached' : g.ch === 0 ? 'Prologue in progress' : `Chapter ${g.ch} in progress`);
  // Generic history and player surfaces follow the current route first and
  // retain the original Zhiyao summary when a route milestone isn't present.
  const personalRoutes = [ZHIYAO_ID, SHENCHENG_ID, JIBAI_ID];
  const activeRoute = personalRoutes.find(id => g.v['flag.route_' + xichuanCharacterById(id).key] === true);
  // Some older saves carry a personal chapter milestone without a route flag.
  // Meeting someone in the common chapters alone does not select her route.
  const inferredRoute = !activeRoute && !characterId && personalRoutes.find(id => milestones[id].some(([key]) =>
    /^(?:broken_|[zcj]_)/.test(key) && g.v['flag.' + key] === true));
  const ids = characterId ? [characterId] : [activeRoute || inferredRoute, ZHIYAO_ID];
  for (const id of ids) {
    if (!xichuanCharacterById(id)) continue;
    const fact = milestones[id].find(([key]) => g.v['flag.' + key] === true);
    if (fact) return base + ' · ' + fact[zh ? 1 : 2];
  }
  return base;
}
