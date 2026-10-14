import {createOpenAICompatible} from '@ai-sdk/openai-compatible';
export function providerConfig(env=process.env){
 const custom=Boolean(env.AI_API_KEY||env.AI_MODEL||env.AI_BASE_URL);
 const key=custom?env.AI_API_KEY:env.DEEPSEEK_API_KEY;
 const model=custom?env.AI_MODEL:env.DEEPSEEK_MODEL;
 const baseURL=custom?env.AI_BASE_URL:'https://api.deepseek.com';
 if(!key||!model||!baseURL)return null;
 let url;try{url=new URL(baseURL);}catch{return null;}
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)return null;
 return {key,model,baseURL:url.href.replace(/\/$/,''),name:custom?'configured-provider':'deepseek'};
}
export function createModel(config){return createOpenAICompatible({baseURL:config.baseURL,name:config.name,apiKey:config.key}).chatModel(config.model);}
