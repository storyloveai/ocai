import {writeFile} from 'node:fs/promises';
import {campaigns} from '../book-campaigns/catalog.mjs';
const txt=x=>typeof x==='string'?x:x?.zh||'';
for(const c of Object.values(campaigns)){
 const rows=['# '+txt(c.title),'','完整编排阅读稿，含支线、规则与结局剧透。场景与对白为项目新写；AI在运行时根据当前处境生成自由对白。','',c.adaptation,''];
 const effects=es=>(es||[]).map(e=>`${txt(c.vars[e.set||e.add]?.label)||e.set||e.add} ${e.set?String(e.to):(e.by>=0?'+':'')+e.by}`).join('；');
 for(const ch of c.chapters){
  rows.push('## '+ch.title,'',...ch.intro.map(p=>txt(p.text)),'');
  for(const n of Object.values(c.nodes).filter(n=>n.chapter===ch.id)){
   rows.push('### '+n.title+' · '+({main:'主线',side:'支线',interrupt:'突发事件'}[n.kind]),'',`地点：${n.place}。在场：${n.cast.map(x=>txt(c.chars[x.id].name)).join('、')}。`,'',...n.intro.map(p=>txt(p.text)),'');
   if(n.ask)rows.push('开放问题：'+n.ask.q,'',...n.ask.answers.map(a=>`- ${a.means}：${a.out.map(p=>txt(p.text)).join(' ')}（${effects(a.effects)||'不改变数值'}）`),'');
   for(const choice of n.choices)rows.push('- **'+choice.label+'**'+(choice.req?'（'+choice.hint+'）':''),'',...choice.out.map(p=>'  '+txt(p.text)),`\n  规则：${effects(choice.effects)||'保持现有数值'}${choice.debt?'；留下旧账 '+choice.debt.join('、'):''}${choice.resolve?'；结算 '+choice.resolve.map(x=>x.join('→')).join('、'):''}${choice.echo?'；留下回响 '+choice.echo.join('、'):''}。`,'');
   if(n.callbacks?.length)rows.push('后续回响：','',...n.callbacks.map(cb=>'- '+txt(cb.text)),'');
  }
 }
 rows.push('## 结局片段','');for(const group of c.endings)rows.push('### '+group.title,'',...group.fragments.map(f=>'- '+f.id+'：'+txt(f.text)),'');
 await writeFile(new URL('../book-campaigns/READING-'+c.id+'.md',import.meta.url),rows.join('\n')+'\n');
 console.log(c.id+': '+c.chapters.length+' chapters, '+Object.keys(c.nodes).length+' nodes, '+Object.values(c.nodes).reduce((n,s)=>n+s.choices.length,0)+' choices');
}
