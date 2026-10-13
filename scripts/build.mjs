import {writeFile} from 'node:fs/promises';
import {characters} from '../data/characters.mjs';
const cards=characters.map(({persona,speaking_style,...c})=>({...c,type:'character',creator:'StoryLove',intro:c.opening_message,real:true}));
await writeFile(new URL('../dist/characters.js',import.meta.url),`window.OOC_CHARACTERS = ${JSON.stringify(cards,null,2)};\n`);
console.log(`Built ${cards.length} public character cards.`);


import {stories} from '../data/stories.mjs';
await writeFile(new URL('../dist/stories.js',import.meta.url),`window.STORYLOVE_STORIES = ${JSON.stringify(stories,null,2)};\n`);


import {build} from 'esbuild';
await build({entryPoints:[new URL('./identity-client.mjs',import.meta.url).pathname],outfile:new URL('../dist/vendor/netlify-identity.js',import.meta.url).pathname,bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,external:['next/headers','@netlify/functions','node:async_hooks']});

import {creditPacks} from '../data/credit-packs.mjs';
await writeFile(new URL('../dist/credit-packs.js',import.meta.url),`window.STORYLOVE_CREDIT_PACKS = ${JSON.stringify(creditPacks.map(({credits,amount,currency,label})=>({credits,amount,currency,label})))};\n`);
