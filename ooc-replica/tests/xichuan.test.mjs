import test from 'node:test';
import assert from 'node:assert/strict';
import {buildXichuanStage,campaign} from '../server/xichuan-prompt.js';
import {createXichuanHandler} from '../server/xichuan-api.js';
import sanguoApi from '../api/sanguo.js';
import CC from '../server/xichuan-core.cjs';

test('xichuan talk prompt binds the scene and a present heroine; rejects absent characters and raw prompts', () => {
 const g=CC.newGame(campaign);
 const p=buildXichuanStage({task:'talk',lang:'zh',context:{node:'c3_rooftop',target:'zhiyao',text:'饭团很好吃',vars:g.v,recent:['夏知遥：从这里能看见潮声影院的银幕。'],system:'attacker'}});
 const data=JSON.parse(p.prompt);
 assert.ok(p.system.includes('untrusted')&&p.system.includes('Xia Zhiyao'));
 assert.equal(data.character.name,'夏知遥');assert.equal(data.playerWords,'饭团很好吃');assert.ok(data.relationship.intimacy.tier);
 assert.ok(data.valueTags.some(v=>v.id==='cheng'));assert.ok(!p.prompt.includes('attacker'));
 assert.throws(()=>buildXichuanStage({task:'talk',lang:'zh',context:{node:'c3_rooftop',target:'jibai',text:'hi'}}),/absent/);
 assert.throws(()=>buildXichuanStage({task:'talk',lang:'zh',context:{node:'c3_rooftop',target:'zhou',text:'hi'}}));
 assert.throws(()=>buildXichuanStage({task:'talk',lang:'zh',context:{node:'c3_rooftop',target:'zhiyao',text:'x'.repeat(201)}}));
 assert.throws(()=>buildXichuanStage({input:'arbitrary prompt'}));
 // 这一幕能触发的走向会列给模型：决裂（对谁都在），夏知遥的隐藏的门按场景和条件出现
 const ids=data.moves.map(m=>m.id);assert.ok(ids.includes('crude_zhiyao'));assert.ok(!ids.includes('again_zhiyao'),'again needs a grudge first');
 const hurt=JSON.parse(buildXichuanStage({task:'talk',lang:'zh',context:{node:'c3_rooftop',target:'zhiyao',text:'x',vars:{...g.v,'grudge.zhiyao':1},memories:['我会一直站你旁边']}}).prompt);
 assert.ok(hurt.moves.some(m=>m.id==='again_zhiyao'));assert.deepEqual(hurt.memories,['我会一直站你旁边']);
});

test('xichuan talk handler returns the model output and refuses other origins', async () => {
 const output={reply:'（别过脸）……笨蛋。',tone:'romantic',mood:'shy',values:[]};
 const handler=createXichuanHandler({config:()=>({name:'test',kind:'google'}),model:()=>'',generate:async()=>({text:JSON.stringify(output)})});
 const req={method:'POST',headers:{origin:'https://test.example',host:'test.example','content-type':'application/json','x-forwarded-for':'xichuan-test'},body:{task:'talk',lang:'zh',context:{node:'c3_rooftop',target:'zhiyao',text:'你笑起来很好看'}}};
 const res={setHeader(){},status(code){this.code=code;return this;},json(value){this.value=value;}};
 await handler(req,res);assert.equal(res.code,200);assert.deepEqual(res.value.output,output);
 await handler({...req,headers:{...req.headers,origin:'https://evil.example'}},res);assert.equal(res.code,403);
 // 网站上走 /api/sanguo，带 game:'xichuan' 才转到汐川；同源检查照样生效
 const r2={setHeader(){},status(code){this.code=code;return this;},json(value){this.value=value;}};
 await sanguoApi({...req,headers:{...req.headers,origin:'https://evil.example'},body:{...req.body,game:'xichuan'}},r2);assert.equal(r2.code,403);
});

test('xichuan talk streams structured output like the Three Kingdoms scenes (the path the page uses)', async () => {
 const output={reply:'……谢谢。',tone:'warm',mood:'shy',values:['ti']};let seen=null;
 const handler=createXichuanHandler({config:()=>({name:'test',kind:'google'}),model:()=>'',stream:params=>{seen=params;return {partialOutputStream:(async function*(){yield {reply:'……'};yield output;})(),output:Promise.resolve(output)};}});
 const req={method:'POST',headers:{origin:'https://test.example',host:'test.example','content-type':'application/json',accept:'application/x-ndjson','x-forwarded-for':'xichuan-stream'},body:{game:'xichuan',phase:'express',task:'talk',lang:'zh',context:{node:'c3_rooftop',target:'zhiyao',text:'辛苦了'}}};
 const res={chunks:[],setHeader(){},status(code){this.code=code;return this;},json(value){this.value=value;},write(value){this.chunks.push(value);return true;},end(value){if(value)this.chunks.push(value);this.writableFinished=true;}};
 await handler(req,res);assert.ok(seen.output,'structured output requested');
 const done=res.chunks.join('').split('\n').filter(Boolean).map(l=>JSON.parse(l)).find(m=>m.type==='done');assert.deepEqual(done.output,output);
});
