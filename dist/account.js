const atrack=(name,p={})=>window.storyAnalytics?.track(name,p);
// Public config contains only the Supabase URL and publishable/anon key.
window.storyAccount={ready:false,user:null,wallet:null,payments:false,error:''};
window.accountReady=(async()=>{
 const a=window.storyAccount;
 try{
  const r=await fetch('/api/config');if(!r.ok)throw Error('账户服务暂时不可用。');const cfg=await r.json();a.payments=cfg.payments;a.walletMode=cfg.walletMode;
  if(!cfg.auth){a.error='Google 登录和签到正在准备中。';return;}
  a.provider=cfg.auth.provider||'supabase';
  if(a.provider==='netlify'){
   const sdk=await import('./vendor/netlify-identity.js');a.identity=sdk;
   const normalize=u=>u?{...u,user_metadata:u.userMetadata||{full_name:u.name}}:null;
   const result=await sdk.handleAuthCallback();a.user=normalize(await sdk.getUser());a.ready=true;
   a.client={auth:{getSession:async()=>{await sdk.refreshSession();a.user=normalize(await sdk.getUser());return {data:{session:a.user?{user:a.user}:null}};}}};
   sdk.onAuthChange((_event,user)=>{if(a.user?.id!==user?.id)a.wallet=null;a.user=normalize(user);window.dispatchEvent(new Event('accountchange'));if(a.user)setTimeout(()=>a.refreshWallet(),0);});
   if(a.user&&sessionStorage.getItem('storylove-login-pending')){atrack('login_complete',{method:'google'});sessionStorage.removeItem('storylove-login-pending');}
   if(result&&a.user){const target=sessionStorage.getItem('storylove-login-return');sessionStorage.removeItem('storylove-login-return');if(target==='analytics')location.replace('/analytics.html');else location.hash='profile';}
   await a.refreshWallet();return;
  }
  const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.49.8');
  const client=createClient(cfg.auth.url,cfg.auth.key,{auth:{flowType:'pkce',detectSessionInUrl:false,persistSession:true,autoRefreshToken:true}});
  a.client=client;
  const url=new URL(location.href);
  if(url.searchParams.has('error')){atrack('login_failed',{method:'google',reason:'cancelled'});sessionStorage.removeItem('storylove-login-pending');a.error='Google 登录未完成，请重试。';url.searchParams.delete('error');url.searchParams.delete('error_description');history.replaceState(null,'',url);}
  const code=url.searchParams.get('code');
  if(code){const {error}=await client.auth.exchangeCodeForSession(code);url.searchParams.delete('code');history.replaceState(null,'',url);if(error)throw Error('登录回调已过期，请重新登录。');}
  const {data,error}=await client.auth.getSession();if(error)throw Error('无法恢复登录，请重试。');a.user=data.session?.user||null;a.ready=true;if(a.user&&sessionStorage.getItem('storylove-login-pending')){atrack('login_complete',{method:'google'});sessionStorage.removeItem('storylove-login-pending');}
  client.auth.onAuthStateChange((_event,session)=>{if(a.user?.id!==session?.user?.id)a.wallet=null;a.user=session?.user||null;window.dispatchEvent(new Event('accountchange'));if(a.user)setTimeout(()=>a.refreshWallet(),0);});
  await a.refreshWallet();
 }catch(e){a.error=e.message||'账户服务暂时不可用。';}
 finally{window.dispatchEvent(new Event('accountchange'));}
})();
window.storyAccount.api=async function(path,body){const {data}=await this.client.auth.getSession();if(!data.session)throw Error('请先使用 Google 登录。');const r=await fetch('/api/'+path,{method:body?'POST':'GET',headers:{...(this.provider==='netlify'?{}:{Authorization:'Bearer '+data.session.access_token}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json();if(!r.ok)throw Error(j.error||'请求失败，请重试。');return j;};
window.storyAccount.refreshWallet=async function(){if(!this.user)return;try{this.wallet=await this.api('wallet');this.error='';}catch(e){this.error=e.message;}window.dispatchEvent(new Event('accountchange'));};
window.storyAccount.login=async function(){atrack('login_start',{method:'google'});await window.accountReady;if(!this.ready){atrack('login_failed',{method:'google',reason:'not_configured'});throw Error(this.error||'Google 登录尚未配置。');}sessionStorage.setItem('storylove-login-pending','1');window.storyAnalytics?.beacon();if(this.provider==='netlify'){sessionStorage.setItem('storylove-login-return',location.pathname==='/analytics.html'?'analytics':'profile');try{this.identity.oauthLogin('google')}catch(e){if(e.message==='Redirecting to OAuth provider')return;sessionStorage.removeItem('storylove-login-pending');atrack('login_failed',{method:'google',reason:'provider_error'});throw Error('无法打开 Google 登录，请重试。');}return;}const {error}=await this.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+(location.pathname==='/analytics.html'?'/analytics.html?auth=callback':'/?auth=callback#profile')}});if(error){sessionStorage.removeItem('storylove-login-pending');atrack('login_failed',{method:'google',reason:'provider_error'});throw Error('无法打开 Google 登录，请重试。');}};
window.storyAccount.logout=async function(){if(this.provider==='netlify'){await this.identity.logout();this.user=null;this.wallet=null;atrack('logout');window.dispatchEvent(new Event('accountchange'));return;}const {error}=await this.client.auth.signOut();if(error)throw Error('退出失败，请重试。');this.user=null;this.wallet=null;atrack('logout');};

