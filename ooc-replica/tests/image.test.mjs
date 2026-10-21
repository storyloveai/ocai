import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{imageConfig,imagePrompt} from '../api/image.js';
test('image config reads the OpenAI key/model names and falls back to an image model',()=>{
 assert.equal(imageConfig({}),null);
 assert.deepEqual(imageConfig({OPENAI_API_KEY:'k',OPENAI_MODEL:'gpt-image-1.5'}),{key:'k',model:'gpt-image-1.5'});
 assert.equal(imageConfig({OPENAI_API_KEY:'k',OPENAI_MODEL:'gpt-4o'}).model,'gpt-image-1');
 assert.equal(imageConfig({'OpenAI API Key':'k2'}).key,'k2');
});
test('image prompt forbids text and keeps user direction',()=>{
 const p=imagePrompt({type:'story',title:'雾城',prompt:'钟楼与雾'});
 assert.match(p,/no text/i);assert.match(p,/钟楼与雾/);
 assert.throws(()=>imagePrompt({type:'x',prompt:'a'}));assert.throws(()=>imagePrompt({type:'story',prompt:'  '}));
});
test('image endpoint is same-origin only and reports missing configuration',async()=>{
 const reply=()=>({code:0,status(c){this.code=c;return this;},json(b){this.body=b;return this;}});
 let res=reply();await handler({method:'POST',headers:{host:'a.com',origin:'https://evil.com'}},res);assert.equal(res.code,403);
 const saved={...process.env};for(const k of Object.keys(process.env))if(/openai/i.test(k))delete process.env[k];
 res=reply();await handler({method:'POST',headers:{host:'a.com',origin:'https://a.com','content-type':'application/json'},body:{type:'story',prompt:'x'}},res);assert.equal(res.code,503);
 Object.assign(process.env,saved);
});
