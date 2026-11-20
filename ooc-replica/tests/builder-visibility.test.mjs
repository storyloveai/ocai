import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML,DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {titlesHandler} from '../server/titles.js';

const dist=fileURLToPath(new URL('../dist/',import.meta.url));
test('saved visibility is pending until remote success, and stale leave dialogs cannot write into another account',async()=>{
 const {document,window}=parseHTML('<html><head><link href="/style.css"></head><body><dialog id="modal"></dialog></body></html>');
 const append=window.HTMLElement.prototype.append;window.HTMLElement.prototype.append=function(...nodes){const result=append.apply(this,nodes);for(const node of nodes)if(node.tagName==='LINK')queueMicrotask(()=>node.onload?.());return result;};
 window.HTMLElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new window.Event('close'));};
 const location={pathname:'/builder/story/draft-visibility-example',search:'',origin:'https://replica.example'};
 Object.assign(globalThis,{document,window,DOMParser,location,matchMedia:()=>({matches:true}),fetch:async path=>path==='/api/config'?Response.json({billing:{enabled:false}}):new Response(await readFile(join(dist,path)))});
 const id='u-visibility-example',remote=new Map([[id,{id,type:'story',title:'Public story',description:'Existing intro',details:'Existing canon',opening:'Existing opening',visibility:'public',ownerUid:'alice'}]]);
 const db={collection:()=>({doc:key=>({get:async()=>({exists:remote.has(key),data:()=>remote.get(key)}),set:async value=>remote.set(key,value),delete:async()=>remote.delete(key)})})};
 const services=()=>({db,auth:{verifyIdToken:async()=>({uid:'alice',name:'Alice'})}}),env={FIREBASE_PROJECT_ID:'fixture',FIREBASE_CLIENT_EMAIL:'fixture',FIREBASE_PRIVATE_KEY:'fixture'};
 const accounts=new Map([['alice',new Map([['ooc-custom',[{id:'draft-visibility-example',publishedId:id,type:'story',title:'Public story',description:'Existing intro',details:'Existing canon',opening:'Existing opening',status:'published',visibility:'public'}]]])],['bob',new Map()]]);
 let owner='alice',failUnpublish=true;const calls=[],writes=[];
 const account={user:{uid:owner},api:async(path,body)=>{calls.push(body.action);if(body.action==='unpublish'&&failUnpublish)throw Error('Try again');const response={setHeader(){},status(code){this.code=code;return this;},json(value){this.body=value;return this;}};await titlesHandler({method:'POST',headers:{host:'replica.example',origin:'https://replica.example',authorization:'Bearer fixture'},body},response,env,services);if(response.code!==200)throw Error(response.body.error);return response.body;}};
 const h={read:(key,fallback)=>accounts.get(owner).get(key)??fallback,save:(key,value)=>{writes.push([owner,key]);accounts.get(owner).set(key,structuredClone(value));},navigate(){},data:[],categories:[],account,show(html){const d=document.querySelector('#modal');d.innerHTML=html;d.setAttribute('open','');}};
 const {showBuilder,normalizeDraft,guardBuilderLeave,hasUnsavedBuilderChanges,syncBuilderAccount,releaseBuilder}=await import('../dist/assets/builder.js');
 const selectPrivate=()=>{document.querySelectorAll('[name=visibility]').forEach(input=>input.removeAttribute('checked'));document.querySelector('[name=visibility][value=private]').setAttribute('checked','');};
 showBuilder(location.pathname,h);document.querySelector('[data-draft-review]').click();selectPrivate();document.querySelector('[data-review-save]').click();
 let local=accounts.get('alice').get('ooc-custom')[0];assert.equal(local.visibility,'public');assert.equal(local.pendingVisibility,'private');assert.equal(normalizeDraft(local).visibility,'public');assert.equal(remote.get(id).visibility,'public');assert.deepEqual(calls,[]);assert.match(document.querySelector('[data-draft-status]').textContent,/published version unchanged/);
 // Reopen from the saved record: the pending choice survives, while the true
 // published visibility still controls withdrawal and library status.
 showBuilder(location.pathname,h);document.querySelector('[data-draft-review]').click();assert.equal(document.querySelector('[name=visibility]:checked').value,'private');
 const publish=document.querySelector('[data-review-publish]');await publish.onclick();
 assert.deepEqual(calls,['unpublish']);assert.equal(publish.disabled,false);assert.match(document.querySelector('[data-publish-error]').textContent,/Try again/);
 assert.equal(remote.get(id).visibility,'public');assert.equal(accounts.get('alice').get('ooc-custom')[0].visibility,'public');assert.equal(document.querySelector('[data-published-play]'),null);
 failUnpublish=false;await publish.onclick();
 assert.deepEqual(calls,['unpublish','unpublish']);assert.equal(remote.has(id),false);local=accounts.get('alice').get('ooc-custom')[0];assert.equal(local.visibility,'private');assert.equal(local.status,'published');assert.equal(local.pendingVisibility,undefined);assert.ok(document.querySelector('[data-published-play]'));

 document.querySelector('#modal').close();const input=document.querySelector('[name=title]');input.value='Updated private experience';input.oninput();document.querySelector('[data-draft-save]').click();assert.match(document.querySelector('[data-draft-status]').textContent,/^Draft saved \d/);assert.doesNotMatch(document.querySelector('[data-draft-status]').textContent,/published version unchanged/);assert.equal(accounts.get('alice').get('ooc-custom')[0].title,'Updated private experience');
 input.value='Alice unsaved secret';input.oninput();assert.equal(hasUnsavedBuilderChanges(),true);
 let left=false;assert.equal(guardBuilderLeave(()=>{left=true;}),false);
 const originalSave=h.save;h.save=()=>{throw Error('quota');};document.querySelector('[data-save-leave]').onclick();
 assert.equal(left,false);assert.equal(hasUnsavedBuilderChanges(),true);assert.match(document.querySelector('[data-draft-status]').textContent,/Unable to save/);
 h.save=originalSave;document.querySelector('[data-cancel-leave]').onclick();assert.equal(guardBuilderLeave(()=>{left=true;}),false);const staleSave=document.querySelector('[data-save-leave]');
 const before=structuredClone([...accounts.get('alice')]);writes.length=0;owner='bob';account.user={uid:owner};
 assert.equal(hasUnsavedBuilderChanges(),false);showBuilder('/builder/story/new',h);staleSave.onclick();
 assert.equal(left,false);assert.deepEqual([...accounts.get('alice')],before);assert.equal(accounts.get('bob').has('ooc-custom'),false);assert.deepEqual(writes,[]);
 const bobTitle=document.querySelector('[name=title]');bobTitle.value='Keep Bob draft';bobTitle.oninput();
 const bobForm=document.querySelector('.builder-fields');
 account.busy=true;syncBuilderAccount();assert.equal(bobTitle.disabled,true);assert.equal(document.querySelector('.builder-fields'),bobForm);assert.match(document.querySelector('[data-draft-status]').textContent,/temporarily paused/);assert.equal(document.querySelector('[data-shrink] a[href="/characters"]').closest('[aria-busy=true]'),null);
 document.querySelector('[data-draft-save]').onclick();assert.equal(hasUnsavedBuilderChanges(),true);assert.equal(accounts.get('bob').has('ooc-custom'),false);assert.match(document.querySelector('[data-draft-status]').textContent,/not saved/);
 account.busy=false;account.restored=false;syncBuilderAccount();assert.equal(bobTitle.disabled,true);document.querySelector('[data-draft-save]').onclick();assert.equal(hasUnsavedBuilderChanges(),true);assert.equal(accounts.get('bob').has('ooc-custom'),false);
 account.restored=true;syncBuilderAccount();assert.equal(bobTitle.disabled,false);assert.equal(document.querySelector('.builder-fields'),bobForm);assert.equal(bobTitle.value,'Keep Bob draft');assert.equal(document.querySelector('[data-draft-status]').textContent,'Unsaved changes');
 const realSave=h.save;h.save=()=>{};document.querySelector('[data-draft-save]').click();assert.equal(hasUnsavedBuilderChanges(),true);assert.match(document.querySelector('[data-draft-status]').textContent,/not saved/);assert.equal(accounts.get('bob').has('ooc-custom'),false);
 h.save=realSave;document.querySelector('[data-draft-save]').click();assert.equal(hasUnsavedBuilderChanges(),false);assert.equal(accounts.get('bob').get('ooc-custom')[0].title,'Keep Bob draft');
 releaseBuilder();const unload=new window.Event('beforeunload',{cancelable:true});window.dispatchEvent(unload);assert.equal(unload.defaultPrevented,false);
});
