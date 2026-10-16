import {platform} from '../server/payments.js';
import {providerConfig} from '../server/provider.js';
import {PROMPT_VERSION} from '../server/prompt-engine.js';
export default async function handler(req,res){if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});const config=providerConfig();res.setHeader('Cache-Control','no-store');return res.status(200).json({configured:Boolean(config),model:config?.model||null,provider:config?.name||null,promptVersion:PROMPT_VERSION,...await (await platform.config(new Request('https://config.local/api/config'))).json()});}
