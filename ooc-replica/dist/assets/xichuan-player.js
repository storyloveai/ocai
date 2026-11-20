import {ZHIYAO_ID, isXichuanCharacterId} from './xichuan-character.js';
import {characterReturnUrl} from './character-links.js';
import {attachGameCredits} from './game-credit-bridge.js';
import {xichuanAction} from './loop-events.js';
import {track} from './analytics.js';
import {escapeHTML as esc} from './stream.js';
import {currentLang, setLang} from './site-i18n.js';
import {XICHUAN_KEY, LATEST, cleanSaves, readXichuanProgress, latestSave, legacySaves, validSave, progressText, xichuanStoryEntry} from './xichuan-state.js';
let dispose = () => {};
export const isXichuanPath = path => path === '/play/xichuan';
export function stopXichuan() { dispose(); dispose = () => {}; }
export function mountXichuan({reference, account, helpers: h, storage = localStorage}) {
  let lang = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
  const t = (zh, en) => lang === 'zh' ? zh : en;
  let snapshot = readXichuanProgress(h.read, account, storage), active = true, initialized = false;
  const entryUrl = new URL(location.href || location.origin);
  let requestedResume = entryUrl.searchParams.get('entry') === 'resume';
  let transferable = null;
  if (account.user && !account.syncError && snapshot[LATEST] == null && snapshot.auto == null) {
    let guest;
    try { guest = JSON.parse(storage.getItem(XICHUAN_KEY)); } catch {}
    const device = guest?.[LATEST] != null || guest?.auto != null ? guest : legacySaves(storage);
    if (latestSave(device)) transferable = cleanSaves(device);
  }
  const origin = characterReturnUrl(globalThis.history?.state?.characterReturn) || characterReturnUrl(globalThis.history?.state?.from);
  const chatId = origin?.startsWith('/play/') ? origin.slice('/play/'.length) : null;
  const returnUrl = isXichuanCharacterId(chatId) ? origin + '?from=xichuan' : origin || '/story/xichuan';
  const returnLabel = () => origin?.startsWith('/play/') ? t('返回聊天', 'Back to chat') : origin ? t('返回人物', 'Back to character') : t('故事介绍', 'Story information');
  const root = reference.mountShell(`<style>
    [data-page="xichuan"] .sd-language-slot{display:none!important}
    .xc-header{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #333}
    .xc-header h1{font-size:16px;margin:0}.xc-header a{display:inline-flex;align-items:center;min-height:44px;padding:9px 12px;border:1px solid #3a3a3a;border-radius:8px;color:#fafafa;text-decoration:none}.xc-status{font-size:12px;color:#bbb;margin-left:auto}
    .xc-transfer{padding:12px 16px;background:#25232b}.xc-transfer button{margin-left:10px;padding:8px;border:1px solid #6b626f;border-radius:8px;background:#38313b;color:#fff}
    #xichuan-frame{display:block;width:100%;height:var(--xc-frame-height,calc(100dvh - 120px));min-height:160px;border:0;background:#111522}
    @media(max-width:1023px){[data-page="xichuan"] [data-xichuan-site-navigation]{display:none!important}[data-page="xichuan"] .shell-content{padding-bottom:0}}
    @media(max-width:600px){.xc-header{gap:8px;padding:8px 12px}.xc-status{width:100%;margin:0}}
  </style><header class="xc-header" data-no-i18n><a href="${esc(returnUrl)}" data-xichuan-return>‹ ${returnLabel()}</a><h1>${t('汐川的第七个春天', 'The Seventh Spring of Xichuan')}</h1><span class="xc-status" role="status"></span></header>
  ${transferable ? `<div class="xc-transfer" data-no-i18n><span data-xichuan-import-note>${t('此账号尚无汐川进度。', 'This account has no Xichuan progress.')}</span><button data-import>${t('接续本设备上的进度', 'Import this device’s progress')}</button></div>` : ''}
  <iframe id="xichuan-frame" title="${t('汐川互动故事', 'Xichuan visual novel')}" src="/assets/xichuan/index.html?site=1&lang=${lang}" allow="autoplay"></iframe>`, h, 'xichuan');
  const frame = root.querySelector('#xichuan-frame'),gameCredits=attachGameCredits(frame,account,{lang}), status = root.querySelector('.xc-status');
  // Reading keeps one exit in the host header; the mobile site navigation is
  // hidden here, as it is in chat. Measure actual remaining bars rather than
  // reserving their old space. The game state and iframe contract stay intact.
  const bottomBars = [...root.querySelectorAll('a[href="/history"]')].map(a => a.closest('.fixed')).filter(Boolean);
  for (const bar of bottomBars) bar.setAttribute('data-xichuan-site-navigation','');
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
      const initial = cleanSaves(snapshot);
      initial.latest = initial[LATEST]; delete initial[LATEST]; initial.lang = lang;
      const entry = requestedResume && latestSave(snapshot) ? 'resume' : 'title';
      frame.contentWindow.postMessage({type: 'xc-init', entry, snapshot: initial}, location.origin);
      if (requestedResume) {
        requestedResume = false;
        entryUrl.searchParams.delete('entry');
        history.replaceState(history.state, '', entryUrl.pathname + entryUrl.search + entryUrl.hash);
      }
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
export function xichuanStoryLink(raw, lang, id = ZHIYAO_ID) {
  const progress = progressText(raw, lang, id);
  const {href, label} = xichuanStoryEntry(raw, lang);
  return `<div class="xc-chat-story"><p data-xichuan-progress title="${esc(progress)}">${esc(progress)}</p><a href="${esc(href)}" data-xichuan-entry>${esc(label)}</a></div>`;
}

export const zhiyaoStoryLink = xichuanStoryLink;
