// Two editions of 三国·谋士 share one story, one rule set and one save: the illustrated edition (art in
// /assets/sanguo-art/, the default) and the ink edition (pictures drawn in code). ?edition=classic keeps the older
// three-chapter version. ?lang=zh|en opens the game in that language (the home banner passes it).
export const threeKingdoms={id:'three-kingdoms',title:'三国演义 · 谋士',author:'StoryDate · 三国互动',genre:'History',type:'story',original:true,plays:'八章连续旅程 · 插画版',image:'/assets/sanguo-art/cover.webp',description:'化身颍川谋士子衡，从许都走到华容。结交刘备、曹操、关羽、诸葛亮与温芷，让你的话成为承诺，让早先的选择在八章旅程中回响。',href:'/story/three-kingdoms'};
export const threeKingdomsInk={...threeKingdoms,id:'three-kingdoms-ink',title:'三国演义 · 谋士（水墨版）',plays:'八章连续旅程 · 水墨版',image:'/assets/three-kingdoms-cover.svg',description:'同一个故事的水墨版：画面全部是水墨淡彩。进度与插画版共用。',href:'/story/three-kingdoms-ink'};
const EDITION_PATHS=['/story/three-kingdoms','/play/three-kingdoms','/story/three-kingdoms-ink','/play/three-kingdoms-ink'];
export const isThreeKingdomsPath=path=>EDITION_PATHS.includes(path);
export function mountThreeKingdoms(path,{reference,account,helpers}){
 if(!isThreeKingdomsPath(path))return false;
 const params=new URLSearchParams(location.search||''),classic=params.get('edition')==='classic',ink=!classic&&path.endsWith('-ink');
 const snapshot=helpers.read('ooc-session-v2-three-kingdoms',{});
 const lang=params.get('lang');
 if(['zh','en'].includes(lang)){snapshot['campaign.settings']={...(snapshot['campaign.settings']||{}),lang};helpers.save('ooc-session-v2-three-kingdoms',snapshot);}
 const page=classic?'three-kingdoms':ink?'sanguo-campaign':'sanguo-campaign-illus';
 const switcher=classic?`<a style="font-size:12px" href="/play/three-kingdoms">谋士八章</a>`:`<a style="font-size:12px" href="/play/three-kingdoms${ink?'':'-ink'}">${ink?'插画版':'水墨版'}</a><a style="font-size:12px" href="/play/three-kingdoms?edition=classic">经典三章</a>`;
 if(path.startsWith('/play/'))helpers.save('ooc-history',[threeKingdoms.id,...helpers.read('ooc-history',[]).filter(id=>id!==threeKingdoms.id)]);
 const root=reference.mountShell(`<header class="shell-page-header" style="gap:12px;min-height:56px"><a href="/">‹ 返回</a><h1 style="font-size:16px">三国演义${ink?' · 水墨版':''}</h1>${switcher}<span style="margin-left:auto;font-size:12px;color:#aaa">进度自动保存</span></header><iframe id="three-kingdoms-frame" title="三国演义互动故事" src="/assets/${page}.html" style="display:block;width:100%;height:calc(100dvh - 57px);min-height:480px;border:0;background:#111113"></iframe>`,helpers,'three-kingdoms');
 const frame=root.querySelector('#three-kingdoms-frame');
 const receive=event=>{
  if(!frame.isConnected){window.removeEventListener('message',receive);return;}
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='sg2-ready')frame.contentWindow.postMessage({type:'sg2-init',snapshot},location.origin);
  if(event.data?.type==='tk3-ready')frame.contentWindow.postMessage({type:'tk3-init',snapshot},location.origin);
  if(['tk3-save','sg2-save'].includes(event.data?.type)){
   const {key,value}=event.data;
   if(typeof key!=='string'||!/^(campaign\.(?:save|settings|anon|cur|runs|runN|collection(?:\.[\w-]{1,60})?|run\.[\w.-]{1,60}|ckpt\.[\w.-]{1,60})|settings|anon|game\.sg(?:03_heroes_over_plums|08_arrows_from_fog|09_huarong_road)|endings\.sg(?:03_heroes_over_plums|08_arrows_from_fog|09_huarong_road))$/.test(key)||JSON.stringify(value)?.length>(key.startsWith('campaign.')?500000:160000))return;
   if(value===null)delete snapshot[key];else snapshot[key]=value;
   helpers.save('ooc-session-v2-three-kingdoms',snapshot);
   if((key.startsWith('game.')||key==='campaign.save')&&helpers.read('ooc-history',[])[0]!==threeKingdoms.id)helpers.save('ooc-history',[threeKingdoms.id,...helpers.read('ooc-history',[]).filter(id=>id!==threeKingdoms.id)]);
  }
 };
 window.addEventListener('message',receive);
 document.title=classic?'三国演义 · 命运由你':'三国演义 · 谋士';return true;
}
