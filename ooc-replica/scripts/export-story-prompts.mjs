import fs from 'node:fs';
import {siteTitles} from '../server/roles.js';
import {buildPrompt,PROMPT_VERSION} from '../server/prompt-engine.js';
const rows=siteTitles.map(title=>({id:title.id,type:title.type||'story',title:title.title,promptVersion:PROMPT_VERSION,system:buildPrompt({titleId:title.id,messages:[{role:'user',content:'Begin'}]}).system}));
fs.writeFileSync(new URL('../docs/SITE-PROMPTS.json',import.meta.url),JSON.stringify(rows,null,2)+'\n');
