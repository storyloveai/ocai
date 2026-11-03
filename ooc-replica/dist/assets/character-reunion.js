import {escapeHTML as safe} from './stream.js';
import {relationshipMoments,reunionAnchor} from './character-relationship.js';

export function reunionCardHTML(id,messages,lang){const anchor=reunionAnchor(id,messages);if(!anchor)return '';const zh=lang==='zh';return `<aside class="character-return" data-no-i18n aria-label="${zh?'接着上次聊':'Continue this encounter'}"><p>${safe(anchor.label[lang])}</p><blockquote>${safe(Array.from(anchor.source.text).slice(0,180).join(''))}</blockquote><small>${zh?'你的原话 · 留在当前相遇里':'Your words · Kept in this encounter'}</small><div><button type="button" data-character-reunion>${zh?'接着上次聊':'Pick up where we left off'}</button><button type="button" data-character-return-dismiss>${zh?'我想先说点别的':'I have something else to say'}</button><button type="button" data-relationship-source="${anchor.source.turn}">${zh?'回到这句话':'Go to this line'}</button></div></aside>`;}
export function appendRelationshipFeedback(body,id,messages,lang){
 for(const moment of relationshipMoments(id,messages).slice(-2)){
  const target=body.querySelector(`[data-index="${moment.source.turn+1}"]`);if(!target)continue;
  target.insertAdjacentHTML('beforeend',`<button type="button" data-no-i18n class="character-relationship-note" data-relationship-source="${moment.source.turn}"><span aria-hidden="true">◇</span> ${safe(moment.label[lang])}<span class="character-relationship-source">${lang==='zh'?'查看原话':'View your words'}</span></button>`);
 }
}
