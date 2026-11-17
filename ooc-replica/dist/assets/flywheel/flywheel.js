import {mountShell} from '../reference.js';
import {getLang} from '../site-i18n.js';
import {escapeHTML as safe} from '../stream.js';
import {heroSceneMarkup, mountHeroContent} from '../hero-scene.js';
import {XICHUAN_KEY, latestSave, legacySaves, progressText, storyContext} from '../xichuan-state.js';
import {CHARACTER_CARDS, WORKS, UNIVERSES, XICHUAN_FACT_LABELS, cardById, cardsByUniverse} from './cards-data.js';
import {characterArt} from './character-art.js';
import {readDiscoveryState, patchDiscoveryState, discoveryUrl} from './discovery-state.js';
import {characterDirectoryReturn, characterReturnUrl, storyReturnUrl, canonicalCharacterUrl} from '../character-links.js';
import {storiesForCharacter} from '../character-stories.js';
import {characterById as threadedProfiles} from '../character-profiles.js';

const DRAFT_KEY = 'sd-flywheel-drafts';
// 手机端顶栏（≤1023px 显示；桌面由侧栏承担），沿用 hub 的 sd-lang 按钮模式
const mobileBar = () => {
  const lang = getLang();
  return `<header class="fw-mobile-bar"><a href="/" aria-label="StoryDate"><img src="/assets/storydate-dialogue-logo.svg" alt="StoryDate" width="120" height="24"></a><div class="sd-lang sd-lang-top" role="group" aria-label="${lang === 'zh' ? '语言' : 'Language'}">${['en', 'zh'].map((x) => `<button type="button" data-sd-lang="${x}" aria-pressed="${x === lang}">${x === 'zh' ? '中文' : 'EN'}</button>`).join('')}</div></header>`;
};

