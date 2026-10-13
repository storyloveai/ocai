import {PROMPT_VERSION} from '../../data/characters.mjs';
export const config={path:'/api/status'};
export default ()=>Response.json({ready:Boolean(process.env.DEEPSEEK_API_KEY||(process.env.AI_API_KEY&&process.env.AI_BASE_URL&&process.env.AI_MODEL)),provider:process.env.DEEPSEEK_API_KEY?'deepseek':'legacy',model:process.env.DEEPSEEK_API_KEY?(process.env.DEEPSEEK_MODEL||'deepseek-flash'):process.env.AI_MODEL||null,promptVersion:PROMPT_VERSION},{headers:{'Cache-Control':'no-store'}});
