import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseHTML,DOMParser} from 'linkedom';
import {storiesForCharacter,charactersForStory,storyById,linkedStoryCatalog} from '../dist/assets/character-stories.js';
import {bookMetadata} from '../dist/assets/book-catalog.js';
import {CHARACTER_CARDS, FEATURED_CHARACTER_CARDS, characterCardQuote, characterCardMeta} from '../dist/assets/flywheel/cards-data.js';
import {storydateCharacters,storydateOriginals} from '../dist/assets/storydate-originals.js';
const dist=fileURLToPath(new URL('../dist/',import.meta.url));

test('published character relationships preserve campaign identities and the eight real biography links',()=>{
 const works=[['three-kingdoms','sanguo',9],['xichuan','xichuan',3],['ashen-crown','ashen',2],['baker-street','holmes',1]];
 assert.deepEqual(linkedStoryCatalog.map(s=>s.id),works.map(([id])=>id));
 for(const [id,work,count] of works){
  const cards=charactersForStory(id);assert.equal(cards.length,count);
  assert.deepEqual(cards.map(card => card.id), FEATURED_CHARACTER_CARDS.filter(card => card.source.work === work).map(card => card.id));
  for(const card of cards){
   assert.equal(card.source.work,work);
   const story=storiesForCharacter(card.id).find(s=>s.id===id);
   assert.ok(story);assert.equal(story.informationUrl,'/story/'+id);
   assert.ok(story.title.zh&&story.title.en&&story.description.zh&&story.description.en);
  }
 }
 const biographies=storydateCharacters.filter(c=>c.story_id);
 assert.equal(biographies.length,8);
 for(const character of biographies){
  const card=CHARACTER_CARDS.find(c=>c.chatId===character.id);
  const story=storiesForCharacter(card.id).find(s=>s.id===character.story_id);
  const source=storydateOriginals.find(s=>s.id===character.story_id);
  assert.ok(story);assert.equal(story.title.zh,source.title_zh);
  assert.equal(story.playUrl,'/play/'+source.id);
  assert.deepEqual(charactersForStory(source.id).map(c=>c.id),[card.id]);
 }
 assert.deepEqual(storiesForCharacter('sg-wenzhi').map(s=>s.id),['three-kingdoms']);
 assert.deepEqual(charactersForStory('three-kingdoms-ink'),charactersForStory('three-kingdoms'));
 for(const card of CHARACTER_CARDS.filter(c=>c.source.work==='character'))assert.deepEqual(storiesForCharacter(card.id),[],'an original encounter is not an invented book');
 assert.deepEqual(storiesForCharacter('unknown'),[]);assert.deepEqual(charactersForStory('unknown'),[]);assert.equal(storyById('unknown'),null);
 assert.equal(storyById('ashen-crown').playUrl,'/assets/ashen/index.html');
 assert.equal(storyById('baker-street').playUrl,'/assets/holmes-webgal/index.html');
});

