// Cover-art generation through the OpenAI Images API. Key and model come from the Vercel environment:
// OPENAI_API_KEY and OPENAI_MODEL (spaced/camel-case spellings of the same names are also accepted).
const windows=new Map();let active=0;
const pick=(env,pattern)=>{const key=Object.keys(env).find(k=>pattern.test(k)&&env[k]);return key?String(env[key]).trim():'';};
export function imageConfig(env=process.env){
 const key=pick(env,/^openai[_ ]?api[_ ]?key$/i);if(!key)return null;
 const requested=pick(env,/^openai[_ ]?model$/i);
 // OPENAI_MODEL may name a chat model; the Images API only accepts image models.
 const model=/^(gpt-image|dall-e|chatgpt-image)/i.test(requested)?requested:'gpt-image-1';
 return {key,model};
}
export function imagePrompt(body){
 if(!body||typeof body!=='object'||!['story','character'].includes(body.type)||typeof body.prompt!=='string')throw Error('Invalid image request');
 const clip=(v,n)=>typeof v==='string'?v.replace(/\s+/g,' ').trim().slice(0,n):'';
 const idea=clip(body.prompt,900);if(!idea)throw Error('Invalid image request');
 const title=clip(body.title,80),line=clip(body.description,120);
 const kind=body.type==='character'?'a character portrait key art: a single expressive character, waist-up, striking pose, rich lighting':'a cinematic story cover key art: an evocative scene with atmosphere, depth and a clear focal subject';
 return `Create ${kind}, for an interactive fiction title shown as a vertical 2:3 cover. Painterly, polished illustration with a cohesive colour palette and dramatic composition. Absolutely no text, letters, captions, logos, watermarks or UI. ${title?`Title for mood only (do not write it): ${title}. `:''}${line?`Tagline for mood only: ${line}. `:''}Subject and direction: ${idea}`;
}
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const origin=req.headers.origin,host=req.headers.host;
 if(!origin||!host||origin!==`https://${host}`)return res.status(403).json({error:'Same-origin browser requests only'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'JSON required'});
 const config=imageConfig();if(!config)return res.status(503).json({error:'Image generation is not configured on the server.'});
 let prompt;try{const body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(body)||'')>8000)throw Error('too large');prompt=imagePrompt(body);}catch{return res.status(400).json({error:'Invalid image request'});}
 const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0],now=Date.now();for(const [k,v]of windows)if(v.until<now)windows.delete(k);
 const w=windows.get(ip)||{until:now+60000,count:0};if(w.count>=3||active>=3||windows.size>=5000)return res.status(429).json({error:'Please wait a moment before generating another cover.'});w.count++;windows.set(ip,w);
 const dalle3=/^dall-e-3/i.test(config.model),dalle2=/^dall-e-2/i.test(config.model);
 const payload={model:config.model,prompt,n:1,size:dalle3?'1024x1792':dalle2?'1024x1024':'1024x1536',...(dalle3||dalle2?{response_format:'b64_json'}:{quality:'medium'})};
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),110000);active++;
 try{
  const upstream=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.key}`},body:JSON.stringify(payload),signal:abort.signal});
  const data=await upstream.json().catch(()=>({}));
  if(!upstream.ok){console.error(JSON.stringify({event:'image_failed',status:upstream.status,code:data?.error?.code,model:config.model}));
   const blocked=data?.error?.code==='content_policy_violation'||data?.error?.code==='moderation_blocked';
   return res.status(blocked?422:502).json({error:blocked?'This description cannot be turned into a cover. Try a different direction.':upstream.status===401||upstream.status===403?'The image service rejected the server key.':upstream.status===429?'The image service is busy. Try again shortly.':'Cover generation failed. Please try again.'});}
  const b64=data?.data?.[0]?.b64_json;if(!b64)return res.status(502).json({error:'The image service returned no image.'});
  res.setHeader('Cache-Control','no-store');return res.status(200).json({mime:'image/png',b64,model:config.model});
 }catch(error){return res.status(abort.signal.aborted?504:502).json({error:abort.signal.aborted?'Cover generation timed out. Please try again.':'Cover generation failed. Please try again.'});}
 finally{clearTimeout(timer);active--;}
}
