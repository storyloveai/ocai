export const threeKingdoms={id:'three-kingdoms',title:'三国演义 · 命运由你',author:'三国互动 · MVP',genre:'History',type:'story',original:true,plays:'3 个篇章 · 12 个结局',image:'/assets/three-kingdoms-cover.svg',description:'煮酒论英雄、草船借箭、华容道。成为刘备、诸葛亮或关羽，用你的话改写名场面。',href:'/story/three-kingdoms'};
export function mountThreeKingdoms(path,{reference,account,helpers}){
 if(!['/story/three-kingdoms','/play/three-kingdoms'].includes(path))return false;
 const snapshot=helpers.read('ooc-session-v2-three-kingdoms',{});
 const root=reference.mountShell('<header class="shell-page-header" style="gap:20px;min-height:56px"><a href="/">‹ 返回 Story</a><h1 style="font-size:16px">三国演义</h1><span style="margin-left:auto;font-size:12px;color:#aaa">MVP · 自动存档</span></header><iframe id="three-kingdoms-frame" title="三国演义互动故事" src="/assets/three-kingdoms.html" style="display:block;width:100%;height:calc(100dvh - 57px);min-height:480px;border:0;background:#111113"></iframe>',helpers,'three-kingdoms');
 const frame=root.querySelector('#three-kingdoms-frame');
 const receive=event=>{
  if(!frame.isConnected){window.removeEventListener('message',receive);return;}
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='tk3-ready')frame.contentWindow.postMessage({type:'tk3-init',snapshot},location.origin);
  if(event.data?.type==='tk3-save'){
   const {key,value}=event.data;
   if(typeof key!=='string'||!/^(settings|anon|game\.sg(?:03_heroes_over_plums|08_arrows_from_fog|09_huarong_road)|endings\.sg(?:03_heroes_over_plums|08_arrows_from_fog|09_huarong_road))$/.test(key)||JSON.stringify(value)?.length>160000)return;
   if(value===null)delete snapshot[key];else snapshot[key]=value;
   helpers.save('ooc-session-v2-three-kingdoms',snapshot);
   if(key.startsWith('game.')&&helpers.read('ooc-history',[])[0]!==threeKingdoms.id)helpers.save('ooc-history',[threeKingdoms.id,...helpers.read('ooc-history',[]).filter(id=>id!==threeKingdoms.id)]);
  }
 };
 window.addEventListener('message',receive);
 document.title='三国演义 · 命运由你';return true;
}
