import {julian,sceneId} from './seven-nights-character.js';

export function recordVisit(scope, id) {
  const ids=scope.read('ooc-history',[]);
  if (ids[0] !== id) scope.save('ooc-history',[id,...ids.filter(previous=>previous!==id)]);
}

export function historyDestination(item,read) {
  if (item.id===julian.id) {
    const scene=sceneId(read('ooc-session-v2-sn-julian-last-scene',null));
    return scene==='ep1_study'?julian.playUrl:julian.playUrl+'?scene='+scene;
  }
  return item.playUrl || '/play/'+item.id;
}

export function hasSession(value){return Array.isArray(value)?value.length>0:Boolean(value&&typeof value==='object'&&Object.keys(value).some(k=>k.startsWith('game.')||k==='campaign.save'));}
export function historyIds(read,data){return [...new Set([...read('ooc-history',[]),...data.filter(d=>hasSession(read('ooc-session-v2-'+d.id,null))).map(d=>d.id)])];}
import {LATEST,progressText} from './xichuan-state.js';
export function lastSessionText(value){if(value?.[LATEST])return progressText(value,globalThis.document?.documentElement?.lang?.startsWith('zh')?'zh':'en');if(Array.isArray(value))return value.findLast(m=>m.text&&!m.failed)?.text||'';return value&&typeof value==='object'?(value.book?[value.title,value.summary].filter(Boolean).join(' · '):'三国演义 · 继续已保存的篇章'):'';}
