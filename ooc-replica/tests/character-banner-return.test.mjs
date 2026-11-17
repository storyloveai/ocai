import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {boot, waitFor} from './fixtures/character-loop-dom.mjs';
import {cloudKey} from '../dist/assets/account-storage.js';
import {createAccount} from '../dist/assets/account.js';
import {storydateCharacters} from '../dist/assets/storydate-originals.js';

const id='sgc-007',key='ooc-session-v2-'+id,draftKey='ooc-composer-draft-'+id+'-main';
const existing=[{role:'user',text:'上次聊到长廊。'},{role:'assistant',text:'“我还记得。”'}];
const entries=[[key,JSON.stringify(existing)],['ooc-session-v2-oc-shen-yanzhou',JSON.stringify(existing)]];
const apiCalls=f=>f.requests.filter(([path])=>path.startsWith('/api/'));
const read=(f,key)=>JSON.parse(f.values.get(key)||'null');
const input=f=>f.document.querySelector('#session-input');
function edit(f,text,target=input(f)){
  target.value=text;target.dispatchEvent(new f.window.Event('input',{bubbles:true}));
}
async function reload({path,entries}){
  // The existing fixture owns the fresh-app worker lifecycle. Add a read-only
  // composer snapshot to its result instead of booting a second app beside it.
  const worker=new Worker(`
    const {parentPort,workerData}=require('node:worker_threads');
    const post=parentPort.postMessage.bind(parentPort);
    parentPort.postMessage=result=>post({...result,
      input:globalThis.document?.querySelector('#session-input')?.value,
      search:globalThis.location?.search,
      choices:globalThis.document?.querySelectorAll('[data-banner-use],[data-banner-keep]').length||0,
      hint:globalThis.document?.querySelector('[data-banner-reply]')?.textContent||''});
    import(workerData.fixture).catch(error=>post({error:error.stack}));
  `,{eval:true,workerData:{fixture:new URL('./fixtures/character-loop-dom.mjs',import.meta.url).href,path,entries}});
  try{
    const result=await new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);worker.once('exit',code=>{if(code)reject(Error('reload worker exited '+code));});});
    assert.equal(result.error,undefined,result.error);return result;
  }finally{await worker.terminate();}
}

