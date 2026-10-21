// Public title library. Firestore collection `communityTitles` is written and read only through this
// server module (client Firestore rules deny it), so every write is authenticated and validated here.
import {firebaseServices,adminConfigured} from './firebase-admin.js';
export const COLLECTION='communityTitles';
export const ID_PATTERN=/^u-[A-Za-z0-9-]{8,64}$/;
const clip=(v,n)=>typeof v==='string'?v.replace(/\u0000/g,'').trim().slice(0,n):'';
export function sanitizeTitle(input){
 if(!input||typeof input!=='object')throw Error('Invalid title');
 if(!ID_PATTERN.test(input.id))throw Error('Invalid title id');
 const type=input.type==='character'?'character':'story';
 const t={id:input.id,type,title:clip(input.title,50),description:clip(input.description,50),details:clip(input.details,6000),prologue:clip(input.prologue,2000),opening:clip(input.opening,2000),scenario:clip(input.scenario,25)||'Default',guide:clip(input.guide,1000),
  suggestions:(Array.isArray(input.suggestions)?input.suggestions:[]).slice(0,3).map(v=>clip(v,200)).filter(Boolean),visibility:input.visibility==='link'?'link':'public'};
 if(t.title.length<2||!t.description||!t.details||!t.opening)throw Error('Title, introduction, details and opening scene are required');
 const image=typeof input.image==='string'&&/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(input.image)&&input.image.length<=260000?input.image:'';
 return {...t,image};
}
export const publicView=(d,full=false)=>({id:d.id,type:d.type,title:d.title,description:d.description,image:d.image||'',ownerName:d.ownerName||'Creator',publishedAt:d.publishedAt||0,...(full?{details:d.details,prologue:d.prologue,opening:d.opening,scenario:d.scenario,guide:d.guide,suggestions:d.suggestions||[],visibility:d.visibility}:{})});
const windows=new Map();
const limited=key=>{const now=Date.now();for(const [k,v]of windows)if(v.until<now)windows.delete(k);const w=windows.get(key)||{until:now+60000,count:0};if(w.count>=12)return true;w.count++;windows.set(key,w);return false;};
export async function titlesHandler(req,res,env=process.env,services=()=>firebaseServices(env)){
 res.setHeader('X-Content-Type-Options','nosniff');
 if(!adminConfigured(env))return res.status(503).json({error:'Sharing is not configured on the server.'});
 let db;try{db=services().db;}catch{return res.status(503).json({error:'Sharing is not configured on the server.'});}
 const col=db.collection(COLLECTION);
 if(req.method==='GET'){
  const query=req.query||{};
  try{
   if(typeof query.id==='string'){
    if(!ID_PATTERN.test(query.id))return res.status(400).json({error:'Invalid title id'});
    const snap=await col.doc(query.id).get();if(!snap.exists)return res.status(404).json({error:'This title is not available.'});
    res.setHeader('Cache-Control','public, s-maxage=20, stale-while-revalidate=60');return res.status(200).json({title:publicView(snap.data(),true)});
   }
   const type=query.type==='character'?'character':query.type==='story'?'story':null;
   // Single-field ordering only (no composite index to provision); visibility and type are filtered here.
   const snap=await col.orderBy('publishedAt','desc').limit(200).get();
   const titles=snap.docs.map(d=>d.data()).filter(d=>d.visibility==='public'&&(!type||d.type===type)).slice(0,48).map(d=>publicView(d));
   res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=120');return res.status(200).json({titles});
  }catch(error){console.warn(JSON.stringify({event:'titles_read_failed',code:String(error?.code||'unknown').slice(0,40)}));return res.status(502).json({error:'Community titles are temporarily unavailable.'});}
 }
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const origin=req.headers.origin,host=req.headers.host;
 if(!origin||!host||origin!==`https://${host}`)return res.status(403).json({error:'Same-origin browser requests only'});
 const token=String(req.headers.authorization||'').replace(/^Bearer /,'');if(!token)return res.status(401).json({error:'Sign in to share a title.'});
 let user;try{user=await services().auth.verifyIdToken(token,true);}catch{return res.status(401).json({error:'Your sign-in expired. Please sign in again.'});}
 if(limited(user.uid))return res.status(429).json({error:'Please wait a moment before publishing again.'});
 let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(body)||'')>400000)throw Error('large');}catch{return res.status(400).json({error:'Invalid request'});}
 try{
  if(body?.action==='unpublish'){
   if(!ID_PATTERN.test(body.id))return res.status(400).json({error:'Invalid title id'});
   const ref=col.doc(body.id),snap=await ref.get();if(snap.exists){if(snap.data().ownerUid!==user.uid)return res.status(403).json({error:'This title belongs to someone else.'});await ref.delete();}
   return res.status(200).json({ok:true});
  }
  if(body?.action!=='publish')return res.status(400).json({error:'Invalid request'});
  let t;try{t=sanitizeTitle(body.title);}catch(error){return res.status(400).json({error:error.message});}
  const ref=col.doc(t.id),snap=await ref.get();
  if(snap.exists&&snap.data().ownerUid!==user.uid)return res.status(403).json({error:'This title belongs to someone else.'});
  const now=Date.now();
  await ref.set({...t,ownerUid:user.uid,ownerName:clip(user.name||String(user.email||'').split('@')[0],40)||'Creator',publishedAt:snap.exists?(snap.data().publishedAt||now):now,updatedAt:now});
  return res.status(200).json({ok:true,id:t.id,visibility:t.visibility});
 }catch(error){console.warn(JSON.stringify({event:'titles_write_failed',code:String(error?.code||'unknown').slice(0,40)}));return res.status(502).json({error:'Could not save the title. Please try again.'});}
}
