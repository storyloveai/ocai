// Story / Character first-screen banner: one scene, one question, at most three ways in.
// Replaces the captured desktop carousel on wide screens only; the mobile carousel is untouched.
// The previous carousel stays available: add ?hero=classic to the URL, or set localStorage sd.hero = "classic".
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Scene text follows the game itself: the two choices are real choices in chapter 1 of the Three Kingdoms campaign
// (node c1_plum: "cover" and "speak"), and Cao Cao's line is Romance of the Three Kingdoms ch. 21 (public domain).
export const SCENES = {
  home: {
    image: '/assets/originals/sg-002.webp', alt: 'Cao Cao holding a cup of wine', side: 'right', focus: 'center 12%',
    eyebrow: ['Three Kingdoms: The Strategist', 'Chapter 1 · Xuchang'],
    lead: 'Green plums, warm wine, a storm rolling in. Cao Cao has been counting the heroes of the realm, and laughing at each one.',
    quote: '“The only heroes under heaven are you, my lord, and I.”',
    ask: 'Thunder cracks. Your lord’s chopsticks hit the floor. What do you do?',
    choices: [
      { label: 'Knock over your own cup', hint: 'Cover his alarm. Cao Cao will notice you.' },
      { label: 'Speak up and rate the heroes yourself', hint: 'Draw every eye in the garden to you.' }
    ],
    placeholder: 'Or do something else…', cta: 'Start chapter 1', note: 'You face this moment in chapter 1 · 8 chapters, and what you say is remembered.',
    href: '/play/three-kingdoms'
  },
  character: {
    image: '/assets/originals/sg-007.webp', alt: 'Diaochan looking back over her shoulder', side: 'left', focus: 'center 10%',
    name: 'Diaochan', role: 'Three Kingdoms', tags: ['History', 'Palace intrigue'],
    quote: '“Walk slowly. In this corridor even the silence has listeners. What do you wish to ask me?”',
    choices: [{ label: 'Who is listening?' }, { label: 'I only came to ask about you.' }],
    placeholder: 'Reply to her…', cta: 'Start chatting', note: 'She remembers what you tell her.',
    href: '/character/sgc-007'
  }
};

export function heroSceneEnabled(win = globalThis) {
  try { if (new URLSearchParams(win.location?.search || '').get('hero') === 'classic') return false; } catch {}
  try { if (win.localStorage?.getItem('sd.hero') === 'classic') return false; } catch {}
  return true;
}

export function heroSceneMarkup(page) {
  const s = SCENES[page]; if (!s) return '';
  const chips = s.choices.map((c, i) => `<button type="button" class="sd-hero-choice${c.hint ? ' has-hint' : ''}" data-hero-choice="${i}"><span class="sd-hero-choice-label">${esc(c.label)}</span>${c.hint ? `<span class="sd-hero-choice-hint">${esc(c.hint)}</span>` : ''}</button>`).join('');
  const head = page === 'character'
    ? `<div class="sd-hero-meta"><span class="sd-hero-name">${esc(s.name)}</span><span>${esc(s.role)}</span></div><div class="sd-hero-tags">${s.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div><p class="sd-hero-bubble">${esc(s.quote)}</p>`
    : `<div class="sd-hero-meta"><span class="sd-hero-badge">ORIGINAL</span>${s.eyebrow.map(esc).join('<span aria-hidden="true">·</span>')}</div><p class="sd-hero-lead">${esc(s.lead)}</p><p class="sd-hero-quote">${esc(s.quote)}</p><p class="sd-hero-ask">${esc(s.ask)}</p>`;
  return `<div class="sd-hero-art sd-hero-${s.side}" aria-hidden="true"><img class="sd-hero-blur" src="${s.image}" alt="" decoding="async"><img class="sd-hero-figure" src="${s.image}" alt="" style="object-position:${s.focus}" decoding="async"><span class="sd-hero-fade"></span></div>
<div class="sd-hero-copy sd-hero-copy-${s.side === 'right' ? 'left' : 'right'}"><h1 class="sd-visually-hidden">${esc(page === 'character' ? s.name : s.eyebrow[0])}</h1>${head}
<div class="sd-hero-choices${page === 'character' ? ' is-chips' : ''}" role="group" aria-label="Choose a reply">${chips}</div>
<form class="sd-hero-form" data-hero-form><label class="sd-visually-hidden" for="sd-hero-input-${page}">Your reply</label><input id="sd-hero-input-${page}" name="reply" maxlength="300" autocomplete="off" placeholder="${esc(s.placeholder)}"><button type="submit">${esc(s.cta)}</button></form>
<p class="sd-hero-note">${esc(s.note)}</p></div>`;
}

