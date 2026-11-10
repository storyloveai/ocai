import {previewCampaign} from './preview.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {campaigns,bookMetadata} from './catalog.mjs';
import {bookCovers} from './covers.mjs';
export async function buildBooks(){
 const base=new URL('../',import.meta.url);
 await writeFile(new URL('dist/assets/book-catalog.js',base),'export const bookMetadata='+JSON.stringify(bookMetadata)+';\n');
 await mkdir(new URL('dist/assets/book-campaigns/',base),{recursive:true});
 await writeFile(new URL('dist/assets/book-campaign-core.js',base),await readFile(new URL('book-campaigns/engine/campaign_core.js',base)));
 for(const meta of bookMetadata){
  const c=previewCampaign(campaigns[meta.id]);
  await writeFile(new URL('dist/assets/book-campaigns/'+c.id+'.json',base),JSON.stringify(c));
  // 文字封面只作后备，写到固定的 .svg 路径；书目里的 image 可能已换成插画（webp），不能被覆盖。
  await writeFile(new URL('dist/assets/'+c.id+'-cover.svg',base),bookCovers[c.id]());
 }
}
