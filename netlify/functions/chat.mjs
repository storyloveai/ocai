import {characters,systemPrompt} from '../../data/characters.mjs';
export const config={path:'/api/chat',rateLimit:{windowLimit:8,windowSize:60,aggregateBy:['ip','domain'],action:'rate_limit'}};
const json=(status,error)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export function validate(p){
 const character=characters.find(c=>c.id===p?.characterId);
 if(!character)throw Error('请选择有效的角色。');
 if(!Array.isArray(p.messages)||!p.messages.length||p.messages.length>20)throw Error('聊天记录必须包含1—20条消息。');
 let length=0;const messages=p.messages.map(m=>{if(!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||!m.content.trim()||m.content.length>4000)throw Error('消息格式有误，每条最多4000个字符。');length+=m.content.length;return {role:m.role,content:m.content};});
 if(length>20000)throw Error('最近聊天过长，请开始新对话。');if(messages.at(-1).role!=='user')throw Error('最后一条消息必须来自用户。');return {character,messages};
}
export async function readPayload(req){
 if(!req.headers.get('content-type')?.startsWith('application/json'))throw Error('请求必须使用JSON。');
 const reader=req.body?.getReader();if(!reader)throw Error('请求为空。');const chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>64000){await reader.cancel();throw Error('请求过长。');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw Error('JSON格式有误。');}
}
export function createHandler({env=process.env,fetchImpl=fetch}={}){return async req=>{
 if(req.method!=='POST')return json(405,'只支持POST。');const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json(403,'不允许跨站请求。');
 let input;try{input=validate(await readPayload(req));}catch(e){return json(400,e.message);}
 if(!env.AI_API_KEY||!env.AI_BASE_URL||!env.AI_MODEL)return json(503,'角色聊天暂未连接，请稍后再试。');
 if(/openrouter\/auto|:free|latest/i.test(env.AI_MODEL))return json(503,'模型配置需要固定版本。');
 let url;try{url=new URL(env.AI_BASE_URL.replace(/\/$/,'')+'/chat/completions');if(url.protocol!=='https:')throw Error();}catch{return json(503,'聊天服务配置有误。');}
 const abort=new AbortController(),onAbort=()=>abort.abort();req.signal.addEventListener('abort',onAbort,{once:true});
 const timer=setTimeout(()=>abort.abort(),50000),cleanup=()=>{clearTimeout(timer);req.signal.removeEventListener('abort',onAbort);};
 const body={model:env.AI_MODEL,messages:[{role:'system',content:systemPrompt(input.character)},...input.messages],stream:true,max_tokens:600,temperature:0.8};
 if(url.hostname==='openrouter.ai'){body.provider={allow_fallbacks:false,...(env.AI_MODEL==='anthropic/claude-sonnet-4.6'?{only:['anthropic']}:{})};body.reasoning={enabled:false,exclude:true};}
 let upstream;try{upstream=await fetchImpl(url,{method:'POST',signal:abort.signal,headers:{Authorization:`Bearer ${env.AI_API_KEY}`,'Content-Type':'application/json','HTTP-Referer':new URL(req.url).origin,'X-Title':'OOC AI'},body:JSON.stringify(body)});}catch{cleanup();return json(504,'连接超时或暂时不可用，请重试。');}
 if(!upstream.ok||!upstream.body){cleanup();await upstream.body?.cancel();return json(upstream.status===429?429:502,upstream.status===429?'请求较多，请稍等一分钟再试。':'模型服务暂时不可用，请稍后重试。');}
 const reader=upstream.body.getReader(),encoder=new TextEncoder();
 const stream=new ReadableStream({async start(controller){
  const emit=e=>controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));let buffer='',complete=false,emitted=false;const decoder=new TextDecoder();
  const line=raw=>{if(!raw.startsWith('data:'))return;const data=raw.slice(5).trim();if(!data)return;if(data==='[DONE]'){complete=true;return;}const e=JSON.parse(data);if(e.error)throw Error('upstream');const delta=e.choices?.[0]?.delta?.content;if(typeof delta==='string'&&delta){emitted=true;emit({delta});}if(e.choices?.[0]?.finish_reason==='error')throw Error('upstream');};
  try{while(!complete){const {done,value}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop();for(const part of lines)line(part.replace(/\r$/,''));if(buffer.length>64000)throw Error('invalid stream');if(done){if(buffer)line(buffer);break;}}if(!complete||!emitted)throw Error('incomplete');emit({done:true});}
  catch{try{emit({error:'回复中断，请重试。',retryable:true});}catch{}}
  finally{cleanup();await reader.cancel().catch(()=>{});try{controller.close();}catch{}}
 },cancel(){abort.abort();cleanup();return reader.cancel().catch(()=>{});}});
 return new Response(stream,{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-store','X-Content-Type-Options':'nosniff'}});
};}
export default createHandler();
