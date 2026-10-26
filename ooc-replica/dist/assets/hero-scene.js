// Story / Character first-screen banner: one scene, one question, at most three ways in.
// The home scene supports phones and desktop; character scenes replace the desktop carousel.
// The previous carousel stays available: add ?hero=classic to the URL, or set localStorage sd.hero = "classic".
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Scene text follows the game itself: the two choices are real choices in chapter 1 of the Three Kingdoms campaign
// (node c1_plum: "cover" and "speak"), and Cao Cao's line is Romance of the Three Kingdoms ch. 21 (public domain).
// Every visible line exists in English and Chinese; the banner's 中 / EN switch picks one.
export const LANGS = ['en', 'zh'];
export const SCENES = {
  home: {
    image: '/assets/originals/sg-002.webp', side: 'right', focus: 'center 12%', href: '/play/three-kingdoms',
    en: {
      badge: 'ORIGINAL', eyebrow: ['Three Kingdoms: The Strategist', 'Chapter 1 · Xuchang'],
      lead: 'Green plums, warm wine, a storm rolling in. Cao Cao has been counting the heroes of the realm, and laughing at each one.',
      quote: '“The only heroes under heaven are you, my lord, and I.”',
      ask: 'Thunder cracks. Your lord’s chopsticks hit the floor. What do you do?',
      choices: [
        { label: 'Knock over your own cup', hint: 'Cover his alarm. Cao Cao will notice you.' },
        { label: 'Speak up and rate the heroes yourself', hint: 'Draw every eye in the garden to you.' }
      ],
      placeholder: 'Or do something else…', cta: 'Start chapter 1', note: 'You face this moment in chapter 1 · 8 chapters, and what you say is remembered.'
    },
    zh: {
      badge: '原创', eyebrow: ['三国演义 · 谋士', '第一章 · 许都'],
      lead: '青梅正好，酒正温，骤雨将至。曹操一个一个数天下英雄，又一个一个笑着摇头。',
      quote: '「今天下英雄，惟使君与操耳。」',
      ask: '一声惊雷，主公手中的匙箸落在地上。你怎么做？',
      choices: [
        { label: '打翻自己的酒樽', hint: '替主公遮过慌乱。曹操会注意到你。' },
        { label: '接过话头，自己评点英雄', hint: '把满园的目光引到你身上。' }
      ],
      placeholder: '或者，做点别的……', cta: '开始第一章', note: '这一幕在第一章 · 共八章，你说过的话都会被记住。'
    }
  },
  character: {
    image: '/assets/originals/sg-007.webp', side: 'left', focus: 'center 10%', href: '/character/sgc-007', chat: '/play/sgc-007',
    en: {
      name: 'Diaochan', role: 'Three Kingdoms', tags: ['History', 'Palace intrigue'],
      quote: '“Walk slowly. In this corridor even the silence has listeners. What do you wish to ask me?”',
      choices: [{ label: 'Who is listening?' }, { label: 'I only came to ask about you.' }],
      placeholder: 'Reply to her…', cta: 'Start chatting', note: 'She remembers what you tell her.'
    },
    zh: {
      name: '貂蝉', role: '三国', tags: ['历史', '宫廷权谋'],
      quote: '「慢些走。这条回廊里，连沉默都有人在听。你想问我什么？」',
      choices: [{ label: '谁在听？' }, { label: '我只是来问你的。' }],
      placeholder: '回她一句……', cta: '开始聊天', note: '她记得你对她说过的话。'
    }
  }
};
const UI = {
  en: { group: 'Choose a reply', reply: 'Your reply', story: 'Featured story', character: 'Featured character', lang: 'Language', explore:'Explore more stories', footer:'STORYDATE · INTERACTIVE FICTION', library:'THE STORY LIBRARY', libraryTitle:'Where will your next story take you?', libraryDescription:'Find a world to step into, from historical intrigue to fantasy.' },
  zh: { group: '选一个回答', reply: '你的回答', story: '推荐故事', character: '推荐角色', lang: '语言', explore:'探索更多故事', footer:'STORYDATE · 互动小说', library:'故事书库', libraryTitle:'下一段故事，由你选择。', libraryDescription:'从历史权谋到奇幻旅程，找到你想进入的世界。' }
};

