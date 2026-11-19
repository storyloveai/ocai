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
  doc.head.append(style);
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
    stop = path==='/seven-nights' ? mountHub(host,helpers)
      : episode.number===3 ? mountGate(host,helpers,reader) : reader();
  };
  const suspend = () => { stop?.(); stop = undefined; };
  const restore = event => { if (event.persisted && !stop) mount(); };
  function dispose() {
    win.removeEventListener('pagehide', suspend);
    win.removeEventListener('pageshow', restore);
    suspend();
    doc.body.classList.remove('lm-reading');
    style.remove();
  }
  try {
    mount();
    win.addEventListener('pagehide', suspend);
    win.addEventListener('pageshow', restore);
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
