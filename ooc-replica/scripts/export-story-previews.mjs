import fs from 'node:fs';
import {siteTitles} from '../server/roles.js';
const stories=Object.fromEntries(siteTitles.map(title=>[title.id,{title:title.title,opening:title.description||title.title}]));
fs.writeFileSync(new URL('../dist/assets/scenarios.json',import.meta.url),JSON.stringify({version:'storydate-catalog-v1',stories}));
