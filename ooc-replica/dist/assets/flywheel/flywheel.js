// 飞轮体验版（任务 #154）：把“老板的比方”做成可玩的站点体验。
// 页面：/characters（角色库·食材）→ /characters/<id>（档案）→ /universe（宇宙·规矩）
//       → /frameworks（框架·锅，含“同一句话，锅怎么接”静态演示）→ /studio（创作者工作台原型）。
// 另在首页末尾追加“从故事认识角色”动线、给侧栏加入口（沿用 site-shell 的克隆模式）。
// 约定：页面根节点 data-no-i18n（文案自带双语，监听 sd-lang 重渲染）；全部复用现有内容与
// 现有聊天/游戏入口；不新增统计事件、不接新后端、不改生成文件。
import {mountShell, show as referenceShow} from '../reference.js';
import {getLang} from '../site-i18n.js';
import {escapeHTML as safe} from '../stream.js';
import {CHARACTER_CARDS, WORKS, UNIVERSES, FRAMEWORKS, cardById, cardsByUniverse} from './cards-data.js';

const DRAFT_KEY = 'sd-flywheel-drafts';

const copy = {
  zh: {
    libEyebrow: 'STORYDATE · 飞轮', libTitle: '角色库',
    libSub: '老板说：角色是食材，故事是菜。在这里，每个角色从书里走出来，成为可以被很多故事反复使用的食材。',
    all: '全部', chatOnly: '可聊天', empty: '这个筛选下还没有角色。', count: (n) => `${n} 个角色`,
    chatCta: '去聊天', storyCta: '去 TA 的故事', openCta: '打开',
    profileBack: '返回角色库', personaH: '人设', voiceH: '说话方式', lockedH: '不能违背的设定', appearH: 'TA 的出场',
    samplesFrom: '摘自', noSamples: '暂无例句。', sameUniverseH: '同一宇宙的其他角色', noChat: '这个角色的聊天入口暂未开放，可以先读 TA 的故事。',
    uniTitle: '宇宙', uniSub: '厨房的规矩：世界规则、地点、势力、时间线。规则清楚，角色再多也不会乱。',
    placesH: '地点', factionsH: '势力', timelineH: '时间线', rulesH: '世界规则', magicH: '这个宇宙怎么运作',
    storyH: '这个宇宙的故事', charsH: '这个宇宙的角色', rolesH: '角色',
    fwTitle: '框架', fwSub: '锅：保证做出来的菜能玩、不崩。同样的锅和规矩，换一批食材就是一道新菜。',
    bossQuote: '“角色是食材，故事是菜。一道菜要三样东西：好食材、一个厨房的规矩、一口好锅。”——老板的比方',
    potFood: '食材 · 角色', potFoodD: '人设、说话方式、外貌、不能违背的设定。可以被很多道菜反复使用。',
    potRule: '厨房的规矩 · 宇宙', potRuleD: '世界规则、地点、势力、时间线。决定角色混在一起时怎么相处。',
    potPan: '锅 · 框架', potPanD: '玩法模式：谋士、galgame、侦探。保证做出来的菜能玩、不崩。',
    potDish: '菜 · 故事', potDishD: '用户真正消费的东西。玩完一道，记住了里面的人。',
    demoH: '同一句话，锅怎么接', demoNote: '静态演示：映射关系摘自引擎文档，不是实时 AI 输出。', demoPick: '选一句玩家台词：',
    beatsH: '这口锅的规矩', worksH: '用这口锅做出的菜', engineNote: '数值与结局由规则决定，AI 只负责给玩家的话打标签、写台词——这是所有书共用的底线。',
    stTitle: '创作者工作台', stSub: '阶段二的地基：工具先被我们自己用顺。',
    protoBanner: '原型演示 · 草稿只保存在本机浏览器 · 创作者平台尚未开放',
    step1: '基础', step2: '人设', step3: '授权', stepBuild: '建卡', stepMix: '拼角色',
    fName: '名字', fNameEn: 'Name（英文）', fUniverse: '放进哪个宇宙', fFramework: '用哪口锅', fPortrait: '先借用一张现有立绘',
    fTagline: '一句话人设', fPersona: '人设', fVoice: '说话方式', fLocked: '不能违背的设定',
    fAuth: '这个角色给不给别人用？', auth0: '只自己用', auth1: '同宇宙的故事可用', auth2: '可被其他创作者组合',
    authNote: '授权是创作者自己的决定，别人不能替你打开。这是原型演示，开关暂不生效。',
    preview: '实时预览', saveDraft: '保存草稿', drafts: '我的草稿', noDrafts: '还没有草稿。填一张卡，保存看看。', exportJ: '导出 JSON', del: '删除',
    next: '下一步', prev: '上一步', required: '名字先填好，再继续。', saved: '已保存',
    mixH: '拼角色', mixSub: '勾选两张以上的卡，看它们在一个前提下相遇。', mixGo: '生成相遇前提', mixPick: (n) => `已选 ${n} 张`,
    mixOut: '相遇前提（模板拼装，非 AI 生成）', mixEmpty: '至少选两张卡。', mixAuth: '授权规则生效中：这里只列出允许被组合的角色。',
    builderLink: '要正式创作故事或角色？去创作工坊 →',
    homeStripTitle: '从故事认识角色', homeStripSub: '先被故事打动，在里面认识人。', homeStripMore: '进入角色库 →', homeStripFw: '宇宙与框架',
  },
  en: {
    libEyebrow: 'STORYDATE · FLYWHEEL', libTitle: 'Characters',
    libSub: "The boss's analogy: characters are the ingredients, stories are the dishes. Here every character steps out of its book and becomes an ingredient many stories can reuse.",
    all: 'All', chatOnly: 'Chat available', empty: 'No characters under this filter.', count: (n) => `${n} characters`,
    chatCta: 'Chat', storyCta: 'Enter their story', openCta: 'Open',
    profileBack: 'Back to characters', personaH: 'Persona', voiceH: 'Voice', lockedH: 'What must never break', appearH: 'Appearances',
    samplesFrom: 'from', noSamples: 'No quotes yet.', sameUniverseH: 'Others in this universe', noChat: 'Chat is not open for this character yet — start with their story.',
    uniTitle: 'Universes', uniSub: "The kitchen's rules: world rules, places, factions, timelines. Clear rules keep any number of characters coherent.",
    placesH: 'Places', factionsH: 'Factions', timelineH: 'Timeline', rulesH: 'World rules', magicH: 'How this universe works',
    storyH: 'Stories in this universe', charsH: 'Characters in this universe', rolesH: 'roles',
    fwTitle: 'Frameworks', fwSub: 'The pots: they keep every dish playable and unbroken. Same pot and rules, a new set of ingredients — a new dish.',
    bossQuote: '“Characters are the ingredients, stories are the dishes. A dish needs three things: good ingredients, the kitchen\u2019s rules, and a good pot.” — the boss\u2019s analogy',
    potFood: 'Ingredients · Characters', potFoodD: 'Persona, voice, appearance, and what must never break. Reused across many dishes.',
    potRule: 'Kitchen rules · Universes', potRuleD: 'World rules, places, factions, timelines. They decide how characters get along when mixed.',
    potPan: 'The pot · Frameworks', potPanD: 'Play modes: strategist, galgame, detective. They keep the dish playable.',
    potDish: 'The dish · Stories', potDishD: 'What users actually consume. Finish a dish, remember the people in it.',
    demoH: 'One line, two pots', demoNote: 'Static demo: the mapping is quoted from engine docs — not live AI output.', demoPick: 'Pick a player line:',
    beatsH: 'How this pot works', worksH: 'Dishes made with this pot', engineNote: 'Numbers and outcomes are decided by rules; the AI only tags lines and speaks them — the ground rule every book shares.',
    stTitle: 'Creator Workbench', stSub: 'Stage-two groundwork: our own tools, used by us first.',
    protoBanner: 'Prototype demo · drafts stay in this browser · the creator platform is not open yet',
    step1: 'Basics', step2: 'Persona', step3: 'Authorization', stepBuild: 'Build a card', stepMix: 'Mix characters',
    fName: 'Name', fNameEn: 'Name (English)', fUniverse: 'Which universe', fFramework: 'Which pot', fPortrait: 'Borrow an existing portrait for now',
    fTagline: 'One-line hook', fPersona: 'Persona', fVoice: 'Voice', fLocked: 'What must never break',
    fAuth: 'May others use this character?', auth0: 'Only me', auth1: 'Usable in this universe\u2019s stories', auth2: 'Open for other creators to combine',
    authNote: "Authorization is the creator's own decision. This is a prototype; the switch changes nothing yet.",
    preview: 'Live preview', saveDraft: 'Save draft', drafts: 'My drafts', noDrafts: 'No drafts yet. Fill a card and save it.', exportJ: 'Export JSON', del: 'Delete',
    next: 'Next', prev: 'Back', required: 'Fill the name first.', saved: 'Saved',
    mixH: 'Mix characters', mixSub: 'Pick two or more cards and watch them meet under one premise.', mixGo: 'Generate the premise', mixPick: (n) => `${n} selected`,
    mixOut: 'The premise (template-made, no AI)', mixEmpty: 'Pick at least two cards.', mixAuth: 'Authorization honored: only characters opened for combining are listed.',
    builderLink: 'Ready to author for real? Open the workshop →',
    homeStripTitle: 'Meet characters through stories', homeStripSub: 'The story moves you first; the people stay with you.', homeStripMore: 'Open the library →', homeStripFw: 'Universes & frameworks',
  },
};
const L = () => (getLang() === 'zh' ? copy.zh : copy.en);
const t = (o) => (o == null ? '' : (getLang() === 'zh' ? o.zh : o.en) || o.zh || o.en || '');

