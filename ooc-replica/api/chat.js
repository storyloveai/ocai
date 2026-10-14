import {streamText,toTextStream,pipeTextStreamToResponse} from 'ai';
import {buildPrompt} from '../server/prompt-engine.js';
import {providerConfig,createModel} from '../server/provider.js';
export const config={maxDuration:60};
const windows=new Map();let active=0;
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const origin=req.headers.origin,host=req.headers.host;
 if(!origin||!host||origin!==`https://${host}`)return res.status(403).json({error:'Same-origin browser requests only'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'JSON required'});
 const config=providerConfig();if(!config)return res.status(503).json({error:'AI configuration is incomplete'});
 const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0],now=Date.now();for(const [key,v]of windows)if(v.until<now)windows.delete(key);
 const window=windows.get(ip)||{until:now+60000,count:0};if(window.count>=8||active>=4||windows.size>=5000)return res.status(429).json({error:'Please wait before trying again'});window.count++;windows.set(ip,window);
 let packet;try{const body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(body)||'')>48000)throw new Error('Request too large');packet=buildPrompt(body);}catch{return res.status(400).json({error:'Invalid title or conversation'});}
 const abort=new AbortController();const disconnect=()=>{if(!res.writableFinished)abort.abort();};res.on('close',disconnect);const timeout=setTimeout(()=>abort.abort(),55000);active++;
 try{
  const result=streamText({model:createModel(config),system:packet.system,messages:packet.messages,maxOutputTokens:packet.maxOutputTokens,maxRetries:0,abortSignal:abort.signal,onError:()=>{}});
  const checked=result.stream.pipeThrough(new TransformStream({transform(part,c){if(part.type==='error')throw new Error('Upstream generation failed');c.enqueue(part);}}));
  const reader=toTextStream({stream:checked}).getReader();
  const first=await reader.read();if(first.done)throw new Error('No response text');
  const stream=new ReadableStream({start(c){c.enqueue(first.value);},async pull(c){try{const next=await reader.read();if(next.done)c.close();else c.enqueue(next.value);}catch{c.error(new Error('Generation interrupted'));}},cancel(){abort.abort();return reader.cancel();}});
  await pipeTextStreamToResponse({response:res,stream,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Prompt-Version':packet.promptVersion}});
 }catch{if(!res.headersSent&&!res.destroyed)res.status(502).json({error:'AI provider could not complete the response. Check the configured model and credentials.'});else if(!res.writableEnded)res.destroy();}
 finally{clearTimeout(timeout);res.off('close',disconnect);abort.abort();active--;}
}