test('existing Story detail and preview expose the same cast, metadata and one real play action',async()=>{
 const {document,window}=parseHTML('<html><head><link href="/style.css"></head><body><main id="main"></main><dialog id="modal"></dialog></body></html>');
 const values=new Map([['sd.lang','zh']]),writes=[];
 const append=window.HTMLElement.prototype.append;
 window.HTMLElement.prototype.append=function(...nodes){const result=append.apply(this,nodes);for(const node of nodes)if(node.tagName==='LINK')queueMicrotask(()=>node.onload?.());return result;};
 window.HTMLElement.prototype.showModal=function(){this.open=true;this.setAttribute('open','');};
 window.HTMLElement.prototype.close=function(){this.open=false;this.removeAttribute('open');};
 window.HTMLElement.prototype.focus=function(){document.activeElement=this;};
 Object.defineProperty(document,'activeElement',{configurable:true,writable:true,value:document.body});
 const location={origin:'https://preview.example',href:'https://preview.example/',pathname:'/',search:'',hash:''};
 const setPath=path=>{const url=new URL(path,location.origin);Object.assign(location,{href:url.href,pathname:url.pathname,search:url.search,hash:url.hash});};
 const history={state:{}};
 Object.assign(globalThis,{document,window,DOMParser,location,history,
  localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>{writes.push([key,value]);values.set(key,value);}},
  matchMedia:()=>({matches:true}),addEventListener:window.addEventListener.bind(window),dispatchEvent:window.dispatchEvent.bind(window),CustomEvent:window.CustomEvent,
  fetch:async path=>new Response(await readFile(join(dist,path)),{headers:{'Content-Type':'application/json'}}),
 });
 window.scrollTo=()=>{};
 const reference=await import('../dist/assets/reference.js');
 const {closeTitlePreview}=await import('../dist/assets/title-preview.js');
 const {setLang}=await import('../dist/assets/site-i18n.js');
 const helpers={categories:['Main','New Ranking','Rankings','Today'],data:reference.extraStories,read:(key,fallback)=>key==='ooc-favorites'?['xichuan']:fallback,save:(key,value)=>writes.push([key,value]),navigate(){},show(){}};
 const storyIds=[...linkedStoryCatalog.map(s=>s.id),'three-kingdoms-ink',...storydateCharacters.filter(c=>c.story_id).map(c=>c.story_id)];
 const checkCast=(host,id)=>{
  const expected=charactersForStory(id).map(c=>'/characters/'+c.id);
  assert.deepEqual([...host.querySelectorAll('[data-story-characters] a')].map(a=>a.getAttribute('href')),expected,id);
  for(const link of host.querySelectorAll('[data-story-character]')){
   if(link.classList.contains('story-character-card')){
    const card=CHARACTER_CARDS.find(card=>card.id===link.dataset.storyCharacter);
    assert.equal(link.querySelector('[data-story-character-name]').textContent,card.name.zh);
    assert.equal(link.querySelector('.story-character-art>img:not(.story-character-background)').getAttribute('src'),card.portrait,'the Story uses the same character artwork as the directory');
    const art = link.querySelector('.story-character-art');
    const badge = art.querySelector('.sd-capability[data-story-character-capability]');
    assert.ok(badge);
    assert.equal(badge.classList.contains('is-chat'), Boolean(card.chat));
    assert.equal(badge.textContent.trim(), card.chat ? '可聊天' : '故事主角');
    assert.equal(art.querySelector('.sd-card-quote > span').textContent, characterCardQuote(card, 'zh'));
    assert.equal(link.querySelector('.sd-card-meta').textContent, characterCardMeta(card, 'zh'));
    assert.equal(link.querySelector('[data-story-character-hint]'), null);
    continue;
   }
   const avatar=link.querySelector('[data-story-avatar]');assert.ok(avatar);
   assert.match(avatar.getAttribute('style'),/width:40px;height:40px;overflow:hidden/);
   assert.match(link.getAttribute('style'),/min-height:44px/);
  }
 };
 for(const id of storyIds){
  const record=storyById(id);setPath(record.informationUrl);assert.equal(reference.show(location.pathname,helpers),true);
  const detail=document.querySelector('.replica-story-detail');assert.ok(detail,id);checkCast(detail,id);
  assert.equal(document.querySelectorAll('.story-detail-header .story-detail-language').length,1,'phone Story details retain one language control instead of losing the utility with the sidebar');
  const play=detail.querySelectorAll('[data-story-play]');assert.equal(play.length,1,id);assert.equal(play[0].getAttribute('href'),record.playUrl);
  const stage = detail.querySelector('.sd-stage-card .sd-stage-layout');
  assert.ok(stage?.querySelector('.sd-stage-art .sd-stage-fade'), id + ' shares the same artwork and gradient stage as the character');
  assert.equal(stage.querySelector('[data-story-cover]').getAttribute('src'), record.image);
  const copy = stage.querySelector('.sd-stage-body');
  assert.ok(copy?.querySelector('[data-story-title]') && copy.contains(play[0]), 'the story shares its title and its one player action in the stage');
  assert.ok(copy.querySelector('.story-bookmark'), 'the existing bookmark stays with the player action');
  assert.equal(detail.querySelector('.story-play-bar'),null,'the same play action is not repeated in a second sticky footer');
  assert.equal(detail.querySelector('.story-bookmark').getAttribute('aria-pressed'),String(id==='xichuan'),'moving the bookmark preserves the existing saved state without writing it');
  assert.equal(play[0].getAttribute('target'),record.playUrl.startsWith('/assets/')?'_top':null);
  assert.equal(reference.preview(record.informationUrl,helpers),true);
  const dialog=document.getElementById('title-preview');checkCast(dialog,id);
  assert.equal(dialog.querySelectorAll('[data-story-play]').length,1);
  assert.equal(dialog.querySelector('[data-story-play]').getAttribute('href'),record.playUrl);
  assert.equal(dialog.querySelector('[data-story-information]').getAttribute('href'),record.informationUrl);
  assert.ok(dialog.querySelector('[data-story-information]').hasAttribute('data-full-info'));
  assert.equal(dialog.querySelector('[data-preview-play]'),null,'no second action can synthesize /play for a standalone game');
  closeTitlePreview();
 }
 for (const id of ['story-005', 'mortal-path', 'monte-cristo']) {
  setPath('/story/' + id);
  reference.show(location.pathname, helpers);
  const stage = document.querySelector('.replica-story-detail .sd-stage-card');
  assert.ok(stage?.querySelector('.sd-stage-art img'), id + ' has a stage even without a linked cast');
  const play = stage.querySelector('.sd-stage-body [data-story-play]');
  assert.equal(play?.getAttribute('href'), '/play/' + id);
  assert.equal(document.querySelectorAll('.replica-story-detail [data-story-play]').length, 1, id + ' has one existing player');
 }
 setPath('/story/xichuan');history.state={characterReturn:'/characters/xc-shencheng'};reference.show(location.pathname,helpers);
 assert.equal(document.querySelector('.shell-page-header a').getAttribute('href'),'/characters/xc-shencheng');
 setLang('en',{win:globalThis,doc:document});
 assert.equal(document.querySelector('[data-story-character="xc-zhiyao"] [data-story-character-name]').textContent,'Xia Zhiyao');
 assert.equal(document.querySelector('[data-story-character="xc-zhiyao"] .is-chat[data-story-character-capability]').textContent.replace(/^●\s*/, '').trim(), 'Chat available');
 assert.equal(document.querySelector('[data-story-character="xc-shencheng"] [data-story-character-capability]').textContent,'In the story');
 assert.equal(document.querySelector('[data-story-character="xc-shencheng"] .sd-card-quote > span').textContent,'Seven years.');
 assert.deepEqual([...document.querySelectorAll('.story-character-card')].map(link=>link.dataset.storyCharacter),['xc-zhiyao','xc-shencheng','xc-jibai']);
 assert.match(document.querySelector('[data-story-format]').textContent,/Galgame/);
 assert.equal(document.querySelector('.story-detail-language [data-sd-lang="en"]').getAttribute('aria-pressed'),'true');
 assert.equal(document.querySelector('[data-story-title]').textContent,storyById('xichuan').title.en);
 history.state={characterReturn:'https://outside.example/'};reference.show(location.pathname,helpers);
 assert.equal(document.querySelector('.shell-page-header a').getAttribute('href'),'/');
 setPath('/');reference.show('/',helpers);
 for(const id of ['xichuan','ashen-crown','baker-street']){
  assert.ok(reference.extraStories.find(s=>s.id===id));
  const card=document.querySelector('a[href="/story/'+id+'"]');assert.ok(card,id);assert.equal(card.getAttribute('target'),null);
 }
 assert.ok(![...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Today'));
 setPath('/collection?name=Today');reference.show('/collection',helpers);
 assert.equal(document.querySelector('.collection-heading h1').textContent,'Most Played');
 assert.ok(document.querySelectorAll('[data-collection-grid] a').length>0,'legacy Today remains a usable played collection');
 setPath('/search?q='+encodeURIComponent('我替巨龙送信'));reference.show('/search',helpers);
 let results=[...document.querySelectorAll('[data-search-results] a[href^="/story/"]')].map(a=>a.getAttribute('href'));
 assert.ok(results.includes('/story/story-018'));
 closeTitlePreview();reference.openSearch(helpers,'我替巨龙送信');
 assert.deepEqual([...document.querySelectorAll('[data-search-results] a[href^="/story/"]')].map(a=>a.getAttribute('href')),results);
 for(const query of ['The Strategist','Three Kingdoms: The Strategist','谋士']){
  closeTitlePreview();reference.openSearch(helpers,query);
  const hrefs=[...document.querySelectorAll('[data-search-results] a[href^="/story/"]')].map(a=>a.getAttribute('href'));
  assert.ok(hrefs.includes('/story/three-kingdoms'),query+' finds the canonical story');
  assert.ok(hrefs.includes('/story/three-kingdoms-ink'),query+' finds the existing ink edition');
 }
 const characterResults=query=>{
  closeTitlePreview();reference.openSearch(helpers,query);
  document.querySelector('[data-search-kind="Character"]').click();
  return [...document.querySelectorAll('[data-search-results] [data-search-profile]')];
 };
 const allProfiles=characterResults('');
 assert.deepEqual(allProfiles.map(a=>a.getAttribute('href')),FEATURED_CHARACTER_CARDS.map(c=>'/characters/'+c.id));
 assert.equal(new Set(allProfiles.map(a=>a.dataset.searchProfile)).size,18);
 for(const [query,id] of [['夏知遥','xc-zhiyao'],['Xia Zhiyao','xc-zhiyao'],['沈澄','xc-shencheng'],['Cao Cao','sg-caocao'],['曹操','sg-caocao'],['曹操传','sg-caocao']]){
  assert.deepEqual(characterResults(query).map(a=>a.dataset.searchProfile),[id],query);
  setPath('/search?q='+encodeURIComponent(query));closeTitlePreview();reference.show('/search',helpers);
  assert.ok(document.querySelector('[data-search-profile="'+id+'"]'),query+' also works from the search route');
 }
 for(const [query, id] of [['老周','xc-zhou'],['Mrs Hudson','bk-hudson'],['奥古斯特','wn-august']]){
  assert.equal(characterResults(query).some(result=>result.dataset.searchProfile===id),false,query+' is absent from the modal');
  closeTitlePreview();setPath('/search?q='+encodeURIComponent(query));reference.show('/search',helpers);
  assert.equal(document.querySelector(`[data-search-profile="${id}"]`),null,query+' is absent from the search page');
 }
 const cao=characterResults('Cao Cao')[0];
 assert.equal(cao.querySelector('[data-search-profile-name]').textContent,'Cao Cao');
 assert.equal(document.querySelector('[data-search-summary]').textContent,'1 result');
 setLang('zh',{win:globalThis,doc:document});
 assert.equal(document.querySelector('[data-search-profile="sg-caocao"]'),cao,'language changes preserve the same profile link');
 assert.equal(cao.querySelector('[data-search-profile-name]').textContent,'曹操');
 assert.equal(document.querySelector('[data-search-summary]').textContent,'找到 1 项');
 assert.deepEqual(reference.extraStories.filter(d=>d.type==='character').map(d=>d.id),storydateCharacters.map(d=>d.id),'display profiles never replace the real session/model catalogue');
 assert.equal(reference.extraStories.some(d=>d.id==='sg-caocao'||d.id==='xc-shencheng'),false);
 closeTitlePreview();assert.deepEqual(writes,[['sd.lang','en'],['sd.lang','zh']],'only explicit language choices write preferences; public relationships/search never create or migrate private state');

 const {translate}=await import('../dist/assets/site-i18n.js');
 for (const [en,zh] of [['Added to bookmarks','已加入收藏'],['Removed from bookmarks','已取消收藏']]) {
  assert.equal(translate(en,'zh'),zh);
  assert.equal(translate(zh,'en'),en);
 }
 for (const book of bookMetadata) {
  setPath(book.href);
  reference.show(location.pathname,helpers);
  const stage=document.querySelector('.sd-stage-card'),title=stage.querySelector('h1');
  const description=stage.querySelector('[data-story-description]'),campaign=stage.querySelector('[data-story-campaign]');
  const play=stage.querySelector('[data-story-play]'),bookmark=stage.querySelector('.story-bookmark');
  assert.equal(campaign.textContent,book.plays);
  setLang('en',{win:globalThis,doc:document});
  assert.match(title.textContent,book.id==='mortal-path'?/Dust Beyond the Valley/:/Embers and Tides/);
  assert.match(description.textContent,book.id==='mortal-path'?/Shen Weichen/:/Noël/);
  assert.match(campaign.textContent,/Eight-chapter campaign/);
  assert.equal(stage.querySelector('[data-story-cover]').alt,title.textContent);
  assert.equal(play.getAttribute('href'),'/play/'+book.id);
  assert.equal(bookmark.dataset.favorite,book.id);
  setLang('zh',{win:globalThis,doc:document});
  assert.deepEqual([title.textContent,description.textContent,campaign.textContent],[book.title,book.description,book.plays]);
  assert.equal(stage.querySelector('[data-story-cover]').alt,book.title);
 }
});
