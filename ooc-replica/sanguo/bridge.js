// Account-scoped handshake. An embedded campaign never reads another account's local save.
if (parent !== window) {
 const receive = event => {
  if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'sg2-init') return;
  window.removeEventListener('message', receive);
  const snapshot = event.data.snapshot || {};
  const send = (key,value) => parent.postMessage({type:'sg2-save',key:'campaign.'+key,value},location.origin);
  startCampaign({get:(key,fallback)=>snapshot['campaign.'+key]??fallback,set:(key,value)=>{snapshot['campaign.'+key]=value;send(key,value);},del:key=>{delete snapshot['campaign.'+key];send(key,null);}});
 };
 window.addEventListener('message',receive);
 parent.postMessage({type:'sg2-ready'},location.origin);
} else {
 document.body.replaceChildren(Object.assign(document.createElement('a'),{href:'/play/three-kingdoms',textContent:'进入三国 · 谋士 / Open The Strategist'}));
}
