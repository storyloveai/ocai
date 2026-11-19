import first from './episodes/seven-nights.js';
import second from './episodes/seven-nights-ep2.js';
import third from './episodes/seven-nights-ep3.js';
import {seasonKey, impressions, nightPath, julianAt} from '../seven-nights-character.js';
import {currentLang, setLang} from '../site-i18n.js';
import {loadPublicConfig} from '../public-config.js';
import {track} from '../analytics.js';

export const nights = [first, second, third];
export function marks(h) {return impressions(h.read(seasonKey, []));}
export function remember(h, n, branch) {
  const next = impressions([...marks(h), n + ':' + branch]);
  h.save(seasonKey, next);
}
const c = (en,zh) => currentLang()==='zh'?zh:en;
const toggle = () => setLang(currentLang()==='zh'?'en':'zh');
function link(label,href,primary=false) {
  const a=document.createElement('a');
  a.href=href; a.textContent=label; a.dataset.fullInfo='';
  if(primary) a.className='sn-primary';
  return a;
}
function node(tag,text,css) {
  const el=document.createElement(tag);
  if(text) el.textContent=text;
  if(css) el.className=css;
  return el;
}
function button(label,act,css) {
  const b=node('button',label,css);
  b.type='button'; b.onclick=act; return b;
}
function bar(home=true) {
  const b=node('header',null,'sn-bar');
  b.append(home?link('← '+c('Season hub','七夜剧场'),'/seven-nights'):node('span',c('Port Veyron','维伦港')),button(c('中文','EN'),toggle));
  return b;
}

export function mountHub(host,h) {
  const root=node('article',null,'sn-theater');root.dataset.noI18n='';
  function paint() {
    const lang=currentLang(); const collected=marks(h);
    const completed=n=>collected.some(v=>v.startsWith(n+':'));
    const next=nights.find(n=>!completed(n.number)) || third;
    const current=[...nights].reverse().find(n=>completed(n.number)) || first;
    root.lang=lang;document.title=c('Seven Nights · Season One','七夜之约 · 第一季');
    const hero=node('section',null,'sn-hero');
    const inner=node('div',null,'sn-hero-copy');
    inner.append(node('p',c('Season One','第一季'),'sn-kicker'),node('h1',c('2:00 AM · Seven Nights','凌晨两点 · 七夜之约')),
      node('p',c('Seven nights under his roof. One debt he refuses to name.','在他屋檐下住满七夜，换一个他始终不肯说出口的真相。')),
      link(next.number===1?c('Start Episode 1 — Free','免费开始第 1 集'):c('Continue Episode '+next.number,'继续第 '+next.number+' 集'),nightPath(next.number),true));
    hero.append(bar(false),inner);
    const shelf=node('section',null,'sn-shelf');shelf.append(node('h2',c('The episodes','剧集')));
    const rail=node('div',null,'sn-rail');shelf.append(rail);
    for(const ep of nights) {
      const a=link('',nightPath(ep.number)); a.className='sn-episode';
      const img=node('img');img.alt='';img.src=ep.assets.p2Full.image;
      const label=[c('Free · Instant Play','免费 · 立即阅读'),c('Free · Save Progress','免费 · 可存进度'),c('Season Climax','季末高潮')][ep.number-1];
      a.append(img,node('small','Ep. 0'+ep.number),node('h3',ep.title[lang]),node('span',completed(ep.number)?c('Read · Revisit','已读 · 重温'):label));
      if(next===ep)a.classList.add('sn-current');rail.append(a);
    }
    const upcoming=node('section',null,'sn-upcoming');
    const notifyKey='sn-night-four-reminder';
    const notify=button('',()=>{h.save(notifyKey,!h.read(notifyKey,false));paint();});
    notify.textContent=h.read(notifyKey,false)?c('Saved on this device ✓','已在此设备收藏 ✓'):c('Add to watchlist','加入待看');
    upcoming.append(node('small','Ep. 04'),node('h3',c('Night Four','第四夜')),node('span',c('In production','制作中')),notify);rail.append(upcoming);
    const memory=node('section',null,'sn-memory');const portrait=node('img');portrait.src=first.assets.p2Full.image;portrait.alt='';
    const body=node('div');body.append(node('h2',c('Julian Vance','纪沉')));
    const labels=new Set();
    for(const mark of collected){const [n,id]=mark.split(':');for(const tag of nights[Number(n)-1].branches[id].consequenceTags)labels.add(tag[lang]);}
    if(labels.size){const tags=node('ul',null,'lm-tags');for(const text of labels)tags.append(node('li',text));body.append(tags);}
    else body.append(node('p',c('Julian remembers the choices you make in each episode.','每一夜，你做过的选择都会成为纪沉对你的印象。')));
    body.append(link(julianAt(current.scene).scene[lang]+' ↗','/chat/sn-julian?scene='+current.scene));
    memory.append(portrait,body);root.replaceChildren(hero,shelf,memory);
  }
  host.replaceChildren(root);paint();
  track('living_manga_theater_viewed',{series_id:'seven-nights',lang:currentLang(),viewport:window.innerWidth<=767?'mobile':'desktop'});
  window.addEventListener('sd-lang',paint);
  return ()=>{window.removeEventListener('sd-lang',paint);root.remove();};
}

