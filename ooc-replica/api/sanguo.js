import {jsonSchema} from 'ai';
import {createHandler} from './three-kingdoms.js';
import {buildCampaignStage} from '../server/sanguo-prompt.js';
const nullableString={type:['string','null']};
const schema=jsonSchema({type:'object',properties:{pick:nullableString,move:nullableString,reply:nullableString,tone:{type:['string','null'],enum:['warm','rude','romantic','flatter','nonsense','threat','flat',null]},mood:{type:['string','null'],enum:['neutral','warm','cold','sad','surprised','shy',null]},commit:{anyOf:[{type:'null'},{type:'object',properties:{kind:{type:'string',enum:['protect','loyalty','other']},text:{type:'string'}},required:['kind','text'],additionalProperties:false}]}},required:['pick','move','reply','tone','mood','commit'],additionalProperties:false});
export const createCampaignHandler=deps=>createHandler({...deps,stage:buildCampaignStage,outputSchema:schema,validateOutput:out=>{if(!out||typeof out!=='object')throw Error('Invalid output');},hasVisible:out=>Boolean(out?.reply)});
export default createCampaignHandler();