// Language: the visitor's own pick (localStorage sd.lang), otherwise the browser language.
export function heroLang(win = globalThis) {
  try { const v = win.localStorage?.getItem('sd.lang'); if (LANGS.includes(v)) return v; } catch {}
  return /^zh/i.test(win.navigator?.language || '') ? 'zh' : 'en';
}
export function heroSceneEnabled(win = globalThis) {
  try { if (new URLSearchParams(win.location?.search || '').get('hero') === 'classic') return false; } catch {}
  try { if (win.localStorage?.getItem('sd.hero') === 'classic') return false; } catch {}
  return true;
}

export function heroSceneMarkup(page, lang = 'en') {
  const s = SCENES[page]; if (!s) return '';
  const x = s[lang] || s.en, ui = UI[lang] || UI.en;
  const chips = x.choices.map((c, i) => `<button type="button" class="sd-hero-choice${c.hint ? ' has-hint' : ''}" data-hero-choice="${i}"><span class="sd-hero-choice-label">${esc(c.label)}</span>${c.hint ? `<span class="sd-hero-choice-hint">${esc(c.hint)}</span>` : ''}</button>`).join('');
  const head = page === 'character'
    ? `<div class="sd-hero-meta"><span class="sd-hero-name">${esc(x.name)}</span><span>${esc(x.role)}</span></div><div class="sd-hero-tags">${x.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div><p class="sd-hero-bubble">${esc(x.quote)}</p>`
    : `<div class="sd-hero-meta"><span class="sd-hero-badge">${esc(x.badge)}</span>${x.eyebrow.map(esc).join('<span aria-hidden="true">·</span>')}</div><p class="sd-hero-lead">${esc(x.lead)}</p><p class="sd-hero-quote">${esc(x.quote)}</p><p class="sd-hero-ask">${esc(x.ask)}</p>`;
  return `<div class="sd-hero-art sd-hero-${s.side}" aria-hidden="true"><img class="sd-hero-blur" src="${s.image}" alt="" decoding="async"><img class="sd-hero-figure" src="${s.image}" alt="" style="object-position:${s.focus}" decoding="async"><span class="sd-hero-fade"></span></div>
<div class="sd-hero-copy sd-hero-copy-${s.side === 'right' ? 'left' : 'right'}"><h1 class="sd-visually-hidden">${esc(page === 'character' ? x.name : x.eyebrow[0])}</h1>${head}
<div class="sd-hero-choices${page === 'character' ? ' is-chips' : ''}" role="group" aria-label="${ui.group}">${chips}</div>
<form class="sd-hero-form" data-hero-form><label class="sd-visually-hidden" for="sd-hero-input-${page}">${ui.reply}</label><input id="sd-hero-input-${page}" name="reply" maxlength="300" autocomplete="off" placeholder="${esc(x.placeholder)}"><button type="submit">${esc(x.cta)}</button></form>
<p class="sd-hero-note">${esc(x.note)}</p></div>${page==='home'?`<div class="sd-hero-footer"><span>${esc(ui.footer)}</span><button type="button" data-explore-library>${esc(ui.explore)} <span aria-hidden="true">↓</span></button></div>`:''}`;
}