const climax='seven-nights-ep3';
const previewKey='sn-preview-climax-unlocked';
export function gateState(policy,wallet,preview) {
  if(!policy?.ready||!['off','test','live'].includes(policy.mode))return 'unavailable';
  if(policy.mode==='off')return preview?'open':'preview';
  if(!Number.isSafeInteger(policy.prices?.episodeUnlock)||policy.prices.episodeUnlock<=0)return 'unavailable';
  if(!wallet)return 'login';
  if(wallet.unlockedEpisodes?.includes(climax))return 'open';
  if(wallet.fundingPaused)return 'paused';
  return wallet.balance>=policy.prices.episodeUnlock?'purchase':'fund';
}
export function mountGate(host,h,onOpen) {
  const root=node('article',null,'sn-theater sn-gate');root.dataset.noI18n='';host.replaceChildren(root);
  let alive=true,revision=0,policy,wallet,step='loading',busy=false,seen=false,failure=false,stopReader;
  function enter() {
    window.removeEventListener('sd-lang',paint);
    stopReader=onOpen();
  }
  function paint() {
    if(!alive||stopReader)return;
    const card=node('section',null,'sn-gate-copy');
    card.append(node('p',c('Season Climax','季末高潮'),'sn-kicker'),node('h1',third.title[currentLang()]));
    if(step==='preview')card.append(node('p',c('Preview Free Unlock','预览版免费解锁')),button(c('Unlock & read','免费解锁阅读'),unlock,'sn-primary'));
    else if(step==='loading')card.append(node('p',c('Checking access…','正在核对解锁状态……')));
    else if(step==='unavailable')card.append(node('p',c('Access could not be verified.','暂时无法核对解锁状态。')),button(c('Try again','重试'),load));
    else {
      card.append(node('p',c('Unlock for '+policy.prices.episodeUnlock+' credits','解锁需 '+policy.prices.episodeUnlock+' 积分')));
      if(wallet)card.append(node('p',c('Your balance: '+wallet.balance,'当前余额：'+wallet.balance)));
      if(step==='purchase')card.append(button(c('Unlock episode','确认解锁'),unlock,'sn-primary'));
      if(step==='fund')card.append(link(c('Get credits','获取积分'),'/credits',true));
      if(step==='login')card.append(button(c('Sign in','登录'),()=>h.account.login(),'sn-primary'));
      if(step==='paused')card.append(node('p',c('Purchases are paused on this account.','该账户的积分消费已暂停。')));
    }
    if(failure)card.append(node('p',c('Unlock could not be confirmed. Please retry.','解锁未确认，请重试。')));
    root.replaceChildren(bar(),card);if(busy)card.querySelectorAll('button').forEach(b=>b.disabled=true);
  }
  async function load() {
    const request=++revision;step='loading';paint();
    try {
      policy=(await loadPublicConfig()).billing;
      wallet=policy?.enabled&&h.account?.user?await h.account.api('wallet'):undefined;
      if(!alive||request!==revision)return;
      step=gateState(policy,wallet,h.read(previewKey,false));
    }catch{if(!alive||request!==revision)return;step='unavailable';}
    if(step==='open'){enter();return;}
    if(!seen&&step!=='unavailable'){seen=true;track('living_manga_unlock_gate_viewed',{episode_id:climax,billing_mode:policy.mode});}
    paint();
  }
  async function unlock() {
    if(busy||!['preview','purchase'].includes(step))return;
    busy=true;failure=false;paint();
    const preview=step==='preview';
    try {
      if(preview)h.save(previewKey,true);
      else {
        const result=await h.account.api('wallet',{action:'episode-unlock',episodeId:climax});
        if(!result.unlockedEpisodes?.includes(climax))throw Error();
      }
      if(!alive)return;
      track('living_manga_episode_unlocked',{episode_id:climax,unlock_kind:preview?'preview_free':'credits'});
      enter();
    }catch{failure=true;if(alive)await load();}finally{busy=false;if(alive&&!stopReader)paint();}
  }
  window.addEventListener('sd-lang',paint);void load();
  return ()=>{alive=false;window.removeEventListener('sd-lang',paint);stopReader?.();root.remove();};
}
