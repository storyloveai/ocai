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
import {characterById} from '../character-profiles.js';

const DRAFT_KEY = 'sd-flywheel-drafts';
// 手机端顶栏（≤1023px 显示；桌面由侧栏承担），沿用 hub 的 sd-lang 按钮模式
const mobileBar = ({href,label} = {}) => {
  const lang = getLang();
  return `<header class="fw-mobile-bar${href?' fw-profile-header shell-page-header':''}">${href?`<a class="fw-back" data-fw-back data-full-info href="${safe(href)}">‹ ${safe(label)}</a>`:'<a href="/" aria-label="StoryDate"><img src="/assets/storydate-dialogue-logo.svg" alt="StoryDate" width="120" height="24"></a>'}<div class="sd-lang sd-lang-top" role="group" aria-label="${lang === 'zh' ? '语言' : 'Language'}">${['en', 'zh'].map((x) => `<button type="button" data-sd-lang="${x}" aria-pressed="${x === lang}">${x === 'zh' ? '中文' : 'EN'}</button>`).join('')}</div></header>`;
};

// Task #154: a focused way to discover characters and enter existing stories.
// No simulated permissions, separate editor or invented gameplay outcomes.
const copy = {
 zh: {
  imageUnavailable: "图片暂不可用",
  exploreH: "探索",
  conversation: "和 TA 聊聊",
  storyAppearance: "故事出场",
  storyCapability: "故事出场",
  draftLabel: "先写一句",
  draftPlaceholder: "想对 TA 说什么？",
  draftCta: "带这句话去聊",
  draftHint: "进入后确认发送",
  draftFailed: "暂时无法打开聊天，你写的话仍保留在这里。",
  storiesH: "TA 所在的故事",
  storyDetails: "了解这部故事",
  meetInStory: "在故事中认识 TA",
  characterVoice: "TA 的说话方式",
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
  continueStory: "回到故事",
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
  detailsH: "关于 TA（含剧透）",
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
  exploreH: "Explore",
  conversation: "Talk with them",
  storyAppearance: "Story character",
  storyCapability: "In the story",
  draftLabel: "Write an opening line",
  draftPlaceholder: "What would you like to say?",
  draftCta: "Take this line to chat",
  draftHint: "Confirm in chat",
  draftFailed: "Could not open chat. Your words are still kept here.",
  storiesH: "The stories they belong to",
  storyDetails: "About this story",
  meetInStory: "Meet them in the story",
  characterVoice: "How they speak",
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
  continueStory: "Return to story",
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
  detailsH: "About this character (spoilers)",
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
let styles = false;
function ensureStyles() {
  if (styles) return;
  styles = true;
  if (!document.querySelector('link[href="/assets/flywheel/flywheel.css?v=20261118-mobile-dock"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/flywheel/flywheel.css?v=20261118-mobile-dock';
    document.head.append(link);
  }
}

// —— 小组件 ——
const cardArt = (c) => `<img src="${safe(c.portrait)}" alt="" width="300" height="450" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="fw-art-fallback" hidden>${safe(L().imageUnavailable)}</span>`;
const sceneArt = (c, loading = 'lazy') => {
 const art = characterArt(c);
 return art?.background ? `<img class="fw-scene-background" src="${safe(art.background)}" alt="" loading="${loading}" onerror="this.hidden=true">` : '';
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
      <span class="fw-card-badges"><span class="fw-badge">${safe(workName(c.source.work))}</span><span class="fw-badge fw-card-intent">${safe(c.chat ? l.conversation : l.storyAppearance)} →</span></span>
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
  const worldOptions = ['all',...Object.keys(UNIVERSES)].map(id => `<option value="${id}"${libFilter.universe === id ? ' selected' : ''}>${safe(id === 'all' ? l.all : storyFilterName(id))}</option>`).join('');
  const items = libItems();
  return `<main class="fw-page fw-character-library" data-no-i18n data-fw-page="characters" aria-label="${safe(l.charactersNav)}">
    <div class="fw-library-mobile">${mobileBar()}</div>
    <section class="sd-hero fw-character-feature" data-sd-hero="character">${heroSceneMarkup('character',getLang())}</section>
    <div class="fw-library-content">
    <div class="fw-toolbar" role="group" aria-label="${safe(l.filtersLabel)}"><label class="fw-search"><span aria-hidden="true">⌕</span><input type="search" id="fw-search" placeholder="${safe(l.searchPh)}" value="${safe(libQuery)}" aria-label="${safe(l.searchPh)}" autocomplete="off"></label><select class="fw-world-select" data-fw-world-select aria-label="${safe(l.storyFilter)}">${worldOptions}</select><button type="button" class="fw-chip fw-chip-toggle${libFilter.chat ? ' active' : ''}" data-fw-chat="1" aria-pressed="${libFilter.chat}">${safe(l.chatOnly)}</button></div>
    <div class="fw-library-heading"><h2>${safe(l.exploreH)}</h2><span class="fw-count" role="status">${l.count(items.length)}</span></div>
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
 const facts = Object.entries(XICHUAN_FACT_LABELS).filter(([key]) => context?.flags[key] === true);
 if (!facts.length && !chat.pins.length && !chat.notes) return '';
 const story = c.source.work === 'xichuan' && facts.length ? `<h3>${safe(l.storyFacts)}</h3><ul class="fw-experience-facts">${facts.map(([,label]) => `<li>${safe(t(label))}</li>`).join('')}</ul>` : '';
 const kept = chat.pins.map(p => `<blockquote class="fw-quote"><p>${safe(p.text)}</p><cite>${safe(p.role === 'user' ? l.memoryYou : p.demo ? l.memoryDemo : l.memoryCharacter)}</cite></blockquote>`).join('');
 const notes = chat.notes ? `<h3>${safe(l.memoryNotesH)}</h3><p class="fw-memory-notes">${safe(chat.notes)}</p>${chat.notesTrimmed ? `<p class="fw-note">${safe(l.memoryLimit)}</p>` : ''}` : '';
 const memories = c.chat ? `${kept ? `<h3>${safe(l.memoriesH)}</h3>${kept}` : ''}${notes}` : '';
 return `<details class="fw-details fw-experiences" id="fw-experiences" data-fw-experiences><summary id="fw-experiences-title">${safe(l.reviewH)}</summary>${story}${memories}</details>`;
}
// Profile entry drafts are ephemeral and belong to one active owner and character.
// They never write a chat, account cache or a new persistent storage key.
const profileDrafts = new Map();
let profileDraftOwner;
const ownerFor = account => account?.user?.uid || null;
function setProfileDraftOwner(owner) {
 if (owner !== profileDraftOwner) { profileDrafts.clear(); profileDraftOwner = owner; }
}
function captureProfileDraft() {
 const host = document.querySelector('[data-fw-profile-state]'), input = host?.querySelector('[data-fw-profile-draft]');
 const id = host?.closest('[data-fw-character]')?.dataset.fwCharacter;
 if (id && input && profileStateOwners.get(host) === profileDraftOwner) profileDrafts.set(id,Array.from(input.value || '').slice(0,300).join(''));
}
function profileView(c, account) {
 if (account && (account.busy || !account.restored)) return {restoring:true};
 try {
  const read = currentHelpers?.read || ((_key, fallback) => fallback), chat = chatProgress(c, read);
  let raw = c.source.work === 'xichuan' ? read(XICHUAN_KEY,{}) : {};
  if (c.source.work === 'xichuan' && !account?.user && !latestSave(raw)) {
   const old = legacySaves(globalThis.localStorage);
   if (latestSave(old)) raw = old;
  }
  return {chat,raw,played:Boolean(latestSave(raw)),chatting:chat.messages.length > 0};
 } catch { return {unavailable:true}; }
}
function entryStarters(c) {
 const profile = characterById.get(c.chatId);
 return (profile?.starters?.[getLang()] || c.starters?.[getLang()] || []).slice(0,2);
}
function profileStateMarkup(c, account = currentHelpers?.account, view = profileView(c,account)) {
 const l = L();
 if (view.restoring) return `<p class="fw-note" role="status" data-fw-restoring>${safe(l.restoring)}</p>`;
 if (view.unavailable) return `<p class="fw-note" role="status">${safe(l.stateUnavailable)}</p>`;
 const {chat,chatting} = view;
 if (!c.chat) return `<div class="fw-profile-actions"><p class="fw-note">${safe(l.noChat)}</p><a class="fw-story-jump" data-fw-story-jump href="#fw-stories">${safe(l.meetInStory)} ↓</a></div>`;
 const starters = entryStarters(c), draft = profileDrafts.get(c.id) || '';
 const openingLines = starters.map((line,i) => `<button type="button" data-fw-starter="${i}" aria-pressed="${line === draft.trim()}">${safe(line)}</button>`).join('');
 return `<div class="fw-profile-actions fw-chat-dock">
   <form class="fw-conversation-form" data-fw-profile-form>
     <div class="fw-dock-header">
       <label for="fw-profile-draft">${safe(l.draftLabel)}</label>
       <span class="fw-draft-hint" id="fw-draft-status" data-fw-draft-status role="status">${safe(l.draftHint)}</span>
     </div>
     ${openingLines ? `<div class="fw-conversation-starters" role="group" aria-label="${safe(l.topicsH)}">${openingLines}</div>` : ''}
     <div class="fw-conversation-input">
       <input id="fw-profile-draft" data-fw-profile-draft name="draft" maxlength="300" autocomplete="off" aria-describedby="fw-draft-status" value="${safe(draft)}" placeholder="${safe(l.draftPlaceholder)}">
       <a class="fw-btn" data-fw-chat-entry href="${safe(c.chat)}">${safe(chatting ? l.continueChat : l.chatCta)} →</a>
     </div>
   </form>
   ${chatting ? `<p class="fw-note" data-fw-chat-status>${safe(l.chatSaved(chat.messages.length))}</p>` : ''}
   ${account?.restoreError ? `<p class="fw-note" role="status">${safe(l.restoreFailed)}</p>` : ''}
 </div>`;
}
function profileRelatedMarkup(c, account = currentHelpers?.account, view = profileView(c,account)) {
 const l = L(), stories = storiesForCharacter(c.id), ready = !view.restoring && !view.unavailable;
 const {raw,chat,played,chatting} = view;
 const cards = stories.map((story,i) => {
  const hasProgress = i === 0 && ready && played;
  const format = i === 0 ? t(WORKS[c.source.work]?.kind) || workName(c.source.work) : l.appearH;
  const informationUrl = safe(story.informationUrl), title = safe(t(story.title));
  const summary = i === 0 ? t(UNIVERSES[c.source.universe]?.tagline) || t(story.description) : t(story.description);
  return `<article class="fw-story-card">
    <a class="fw-story-cover" data-full-info href="${informationUrl}"><img src="${safe(story.image)}" alt="${title}" loading="lazy"></a>
    <div class="fw-story-copy">
      <div class="fw-story-meta"><span class="fw-eyebrow">${safe(format)}</span>${hasProgress ? `<span data-fw-progress>${safe(progressText(raw,getLang()))}</span>` : ''}</div>
      <h3><a data-full-info href="${informationUrl}">${title}</a></h3><p class="fw-story-description">${safe(summary)}</p>
      ${isStandalone(story.playUrl) ? `<p class="fw-note fw-standalone-note">${safe(l.standalone)}</p>` : ''}
    </div>
    <div class="fw-ctas fw-story-actions"><a class="fw-story-information" data-full-info href="${informationUrl}">${safe(l.storyDetails)} ↗</a>${ready ? `<a class="fw-btn fw-btn-secondary" ${i===0?'data-fw-story-entry':'data-fw-appearance-entry'} href="${safe(story.playUrl)}"${ext(story.playUrl)}>${safe(hasProgress ? l.continueStory : l.storyCta)} →</a>` : ''}</div>
  </article>`;
 }).join('');
 const scope=ready&&(played||chatting||chat.pins.length||chat.notes)?`<p class="fw-progress-scope">${safe(account?.user ? l.accountProgress : l.deviceProgress)}</p>`:'';
 return `${cards?`<section class="fw-section fw-story-section" id="fw-stories"><h2>${safe(l.storiesH)}</h2><div class="fw-story-list">${cards}</div></section>`:''}${ready&&c.chat ? experiencesMarkup(c,raw,chat) : ''}${scope}`;
}
function bindProfileEntry(c, account = currentHelpers?.account) {
 const host = document.querySelector('[data-fw-profile-state]'), form = host?.querySelector('[data-fw-profile-form]');
 const input = form?.querySelector('[data-fw-profile-draft]'), main = form?.querySelector('[data-fw-chat-entry]');
 if (!input || !main || !c.chat) return;
 const owner = ownerFor(account), ordinaryLabel = main.textContent, starters = entryStarters(c);
 const current = () => form.isConnected && profileStateOwners.get(host) === owner && profileDraftOwner === owner && (!account || (!account.busy && account.restored));
 const line = () => Array.from(input.value.trim()).slice(0,300).join('');
 function destination(text) {
  const url = new URL(c.chat,location.href);
  if (text) url.searchParams.set('draft',text);
  return url.pathname + url.search;
 }
 function paint() {
  const text = line(), href = destination(text), label = text ? L().draftCta + ' →' : ordinaryLabel;
  if (main.getAttribute('href') !== href) main.setAttribute('href',href);
  if (main.textContent !== label) main.textContent = label;
  for (const button of form.querySelectorAll('[data-fw-starter]')) {
   const selected = String(text === starters[Number(button.dataset.fwStarter)]);
   if (button.getAttribute('aria-pressed') !== selected) button.setAttribute('aria-pressed',selected);
  }
 }
 function keep() {
  if (!current()) return;
  profileDrafts.set(c.id,Array.from(input.value).slice(0,300).join(''));
  paint();
 }
 input.addEventListener('input',keep);
 for (const button of form.querySelectorAll('[data-fw-starter]')) {
  button.addEventListener('click',() => {
   if (!current()) return;
   input.value = starters[Number(button.dataset.fwStarter)] || '';
   keep();
   input.focus({preventScroll:true});
  });
 }
 function handoff() {
  if (!current()) return;
  const before = input.value, url = destination(line());
  profileDrafts.delete(c.id);
  input.value = '';
  paint();
  try {
   if (currentHelpers?.navigate) currentHelpers.navigate(url);
   else location.href = url;
  } catch {
   if (!current()) return;
   profileDrafts.set(c.id,before);
   input.value = before;
   paint();
   form.querySelector('[data-fw-draft-status]').textContent = L().draftFailed;
  }
 }
 main.addEventListener('click',event => {
  if (current() && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
  event.preventDefault();
  handoff();
 });
 // A single text field can submit a form implicitly. The Enter selecting an
 // IME candidate belongs to the input method, even if composition ends first.
 let confirmingCandidate = false;
 input.addEventListener('keydown',event => {
  confirmingCandidate = event.isComposing || event.keyCode === 229;
 });
 input.addEventListener('keyup',() => { confirmingCandidate = false; });
 form.addEventListener('submit',event => {
  event.preventDefault();
  if (!confirmingCandidate) handoff();
 });
 paint();
}
const profileStateCache = new WeakMap();
const profileStateOwners = new WeakMap();
// Refresh only owner-scoped actions and the separate story / experience region.
// The public hero stays in place, and in-progress entry drafts are not consumed.
export function syncAccount(account) {
 const host=document.querySelector('[data-fw-profile-state]'),related=document.querySelector('[data-fw-related-state]');
 const c=cardById(host?.closest('[data-fw-character]')?.dataset.fwCharacter);
 if(!host||!related||!c)return;
 const owner=ownerFor(account),sameOwner=profileStateOwners.get(host)===owner;
 if(sameOwner)captureProfileDraft();
 setProfileDraftOwner(owner);
 const view=profileView(c,account),markup=profileStateMarkup(c,account,view),more=profileRelatedMarkup(c,account,view),cache=markup+'\n'+more;
 if(sameOwner&&profileStateCache.get(host)===cache)return;
 const active=document.activeElement,focus=sameOwner&&(host.contains(active)||related.contains(active))?rememberFocus():null;
 const reviewing=sameOwner&&related.querySelector('[data-fw-experiences]')?.hasAttribute('open');
 host.innerHTML=markup;related.innerHTML=more;
 if(reviewing)related.querySelector('[data-fw-experiences]')?.setAttribute('open','');
 profileStateCache.set(host,cache);profileStateOwners.set(host,owner);bindProfileEntry(c,account);
 if(!sameOwner){const about=host.closest('[data-fw-character]')?.querySelector('[data-fw-about]');if(about){const inside=about.contains(active);about.removeAttribute('open');if(inside)about.querySelector('summary')?.focus({preventScroll:true});}}
 else restoreFocus(focus);
}
function profileMarkup(c) {
 const l=L(),from=globalThis.history?.state?.from,fromStory=storyReturnUrl(from);
 const fromChat=characterReturnUrl(from)?.startsWith('/play/')?characterReturnUrl(from):null;
 const fromDirectory=characterDirectoryReturn(globalThis.history?.state?.discoveryReturn)||characterDirectoryReturn(from);
 const returnUrl=fromStory||fromDirectory||fromChat||'/characters',returnLabel=fromStory?l.storiesNav:fromDirectory?l.profileBack:fromChat?l.chatBack:l.profileBack;
 const samples=(c.voice?.samples||[]).map(sample=>`<blockquote class="fw-quote"><p>${safe(quoted(t(sample)))}</p><cite>${safe(l.samplesFrom)} · ${safe(t(sample.from)||workName(c.source.work))}</cite></blockquote>`);
 const primaryStory = storiesForCharacter(c.id)[0], profile = characterById.get(c.chatId);
 const introduction = profile ? (getLang()==='zh' ? profile.description_zh || profile.description : profile.description) : t(c.voice);
 const publicIntro = introduction?.match(/^.*?(?:[。！？]|[.!?](?=\s|$))/u)?.[0] || introduction;
 const title = safe(t(c.name)), background = characterArt(c)?.background;
 const role = t(primaryStory?.role || c.appearances[0]?.role) || workName(c.source.work);
 const view = profileView(c,currentHelpers?.account);
 return `<main class="fw-page fw-page-hero" data-no-i18n data-fw-page="profile" data-fw-character="${safe(c.id)}">${mobileBar({href:returnUrl,label:returnLabel})}<article class="fw-profile">
 <section class="fw-profile-hero sd-stage-card" aria-labelledby="fw-profile-name" style="--sd-stage-image:url('${safe(background || c.portrait)}')">
   <div class="fw-profile-top sd-stage-layout">
     <div class="fw-profile-portrait sd-stage-art${background ? ' fw-profile-composite' : ''}">
       <div class="fw-profile-scene">
         ${sceneArt(c,'eager')}
         <img id="fw-portrait-main" class="fw-portrait-figure" src="${safe(c.portrait)}" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false">
         <span class="fw-art-fallback" hidden>${safe(l.imageUnavailable)}</span>
         <span class="fw-stage-fade sd-stage-fade" aria-hidden="true"></span>
       </div>
     </div>
     <div class="fw-profile-body sd-stage-body">
       <div class="fw-profile-head">
         <div class="fw-character-meta">
           <span class="fw-capability sd-capability ${c.chat ? 'is-chat' : 'is-story'}">${safe(c.chat ? l.chatOnly : l.storyCapability)}</span>
           <p class="fw-eyebrow">${safe(role)}</p>
           ${primaryStory ? `<span aria-hidden="true">·</span><p class="fw-persona"><a data-fw-story-source data-full-info href="${safe(primaryStory.informationUrl)}">${safe(t(primaryStory.title))} ↗</a></p>` : ''}
         </div>
         <h1 id="fw-profile-name">${title}</h1>
         <p class="fw-tagline">${safe(t(c.tagline))}</p>
         ${publicIntro ? `<p class="fw-public-intro fw-profile-introduction">${safe(publicIntro)}</p>` : ''}
         ${samples[0] ? `<div class="fw-profile-quote">${samples[0]}</div>` : ''}
         ${c.portraitNote ? `<p class="fw-note fw-portrait-source">${safe(t(c.portraitNote))}</p>` : ''}
       </div>
       <div class="fw-profile-state" data-fw-profile-state>${profileStateMarkup(c,currentHelpers?.account,view)}</div>
     </div>
   </div>
 </section>
 <div data-fw-related-state>${profileRelatedMarkup(c,currentHelpers?.account,view)}</div>
 <details class="fw-details" id="fw-about" data-fw-about><summary id="fw-about-title">${safe(l.detailsH)}</summary><p>${safe(t(c.persona))}</p>${c.voice?`<h3>${safe(l.voiceH)}</h3><p>${safe(t(c.voice))}</p>`:''}${samples.slice(1).join('')}</details></article></main>`;
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
const focusAttributes = ['id','data-sd-lang','data-fw-world-select','data-fw-chat','data-fw-chat-entry','data-fw-story-entry','data-fw-story-source','data-fw-back','data-fw-starter'];
function rememberFocus() {
 const node = document.activeElement;
 const attribute = focusAttributes.find(key => node?.hasAttribute?.(key));
 const scope = node?.closest?.('[data-fw-page]') ? 'page' : node?.closest?.('#precision-view') ? 'shell' : null;
 const slot = attribute === 'data-sd-lang' ? ['sd-lang-side','sd-lang-top','sd-lang-legacy'].find(name => node.closest('.sd-lang')?.classList.contains(name)) : null;
 return attribute && scope ? {attribute,scope,slot,value:node.getAttribute(attribute),start:node.selectionStart,end:node.selectionEnd,direction:node.selectionDirection} : null;
}
function restoreFocus(saved) {
 if (!saved) return false;
 const root = saved.scope === 'page' ? document.querySelector('[data-fw-page]') : document.getElementById('precision-view');
 const node = [...(root?.querySelectorAll('[' + saved.attribute + ']') || [])].find(el =>
  el.getAttribute(saved.attribute) === saved.value &&
  (saved.scope !== 'shell' || !el.closest('[data-fw-page]')) &&
  (!saved.slot || el.closest('.sd-lang')?.classList.contains(saved.slot)));
 if (!node || node.disabled) return false;
 node.focus({preventScroll:true});
 if (Number.isInteger(saved.start) && node.setSelectionRange) { try { node.setSelectionRange(saved.start,saved.end,saved.direction); } catch {} }
 return true;
}
function bindCommon() {
 const profilePage=document.querySelector('[data-fw-page="profile"]');
 profilePage?.addEventListener('click',event=>{
  const jump=event.target.closest?.('[data-fw-story-jump]');
  if(!jump||!profilePage.contains(jump))return;
  event.preventDefault();event.stopPropagation();
  const target=profilePage.querySelector('#fw-stories'),heading=target?.querySelector('h2');
  if(!target||!heading)return;
  heading.tabIndex=-1;heading.focus({preventScroll:true});
  target.scrollIntoView({block:'start',behavior:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'instant':'smooth'});
 });
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
 document.querySelector('[data-fw-export]')?.addEventListener('click',exportDrafts);
}
function renderRoute(path) {
 captureProfileDraft();
 const draft = document.querySelector('.fw-character-feature input');
 if (draft) featuredDraft = draft.value;
 let markup, title;
 if (path === '/characters') { readLibraryState(); markup = libMarkup(); title = L().charactersNav; }
 else if (/^\/characters\/[^/]+$/.test(path)) { const c = cardById(path.split('/')[2]); markup = c ? profileMarkup(c) : missingMarkup(); title = c ? t(c.name) : L().missingCharacter; }
 else if (/^\/universe\/[^/]+$/.test(path)) { markup = missingMarkup(true); title = L().missingWorld; }
 else if (path === '/studio') { markup = studioMarkup(); title = L().legacyH; }
 else return false;
 mountShell(markup,currentHelpers,'flywheel');
 const state=document.querySelector('[data-fw-profile-state]');if(state)profileStateOwners.set(state,currentHelpers?.account?.user?.uid||null);
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
 const profileCard=cardById(document.querySelector('[data-fw-character]')?.dataset.fwCharacter);if(profileCard)bindProfileEntry(profileCard);
 bindCommon(); document.title = `${title} · StoryDate`; return true;
}
function bindLangRerender() {
 if (langBound) return;
 langBound = true;
 globalThis.addEventListener?.('sd-lang', () => {
  if (!currentHelpers) return;
  if (location.pathname === '/') return;
  const focus = rememberFocus();
  const state=document.querySelector('[data-fw-profile-state]'),sameOwner=!state||profileStateOwners.get(state)===(currentHelpers?.account?.user?.uid||null);
  const expanded=sameOwner?[...document.querySelectorAll('[data-fw-experiences][open],[data-fw-about][open]')].map(node=>node.id):[];
  if (renderRoute(location.pathname)) {
   for (const id of expanded) document.getElementById(id)?.setAttribute('open','');
   currentHelpers.repaint?.();
   if (!restoreFocus(focus) && focus?.scope === 'shell') {
    // The shared i18n observer places shell language controls after mounting.
    // Never focus a hidden legacy copy or take focus from a later user action.
    const page = document.querySelector('[data-fw-page]');
    globalThis.requestAnimationFrame?.(() => {
     if (page === document.querySelector('[data-fw-page]') && document.activeElement === document.body) restoreFocus(focus);
    });
   }
  }
 });
}
export function show(path,helpers) {
 const owner = helpers.account?.user?.uid || null;
 setProfileDraftOwner(owner);
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