const CSS = `
.sd-hero{display:none}
.sd-hero-footer{display:none}
@media (min-width:1024px){
 .sd-hero-on [data-hero-desktop]{display:none!important}
 .sd-hero-on{min-height:0!important}
 [data-sd-hero=character]{--sd-hero-h:470px}
 .sd-hero-gap{display:none!important}
 .sd-hero-next{padding-top:0!important;margin-top:-56px;position:relative;z-index:1}
 .sd-hero{display:block;position:relative;height:var(--sd-hero-h,540px);overflow:hidden;background:#121212;color:#fafafa;font-family:Inter,"PingFang SC","Noto Sans SC",system-ui,sans-serif}
 .sd-hero-art{position:absolute;inset:0}
 .sd-hero-blur{position:absolute;left:-60px;top:-60px;width:calc(100% + 120px);height:620px;object-fit:cover;filter:blur(48px) brightness(.32) saturate(1.2);max-width:none}
 .sd-hero-figure{position:absolute;top:0;height:100%;width:46%;max-width:560px;object-fit:cover}
 .sd-hero-right .sd-hero-figure{right:40px}.sd-hero-left .sd-hero-figure{left:40px}
 .sd-hero-fade{position:absolute;inset:0;pointer-events:none}
 .sd-hero-fade{background:linear-gradient(0deg,#121212 0%,#121212 12%,rgba(18,18,18,0) 40%)}
 .sd-hero-right .sd-hero-figure{-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 42%,#000 90%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0%,#000 42%,#000 90%,transparent 100%)}
 .sd-hero-left .sd-hero-figure{-webkit-mask-image:linear-gradient(270deg,transparent 0%,#000 42%,#000 90%,transparent 100%);mask-image:linear-gradient(270deg,transparent 0%,#000 42%,#000 90%,transparent 100%)}
 .sd-hero-copy{position:absolute;top:48px;width:min(600px,48%);display:flex;flex-direction:column;gap:16px}
 .sd-hero-copy-left{left:80px}.sd-hero-copy-right{right:64px;width:min(520px,44%)}
 .sd-hero-meta{display:flex;align-items:center;gap:10px;font-size:14px;color:#a1a1a1;flex-wrap:wrap}
 .sd-hero-badge{padding:3px 8px;border-radius:6px;background:rgba(250,250,250,.12);color:#fafafa;font-size:12px;font-weight:600;letter-spacing:.4px}
 .sd-hero-name{font-size:22px;font-weight:600;color:#fff}
 .sd-hero-tags{display:flex;gap:8px;flex-wrap:wrap}.sd-hero-tags span{padding:4px 12px;border-radius:999px;border:1px solid #3a3a3a;font-size:13px;color:#c9c9c9}
 .sd-hero-lead{margin:0;font-size:16px;line-height:1.6;color:#c9c9c9}
 .sd-hero-quote{margin:0;font-size:34px;line-height:1.22;font-weight:600;color:#fff;text-wrap:balance}
 .sd-hero-ask{margin:0;font-size:16px;color:#fafafa}
 .sd-hero-bubble{margin:0;padding:16px 18px;border-radius:12px;background:rgba(31,31,31,.85);border:1px solid #2e2e2e;font-size:20px;line-height:1.5;color:#fff}
 .sd-hero-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 .sd-hero-choices.is-chips{display:flex;flex-wrap:wrap;gap:8px}
 .sd-hero-choice{text-align:left;padding:11px 14px;border-radius:8px;border:1px solid #3a3a3a;background:rgba(31,31,31,.85);color:#fafafa;font:inherit;cursor:pointer;transition:background .15s,border-color .15s}
 .is-chips .sd-hero-choice{height:36px;padding:0 14px;border-radius:999px;background:transparent;font-size:14px}
 .sd-hero-choice:hover{border-color:#fafafa;background:rgba(250,250,250,.08)}
 .sd-hero-choice[aria-pressed=true]{background:#fafafa;color:#1a1a1a;border-color:#fafafa}
 .sd-hero-choice-label{display:block;font-size:15px;font-weight:500}
 .sd-hero-choice-hint{display:block;margin-top:3px;font-size:12px;color:#a1a1a1}
 .sd-hero-choice[aria-pressed=true] .sd-hero-choice-hint{color:#555}
 .sd-hero-form{display:flex;gap:10px;align-items:center;margin:0}
 .sd-hero-form input{flex:1;min-width:0;height:44px;box-sizing:border-box;padding:0 14px;border-radius:8px;border:1px solid #3a3a3a;background:rgba(31,31,31,.9);color:#fafafa;font:15px inherit;font-family:inherit;outline:none}
 .sd-hero-form input:focus{border-color:#8a8a8a}.sd-hero-form input::placeholder{color:#8a8a8a}
 .sd-hero-form button{height:44px;padding:0 20px;border-radius:8px;border:0;background:#fafafa;color:#1a1a1a;font-size:14px;font-weight:500;font-family:inherit;cursor:pointer;white-space:nowrap}
 .sd-hero-form button:hover{background:#e5e5e5}
 .sd-hero-note{margin:0;font-size:13px;color:#8a8a8a}
 .sd-visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
}`;

// Where a click leads: the Three Kingdoms game in the banner's language, or Diaochan's chat opened with the reply.
export function heroHref(page, lang, reply = '') {
  if (page === 'home') return `${SCENES.home.href}?lang=${lang}`;
  const say = reply.trim().slice(0, 300);
  return say ? `${SCENES.character.chat}?say=${encodeURIComponent(say)}` : SCENES.character.chat;
}

