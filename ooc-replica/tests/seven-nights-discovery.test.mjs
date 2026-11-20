import test from 'node:test';
import assert from 'node:assert/strict';
import {boot,waitFor} from './fixtures/character-loop-dom.mjs';
import {roleFor} from '../server/roles.js';
import {seasonRole,sevenNightsRole} from '../server/seven-nights-role.js';
import {canonicalNightUrl,scenes} from '../dist/assets/seven-nights-character.js';

test('legacy URLs retain query and fragment; public Julian always gets the authored scene role',()=>{
  for(const [index,scene] of Object.keys(scenes).entries()){
    const n=index+1,legacy='/pilot/seven-nights'+(n===1?'':'/ep'+n);
    assert.equal(canonicalNightUrl(legacy+'?ref=card#panel'),'/seven-nights/ep'+n+'?ref=card#panel');
    const marks=['1:stand_ground','2:claim_name','3:close_distance'];
    const role=roleFor('sn-julian',{scene,impressions:marks});
    assert.deepEqual(role,seasonRole(scene,marks));
    for(const instruction of sevenNightsRole.direction)assert.ok(role.direction.includes(instruction));
  }
  assert.equal(canonicalNightUrl('/pilot/seven-nights-extra'),'/pilot/seven-nights-extra');
});

test('a guest can resume the unfinished episode and the last Julian scene through both history surfaces',async()=>{
  const f=await boot({path:'/characters',entries:[['sd.lang','en']]});
  const q=s=>f.document.querySelector(s);
  try {
    assert.equal(q('#fw-lib-results .fw-card').getAttribute('href'),'/chat/sn-julian');
    await f.click('#fw-lib-results .fw-card');await waitFor(()=>q('.sn-watch-series'));
    assert.equal(q('[data-session-back]').getAttribute('href'),'/seven-nights');
    await f.click('.sn-watch-series');await waitFor(()=>q('.sn-brand'));
    await f.click('.sn-brand');assert.equal(f.location.pathname,'/');
    await f.click('[data-story-card="sn-seven-nights"]');await waitFor(()=>q('.sn-theater'));
    await f.click('.sn-episode[href="/seven-nights/ep2"]');await waitFor(()=>q('[data-scene=p1]'));
    await f.go('/my-title');await f.click('.library-header a[href="/history"]');
    await f.click('[data-library-type=Story]');await f.click('.library-items a[href="/seven-nights"]');
    await waitFor(()=>q('.sn-hero .sn-primary'));
    assert.equal(q('.sn-hero .sn-primary').getAttribute('href'),'/seven-nights/ep2');
    await f.click('.sn-hero .sn-primary');await waitFor(()=>q('[data-lm-option]'));
    await f.click('[data-lm-option]');await f.click('[data-lm-character]');await waitFor(()=>q('.sn-watch-series'));
    await f.go('/history');await f.click('[data-library-type=Character]');
    assert.equal(q('.library-items a').getAttribute('href'),'/chat/sn-julian?scene=ep2_car');
    await f.click('.library-items a');await waitFor(()=>q('[data-chat-scene=ep2_car]'));
    await f.go('/');
    assert.ok(q('.shell-history-list a[href="/seven-nights"]'));
    await f.click('[data-history-mode=character]');
    assert.ok(q('.shell-history-list a[href="/chat/sn-julian?scene=ep2_car"]'));
    assert.deepEqual(f.requests.filter(([,method])=>method==='POST'),[]);
  } finally { clearInterval(f.window.carousel); }
});
