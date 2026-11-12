import {track} from './analytics.js';
import {escapeHTML as esc} from './stream.js';
import {XICHUAN_KEY, LATEST, cleanSaves, latestSave, legacySaves, validSave, progressText} from './xichuan-state.js';
let dispose = () => {};
export const isXichuanPath = path => ['/play/xichuan', '/story/xichuan'].includes(path);
export function stopXichuan() { dispose(); dispose = () => {}; }
export function mountXichuan({reference, account, helpers: h, storage = localStorage}) {
  const lang = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
  const t = (zh, en) => lang === 'zh' ? zh : en;
  let snapshot = cleanSaves(h.read(XICHUAN_KEY, {})), active = true, initialized = false;
  if (!account.user && !latestSave(snapshot)) {
    const old = legacySaves(storage);
    if (latestSave(old)) { snapshot = old; try { h.save(XICHUAN_KEY, snapshot); } catch {} }
  }
  const guest = account.user ? cleanSaves((() => { try { return JSON.parse(storage.getItem(XICHUAN_KEY)); } catch { return {}; } })()) : {};
  const old = legacySaves(storage), transferable = latestSave(guest) ? guest : old;
  const importable = account.user && !latestSave(snapshot) && latestSave(transferable);
  const root = reference.mountShell(`<style>
    .xc-header{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #333}
    .xc-header h1{font-size:16px;margin:0}.xc-header a{color:#ead6a2}.xc-status{font-size:12px;color:#bbb;margin-left:auto}
    .xc-transfer{padding:12px 16px;background:#25232b}.xc-transfer button{margin-left:10px;padding:8px;border:1px solid #6b626f;border-radius:8px;background:#38313b;color:#fff}
    #xichuan-frame{display:block;width:100%;height:calc(100dvh - 120px);min-height:380px;border:0;background:#111522}
    @media(max-width:600px){.xc-header{gap:8px;padding:8px 12px}.xc-status{width:100%;margin:0}#xichuan-frame{height:calc(100dvh - 175px);min-height:300px}}
  </style><header class="xc-header" data-no-i18n><a href="/play/xc-zhiyao">‹ ${t('和夏知遥聊聊', 'Chat with Zhiyao')}</a><h1>${t('汐川的第七个春天', 'The Seventh Spring of Xichuan')}</h1><span class="xc-status" role="status"></span></header>
  ${importable ? `<div class="xc-transfer" data-no-i18n>${t('此账号尚无汐川进度。', 'This account has no Xichuan progress.')}<button data-import>${t('接续本设备上的进度', 'Import this device’s progress')}</button></div>` : ''}
  <iframe id="xichuan-frame" title="${t('汐川互动故事', 'Xichuan visual novel')}" src="/assets/xichuan/index.html?site=1&lang=${lang}" allow="autoplay"></iframe>`, h, 'xichuan');
  const frame = root.querySelector('#xichuan-frame'), status = root.querySelector('.xc-status');
  const setStatus = () => status.textContent = (account.user ? t('账号进度 · ', 'Account progress · ') : t('本设备进度 · ', 'Device progress · ')) + progressText(snapshot, lang);
  setStatus();
  function persist(next) {
    if (!active || !frame.isConnected) return false;
    try {
      if (new TextEncoder().encode(JSON.stringify(next)).byteLength > 750000) throw Error('Save too large');
      h.save(XICHUAN_KEY, next);
      if (latestSave(next)) h.save('ooc-history', ['xichuan', ...h.read('ooc-history', []).filter(id => id !== 'xichuan')]);
      snapshot = next; setStatus(); return true;
    } catch { status.textContent = t('保存失败，请保留此页面并重试；可先返回聊天检查设备空间。', 'Save failed. Keep this page open, free device space and retry.'); return false; }
  }
  root.querySelector('[data-import]')?.addEventListener('click', () => {
    if (!active || latestSave(snapshot) || !persist(structuredClone(transferable))) return;
    root.querySelector('.xc-transfer')?.remove(); initialized = false; frame.src = frame.src;
    track('xichuan_progress_imported', {game: 'xichuan'});
  });
  let previous = latestSave(snapshot)?.G;
  const receive = event => {
    if (!active || !frame.isConnected || event.origin !== location.origin || event.source !== frame.contentWindow) return;
    const d = event.data;
    if (d?.type === 'xc-ready' && !initialized) {
      initialized = true;
      const initial = {...snapshot, latest: snapshot[LATEST], lang}; delete initial[LATEST];
      frame.contentWindow.postMessage({type: 'xc-init', snapshot: initial}, location.origin);
    }
    if (d?.type !== 'xc-save' || !initialized || !validSave(d.key, d.value)) return;
    const next = {...snapshot}, key = d.key === 'latest' ? LATEST : d.key;
    if (d.value === null) delete next[key]; else next[key] = d.value;
    if (d.key === 'auto' && d.value) next[LATEST] = d.value;
    if (!persist(next)) return;
    const current = latestSave(snapshot)?.G;
    if (current && current.cur !== previous?.cur) track('game_scene', {game: 'xichuan', chapter: current.ch, scene: current.cur});
    if (current && current.ch !== previous?.ch) track('game_chapter_reached', {game: 'xichuan', chapter: current.ch});
    if (current?.phase === 'end' && previous?.phase !== 'end') track('game_volume_ended', {game: 'xichuan'});
    previous = current;
  };
  window.addEventListener('message', receive);
  track('game_opened', {game: 'xichuan', lang});
  dispose = () => { active = false; window.removeEventListener('message', receive); };
  document.title = t('汐川的第七个春天', 'The Seventh Spring of Xichuan') + ' · StoryDate';
}
export function zhiyaoStoryLink(h, lang) {
  const raw = h.read(XICHUAN_KEY, {}), played = Boolean(latestSave(raw));
  return `<aside class="xc-chat-bridge" data-no-i18n style="flex-shrink:0;margin:8px 12px;padding:10px 12px;border:1px solid #62546b;border-radius:12px;font-size:13px"><p style="margin:0 0 8px">${esc(progressText(raw, lang))}</p><a href="/play/xichuan" style="color:#ead6a2">${lang === 'zh' ? played ? '继续她的故事 →' : '走进她的故事 →' : played ? 'Continue her story →' : 'Step into her story →'}</a><small style="display:block;color:#aaa;margin-top:6px">${lang === 'zh' ? '故事里的选择会带回聊天。聊天不会改写游戏选项和存档。' : 'Story choices carry back to chat. Chat does not change game choices or saves.'}</small></aside>`;
}
