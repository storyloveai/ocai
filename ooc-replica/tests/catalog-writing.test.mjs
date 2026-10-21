import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPrompt} from '../server/prompt-engine.js';
import {catalogPrompt,validateCatalog,normalizeCatalog,CATALOG_PROMPT_VERSION} from '../server/catalog-writing.js';
test('catalogue authoring accepts only original seed IDs and preserves existing prose authoring',()=>{
 const p=buildPrompt({task:'author',field:'details',format:'catalog',catalogId:'storydate-story-001',type:'story',idea:'one line'});
 assert.equal(p.mode,'author-catalog');assert.equal(p.promptVersion,CATALOG_PROMPT_VERSION);assert.match(p.system,/500–800字/);assert.match(p.system,/21 岁以上/);assert.match(p.system,/不替玩家/);assert.match(p.system,/互相牵制/);
 assert.throws(()=>catalogPrompt('unknown'));assert.throws(()=>buildPrompt({task:'author',field:'details',format:'catalog',catalogId:'storydate-story-001',type:'character',idea:'one line'}));
 assert.throws(()=>buildPrompt({task:'author',field:'opening',format:'catalog',catalogId:'storydate-story-001',type:'story',idea:'one line'}));
 const prose=buildPrompt({task:'author',field:'opening',type:'story',idea:'一句话'});assert.equal(prose.mode,'author');assert.match(prose.system,/no preamble, no markdown fences, no JSON/);
});
test('editorial normalization reuses generated canon and resolves only unambiguous names',()=>{
 const original={description:'简短介绍',storyBible:{setting:'有明确规则的世界',playerRole:'有自己任务的调查员',coreConflict:'修琴与查证争夺交付期限',relationshipArc:'互相信任但保留界限'},cast:[{name:'卡西安·里德',age:31},{name:'沈知微',age:23}],galleryScenes:[{slot:'1',characters:['卡西安','玩家']},{slot:'2',characters:['沈知微']},{slot:'3',characters:['unknown']}]};
 const {draft,adjustments}=normalizeCatalog(original);
 assert.match(draft.description,/有明确规则的世界/);assert.match(draft.description,/修琴与查证争夺交付期限/);
 assert.deepEqual(draft.galleryScenes[0].characters,['卡西安·里德','玩家（21岁以上，外观由用户设定）']);
 assert.equal(draft.galleryScenes[2].characters[0],'unknown','unresolved image-only references stay visible for separate image review');
 assert.equal(original.description,'简短介绍');assert.equal(original.galleryScenes[0].slot,'1');assert.equal(adjustments.length,2);
});
test('player dialogue is removed without deleting the surrounding scene or NPC question',()=>{
 const opening='墨迹停在门槛。\n\n“这门是什么？”你问。\n\n“今晚才出现。”他说。\n\n他看着你问：“你认识这枚硬币吗？”\n\n门缝里亮起一道冷光。';
 const {draft,adjustments}=normalizeCatalog({opening});
 assert.ok(!draft.opening.includes('这门是什么'));assert.match(draft.opening,/今晚才出现/);assert.match(draft.opening,/你认识这枚硬币吗/);assert.match(draft.opening,/门缝里亮起一道冷光/);assert.equal(adjustments[0].originalValue,opening);
});
test('catalogue validation rejects incomplete prose, minor cast, duplicate options and inconsistent images',()=>{
 const {seed}=catalogPrompt('storydate-story-001');
 const cast=[{name:'岑舟',age:28,role:'r',appearance:'a',voice:'v',goal:'g',contradiction:'c',relationshipWithPlayer:'p'},{name:'林棠',age:27,role:'r',appearance:'a',voice:'v',goal:'g',contradiction:'c',relationshipWithPlayer:'p'}];
 const valid={title:seed.title,titleZh:seed.titleZh,shortDescription:'简介'.repeat(20),description:'世界'.repeat(500),prologue:'序章'.repeat(180),startingScenario:'深夜绘图室',opening:'开场'.repeat(260),playGuide:'玩法'.repeat(100),narratorPrompt:'提示'.repeat(200),coverPrompt:'English scene '.repeat(30),openingSuggestions:['我先观察窗外的灯火。','我问他手中的地图从何而来。','我把那封信放回桌上，等待解释。'],storyBible:{setting:'s',playerRole:'p',coreConflict:'c',relationshipArc:'r',styleNotes:'s',secrets:['1','2','3'],continuityRules:['1','2','3','4','5']},cast,galleryScenes:[1,2,3].map(slot=>({slot,title:'t',caption:'c',characters:['岑舟'],prompt:'English scene'}))};
 assert.equal(validateCatalog(valid,seed).cast[0].age,28);
 for(const mutate of [x=>x.description='too short',x=>x.cast[0].age=17,x=>x.openingSuggestions[1]=x.openingSuggestions[0],x=>x.galleryScenes[0].characters='not an array',x=>x.storyBible.continuityRules=[]]){const bad=structuredClone(valid);mutate(bad);assert.throws(()=>validateCatalog(bad,seed));}
});
