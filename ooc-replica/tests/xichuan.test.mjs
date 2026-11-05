import test from 'node:test';
import assert from 'node:assert/strict';
import {buildXichuanStage,campaign} from '../server/xichuan-prompt.js';
import {createXichuanHandler} from '../api/xichuan.js';
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
});

test('xichuan talk handler returns the model output and refuses other origins', async () => {
 const output={reply:'（别过脸）……笨蛋。',tone:'romantic',mood:'shy',values:[]};
 const handler=createXichuanHandler({config:()=>({name:'test',kind:'google'}),model:()=>'',generate:async()=>({text:JSON.stringify(output)})});
 const req={method:'POST',headers:{origin:'https://test.example',host:'test.example','content-type':'application/json','x-forwarded-for':'xichuan-test'},body:{task:'talk',lang:'zh',context:{node:'c3_rooftop',target:'zhiyao',text:'你笑起来很好看'}}};
 const res={setHeader(){},status(code){this.code=code;return this;},json(value){this.value=value;}};
 await handler(req,res);assert.equal(res.code,200);assert.deepEqual(res.value.output,output);
 await handler({...req,headers:{...req.headers,origin:'https://evil.example'}},res);assert.equal(res.code,403);
});
