export function hasSession(value){return Array.isArray(value)?value.length>0:Boolean(value&&typeof value==='object'&&Object.keys(value).some(k=>k.startsWith('game.')||k==='campaign.save'));}
export function historyIds(read,data){return [...new Set([...read('ooc-history',[]),...data.filter(d=>hasSession(read('ooc-session-v2-'+d.id,null))).map(d=>d.id)])];}
export function lastSessionText(value){if(Array.isArray(value))return value.findLast(m=>m.text&&!m.failed)?.text||'';return value&&typeof value==='object'?'三国演义 · 继续已保存的篇章':'';}