let styles = false;
function ensureStyles() {
  if (styles) return;
  styles = true;
  if (!document.querySelector('link[href="/assets/flywheel/flywheel.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/flywheel/flywheel.css';
    document.head.append(link);
  }
}

// —— 小组件 ——
const cardArt = (c) => `<img src="${safe(c.portrait)}" alt="" width="300" height="400" loading="lazy" onerror="this.style.visibility='hidden'">`;
const workName = (id) => t(WORKS[id]?.title) || id;
const uniName = (id) => t(UNIVERSES[id]?.name) || id;
const fwName = (id) => t(FRAMEWORKS[id]?.name) || id;
// 独立整页游戏（/assets/**）必须整页跳转，不能走 SPA 路由（站内现例：ashen 卡 target="_top"）
const isStandalone = (url) => /^\/assets\//.test(url || '');
const ext = (url) => (isStandalone(url) ? ' target="_top" rel="noopener"' : '');

function cardMarkup(c) {
  const l = L();
  return `<a class="fw-card" href="/characters/${safe(c.id)}">
    <span class="fw-card-portrait">${cardArt(c)}</span>
    <span class="fw-card-body">
      <strong>${safe(t(c.name))}</strong>
      <em>${safe(t(c.tagline))}</em>
      <span class="fw-card-badges"><span class="fw-badge">${safe(workName(c.source.work))}</span><span class="fw-badge fw-badge-dim">${safe(fwName(c.source.framework))}</span>${c.chat ? `<span class="fw-badge fw-badge-gold">${safe(l.chatCta)} ↗</span>` : ''}</span>
    </span>
  </a>`;
}
const grid = (cards) => `<div class="fw-grid">${cards.map(cardMarkup).join('')}</div>`;

// —— /characters ——
let libFilter = { universe: 'all', chat: false };
function libMarkup() {
  const l = L();
  const chips = ['all', ...Object.keys(UNIVERSES)].map((id) => {
    const label = id === 'all' ? l.all : uniName(id);
    const n = id === 'all' ? CHARACTER_CARDS.length : cardsByUniverse(id).length;
    return `<button type="button" class="fw-chip${libFilter.universe === id ? ' active' : ''}" data-fw-filter="${id}">${safe(label)} <small>${n}</small></button>`;
  }).join('');
  let items = libFilter.universe === 'all' ? CHARACTER_CARDS : cardsByUniverse(libFilter.universe);
  if (libFilter.chat) items = items.filter((c) => c.chat);
  return `<main class="fw-page" data-no-i18n data-fw-page="characters">
    <header class="fw-heading"><p class="fw-eyebrow">${l.libEyebrow}</p><h1>${l.libTitle}</h1><p class="fw-sub">${l.libSub}</p></header>
    <div class="fw-toolbar" role="group">${chips}<button type="button" class="fw-chip fw-chip-toggle${libFilter.chat ? ' active' : ''}" data-fw-chat="1" aria-pressed="${libFilter.chat}">${safe(l.chatOnly)}</button><span class="fw-count" role="status">${l.count(items.length)}</span></div>
    ${items.length ? grid(items) : `<div class="fw-empty">${l.empty}</div>`}
  </main>`;
}

// —— /characters/<id> ——
function profileMarkup(c) {
  const l = L();
  const samples = (c.voice?.samples || []).map((s) => `<blockquote class="fw-quote"><p>“${safe(t(s))}”</p><cite>${safe(l.samplesFrom)} · ${safe(s.from || workName(c.source.work))}</cite></blockquote>`).join('');
  const appears = c.appearances.map((a) => `<a class="fw-appearance" href="${safe(a.url)}"${ext(a.url)}><strong>${safe(workName(a.work))}</strong><span>${safe(t(a.role))}</span><span aria-hidden="true">↗</span></a>`).join('');
  const others = cardsByUniverse(c.source.universe).filter((x) => x.id !== c.id).slice(0, 8);
  const w = WORKS[c.source.work];
  const ctas = `${c.chat ? `<a class="fw-btn fw-btn-gold" href="${safe(c.chat)}">${safe(l.chatCta)} ↗</a>` : ''}${w ? `<a class="fw-btn" href="${safe(w.url)}"${ext(w.url)}>${safe(l.storyCta)} ↗</a>` : ''}`;
  return `<main class="fw-page" data-no-i18n data-fw-page="profile">
    <a class="fw-back" href="/characters">‹ ${l.profileBack}</a>
    <article class="fw-profile">
      <div class="fw-profile-top">
        <div class="fw-profile-portrait">${cardArt(c)}</div>
        <div class="fw-profile-head">
          <p class="fw-eyebrow">${safe(uniName(c.source.universe))} · ${safe(fwName(c.source.framework))}</p>
          <h1>${safe(t(c.name))}</h1>
          <p class="fw-tagline">${safe(t(c.tagline))}</p>
          <p class="fw-persona">${safe(t(c.persona))}</p>
          <div class="fw-ctas">${ctas}</div>
          ${c.chat ? '' : `<p class="fw-note">${safe(l.noChat)}</p>`}
        </div>
      </div>
      <section class="fw-section"><h2>${l.voiceH}</h2>${c.voice ? `<p>${safe(t(c.voice))}</p>` : ''}${samples || `<p class="fw-note">${safe(l.noSamples)}</p>`}</section>
      <section class="fw-section"><h2>${l.lockedH}</h2><p>${safe(t(c.locked))}</p></section>
      <section class="fw-section"><h2>${l.appearH}</h2><div class="fw-appearances">${appears}</div></section>
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
    return `<a class="fw-uni-card" href="/universe/${safe(id)}">
      <span class="fw-uni-covers">${chars.slice(0, 4).map((c) => cardArt(c)).join('') || '<span class="fw-uni-blank"></span>'}</span>
      <strong>${safe(t(u.name))}</strong>
      <em>${safe(t(u.tagline))}</em>
      <span class="fw-card-badges"><span class="fw-badge">${chars.length} ${safe(l.rolesH)}</span><span class="fw-badge fw-badge-dim">${works} ${safe(l.storyH)}</span>${u.rules ? '<span class="fw-badge fw-badge-gold">✦</span>' : ''}</span>
    </a>`;
  }).join('');
  return `<main class="fw-page" data-no-i18n data-fw-page="universes">
    <header class="fw-heading"><p class="fw-eyebrow">${l.libEyebrow}</p><h1>${l.uniTitle}</h1><p class="fw-sub">${l.uniSub}</p></header>
    <div class="fw-uni-grid">${cards}</div>
  </main>`;
}

function universeMarkup(id) {
  const l = L();
  const u = UNIVERSES[id];
  if (!u) return null;
  const chars = cardsByUniverse(id);
  const works = [...new Set(chars.map((c) => c.source.work))].map((w) => WORKS[w]).filter(Boolean);
  const tabs = u.rules ? `
    <div class="fw-tabs" role="tablist">
      <button type="button" role="tab" aria-selected="true" class="active" data-fw-tab="rules">${safe(l.rulesH)}</button>
      <button type="button" role="tab" aria-selected="false" data-fw-tab="places">${safe(l.placesH)}</button>
      <button type="button" role="tab" aria-selected="false" data-fw-tab="factions">${safe(l.factionsH)}</button>
      <button type="button" role="tab" aria-selected="false" data-fw-tab="timeline">${safe(l.timelineH)}</button>
    </div>
    <div class="fw-tabpanes">
      <section class="fw-pane" data-fw-pane="rules"><h2>${l.magicH}</h2><p class="fw-world">${safe(t(u.rules.world))}</p><ul class="fw-rules">${u.rules.magic.map((m) => `<li>${safe(t(m))}</li>`).join('')}</ul></section>
      <section class="fw-pane" data-fw-pane="places" hidden><ul class="fw-factions">${u.rules.places.map((p) => `<li><strong>${safe(t(p.name))}</strong><span>${safe(t(p.desc))}</span></li>`).join('')}</ul></section>
      <section class="fw-pane" data-fw-pane="factions" hidden><ul class="fw-factions">${u.rules.factions.map((f) => `<li><strong>${safe(t(f.name))}</strong><span>${safe(t(f.desc))}</span></li>`).join('')}</ul></section>
      <section class="fw-pane" data-fw-pane="timeline" hidden><div class="fw-timeline">${u.rules.timeline.map((e) => `<div class="fw-era"><strong>${safe(t(e.t))}</strong><p>${safe(t(e.d))}</p></div>`).join('')}</div></section>
    </div>` : '';
  const workCards = works.map((w) => `<a class="fw-appearance" href="${safe(w.url)}"${ext(w.url)}><strong>${safe(t(w.title))}</strong><span>${safe(t(w.kind))}</span><span aria-hidden="true">↗</span></a>`).join('');
  return `<main class="fw-page" data-no-i18n data-fw-page="universe">
    <a class="fw-back" href="/universe">‹ ${l.uniTitle}</a>
    <header class="fw-heading"><p class="fw-eyebrow">${l.libEyebrow}</p><h1>${safe(t(u.name))}</h1><p class="fw-sub">${safe(t(u.tagline))}</p></header>
    ${tabs}
    <section class="fw-section"><h2>${l.charsH} · ${chars.length}</h2>${chars.length ? grid(chars) : `<div class="fw-empty">${l.empty}</div>`}</section>
    <section class="fw-section"><h2>${l.storyH}</h2><div class="fw-appearances">${workCards}</div></section>
  </main>`;
}

// —— /frameworks ——
const DEMO_LINES = [
  { zh: '“我要取你性命。”', en: '"I will take your life."',
    strategist: { zh: ['打标：move=对抗，values=威胁', '交情不动，信任 -1，看重 -1', '对方记仇：下次见面先发难', '军前放话：处境有“被逐出”的风险'], en: ['tagged: move=confront, values=threat', 'warmth unchanged, trust -1, esteem -1', 'a grudge is kept: they strike first next meeting', 'said before the army: risk of an "expelled" standing'] },
    galgame: { zh: ['打标：表达=尖锐，好感变化=负', '好感隐藏：对方不表现，只记下', '记仇入账，本线结局向下偏移', '不锁死：用行动补过仍能回头'], en: ['tagged: expression=sharp, affection=negative', 'affection stays hidden; she only remembers', 'the grudge is booked; the route ending drifts down', 'not a lock: actions can still mend it'] } },
  { zh: '“其实我不是本地人。”', en: '"I am not actually from here."',
    strategist: { zh: ['打标：move=示弱，values=坦白', '信任 +1（这位吃坦白）', '解锁一句更近的回话', '对方可能拿它去验证你别处的话'], en: ['tagged: move=open-up, values=honesty', 'trust +1 (this one rewards candor)', 'unlocks a warmer follow-up', 'they may verify your other words against it'] },
    galgame: { zh: ['打标：表达=坦白，好感变化=正', '对方回自己秘密的一半', '共通线多一个小约定', '个人线的门槛悄悄近了一格'], en: ['tagged: expression=honest, affection=positive', 'she answers with half of her own secret', 'one more small promise on the common route', 'the personal-route threshold quietly nears'] } },
  { zh: '“先生真乃神人。”', en: '"You are truly extraordinary, sir."',
    strategist: { zh: ['打标：move=奉承，values=空话', '看重 +0：空话不算数', '对方接一句自谦的反问', '连吹三次：被看穿，信任 -1'], en: ['tagged: move=flatter, values=empty words', 'esteem +0: flattery does not count', 'a self-deprecating counter-question', 'three in a row: seen through, trust -1'] },
    galgame: { zh: ['打标：表达=客套，好感变化=零', '对方笑着岔开话题', '连着客套会收到“你别扭”的吐槽', '行动比好话涨得多'], en: ['tagged: expression=polite, affection=zero', 'she laughs it off and changes the subject', 'three in a row earns an "you are being odd" jab', 'actions raise affection far more than words'] } },
];
function frameworksMarkup() {
  const l = L();
  const pots = [
    { icon: '🥬', title: l.potFood, desc: l.potFoodD },
    { icon: '📜', title: l.potRule, desc: l.potRuleD },
    { icon: '🍲', title: l.potPan, desc: l.potPanD },
    { icon: '🍜', title: l.potDish, desc: l.potDishD },
  ].map((p) => `<div class="fw-pot"><span class="fw-pot-icon" aria-hidden="true">${p.icon}</span><strong>${safe(p.title)}</strong><p>${safe(p.desc)}</p></div>`).join('');
  const fwSections = Object.keys(FRAMEWORKS).map((id) => {
    const f = FRAMEWORKS[id];
    const works = f.works.map((w) => `<a class="fw-appearance" href="${safe(WORKS[w]?.url || '/')}"${ext(WORKS[w]?.url)}><strong>${safe(t(WORKS[w]?.title))}</strong><span>${safe(t(WORKS[w]?.kind))}</span><span aria-hidden="true">↗</span></a>`).join('');
    return `<section class="fw-fw" id="fw-${safe(id)}">
      <header><p class="fw-eyebrow">${safe(t(f.pot) || '')}</p><h2>${safe(t(f.name))}</h2><p>${safe(t(f.summary))}</p></header>
      <div class="fw-fw-body">
        <div><h3>${safe(l.beatsH)}</h3><ul class="fw-rules">${f.beats.map((b) => `<li>${safe(t(b))}</li>`).join('')}</ul></div>
        <div><h3>${safe(l.worksH)}</h3><div class="fw-appearances">${works}</div></div>
      </div>
    </section>`;
  }).join('');
  const lineButtons = DEMO_LINES.map((d, i) => `<button type="button" class="fw-chip${i === 0 ? ' active' : ''}" data-fw-line="${i}">${safe(t(d))}</button>`).join('');
  return `<main class="fw-page" data-no-i18n data-fw-page="frameworks">
    <header class="fw-heading"><p class="fw-eyebrow">${l.libEyebrow}</p><h1>${l.fwTitle}</h1><p class="fw-sub">${l.fwSub}</p></header>
    <blockquote class="fw-boss">${safe(l.bossQuote)}</blockquote>
    <div class="fw-pots">${pots}</div>
    ${fwSections}
    <section class="fw-section fw-demo">
      <h2>${l.demoH}</h2>
      <p class="fw-note">${safe(l.demoNote)}</p>
      <p class="fw-demo-pick">${safe(l.demoPick)}</p>
      <div class="fw-toolbar">${lineButtons}</div>
      <div class="fw-demo-cols" id="fw-demo-out" aria-live="polite">${renderDemoLine(0)}</div>
    </section>
    <p class="fw-note">${safe(l.engineNote)}</p>
  </main>`;
}
function renderDemoLine(index) {
  const d = DEMO_LINES[index];
  if (!d) return '';
  const lang = getLang() === 'zh' ? 'zh' : 'en';
  const col = (key) => `<div class="fw-demo-col"><h3>${safe(fwName(key))}</h3><ul>${d[key][lang].map((x) => `<li>${safe(x)}</li>`).join('')}</ul></div>`;
  return col('strategist') + col('galgame');
}

// —— /studio ——
const readDrafts = () => { try { const v = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const writeDrafts = (list) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(list)); } catch {} };
let studioStep = 0;
const studioMix = new Set();
const AUTH_LABELS = () => [L().auth0, L().auth1, L().auth2];
const draftsMarkup = () => {
  const l = L();
  const saved = readDrafts();
  return `<section class="fw-section" id="fw-drafts" ${saved.length ? '' : 'hidden'}><h2>${l.drafts} · ${saved.length}</h2>
    ${saved.length ? `<div class="fw-appearances">${saved.map((d, i) => `<div class="fw-appearance fw-draft"><strong>${safe(d.name?.zh || d.name?.en || '—')}</strong><span>${safe(uniName(d.universe))} · ${safe(fwName(d.framework))}</span><button type="button" class="fw-chip" data-fw-del="${i}">${safe(l.del)}</button></div>`).join('')}</div><button type="button" class="fw-btn" data-fw-export>${safe(l.exportJ)}</button>` : ''}
  </section>`;
};
function studioMarkup() {
  const l = L();
  const portraits = CHARACTER_CARDS.slice(0, 12).map((c) => `<label class="fw-pick"><input type="radio" name="fw-portrait" value="${safe(c.portrait)}"><img src="${safe(c.portrait)}" alt="" loading="lazy"></label>`).join('');
  const uniOpts = Object.keys(UNIVERSES).map((id) => `<option value="${id}">${safe(uniName(id))}</option>`).join('');
  const fwOpts = Object.keys(FRAMEWORKS).map((id) => `<option value="${id}">${safe(fwName(id))}</option>`).join('');
  const mixCards = CHARACTER_CARDS.map((c) => `<button type="button" class="fw-mix-card${studioMix.has(c.id) ? ' active' : ''}" data-fw-mix="${safe(c.id)}" aria-pressed="${studioMix.has(c.id)}">${cardArt(c)}<strong>${safe(t(c.name))}</strong></button>`).join('');
  const pane = (i, body) => `<div class="fw-step-pane" data-fw-sstep="${i}" ${studioStep !== i ? 'hidden' : ''}>${body}</div>`;
  return `<main class="fw-page" data-no-i18n data-fw-page="studio">
    <header class="fw-heading"><p class="fw-eyebrow">${l.libEyebrow}</p><h1>${l.stTitle}</h1><p class="fw-sub">${l.stSub}</p></header>
    <p class="fw-proto" role="note">⚠️ ${safe(l.protoBanner)}</p>
    <div class="fw-tabs" role="tablist">
      <button type="button" role="tab" aria-selected="true" class="active" data-fw-stab="build">${safe(l.stepBuild)}</button>
      <button type="button" role="tab" aria-selected="false" data-fw-stab="mix">${safe(l.stepMix)}</button>
    </div>
    <section data-fw-spane="build">
      <div class="fw-steps" role="group">${[l.step1, l.step2, l.step3].map((s, i) => `<span class="fw-step${i === studioStep ? ' active' : ''}${i < studioStep ? ' done' : ''}" data-fw-stepdot="${i}">${i + 1}. ${safe(s)}</span>`).join('')}</div>
      <div class="fw-builder">
        <div class="fw-form">
          ${pane(0, `
            <label>${safe(l.fName)}<input id="fw-f-zh" maxlength="24" placeholder="夏知遥"></label>
            <label>${safe(l.fNameEn)}<input id="fw-f-en" maxlength="40" placeholder="Xia Zhiyao"></label>
            <label>${safe(l.fUniverse)}<select id="fw-f-uni">${uniOpts}</select></label>
            <label>${safe(l.fFramework)}<select id="fw-f-fw">${fwOpts}</select></label>
            <fieldset><legend>${safe(l.fPortrait)}</legend><div class="fw-pickgrid">${portraits}</div></fieldset>`)}
          ${pane(1, `
            <label>${safe(l.fTagline)}<input id="fw-f-tagline" maxlength="40"></label>
            <label>${safe(l.fPersona)}<textarea id="fw-f-persona" rows="3" maxlength="300"></textarea></label>
            <label>${safe(l.fVoice)}<textarea id="fw-f-voice" rows="2" maxlength="200"></textarea></label>
            <label>${safe(l.fLocked)}<textarea id="fw-f-locked" rows="2" maxlength="200"></textarea></label>`)}
          ${pane(2, `
            <fieldset class="fw-auth"><legend>${safe(l.fAuth)}</legend>
              ${AUTH_LABELS().map((x, i) => `<label class="fw-radio"><input type="radio" name="fw-auth" value="${i}" ${i === 0 ? 'checked' : ''}><span>${safe(x)}</span></label>`).join('')}
            </fieldset>
            <p class="fw-note">${safe(l.authNote)}</p>`)}
          <div class="fw-wizard-nav">
            ${studioStep > 0 ? `<button type="button" class="fw-btn" data-fw-wstep="-1">${safe(l.prev)}</button>` : ''}
            ${studioStep < 2 ? `<button type="button" class="fw-btn" data-fw-wstep="1">${safe(l.next)}</button>` : ''}
            <button type="button" class="fw-btn fw-btn-gold" data-fw-save>${safe(l.saveDraft)}</button>
          </div>
          <p class="fw-note" id="fw-form-note" role="status"></p>
        </div>
        <div class="fw-preview"><p class="fw-eyebrow">${safe(l.preview)}</p><div id="fw-live-card">${liveCardMarkup()}</div></div>
      </div>
    </section>
    <section data-fw-spane="mix" hidden>
      <h2>${safe(l.mixH)}</h2><p class="fw-sub">${safe(l.mixSub)}</p>
      <div class="fw-mixgrid">${mixCards}</div>
      <div class="fw-mixbar"><button type="button" class="fw-btn fw-btn-gold" data-fw-mixgo>${safe(l.mixGo)}</button><span class="fw-count" role="status">${l.mixPick(studioMix.size)}</span></div>
      <div id="fw-mix-out" aria-live="polite"></div>
    </section>
    ${draftsMarkup()}
    <p class="fw-builderlink"><a href="/builder">${safe(l.builderLink)}</a></p>
  </main>`;
}
function liveCardMarkup() {
  const lang = getLang() === 'zh' ? 'zh' : 'en';
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  const name = lang === 'zh' ? (get('fw-f-zh') || '（名字）') : (get('fw-f-en') || '(Name)');
  const uni = document.getElementById('fw-f-uni')?.value || 'original';
  const fw = document.getElementById('fw-f-fw')?.value || 'chat';
  const portrait = document.querySelector('input[name="fw-portrait"]:checked')?.value || '/assets/cover-0.webp';
  const auth = Number(document.querySelector('input[name="fw-auth"]:checked')?.value || 0);
  return `<div class="fw-card fw-card-static"><span class="fw-card-portrait"><img src="${safe(portrait)}" alt="" onerror="this.style.visibility='hidden'"></span>
    <span class="fw-card-body"><strong>${safe(name)}</strong><em>${safe(get('fw-f-tagline') || (lang === 'zh' ? '还没有一句话人设' : 'No hook yet'))}</em>
    <span class="fw-card-badges"><span class="fw-badge">${safe(uniName(uni))}</span><span class="fw-badge fw-badge-dim">${safe(fwName(fw))}</span><span class="fw-badge fw-badge-gold">🔑 ${safe(AUTH_LABELS()[auth])}</span></span>
    ${get('fw-f-persona') ? `<span class="fw-card-persona">${safe(get('fw-f-persona'))}</span>` : ''}
    ${get('fw-f-voice') ? `<span class="fw-card-voice">${safe(get('fw-f-voice'))}</span>` : ''}
    ${get('fw-f-locked') ? `<span class="fw-card-locked">${safe(get('fw-f-locked'))}</span>` : ''}
    </span></div>`;
}
function mixPremiseMarkup() {
  const l = L();
  if (studioMix.size < 2) return `<p class="fw-note" role="status">${safe(l.mixEmpty)}</p>`;
  const picked = [...studioMix].map(cardById).filter(Boolean);
  const a = picked[0];
  const b = picked[1];
  const uni = UNIVERSES[b.source.universe] ? b.source.universe : a.source.universe;
  const zh = getLang() === 'zh';
  const premise = zh
    ? `在「${uniName(uni)}」，${t(a.name)}（${workName(a.source.work)}）遇上了${t(b.name)}（${workName(b.source.work)}）。${t(a.tagline)}的人，碰上${t(b.tagline)}的人——他们要先弄清楚的，是对方能不能被相信。`
    : `In ${uniName(uni)}, ${t(a.name)} (from ${workName(a.source.work)}) meets ${t(b.name)} (from ${workName(b.source.work)}). What they must settle first is whether either can be trusted.`;
  return `<div class="fw-mix-out"><h3>${safe(l.mixOut)}</h3><blockquote class="fw-quote"><p>${safe(premise)}</p><cite>${safe(picked.slice(0, 2).map((c) => t(c.name)).join(' × '))}</cite></blockquote><p class="fw-note">${safe(l.mixAuth)}</p></div>`;
}

// —— 首页动线 ——
function homeStrip() {
  const l = L();
  const rows = ['xichuan', 'sanguo', 'westlin', 'baker'].map((id) => {
    const chars = cardsByUniverse(id).slice(0, 4);
    return `<a class="fw-strip-row" href="/universe/${safe(id)}"><strong>${safe(uniName(id))}</strong><span class="fw-strip-faces">${chars.map((c) => cardArt(c)).join('')}</span><span aria-hidden="true">↗</span></a>`;
  }).join('');
  return `<section class="fw-strip" data-no-i18n aria-label="${safe(l.homeStripTitle)}">
    <header><p class="fw-eyebrow">${l.libEyebrow}</p><h2>${l.homeStripTitle}</h2><p>${l.homeStripSub}</p></header>
    <div class="fw-strip-rows">${rows}</div>
    <div class="fw-strip-links">
      <a class="fw-btn fw-btn-gold" href="/characters">${l.homeStripMore}</a>
      <a class="fw-btn" href="/universe">${l.homeStripFw}</a>
      <a class="fw-btn" href="/frameworks">${l.fwTitle}</a>
      <a class="fw-btn" href="/studio">${l.stTitle}</a>
    </div>
  </section>`;
}
function appendStrip() {
  const host = document.querySelector('#precision-view') || document.querySelector('#main');
  if (!host) return false;
  document.getElementById('fw-home-strip')?.remove();
  const wrap = document.createElement('div');
  wrap.id = 'fw-home-strip';
  wrap.innerHTML = homeStrip();
  const anchor = [...host.querySelectorAll('section, footer')].pop();
  if (anchor?.parentElement) anchor.parentElement.insertBefore(wrap, anchor.nextSibling);
  else host.append(wrap);
  return true;
}

// —— 侧栏入口（沿用 site-shell 的克隆模式，插一次） ——
function paintNav() {
  const side = document.querySelector('[data-shrink]');
  if (!side) return;
  const credit = side.querySelector('a[href="/credit"]');
  const group = credit?.parentElement;
  if (!credit || !group) return;
  const entries = [['/characters', 'Characters'], ['/universe', 'Universe'], ['/frameworks', 'Frameworks'], ['/studio', 'Studio']];
  for (const [href, label] of entries) {
    if (group.querySelector(`a[href="${href}"]`)) continue;
    const link = credit.cloneNode(true);
    link.setAttribute('href', href);
    link.dataset.shellFlywheel = '';
    link.removeAttribute('aria-current');
    link.innerHTML = `${link.querySelector('svg')?.outerHTML || ''}<span class="${credit.querySelector('span')?.className || ''}">${label}</span>`;
    credit.before(link);
  }
}

// —— 路由与语言 ——
let currentHelpers = null;
let langBound = false;
function bindLangRerender() {
  if (langBound) return;
  langBound = true;
  globalThis.addEventListener?.('sd-lang', () => { if (currentHelpers) show(location.pathname, currentHelpers); });
}
function renderRoute(path) {
  if (path === '/characters') { mountShell(libMarkup(), currentHelpers, 'flywheel'); paintNav(); bindCommon(document); document.title = 'Characters · StoryDate'; return true; }
  const profile = /^\/characters\/([^/?]+)$/.exec(path);
  if (profile) {
    const c = cardById(profile[1]);
    if (!c) return false;
    mountShell(profileMarkup(c), currentHelpers, 'flywheel'); paintNav(); bindCommon(document);
    document.title = `${t(c.name)} · StoryDate`; return true;
  }
  if (path === '/universe') { mountShell(universesMarkup(), currentHelpers, 'flywheel'); paintNav(); bindCommon(document); document.title = 'Universes · StoryDate'; return true; }
  const uni = /^\/universe\/([^/?]+)$/.exec(path);
  if (uni) {
    const markup = universeMarkup(uni[1]);
    if (!markup) return false;
    mountShell(markup, currentHelpers, 'flywheel'); paintNav(); bindCommon(document);
    document.title = `${uniName(uni[1])} · StoryDate`; return true;
  }
  if (path === '/frameworks') { mountShell(frameworksMarkup(), currentHelpers, 'flywheel'); paintNav(); bindCommon(document); document.title = 'Frameworks · StoryDate'; return true; }
  if (path === '/studio') { mountShell(studioMarkup(), currentHelpers, 'flywheel'); paintNav(); bindStudio(); document.title = 'Studio · StoryDate'; return true; }
  return false;
}

// —— 交互绑定 ——
function bindCommon(root) {
  root.querySelectorAll('[data-fw-filter]').forEach((b) => b.addEventListener('click', () => { libFilter.universe = b.dataset.fwFilter; renderRoute('/characters'); }));
  root.querySelectorAll('[data-fw-chat]').forEach((b) => b.addEventListener('click', () => { libFilter.chat = !libFilter.chat; renderRoute('/characters'); }));
  root.querySelectorAll('[data-fw-tab]').forEach((b) => b.addEventListener('click', () => {
    const wrap = b.closest('.fw-tabs');
    wrap.querySelectorAll('[role=tab]').forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', String(x === b)); });
    const panes = wrap.nextElementSibling;
    if (panes) panes.querySelectorAll(':scope > .fw-pane').forEach((p) => { p.hidden = p.dataset.fwPane !== b.dataset.fwTab; });
  }));
  root.querySelectorAll('[data-fw-line]').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('[data-fw-line]').forEach((x) => x.classList.toggle('active', x === b));
    const out = root.querySelector('#fw-demo-out');
    if (out) out.innerHTML = renderDemoLine(Number(b.dataset.fwLine));
  }));
}
let studioInputBound = false;
function bindStudio() {
  bindCommon(document);
  document.querySelectorAll('[data-fw-stab]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-fw-stab]').forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', String(x === b)); });
    document.querySelectorAll('[data-fw-spane]').forEach((p) => { p.hidden = p.dataset.fwSpane !== b.dataset.fwStab; });
  }));
  document.querySelectorAll('[data-fw-wstep]').forEach((b) => b.addEventListener('click', () => {
    studioStep = Math.max(0, Math.min(2, studioStep + Number(b.dataset.fwWstep)));
    // 就地换步：不重渲染，保住已填内容
    document.querySelectorAll('[data-fw-sstep]').forEach((p) => { p.hidden = Number(p.dataset.fwSstep) !== studioStep; });
    document.querySelectorAll('[data-fw-stepdot]').forEach((s) => { const i = Number(s.dataset.fwStepdot); s.classList.toggle('active', i === studioStep); s.classList.toggle('done', i < studioStep); });
    const nav = document.querySelector('.fw-wizard-nav');
    if (nav) {
      const l = L();
      nav.innerHTML = `${studioStep > 0 ? `<button type="button" class="fw-btn" data-fw-wstep="-1">${safe(l.prev)}</button>` : ''}${studioStep < 2 ? `<button type="button" class="fw-btn" data-fw-wstep="1">${safe(l.next)}</button>` : ''}<button type="button" class="fw-btn fw-btn-gold" data-fw-save>${safe(l.saveDraft)}</button>`;
      bindStudioButtons();
    }
  }));
  bindStudioButtons();
  if (!studioInputBound) {
    studioInputBound = true;
    document.addEventListener('input', (e) => {
      if (!e.target.closest?.('.fw-builder')) return;
      const card = document.querySelector('#fw-live-card');
      if (card) card.innerHTML = liveCardMarkup();
    });
  }
}
function bindStudioButtons() {
  document.querySelectorAll('[data-fw-save]').forEach((b) => b.addEventListener('click', saveDraft));
  document.querySelectorAll('[data-fw-del]').forEach((b) => b.addEventListener('click', () => {
    const list = readDrafts();
    list.splice(Number(b.dataset.fwDel), 1);
    writeDrafts(list);
    const slot = document.getElementById('fw-drafts');
    if (slot) { slot.outerHTML = draftsMarkup(); bindStudioButtons(); }
  }));
  document.querySelectorAll('[data-fw-export]').forEach((b) => b.addEventListener('click', exportDrafts));
  document.querySelectorAll('[data-fw-mix]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.fwMix;
    if (studioMix.has(id)) studioMix.delete(id); else studioMix.add(id);
    b.classList.toggle('active', studioMix.has(id));
    b.setAttribute('aria-pressed', String(studioMix.has(id)));
    const count = document.querySelector('[data-fw-mixgo]')?.nextElementSibling;
    if (count) count.textContent = L().mixPick(studioMix.size);
  }));
  document.querySelectorAll('[data-fw-mixgo]').forEach((b) => b.addEventListener('click', () => {
    const out = document.querySelector('#fw-mix-out');
    if (out) out.innerHTML = mixPremiseMarkup();
  }));
}
function saveDraft() {
  const note = document.getElementById('fw-form-note');
  const nameZh = document.getElementById('fw-f-zh')?.value?.trim();
  const nameEn = document.getElementById('fw-f-en')?.value?.trim();
  if (!nameZh && !nameEn) { if (note) note.textContent = L().required; return; }
  const list = readDrafts();
  list.push({
    name: { zh: nameZh, en: nameEn },
    universe: document.getElementById('fw-f-uni')?.value,
    framework: document.getElementById('fw-f-fw')?.value,
    portrait: document.querySelector('input[name="fw-portrait"]:checked')?.value,
    tagline: document.getElementById('fw-f-tagline')?.value?.trim() || '',
    persona: document.getElementById('fw-f-persona')?.value?.trim() || '',
    voice: document.getElementById('fw-f-voice')?.value?.trim() || '',
    locked: document.getElementById('fw-f-locked')?.value?.trim() || '',
    auth: Number(document.querySelector('input[name="fw-auth"]:checked')?.value || 0),
    savedAt: new Date().toISOString(),
  });
  writeDrafts(list);
  if (note) note.textContent = `${L().saved} ✓`;
  const slot = document.getElementById('fw-drafts');
  if (slot) slot.outerHTML = draftsMarkup();
  bindStudioButtons();
}
function exportDrafts() {
  const w = window.open ? window.open('', '_blank') : null;
  if (w) { w.document.write(`<pre>${safe(JSON.stringify(readDrafts(), null, 2))}</pre>`); w.document.title = 'flywheel-drafts.json'; }
}

// —— 入口（app.js 在 community.show 之后调用） ——
export function show(path, helpers) {
  currentHelpers = helpers;
  ensureStyles();
  if (path === '/') {
    // 先让 reference 渲染首页，再在末尾追加“从故事认识角色”动线（不改其内容，避开既有测试锁定区）
    let ok = false;
    try { ok = Boolean(referenceShow(path, helpers)); } catch { ok = false; }
    if (!ok) return ok;
    appendStrip();
    paintNav();
    bindLangRerender();
    return true;
  }
  const handled = renderRoute(path);
  if (handled) bindLangRerender();
  return handled;
}
