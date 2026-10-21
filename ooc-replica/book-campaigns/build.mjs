import {previewCampaign} from './preview.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {campaigns,bookMetadata} from './catalog.mjs';
import {bookCovers} from './covers.mjs';
export async function buildBooks(){
 const base=new URL('../',import.meta.url);
 await writeFile(new URL('dist/assets/book-catalog.js',base),'export const bookMetadata='+JSON.stringify(bookMetadata.map(b=>({...b,plays:b.plays.replace('八章规则战役','两章试玩'),subtitle:b.subtitle+' · 前两章试玩'})))+';\n');
 await mkdir(new URL('dist/assets/book-campaigns/',base),{recursive:true});
 await writeFile(new URL('dist/assets/book-campaign-core.js',base),await readFile(new URL('sanguo/upstream/campaign_core.js',base)));
 for(const meta of bookMetadata){
  const c=previewCampaign(campaigns[meta.id]);
  await writeFile(new URL('dist/assets/book-campaigns/'+c.id+'.json',base),JSON.stringify(c));
  await writeFile(new URL('dist'+meta.image,base),bookCovers[c.id]());
 }
}
