// Site-wide Chinese / English. The page markup is written in English (much of it captured), so this module
// swaps known interface strings in place and keeps swapping as pages render. Story content written by creators is
// left alone, except StoryDate's own titles, which carry both languages in their catalog entries.
// Language: the visitor's pick (localStorage sd.lang), otherwise the browser language.
import {storydateOriginals, storydateCharacters} from './storydate-originals.js';
import {threeKingdoms, threeKingdomsInk} from './three-kingdoms.js';
import announcements from './announcements.js';

export const LANGS = ['en', 'zh'];
export function getLang(win = globalThis) {
  try { const v = win.localStorage?.getItem('sd.lang'); if (LANGS.includes(v)) return v; } catch {}
  return /^zh/i.test(win.navigator?.language || '') ? 'zh' : 'en';
}

// [English, Chinese]; extra English spellings of the same thing follow the Chinese.
const UI = [
  ['Daily check-in: +100 credits', '每日签到：+100 积分'], ['Continue with Google', '使用 Google 继续'], ['● Continue with Apple', '● 使用 Apple 继续'],
  ['Continue with Apple', '使用 Apple 继续'], ['Sign in to save your stories', '登录后保存你的故事'], ['Sign up and get 500 credits!', '登录后保存你的故事'],
  ['Home', '首页'], ['History', '历史'], ['My Titles', '我的作品'], ['My titles', '我的作品'], ['MY', '我的'], ['Search', '搜索'], ['Story', '故事'],
  ['Character', '角色'], ['Community', '社区'], ['Credits', '积分'], ['Credit', '积分'], ['Notifications', '通知'], ['Notice', '公告'], ['Update', '更新'], ['Event', '活动'],
  ['Explore', '探索'], ['Previous slide', '上一张'], ['Next slide', '下一张'], ['Main', '精选'], ['New Ranking', '新作榜'], ['Rankings', '排行榜'], ['Today', '今日'],
  ['Browse by genre','按题材浏览'], ['Start chatting','开始对话'],
  ['Fantasy', '奇幻'], ['Romance', '恋爱'], ['Sci-Fi', '科幻'], ['Girls Love', '百合'], ['Horror', '恐怖'], ['Oriental Fantasy', '东方奇幻'], ['Slice of Life', '日常'],
  ['Fan Fiction', '同人'], ['Utility', '工具'], ['Boys Love', '耽美'], ['Others', '其他'], ['Adventure', '冒险'], ['Action', '动作'], ['Comedy', '喜剧'], ['Thriller', '惊悚'],
  ['Top Ranked', '热门榜'], ['View All', '查看全部'], ['StoryDate Originals', 'StoryDate 原创', 'OOC Originals'], ['Trending Now', '当下热门'],
  ['Trending New Creators', '新晋创作者'], ['Tags', '标签'], ['New from certified creators', '认证创作者新作'], ['Most Played', '最多游玩'], ['Newest', '最新'],
  ['Title A–Z', '标题 A–Z'], ['Profile', '个人资料'], ['Support', '支持'], ['Contact & Support', '联系与支持'], ['Terms of Service', '服务条款'],
  ['Privacy Policy', '隐私政策'], ['Referral Program Terms', '邀请计划条款'],
  ['© 2026 StoryDate. All rights reserved.', '© 2026 StoryDate 保留所有权利。', '© 2026 New AI Entertainment Inc. All rights reserved.'],
  ['All', '全部'], ['Creator', '创作者'], ['Popular titles', '热门作品'], ['Explore stories, characters and creators', '探索故事、角色和创作者'],
  ['Search stories, characters, creators', '搜索故事、角色、创作者'], ['Search stories, characters and creators', '搜索故事、角色和创作者'], ['Back to stories', '返回故事'],
  ['My Credit', '我的积分'], ['Credit History', '积分记录'], ['Explore Auto-Reload Credits', '了解自动充值'], ['Buy Credits Now!', '立即购买积分！'],
  ['Auto-Reload Credits', '自动充值'], ['Auto-Reload', '自动充值'], ['Claim Free Credits', '领取免费积分'], ['Sign in to view your balance', '登录后查看余额'],
  ['Credit purchases are not available yet.', '暂时还不能购买积分。'], ['Payment & Refund Information', '支付与退款说明'], ['Buy Now', '立即购买'],
  ['About Credits', '关于积分'], ['Credit bundles', '积分套餐'], ['View Credits', '查看积分'], ['Recharge', '充值'],
  ['Create Title', '创建作品'], ['Drafts', '草稿'], ['Published', '已发布'], ['Draft', '草稿'], ['Latest', '最新'],
  ['There are no titles yet. Create your first title!', '还没有作品，来创建第一个吧！'], ['No recent conversations.', '还没有最近的对话。'], ['Explore stories', '去看看故事'],
  ['Titles written and published by StoryDate creators.', '由 StoryDate 创作者撰写并发布的作品。', 'Titles written and published by Storylove creators.'],
  ['Back', '返回'], ['‹ Back', '‹ 返回'], ['Your profile', '你的资料'], ['Profile and preferences', '资料与偏好'], ['Content Settings', '内容设置'],
  ['Session Settings', '会话设置'], ['Personalization', '个性化'], ['Favorites', '收藏'], ['Manage Blocked Content', '屏蔽管理'], ['Benefits', '福利'],
  ['Inquiries and Notice', '咨询与公告'], ['Customer Support', '客服'], ['Account settings', '账号设置'], ['Sort by', '排序'], ['Featured', '推荐'],
  ['Story Information', '故事信息'], ['Information', '信息'], ['Comment', '评论'], ['Comments', '评论'], ['Official Creator', '官方创作者'],
  ['Creator Custom Prompt', '创作者自定义设定'], ['Male-oriented', '男性向'], ['Female-oriented', '女性向'], ['New Play', '开始新游戏'],
  ['Story Description', '故事简介'], ['Settings', '设置'], ['Avatar Settings', '形象设置'], ['Starting Scenarios', '开场情景'], ['Default', '默认'],
  ['Prologue Preview', '序章预览'], ['Last Update', '最近更新'], ['Most Liked', '最多点赞'], ['Leave a comment', '写下评论'], ['Post', '发布'],
  ['Back to Previous Page', '返回上一页'], ['Bookmark story', '收藏故事'], ['More options', '更多选项'], ['Sort comments', '评论排序'], ['Your comment', '你的评论'],
  ['Start your story', '开始你的故事'], ['Demo · simulated responses', '演示 · 模拟回复'], ['Change mode', '切换模式'], ['Image Gallery', '图片集'],
  ['Chat Settings', '聊天设置'], ['Play Guide', '玩法说明'], ['Avatars', '形象'], ['User Note', '用户备注'], ['Output Length', '回复长度'], ['Memories', '记忆'],
  ['Keyboard Shortcuts', '快捷键'], ['Situation Image', '情景图片'], ['Start Settings', '开始设置'], ['Character Preview', '角色预览'], ['Response model', '回复模型'],
  ['Session settings', '会话设置'], ['Send Message', '发送消息'], ['Add situation', '添加情景'], ['Open slash commands', '打开指令'], ['Suggested responses', '推荐回复'],
  ['Continue story', '继续故事'], ['Back to bottom', '回到底部'], ['Story categories', '故事分类'], ['Sort stories', '排序'], ['Sort collection', '排序'],
  ['Collapse sidebar', '收起侧栏'], ['Dismiss', '关闭'], ['Featured book covers', '推荐作品'], ['Language', '语言'], ['Story unavailable', '故事暂不可用'],
  ['Loading story…', '正在加载故事…'], ['Browse Community', '浏览社区'], ['Return home', '返回首页'], ['Page not found', '页面不存在'],
  ['Three Kingdoms', '三国'], ['Palace intrigue', '宫廷权谋'],
  ['Cute', '可爱'], ['Slow Burn', '慢热'], ['Tsundere', '傲娇'], ['Yandere', '病娇'], ['Isekai', '异世界'], ['Magic', '魔法'], ['Simulation', '模拟'],
  ['Academy', '学院'], ['Heroes', '英雄'], ['Superpowers', '超能力'], ['Villains', '反派'],
  ['Romance of the Three Kingdoms', '三国演义'], ['Ink edition', '水墨版'], ['Illustrated edition', '插画版'], ['Classic (3 chapters)', '经典三章'],
  ['The Strategist (8 chapters)', '谋士八章'], ['Progress saves automatically', '进度自动保存'], ['‹ Back', '‹ 返回'],
];
// StoryDate's own catalog: titles and blurbs come in both languages.
const OWN = [
  ...[...storydateOriginals, ...storydateCharacters].flatMap(d => [[d.title, d.title_zh], [d.description, d.description_zh]]),
  ['Three Kingdoms: The Strategist', threeKingdoms.title], ['Three Kingdoms: The Strategist (Ink Edition)', threeKingdomsInk.title],
  ['8-chapter journey · Illustrated', threeKingdoms.plays], ['8-chapter journey · Ink', threeKingdomsInk.plays],
  ['Become Ziheng, a young strategist from Yingchuan, and travel from Xuchang to Huarong. Win over Liu Bei, Cao Cao, Guan Yu, Zhuge Liang and Wen Zhi; your words become promises, and early choices echo across eight chapters.', threeKingdoms.description],
  ['The same story in ink-wash painting. Progress is shared with the illustrated edition.', threeKingdomsInk.description],
  ...announcements.items.flatMap(a => [[a.title, a.title_zh], [a.body, a.body_zh]]),
].filter(([en, zh]) => en && zh);
const PATTERNS = [
  [/^(\d+) stories$/, '$1 个故事', /^(\d+) 个故事$/, '$1 stories'], [/^(\d+) characters$/, '$1 个角色', /^(\d+) 个角色$/, '$1 characters'],
  [/^(\d+) Images$/, '$1 张图片', /^(\d+) 张图片$/, '$1 Images'], [/^Reply (\d+)$/, '回复 $1', /^回复 (\d+)$/, 'Reply $1'],
];
const TAG_WORDS = new Map(UI.map(([en, zh]) => [en.replace(/\s+/g, '').toLowerCase(), zh]));

