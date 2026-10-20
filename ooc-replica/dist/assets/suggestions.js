// Suggestions use a separate short request; narration keeps its existing stream.
export function parseSuggestions(text){
 try{
  const list=JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
  if(!Array.isArray(list)||list.length!==3||list.some(s=>typeof s!=='string'||!s.trim()||s.length>180||/[<>\n\r]/.test(s)))return [];
  const clean=list.map(s=>s.trim());
  return new Set(clean.map(s=>s.toLocaleLowerCase())).size===3?clean:[];
 }catch{return [];}
}

export class SuggestionLoader{
 constructor(request){this.request=request;this.version=0;}
 cancel(){this.version++;this.controller?.abort();}
 async load(context){
  this.cancel();const version=this.version,controller=this.controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),25000);
  try{
   let text='';for await(const part of this.request(context,controller.signal)){if(text.length+part.length>3000)throw Error('Suggestions too long');text+=part;}
   return version===this.version&&!controller.signal.aborted?parseSuggestions(text):null;
  }catch{return version===this.version?[]:null;}
  finally{clearTimeout(timer);}
 }
}
