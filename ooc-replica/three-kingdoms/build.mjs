import {readFile,writeFile} from 'node:fs/promises';
import prompts from './prompts.js';
const root=new URL('./',import.meta.url);
export async function buildThreeKingdoms(){
 const [src,packs,engine]=await Promise.all(['app.html','packs.json','engine.cjs'].map(p=>readFile(new URL(p,root),'utf8')));
 const safe=x=>JSON.stringify(x).replace(/<\//g,'<\\/');
 const body=src.replace('/*__PACKS__*/',safe(JSON.parse(packs))).replace('/*__PROMPTS__*/',safe(prompts)).replace('/*__ENGINE__*/',engine);
 await writeFile(new URL('../dist/assets/three-kingdoms.html',root),'<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
}
