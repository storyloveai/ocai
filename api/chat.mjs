import handler from '../netlify/functions/chat.mjs';
export const maxDuration=60;
export const POST=req=>{if(!process.env.SUPABASE_URL||!process.env.SUPABASE_ANON_KEY||!process.env.SUPABASE_SERVICE_ROLE_KEY)return Response.json({error:'请先配置账户服务再开放聊天。'},{status:503});return handler(req);};
