import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {campaigns,bookMetadata} from './catalog.mjs';
export async function buildBooks(){
 const base=new URL('../',import.meta.url);
 await writeFile(new URL('dist/assets/book-catalog.js',base),'export const bookMetadata='+JSON.stringify(bookMetadata)+';\n');
 await mkdir(new URL('dist/assets/book-campaigns/',base),{recursive:true});
 await writeFile(new URL('dist/assets/book-campaign-core.js',base),await readFile(new URL('sanguo/upstream/campaign_core.js',base)));
 for(const meta of bookMetadata){
  const c=campaigns[meta.id];
  await writeFile(new URL('dist/assets/book-campaigns/'+c.id+'.json',base),JSON.stringify(c));
  // Editorial cover: typography, not a generated illustration or an upstream site's cover.
  const color=c.id==='mortal-path'?'#4b6559':'#344d67',title=c.id==='mortal-path'?'谷外微尘':'余烬与潮汐';
  await writeFile(new URL('dist'+meta.image,base),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#11151b"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><path d="M40 0v800M52 0v800" stroke="#d9cba2" opacity=".35"/><rect x="80" y="55" width="460" height="680" rx="4" fill="none" stroke="#d9cba2" opacity=".45"/><path d="M230 190q35-12 70 6q35-18 70-6v80q-35-12-70 6q-35-18-70-6zM300 196v80" fill="none" stroke="#f0e9d9" stroke-width="5"/><text x="310" y="390" text-anchor="middle" fill="#f0e9d9" font-size="48" font-family="serif">${title}</text><text x="310" y="455" text-anchor="middle" fill="#d9cba2" font-size="21">名著互动 · 卷一</text><text x="310" y="655" text-anchor="middle" fill="#f0e9d9" font-size="20">StoryDate</text></svg>`);
 }
}