const toZh = new Map(), toEn = new Map();
for (const [en, zh, ...alt] of [...UI, ...OWN]) {
  if (!toZh.has(en)) toZh.set(en, zh);
  for (const a of alt) toZh.set(a, zh);
  if (!toEn.has(zh)) toEn.set(zh, en);
  for (const a of alt) toEn.set(a, en); // a captured spelling we never want to show, even in English
}
export function translate(text, lang) {
  const key = text.trim(); if (!key) return text;
  let out = (lang === 'zh' ? toZh : toEn).get(key);
  if (out === undefined) for (const [re, zh, reZh, en] of PATTERNS) {
    if (lang === 'zh' && re.test(key)) { out = key.replace(re, zh); break; }
    if (lang === 'en' && reZh.test(key)) { out = key.replace(reZh, en); break; }
  }
  if (out === undefined && /^#\S+$/.test(key)) {
    const word = key.slice(1), zh = TAG_WORDS.get(word.toLowerCase()), en = UI.find(([, z]) => z === word)?.[0];
    if (lang === 'zh' && zh) out = '#' + zh; else if (lang === 'en' && en) out = '#' + en.replace(/\s+/g, '');
  }
  return out === undefined ? text : text.replace(key, out);
}

const SKIP = 'script,style,svg,iframe,textarea,input,[contenteditable],[data-sd-hero],[data-no-i18n],#session-messages';
const ATTRS = ['placeholder', 'aria-label', 'title'];
function apply(root, lang) {
  if (!root) return;
  if (root.nodeType === 3) { const p = root.parentElement; if (p && !p.closest(SKIP)) { const v = translate(root.nodeValue, lang); if (v !== root.nodeValue) root.nodeValue = v; } return; }
  if (root.nodeType !== 1 || root.closest?.(SKIP)) return;
  const doc = root.ownerDocument || document, walk = doc.createTreeWalker(root, 4);
  let n; const texts = []; while ((n = walk.nextNode())) texts.push(n);
  for (const t of texts) { const p = t.parentElement; if (!p || p.closest(SKIP)) continue; const v = translate(t.nodeValue, lang); if (v !== t.nodeValue) t.nodeValue = v; }
  for (const el of [root, ...root.querySelectorAll('[placeholder],[aria-label],[title]')]) {
    if (el.closest(SKIP) && !el.matches('input,textarea')) continue;
    for (const a of ATTRS) { const v = el.getAttribute?.(a); if (v) { const t = translate(v, lang); if (t !== v) el.setAttribute(a, t); } }
  }
}

