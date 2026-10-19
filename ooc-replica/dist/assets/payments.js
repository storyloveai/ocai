function paymentError(error){
 const message=String(error?.message||'');
 if(!/[\u3400-\u9fff]/.test(message))return message||'Something went wrong. Please try again.';
 if(/登录|账户已更换/.test(message))return 'Please sign in again to continue.';
 if(/钱包|到账/.test(message))return 'Your balance is temporarily unavailable. Please try again shortly.';
 if(/过期|超时/.test(message))return 'The request timed out. Please try again.';
 return 'Unable to complete this request. Please try again shortly.';
}
import { renderCredits } from './credits-view.js';
export function createPayments({ account, show, modal, notify, storage = sessionStorage, redirect = url => location.assign(url) }) {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let tab = ['buy','auto','free'].includes(new URL(location.href).searchParams.get('creditTab')) ? new URL(location.href).searchParams.get('creditTab') : 'buy', selected;
  let walletRequest, walletRequestVersion;
  let root, wallet, error = '', notice = '', busy = false, owner = null, generation = 0, polling = false, observedConfig;
  const cfg = () => account.paymentConfig;
  const key = () => `replica-payment:${cfg().auth?.config?.projectId}:${cfg().walletMode}:${owner}`;
  const current = version => version === generation && owner === account.user?.uid;
  function draw() {
    if (!root?.isConnected) return;
    const packs = cfg().creditPacks || [];
    if (!packs.some(p => p.credits === selected)) selected = packs[1]?.credits || packs[0]?.credits;
    root.innerHTML = renderCredits({config:cfg(),wallet,user:account.user,error,notice,busy,tab,selected});
    const selectTab = next => {tab=next;const url=new URL(location.href);url.searchParams.set('creditTab',tab);history.replaceState({},'',url);draw();root.querySelector(`#credits-tab-${tab}`)?.focus();};
    root.querySelectorAll('[data-credit-tab]').forEach(button=>button.addEventListener('click',()=>selectTab(button.dataset.creditTab)));
    root.querySelector('[role=tablist]')?.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();const tabs=['buy','auto','free'];selectTab(event.key==='Home'?'buy':event.key==='End'?'free':tabs[(tabs.indexOf(tab)+(event.key==='ArrowRight'?1:2))%3]);
    });
    root.querySelectorAll('[name=credits-pack]').forEach(input=>input.addEventListener('change',()=>{selected=Number(input.value);root.querySelectorAll('.credits-pack').forEach(row=>row.classList.toggle('is-selected',Number(row.querySelector('input').value)===selected));}));
    root.querySelector('[data-buy-selected]')?.addEventListener('click',()=>checkout(selected));
    root.querySelector('[data-credit-history]')?.addEventListener('click',()=>show(`<div class="credits-history-dialog"><h2>Credit History</h2>${error?`<p role="alert">${esc(error)}</p>`:''}${wallet?`<p>Current balance: ${wallet.balance.toLocaleString()} Credits</p>`:'<p>Balance unavailable. Sign in or refresh your balance to load your history.</p>'}${(wallet?.ledger||[]).map(item=>`<div class="credits-ledger-row"><span>${item.type==='purchase'?'Credit purchase':'Daily check-in'}<small>${esc(item.at)}</small></span><strong>+${esc(item.amount)}</strong></div>`).join('')||'<p>No transactions to show.</p>'}</div>`));
    root.querySelector('[data-credit-info]')?.addEventListener('click',()=>show('<h2>About Credits</h2><p>Credits belong to your signed-in account. Payments are securely processed by Stripe. Current chats do not deduct credits.</p>'));
    root.querySelector('[data-wallet-refresh]')?.addEventListener('click', async () => { await refresh(true); await verify(); });
    root.querySelector('[data-checkin]')?.addEventListener('click', checkin);
    root.querySelectorAll('[data-pack]').forEach(button => button.addEventListener('click', () => checkout(Number(button.dataset.pack))));
  }
  async function refresh(force=false) {
    if (!account.user || !cfg().walletConfigured) { draw(); return; }
    const version = generation;
    if(walletRequest&&walletRequestVersion===version){if(!force)return walletRequest;await walletRequest;if(!current(version))return;}
    walletRequestVersion=version;
    const request=(async()=>{
    try { const result = await account.api('wallet'); if (current(version)) { wallet = result; error = ''; } }
    catch (e) { if (current(version)) error = paymentError(e); }
    if (current(version)) draw();
    })();walletRequest=request;try{await request;}finally{if(walletRequest===request)walletRequest=null;}
  }
  async function checkin() {
    if (busy) return;
    const version = generation; busy = true; draw();
    try { const result = await account.api('checkin', {}); if (current(version)) { wallet = result; error = ''; } }
    catch (e) { if (current(version)) error = paymentError(e); }
    finally { if (current(version)) { busy = false; draw(); } }
  }
  async function verify() {
    if (!account.user || owner !== account.user.uid || polling) return;
    const session = storage.getItem(key());
    if (!session) return;
    const version = generation; polling = true;
    try {
      for (let i = 0; i < 8 && current(version); i++) {
        const status = await account.api('checkout-status?session_id=' + encodeURIComponent(session));
        if (!current(version)) return;
        if (status.credited) { storage.removeItem(key()); notice = 'Your Credits have been added.'; error = ''; draw();await refresh(true); return; }
        if (status.status === 'expired') { storage.removeItem(key()); notice = 'This checkout expired. No Credits were added.'; draw(); return; }
        notice = status.paid ? 'Payment confirmed. Your Credits are being added.' : 'Payment has not been completed.'; draw();
        if (!status.paid) return;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (e) { if (current(version)) { error = paymentError(e); draw(); } }
    finally { if (current(version)) polling = false; }
  }
  async function checkout(pack) {
    if (!account.user) { account.login(); return; }
    if (busy) return;
    const version = generation; const checkoutRoot=root;let redirected=false;const pendingKey = key(); busy = true; error = ''; notice = 'Opening secure Stripe checkout…'; draw();
    const attemptKey = pendingKey + ':attempt:hosted-page:' + pack;
    let requestId = storage.getItem(attemptKey);
    if (!requestId) { requestId = crypto.randomUUID(); storage.setItem(attemptKey, requestId); }
    try {
      const result = await account.api('checkout', { pack, request_id: requestId, ui_mode: 'hosted', ...(wallet?.checkoutReady?{checkoutReady:wallet.checkoutReady}:{}) });
      if (!current(version)||root!==checkoutRoot||!checkoutRoot.isConnected) return;
      const target = new URL(result.url);
      if (target.protocol !== 'https:' || target.hostname !== 'checkout.stripe.com' || target.username || target.password || target.port) throw Error('Unable to open secure checkout. Please try again.');
      if (/^cs_[\w]+$/.test(result.session_id || '')) storage.setItem(pendingKey, result.session_id);
      storage.removeItem(attemptKey);
      redirect(target.href);redirected=true;
    } catch (e) {
      if (current(version)) { error = paymentError(e); notice = ''; notify(paymentError(e)); }
    } finally { if (current(version)&&!redirected) { busy = false; draw(); } }
  }

  return {
    mount(element) { const requestedTab=new URL(location.href).searchParams.get('creditTab');tab=['buy','auto','free'].includes(requestedTab)?requestedTab:'buy';root = element; root.classList.add('credits-root'); const doc=root.ownerDocument;if (!doc.querySelector('link[data-credits-style]')) { const link=doc.createElement('link');link.rel='stylesheet';link.href='/assets/credits.css';link.dataset.creditsStyle='';doc.head.append(link); } draw(); void refresh(); void verify(); },
    sync() {
      if (observedConfig !== cfg()) { observedConfig = cfg(); draw(); }
      if (owner !== account.user?.uid) {
        owner = account.user?.uid; generation++; wallet = null; error = ''; notice = ''; busy = false; polling = false;
        const url = new URL(location.href), session = url.searchParams.get('session_id');
        if (owner && url.searchParams.get('checkout')) {
          if (/^cs_[\w]+$/.test(session || '')) storage.setItem(key(), session);
          if (url.searchParams.get('checkout') === 'cancelled') { storage.removeItem(key()); notice = 'Checkout cancelled. No payment was taken.'; }
          url.searchParams.delete('session_id'); url.searchParams.delete('checkout'); history.replaceState({}, '', url);
        }
        draw(); void refresh(); void verify();
      }
    },
  };
}
