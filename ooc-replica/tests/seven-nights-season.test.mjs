import test from 'node:test';
import assert from 'node:assert/strict';
import {boot,waitFor} from './fixtures/character-loop-dom.mjs';
import {nights,gateState} from '../dist/assets/living-manga/season.js';
import {resolveChoice} from '../dist/assets/living-manga/episode.js';
import {scrub} from '../dist/assets/analytics.js';
import {roleFor} from '../server/roles.js';
import {suggestionPrompt} from '../server/suggestion-prompt.js';
import {creditPolicy} from '../server/credit-policy.js';
import {createCredits} from '../server/credits.js';
import {database} from './helpers/credit-db.mjs';

test('season routes both languages and arbitrary player lines through the authored decision tree',()=>{
  const inputs=[
    [['your name','名下'],['ledger','暗账'],['leash','束缚']],
    [['no more secrets','联手'],['three years','三年'],['I choose','我自己决定']]
  ];
  for(const [i,ep] of nights.slice(1).entries()){
    for(const [j,opt] of ep.decision.options.entries()){
      assert.equal(resolveChoice(ep,{optionId:opt.id}).branchId,opt.id);
      for(const text of inputs[i][j])assert.equal(resolveChoice(ep,{text}).branchId,opt.id,text);
    }
    assert.equal(resolveChoice(ep,{text:'Silence.'}).branchId,'custom');
  }
});

test('only canonical scene and earned impression vocabulary enter Julian canon',()=>{
  for(const [scene,match] of [['ep1_study',/2:15 AM/],['ep2_car',/10:15 PM/],['ep3_balcony',/3:05 AM/],['__proto__',/2:15 AM/]]){
    const body={titleId:'sn-julian',scene,impressions:['2:claim_name','3:close_distance','PRIVATE_PAYLOAD'],messages:[{role:'assistant',content:'Hello.'}]};
    const canon=roleFor(body.titleId,body);
    assert.match(canon.publicPremise,match);
    const allowed=JSON.stringify(canon);
    assert.equal(allowed.includes('3:close_distance'),scene==='ep3_balcony');
    assert.ok(!allowed.includes('PRIVATE_PAYLOAD'));
    const suggestions=JSON.stringify(suggestionPrompt(body));assert.match(suggestions,match);assert.ok(!suggestions.includes('PRIVATE_PAYLOAD'));
  }
  for(const path of ['/seven-nights','/pilot/seven-nights/ep2','/pilot/seven-nights/ep3','/chat/sn-julian']){
    assert.equal(scrub({event:'$autocapture',properties:{$pathname:path,$el_text:'PRIVATE_PAYLOAD'}}),null);
  }
});

test('preview flag cannot open a paid season; repeated purchases debit one authoritative price',async()=>{
  const policy=creditPolicy({CREDIT_BILLING_MODE:'test'}), id='seven-nights-ep3';
  assert.equal(gateState(undefined,{},true),'unavailable');
  assert.equal(gateState(creditPolicy({}),null,false),'preview');
  assert.equal(gateState(creditPolicy({}),null,true),'open');
  assert.equal(gateState(policy,null,true),'login');
  const store=createCredits(database(),'test');
  assert.equal(gateState(policy,await store.read('reader'),true),'fund');
  await assert.rejects(store.unlockEpisode('reader',id,policy),{code:'INSUFFICIENT_CREDITS'});
  await store.purchase('reader','cs_test_fixture',200);
  assert.equal(gateState(policy,await store.read('reader'),false),'purchase');
  await Promise.all([store.unlockEpisode('reader',id,policy),store.unlockEpisode('reader',id,policy)]);
  const wallet=await store.read('reader');
  assert.equal(gateState(policy,wallet,false),'open');assert.equal(wallet.balance,185);
  assert.equal(wallet.ledger.filter(e=>e.type==='episode_unlock').length,1);
  assert.equal(gateState(policy,await store.read('other'),true),'fund');
});

test('three episodes return through their own chat to a remembered season hub without automatic posts',async()=>{
  const f=await boot({path:'/seven-nights',entries:[['sd.lang','en']]});
  const q=s=>f.document.querySelector(s);
  try{
    await waitFor(()=>q('.sn-rail'));assert.equal(q('.sn-rail').children.length,4);
    assert.deepEqual([...f.document.querySelectorAll('.sn-episode img')].map(img=>img.getAttribute('src')),nights.map(ep=>ep.assets.p4.image));
    assert.equal(q('.sn-brand img').alt,'StoryDate');
    for(const ep of nights){
      await f.go('/pilot/seven-nights'+(ep.number===1?'':'/ep'+ep.number));
      if(ep.number===3){await waitFor(()=>q('.sn-gate-copy .sn-primary'));await f.click('.sn-gate-copy .sn-primary');}
      await waitFor(()=>q('[data-scene=p2Full]'));await f.click('[data-lm-option]');
      assert.equal(q('.lm-interlude-heading h2').textContent,ep.interludeHeading.en);
      assert.equal(q('[aria-pressed=true][data-lm-option]').dataset.number,'01');
      assert.ok(q('.lm-toolbar > [data-lm-action=rain]').getAttribute('aria-label'));
      const a=q('[data-lm-character]');assert.ok(a.href.includes('scene='+ep.scene));assert.doesNotMatch(a.textContent,/→/);
      await f.click('[data-lm-character]');await waitFor(()=>q('.sg-chat-stage'));
      const art = ep.number === 1 ? 'p2.webp' : 'ep'+ep.number+'_p4.webp';
      assert.ok(q('.sg-chat-stage img').getAttribute('src').endsWith('/'+art));
      assert.ok(q('.sg-chat-stage').getAttribute('style').includes('/'+(ep.number===1?'p5.webp':art)));
      assert.equal(q('.sg-chat-tagline').textContent,['The key is yours.','Lock your door and sit closer.','Watch the harbor burn.'][ep.number-1]);
      assert.match(q('.sg-chat-intro').textContent,[/2:15 AM/,/10:15 PM/,/3:05 AM/][ep.number-1]);
      assert.ok(q('#session-settings [data-control=model]'));
      const chips=f.document.querySelectorAll('[data-film-line]');
      assert.equal(chips.length,2);
      await f.click('[data-film-line]');
      assert.equal(q('#session-input').value,chips[0].textContent);
      assert.match(q('[data-banner-reply]').textContent,/Ready to send/);
      await f.click('[data-session-back]');await waitFor(()=>q('.sn-memory'));
      assert.ok(q('.sn-memory').textContent.includes(ep.branches[ep.decision.options[0].id].consequenceTags[0].en));
    }
    assert.equal(f.requests.filter(([,method])=>method==='POST').length,0);
  } finally {clearInterval(f.window.carousel);}
});
