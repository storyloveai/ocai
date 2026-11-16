import {mountShell, show as referenceShow} from '../reference.js';
import {getLang} from '../site-i18n.js';
import {escapeHTML as safe} from '../stream.js';
import {XICHUAN_KEY, latestSave, legacySaves, progressText, storyContext} from '../xichuan-state.js';
import {CHARACTER_CARDS, WORKS, UNIVERSES, FRAMEWORKS, XICHUAN_FACT_LABELS, cardById, cardsByUniverse} from './cards-data.js';

const DRAFT_KEY = 'sd-flywheel-drafts';
// Existing artwork: compact page introductions and story-world covers.
const HERO_ART = {
  characters: { figure: '/assets/xichuan/art/sprites/zhiyao/normal.webp', blur: '/assets/xichuan/art/cg/cg_stage.webp' },
  universes: { figure: '/assets/ashen/art/anime/sprites/lamp/normal.webp', blur: '/assets/ashen/art/real/cg/cg_lamp_lit.webp' },
  westlin: { figure: '/assets/ashen/art/anime/sprites/lamp/normal.webp', blur: '/assets/ashen/art/real/cg/cg_lamp_lit.webp' },
  sanguo: { figure: '/assets/sanguo-art/portraits/caocao.webp', blur: '/assets/sanguo-art/cover.webp' },
  xichuan: { figure: '/assets/xichuan/art/sprites/zhiyao/normal.webp', blur: '/assets/xichuan/art/cg/cg_stage.webp' },
  baker: { figure: '/assets/holmes-webgal/game/figure/holmes_normal.webp', blur: '/assets/holmes-webgal/game/background/bg_baker_day.webp' },
  original: { figure: '/assets/characters/shen-yanzhou.webp', blur: '/assets/characters/lu-wensheng.webp' },
  frameworks: { figure: '/assets/ashen/art/anime/sprites/baiqiu/normal.webp', blur: '/assets/ashen/art/real/cg/cg_scales.webp' },
  studio: { figure: '/assets/ashen/art/anime/sprites/carlo/normal.webp', blur: '/assets/ashen/art/real/cg/cg_wheel.webp' },
};

// Compact introduction; artwork supplies colour without extra effects.
function heroMarkup(key, title, lead) {
  const art = HERO_ART[key] || HERO_ART.characters;
  return `<div class="fw-hero"><div class="fw-hero-art" aria-hidden="true"><img class="fw-hero-figure" src="${safe(art.figure)}" alt="" loading="eager"></div><div class="fw-hero-fade" aria-hidden="true"></div><div class="fw-hero-copy"><p class="fw-hero-meta"><span class="fw-hero-badge">STORYDATE</span></p><h1 class="fw-hero-quote">${safe(title)}</h1>${lead ? `<p class="fw-hero-lead">${safe(lead)}</p>` : ''}</div></div>`;
}

// 手机端顶栏（≤1023px 显示；桌面由侧栏承担），沿用 hub 的 sd-lang 按钮模式
const mobileBar = () => {
  const lang = getLang();
  return `<header class="fw-mobile-bar"><a href="/" aria-label="StoryDate"><img src="/assets/storydate-dialogue-logo.svg" alt="StoryDate" width="120" height="24"></a><div class="sd-lang sd-lang-top" role="group" aria-label="${lang === 'zh' ? '语言' : 'Language'}">${['en', 'zh'].map((x) => `<button type="button" data-sd-lang="${x}" aria-pressed="${x === lang}">${x === 'zh' ? '中文' : 'EN'}</button>`).join('')}</div></header>`;
};

