import {characterReadingHTML,balanceCharacterAction} from './character-reading.js';
import {sanguoCharacters} from './sanguo-characters.js';
import {originalCharacters} from './original-characters.js';
import {characterById} from './character-profiles.js';
import {escapeHTML as safe, markdown} from './stream.js';
import {getLang} from './site-i18n.js';

const copy = {
  zh: {eyebrow: 'STORYDATE · CHARACTERS', title: '找一个人，聊一段故事',
    sub: '重逢、争执，或者一场安静的陪伴。故事从你开口开始。', note: '对话自动保存，随时回来继续。',
    meet: '新的相遇', campaign: '三国 · 谋士', more: '其他三国人物', resume: '继续上次的话', start: '开始对话', cont: '继续对话',
    info: '了解人物', save: '收藏', unsave: '取消收藏', back: '返回角色', scene: '此刻的相遇', topics: '可以从这里聊起', source: '来自《三国·谋士》', preview: '角色资料'},
  en: {eyebrow: 'STORYDATE · CHARACTERS', title: 'Meet someone. Begin a story.',
    sub: 'A reunion, a disagreement, or quiet company. Your words make the next moment.', note: 'Conversations save automatically. Come back whenever you like.',
    meet: 'New encounters', campaign: 'The Strategist', more: 'More from the Three Kingdoms', resume: 'Pick up your conversation', start: 'Start chatting', cont: 'Continue chatting',
    info: 'Meet the character', save: 'Bookmark', unsave: 'Remove bookmark', back: 'Back to characters', scene: 'Your encounter', topics: 'A place to start', source: 'From The Strategist', preview: 'Character Information'}
};
const nameOf = (c, lang) => lang === 'zh' ? c.title_zh || c.title : c.title;
const description = (c, lang) => lang === 'zh' ? c.description_zh || c.description : c.description;
const saved = (read, id) => {const value = read('ooc-session-v2-' + id, []); return Array.isArray(value) && value.length > 0;};
function ensureStyles() {
  for(const href of ['/assets/sanguo-characters.css','/assets/character-reading.css']){
    if(document.querySelector('link[href="'+href+'"]'))continue;
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);
  }
}
const head = c => `<img src="${safe(c.image)}" alt="" width="300" height="400" loading="lazy">`;
const mobileBar = lang => `<header class="sg-mobile-toolbar" data-no-i18n><a href="/" aria-label="StoryDate"><img src="/assets/storydate-dialogue-logo.svg" alt="StoryDate" width="134" height="26"></a><div class="sd-lang sd-lang-top" role="group" aria-label="${lang === 'zh' ? '语言' : 'Language'}">${['en', 'zh'].map(l => `<button type="button" data-sd-lang="${l}" aria-pressed="${l === lang}">${l === 'zh' ? '中文' : 'EN'}</button>`).join('')}</div></header>`;
function card(c, lang, read, compact = false) {
  const l = copy[lang], favorite = read('ooc-favorites', []).includes(c.id), profile = characterById.get(c.id);
  return `<article class="sg-person${compact ? ' sg-person-compact' : ''}" data-character-id="${safe(c.id)}">
    <a class="sg-person-portrait" href="/character/${safe(c.id)}" aria-label="${safe(l.info + ' · ' + nameOf(c, lang))}">${head(c)}</a>
    <div class="sg-person-body"><div class="sg-person-name"><h3><a href="/character/${safe(c.id)}">${safe(nameOf(c, lang))}</a></h3>
      <button type="button" data-character-bookmark="${safe(c.id)}" aria-pressed="${favorite}" aria-label="${safe((favorite ? l.unsave : l.save) + ' · ' + nameOf(c, lang))}">${favorite ? '♥' : '♡'}</button></div>
      ${profile ? `<p class="sg-person-scene">${safe(profile.scene[lang])}</p>` : ''}
      <p class="sg-person-description">${safe(description(c, lang))}</p>
      ${profile ? `<ul class="sg-person-tags">${profile.tags[lang].map(t => `<li>${safe(t)}</li>`).join('')}</ul>` : ''}
      <a class="sg-person-chat" href="/play/${safe(c.id)}">${saved(read, c.id) ? l.cont : l.start}<span aria-hidden="true">↗</span></a>
    </div></article>`;
}
export function characterHubMarkup(characters, {lang = 'zh', read = (_key, fallback) => fallback} = {}) {
  const l = copy[lang], ids = new Set([...originalCharacters, ...sanguoCharacters].map(c => c.id)), others = characters.filter(c => !ids.has(c.id));
  const recentIds = [...new Set(read('ooc-history', []))];
  const recent = recentIds.map(id => characters.find(c => c.id === id)).filter(c => c && saved(read, c.id)).slice(0, 4);
  return `<main class="sg-characters" data-no-i18n>
    <header class="sg-characters-heading"><p class="sg-eyebrow">${l.eyebrow}</p><h1>${l.title}</h1><p>${l.sub}</p><p class="sg-save-note">${l.note}</p></header>
    ${recent.length ? `<section class="sg-character-recent" aria-label="${l.resume}"><h2>${l.resume}</h2><div>${recent.map(c => `<a href="/play/${safe(c.id)}">${head(c)}<span>${safe(nameOf(c, lang))}</span><span aria-hidden="true">↗</span></a>`).join('')}</div></section>` : ''}
    <section aria-labelledby="sg-meet"><h2 id="sg-meet">${l.meet}</h2><div class="sg-people-grid">${originalCharacters.map(c => card(characters.find(d => d.id === c.id) || c, lang, read)).join('')}</div></section>
    <section class="sg-character-more" aria-labelledby="sg-campaign"><h2 id="sg-campaign">${l.campaign}</h2><div class="sg-people-grid">${sanguoCharacters.map(c => card(characters.find(d => d.id === c.id) || c, lang, read)).join('')}</div></section>
    ${others.length ? `<section class="sg-character-more" aria-labelledby="sg-more"><h2 id="sg-more">${l.more}</h2><div class="sg-people-grid">${others.map(c => card(c, lang, read, true)).join('')}</div></section>` : ''}
  </main>`;
}
export function characterDetailMarkup(c, lang = 'zh', read = (_key, fallback) => fallback) {
  const l = copy[lang];
  return `<article class="sg-character-detail" data-no-i18n><a class="sg-character-back" href="/character">‹ ${l.back}</a>
    <div class="sg-character-detail-top"><div class="sg-person-portrait">${head(c)}</div><div><p class="sg-eyebrow">${safe(c.source?.[lang] || l.source)}</p><h1>${safe(nameOf(c, lang))}</h1><p>${safe(description(c, lang))}</p><ul class="sg-person-tags">${c.tags[lang].map(t => `<li>${safe(t)}</li>`).join('')}</ul><a class="sg-person-chat" href="/play/${safe(c.id)}">${saved(read, c.id) ? l.cont : l.start}<span aria-hidden="true">↗</span></a></div></div>
    <section><h2>${l.scene} · ${safe(c.scene[lang])}</h2><div class="sg-character-opening">${characterReadingHTML(markdown(balanceCharacterAction(c.opening[lang])),c.opening[lang])}</div></section>
    ${c.scenes ? `<section><h2>${lang === 'zh' ? '选择一场相遇' : 'Choose an encounter'}</h2><div class="character-encounters">${c.scenes.map(s => `<a href="/play/${safe(c.id)}?encounter=${safe(s.id)}"><strong>${safe(s.title[lang])}</strong><span>${safe(s.premise[lang])}</span><span>${l.start} ↗</span></a>`).join('')}</div></section>` : ''}
    <section><h2>${l.topics}</h2><ul class="sg-conversation-topics">${c.starters[lang].map(t => `<li>${safe(t)}</li>`).join('')}</ul></section><p class="sg-save-note">${l.note}</p></article>`;
}
export function characterPreview(c, lang = 'zh') {
  ensureStyles();
  const l = copy[lang];
  return {type: 'character', html: `<header><h2>${l.preview}</h2><button data-preview-close aria-label="Close information">×</button></header><div>${characterDetailMarkup(c, lang)}</div><footer><button data-preview-play="${safe(c.id)}" class="shell-white-button">${l.start}</button></footer>`};
}
export function characterIntroMarkup(c, lang = 'zh') {
  ensureStyles();
  return `<section class="sg-chat-intro" data-no-i18n><header><img src="${safe(c.image)}" alt="" width="60" height="80"><div><span>${safe(c.scene[lang])}</span><h2>${safe(nameOf(c, lang))}</h2></div></header>${characterReadingHTML(markdown(balanceCharacterAction(c.opening[lang])),c.opening[lang])}</section>`;
}
export function mountCharacterPage(container, {characters, read, save}, id) {
  ensureStyles();
  const profile = characterById.get(id);
  const draw = () => {const lang = getLang(); container.innerHTML = mobileBar(lang) + (profile ? characterDetailMarkup(profile, lang, read) : characterHubMarkup(characters, {lang, read}));};
  draw();
  container.onclick = event => {
    const button = event.target.closest('[data-character-bookmark]'); if (!button) return;
    const id = button.dataset.characterBookmark, values = read('ooc-favorites', []);
    save('ooc-favorites', values.includes(id) ? values.filter(x => x !== id) : [...values, id]);
    const favorite = read('ooc-favorites', []).includes(id), lang = getLang(), c = characters.find(c => c.id === id);
    button.setAttribute('aria-pressed', String(favorite)); button.textContent = favorite ? '♥' : '♡';
    button.setAttribute('aria-label', (favorite ? copy[lang].unsave : copy[lang].save) + ' · ' + nameOf(c, lang));
  };
  const onLang = () => {if (!container.isConnected) {globalThis.removeEventListener?.('sd-lang', onLang); return;} draw();};
  globalThis.addEventListener?.('sd-lang', onLang);
}
