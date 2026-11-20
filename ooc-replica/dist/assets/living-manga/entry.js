import sevenNights from './episodes/seven-nights.js';
import sanguo from './episodes/sanguo-plum.js';
import {mountReader} from './reader.js';
import {currentLang, setLang} from '../site-i18n.js';

export function startLivingManga(host) {
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  const episode = win.location.pathname === '/pilot/seven-nights' ? sevenNights : sanguo;
  const style = doc.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('./reader.css', import.meta.url).href;
  doc.head.append(style);
  doc.body.classList.add('lm-reading');
  let stop;
  const mount = () => { stop = mountReader(host, episode, {getLanguage: currentLang, changeLanguage: setLang}); };
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
