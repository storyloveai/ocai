import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPrompt} from '../server/prompt-engine.js';
import {catalogPrompt,validateCatalog,CATALOG_PROMPT_VERSION} from '../server/catalog-writing.js';
test('catalogue authoring accepts only original seed IDs and preserves existing prose authoring',()=>{
 const p=buildPrompt({task:'author',field:'details',format:'catalog',catalogId:'storydate-story-001',type:'story',idea:'one line'});
 assert.equal(p.mode,'author-catalog');assert.equal(p.promptVersion,CATALOG_PROMPT_VERSION);assert.match(p.system,/500–800字/);assert.match(p.system,/21 岁以上/);assert.match(p.system,/不替玩家/);assert.match(p.system,/互相牵制/);
 assert.throws(()=>catalogPrompt('unknown'));assert.throws(()=>buildPrompt({task:'author',field:'details',format:'catalog',catalogId:'storydate-story-001',type:'character',idea:'one line'}));
 assert.throws(()=>buildPrompt({task:'author',field:'opening',format:'catalog',catalogId:'storydate-story-001',type:'story',idea:'one line'}));
 const prose=buildPrompt({task:'author',field:'opening',type:'story',idea:'一句话'});assert.equal(prose.mode,'author');assert.match(prose.system,/no preamble, labels, JSON/);
});
test('catalogue validation rejects incomplete prose, minor cast, duplicate options and inconsistent images',()=>{
 const {seed}=catalogPrompt('storydate-story-001');
 const cast=[{name:'岑舟',age:28,role:'r',appearance:'a',voice:'v',goal:'g',contradiction:'c',relationshipWithPlayer:'p'},{name:'林棠',age:27,role:'r',appearance:'a',voice:'v',goal:'g',contradiction:'c',relationshipWithPlayer:'p'}];
 const valid={title:seed.title,titleZh:seed.titleZh,shortDescription:'简介'.repeat(20),description:'世界'.repeat(500),prologue:'序章'.repeat(180),startingScenario:'深夜绘图室',opening:'开场'.repeat(260),playGuide:'玩法'.repeat(100),narratorPrompt:'提示'.repeat(200),coverPrompt:'English scene '.repeat(30),openingSuggestions:['我先观察窗外的灯火。','我问他手中的地图从何而来。','我把那封信放回桌上，等待解释。'],storyBible:{setting:'s',playerRole:'p',coreConflict:'c',relationshipArc:'r',styleNotes:'s',secrets:['1','2','3'],continuityRules:['1','2','3','4','5']},cast,galleryScenes:[1,2,3].map(slot=>({slot,title:'t',caption:'c',characters:['岑舟'],prompt:'English scene'}))};
 assert.equal(validateCatalog(valid,seed).cast[0].age,28);
 for(const mutate of [x=>x.description='too short',x=>x.cast[0].age=17,x=>x.openingSuggestions[1]=x.openingSuggestions[0],x=>x.galleryScenes[0].characters=['unknown'],x=>x.storyBible.continuityRules=[]]){const bad=structuredClone(valid);mutate(bad);assert.throws(()=>validateCatalog(bad,seed));}
});
