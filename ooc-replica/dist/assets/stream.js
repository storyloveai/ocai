// Transport and visual pacing are independent: works with demo or HTTP text streams.
export const pause=(ms,signal)=>new Promise((resolve,reject)=>{if(signal?.aborted)return reject(signal.reason||new DOMException('Aborted','AbortError'));const timer=setTimeout(done,ms);function done(){signal?.removeEventListener('abort',abort);resolve();}function abort(){clearTimeout(timer);signal.removeEventListener('abort',abort);reject(signal.reason||new DOMException('Aborted','AbortError'));}signal?.addEventListener('abort',abort,{once:true});});
export async function* demoStream(text,signal){await pause(850,signal);for(let i=0;i<text.length;i+=24){await pause(140,signal);yield text.slice(i,i+24);}}
export async function* httpStream(messages,signal,context={},onStatus=()=>{}){
 const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/x-ndjson'},body:JSON.stringify({...context,messages}),signal});
 const asError=detail=>Object.assign(new Error(detail.error||'模型连接中断，请重试。'),{code:detail.code,requestId:detail.requestId,retryable:detail.retryable});
 if(!response.ok)throw asError(await response.json().catch(()=>({})));
 const contentType=response.headers.get('content-type')||'',framed=contentType.startsWith('application/x-ndjson');
 if(!framed&&!contentType.startsWith('text/plain'))throw new Error('The AI endpoint is not configured. Use Demo mode.');
 if(!response.body)throw new Error('The response has no text stream.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',completed=false;
 const event=line=>{const value=JSON.parse(line);if(value.type==='error')throw asError(value);if(value.type==='status')onStatus(value);if(value.type==='done')completed=true;return value;};
 try{while(true){const {value,done}=await reader.read();if(done)break;const text=decoder.decode(value,{stream:true});if(!framed){yield text;continue;}buffer+=text;let newline;while((newline=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);if(line.trim()){const part=event(line);if(part.type==='text')yield part.text;}}}const tail=decoder.decode();if(!framed){if(tail)yield tail;}else{buffer+=tail;if(buffer.trim()){const part=event(buffer);if(part.type==='text')yield part.text;}if(!completed)throw asError({code:'AI_INTERRUPTED',error:'回复连接已中断，已显示的内容会保留。'});}}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export async function typeStream(source,{signal,onText,onState,interval=16,step=3}){
 let received='',visible='',done=false,failure;const segmenter=new Intl.Segmenter(undefined,{granularity:'grapheme'});
 const producer=(async()=>{try{for await(const part of source){if(signal.aborted)break;received+=part;}}catch(e){failure=e;}finally{done=true;}})();
 onState('submitted');let started=false;
 try{while(!done||visible.length<received.length){if(signal.aborted)break;let segments=[...segmenter.segment(received)].map(x=>x.segment);if(!done)segments.pop();const count=[...segmenter.segment(visible)].length;const next=segments.slice(0,count+step).join('');if(next.length>visible.length){if(!started){started=true;onState('streaming');}visible=next;onText(visible);}if(done&&visible===received)break;await pause(interval,signal);}await producer;if(failure&&!signal.aborted)throw failure;return visible;}catch(e){if(!signal.aborted)throw e;return visible;}finally{onState('ready');}
}
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function markdown(text){const inline=s=>escapeHTML(s).replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*\n]+)\*/g,'<em>$1</em>');return text.split(/(```[\s\S]*?```)/g).map(part=>part.startsWith('```')?'<pre><small>'+escapeHTML(part.split('\n')[0].slice(3))+'</small><code>'+escapeHTML(part.replace(/^```[^\n]*\n?/,'').replace(/```$/,''))+'</code></pre>':part.split(/\n\n+/).filter(Boolean).map(p=>p.startsWith('> ')?'<blockquote>'+inline(p.slice(2))+'</blockquote>':'<p>'+inline(p).replaceAll('\n','<br>')+'</p>').join('')).join('');}
// Failed UI placeholders are never model conversation. Collapse adjacent user turns
// after a failed reply so a retry can preserve the user's text without duplicating it.
export function conversationForRequest(messages){const out=[];for(const m of messages){if(!['user','assistant'].includes(m.role)||m.failed||!m.text?.trim()||m.role==='assistant'&&m.text==='Unable to generate a response.')continue;const content=String(m.text).slice(-4000);if(out.at(-1)?.role===m.role)out.at(-1).content=(out.at(-1).content+'\n\n'+content).slice(-4000);else out.push({role:m.role,content});}const limited=[];let budget=16000;for(const message of out.slice(-24).reverse()){if(message.content.length>budget)break;limited.unshift(message);budget-=message.content.length;}while(limited[0]?.role==='assistant'&&limited.length>1)limited.shift();return limited;}
