import {randomUUID} from 'node:crypto';
import {streamText,toTextStream,pipeTextStreamToResponse} from 'ai';
import {buildPrompt} from '../server/prompt-engine.js';
import {providerConfig,createModel} from '../server/provider.js';
export const config={maxDuration:60};
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
 const config=providerConfig();if(!config)return res.status(503).json({error:'AI configuration is incomplete'});
 const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0],now=Date.now();for(const [key,v]of windows)if(v.until<now)windows.delete(key);
 const window=windows.get(ip)||{until:now+60000,count:0};if(window.count>=8||active>=4||windows.size>=5000)return res.status(429).json({error:'Please wait before trying again'});window.count++;windows.set(ip,window);
 let packet;try{const body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(body)||'')>48000)throw new Error('Request too large');packet=buildPrompt(body);}catch{return res.status(400).json({error:'Invalid title or conversation'});}
 const requestId=randomUUID(),started=Date.now();let timedOut=false,finishReason,reasoningTokens=0;const abort=new AbortController();const disconnect=()=>{if(!res.writableFinished)abort.abort();};res.on('close',disconnect);const timeout=setTimeout(()=>{timedOut=true;abort.abort();},55000);active++;
 try{
  const result=streamText({model:createModel(config),system:packet.system,messages:packet.messages,maxOutputTokens:packet.maxOutputTokens,maxRetries:0,abortSignal:abort.signal,onError:()=>{}});
  const checked=result.stream.pipeThrough(new TransformStream({transform(part,c){if(part.type==='error')throw part.error;if(part.type==='finish-step'||part.type==='finish'){finishReason=part.finishReason;reasoningTokens=part.usage?.outputTokens?.reasoning||part.totalUsage?.outputTokens?.reasoning||reasoningTokens;}c.enqueue(part);}}));
  const reader=toTextStream({stream:checked}).getReader();
  const first=await reader.read();if(first.done)throw Object.assign(new Error('No response text'),{code:'AI_EMPTY_RESPONSE'});
  const stream=new ReadableStream({start(c){c.enqueue(first.value);},async pull(c){try{const next=await reader.read();if(next.done)c.close();else c.enqueue(next.value);}catch{c.error(new Error('Generation interrupted'));}},cancel(){abort.abort();return reader.cancel();}});
  await pipeTextStreamToResponse({response:res,stream,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Prompt-Version':packet.promptVersion,'X-Request-Id':requestId}});
 }catch(error){const failure=classifyError(error,{timedOut,finishReason,reasoningTokens});console.error(JSON.stringify({event:'ai_response_failed',requestId,code:failure.code,upstreamStatus:Number(error?.statusCode)||null,finishReason,reasoningTokens,outputTokenLimit:packet.maxOutputTokens,durationMs:Date.now()-started,model:config.model,promptVersion:packet.promptVersion}));if(!res.headersSent&&!res.destroyed)res.status(failure.status).json({...failure,requestId});else if(!res.writableEnded)res.destroy();}
 finally{clearTimeout(timeout);res.off('close',disconnect);abort.abort();active--;}
}
