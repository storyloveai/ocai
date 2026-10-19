import {createOpenAICompatible} from '@ai-sdk/openai-compatible';
import {createGoogle} from '@ai-sdk/google';
export function providerConfig(env=process.env){
 const selected=env.AI_PROVIDER?.trim().toLowerCase();
 if(selected&&!['gemini','google','deepseek','compatible'].includes(selected))return null;
 // Prefer DeepSeek automatically; explicit provider selection remains supported.
 const googleKey=env.GEMINI_API_KEY||env.GOOGLE_GENERATIVE_AI_API_KEY;
 if(selected==='gemini'||selected==='google'||(!selected&&googleKey&&!env.DEEPSEEK_API_KEY)){
  if(!googleKey)return null;
  return {key:googleKey,model:env.GEMINI_MODEL||'gemini-3.8-flash',name:'google',kind:'google'};
 }
 const custom=selected==='compatible'||(!selected&&Boolean(env.AI_API_KEY||env.AI_MODEL||env.AI_BASE_URL));
 const key=custom?env.AI_API_KEY:env.DEEPSEEK_API_KEY;
 const model=custom?env.AI_MODEL:(env.DEEPSEEK_MODEL||'deepseek-flash');
 const baseURL=custom?env.AI_BASE_URL:'https://api.deepseek.com';
 if(!key||!model||!baseURL)return null;
 let url;try{url=new URL(baseURL);}catch{return null;}
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)return null;
 return {key,model,baseURL:url.href.replace(/\/$/,''),name:custom?'configured-provider':'deepseek',kind:'compatible'};
}
export function createModel(config,hooks={}){
 const transport=async(url,init)=>{hooks.onConnecting?.();const response=await fetch(url,init);hooks.onHeaders?.(response.status);return response;};
 if(config.kind==='google')return createGoogle({apiKey:config.key,fetch:transport})(config.model);
 return createOpenAICompatible({fetch:transport,baseURL:config.baseURL,name:config.name,apiKey:config.key}).chatModel(config.model);
}
// Provider-specific latency policy stays outside model-independent narrative prompts.
export function generationOptions(config){
 if(config.kind==='google')return /^gemini-3\./.test(config.model)?{providerOptions:{google:{thinkingConfig:{thinkingLevel:'low',includeThoughts:false}}}}:{};
 return new URL(config.baseURL).hostname==='api.deepseek.com'
  ? {providerOptions:{[config.name]:{thinking:{type:'disabled'}}}} : {};
}

// Only the DeepSeek primary has an automatic, separately keyed Gemini backup.
export function fallbackConfig(config,env=process.env){
 return config?.name==='deepseek'?providerConfig({...env,AI_PROVIDER:'gemini'}):null;
}
