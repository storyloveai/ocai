// Served only by scripts/credits-site-lab.mjs, never copied into dist.
let current;
export const labAccount = () => current;
export function createAccount({changed}) {
 let generation=0;
 const makeUser=id=>({uid:id,displayName:id==='qa-alice'?'Alice · 模拟账号':'Bob · 模拟账号',getIdToken:async()=>id==='qa-alice'?'qa-only':'qa-only-bob'});
 const a={user:makeUser('qa-alice'),ready:true,restored:true,busy:false,providers:{google:true},paymentConfig:{},error:'',syncError:'',restoreError:'',conflictKeys:[],pendingCount:0,syncing:false,
 read(key,fallback){if(key==='ooc-onboarding-complete')return true;try{return JSON.parse(localStorage.getItem(`qa:${a.user?.uid||'guest'}:${key}`))??fallback;}catch{return fallback;}},
 save(key,value){localStorage.setItem(`qa:${a.user?.uid||'guest'}:${key}`,JSON.stringify(value));},
 scope(){const owner=generation;return {account:a,read:(key,fallback)=>owner===generation?a.read(key,fallback):fallback,save:(key,value)=>{if(owner===generation)a.save(key,value);}};},
 async api(route,body){const owner=a.user;if(!owner)throw Error('请先登录模拟账号');const r=await fetch('/api/'+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await owner.getIdToken()},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(owner!==a.user)throw Error('账号已更换，请重试。');if(!r.ok)throw Object.assign(Error(data.error||'模拟请求失败'),{code:data.code,status:r.status});return data;},
 async init(){a.paymentConfig=await(await fetch('/api/config')).json();changed(false);},
 switchUser(id){generation++;a.user=id?makeUser(id):null;changed(true);},
 login(){a.switchUser('qa-alice');},logout(){a.switchUser(null);},retrySync(){changed(false);},flush:async()=>{}
 };
 current=a;return a;
}
