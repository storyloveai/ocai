export function sortStories(items,order='played'){
 const count=value=>{const m=/([\d.]+)\s*([KMB]?)/i.exec(String(value||''));return m?Number(m[1])*({K:1e3,M:1e6,B:1e9}[m[2].toUpperCase()]||1):0;};
 return [...items].sort(order==='title'?(a,b)=>a.title.localeCompare(b.title):order==='newest'?(a,b)=>b.id.localeCompare(a.id):(a,b)=>count(b.plays)-count(a.plays));
}
