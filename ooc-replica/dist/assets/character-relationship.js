// Deliberately conservative: explicit visitor expressions, never inferred
// affection scores or a claim that an offer was mutually accepted.
const pair=(zh,en)=>({zh,en});
const normalize=text=>String(text||'').normalize('NFKC').toLowerCase().replace(/[\s，。！？、,.!?;；:：]+/gu,'').replace(/[’‘]/g,"'");
const rule=(id,topic,label,meaning,phrases)=>({id,topic,label,meaning,phrases:new Set(phrases.map(normalize))});
const rules={
 'oc-gu-chengye':[
  rule('work-pause','work',pair('你提出先不谈方案','You asked to leave work aside'),'At this point the visitor asked to pause work. This is not a permanent ban: follow newer corrections and the latest topic. No dinner or future meeting was agreed.',[
   '今晚先不谈工作。','我今晚不想继续工作了。','我不想继续加班了。','今天不谈方案。','我们先休息一会儿吧。','模型先放一放。你今天吃过晚饭没有？','我说今晚不谈设计，问他平时怎么放松。',
   "I don't want to keep working tonight. I'm going home, not agreeing to dinner.","I don't want to work tonight.",'Let’s leave work aside tonight.','Leave the model for a moment. Have you had dinner?','No design talk tonight. How do you usually unwind?']),
  rule('work-resume','work',pair('你想继续聊方案','You want to discuss the design again'),'The visitor now wants to resume discussing the design; this supersedes their earlier work pause, not every other boundary.',[
   '我们继续谈方案吧。','我改主意了，我们继续聊方案。','现在可以谈工作了。','Let’s discuss the design again.','I changed my mind. We can work on the design now.']),
  rule('shared-work-offer','collaboration',pair('你提出一起试改入口','You offered to try the entrance together'),'The visitor offered to work on the entrance together. It is an offer, not proof that the character accepted or that a design is finished.',[
   '我愿意和你一起改入口。','我们可以一起试试这个入口。','I would like to try changing the entrance with you.','We could work on the entrance together.'])
 ],
 'oc-song-zhixia':[
  rule('browse-only','visit',pair('你想留下，但暂不买花','You want company without buying flowers'),'The visitor wants to stay or browse without buying. Welcome company without turning it into a sale. This does not establish sadness or a romantic bond.',[
   '我今天不想买花，只想坐一会儿。','我不买花，只想坐一会儿。','我说不买花也想进来看看，可以吗？','Is it all right if I just look around today?',"I don't want to buy flowers. I'd just like to sit here."]),
  rule('flowers-for-self','visit',pair('你想给自己挑花','You want flowers for yourself'),'The visitor wants to choose flowers for themselves. No purchase or payment has yet been completed, and no gift recipient or loss should be invented.',[
   '我想给自己买一束花。','这束花我买给自己。','I would like to buy flowers for myself.']),
  rule('garden-help-offer','garden',pair('你提出帮忙照看花','You offered to help with the plants'),'The visitor offered help with plants. Ask or confirm a small task; do not invent that a visit, work or breakfast already happened.',[
   '我愿意帮你照看屋顶的花。','我愿意帮一点忙，你先告诉我别碰哪盆。','I can help a little. Which plants should I leave alone?','I would like to help look after your rooftop plants.'])
 ],
 'oc-yan-fei':[
  rule('no-pact','pact',pair('你说清楚了：先不签契约','You made clear: no pact for now'),'The visitor declined a pact or purchase. Keep any pact inactive and move the paper aside if appropriate now. Shelter and company carry no hidden charge or binding terms.',[
   '我不签契约，也不买东西，只想坐一会儿。','我不签契约，也不买东西，只想借地方坐会儿。','我不签契约。','今晚不签契约。',"I don't want a contract or a purchase. Could I just sit here until the rain stops?",'No pact tonight.','I do not want to sign a pact.']),
  rule('consider-pact','pact',pair('你愿意先听契约条件','You are willing to hear the terms'),'The visitor is willing to hear terms, not sign or consent. A previous refusal is no longer a reason to avoid explaining, but the pact remains inactive.',[
   '我改主意了，可以先听听契约条件。','我想看看契约，先说说条件。','I changed my mind. I would like to hear the terms.']),
  rule('shelter-request','company',pair('你问过能否只借个位置','You asked for a place to sit'),'The visitor asked whether they may stay without a purchase. This is a question, not a purchase, promise, admission of loneliness or accepted bargain.',[
   '我先问，如果什么也不买，能不能坐一会儿。','Could I sit a while without buying anything?','我只借个干燥角落，保证不问收费。','Just a dry corner. I promise not to ask about the rate.'])
 ]
};
export const reunionEnabled=id=>Object.hasOwn(rules,id);
const complete=m=>m?.role==='assistant'&&Boolean(m.text?.trim())&&!m.failed&&!m.stopped&&!m.streaming;
export function completedExchanges(messages){return messages.reduce((n,m,i)=>n+(m.role==='user'&&complete(messages[i+1])?1:0),0);}
export function reunionReady(messages){return completedExchanges(messages)>0&&complete(messages.at(-1));}
export function relationshipMoments(id,messages){
 const selected=new Map();if(!reunionEnabled(id))return [];
 for(let i=0;i<messages.length;i++){
  const m=messages[i];if(m.role!=='user'||!complete(messages[i+1])||typeof m.text!=='string'||m.text.length>600)continue;
  const matched=rules[id].find(r=>r.phrases.has(normalize(m.text)));if(matched)selected.set(matched.topic,{id:matched.id,topic:matched.topic,label:matched.label,meaning:matched.meaning,source:{turn:i,role:'user',text:m.text}});
 }
 return [...selected.values()].sort((a,b)=>a.source.turn-b.source.turn);
}
export function relationshipMemory(id,messages,limit=1100){
 const moments=relationshipMoments(id,messages);if(!moments.length)return '';
 const header='VISITOR CHOICES (historical quotes; offers are not agreements; newer conversation and corrections win):\n';let text=header;
 for(const m of [...moments].reverse()){
  const full=JSON.stringify({visitorSaid:Array.from(m.source.text).slice(0,180).join(''),meaning:m.meaning});
  const brief=JSON.stringify({visitorSaid:Array.from(m.source.text).slice(0,100).join(''),choice:m.label.en});
  const line=text.length+full.length+1<=limit?full:brief;
  if(text.length+line.length+1<=limit)text+=line+'\n';
 }
 return text===header?'':text.trimEnd();
}
export function characterContinuityMemory(id,messages,kept='',extra=''){
 const clip=(text,max)=>{let out='';for(const c of String(text||'')){if(out.length+c.length>max)break;out+=c;}return out;};
 const manual=[clip(kept,1600),clip(extra,350)].filter(Boolean).join('\n');
 const choices=relationshipMemory(id,messages,2000-manual.length-(manual?1:0));
 return [manual,choices].filter(Boolean).join('\n');
}
export function reunionAnchor(id,messages){
 const moment=relationshipMoments(id,messages).at(-1);if(moment&&moment.source.turn>=messages.length-12)return moment;
 for(let i=messages.length-2;i>=0;i--)if(messages[i].role==='user'&&complete(messages[i+1]))return {label:pair('上次聊到这里','Where you left off'),source:{turn:i,role:'user',text:messages[i].text}};
 return null;
}
