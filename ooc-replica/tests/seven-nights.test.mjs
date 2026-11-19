import test from 'node:test';
import assert from 'node:assert/strict';
import episode from '../dist/assets/living-manga/episodes/seven-nights.js';
import {resolveChoice, interludeDraft} from '../dist/assets/living-manga/episode.js';
import {coverCrop} from '../dist/assets/living-manga/depth-window.js';
import {roleFor, siteTitles} from '../server/roles.js';
import {suggestionPrompt} from '../server/suggestion-prompt.js';
import {scrub, startAnalytics} from '../dist/assets/analytics.js';
import {getLang} from '../dist/assets/site-i18n.js';
import {boot, waitFor} from './fixtures/character-loop-dom.mjs';

test('both scripts route to authored outcomes and custom text remains data', () => {
  for (const [id, en, zh] of [['stand_ground','my rules','人情'],['probe_close','ring','印章'],['hide_truth','by dawn','出城']]) {
    for (const text of [en,zh]) assert.equal(resolveChoice(episode,{text}).branchId,id);
    for (const lang of ['en','zh']) {
      const choice=resolveChoice(episode,{optionId:id},lang);
      assert.equal(choice.branchId,id);
      assert.equal(episode.branches[id].reactionPanels.length,2);
      assert.equal(episode.branches[id].interlude[0].path,'/chat/sn-julian');
    }
  }
  const text='Hold <em>$&</em>'; const custom=resolveChoice(episode,{text},'en');
  assert.equal(interludeDraft(episode.branches.custom.interlude[0],custom,'en'),text);
  assert.equal(getLang({location:{pathname:'/pilot/seven-nights'},navigator:{language:'zh-CN'}}),'en');
  assert.equal(getLang({location:{pathname:'/pilot/seven-nights'},localStorage:{getItem:()=>'zh'}}),'zh');
});
test('cover alignment moves the painted crop within the asset on both axes',()=>{
  const image={naturalWidth:1440,naturalHeight:810};
  assert.deepEqual(coverCrop({},720,810,image),[.25,0,.5,1]);
  assert.deepEqual(coverCrop({alignX:1},720,810,image),[.5,0,.5,1]);
  assert.deepEqual(coverCrop({alignY:0},1440,405,image),[0,0,1,.5]);
  assert.deepEqual(episode.assets.p2Close.crop,[.54,0,.45,.88]);
  assert.equal(episode.assets.p2Full.alignX,.96);
});
test('private character is server-authorized and spoiler-safe',()=>{
  assert.ok(!siteTitles.some(t=>t.id==='sn-julian'));
  const role=roleFor('sn-julian');
  assert.equal(role.mode,'character'); assert.equal(role.character.age,33);
  for(const text of ['consent','PG-16','fade to black','2–4','visitor’s choices','later nights']) assert.ok(role.direction.join(' ').includes(text));
  const {system}=suggestionPrompt({titleId:'sn-julian',messages:[{role:'assistant',content:'Tell me why.'}]});
  assert.match(system,/exactly three/);assert.match(system,/never assume consent/);
});
test('implicit analytics cannot expose handoff URLs, text or element attributes',()=>{
  const url='https://example.test/chat/sn-julian?draft=PRIVATE';
  for(const event of ['$pageview','$pageleave','living_manga_chat_turn']){
    const captured=scrub({event,properties:{$current_url:url,$referrer:url,$set_once:{$initial_current_url:url}}});
    assert.ok(!JSON.stringify(captured).includes('PRIVATE'));
  }
  assert.equal(scrub({event:'$autocapture',properties:{$pathname:'/pilot/seven-nights',$elements_chain:'a[href="?draft=PRIVATE"]'}}),null);
});
test('reader to private chat restores draft and returns to the season hub without a POST',async()=>{
  const sent=[];
  const fake={__SV:1, init(){}, capture:(name,props)=>sent.push([name,props])};
  const f=await boot({path:'/characters',entries:[['sd.lang','en']], configured:true, mockChat:true});
  globalThis.posthog=fake;
  startAnalytics({location:{hostname:'preview.example'},document:f.document,navigator:{},posthog:fake});
  const engagedStorage=new Map();
  f.window.sessionStorage={getItem:k=>engagedStorage.get(k),setItem:(k,v)=>engagedStorage.set(k,v)};
  f.window.IntersectionObserver=class {
    constructor(cb){this.cb=cb;}
    observe(target){if(target.classList.contains('cols-2-asym'))queueMicrotask(()=>this.cb([{isIntersecting:true,target}]));}
    unobserve(){} disconnect(){}
  };
  try {
    const q=s=>f.document.querySelector(s);
    await f.go('/pilot/seven-nights');
    await waitFor(()=>q('[data-scene=p2Full]'));
    await f.click('[data-lm-option=probe_close]');
    await f.click('[data-lm-action=again]');
    const draft='My private <em>answer</em> & $1';
    const input=q('.lm-free input'); input.value=draft;
    q('.lm-free').dispatchEvent(new f.window.Event('submit',{bubbles:true,cancelable:true}));
    await f.click('[data-lm-character=sn-julian]');
    await waitFor(()=>q('#session-input')?.value===draft,'missing unsent draft');
    assert.equal(f.location.pathname,'/chat/sn-julian');
    assert.match(q('.sg-chat-intro').textContent,/2:15 AM.*two sedans/s);
    assert.match(q('.sg-chat-stage').getAttribute('style'),/p5.webp/);
    assert.equal(f.requests.filter(([,method])=>method==='POST').length,0);
    await f.click('[data-control=send]');
    await waitFor(()=>f.chatBodies.length===1,'explicit send did not reach the mock chat transport');
    assert.equal(f.chatBodies[0].titleId,'sn-julian');
    await f.click('[data-session-back]');
    await waitFor(()=>q('.sn-memory'));
    assert.equal(f.location.pathname,'/seven-nights');
    const funnel=sent.filter(([name])=>name.startsWith('living_manga_'));
    assert.deepEqual(funnel.map(([name])=>name),['viewed','engaged','decision','episode_completed','decision','episode_completed','interlude_click','chat_turn','theater_viewed'].map(k=>'living_manga_'+k));
    assert.deepEqual(funnel.map(([,p])=>Object.keys(p).sort().join(' ')),[
      'episode_id lang viewport','episode_id input_method','branch_id episode_id input_kind lang',
      'branch_id episode_id lang','branch_id episode_id input_kind lang','branch_id episode_id lang','branch_id character_id episode_id','character_id episode_id turn_index','lang series_id viewport']);
    assert.equal(funnel[4][1].input_kind,'free');
    assert.equal(funnel[7][1].turn_index,1);
    assert.ok(!JSON.stringify(sent).includes('private'));
  } finally { clearInterval(f.window.carousel); }
});