// Task #154: a focused way to discover characters and enter existing stories.
// No simulated permissions, separate editor or invented gameplay outcomes.
const copy = {
 zh: {
  imageUnavailable: '图片暂不可用', libTitle: '认识故事里的人', libSub: '从一个让你好奇的角色开始，走进 TA 的故事。',
  all: '全部', chatOnly: '可聊天', empty: '没有找到角色，试试其他名字或筛选。', count: n => `${n} 个角色`, storyCount: n => `${n} 个故事`, searchPh: '搜索角色名字或关键词',
  chatCta: '开始聊天', continueChat: '继续聊天', storyCta: '进入故事', continueStory: '继续故事', profileBack: '返回角色', personaH: '人物背景', voiceH: '听 TA 说话', lockedH: '人物设定', appearH: '出场故事',
  restoring: '正在恢复账号进度…', stateUnavailable: '暂时无法读取此设备上的经历。请稍后刷新重试。', accountProgress: '当前账号的经历', deviceProgress: '本设备的经历', restoreFailed: '云端进度尚未恢复，以下为当前账号在本设备上的记录。', reviewH: '共同经历', reviewCta: '查看已有经历', noChatYet: '还没有对话，可以从第一次相遇开始。', chatSaved: n => `当前对话已有 ${n} 条消息。`, storyFacts: '当前剧情', memoriesH: '当前对话的记事', memoryNotesH: '聊天中的补充记忆', memoryYou: '你记下的话', memoryCharacter: '角色说过的话', noMemories: '还没有记事。在聊天中把想留下的话记下来，回来就能回顾。', noStoryFacts: '尚未开始故事。进入汐川后，经历会随当前存档更新。', storySync: '故事里的选择会带回聊天；聊天不会改写故事存档。', chatStep: '先和她聊聊', storyStep: '再走进她的故事', reviewStep: '回来看共同经历', reviewGuide: '只回顾当前存档和当前对话中保留的记事。',
  detailsH: '人物详细设定（含剧透）', samplesFrom: '原作节选', noSamples: '暂无原作节选。', sameUniverseH: '故事里的其他人', noChat: '可以先进入故事认识 TA，独立聊天暂未开放。', standalone: '将打开独立游戏页面。此入口的进度尚未与角色聊天同步。',
  exprH: '切换表情', encounterH: '选择一场相遇', encounterCta: '进入相遇', topicsH: '可以从这里聊起',
  uniTitle: '故事世界', uniSub: '了解故事发生的地方，再选一个人同行。', placesH: '地点', factionsH: '人物与势力', timelineH: '时间线', rulesH: '世界背景', magicH: '故事背景', storyH: '相关故事', charsH: '出场角色', rolesH: '位角色', worldDetails: '故事世界介绍',
  charactersNav: '角色', worldsNav: '故事世界', createNav: '创作', navLabel: '角色与故事',
  fwTitle: '选择你喜欢的玩法', fwSub: '有的故事考验谋略，有的让你慢慢靠近一个人。选一种，直接开始。', worksH: '开始体验', guideLink: '了解故事玩法',
  stTitle: '从一个想法开始创作', stSub: '角色和故事，都在同一个创作工坊里完成。', builderTitle: '打开创作工坊', builderSub: '选择创作角色或故事，填写设定，保存你的草稿。', builderCta: '进入创作工坊',
  legacyH: '旧版演示草稿', legacySub: '这些草稿仅存于此浏览器，不代表角色已发布或已授权。可以导出备份，在创作工坊继续整理。', exportJ: '导出旧草稿', loadFailed: '无法读取旧版草稿。浏览器中的原数据未修改；请检查此浏览器的存储设置。', rawExport: '下载原始备份', exportFailed: '下载未完成，请重试。', exported: '已发起下载，请检查浏览器下载列表。',
  homeStripTitle: '从故事认识角色', homeStripSub: '喜欢一个故事，也许是因为遇见了一个难忘的人。', homeStripMore: '认识更多角色',
 },
 en: {
  imageUnavailable: 'Image unavailable', libTitle: 'Meet the people in our stories', libSub: 'Start with someone who intrigues you. Discover the story they belong to.',
  all: 'All', chatOnly: 'Chat available', empty: 'No characters found. Try another name or filter.', count: n => `${n} ${n === 1 ? 'character' : 'characters'}`, storyCount: n => `${n} ${n === 1 ? 'story' : 'stories'}`, searchPh: 'Search names or keywords',
  chatCta: 'Start chatting', continueChat: 'Continue chatting', storyCta: 'Enter the story', continueStory: 'Continue the story', profileBack: 'Back to characters', personaH: 'Background', voiceH: 'In their own words', lockedH: 'Character details', appearH: 'Their stories',
  restoring: 'Restoring account progress…', stateUnavailable: 'Could not read experiences on this device. Refresh and try again.', accountProgress: 'Experiences for this account', deviceProgress: 'Experiences on this device', restoreFailed: 'Cloud progress has not been restored. These are this account’s records on this device.', reviewH: 'Shared experiences', reviewCta: 'Review experiences', noChatYet: 'No conversation yet. Begin with your first meeting.', chatSaved: n => `${n} messages in the current conversation.`, storyFacts: 'Current story', memoriesH: 'Memories from this conversation', memoryNotesH: 'Additional chat memories', memoryYou: 'Words you kept', memoryCharacter: 'Words the character said', noMemories: 'No memories kept yet. Keep a line in chat to revisit it here.', noStoryFacts: 'The story has not started. Experiences will follow your active save when you enter Xichuan.', storySync: 'Story choices carry back to chat. Chat does not change story saves.', chatStep: 'Talk with her first', storyStep: 'Step into her story', reviewStep: 'Return to shared experiences', reviewGuide: 'Review only the active save and memories kept in the current conversation.',
  detailsH: 'More about this character (spoilers)', samplesFrom: 'Story excerpt', noSamples: 'No excerpts available yet.', sameUniverseH: 'Others in this world', noChat: 'Meet them in their story first. Standalone chat is not available yet.', standalone: 'Opens a standalone game. Progress here does not yet sync with character chat.',
  exprH: 'Change expression', encounterH: 'Choose an encounter', encounterCta: 'Start here', topicsH: 'Conversation starters',
  uniTitle: 'Story worlds', uniSub: 'Explore where each story unfolds, then choose someone to meet.', placesH: 'Places', factionsH: 'People & factions', timelineH: 'Timeline', rulesH: 'Background', magicH: 'About this world', storyH: 'Related stories', charsH: 'Meet the cast', rolesH: 'characters', worldDetails: 'About this story world',
  charactersNav: 'Characters', worldsNav: 'Story worlds', createNav: 'Create', navLabel: 'Characters and stories',
  fwTitle: 'Find your kind of story', fwSub: 'Test your strategy, solve a mystery, or grow closer to someone. Choose a story and start playing.', worksH: 'Try it', guideLink: 'Explore story formats',
  stTitle: 'Start with an idea', stSub: 'Create characters and stories in one workshop.', builderTitle: 'Open the workshop', builderSub: 'Choose a character or a story, add your ideas, and save a draft.', builderCta: 'Start creating',
  legacyH: 'Earlier demo drafts', legacySub: 'These drafts exist only in this browser. They have not been published or licensed. Export a backup to continue working in the workshop.', exportJ: 'Export demo drafts', loadFailed: 'Could not read earlier drafts. The original browser data has not been changed. Check your browser storage settings.', rawExport: 'Download raw backup', exportFailed: 'Download failed. Please try again.', exported: 'Download started. Check your browser downloads.',
  homeStripTitle: 'Meet characters through stories', homeStripSub: 'Sometimes a story stays with you because of someone you met there.', homeStripMore: 'Meet more characters',
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
function localNav() {
 const l = L(), path = location.pathname;
 return `<nav class="fw-nav" aria-label="${safe(l.navLabel)}">${[['/characters',l.charactersNav],['/universe',l.worldsNav],['/builder',l.createNav]].map(([href,label]) => `<a href="${href}"${path === href || path.startsWith(href + '/') ? ' aria-current="page"' : ''}>${safe(label)}</a>`).join('')}</nav>`;
}
let styles = false;
function ensureStyles() {
  if (styles) return;
  styles = true;
  if (!document.querySelector('link[href="/assets/flywheel/flywheel.css?v=20261116-loop"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/flywheel/flywheel.css?v=20261116-loop';
    document.head.append(link);
  }
}

// —— 小组件 ——
const cardArt = (c) => `<img src="${safe(c.portrait)}" alt="" width="300" height="400" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="fw-art-fallback" hidden>${safe(L().imageUnavailable)}</span>`;
const workName = (id) => t(WORKS[id]?.title) || id;
const uniName = (id) => t(UNIVERSES[id]?.name) || id;
const fwName = (id) => t(FRAMEWORKS[id]?.name) || id;
// 独立整页游戏（/assets/**）必须整页跳转，不能走 SPA 路由（站内现例：ashen 卡 target="_top"）
const isStandalone = (url) => /^\/assets\//.test(url || '');
const ext = (url) => (isStandalone(url) ? ' target="_top" rel="noopener"' : '');

function cardMarkup(c) {
  const l = L();
  return `<a class="fw-card" href="/characters/${safe(c.id)}">
    <span class="fw-card-portrait">${cardArt(c)}<span class="fw-card-scrim" aria-hidden="true"></span><strong class="fw-card-name">${safe(t(c.name))}</strong></span>
    <span class="fw-card-body">
      <em>${safe(t(c.tagline))}</em>${c.portraitNote ? `<span class="fw-note">${safe(t(c.portraitNote))}</span>` : ''}
      <span class="fw-card-badges"><span class="fw-badge">${safe(workName(c.source.work))}</span>${c.chat ? `<span class="fw-badge fw-badge-gold">${safe(l.chatCta)} ↗</span>` : ''}</span>
    </span>
  </a>`;
}
const grid = (cards) => `<div class="fw-grid">${cards.map(cardMarkup).join('')}</div>`;

// —— /characters ——
let libFilter = { universe: 'all', chat: false };
let libQuery = '';
function libItems() {
  let items = libFilter.universe === 'all' ? CHARACTER_CARDS : cardsByUniverse(libFilter.universe);
  if (libFilter.chat) items = items.filter((c) => c.chat);
  const q = libQuery.trim().toLowerCase();
  if (q) items = items.filter((c) => [c.name, c.tagline, c.persona].flatMap((v) => [v.zh, v.en]).join(' ').toLowerCase().includes(q));
  return items;
}
function libResults(items) {
  const l = L();
  return items.length ? grid(items) : `<div class="fw-empty">${l.empty}</div>`;
}
function libMarkup() {
  const l = L();
  const chips = ['all', ...Object.keys(UNIVERSES)].map((id) => {
    const label = id === 'all' ? l.all : uniName(id);
    const n = id === 'all' ? CHARACTER_CARDS.length : cardsByUniverse(id).length;
    return `<button type="button" class="fw-chip${libFilter.universe === id ? ' active' : ''}" data-fw-filter="${id}" aria-pressed="${libFilter.universe === id}">${safe(label)} <small>${n}</small></button>`;
  }).join('');
  const items = libItems();
  return `<main class="fw-page fw-page-hero" data-no-i18n data-fw-page="characters">
    ${mobileBar()}${localNav()}
    ${heroMarkup('characters', l.libTitle, l.libSub)}
    <div class="fw-toolbar" role="group">${chips}<button type="button" class="fw-chip fw-chip-toggle${libFilter.chat ? ' active' : ''}" data-fw-chat="1" aria-pressed="${libFilter.chat}">${safe(l.chatOnly)}</button><span class="fw-count" role="status">${l.count(items.length)}</span></div>
    <label class="fw-search"><span aria-hidden="true">⌕</span><input type="search" id="fw-search" placeholder="${safe(l.searchPh)}" value="${safe(libQuery)}" aria-label="${safe(l.searchPh)}" autocomplete="off"></label>
    <div id="fw-lib-results">${libResults(items)}</div>
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
 }).slice(0, 6);
 const notes = read('ooc-Memories-' + c.chatId, '');
 return {messages, pins, notes: typeof notes === 'string' ? notes.slice(0,350).trim() : ''};
}
function experiencesMarkup(c, raw, chat) {
 const l = L(), context = storyContext(raw);
 const facts = Object.entries(XICHUAN_FACT_LABELS).filter(([key]) => context?.flags[key] === true);
 const story = c.source.work === 'xichuan' ? `<h3>${safe(l.storyFacts)}</h3>${context ? `<p>${safe(progressText(raw,getLang()))}</p>${facts.length ? `<ul class="fw-experience-facts">${facts.map(([,label]) => `<li>${safe(t(label))}</li>`).join('')}</ul>` : ''}` : `<p class="fw-note">${safe(l.noStoryFacts)}</p>`}` : '';
 const memories = c.chat ? `<h3>${safe(l.memoriesH)}</h3>${chat.pins.length ? chat.pins.map(p => `<blockquote class="fw-quote"><p>${safe(p.text)}</p><cite>${safe(p.role === 'user' ? l.memoryYou : l.memoryCharacter)}</cite></blockquote>`).join('') : `<p class="fw-note">${safe(l.noMemories)}</p>`}${chat.notes ? `<h3>${safe(l.memoryNotesH)}</h3><p class="fw-memory-notes">${safe(chat.notes)}</p>` : ''}` : '';
 return `<section class="fw-experiences" id="fw-experiences" data-fw-experiences aria-labelledby="fw-experiences-title"><h2 id="fw-experiences-title">${safe(l.reviewH)}</h2>${story}${memories}</section>`;
}
function profileStateMarkup(c, account = currentHelpers?.account) {
 const l = L(), w = WORKS[c.source.work];
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
  const chatLink = c.chat ? `<a class="fw-btn" data-fw-chat-entry href="${safe(c.chat)}">${safe(chatting ? l.continueChat : l.chatCta)} →</a>` : '';
  const storyLink = w && c.source.work !== 'character' ? `<a class="fw-btn${c.chat ? ' fw-btn-secondary' : ''}" data-fw-story-entry href="${safe(w.url)}"${ext(w.url)}>${safe(played ? l.continueStory : l.storyCta)} →</a>` : '';
  const chatStatus = `<p class="fw-note" data-fw-chat-status>${safe(chatting ? l.chatSaved(chat.messages.length) : l.noChatYet)}</p>`;
  const storyStatus = c.source.work === 'xichuan' ? `<p class="fw-note" data-fw-progress>${safe(progressText(raw,getLang()))}</p>` : '';
  const scope = c.chat || c.source.work === 'xichuan' ? `<p class="fw-progress-scope">${safe(account?.user ? l.accountProgress : l.deviceProgress)}</p>${account?.restoreError ? `<p class="fw-note" role="status">${safe(l.restoreFailed)}</p>` : ''}` : '';
  if (c.id === 'xc-zhiyao') return `${scope}<ol class="fw-journey"><li><div><h2>${safe(l.chatStep)}</h2>${chatStatus}</div><div class="fw-ctas">${chatLink}</div></li><li><div><h2>${safe(l.storyStep)}</h2>${storyStatus}</div><div class="fw-ctas">${storyLink}</div></li><li><div><h2>${safe(l.reviewStep)}</h2><p class="fw-note">${safe(l.reviewGuide)}</p></div><a class="fw-review-link" href="#fw-experiences">${safe(l.reviewCta)} ↓</a></li></ol><p class="fw-note">${safe(l.storySync)}</p>${experiencesMarkup(c,raw,chat)}`;
  return `${scope}<div class="fw-ctas">${chatLink}${storyLink}</div>${c.chat ? chatStatus : `<p class="fw-note">${safe(l.noChat)}</p>`}${storyStatus}${w && isStandalone(w.url) ? `<p class="fw-note">${safe(l.standalone)}</p>` : ''}${c.chat ? experiencesMarkup(c,raw,chat) : ''}`;
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
 host.innerHTML = markup;
 profileStateCache.set(host,markup);
}
function profileMarkup(c) {
  const l = L();
  const samples = (c.voice?.samples || []).map((s) => `<blockquote class="fw-quote"><p>${safe(quoted(t(s)))}</p><cite>${safe(l.samplesFrom)} · ${safe(t(s.from) || workName(c.source.work))}</cite></blockquote>`).join('');
  const appears = c.appearances.map((a) => `<a class="fw-appearance" href="${safe(a.url)}"${ext(a.url)}><strong>${safe(workName(a.work))}</strong><span>${safe(t(a.role))}</span><span aria-hidden="true">↗</span></a>`).join('');
  const encounters = (c.encounters || []).map((e) => `<a class="fw-appearance" href="${safe(e.url)}"><strong>${safe(t(e.title))}</strong><span>${safe(l.encounterCta)}</span><span aria-hidden="true">↗</span></a>`).join('');
  const starters = (c.starters?.[getLang() === 'zh' ? 'zh' : 'en'] || []).map((x) => `<li>${safe(x)}</li>`).join('');
  const others = cardsByUniverse(c.source.universe).filter((x) => x.id !== c.id).slice(0, 8);
  const multi = (c.expressions || []).length > 1;
  const portraitBlock = multi
    ? `<div class="fw-profile-portrait"><img id="fw-portrait-main" src="${safe(c.expressionUrl(expressionFor(c)))}" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="fw-art-fallback" hidden>${safe(l.imageUnavailable)}</span>
       <div class="fw-expressions" role="group" aria-label="${safe(l.exprH)}">${c.expressions.map((e, i) => `<button type="button" class="fw-expr${expressionFor(c) === e ? ' active' : ''}" data-fw-expr="${safe(c.expressionUrl(e))}" aria-pressed="${expressionFor(c) === e}" aria-label="${safe(expressionName(e))}" title="${safe(expressionName(e))}"><img src="${safe(c.expressionUrl(e))}" alt="" loading="lazy"></button>`).join('')}</div></div>`
    : `<div class="fw-profile-portrait">${cardArt(c)}</div>`;
  return `<main class="fw-page fw-page-hero" data-no-i18n data-fw-page="profile" data-fw-character="${safe(c.id)}">
    ${mobileBar()}${localNav()}
    <a class="fw-back" href="/characters">‹ ${l.profileBack}</a>
    <article class="fw-profile">
      <div class="fw-profile-top">
        ${portraitBlock}
        <div class="fw-profile-head">
          <p class="fw-eyebrow">${safe(uniName(c.source.universe))} · ${safe(fwName(c.source.framework))}</p>
          <h1>${safe(t(c.name))}</h1>
          <p class="fw-tagline">${safe(t(c.tagline))}</p>
          <p class="fw-persona">${safe(workName(c.source.work))}</p>${c.portraitNote ? `<p class="fw-note">${safe(t(c.portraitNote))}</p>` : ''}
          <div data-fw-profile-state aria-live="polite">${profileStateMarkup(c)}</div>
        </div>
      </div>
      <section class="fw-section"><h2>${l.voiceH}</h2>${c.voice ? `<p>${safe(t(c.voice))}</p>` : ''}${samples || `<p class="fw-note">${safe(l.noSamples)}</p>`}</section>
      <details class="fw-details"><summary>${safe(l.detailsH)}</summary><h3>${safe(l.personaH)}</h3><p>${safe(t(c.persona))}</p><h3>${safe(l.lockedH)}</h3><p>${safe(t(c.locked))}</p></details>
      <section class="fw-section"><h2>${l.appearH}</h2><div class="fw-appearances">${appears}</div>
      ${encounters ? `<h3 class="fw-subhead">${safe(l.encounterH)}</h3><div class="fw-appearances">${encounters}</div>` : ''}
      ${starters ? `<h3 class="fw-subhead">${safe(l.topicsH)}</h3><ul class="fw-rules fw-starters">${starters}</ul>` : ''}</section>
      ${others.length ? `<section class="fw-section"><h2>${l.sameUniverseH}</h2><div class="fw-hscroll">${others.map(cardMarkup).join('')}</div></section>` : ''}
    </article>
  </main>`;
}

// —— /universe ——
function universesMarkup() {
  const l = L();
  const cards = Object.keys(UNIVERSES).map((id) => {
    const u = UNIVERSES[id];
    const chars = cardsByUniverse(id);
    const works = [...new Set(chars.map((c) => c.source.work))].length;
    const art = HERO_ART[id] || null;
    const cover = art ? `<img src="${safe(art.blur)}" alt="" loading="lazy">` : (chars[0] ? `<img src="${safe(chars[0].portrait)}" alt="" loading="lazy">` : '');
    return `<a class="fw-uni-card" href="/universe/${safe(id)}">
      <span class="fw-uni-cover">${cover ? cover : '<span class="fw-uni-blank"></span>'}<span class="fw-card-scrim" aria-hidden="true"></span><strong class="fw-card-name">${safe(t(u.name))}</strong></span>
      <em>${safe(t(u.tagline))}</em>
      <span class="fw-card-badges"><span class="fw-badge">${chars.length} ${safe(l.rolesH)}</span><span class="fw-badge fw-badge-dim">${safe(l.storyCount(works))}</span>${u.rules ? '<span class="fw-badge">' + safe(l.rulesH) + '</span>' : ''}</span>
    </a>`;
  }).join('');
  return `<main class="fw-page fw-page-hero" data-no-i18n data-fw-page="universes">
    ${mobileBar()}${localNav()}
    ${heroMarkup('universes', l.uniTitle, l.uniSub)}
    <div class="fw-uni-grid">${cards}</div><p class="fw-builderlink"><a href="/frameworks">${safe(l.guideLink)} →</a></p>
  </main>`;
}

function universeMarkup(id) {
  const l = L();
  const u = UNIVERSES[id];
  if (!u) return null;
  const chars = cardsByUniverse(id);
  const works = [...new Set(chars.map((c) => c.source.work))].map((w) => WORKS[w]).filter(Boolean);
  const tabs = u.rules ? `
    <div class="fw-tabs" role="tablist" aria-label="${safe(l.worldDetails)}">
      <button type="button" role="tab" aria-selected="true" class="active" data-fw-tab="rules" id="fw-tab-rules" aria-controls="fw-pane-rules" tabindex="0">${safe(l.rulesH)}</button>
      <button type="button" role="tab" aria-selected="false" data-fw-tab="places" id="fw-tab-places" aria-controls="fw-pane-places" tabindex="-1">${safe(l.placesH)}</button>
      <button type="button" role="tab" aria-selected="false" data-fw-tab="factions" id="fw-tab-factions" aria-controls="fw-pane-factions" tabindex="-1">${safe(l.factionsH)}</button>
      <button type="button" role="tab" aria-selected="false" data-fw-tab="timeline" id="fw-tab-timeline" aria-controls="fw-pane-timeline" tabindex="-1">${safe(l.timelineH)}</button>
    </div>
    <div class="fw-tabpanes">
      <section class="fw-pane" data-fw-pane="rules" id="fw-pane-rules" role="tabpanel" aria-labelledby="fw-tab-rules" tabindex="0"><h2>${l.magicH}</h2><p class="fw-world">${safe(t(u.rules.world))}</p><ul class="fw-rules">${(u.rules.magic || []).map((m) => `<li>${safe(t(m))}</li>`).join('')}</ul></section>
      <section class="fw-pane" data-fw-pane="places" id="fw-pane-places" role="tabpanel" aria-labelledby="fw-tab-places" tabindex="0" hidden><ul class="fw-factions">${(u.rules.places || []).map((p) => `<li><strong>${safe(t(p.name))}</strong><span>${safe(t(p.desc))}</span></li>`).join('')}</ul></section>
      <section class="fw-pane" data-fw-pane="factions" id="fw-pane-factions" role="tabpanel" aria-labelledby="fw-tab-factions" tabindex="0" hidden><ul class="fw-factions">${(u.rules.factions || []).map((f) => `<li><strong>${safe(t(f.name))}</strong><span>${safe(t(f.desc))}</span></li>`).join('')}</ul></section>
      <section class="fw-pane" data-fw-pane="timeline" id="fw-pane-timeline" role="tabpanel" aria-labelledby="fw-tab-timeline" tabindex="0" hidden><div class="fw-timeline">${(u.rules.timeline || []).map((e) => `<div class="fw-era"><strong>${safe(t(e.t))}</strong><p>${safe(t(e.d))}</p></div>`).join('')}</div></section>
    </div>` : '';
  const workCards = works.map((w) => `<a class="fw-appearance" href="${safe(w.url)}"${ext(w.url)}><strong>${safe(t(w.title))}</strong><span>${safe(t(w.kind))}</span><span aria-hidden="true">↗</span></a>`).join('');
  return `<main class="fw-page fw-page-hero" data-no-i18n data-fw-page="universe">
    ${mobileBar()}${localNav()}
    ${heroMarkup(id, t(u.name), t(u.tagline))}
    <a class="fw-back" href="/universe">‹ ${l.uniTitle}</a>
    ${tabs}
    <section class="fw-section"><h2>${l.charsH} · ${chars.length}</h2>${chars.length ? grid(chars) : `<div class="fw-empty">${l.empty}</div>`}</section>
    <section class="fw-section"><h2>${l.storyH}</h2><div class="fw-appearances">${workCards}</div></section>
  </main>`;
}

// Formats explain the existing stories; they do not simulate engine outcomes.
const GUIDE = {
 strategist: {zh:'你是一名谋士。在关键时刻做出选择，观察人物关系与局势如何变化。', en:'Play a strategist. Make choices at decisive moments and see how relationships and circumstances change.'},
 galgame: {zh:'通过场景、对话和选择了解角色，走进不同的个人故事与结局。', en:'Get to know the cast through scenes, dialogue and choices, with personal stories and different endings.'},
 detective: {zh:'以华生的视角探索案件，收集线索、盘问证人，和福尔摩斯一起推理。卷一试样可体验。', en:'Explore a case as Watson. Gather clues, question witnesses and reason alongside Holmes in the volume-one pilot.'},
 chat: {zh:'从一次相遇开始与角色自由交谈，也可以回顾对话、整理记事或探索另一条分支。', en:'Begin with an encounter and talk freely. Revisit conversations, keep notes or explore another branch.'},
};
function frameworksMarkup() {
 const l = L();
 return `<main class="fw-page" data-no-i18n data-fw-page="frameworks">${mobileBar()}${localNav()}${heroMarkup('frameworks',l.fwTitle,l.fwSub)}<div class="fw-guide-grid">${Object.entries(GUIDE).map(([id,desc]) => `<section id="fw-${id}"><h2>${safe(fwName(id))}</h2><p>${safe(t(desc))}</p><div class="fw-appearances">${FRAMEWORKS[id].works.map(work => `<a class="fw-appearance" href="${safe(WORKS[work].url)}"${ext(WORKS[work].url)}>${safe(workName(work))} ↗</a>`).join('')}</div></section>`).join('')}</div></main>`;
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
 return `<main class="fw-page" data-no-i18n data-fw-page="studio">${mobileBar()}${localNav()}${heroMarkup('studio',l.stTitle,l.stSub)}<section class="fw-studio-start"><h2>${safe(l.builderTitle)}</h2><p>${safe(l.builderSub)}</p><a class="fw-btn" href="/builder">${safe(l.builderCta)} →</a></section>${legacy.error ? `<p class="fw-local-notice" role="status">${safe(l.loadFailed)}</p>` : ''}${legacy.drafts.length || legacy.raw && legacy.error ? `<details class="fw-details" id="fw-drafts"><summary>${safe(l.legacyH)}${legacy.drafts.length ? ` · ${legacy.drafts.length}` : ''}</summary><p>${safe(l.legacySub)}</p>${legacy.drafts.length ? `<ul class="fw-rules">${legacy.drafts.map(d => `<li>${safe(t(d?.name) || '—')}</li>`).join('')}</ul>` : ''}<p><button type="button" class="fw-btn fw-btn-secondary" data-fw-export>${safe(legacy.error ? l.rawExport : l.exportJ)}</button></p><p id="fw-export-status" role="status"></p></details>` : ''}</main>`;
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
function homeStrip() {
 const l = L();
 const rows = ['xichuan','sanguo','westlin','baker'].map(id => `<a class="fw-strip-row" href="/characters?world=${id}"><strong>${safe(uniName(id))}</strong><span class="fw-strip-faces">${cardsByUniverse(id).slice(0,4).map(cardArt).join('')}</span><span aria-hidden="true">→</span></a>`).join('');
 return `<section class="fw-strip" data-no-i18n aria-label="${safe(l.homeStripTitle)}"><header><h2>${safe(l.homeStripTitle)}</h2><p>${safe(l.homeStripSub)}</p></header><div class="fw-strip-rows">${rows}</div><div class="fw-strip-links"><a class="fw-btn" href="/characters">${safe(l.homeStripMore)} →</a></div></section>`;
}
function appendStrip() {
 const host = document.querySelector('#precision-view') || document.querySelector('#main');
 if (!host) return;
 document.getElementById('fw-home-strip')?.remove();
 const wrap = document.createElement('div'); wrap.id = 'fw-home-strip'; wrap.innerHTML = homeStrip();
 const footer = [...host.querySelectorAll('footer')].pop();
 if (footer?.parentElement) footer.parentElement.insertBefore(wrap,footer); else host.append(wrap);
}
let currentHelpers = null, langBound = false;
const worldTabs = new Map();
function bindCommon() {
 document.querySelectorAll('[data-fw-filter]').forEach(b => b.onclick = () => { libFilter.universe = b.dataset.fwFilter; renderRoute('/characters'); document.querySelector(`[data-fw-filter="${libFilter.universe}"]`)?.focus(); });
 document.querySelector('[data-fw-chat]')?.addEventListener('click', () => { libFilter.chat = !libFilter.chat; renderRoute('/characters'); document.querySelector('[data-fw-chat]')?.focus(); });
 document.getElementById('fw-search')?.addEventListener('input', e => {
  libQuery = e.target.value;
  document.getElementById('fw-lib-results').innerHTML = libResults(libItems());
  document.querySelector('.fw-count').textContent = L().count(libItems().length);
 });
 document.querySelectorAll('[data-fw-expr]').forEach(b => b.onclick = () => {
  const id = document.querySelector('[data-fw-character]').dataset.fwCharacter, c = cardById(id);
  chosenExpressions.set(id,c.expressions.find(e => c.expressionUrl(e) === b.dataset.fwExpr));
  const main = document.getElementById('fw-portrait-main'); main.hidden = false; main.nextElementSibling.hidden = true; main.src = b.dataset.fwExpr;
  document.querySelectorAll('[data-fw-expr]').forEach(x => { x.classList.toggle('active',x === b); x.setAttribute('aria-pressed',String(x === b)); });
 });
 document.querySelectorAll('.fw-tabs').forEach(wrap => {
  const tabs = [...wrap.querySelectorAll('[role=tab]')];
  const select = b => {
   worldTabs.set(location.pathname,b.dataset.fwTab);
   tabs.forEach(x => { const active = x === b; x.classList.toggle('active',active); x.setAttribute('aria-selected',String(active)); x.tabIndex = active ? 0 : -1; });
   document.querySelectorAll('[data-fw-pane]').forEach(p => p.hidden = p.dataset.fwPane !== b.dataset.fwTab);
  };
  tabs.forEach((b,i) => { b.onclick = () => select(b); b.onkeydown = e => {
   const next = e.key === 'ArrowRight' ? (i+1)%tabs.length : e.key === 'ArrowLeft' ? (i+tabs.length-1)%tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length-1 : null;
   if (next != null) { e.preventDefault(); select(tabs[next]); tabs[next].focus(); }
  }; });
  const saved = tabs.find(b => b.dataset.fwTab === worldTabs.get(location.pathname)); if (saved) select(saved);
 });
 document.querySelector('[data-fw-export]')?.addEventListener('click',exportDrafts);
}
function renderRoute(path) {
 let markup, title;
 if (path === '/characters') { markup = libMarkup(); title = L().charactersNav; }
 else if (/^\/characters\/[^/]+$/.test(path)) { const c = cardById(path.split('/')[2]); if (!c) return false; markup = profileMarkup(c); title = t(c.name); }
 else if (path === '/universe') { markup = universesMarkup(); title = L().uniTitle; }
 else if (/^\/universe\/[^/]+$/.test(path)) { const id = path.split('/')[2]; markup = universeMarkup(id); if (!markup) return false; title = uniName(id); }
 else if (path === '/frameworks') { markup = frameworksMarkup(); title = L().guideLink; }
 else if (path === '/studio') { markup = studioMarkup(); title = L().createNav; }
 else return false;
 mountShell(markup,currentHelpers,'flywheel');
 // Shared shell hydration marks the canonical character navigation item.
 bindCommon(); document.title = `${title} · StoryDate`; return true;
}
function bindLangRerender() {
 if (langBound) return;
 langBound = true;
 globalThis.addEventListener?.('sd-lang', () => {
  if (!currentHelpers) return;
  if (location.pathname === '/') { appendStrip(); return; }
  if (renderRoute(location.pathname)) currentHelpers.repaint?.();
 });
}
export function show(path,helpers) {
 currentHelpers = helpers; ensureStyles();
 if (path === '/') {
  if (!referenceShow(path,helpers)) return false;
  appendStrip(); bindLangRerender(); return true;
 }
 if (path === '/characters') {
  const world = new URLSearchParams(location.search).get('world');
  if (world && UNIVERSES[world]) { libFilter.universe = world; libFilter.chat = false; libQuery = ''; }
 }
 const handled = renderRoute(path);
 if (handled) bindLangRerender();
 return handled;
}
