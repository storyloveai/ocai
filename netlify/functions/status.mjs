export const config={path:'/api/status'};
export default ()=>Response.json({ready:Boolean(process.env.DEEPSEEK_API_KEY||(process.env.AI_API_KEY&&process.env.AI_BASE_URL&&process.env.AI_MODEL)),provider:process.env.DEEPSEEK_API_KEY?'deepseek':'legacy'},{headers:{'Cache-Control':'no-store'}});