test('character replies preserve device drafts and hand off featured text once without bypassing service gates',async t=>{
  const f=await boot({path:'/characters',entries});
  const opening='谁在听？';
  try{
    await t.test('a returning banner reply becomes a focused, unsent draft and survives navigation and reload',async()=>{
      await f.go('/play/'+id+'?source=feature&say='+encodeURIComponent(opening)+'#reply');
      await waitFor(()=>input(f)?.value===opening,'featured reply was not put in the existing conversation');
      assert.equal(f.location.search,'?source=feature');assert.equal(f.location.hash,'#reply');
      assert.equal(f.document.activeElement,input(f));
      assert.match(f.document.querySelector('[data-banner-reply]').textContent,/尚未发送|not sent/i);
      assert.deepEqual(read(f,key),existing,'preparing a draft never rewrites existing messages');
      assert.equal(read(f,draftKey).text,opening);assert.equal(cloudKey(draftKey),false);
      assert.deepEqual(apiCalls(f),[['/api/config','GET']]);
      await f.go('/characters/sg-diaochan');await f.go('/play/'+id);
      await waitFor(()=>input(f)?.value===opening,'returning from the profile discarded the draft');
      const restored=await reload({path:'/play/'+id,entries:[...f.values],expected:opening});
      assert.equal(restored.search,'');assert.match(restored.hint,/尚未发送|not sent/i);
      assert.deepEqual(restored.requests.filter(([path])=>path.startsWith('/api/')),[['/api/config','GET']]);
      assert.deepEqual(JSON.parse(new Map(restored.entries).get(key)),existing);
    });

    await t.test('a second featured reply never silently replaces an existing draft',async()=>{
      const next='我只是来问你的。';
      await f.go('/play/'+id+'?say='+encodeURIComponent(next));
      assert.equal(input(f).value,opening);
      assert.ok(f.document.querySelector('[data-banner-reply]').textContent.includes(next));
      const undecided=await reload({path:'/play/'+id,entries:[...f.values]});
      assert.equal(undecided.input,opening);assert.ok(undecided.hint.includes(next));assert.equal(undecided.choices,2);
      await f.go('/characters/sg-diaochan');await f.go('/play/'+id);
      assert.equal(input(f).value,opening);assert.ok(f.document.querySelector('[data-banner-use]'));
      assert.equal(read(f,draftKey).incoming,next,'an undecided incoming reply survives route teardown');
      await f.click('[data-banner-keep]');assert.equal(input(f).value,opening);
      assert.equal(f.document.querySelector('[data-banner-use]'),null);
      assert.equal(read(f,draftKey).incoming,undefined);
      await f.go('/play/'+id+'?say='+encodeURIComponent(next));
      await f.click('[data-banner-use]');assert.equal(input(f).value,next);
      assert.equal(read(f,draftKey).incoming,undefined);
      assert.equal(read(f,draftKey).text,next);assert.deepEqual(read(f,key),existing);
      edit(f,'  我想换个问题，先陪我走一段 🥀。  ');
      const restored=await reload({path:'/play/'+id,entries:[...f.values],expected:input(f).value});
      assert.equal(restored.input,input(f).value,'edits, whitespace and Unicode remain literal');
      edit(f,'   ');assert.equal(read(f,draftKey),null);assert.equal(f.document.querySelector('[data-banner-reply]'),null);
      const cleared=await reload({path:'/play/'+id,entries:[...f.values]});assert.equal(cleared.input,'');
      assert.deepEqual(read(f,key),existing);assert.deepEqual(apiCalls(f),[['/api/config','GET']]);
    });

    await t.test('ordinary composer text survives a visit to a story, and a different role receives none of it',async()=>{
      edit(f,'先写半句。');input(f).focus();
      const draftStatus=f.document.querySelector('[data-banner-reply]').firstElementChild;
      const availabilityButton=f.document.querySelector('[data-check-ai]');
      edit(f,'这句普通草稿还没发送。');
      assert.equal(f.document.querySelector('[data-banner-reply]').firstElementChild,draftStatus,'typing does not continually replace and reannounce the same draft status');
      assert.equal(f.document.querySelector('[data-check-ai]'),availabilityButton,'typing does not replace the service retry control');
      assert.equal(f.document.activeElement,input(f),'typing keeps focus in the composer');
      await f.go('/play/xichuan');await f.go('/play/'+id);
      assert.equal(input(f).value,'这句普通草稿还没发送。');
      await f.go('/play/sgc-001');await waitFor(()=>input(f),'other character did not mount');
      assert.equal(input(f).value,'');
      await f.go('/play/'+id);assert.equal(input(f).value,'这句普通草稿还没发送。');
      assert.deepEqual(read(f,key),existing);
    });

    await t.test('an unavailable service keeps both returning and first-time banner text pending without a doomed request',async()=>{
      assert.ok(f.document.querySelector('[data-ai-availability]'));
      assert.equal(f.document.querySelector('[data-control="send"]').disabled,true);
      await f.click('[data-control="send"]');assert.deepEqual(read(f,key),existing);
      await f.go('/play/sgc-008?say='+encodeURIComponent('初次见面。'));
      await waitFor(()=>input(f)?.value==='初次见面。','first-time unavailable reply was discarded');
      assert.equal(read(f,'ooc-session-v2-sgc-008'),null);
      assert.equal(f.document.querySelector('[data-control="send"]').disabled,true);
      assert.deepEqual(apiCalls(f),[['/api/config','GET']]);
      await f.go('/play/'+id);
    });

    await t.test('demo model control changes the real response mode without offering fictional quality tiers or empty notifications',async()=>{
      f.values.set('ooc-model-tier',JSON.stringify('Superb'));
      await f.go('/play/story-005');await waitFor(()=>input(f),'ordinary demo did not mount');
      const before=apiCalls(f).filter(([,method])=>method==='POST');
      const model=f.document.querySelector('[data-control="model"]');
      assert.match(model.textContent,/演示对话|Demo replies/);
      const sidebar=f.document.querySelector('[data-shrink]');assert.ok(sidebar);
      assert.doesNotMatch(sidebar.textContent,/Notifications|通知/);
      await f.click('[data-control="model"]');
      const mode=f.document.querySelector('.interaction-modal[open] select[aria-label="Response mode"]');
      assert.ok(mode,'the actual mode selector opens');
      assert.equal(mode.querySelector('option[value="ai"]').hasAttribute('disabled'),true,'unavailable AI is still gated');
      assert.equal(f.document.querySelector('[data-tier]'),null);
      await f.click('.interaction-modal[open] .save');
      assert.equal(read(f,'ooc-model-tier'),'Superb','retiring the picker does not delete old preferences');
      assert.deepEqual(apiCalls(f).filter(([,method])=>method==='POST'),before);
      await f.go('/play/'+id);
    });

    await t.test('retry checks public configuration only, and a recovered service still honors the existing login gate',async()=>{
      const fetchBefore=globalThis.fetch;
      await f.go('/play/'+id+'?say='+encodeURIComponent('检查状态前带来的新回复。'));
      globalThis.fetch=async(path,options)=>{
        if(path==='/api/config'){
          f.requests.push([path,'GET']);
          return Response.json({configured:true,model:'Local fixture',auth:null,billing:{enabled:true,prices:{standard:2}}});
        }
        return fetchBefore(path,options);
      };
      try{
        const before=apiCalls(f).length;
        await f.click('[data-check-ai]');
        await waitFor(()=>!f.document.querySelector('[data-ai-availability]'),'public configuration did not refresh');
        assert.equal(input(f).value,'这句普通草稿还没发送。');
        assert.equal(read(f,draftKey).incoming,'检查状态前带来的新回复。');
        assert.ok(f.document.querySelector('[data-banner-use]'),'checking availability preserves an unresolved reply choice');
        assert.deepEqual(apiCalls(f).slice(before),[['/api/config','GET']],'checking availability does not call a model or a wallet');
        assert.equal(f.document.querySelector('[data-control="send"]').disabled,false);
        await f.click('[data-control="send"]');
        await waitFor(()=>f.document.querySelector('.interaction-modal[open]'),'login gate did not appear');
        assert.equal(input(f).value,'这句普通草稿还没发送。');
        assert.equal(read(f,draftKey).text,input(f).value);assert.deepEqual(read(f,key),existing);
        assert.ok(apiCalls(f).slice(before).every(([path,method])=>path==='/api/config'&&method==='GET'),'a guest cannot get past the normal credit/login preparation or call a model');
        await f.go('/play/sgc-006?say='+encodeURIComponent('初次相遇也要留下这句话。'));
        await waitFor(()=>f.document.querySelector('.interaction-modal[open]'),'a new paid conversation did not use the login gate');
        assert.equal(input(f).value,'初次相遇也要留下这句话。','a rejected first request keeps the featured reply as a draft');
        assert.equal(read(f,'ooc-session-v2-sgc-006'),null);
        assert.equal(read(f,'ooc-composer-draft-sgc-006-main').text,input(f).value);
        assert.ok(apiCalls(f).slice(before).every(([path,method])=>path==='/api/config'&&method==='GET'));
      }finally{globalThis.fetch=fetchBefore;}
    });

    await t.test('a new demo conversation keeps the first-reply behavior, and explicit sends consume a draft once',async()=>{
      const opening='第一次来潮声影院。',chatKey='ooc-session-v2-xc-zhiyao',deviceKey='ooc-composer-draft-xc-zhiyao-main';
      const before=apiCalls(f).length;
      await f.go('/play/xc-zhiyao?say='+encodeURIComponent(opening));
      await waitFor(()=>read(f,chatKey)?.at(-1)?.role==='assistant'&&!read(f,chatKey).at(-1).streaming,'new local conversation did not finish',5000);
      assert.equal(read(f,chatKey).filter(m=>m.role==='user'&&m.text===opening).length,1);
      assert.equal(read(f,chatKey).at(-1).transport,'demo');assert.equal(f.location.search,'');
      edit(f,'我还想再聊一句。');assert.equal(read(f,deviceKey).text,input(f).value);
      await f.click('[data-control="send"]');
      await waitFor(()=>read(f,chatKey)?.filter(m=>m.role==='user').length===2&&read(f,chatKey).at(-1)?.role==='assistant'&&!read(f,chatKey).at(-1).streaming,'explicit local send did not finish',5000);
      assert.equal(input(f).value,'');assert.equal(read(f,deviceKey),null);
      const restored=await reload({path:'/play/xc-zhiyao',entries:[...f.values]});
      const messages=JSON.parse(new Map(restored.entries).get(chatKey));
      assert.equal(restored.input,'');assert.equal(messages.filter(m=>m.role==='user'&&m.text===opening).length,1);
      assert.equal(messages.filter(m=>m.role==='user'&&m.text==='我还想再聊一句。').length,1);
      assert.deepEqual(apiCalls(f).slice(before),[],'the demo and its draft never call a model or a wallet');
      assert.deepEqual(restored.requests.filter(([path])=>path.startsWith('/api/')),[['/api/config','GET']]);
    });

    await t.test('branch switches and a stale former input cannot overwrite another branch draft',async()=>{
      await f.go('/play/oc-shen-yanzhou');await waitFor(()=>input(f),'original character did not mount');
      edit(f,'只留在原来走向里的草稿。');
      const previousInput=input(f),originalKey='ooc-composer-draft-oc-shen-yanzhou-main';
      await f.click('[data-character-fork="1"]');
      assert.equal(input(f).value,'');
      const active=read(f,'ooc-session-v2-oc-shen-yanzhou-threads').active;
      assert.notEqual(active,'main');
      edit(f,'新走向自己的草稿。');
      const branchKey='ooc-composer-draft-oc-shen-yanzhou-'+active;
      edit(f,'旧页面的迟到输入。',previousInput);
      assert.equal(read(f,originalKey).text,'只留在原来走向里的草稿。');
      assert.equal(read(f,branchKey).text,'新走向自己的草稿。');
      await f.click('[data-character-branches]');await f.click('[data-select-branch="main"]');
      assert.equal(input(f).value,'只留在原来走向里的草稿。');
    });

    await t.test('supplemental memories explain their real limit without silently truncating older notes',async()=>{
      const memoryKey='ooc-Memories-oc-shen-yanzhou',long='旧说明'.repeat(150);
      f.values.set(memoryKey,JSON.stringify(long));
      await f.click('[data-control="settings"]');
      await f.click('[data-session-setting="Memories"]');
      const d=f.document.querySelector('.interaction-modal[open]'),field=d.querySelector('textarea'),save=d.querySelector('.save');
      assert.equal(field.getAttribute('maxlength'),'350');assert.equal(field.value,long);
      assert.match(d.textContent,/350/);assert.match(d.textContent,/记住/);assert.equal(save.disabled,true);
      assert.equal(read(f,memoryKey),long,'opening an older note does not rewrite it');
      field.value='喜欢傍晚散步。';field.dispatchEvent(new f.window.Event('input',{bubbles:true}));
      assert.equal(save.disabled,false);await f.click('.interaction-modal[open] .save');
      assert.equal(read(f,memoryKey),'喜欢傍晚散步。');
      const storyKey='ooc-Memories-story-005',storyNote='原'.repeat(500);
      f.values.set(storyKey,JSON.stringify(storyNote));
      await f.go('/play/story-005');await waitFor(()=>input(f),'ordinary story did not mount');
      await f.click('[data-control="settings"]');await f.click('[data-session-setting="Memories"]');
      const storyDialog=f.document.querySelector('.interaction-modal[open]'),storyField=storyDialog.querySelector('textarea');
      assert.equal(storyField.getAttribute('maxlength'),'4000');assert.equal(storyField.value,storyNote);
      assert.equal(storyDialog.querySelector('.save').disabled,false);
      assert.doesNotMatch(storyDialog.textContent,/350|记住|Remember/);
      await f.click('.interaction-modal[open] .save');assert.equal(read(f,storyKey),storyNote);
    });

    await t.test('a signed-in account and old scope never read or write another account draft',async()=>{
      let subscribe;
      const client={subscribe:fn=>subscribe=fn,load:async uid=>[[key,[{role:'user',text:uid+' existing conversation'}]]],save:async()=>{}};
      const account=createAccount({storage:f.storage,fetchImpl:async()=>Response.json({auth:{config:{},providers:{}}}),loadClient:async()=>({connectFirebase:async()=>client})});
      await account.init();await subscribe({uid:'alice'});
      const interaction=await import('../dist/assets/interaction.js');
      const helpers=()=>({...account.scope(),data:storydateCharacters,categories:[],navigate(){},show(){}});
      f.window.history.replaceState({},'', '/play/'+id);
      interaction.show('/play/'+id,helpers());edit(f,'Alice private draft');const stale=input(f);
      assert.equal(account.read(draftKey,null).text,'Alice private draft');
      await subscribe({uid:'bob'});edit(f,'late Alice draft',stale);
      assert.equal(account.read(draftKey,null),null,'old helpers never write into Bob’s scope');
      interaction.show('/play/'+id,helpers());assert.equal(input(f).value,'');
      edit(f,'Bob private draft');await subscribe({uid:'alice'});
      interaction.show('/play/'+id,helpers());assert.equal(input(f).value,'Alice private draft');
      await subscribe({uid:'bob'});interaction.show('/play/'+id,helpers());assert.equal(input(f).value,'Bob private draft');
      assert.equal(cloudKey(draftKey),false);
    });
  }finally{
    const interaction=await import('../dist/assets/interaction.js');interaction.show('/no-session',{});clearInterval(f.window.carousel);
  }
});
