import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {streamText} from 'ai';
import {buildPrompt} from '../server/prompt-engine.js';
import {providerConfig,fallbackConfig,createModel,generationOptions} from '../server/provider.js';

const windows=new Map();let active=0;
export function classifyError(error,{timedOut=false,finishReason,reasoningTokens=0}={}){
 const upstream=Number(error?.statusCode||error?.cause?.statusCode)||null;
 if(timedOut)return {status:504,code:'AI_TIMEOUT',error:'模型响应超时，请重试。',retryable:true};
 if(upstream===401||upstream===403)return {status:502,code:'AI_AUTH',error:'模型服务拒绝了当前密钥或访问权限，请检查服务端配置。',retryable:false};
 if(upstream===402)return {status:502,code:'AI_BALANCE',error:'模型账户余额不足，请检查供应商账户。',retryable:false};
 if(upstream===429)return {status:503,code:'AI_RATE_LIMIT',error:'模型服务暂时繁忙，请稍后重试。',retryable:true};
 if(upstream===400||upstream===404||upstream===422)return {status:502,code:'AI_REQUEST',error:'模型服务不接受当前模型或请求配置。',retryable:false};
 if(error?.code==='AI_EMPTY_RESPONSE'&&finishReason==='length')return {status:502,code:'AI_OUTPUT_BUDGET',error:'模型在输出正文前用完了生成额度，请重试或调整模型配置。',retryable:true};
 if(error?.code==='AI_EMPTY_RESPONSE')return {status:502,code:reasoningTokens?'AI_REASONING_ONLY':'AI_EMPTY_RESPONSE',error:'模型没有返回可显示的正文，请重试。',retryable:true};
 return {status:502,code:'AI_UPSTREAM',error:'模型连接暂时失败，请重试。',retryable:true};
}
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const origin=req.headers.origin,host=req.headers.host;
 if(!origin||!host||origin!==`https://${host}`)return res.status(403).json({error:'Same-origin browser requests only'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'JSON required'});
 let config=providerConfig();if(!config)return res.status(503).json({error:'AI configuration is incomplete'});
 const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0],now=Date.now();for(const [key,v]of windows)if(v.until<now)windows.delete(key);
 const window=windows.get(ip)||{until:now+60000,count:0};if(window.count>=8||active>=4||windows.size>=5000)return res.status(429).json({error:'Please wait before trying again'});window.count++;windows.set(ip,window);
 let packet;try{const body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(body)||'')>48000)throw new Error('Request too large');packet=buildPrompt(body);}catch{return res.status(400).json({error:'Invalid title or conversation'});}
 // Catalogue authoring uses the user's requested DeepSeek model only. Normal chat retains fallback.
 if(packet.mode==='author-catalog'){
  config=providerConfig({...process.env,AI_PROVIDER:'deepseek',DEEPSEEK_MODEL:'deepseek-flash'});
  if(!config)return res.status(503).json({error:'DeepSeek configuration is incomplete'});
 }
 const requestId=randomUUID(),started=Date.now();let timedOut=false,finishReason,reasoningTokens=0,reasoningChunks=0,upstreamStatus=null,upstreamHeadersMs=null,firstTextMs=null,phase='connecting',hasText=false;
 const framed=String(req.headers.accept||'').includes('application/x-ndjson');
 const abort=new AbortController();const disconnect=()=>{if(!res.writableFinished)abort.abort();};res.on('close',disconnect);const timeout=setTimeout(()=>{timedOut=true;abort.abort();},165000);active++;
 const headers=()=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Prompt-Version',packet.promptVersion);res.setHeader('X-Request-Id',requestId);res.setHeader('Content-Type',framed?'application/x-ndjson; charset=utf-8':'text/plain; charset=utf-8');};
 const emit=async(event)=>{if(res.destroyed||res.writableEnded)return;const data=framed?JSON.stringify(event)+'\n':event.type==='text'?event.text:'';if(data&&!res.write(data))await once(res,'drain',{signal:abort.signal});res.flush?.();};
 const status=()=>emit({type:'status',phase,elapsedSeconds:Math.floor((Date.now()-started)/1000),requestId});
 let heartbeat;
 try{
  if(framed){headers();await status();heartbeat=setInterval(()=>status().catch(()=>{}),10000);}
  const candidates=(packet.mode==='author-catalog'?[config]:[config,fallbackConfig(config)]).filter(Boolean);
  for(let attempt=0;attempt<candidates.length;attempt++){
  config=candidates[attempt];
  const attemptAbort=new AbortController(),attemptTimer=attempt<candidates.length-1?setTimeout(()=>attemptAbort.abort(),20000):null;
  try{
  const result=streamText({model:createModel(config,{onConnecting:()=>{phase='connecting';},onHeaders:status=>{upstreamStatus=status;upstreamHeadersMs=Date.now()-started;phase='waiting-model';}}),system:packet.system,messages:packet.messages,maxOutputTokens:packet.maxOutputTokens,...generationOptions(config),maxRetries:0,abortSignal:AbortSignal.any([abort.signal,attemptAbort.signal]),onError:()=>{}});
  for await(const part of result.stream){
   if(abort.signal.aborted)break;
   if(part.type==='error')throw part.error;
   if(part.type==='reasoning-delta'){reasoningChunks++;phase='thinking';}
   if(part.type==='finish-step'||part.type==='finish'){finishReason=part.finishReason;reasoningTokens=part.usage?.outputTokens?.reasoning||part.totalUsage?.outputTokens?.reasoning||reasoningTokens;}
   if(part.type==='text-delta'&&part.text){if(!hasText){clearTimeout(attemptTimer);hasText=true;firstTextMs=Date.now()-started;if(!framed)headers();}phase='streaming';await emit({type:'text',text:part.text});}
  }
  if(timedOut)throw new Error('Request deadline reached');
  if(abort.signal.aborted)return;
  if(!hasText)throw Object.assign(new Error('No response text'),{code:'AI_EMPTY_RESPONSE'});
  break;
  }catch(error){
   if(hasText||abort.signal.aborted||attempt===candidates.length-1)throw error;
   console.warn(JSON.stringify({event:'ai_provider_fallback',from:config.name,to:candidates[attempt+1].name}));
   phase='connecting';finishReason=undefined;reasoningTokens=0;
  }finally{clearTimeout(attemptTimer);}
  }
  await emit({type:'done',requestId,finishReason,...(packet.mode==='author-catalog'?{model:config.model,provider:config.name}: {})});res.end();
  console.info(JSON.stringify({event:'ai_response_complete',requestId,model:config.model,promptVersion:packet.promptVersion,firstTextMs,durationMs:Date.now()-started,finishReason,reasoningTokens}));
 }catch(error){if(abort.signal.aborted&&!timedOut)return;const failure=classifyError(error,{timedOut,finishReason,reasoningTokens});console.error(JSON.stringify({event:'ai_response_failed',requestId,code:failure.code,upstreamStatus,upstreamHeadersMs,phase,reasoningChunks,finishReason,reasoningTokens,outputTokenLimit:packet.maxOutputTokens,durationMs:Date.now()-started,model:config.model,promptVersion:packet.promptVersion}));if(framed&&!res.destroyed){await emit({type:'error',...failure,requestId});res.end();}else if(!res.headersSent&&!res.destroyed)res.status(failure.status).json({...failure,requestId});else if(!res.writableEnded)res.destroy();}
 finally{clearTimeout(timeout);clearInterval(heartbeat);res.off('close',disconnect);abort.abort();active--;}
}