export function mountHeroScene(root, page, { navigate, win = globalThis, lang } = {}) {
  const desktop = root.querySelector('[data-hero-desktop]');
  if (!desktop || !SCENES[page] || !heroSceneEnabled(win)) return null;
  const doc = desktop.ownerDocument;
  if (!doc.getElementById('sd-hero-style')) { const st = doc.createElement('style'); st.id = 'sd-hero-style'; st.textContent = CSS; doc.head.append(st); }
  let hero = desktop.parentElement.querySelector(':scope > [data-sd-hero]');
  if (!hero) { hero = doc.createElement('section'); hero.className = 'sd-hero'; hero.dataset.sdHero = page; desktop.before(hero); }
  const section = desktop.closest('section') || desktop.parentElement;
  section.classList.add('sd-hero-on');
  // Identify captured carousel spacers and the browsing region. Focused home styling gives the scene and
  // library separate surfaces; character/classic layouts keep the compact transition.
  const before = section.previousElementSibling;
  if (before && !before.textContent.trim() && !before.querySelector('img,a,button')) before.classList.add('sd-hero-gap');
  let nextContent;
  for (let el = section.nextElementSibling; el; el = el.nextElementSibling) {
    if (/(^|\s)tl:hidden(\s|$)/.test(el.className)) continue; // phone-only block, already hidden on desktop
    if (!el.textContent.trim() && !el.querySelector('img,a,button')) { el.classList.add('sd-hero-gap'); continue; }
    el.classList.add('sd-hero-next'); nextContent=el; break;
  }
  let libraryHeading;
  const focusedHome=page==='home'&&new URLSearchParams(win.location?.search||'').get('layout')!=='classic';
  if(focusedHome){
    section.classList.add('sd-home-stage');section.parentElement.classList.add('sd-home-layout');
    for(const child of desktop.parentElement.children)if(child!==hero)child.classList.add('sd-home-old-carousel');
    for(const child of section.parentElement.children){
      if(child.classList.contains('pointer-events-none'))child.classList.add('sd-home-ambient');
      if(child.classList.contains('fixed')&&child.querySelector('a[href="/search"]'))child.classList.add('sd-home-topbar');
    }
    if(nextContent){
      nextContent.classList.add('sd-home-library');nextContent.id='story-library';
      libraryHeading=nextContent.querySelector('.sd-library-heading');
      if(!libraryHeading){libraryHeading=doc.createElement('header');libraryHeading.className='sd-library-heading';libraryHeading.setAttribute('data-no-i18n','');nextContent.prepend(libraryHeading);}
    }
  }
  const s = SCENES[page];
  const go = href => navigate ? navigate(href) : (win.location.href = href);
  const paint = l => {
    const ui = UI[l];
    hero.lang = l === 'zh' ? 'zh-CN' : 'en'; hero.setAttribute('aria-label', ui[page === 'character' ? 'character' : 'story']);
    hero.innerHTML = heroSceneMarkup(page, l);
    const input = hero.querySelector('input');
    // A choice is an answer: it goes straight in. Typing is for anything else.
    hero.querySelectorAll('[data-hero-choice]').forEach(b => b.onclick = () => go(heroHref(page, l, s[l].choices[Number(b.dataset.heroChoice)].label)));
    hero.querySelector('[data-hero-form]').onsubmit = e => { e.preventDefault(); go(heroHref(page, l, input.value)); };
    if(libraryHeading){
      libraryHeading.innerHTML=`<p class="sd-library-kicker">${esc(ui.library)}</p><h2>${esc(ui.libraryTitle)}</h2><p>${esc(ui.libraryDescription)}</p>`;
      hero.querySelector('[data-explore-library]').onclick=()=>nextContent.scrollIntoView?.({behavior:win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'start'});
    }
  };
  paint(LANGS.includes(lang) ? lang : heroLang(win));
  // The site-wide language switch repaints whichever banner is on screen.
  win.__sdHeroRepaint = l => { if (hero.isConnected && LANGS.includes(l)) paint(l); };
  if (!win.__sdHeroLangBound) { win.__sdHeroLangBound = true; win.addEventListener?.('sd-lang', e => win.__sdHeroRepaint?.(e.detail)); }
  return hero;
}
