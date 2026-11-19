import {nights, mountHub, mountGate, remember, marks} from './season.js';
import {nightPath} from '../seven-nights-character.js';
import sanguo from './episodes/sanguo-plum.js';
import {mountReader} from './reader.js';
import {currentLang, setLang} from '../site-i18n.js';

export function startLivingManga(host, helpers) {
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  const path=win.location.pathname;
  const episode=nights.find(n=>nightPath(n.number)===path) || sanguo;
  const style = doc.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('./reader.css', import.meta.url).href;
  let ready=false, active=true, disposed=false;
  doc.body.classList.add('lm-reading');
  let stop;
  const reader = () => mountReader(host,episode,{
    getLanguage:currentLang, changeLanguage:setLang, account:helpers?.account,
    saveForLogin:async()=>{
      const guestMarks=marks(helpers);
      const owner=await helpers.account.login();
      if(!owner || helpers.account.user?.uid!==owner)return;
      for(const mark of guestMarks) {
        const [n,id]=mark.split(':');
        remember(helpers.account,Number(n),id);
      }
      if(win.location.pathname===nightPath(2))helpers.navigate(nightPath(3));
    },
    onComplete:(number,id)=>{if(helpers)remember(helpers,number,id);}
  });
  const mount = () => {
    if(!ready||!active||disposed||stop)return;
    stop = path==='/seven-nights' ? mountHub(host,helpers)
      : episode.number===3 ? mountGate(host,helpers,reader) : reader();
  };
  const suspend = () => { active=false; stop?.(); stop = undefined; };
  const restore = event => { if (event.persisted) {active=true;mount();} };
  function dispose() {
    disposed=true;style.onload=style.onerror=null;
    win.removeEventListener('pagehide', suspend);
    win.removeEventListener('pageshow', restore);
    suspend();
    doc.body.classList.remove('lm-reading');
    style.remove();
  }
  try {
    style.onload=()=>{ready=true;mount();};
    style.onerror=()=>{
      if(disposed)return;
      const retry=doc.createElement('button');
      retry.textContent=currentLang()==='zh'?'重新加载剧场':'Reload theater';
      retry.onclick=()=>win.location.reload();host.replaceChildren(retry);
    };
    doc.head.append(style);
    win.addEventListener('pagehide', suspend);
    win.addEventListener('pageshow', restore);
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
