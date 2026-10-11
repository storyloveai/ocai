import {writeFile} from 'node:fs/promises';
import {characters} from '../data/characters.mjs';
const cards=characters.map(({persona,speaking_style,...c})=>({...c,type:'character',creator:'OOC AI',intro:c.opening_message,real:true}));
await writeFile(new URL('../dist/characters.js',import.meta.url),`window.OOC_CHARACTERS = ${JSON.stringify(cards,null,2)};\n`);
console.log(`Built ${cards.length} public character cards.`);
