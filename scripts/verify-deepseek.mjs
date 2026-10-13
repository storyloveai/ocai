// Explicit live smoke test. Run only in a trusted environment with the configured
// key. Calls the real chat handler with authored inputs, without account/wallet
// mutations. Logs no credentials, request headers, prompts or upstream raw errors.
import {createHandler} from '../netlify/functions/chat.mjs';
import {characters} from '../data/characters.mjs';
import {stories} from '../data/stories.mjs';
const key=process.env.DEEPSEEK_API_KEY;
if(!key){console.error('DEEPSEEK_PROBE missing_key');process.exit(1);}
const handler=createHandler({env:{DEEPSEEK_API_KEY:key,DEEPSEEK_MODEL:process.env.DEEPSEEK_MODEL||'deepseek-flash'}});
async function probe(id,messages,label=id){
 const start=performance.now();let firstTokenMs=null,text='',completed=false,meta={};
 const req=new Request('https://storylove-test.invalid/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({characterId:id,messages})});
 let r;try{r=await handler(req);}catch{console.error(JSON.stringify({event:'deepseek_probe',label,ok:false,category:'handler_exception'}));return null;}
 if(!r.ok){const e=await r.json();console.error(JSON.stringify({event:'deepseek_probe',label,ok:false,status:r.status,providerStatus:e.providerStatus,category:e.category||'request_failed'}));return null;}
 const reader=r.body.getReader(),decoder=new TextDecoder();let buffer='';
 try{while(true){const {value,done}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop();for(const line of lines){if(!line.startsWith('data:'))continue;const e=JSON.parse(line.slice(5));if(e.delta){if(firstTokenMs===null)firstTokenMs=Math.round(performance.now()-start);text+=e.delta;}if(e.done){completed=true;meta=e;}if(e.error)completed=false;}if(done)break;}}
 catch{completed=false;}
 const ok=completed&&text.trim().length>0&&meta.provider==='deepseek';
 console.log(JSON.stringify({event:'deepseek_probe',label,ok,chars:text.length,firstTokenMs,totalMs:Math.round(performance.now()-start),provider:meta.provider,model:meta.model,promptVersion:meta.promptVersion,sample:text.slice(0,200)}));
 return ok?text:null;
}
const firstInput='先不出发。我把蓝色绳索留在营地，想先休息一会儿。你建议怎么安排？';
const first=await probe('lara',[{role:'user',content:firstInput}]);
if(!first)process.exit(1);
const results=[first];
for(let i=1;i<characters.length;i+=3){
 results.push(...await Promise.all(characters.slice(i,i+3).map(c=>probe(c.id,[{role:'user',content:'我今天有点累，想先休息。你通常会怎么度过这种时候？'}]))));
}
const follow=await probe('lara',[{role:'user',content:firstInput},{role:'assistant',content:first},{role:'user',content:'刚才我把什么东西留在哪里了？不要替我决定下一步行动。'}],'lara_continuity');
results.push(follow);
results.push(await probe(stories[0].id,[{role:'assistant',content:stories[0].intro},{role:'user',content:'先看看信封上的封印，再询问门外的人来意。'}],'story'));
const pass=results.filter(Boolean).length;
console.log(JSON.stringify({event:'deepseek_probe_summary',passed:pass,total:results.length,continuityRecall:Boolean(follow?.includes('蓝色')&&follow?.includes('绳')&&follow?.includes('营地'))}));
if(pass!==results.length)process.exit(1);