function toggleMarkup(lang, cls) {
  return `<div class="sd-lang ${cls}" role="group" aria-label="${lang === 'zh' ? '语言' : 'Language'}" data-no-i18n>${LANGS.map(l => `<button type="button" data-sd-lang="${l}" aria-pressed="${l === lang}">${l === 'zh' ? '中文' : 'EN'}</button>`).join('')}</div>`;
}
const CSS = `.sd-lang{display:inline-flex;border:1px solid #3a3a3a;border-radius:999px;overflow:hidden;flex:none}
.sd-lang button{border:0;background:none;color:#8c8c8c;font:500 12px/1 Inter,"PingFang SC",system-ui,sans-serif;padding:8px 10px;min-height:32px;cursor:pointer}
.sd-lang button[aria-pressed=true]{background:#303030;color:#fafafa}
.sd-lang button:focus-visible{outline:2px solid #c5a46c;outline-offset:-3px}
.sd-language-slot{flex-shrink:0;align-self:stretch;padding:8px 16px 16px}
.sd-language-setting{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%}
.sd-language-label{display:inline-flex;align-items:center;gap:8px;color:#858585;font:12px/1.4 Inter,"PingFang SC",system-ui,sans-serif}
.sd-language-label svg{width:16px;height:16px;flex:none}
.sd-lang-side,.sd-lang-top,.sd-lang-legacy{margin:0;flex:none;width:max-content;border-color:#ffffff1a;border-radius:7px}
.sd-lang-top{margin-left:0}.sd-lang-top button{padding:8px;min-height:32px}
.signin .sd-lang-legacy{justify-self:center;margin-bottom:6px}
[data-shrink=true] .sd-language-slot{padding:8px 5px 16px}
[data-shrink=true] .sd-language-label{display:none}
[data-shrink=true] .sd-language-setting{justify-content:center}
[data-shrink=true] .sd-lang-side{flex-direction:column;width:34px}
[data-shrink=true] .sd-lang-side button{padding:8px 2px;font-size:10px;min-height:28px}`;

