import {characterReturnUrl} from './character-links.js';
import {attachGameCredits} from './game-credit-bridge.js';
import {xichuanAction} from './loop-events.js';
import {track} from './analytics.js';
import {escapeHTML as esc} from './stream.js';
import {currentLang, setLang} from './site-i18n.js';
import {XICHUAN_KEY, LATEST, cleanSaves, latestSave, legacySaves, validSave, progressText} from './xichuan-state.js';
let dispose = () => {};
export const isXichuanPath = path => path === '/play/xichuan';
export function stopXichuan() { dispose(); dispose = () => {}; }
export function mountXichuan({reference, account, helpers: h, storage = localStorage}) {
  let lang = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
  const t = (zh, en) => lang === 'zh' ? zh : en;
  let snapshot = cleanSaves(h.read(XICHUAN_KEY, {})), active = true, initialized = false;
  if (!account.user && !latestSave(snapshot)) {
    const old = legacySaves(storage);
    if (latestSave(old)) { snapshot = old; try { h.save(XICHUAN_KEY, snapshot); } catch {} }
  }
  const guest = account.user ? cleanSaves((() => { try { return JSON.parse(storage.getItem(XICHUAN_KEY)); } catch { return {}; } })()) : {};
  const old = legacySaves(storage), transferable = latestSave(guest) ? guest : old;
  const importable = account.user && !account.syncError && !latestSave(snapshot) && latestSave(transferable);
  const origin = characterReturnUrl(globalThis.history?.state?.characterReturn) || characterReturnUrl(globalThis.history?.state?.from);
  const returnUrl = origin || '/story/xichuan';
  const returnLabel = () => origin?.startsWith('/play/') ? t('返回聊天', 'Back to chat') : origin ? t('返回人物', 'Back to character') : t('故事介绍', 'Story information');
  const root = reference.mountShell(`<style>
    [data-page="xichuan"] .sd-language-slot{display:none!important}
    .xc-header{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #333}
    .xc-header h1{font-size:16px;margin:0}.xc-header a{display:inline-flex;align-items:center;min-height:44px;padding:9px 12px;border:1px solid #3a3a3a;border-radius:8px;color:#fafafa;text-decoration:none}.xc-status{font-size:12px;color:#bbb;margin-left:auto}
    .xc-transfer{padding:12px 16px;background:#25232b}.xc-transfer button{margin-left:10px;padding:8px;border:1px solid #6b626f;border-radius:8px;background:#38313b;color:#fff}
    #xichuan-frame{display:block;width:100%;height:var(--xc-frame-height,calc(100dvh - 120px));min-height:160px;border:0;background:#111522}
    @media(max-width:600px){.xc-header{gap:8px;padding:8px 12px}.xc-status{width:100%;margin:0}}
  </style><header class="xc-header" data-no-i18n><a href="${esc(returnUrl)}" data-xichuan-return>‹ ${returnLabel()}</a><h1>${t('汐川的第七个春天', 'The Seventh Spring of Xichuan')}</h1><span class="xc-status" role="status"></span></header>
  ${importable ? `<div class="xc-transfer" data-no-i18n><span data-xichuan-import-note>${t('此账号尚无汐川进度。', 'This account has no Xichuan progress.')}</span><button data-import>${t('接续本设备上的进度', 'Import this device’s progress')}</button></div>` : ''}
  <iframe id="xichuan-frame" title="${t('汐川互动故事', 'Xichuan visual novel')}" src="/assets/xichuan/index.html?site=1&lang=${lang}" allow="autoplay"></iframe>`, h, 'xichuan');
  const frame = root.querySelector('#xichuan-frame'),gameCredits=attachGameCredits(frame,account,{lang}), status = root.querySelector('.xc-status');
  // The mobile site footer and wrapped bilingual header have real heights.
  // Fit the story between them instead of clipping its controls under a fixed
  // subtraction. No game state or iframe contract is changed by this layout.
  const bottomBars = [...root.querySelectorAll('a[href="/history"]')].map(a => a.closest('.fixed')).filter(Boolean);
  const fitFrame = () => {
    if (!active || !frame.isConnected || !frame.getBoundingClientRect) return;
    const height = window.visualViewport?.height || window.innerHeight;
    if (!Number.isFinite(height)) return;
    const top = frame.getBoundingClientRect().top;
    const bars = bottomBars.map(node => node.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0 && r.top > height / 2 && r.top < height);
    const bottom = bars.length ? Math.min(height,...bars.map(r => r.top)) : height;
    frame.style.setProperty('--xc-frame-height',Math.max(160,bottom - top) + 'px');
  };
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(fitFrame) : null;
  resize?.observe(root.querySelector('.xc-header'));
  const creditBar = root.querySelector('[data-game-credits]');
  if (creditBar) resize?.observe(creditBar);
  for (const bar of bottomBars) resize?.observe(bar);
  window.addEventListener('resize',fitFrame);
  window.visualViewport?.addEventListener('resize',fitFrame);
  fitFrame();
  let saveFailed = false;
  const setStatus = () => status.textContent = saveFailed ? t('保存失败，请保留此页面并重试；可先返回聊天检查设备空间。', 'Save failed. Keep this page open, free device space and retry.') : (account.user ? t('账号进度 · ', 'Account progress · ') : t('本设备进度 · ', 'Device progress · ')) + progressText(snapshot, lang);
  setStatus();
  const paintLanguage = next => {
    if (!active || !frame.isConnected || !['zh','en'].includes(next)) return;
    lang = next;
    root.querySelector('.xc-header h1').textContent = t('汐川的第七个春天', 'The Seventh Spring of Xichuan');
    root.querySelector('[data-xichuan-return]').textContent = '‹ ' + returnLabel();
    const note = root.querySelector('[data-xichuan-import-note]'), button = root.querySelector('[data-import]');
    if (note) note.textContent = t('此账号尚无汐川进度。', 'This account has no Xichuan progress.');
    if (button) button.textContent = t('接续本设备上的进度', 'Import this device’s progress');
    frame.title = t('汐川互动故事', 'Xichuan visual novel');
    gameCredits.setLanguage(next);
    setStatus(); fitFrame();
    document.title = t('汐川的第七个春天', 'The Seventh Spring of Xichuan') + ' · StoryDate';
  };
  const onSiteLanguage = event => paintLanguage(event.detail);
  globalThis.addEventListener?.('sd-lang',onSiteLanguage);
  function persist(next) {
    if (!active || !frame.isConnected) return false;
    try {
      if (new TextEncoder().encode(JSON.stringify(next)).byteLength > 750000) throw Error('Save too large');
      h.save(XICHUAN_KEY, next);
      if (latestSave(next)) h.save('ooc-history', ['xichuan', ...h.read('ooc-history', []).filter(id => id !== 'xichuan')]);
      snapshot = next; saveFailed = false; setStatus(); return true;
    } catch { saveFailed = true; setStatus(); return false; }
  }
  root.querySelector('[data-import]')?.addEventListener('click', () => {
    if (!active || latestSave(snapshot) || !persist(structuredClone(transferable))) return;
    root.querySelector('.xc-transfer')?.remove(); fitFrame(); initialized = false; frame.src = frame.src;
    track('xichuan_progress_imported', {game: 'xichuan'});
  });
  let previous = latestSave(snapshot)?.G;
  const receive = event => {
    if (!active || !frame.isConnected || event.origin !== location.origin || event.source !== frame.contentWindow) return;
    const d = event.data;
    if (d?.type === 'xc-ready' && !initialized) {
      gameCredits.install();initialized = true;
      const initial = {...snapshot, latest: snapshot[LATEST], lang}; delete initial[LATEST];
      frame.contentWindow.postMessage({type: 'xc-init', snapshot: initial}, location.origin);
    }
    if(d?.type === 'xc-action' && initialized){xichuanAction(d);return;}
    if (d?.type !== 'xc-save' || !initialized || !validSave(d.key, d.value)) return;
    if (d.key === 'lang' && ['zh','en'].includes(d.value)) {
      if (currentLang() !== d.value) setLang(d.value);
      else if (lang !== d.value) paintLanguage(d.value);
    }
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
  dispose = () => { gameCredits.dispose();active = false; resize?.disconnect();window.removeEventListener('resize',fitFrame);window.visualViewport?.removeEventListener('resize',fitFrame);window.removeEventListener('message', receive);globalThis.removeEventListener?.('sd-lang',onSiteLanguage); };
  document.title = t('汐川的第七个春天', 'The Seventh Spring of Xichuan') + ' · StoryDate';
}
export function zhiyaoStoryLink(h, lang) {
  const raw = h.read(XICHUAN_KEY, {}), played = Boolean(latestSave(raw)), progress = progressText(raw, lang);
  return `<aside class="xc-chat-bridge" data-no-i18n><p data-xichuan-progress title="${esc(progress)}">${esc(progress)}</p><a href="/play/xichuan" data-xichuan-entry>${lang === 'zh' ? played ? '继续故事 →' : '进入故事 →' : played ? 'Continue story →' : 'Enter story →'}</a></aside>`;
}
