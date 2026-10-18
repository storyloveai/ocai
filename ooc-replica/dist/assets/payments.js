import { renderCredits } from './credits-view.js';
export function createPayments({ account, show, modal, notify, storage = sessionStorage, redirect = url => location.assign(url) }) {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let tab = ['buy','auto','free'].includes(new URL(location.href).searchParams.get('creditTab')) ? new URL(location.href).searchParams.get('creditTab') : 'buy', selected;
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
    root.querySelector('[data-wallet-refresh]')?.addEventListener('click', async () => { await refresh(); await verify(); });
    root.querySelector('[data-checkin]')?.addEventListener('click', checkin);
    root.querySelectorAll('[data-pack]').forEach(button => button.addEventListener('click', () => checkout(Number(button.dataset.pack))));
  }
  async function refresh() {
    if (!account.user || !cfg().walletConfigured) { draw(); return; }
    const version = generation;
    try { const result = await account.api('wallet'); if (current(version)) { wallet = result; error = ''; } }
    catch (e) { if (current(version)) error = e.message; }
    if (current(version)) draw();
  }
  async function checkin() {
    if (busy) return;
    const version = generation; busy = true; draw();
    try { const result = await account.api('checkin', {}); if (current(version)) { wallet = result; error = ''; } }
    catch (e) { if (current(version)) error = e.message; }
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
        if (status.credited) { storage.removeItem(key()); notice = '充值已到账。'; error = ''; await refresh(); return; }
        if (status.status === 'expired') { storage.removeItem(key()); notice = '订单已过期，未到账。'; draw(); return; }
        notice = status.paid ? '付款已确认，正在等待到账。可稍后刷新余额。' : '订单尚未完成付款。'; draw();
        if (!status.paid) return;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (e) { if (current(version)) { error = e.message; draw(); } }
    finally { if (current(version)) polling = false; }
  }
  async function checkout(pack) {
    if (!account.user) { account.login(); return; }
    if (busy) return;
    const version = generation; const pendingKey = key(); busy = true; error = ''; draw();
    const attemptKey = pendingKey + ':attempt:hosted:' + pack;
    let requestId = storage.getItem(attemptKey);
    if (!requestId) { requestId = crypto.randomUUID(); storage.setItem(attemptKey, requestId); }
    try {
      notice = '正在跳转至 Stripe 安全收银台…'; draw();
      const result = await account.api('checkout', { pack, request_id: requestId, ui_mode: 'hosted' });
      if (!current(version)) return;
      const target = new URL(result.url);
      if (target.protocol !== 'https:' || target.hostname !== 'checkout.stripe.com' || target.username || target.password || target.port) throw Error('无法打开安全付款页面。');
      if (/^cs_[\w]+$/.test(result.session_id || '')) storage.setItem(pendingKey, result.session_id);
      storage.removeItem(attemptKey);
      redirect(target.href);
    } catch (e) {
      if (current(version)) { error = e.message; notice = ''; notify(e.message); }
    } finally { if (current(version)) { busy = false; draw(); } }
  }

  return {
    mount(element) { root = element; root.classList.add('credits-root'); const doc=root.ownerDocument;if (!doc.querySelector('link[data-credits-style]')) { const link=doc.createElement('link');link.rel='stylesheet';link.href='/assets/credits.css';link.dataset.creditsStyle='';doc.head.append(link); } draw(); void refresh(); void verify(); },
    sync() {
      if (observedConfig !== cfg()) { observedConfig = cfg(); draw(); }
      if (owner !== account.user?.uid) {
        owner = account.user?.uid; generation++; wallet = null; error = ''; notice = ''; busy = false; polling = false;
        const url = new URL(location.href), session = url.searchParams.get('session_id');
        if (owner && url.searchParams.get('checkout')) {
          if (/^cs_[\w]+$/.test(session || '')) storage.setItem(key(), session);
          if (url.searchParams.get('checkout') === 'cancelled') { storage.removeItem(key()); notice = '付款已取消，未扣款。'; }
          url.searchParams.delete('session_id'); url.searchParams.delete('checkout'); history.replaceState({}, '', url);
        }
        draw(); void refresh(); void verify();
      }
    },
  };
}