const CSS = `
.sd-hero{display:none}
@media (min-width:1024px){
 .sd-hero-on [data-hero-desktop]{display:none!important}
 .sd-hero-on{min-height:0!important}
 .sd-hero{display:block;position:relative;height:500px;overflow:hidden;background:#121212;color:#fafafa;font-family:Inter,"PingFang SC","Noto Sans SC",system-ui,sans-serif}
 .sd-hero-art{position:absolute;inset:0}
 .sd-hero-blur{position:absolute;left:-60px;top:-60px;width:calc(100% + 120px);height:620px;object-fit:cover;filter:blur(48px) brightness(.32) saturate(1.2);max-width:none}
 .sd-hero-figure{position:absolute;top:0;height:500px;width:46%;max-width:560px;object-fit:cover}
 .sd-hero-right .sd-hero-figure{right:40px}.sd-hero-left .sd-hero-figure{left:40px}
 .sd-hero-fade{position:absolute;inset:0;pointer-events:none}
 .sd-hero-fade{background:linear-gradient(0deg,#121212 0%,rgba(18,18,18,0) 26%)}
 .sd-hero-right .sd-hero-figure{-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 42%,#000 90%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0%,#000 42%,#000 90%,transparent 100%)}
 .sd-hero-left .sd-hero-figure{-webkit-mask-image:linear-gradient(270deg,transparent 0%,#000 42%,#000 90%,transparent 100%);mask-image:linear-gradient(270deg,transparent 0%,#000 42%,#000 90%,transparent 100%)}
 .sd-hero-copy{position:absolute;top:56px;width:min(600px,48%);display:flex;flex-direction:column;gap:16px}
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
 .sd-hero-choice:hover{border-color:#6a6a6a}
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

export function mountHeroScene(root, page, { navigate, win = globalThis } = {}) {
  const desktop = root.querySelector('[data-hero-desktop]');
  if (!desktop || !SCENES[page] || !heroSceneEnabled(win)) return null;
  const doc = desktop.ownerDocument;
  if (!doc.getElementById('sd-hero-style')) { const st = doc.createElement('style'); st.id = 'sd-hero-style'; st.textContent = CSS; doc.head.append(st); }
  let hero = desktop.parentElement.querySelector(':scope > [data-sd-hero]');
  if (!hero) { hero = doc.createElement('section'); hero.className = 'sd-hero'; hero.dataset.sdHero = page; hero.setAttribute('aria-label', page === 'character' ? 'Featured character' : 'Featured story'); desktop.before(hero); }
  hero.innerHTML = heroSceneMarkup(page);
  (desktop.closest('section') || desktop.parentElement).classList.add('sd-hero-on');
  const s = SCENES[page], input = hero.querySelector('input'), buttons = [...hero.querySelectorAll('[data-hero-choice]')];
  buttons.forEach(b => b.setAttribute('aria-pressed', 'false'));
  // The story and chat screens do not read the banner reply yet; the banner opens them at their start.
  const go = () => navigate ? navigate(s.href) : (win.location.href = s.href);
  buttons.forEach(b => b.onclick = () => {
    const c = s.choices[Number(b.dataset.heroChoice)];
    buttons.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    input.value = c.label; input.focus();
  });
  input.oninput = () => buttons.forEach(x => x.setAttribute('aria-pressed', String(x.querySelector('.sd-hero-choice-label').textContent === input.value)));
  hero.querySelector('[data-hero-form]').onsubmit = e => { e.preventDefault(); go(); };
  return hero;
}