// Language is a persistent utility above the account area, and at the far right of the phone header.
function placeToggles(doc, lang) {
  const side = doc.querySelector('[data-shrink]');
  const desktop=side?.children[1],bottom=desktop?.lastElementChild;
  if(bottom&&!desktop.querySelector('.sd-language-slot')){
    const slot=doc.createElement('div');slot.className='sd-language-slot';slot.setAttribute('data-no-i18n','');
    slot.innerHTML=`<div class="sd-language-setting"><span class="sd-language-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18M12 3c-5 5-5 13 0 18"/></svg><span data-language-label></span></span>${toggleMarkup(lang,'sd-lang-side')}</div>`;
    bottom.before(slot);
  }
  const languageLabel=desktop?.querySelector('[data-language-label]'),label=lang==='zh'?'语言':'Language';
  if(languageLabel&&languageLabel.textContent!==label)languageLabel.textContent=label;
  const search = [...doc.querySelectorAll('a[href="/search"]')].find(a => a.closest('[class*="tl:hidden"]'));
  if (search && !search.parentElement.querySelector('.sd-lang-top')) search.insertAdjacentHTML('afterend', toggleMarkup(lang, 'sd-lang-top'));
  const aside = doc.querySelector('body > aside .signin');
  if (aside && !aside.querySelector('.sd-lang')) aside.insertAdjacentHTML('afterbegin', toggleMarkup(lang, 'sd-lang-legacy'));
  doc.querySelectorAll('.sd-lang').forEach(group=>{if(group.getAttribute('aria-label')!==label)group.setAttribute('aria-label',label);});
  doc.querySelectorAll('[data-sd-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sdLang === lang)));
}

let current, observer;
export function setLang(lang, {win = globalThis, doc = win.document} = {}) {
  if (!LANGS.includes(lang)) return;
  try { win.localStorage?.setItem('sd.lang', lang); } catch {}
  current = lang; doc.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  apply(doc.body, lang); placeToggles(doc, lang);
  win.dispatchEvent?.(new win.CustomEvent('sd-lang', {detail: lang}));
}
export function currentLang() { return current || getLang(); }

export function startI18n({win = globalThis, doc = win.document} = {}) {
  if (observer) return;
  current = getLang(win);
  const st = doc.createElement('style'); st.textContent = CSS; doc.head.append(st);
  doc.documentElement.lang = current === 'zh' ? 'zh-CN' : 'en';
  let pending = new Set(), queued = false;
  const flush = () => { queued = false; const nodes = [...pending]; pending = new Set(); for (const n of nodes) if (n.isConnected) apply(n, current); placeToggles(doc, current); };
  if (!win.MutationObserver) { observer = true; apply(doc.body, current); placeToggles(doc, current); return; }
  observer = new win.MutationObserver(list => {
    for (const m of list) { if (m.type === 'childList') m.addedNodes.forEach(n => pending.add(n)); else if (m.target.nodeType === 1) pending.add(m.target); }
    if (!queued) { queued = true; win.queueMicrotask(flush); }
  });
  observer.observe(doc.body, {childList: true, subtree: true, attributes: true, attributeFilter: ATTRS});
  doc.addEventListener('click', e => { const b = e.target.closest?.('[data-sd-lang]'); if (b) { e.preventDefault(); setLang(b.dataset.sdLang, {win, doc}); } });
  apply(doc.body, current); placeToggles(doc, current);
}
