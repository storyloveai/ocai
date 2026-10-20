import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {catalogPrompt,validateCatalog,CATALOG_PROMPT_VERSION} from '../server/catalog-writing.js';
const root=new URL('../content/original-catalog/',import.meta.url),output=new URL('generated-text/',root);
const seeds=JSON.parse(await readFile(new URL('catalog-drafts.json',root),'utf8')).items;
const arg=name=>process.argv.find(x=>x.startsWith('--'+name+'='))?.split('=').slice(1).join('=');
const base=new URL(arg('url')||'https://project-zhmv2.vercel.app');
if(base.protocol!=='https:'||base.hostname!=='project-zhmv2.vercel.app')throw Error('Use the authorized production endpoint');
const limit=Math.max(1,Math.min(80,Number(arg('limit')||80))),concurrency=Math.max(1,Math.min(3,Number(arg('concurrency')||2)));
const selected=arg('ids')?seeds.filter(s=>arg('ids').split(',').includes(s.id)):seeds.slice(0,limit);
await mkdir(output,{recursive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let next=0,lastStarted=0,gate=Promise.resolve();
function pace(){const ready=gate.then(async()=>{await delay(Math.max(0,lastStarted+8500-Date.now()));lastStarted=Date.now();});gate=ready.catch(()=>{});return ready;}
async function generate(seed){
 const dest=new URL(seed.id+'.json',output);
 try{const saved=JSON.parse(await readFile(dest,'utf8'));if(saved.promptVersion===CATALOG_PROMPT_VERSION&&saved.provider==='deepseek'){validateCatalog(saved.draft,seed);console.log('CACHED '+seed.id);return;}}catch{}
 for(let attempt=1;attempt<=4;attempt++){
  await pace();const started=Date.now();
  try{
   const response=await fetch(new URL('/api/chat',base),{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/x-ndjson',Origin:base.origin},body:JSON.stringify({task:'author',field:'details',format:'catalog',catalogId:seed.id,type:seed.type,idea:seed.description.slice(0,2000)}),signal:AbortSignal.timeout(180000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   if(!response.headers.get('content-type')?.startsWith('application/x-ndjson'))throw Error('Expected generation stream');
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',text='',completion;
   function event(line){if(!line.trim())return;const e=JSON.parse(line);if(e.type==='error')throw Error(e.code||'Provider failure');if(e.type==='text')text+=e.text;if(e.type==='done')completion=e;}
   try{for(;;){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let i;while((i=buffer.indexOf('\n'))>=0){event(buffer.slice(0,i));buffer=buffer.slice(i+1);}if(text.length>60000)throw Error('Output too large');}buffer+=decoder.decode();if(buffer.trim())event(buffer);}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
   if(!completion||completion.finishReason==='length'||completion.provider!=='deepseek'||completion.model!=='deepseek-flash')throw Error('Incomplete or wrong-model generation');
   const draft=validateCatalog(JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'')),seed);
   const record={id:seed.id,type:seed.type,genre:seed.genre,tags:seed.tags,publicationStatus:'draft_pending_editorial_and_images',allParticipantsAdults:true,minimumParticipantAge:21,provider:completion.provider,model:completion.model,promptVersion:CATALOG_PROMPT_VERSION,generatedAt:new Date().toISOString(),requestId:completion.requestId,durationMs:Date.now()-started,draft};
   const temp=new URL(seed.id+'.json.tmp',output);await writeFile(temp,JSON.stringify(record,null,2)+'\n');await rename(temp,dest);
   console.log('DONE '+seed.id+' '+draft.titleZh+' '+JSON.stringify(draft).length+' chars '+record.durationMs+'ms');return;
  }catch(error){console.log('RETRY '+seed.id+' attempt='+attempt+' '+error.message.slice(0,150));if(attempt<4)await delay(attempt*15000);}
 }
 console.log('FAILED '+seed.id);process.exitCode=1;
}
await Promise.all(Array.from({length:concurrency},async()=>{while(next<selected.length){const seed=selected[next++];await generate(seed);}}));
