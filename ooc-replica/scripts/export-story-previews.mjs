import fs from 'node:fs';import {storyPrompts,STORY_PACK_VERSION} from '../server/story-prompts.js';
const stories=Object.fromEntries(Object.entries(storyPrompts).map(([id,p])=>[id,{title:p.title,opening:p.opening,suggestions:p.suggestions}]));
fs.writeFileSync(new URL('../dist/assets/scenarios.json',import.meta.url),JSON.stringify({version:STORY_PACK_VERSION,stories}));
