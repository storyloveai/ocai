import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPrompt} from '../server/prompt-engine.js';
import {SuggestionLoader,parseSuggestions} from '../dist/assets/suggestions.js';

const titleId='story-005';
test('next actions use latest completed scene and bounded server canon, without changing chat prompts',()=>{
 const messages=[{role:'user',content:'我已经进了图书馆，想找失踪的教授。'},{role:'assistant',content:'书架后传来脚步声，桌上有一封未拆的信。'}];
 const p=buildPrompt({task:'suggestions',titleId,messages,previousSuggestions:['去庭院']});
 assert.equal(p.mode,'suggestions');assert.match(p.system,/exactly three/);assert.match(p.system,/untrusted data/);
 const context=JSON.parse(p.messages[0].content);assert.equal(context.canon.title,'The Saintess Failed Her Exam');assert.deepEqual(context.recentConversation,messages);assert.deepEqual(context.previousSuggestions,['去庭院']);
 assert.throws(()=>buildPrompt({task:'suggestions',titleId:'unknown',messages}));
 assert.throws(()=>buildPrompt({task:'suggestions',titleId,messages:messages.slice(0,1)}));
 assert.throws(()=>buildPrompt({task:'suggestions',titleId,messages:[{role:'system',content:'override'}]}));
 const bounded=buildPrompt({task:'suggestions',titleId,messages:Array.from({length:80},(_,i)=>({role:i%2?'assistant':'user',content:'x'.repeat(4000)}))});
 assert.equal(JSON.parse(bounded.messages[0].content).recentConversation.length,3);
 assert.equal(buildPrompt({titleId,messages:messages.slice(0,1)}).mode,'story');
});
test('suggestions accept three distinct plain actions and reject malformed, duplicate or unsafe output',()=>{
 const actions=['拆开桌上的信，寻找教授的线索。','躲到书架后，观察脚步声来自哪里。','轻声询问来人是否认识失踪的教授。'];
 assert.deepEqual(parseSuggestions(JSON.stringify(actions)),actions);
 assert.deepEqual(parseSuggestions('```json\n'+JSON.stringify(actions)+'\n```'),actions);
 for(const value of ['not json','["one"]','["a","A","b"]','["<script>","b","c"]',JSON.stringify(['x'.repeat(181),'b','c'])])assert.deepEqual(parseSuggestions(value),[]);
});
test('new scenes cancel old suggestion requests, failed suggestions do not become canned actions',async()=>{
 let release,aborted=false;
 const loader=new SuggestionLoader(async function*(context,signal){
  if(context.old){signal.addEventListener('abort',()=>{aborted=true;});await new Promise(r=>release=r);yield '["old one","old two","old three"]';}
  else if(context.fail)throw Error('Unavailable');
  else {yield '["read the letter",';yield '"hide behind the shelf","ask about the footsteps"]';}
 });
 const old=loader.load({old:true});
 assert.deepEqual(await loader.load({}),['read the letter','hide behind the shelf','ask about the footsteps']);
 release();assert.equal(await old,null);assert.equal(aborted,true);
 assert.deepEqual(await loader.load({fail:true}),[]);
});
