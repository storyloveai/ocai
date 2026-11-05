// 《汐川的第七个春天》自由对话。网站在 Vercel 免费版上最多 12 个后端函数，所以不单独开接口：
// 由 api/sanguo.js 按请求里的 game:'xichuan' 转到这里。和三国同一个处理器（限流、超时、备用模型），只换了提示词和输出格式。
import {jsonSchema} from 'ai';
import {createHandler} from '../api/three-kingdoms.js';
import {buildXichuanStage} from './xichuan-prompt.js';
const schema=jsonSchema({type:'object',properties:{
 reply:{type:'string'},
 tone:{type:'string',enum:['warm','rude','romantic','flatter','nonsense','threat','flat']},
 mood:{type:'string',enum:['neutral','warm','cold','sad','surprised','shy']},
 values:{type:'array',items:{type:'string'},maxItems:2}},
 required:['reply','tone','mood','values'],additionalProperties:false});
export const createXichuanHandler=deps=>createHandler({...deps,
 stage:body=>{try{return {...buildXichuanStage(body)};}catch(e){console.warn(JSON.stringify({event:'xichuan_invalid_request',reason:String(e?.message||e).slice(0,80),node:body?.context?.node}));throw e;}},
 outputSchema:schema,
 validateOutput:(out,body)=>{if(!out||typeof out!=='object'||typeof out.reply!=='string')throw Error('Invalid output');console.log(JSON.stringify({event:'xichuan_talk',node:body?.context?.node,to:body?.context?.target,tone:out.tone??null,mood:out.mood??null,values:Array.isArray(out.values)?out.values:null,replyChars:out.reply.length}));},
 hasVisible:out=>Boolean(out?.reply)});
export default createXichuanHandler();
