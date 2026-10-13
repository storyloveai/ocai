import {packs} from '../data/credit-packs.mjs';
import {HttpError} from './platform.mjs';
const validId=id=>typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
export function createNetlifyWallet({store,now=()=>Date.now(),mode='live'}={}){
 const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now()));
 const wallet=s=>({balance:s.balance,checked:s.ledger.some(x=>x.reference==='checkin:'+day()),history:s.ledger.slice(-50).reverse().map(({kind,delta,created_at})=>({kind,delta,created_at}))});
 async function update(user,mutate){if(!validId(user))throw new HttpError(400,'无效账户。');const key=(mode==='test'?'wallet/test/':'wallet/')+user;for(let n=0;n<20;n++){const current=await store.getWithMetadata(key,{type:'json',consistency:'strong'});const state=current?structuredClone(current.data):{balance:0,ledger:[],rate:{start:0,count:0}};const result=mutate(state);if(result.noop)return result.value;const written=await store.setJSON(key,state,current?{onlyIfMatch:current.etag}:{onlyIfNew:true});if(written.modified)return result.value;}throw new HttpError(503,'账户更新繁忙，请重试。');}
 return {async rpc(name,p){const user=p.p_user;switch(name){
 case 'storylove_wallet':return update(user,s=>({noop:true,value:wallet(s)}));
 case 'storylove_checkin':return update(user,s=>{const reference='checkin:'+day();if(s.ledger.some(x=>x.reference===reference))return {noop:true,value:{...wallet(s),claimed:false}};s.balance+=100;s.ledger.push({reference,kind:'checkin',delta:100,created_at:new Date(now()).toISOString()});return {value:{...wallet(s),claimed:true}};});
 case 'storylove_purchase_status':return update(user,s=>({noop:true,value:s.ledger.some(x=>x.reference==='stripe:'+p.p_session)}));
 case 'storylove_purchase':return update(user,s=>{if(!Number.isSafeInteger(p.p_credits)||!Object.hasOwn(packs,p.p_credits)||!/^cs_[\w]+$/.test(p.p_session))throw new HttpError(400,'无效订单。');const reference='stripe:'+p.p_session;if(s.ledger.some(x=>x.reference===reference))return {noop:true,value:wallet(s)};s.balance+=p.p_credits;s.ledger.push({reference,kind:'purchase',delta:p.p_credits,created_at:new Date(now()).toISOString()});return {value:wallet(s)};});
 case 'storylove_chat_limit':return update(user,s=>{const r=s.rate||{start:0,count:0};s.rate=now()-r.start>=60000?{start:now(),count:1}:{start:r.start,count:r.count+1};return {value:s.rate.count<=8};});
 default:throw new HttpError(400,'不支持的账户操作。');
 }}};
}
export async function netlifyWallet({mode='live'}={}){const {getStore}=await import('@netlify/blobs');return createNetlifyWallet({mode,store:getStore({name:'storylove-wallets-v1',consistency:'strong'})});}
