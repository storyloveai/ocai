import test from 'node:test';
import assert from 'node:assert/strict';
import {boot,waitFor} from './fixtures/character-loop-dom.mjs';

const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test('real router protects dirty creation across links, Back, Forward and unload without clearing forward history',async()=>{
 const f=await boot({path:'/characters'}),{document,window,history,location}=f;
 const visit=async path=>{const a=document.createElement('a');a.href=path;a.setAttribute('data-full-info','');document.body.append(a);const e=new window.Event('click',{bubbles:true,cancelable:true});e.button=0;a.dispatchEvent(e);a.remove();await tick();};
 const edit=(key,value)=>{const input=document.querySelector(`.builder-fields [name="${key}"]`);input.value=value;input.dispatchEvent(new window.Event('input',{bubbles:true}));return input;};
 const unload=()=>{const e=new window.Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;};
 await f.click('[data-fw-world="xichuan"]');
 await f.click('[data-fw-world="sanguo"]');
 const sourceState=structuredClone(history.state),sourceUrl=location.pathname+location.search;
 assert.equal(typeof sourceState.storydatePosition,'number');
 await visit('/builder/story/new');
 const title=edit('title','Keep this draft'),form=document.querySelector('.builder-fields'),length=history.length;
 assert.equal(unload(),true);
 await visit('/characters');
 assert.equal(location.pathname,'/builder/story/new');assert.equal(history.length,length);assert.equal(document.querySelector('[name=title]'),title);
 await f.click('[data-cancel-leave]');assert.equal(document.querySelector('#modal').open,false);assert.equal(document.querySelector('.builder-fields'),form);
 await visit('/characters');
 const cancel=new window.Event('cancel',{cancelable:true});document.querySelector('#modal').dispatchEvent(cancel);assert.equal(cancel.defaultPrevented,false);document.querySelector('#modal').close();
 assert.equal(unload(),true,'Escape/native dialog close keeps edits dirty');
 await visit('/characters');
 const dialog=document.querySelector('#modal');dialog.getBoundingClientRect=()=>({left:10,right:200,top:10,bottom:200});
 const outside=new window.Event('click',{bubbles:true,cancelable:true});Object.assign(outside,{clientX:0,clientY:0,button:0});dialog.dispatchEvent(outside);
 assert.equal(dialog.open,false);assert.equal(document.querySelector('[name=title]'),title);assert.equal(unload(),true);

 history.back();await tick();
 assert.equal(location.pathname,'/builder/story/new');assert.ok(document.querySelector('[data-save-leave]'));assert.equal(history.length,length);
 await f.click('[data-cancel-leave]');
 assert.equal(document.querySelector('[name=title]'),title);assert.equal(title.value,'Keep this draft');
 history.back();await tick();await f.click('[data-save-leave]');
 assert.equal(location.pathname+location.search,sourceUrl);assert.equal(history.length,length);assert.equal(history.state.storydatePosition,sourceState.storydatePosition);
 assert.equal(history.state.from,sourceState.from);
 const saved=JSON.parse(f.values.get('ooc-custom'));assert.equal(saved[0].title,'Keep this draft');const builderPath='/builder/story/'+saved[0].id;
 history.forward();await tick();assert.equal(location.pathname,builderPath);assert.equal(document.querySelector('[name=title]').value,'Keep this draft');
 assert.equal(unload(),false);
 edit('title','Discard this change');history.back();await tick();await f.click('[data-discard-leave]');
 assert.equal(location.pathname+location.search,sourceUrl);assert.equal(JSON.parse(f.values.get('ooc-custom'))[0].title,'Keep this draft');assert.equal(unload(),false);
 history.forward();await tick();assert.equal(document.querySelector('[name=title]').value,'Keep this draft');

 await visit('/characters');const withForward=history.length;history.back();await tick();
 const changed=edit('title','Save on forward');history.forward();await tick();
 assert.equal(location.pathname,builderPath);assert.equal(document.querySelector('[name=title]'),changed);assert.equal(history.length,withForward);
 await f.click('[data-cancel-leave]');history.forward();await tick();await f.click('[data-save-leave]');
 assert.equal(location.pathname,'/characters');assert.equal(history.length,withForward);assert.equal(JSON.parse(f.values.get('ooc-custom'))[0].title,'Save on forward');
 assert.equal(unload(),false,'leaving releases the old unload listener');

 history.back();await tick();assert.equal(document.querySelector('[name=title]').value,'Save on forward');
 edit('description','A complete introduction');await f.click('[data-builder-step="1"]');edit('details','A world and original cast.');await f.click('[data-builder-step="2"]');edit('opening','The story begins.');
 await f.click('[data-draft-review]');await document.querySelector('[data-review-publish]').onclick();
 assert.ok(document.querySelector('[data-published-play]'),document.querySelector('#modal').textContent);assert.equal(unload(),false,'successful private publication saved the draft');
 await f.click('[data-published-play]');await waitFor(()=>document.querySelector('#session-input'),'published story did not open');
 assert.match(location.pathname,/^\/play\/u-/);assert.equal(document.querySelector('[data-save-leave]'),null);assert.equal(unload(),false);
 assert.equal(f.requests.some(([path,method])=>method==='POST'&&/\/api\/(chat|image|wallet|checkout)/.test(path)),false);
 await visit('/builder/character/new');assert.equal(unload(),false);edit('title','New independent draft');assert.equal(unload(),true);
 // Explicit account actions use the same departure decision before touching
 // auth. This fixture has no auth provider, so execution is observable as its
 // normal unavailable toast, without opening a real sign-in flow.
 const accountButton=async action=>{const b=document.createElement('button');b.dataset.action=action;b.textContent=action;document.body.append(b);const e=new window.Event('click',{bubbles:true,cancelable:true});e.button=0;b.dispatchEvent(e);b.remove();await tick();};
 document.querySelector('#toast').textContent='';await accountButton('login');assert.ok(document.querySelector('[data-save-leave]'));
 await f.click('[data-cancel-leave]');assert.equal(document.querySelector('#toast').textContent,'');assert.equal(unload(),true);
 await accountButton('login');await f.click('[data-save-leave]');assert.match(document.querySelector('#toast').textContent,/Firebase|账户服务/);
 assert.ok(JSON.parse(f.values.get('ooc-custom')).some(d=>d.title==='New independent draft'));assert.equal(unload(),false);
 edit('title','Do not lose on logout');document.querySelector('#toast').textContent='';await accountButton('logout');assert.ok(document.querySelector('[data-save-leave]'));
 await f.click('[data-cancel-leave]');assert.equal(document.querySelector('#toast').textContent,'');assert.equal(unload(),true);
 await accountButton('logout');await f.click('[data-save-leave]');await tick();assert.ok(JSON.parse(f.values.get('ooc-custom')).some(d=>d.title==='Do not lose on logout'));assert.equal(unload(),false);
 edit('title','Guard the guest account entry');
 await accountButton('account-profile');assert.ok(document.querySelector('[data-save-leave]'));await f.click('[data-cancel-leave]');assert.equal(unload(),true);
 await visit('/characters');await f.click('[data-discard-leave]');assert.equal(unload(),false);
});