// Task #154: a focused way to discover characters and enter existing stories.
// No simulated permissions, separate editor or invented gameplay outcomes.
const copy = {
 zh: {
  imageUnavailable: "图片暂不可用",
  missingCharacter: "没有找到这个角色",
  missingWorld: "没有找到这个故事世界",
  missingGuide: "可以从目录里重新选择，已有的聊天和故事进度仍会保留。",
  libTitle: "认识故事里的人",
  libSub: "从一个让你好奇的角色开始，走进 TA 的故事。",
  chatBack: "返回聊天",
  storiesNav: "返回故事",
  storyFilter: "按故事筛选",
  all: "全部",
  chatOnly: "可聊天",
  empty: "没有找到符合条件的角色。",
  resetSearch: "清除搜索与筛选",
  filtersLabel: "筛选角色",
  count: n => `${n} 个角色`,
  searchPh: "搜索名字、故事或关键词",
  chatCta: "开始聊天",
  continueChat: "继续聊天",
  storyCta: "进入故事",
  continueStory: "继续故事",
  profileBack: "返回角色",
  personaH: "人物背景",
  voiceH: "听 TA 说话",
  lockedH: "人物设定",
  appearH: "出场故事",
  restoring: "正在恢复账号进度…",
  stateUnavailable: "暂时无法读取此设备上的经历。请稍后刷新重试。",
  accountProgress: "当前账号的经历",
  deviceProgress: "本设备的经历",
  restoreFailed: "云端进度尚未恢复，以下为当前账号在本设备上的记录。",
  reviewH: "共同经历",
  noChatYet: "还没有对话，可以从第一次相遇开始。",
  chatSaved: n => `当前对话已有 ${n} 条消息。`,
  storyFacts: "当前剧情",
  memoriesH: "当前对话的记事",
  memoryNotesH: "聊天中的补充记忆",
  memoryYou: "你记下的话",
  memoryCharacter: "角色说过的话",
  memoryDemo: "记下的演示回复",
  memoryLimit: "补充记忆当前使用前 350 字；可在会话设置中整理原文。",
  noMemories: "还没有记事。在聊天中把想留下的话记下来，回来就能回顾。",
  noStoryFacts: "尚未开始故事。进入汐川后，经历会随当前存档更新。",
  detailsH: "人物详细设定（含剧透）",
  samplesFrom: "原作节选",
  noSamples: "暂无原作节选。",
  sameUniverseH: "故事里的其他人",
  noChat: "可以先进入故事认识 TA，独立聊天暂未开放。",
  standalone: "将打开独立游戏页面。此入口的进度尚未与角色聊天同步。",
  exprH: "切换表情",
  encounterCta: "进入相遇",
  topicsH: "可以从这里聊起",
  charactersNav: "角色",
  builderTitle: "打开创作工坊",
  legacyH: "旧版演示草稿",
  legacySub: "这些草稿仅存于此浏览器，不代表角色已发布或已授权。可以导出备份，在创作工坊继续整理。",
  exportJ: "导出旧草稿",
  loadFailed: "无法读取旧版草稿。浏览器中的原数据未修改；请检查此浏览器的存储设置。",
  rawExport: "下载原始备份",
  exportFailed: "下载未完成，请重试。",
  exported: "已发起下载，请检查浏览器下载列表。",
 },
 en: {
  imageUnavailable: "Image unavailable",
  missingCharacter: "Character not found",
  missingWorld: "Story world not found",
  missingGuide: "Choose another from the directory. Your existing conversations and story progress are still saved.",
  libTitle: "Meet the people in our stories",
  libSub: "Start with someone who intrigues you. Discover the story they belong to.",
  chatBack: "Back to chat",
  storiesNav: "Back to stories",
  storyFilter: "Filter by story",
  all: "All",
  chatOnly: "Chat available",
  empty: "No characters match these choices.",
  resetSearch: "Clear search and filters",
  filtersLabel: "Filter characters",
  count: n => `${n} ${n === 1 ? 'character' : 'characters'}`,
  searchPh: "Search names, stories or keywords",
  chatCta: "Start chatting",
  continueChat: "Continue chatting",
  storyCta: "Enter the story",
  continueStory: "Continue the story",
  profileBack: "Back to characters",
  personaH: "Background",
  voiceH: "In their own words",
  lockedH: "Character details",
  appearH: "Their stories",
  restoring: "Restoring account progress…",
  stateUnavailable: "Could not read experiences on this device. Refresh and try again.",
  accountProgress: "Experiences for this account",
  deviceProgress: "Experiences on this device",
  restoreFailed: "Cloud progress has not been restored. These are this account’s records on this device.",
  reviewH: "Shared experiences",
  noChatYet: "No conversation yet. Begin with your first meeting.",
  chatSaved: n => `${n} messages in the current conversation.`,
  storyFacts: "Current story",
  memoriesH: "Memories from this conversation",
  memoryNotesH: "Additional chat memories",
  memoryYou: "Words you kept",
  memoryCharacter: "Words the character said",
  memoryDemo: "A demo reply you kept",
  memoryLimit: "Supplementary memory uses the first 350 characters. Review the original in conversation settings.",
  noMemories: "No memories kept yet. Keep a line in chat to revisit it here.",
  noStoryFacts: "The story has not started. Experiences will follow your active save when you enter Xichuan.",
  detailsH: "More about this character (spoilers)",
  samplesFrom: "Story excerpt",
  noSamples: "No excerpts available yet.",
  sameUniverseH: "Others in this story",
  noChat: "Meet them in their story first. Standalone chat is not available yet.",
  standalone: "Opens a standalone game. Progress here does not yet sync with character chat.",
  exprH: "Change expression",
  encounterCta: "Start here",
  topicsH: "Conversation starters",
  charactersNav: "Characters",
  builderTitle: "Open the workshop",
  legacyH: "Earlier demo drafts",
  legacySub: "These drafts exist only in this browser. They have not been published or licensed. Export a backup to continue working in the workshop.",
  exportJ: "Export demo drafts",
  loadFailed: "Could not read earlier drafts. The original browser data has not been changed. Check your browser storage settings.",
  rawExport: "Download raw backup",
  exportFailed: "Download failed. Please try again.",
  exported: "Download started. Check your browser downloads.",
 },
};
const L = () => getLang() === 'zh' ? copy.zh : copy.en;
const t = o => typeof o === 'string' ? o : (o?.[getLang() === 'zh' ? 'zh' : 'en'] || o?.zh || o?.en || '');
const chosenExpressions = new Map();
const expressionFor = c => chosenExpressions.get(c.id) || c.expressions?.find(e => c.expressionUrl(e) === c.portrait) || c.expressions?.[0];
function expressionName(key) {
 const names = {normal:['平静','Neutral'], smile:['微笑','Smile'], shy:['害羞','Shy'], sad:['难过','Sad'], angry:['生气','Angry'], surprised:['吃惊','Surprised'], serious:['认真','Serious'], battle:['战斗','Battle']};
 return names[key]?.[getLang() === 'zh' ? 0 : 1] || key;
}
function expressionLabel(key) {
 if (getLang() === 'zh') return expressionName(key);
 return {normal:'Calm',smile:'Smile',shy:'Shy',sad:'Sad',angry:'Angry',surprised:'Shock',serious:'Focus',battle:'Fight'}[key] || expressionName(key);
}
let styles = false;
function ensureStyles() {
  if (styles) return;
  styles = true;
  if (!document.querySelector('link[href="/assets/flywheel/flywheel.css?v=20261117-simplified"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/flywheel/flywheel.css?v=20261117-simplified';
    document.head.append(link);
  }
}

// —— 小组件 ——
const cardArt = (c) => `<img src="${safe(c.portrait)}" alt="" width="300" height="450" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="fw-art-fallback" hidden>${safe(L().imageUnavailable)}</span>`;
const sceneArt = c => {
 const art = characterArt(c);
 return art?.background ? `<img class="fw-scene-background" src="${safe(art.background)}" alt="" loading="lazy" onerror="this.hidden=true">` : '';
};
const workName = (id) => t(WORKS[id]?.title) || id;
const uniName = (id) => t(UNIVERSES[id]?.name) || id;
const storyFilterName = id => {
 const card = cardsByUniverse(id)[0], story = card && storiesForCharacter(card.id)[0];
 return story ? t(story.title) : uniName(id);
};
// 独立整页游戏（/assets/**）必须整页跳转，不能走 SPA 路由（站内现例：ashen 卡 target="_top"）
const isStandalone = (url) => /^\/assets\//.test(url || '');
const ext = (url) => (isStandalone(url) ? ' target="_top" rel="noopener"' : '');

function cardMarkup(c) {
  const l = L();
  return `<a class="fw-card" href="/characters/${safe(c.id)}">
    <span class="fw-card-portrait">${sceneArt(c)}${cardArt(c)}</span>
    <span class="fw-card-body">
      <strong class="fw-card-name">${safe(t(c.name))}</strong>
      <em>${safe(t(c.tagline))}</em>${c.portraitNote ? `<span class="fw-note">${safe(t(c.portraitNote))}</span>` : ''}
      <span class="fw-card-badges"><span class="fw-badge">${safe(workName(c.source.work))}</span>${c.chat ? `<span class="fw-badge">${safe(l.chatOnly)}</span>` : ''}</span>
    </span>
  </a>`;
}
const grid = (cards) => `<div class="fw-grid">${cards.map(cardMarkup).join('')}</div>`;

// —— /characters ——
let libFilter = { universe: 'all', chat: false }, libQuery = '';
let featuredDraft = '', featuredOwner;
function readLibraryState() {
 const state = readDiscoveryState(location.search,UNIVERSES);
 libFilter = {universe:state.world,chat:state.chat}; libQuery = state.query;
}
function changeLibrary(patch, {replace = false} = {}) {
 const state = patchDiscoveryState({world:libFilter.universe,chat:libFilter.chat,query:libQuery},patch,UNIVERSES);
 const url = discoveryUrl(state,{search:location.search,hash:location.hash});
 const from = location.pathname + location.search;
 if (url !== from + (location.hash || '')) {
  const history = globalThis.history;
  if (replace) history?.replaceState({...history.state},'',url);
  else {
   history?.replaceState({...history.state,scroll:[globalThis.scrollX||0,globalThis.scrollY||0]},'');
   history?.pushState({storydateNavigation:true,from},'',url);
  }
 }
 libFilter = {universe:state.world,chat:state.chat}; libQuery = state.query;
}
function libItems() {
  let items = libFilter.universe === 'all' ? CHARACTER_CARDS : cardsByUniverse(libFilter.universe);
  if (libFilter.chat) items = items.filter((c) => c.chat);
  const q = libQuery.trim().toLowerCase();
  if (q) items = items.filter((c) => [c.name, c.tagline, c.persona, WORKS[c.source.work]?.title, UNIVERSES[c.source.universe]?.name, ...storiesForCharacter(c.id).map(story=>story.title)].flatMap((v) => [v?.zh, v?.en]).join(' ').toLowerCase().includes(q));
  return items;
}
function libResults(items) {
  const l = L();
  return items.length ? grid(items) : `<div class="fw-empty"><p>${safe(l.empty)}</p><button type="button" class="fw-btn fw-btn-secondary" data-fw-reset>${safe(l.resetSearch)}</button></div>`;
}
function libMarkup() {
  const l = L();
  const chips = ['all', ...Object.keys(UNIVERSES)].map((id) => {
    const label = id === 'all' ? l.all : storyFilterName(id);
    const n = id === 'all' ? CHARACTER_CARDS.length : cardsByUniverse(id).length;
    return `<button type="button" class="fw-chip${libFilter.universe === id ? ' active' : ''}" data-fw-filter="${id}" aria-pressed="${libFilter.universe === id}">${safe(label)} <small>${n}</small></button>`;
  }).join('');
  const worldOptions = ['all',...Object.keys(UNIVERSES)].map(id => `<option value="${id}"${libFilter.universe === id ? ' selected' : ''}>${safe(id === 'all' ? l.all : storyFilterName(id))} · ${id === 'all' ? CHARACTER_CARDS.length : cardsByUniverse(id).length}</option>`).join('');
  const items = libItems();
  return `<main class="fw-page fw-character-library" data-no-i18n data-fw-page="characters">
    <div class="fw-library-mobile">${mobileBar()}</div>
    <section class="sd-hero fw-character-feature" data-sd-hero="character">${heroSceneMarkup('character',getLang())}</section>
    <div class="fw-library-content">
    <header class="fw-library-heading"><h2>${safe(l.libTitle)}</h2><p>${safe(l.libSub)}</p></header>
    <div class="fw-toolbar" role="group" aria-label="${safe(l.filtersLabel)}">${chips}<select class="fw-world-select" data-fw-world-select aria-label="${safe(l.storyFilter)}">${worldOptions}</select><button type="button" class="fw-chip fw-chip-toggle${libFilter.chat ? ' active' : ''}" data-fw-chat="1" aria-pressed="${libFilter.chat}">${safe(l.chatOnly)}</button><span class="fw-count" role="status">${l.count(items.length)}</span></div>
    <label class="fw-search"><span aria-hidden="true">⌕</span><input type="search" id="fw-search" placeholder="${safe(l.searchPh)}" value="${safe(libQuery)}" aria-label="${safe(l.searchPh)}" autocomplete="off"></label>
    <div id="fw-lib-results">${libResults(items)}</div>
    </div>
  </main>`;
}

// —— /characters/<id> ——
const quoted = (x) => (/^[“"「]/.test(x) ? x : `“${x}”`);
const validMessages = value => Array.isArray(value) && value.every(m => m && ['user','assistant'].includes(m.role) && typeof m.text === 'string');
const memoryExcerpt = value => { let text = ''; for (const c of String(value || '')) { if (text.length + c.length > 200) break; text += c; } return text; };
const memoryStamp = text => {
 let a = 2166136261, b = 5381;
 for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ text.charCodeAt(i); }
 return text.length + ':' + (a >>> 0).toString(16) + ':' + (b >>> 0).toString(16);
};
// Read the same active branch and validated pins as character-threads.js,
// without opening a thread manager, changing its active view, or writing keys.
function chatProgress(c, read) {
 if (!c.chatId) return {messages: [], pins: [], notes: ''};
 const key = 'ooc-session-v2-' + c.chatId, index = read(key + '-threads', null);
 const validIndex = index?.version === 1 && Array.isArray(index.threads) && index.threads.length &&
  index.threads.every(t => t && typeof t.id === 'string' && /^[a-z0-9-]{1,60}$/i.test(t.id) && Array.isArray(t.pins)) &&
  index.threads.some(t => t.id === index.active);
 const thread = validIndex ? index.threads.find(t => t.id === index.active) : {id:'main', pins:[]};
 const archive = read(key + '-branch-' + thread.id, null), legacy = read(key, []);
 const messages = validMessages(archive) ? archive : validMessages(legacy) ? legacy : [];
 const pins = thread.pins.filter(p => {
  if (!p || !Number.isInteger(p.turn) || p.turn < 0) return false;
  const m = messages[p.turn];
  return m && m.role === p.role && memoryExcerpt(m.text) === p.text && !m.failed && !m.streaming &&
   (!p.sourceStamp || p.sourceStamp === memoryStamp(m.text));
 }).slice(0, 6).map(p => ({...p,demo:messages[p.turn]?.transport === 'demo'}));
 const notes = read('ooc-Memories-' + c.chatId, '');
  return {messages, pins, notes: typeof notes === 'string' ? notes.slice(0,350).trim() : '',notesTrimmed:typeof notes === 'string' && notes.length > 350};
}
function experiencesMarkup(c, raw, chat) {
 const l = L(), context = storyContext(raw);
 const keepsLines = threadedProfiles.has(c.chatId);
 if (!context && !chat.pins.length && !chat.notes) return '';
 const facts = Object.entries(XICHUAN_FACT_LABELS).filter(([key]) => context?.flags[key] === true);
 const story = c.source.work === 'xichuan' ? `<h3>${safe(l.storyFacts)}</h3>${context ? `<p>${safe(progressText(raw,getLang()))}</p>${facts.length ? `<ul class="fw-experience-facts">${facts.map(([,label]) => `<li>${safe(t(label))}</li>`).join('')}</ul>` : ''}` : `<p class="fw-note">${safe(l.noStoryFacts)}</p>`}` : '';
 const kept = chat.pins.length ? chat.pins.map(p => `<blockquote class="fw-quote"><p>${safe(p.text)}</p><cite>${safe(p.role === 'user' ? l.memoryYou : p.demo ? l.memoryDemo : l.memoryCharacter)}</cite></blockquote>`).join('') : `<p class="fw-note">${safe(l.noMemories)}</p>`;
 const notes = chat.notes ? `<h3>${safe(l.memoryNotesH)}</h3><p class="fw-memory-notes">${safe(chat.notes)}</p>${chat.notesTrimmed ? `<p class="fw-note">${safe(l.memoryLimit)}</p>` : ''}` : '';
 const memories = c.chat ? `${keepsLines || chat.pins.length ? `<h3>${safe(l.memoriesH)}</h3>${kept}` : ''}${notes}` : '';
 return `<section class="fw-experiences" id="fw-experiences" data-fw-experiences aria-labelledby="fw-experiences-title"><h2 id="fw-experiences-title">${safe(l.reviewH)}</h2>${story}${memories}</section>`;
}
function profileStateMarkup(c, account = currentHelpers?.account) {
 const l = L(), w = storiesForCharacter(c.id)[0];
 if (account && (account.busy || !account.restored)) return `<p class="fw-note" role="status" data-fw-restoring>${safe(l.restoring)}</p>`;
 try {
  const read = currentHelpers?.read || ((_key, fallback) => fallback), chat = chatProgress(c, read);
  let raw = c.source.work === 'xichuan' ? read(XICHUAN_KEY,{}) : {};
  // Match the existing player’s guest import preview without writing its keys.
  // Signed-in accounts only show their own save, until an explicit import there.
  if (c.source.work === 'xichuan' && !account?.user && !latestSave(raw)) {
   const old = legacySaves(globalThis.localStorage);
   if (latestSave(old)) raw = old;
  }
  const played = Boolean(latestSave(raw)), chatting = chat.messages.length > 0;
  const chatLink = c.chat ? `<a class="fw-btn${played ? ' fw-btn-secondary' : ''}" data-fw-chat-entry href="${safe(c.chat)}">${safe(chatting ? l.continueChat : l.chatCta)} →</a>` : '';
  const storyLink = w ? `<a class="fw-btn${c.chat && !played ? ' fw-btn-secondary' : ''}" data-fw-story-entry href="${safe(w.playUrl)}"${ext(w.playUrl)}>${safe(played ? l.continueStory : l.storyCta)} →</a>` : '';
  const chatStatus = `<p class="fw-note" data-fw-chat-status>${safe(chatting ? l.chatSaved(chat.messages.length) : l.noChatYet)}</p>`;
  const storyStatus = c.source.work === 'xichuan' ? `<p class="fw-note" data-fw-progress>${safe(progressText(raw,getLang()))}</p>` : '';
  const scope = c.chat || c.source.work === 'xichuan' ? `<p class="fw-progress-scope">${safe(account?.user ? l.accountProgress : l.deviceProgress)}</p>${account?.restoreError ? `<p class="fw-note" role="status">${safe(l.restoreFailed)}</p>` : ''}` : '';
  return `<div class="fw-profile-actions"><div class="fw-ctas">${played ? storyLink + chatLink : chatLink + storyLink}</div><div class="fw-profile-summary" role="status" aria-live="polite">${scope}${storyStatus}${c.chat ? chatStatus : `<p class="fw-note">${safe(l.noChat)}</p>`}</div>${w && c.chat && isStandalone(w.playUrl) ? `<p class="fw-note">${safe(l.standalone)}</p>` : ''}</div>${c.chat ? experiencesMarkup(c,raw,chat) : ''}`;
 } catch { return `<p class="fw-note" role="status">${safe(l.stateUnavailable)}</p>`; }
}
const profileStateCache = new WeakMap();
// Account hydration and sync updates replace only private state, preserving the
// library search, portrait expression, and the rest of the current profile.
export function syncAccount(account) {
 const host = document.querySelector('[data-fw-profile-state]');
 const c = cardById(host?.closest('[data-fw-character]')?.dataset.fwCharacter);
 if (!host || !c) return;
 const markup = profileStateMarkup(c,account);
 if (profileStateCache.get(host) === markup) return;
 const active = document.activeElement;
 const selected = host.contains(active) && active?.matches?.('a[data-fw-chat-entry],a[data-fw-story-entry]') ? active.getAttribute('href') : null;
 host.innerHTML = markup;
 profileStateCache.set(host,markup);
 if (selected) [...host.querySelectorAll('a[href]')].find(a => a.getAttribute('href') === selected)?.focus({preventScroll:true});
}
function profileMarkup(c) {
  const l = L();
  const from = globalThis.history?.state?.from, fromStory = storyReturnUrl(from);
  const fromChat = characterReturnUrl(from)?.startsWith('/play/') ? characterReturnUrl(from) : null;
  const returnUrl = fromStory || fromChat || characterDirectoryReturn(globalThis.history?.state?.discoveryReturn) || characterDirectoryReturn(from) || '/characters';
  const returnLabel = fromStory ? l.storiesNav : fromChat ? l.chatBack : l.profileBack;
  const samples = (c.voice?.samples || []).map((s) => `<blockquote class="fw-quote"><p>${safe(quoted(t(s)))}</p><cite>${safe(l.samplesFrom)} · ${safe(t(s.from) || workName(c.source.work))}</cite></blockquote>`).join('');
  const stories = storiesForCharacter(c.id), primaryStory = stories[0];
  const appears = stories.slice(1).map(a => `<a class="fw-appearance" data-full-info href="${safe(a.informationUrl)}"><strong>${safe(t(a.title))}</strong><span aria-hidden="true">↗</span></a>`).join('');
  const encounters = (c.encounters || []).map((e) => `<a class="fw-appearance" href="${safe(e.url)}"><strong>${safe(t(e.title))}</strong><span>${safe(l.encounterCta)}</span><span aria-hidden="true">↗</span></a>`).join('');
  const starters = (c.starters?.[getLang() === 'zh' ? 'zh' : 'en'] || []).map((x) => `<li>${safe(x)}</li>`).join('');
  const others = cardsByUniverse(c.source.universe).filter((x) => x.id !== c.id).slice(0, 8);
  const multi = (c.expressions || []).length > 1;
  const portraitBlock = multi
    ? `<div class="fw-profile-portrait"><div class="fw-profile-scene">${sceneArt(c)}<img id="fw-portrait-main" class="fw-portrait-figure" src="${safe(c.expressionUrl(expressionFor(c)))}" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="fw-art-fallback" hidden>${safe(l.imageUnavailable)}</span></div>
       <div class="fw-expressions" role="group" aria-label="${safe(l.exprH)}">${c.expressions.map((e, i) => `<button type="button" class="fw-expr${expressionFor(c) === e ? ' active' : ''}" data-fw-expr="${safe(c.expressionUrl(e))}" aria-pressed="${expressionFor(c) === e}" aria-label="${safe(expressionName(e))}" title="${safe(expressionName(e))}"><img src="${safe(c.expressionUrl(e))}" alt="" loading="lazy"><span class="fw-expr-label" aria-hidden="true">${safe(expressionLabel(e))}</span></button>`).join('')}</div></div>`
    : `<div class="fw-profile-portrait"><div class="fw-profile-scene">${sceneArt(c)}${cardArt(c)}</div></div>`;
  return `<main class="fw-page fw-page-hero" data-no-i18n data-fw-page="profile" data-fw-character="${safe(c.id)}">
    ${mobileBar()}
    <a class="fw-back" data-full-info href="${safe(returnUrl)}">‹ ${safe(returnLabel)}</a>
    <article class="fw-profile">
      <div class="fw-profile-top">
        ${portraitBlock}
        <div class="fw-profile-head">
          ${primaryStory?.role ? `<p class="fw-eyebrow">${safe(t(primaryStory.role))}</p>` : ''}
          <h1>${safe(t(c.name))}</h1>
          <p class="fw-tagline">${safe(t(c.tagline))}</p>
          <p class="fw-persona">${primaryStory ? `<a data-full-info href="${safe(primaryStory.informationUrl)}">${safe(t(primaryStory.title))} ↗</a>` : safe(workName(c.source.work))}</p>${c.portraitNote ? `<p class="fw-note">${safe(t(c.portraitNote))}</p>` : ''}
        </div>
        <div class="fw-profile-state" data-fw-profile-state>${profileStateMarkup(c)}</div>
      </div>
      <section class="fw-section"><h2>${l.voiceH}</h2>${c.voice ? `<p>${safe(t(c.voice))}</p>` : ''}${samples || `<p class="fw-note">${safe(l.noSamples)}</p>`}</section>
      <details class="fw-details"><summary>${safe(l.detailsH)}</summary><h3>${safe(l.personaH)}</h3><p>${safe(t(c.persona))}</p><h3>${safe(l.lockedH)}</h3><p>${safe(t(c.locked))}</p></details>
      ${appears ? `<section class="fw-section"><h2>${l.appearH}</h2><div class="fw-appearances">${appears}</div></section>` : ''}
      ${encounters || starters ? `<details class="fw-details"><summary>${safe(l.topicsH)}</summary>${encounters ? `<div class="fw-appearances">${encounters}</div>` : ''}${starters ? `<ul class="fw-rules fw-starters">${starters}</ul>` : ''}</details>` : ''}
      ${others.length ? `<section class="fw-section"><h2>${l.sameUniverseH}</h2><div class="fw-hscroll">${others.map(cardMarkup).join('')}</div></section>` : ''}
    </article>
  </main>`;
}

// Read-only migration: retain the old prototype key without assigning it new semantics.
function legacyDrafts() {
 let raw = null;
 try {
  raw = localStorage.getItem(DRAFT_KEY);
  const drafts = JSON.parse(raw || '[]');
  if (!Array.isArray(drafts)) throw new Error('Invalid draft list');
  return {drafts, raw, error:false};
 } catch { return {drafts:[], raw, error:true}; }
}
function studioMarkup() {
 const l = L(), legacy = legacyDrafts();
 return `<main class="fw-page" data-no-i18n data-fw-page="studio">${mobileBar()}<a class="fw-back" href="/builder">‹ ${safe(l.builderTitle)}</a><h1>${safe(l.legacyH)}</h1><p class="fw-note">${safe(l.legacySub)}</p>${legacy.error ? `<p class="fw-local-notice" role="status">${safe(l.loadFailed)}</p>` : ''}${legacy.drafts.length ? `<ul class="fw-rules">${legacy.drafts.map(d => `<li>${safe(t(d?.name) || '—')}</li>`).join('')}</ul>` : ''}${legacy.raw != null ? `<p><button type="button" class="fw-btn fw-btn-secondary" data-fw-export>${safe(legacy.error ? l.rawExport : l.exportJ)}</button></p>` : ''}<p id="fw-export-status" role="status"></p></main>`;
}
function exportDrafts() {
 const legacy = legacyDrafts(), status = document.getElementById('fw-export-status');
 let url;
 try {
  if (legacy.raw == null) throw new Error('Draft storage unavailable');
  url = URL.createObjectURL(new Blob([legacy.raw], {type:'application/json'}));
  const a = document.createElement('a');
  a.href = url; a.download = 'storydate-demo-drafts.json'; document.body.append(a); a.click(); a.remove();
  if (status) status.textContent = L().exported;
 } catch { if (status) status.textContent = L().exportFailed; }
 finally { if (url) setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
let currentHelpers = null, langBound = false;
function missingMarkup(world = false) {
 const l = L(), title = world ? l.missingWorld : l.missingCharacter;
 return `<main class="fw-page" data-no-i18n data-fw-page="missing">${mobileBar()}<section class="fw-missing"><h1 tabindex="-1">${safe(title)}</h1><p>${safe(l.missingGuide)}</p><a class="fw-btn" href="${world ? '/' : '/characters'}">${safe(world ? l.storiesNav : l.profileBack)} →</a></section></main>`;
}
const focusAttributes = ['id','data-sd-lang','data-fw-expr','data-fw-filter','data-fw-world-select','data-fw-chat'];
function rememberFocus() {
 const node = document.activeElement;
 const attribute = focusAttributes.find(key => node?.hasAttribute?.(key));
 return attribute ? {attribute,value:node.getAttribute(attribute),start:node.selectionStart,end:node.selectionEnd,direction:node.selectionDirection} : null;
}
function restoreFocus(saved) {
 if (!saved) return;
 const node = [...document.querySelectorAll(`[${saved.attribute}]`)].find(el => el.getAttribute(saved.attribute) === saved.value);
 if (!node || node.disabled) return;
 node.focus({preventScroll:true});
 if (Number.isInteger(saved.start) && node.setSelectionRange) { try { node.setSelectionRange(saved.start,saved.end,saved.direction); } catch {} }
}
function bindCommon() {
 document.querySelectorAll('[data-fw-filter]').forEach(b => b.onclick = () => { changeLibrary({world:b.dataset.fwFilter}); renderRoute('/characters'); document.querySelector(`[data-fw-filter="${libFilter.universe}"]`)?.focus({preventScroll:true}); });
 document.querySelector('[data-fw-chat]')?.addEventListener('click', () => { changeLibrary({chat:!libFilter.chat}); renderRoute('/characters'); document.querySelector('[data-fw-chat]')?.focus({preventScroll:true}); });
 document.querySelector('[data-fw-world-select]')?.addEventListener('change', e => { changeLibrary({world:e.target.value}); renderRoute('/characters'); document.querySelector('[data-fw-world-select]')?.focus({preventScroll:true}); });
 document.querySelector('.fw-character-feature input')?.addEventListener('input', e => { featuredDraft = e.target.value; });
 document.getElementById('fw-search')?.addEventListener('input', e => {
  changeLibrary({query:e.target.value},{replace:true});
  document.getElementById('fw-lib-results').innerHTML = libResults(libItems());
  document.querySelector('.fw-count').textContent = L().count(libItems().length);
 });
 document.getElementById('fw-lib-results')?.addEventListener('click', e => {
  if (!e.target.closest('[data-fw-reset]')) return;
  changeLibrary({world:'all',chat:false,query:''}); renderRoute('/characters');
  document.getElementById('fw-search')?.focus({preventScroll:true});
 });
 document.querySelectorAll('[data-fw-expr]').forEach(b => b.onclick = () => {
  const id = document.querySelector('[data-fw-character]').dataset.fwCharacter, c = cardById(id);
  chosenExpressions.set(id,c.expressions.find(e => c.expressionUrl(e) === b.dataset.fwExpr));
  const main = document.getElementById('fw-portrait-main'); main.hidden = false; main.nextElementSibling.hidden = true; main.src = b.dataset.fwExpr;
  document.querySelectorAll('[data-fw-expr]').forEach(x => { x.classList.toggle('active',x === b); x.setAttribute('aria-pressed',String(x === b)); });
 });
 document.querySelector('[data-fw-export]')?.addEventListener('click',exportDrafts);
}
function renderRoute(path) {
 const draft = document.querySelector('.fw-character-feature input');
 if (draft) featuredDraft = draft.value;
 let markup, title;
 if (path === '/characters') { readLibraryState(); markup = libMarkup(); title = L().charactersNav; }
 else if (/^\/characters\/[^/]+$/.test(path)) { const c = cardById(path.split('/')[2]); markup = c ? profileMarkup(c) : missingMarkup(); title = c ? t(c.name) : L().missingCharacter; }
 else if (/^\/universe\/[^/]+$/.test(path)) { markup = missingMarkup(true); title = L().missingWorld; }
 else if (path === '/studio') { markup = studioMarkup(); title = L().legacyH; }
 else return false;
 mountShell(markup,currentHelpers,'flywheel');
 if (path === '/characters') {
  const element = document.querySelector('.fw-character-feature');
  const hero = mountHeroContent(element,'character',{navigate: url => {
   // Explicitly handing a reply to chat consumes this page's copy. Ordinary
   // browsing still keeps an unsent banner draft when returning to the list.
   featuredDraft = ''; element.querySelector('input').value = '';
   if (currentHelpers?.navigate) currentHelpers.navigate(url); else location.href = url;
  },lang:getLang()});
  hero.querySelector('input').value = featuredDraft;
 }
 // Shared shell hydration marks the canonical character navigation item.
 bindCommon(); document.title = `${title} · StoryDate`; return true;
}
function bindLangRerender() {
 if (langBound) return;
 langBound = true;
 globalThis.addEventListener?.('sd-lang', () => {
  if (!currentHelpers) return;
  if (location.pathname === '/') return;
  const focus = rememberFocus();
  if (renderRoute(location.pathname)) { currentHelpers.repaint?.(); restoreFocus(focus); }
 });
}
export function show(path,helpers) {
 const owner = helpers.account?.user?.uid || null;
 if (owner !== featuredOwner) { featuredDraft = ''; featuredOwner = owner; const input = document.querySelector('.fw-character-feature input'); if (input) input.value = ''; }
 currentHelpers = helpers; ensureStyles();
 if (path === '/') return false;
 const canonical = canonicalCharacterUrl(path + (location.search || '') + (location.hash || ''));
 if (canonical !== path + (location.search || '') + (location.hash || '')) {
  helpers.navigate(canonical); return true;
 }
 if (path === '/studio') {
  const legacy = legacyDrafts();
  if (!legacy.error && !legacy.drafts.length) { helpers.navigate('/builder'); return true; }
 }
 const handled = renderRoute(path);
 if (handled) bindLangRerender();
 return handled;
}
