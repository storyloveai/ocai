// Public DOM snapshots supply layout; this module supplies independent interactions.
const style=document.createElement('link');
style.rel='stylesheet';style.href='/assets/reference.css';style.media='not all';
const stylesheetReady=new Promise((resolve,reject)=>{style.onload=resolve;style.onerror=()=>reject(new Error('Reference stylesheet could not load'));});
document.head.append(style);
const [evidence, coreAssets] = await Promise.all([
  fetch('/assets/reference-pages.json').then(r => r.json()),
  fetch('/assets/core-assets.json').then(r => r.json()),
  stylesheetReady
]);
const assets={...coreAssets};
const host = document.createElement('div');
host.id = 'precision-view';
document.body.insertBefore(host, document.querySelector('#modal'));
// Keep the first paint small; the complete offline asset catalogue arrives later.
fetch('/assets/catalog-assets.json').then(r=>r.json()).then(full=>{Object.assign(assets,full);if(context&&!host.hidden)hydrate();}).catch(()=>{});
const legacy = document.querySelector('link[href="/style.css"]');
let context, carousel, current = 1, activeFeatures=evidence.features;
const featureIds = ['6ab3b736e2e641b7fbeb6312','6ab70e13499de207c7ca13c4','6aaad8746c080a5d3ff0402a','6ac749a7ab586f53935a023d','6ac749fc973e4d7b825f7520','6ab2217bfa760164cd6c2f12'];
const palettes={
  'Sovereign SA':['rgb(165, 146, 126)','rgb(144, 137, 187)','rgb(0, 39, 28)'],
  'Dating the Strongest Hero':['rgb(65, 50, 75)','rgb(135, 103, 98)','rgb(209, 186, 224)'],
  'APEX Heroes Academy':['rgb(140, 160, 213)','rgb(186, 163, 143)','rgb(27, 36, 57)'],
  'Failed Knight of the Swordsmanship Family SA':['rgb(66, 73, 96)','rgb(187, 206, 226)','rgb(60, 45, 36)'],
  'Hey There Goes Your Girlfriend':['rgb(195, 177, 150)','rgb(188, 186, 205)','rgb(63, 44, 26)'],
  'I Became the Commander of the Trash Knight Order':['rgb(204, 164, 138)','rgb(164, 161, 191)','rgb(7, 8, 1)']
};
evidence.features.forEach((d,i) => d.href = '/story/' + featureIds[i]);
const source = d => assets[d.asset] || d.image;
const q = s => host.querySelector(s);
const all = s => [...host.querySelectorAll(s)];
const text = e => e.textContent.trim();
const safe = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const catalog = [...evidence.catalog,...(evidence.characters||[])];
for(const f of evidence.characterFeatures||[]){const id=f.href.split('/').pop();if(!catalog.some(d=>d.id===id))catalog.push({...f,id,type:'character',author:'',plays:'',genre:'Others',original:false});}
const cardMarkup = new Map();
const templateDocument = new DOMParser().parseFromString(evidence.pages.home,'text/html');
templateDocument.querySelectorAll('a[href^="/story/"]').forEach(a => {
  if (a.querySelector('[data-name]')) cardMarkup.set(a.getAttribute('href').split('/').pop(),a.outerHTML);
});
const characterDocument=new DOMParser().parseFromString(evidence.pages.character,'text/html');
characterDocument.querySelectorAll('a[href^="/character/"]').forEach(a=>{if(a.querySelector('[data-radix-aspect-ratio-wrapper]')&&a.querySelector('p'))cardMarkup.set(a.getAttribute('href').split('/').pop(),a.outerHTML);});
export const extraStories = catalog.map(d => ({...d, image:source(d),genre:'Others'}));

function hydrate() {
  all('img[data-asset]').forEach(img => {
    const local = assets[img.dataset.asset];
    if(local) img.src = local;
  });
  all('button').forEach(b => {
    const label=text(b);
    if(!b.getAttribute('aria-label') && !label) b.setAttribute('aria-label','More options');
    if(label==='Search') b.onclick=()=>context.navigate('/search');
    if(label.startsWith('Continue with')) b.dataset.action='login';
    if(label==='New Play') b.dataset.play=location.pathname.split('/')[2];
    if(b.getAttribute('aria-label')==='Back to Previous Page') b.onclick=()=>context.navigate('/');
  });
  all('a[href^="/announcement/"]').forEach(a=>a.onclick=e=>{e.preventDefault();e.stopPropagation();context.show('<h2>Title Publishing Bug Resolved</h2><p>The publishing issue has been resolved.</p>');});
  all('a').filter(a=>text(a)==='View All').forEach(a=>{
    let parent=a.parentElement;
    while(parent&&parent!==host){const heading=parent.querySelector('h2');if(heading){a.href='/collection?name='+encodeURIComponent(text(heading));break;}parent=parent.parentElement;}
  });
  all('a[href^="/policy/"]').forEach(a=>{a.href='https://ooc.ai'+a.getAttribute('href');a.target='_blank';a.rel='noopener noreferrer';});
  all('a[href="/profile"]').forEach(a=>a.onclick=e=>{e.preventDefault();e.stopPropagation();context.show('<h2>Your profile</h2><p>This independent replica uses local bookmarks and story sessions. Account services are not connected.</p>');});
  all('a[href^="/arpg/"]').forEach(a=>a.onclick=e=>{e.preventDefault();e.stopPropagation();context.show('<h2>Dice of Fate</h2><p>This public banner is reproduced visually. AIRPG backend services are not connected to this replica.</p>');});
  const sidebar=q('[data-shrink]');
  if(sidebar){
    const toggle=sidebar.querySelector('button');
    toggle.setAttribute('aria-label','Collapse sidebar');
    toggle.onclick=()=>{
      const shrink=sidebar.dataset.shrink!=='true';sidebar.dataset.shrink=String(shrink);
      const content=sidebar.nextElementSibling;
      if(content) content.style.marginLeft=shrink?'48px':'';
      toggle.setAttribute('aria-expanded',String(!shrink));
    };
  }
}

function updateHero(step) {
  current=(current+step+activeFeatures.length)%activeFeatures.length;
  const f=activeFeatures[current],desktop=q('[data-hero-desktop]');
  if(!desktop||!f)return;
  desktop.querySelector('h1').textContent=f.title;
  desktop.querySelector('h1 + p').textContent=f.description;
  desktop.querySelector('a').href=f.href;
  const imgs=[...desktop.querySelectorAll('img')];
  imgs.forEach((img,i)=>{
    const d=activeFeatures[(current+i+activeFeatures.length-1)%activeFeatures.length];img.src=source(d);img.alt=d.title;
  });
  const active=imgs[1]?.parentElement.querySelector('a');if(active)active.href=f.href;
  if(palettes[f.title])all('[style*="radial-gradient"]').forEach((e,i)=>e.style.color=palettes[f.title][i]);
  const mobile=q('[data-mobile-track]');
  if(mobile)mobile.style.transform=`translate3d(${-current*100}%,0,0)`;
  all('[data-ref-dot]').forEach((b,i)=>b.setAttribute('aria-current',String(i===current)));
}

function bindHome(page) {
  activeFeatures=page==='character'?(evidence.characterFeatures||[]):evidence.features;
  all('button').filter(b=>text(b)==='Previous slide'||text(b)==='Next slide').forEach(b=>{
    b.setAttribute('aria-label',text(b));b.dataset.refStep=text(b)==='Previous slide'?'-1':'1';b.onclick=()=>updateHero(Number(b.dataset.refStep));
  });
  all('button').filter(b=>context.categories.includes(text(b))).forEach(b=>{
    b.onclick=()=>{
      const label=text(b);
      if(label==='Main')context.navigate(page==='character'?'/character':'/');
      else context.navigate('/collection?name='+encodeURIComponent(label));
    };
  });
  all('button').filter(b=>text(b).startsWith('#')).forEach(b=>b.onclick=()=>context.navigate('/search?q='+encodeURIComponent(text(b).slice(1))));
  const title=q('[data-hero-desktop] h1');
  current=Math.max(0,activeFeatures.findIndex(f=>f.title===title?.textContent));
  if(activeFeatures.length){
    updateHero(0);
    if(!new URLSearchParams(location.search).has('inspection')&&!matchMedia('(prefers-reduced-motion: reduce)').matches) carousel=setInterval(()=>{
      if(!document.hidden&&!document.querySelector('#modal').open)updateHero(1);
    },6500);
  }
  // The captured mobile carousel retains its six original slides.
  const mobileHeading=all('h2').find(h=>h.classList.contains('text-white'));
  const mobileTrack=mobileHeading?.parentElement?.parentElement?.parentElement;
  if(mobileTrack&&mobileTrack.children.length===activeFeatures.length){
    mobileTrack.dataset.mobileTrack='';
    mobileTrack.style.transition='transform 500ms ease';
    let start;
    mobileTrack.addEventListener('touchstart',e=>start=e.touches[0].clientX,{passive:true});
    mobileTrack.addEventListener('touchend',e=>{if(start!==undefined&&Math.abs(e.changedTouches[0].clientX-start)>35)updateHero(e.changedTouches[0].clientX<start?1:-1);},{passive:true});
  }
}

function bindDetail() {
  const id=location.pathname.split('/')[2];
  all('button').filter(b=>b.querySelector('path')?.getAttribute('d')?.startsWith('M11.31 2.16')).forEach(b=>{
    b.dataset.favorite=id;b.dataset.referenceFavorite='true';b.setAttribute('aria-label','Bookmark story');
    const selected=context.read('ooc-favorites',[]).includes(id);b.setAttribute('aria-pressed',String(selected));b.style.color=selected?'#e0ff2e':'';
  });
  all('button').filter(b=>text(b)==='Information'||text(b)==='Comment').forEach(b=>b.onclick=()=>{
    if(text(b)==='Comment') all('h2, h3, span').find(h=>text(h)==='Comments')?.scrollIntoView({behavior:'smooth'});
    else window.scrollTo({top:0,behavior:'smooth'});
  });
  all('[role="combobox"]').forEach(b=>b.onclick=()=>{
    const preview=text(b)==='Character Preview';
    context.show(preview?'<h2>Preview</h2><button class="primary" data-ref-preview="characters">Character Preview</button><button class="primary" data-ref-preview="prologue">Prologue Preview</button>':'<h2>Starting Scenarios</h2><p>Arrival at Lumencia Academy</p><button class="primary" data-play="69f414d90abbab6f6a2c8131">New Play</button>');
    document.querySelectorAll('[data-ref-preview]').forEach(choice=>choice.onclick=()=>{
      document.querySelector('#modal').close();
      const heading=all('h2').find(h=>text(h)==='Prologue Preview');
      if(choice.dataset.refPreview==='prologue')heading?.scrollIntoView({behavior:'smooth'});
    });
  });
  all('button').filter(b=>text(b)==='View AllFold').forEach(b=>{
    b.textContent='View All'; b.onclick=()=>{
      const expanded=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!expanded));b.textContent=expanded?'View All':'Fold';
      const section=b.parentElement.parentElement;
      const clipping=section.querySelector('[class*="max-h-"]');if(clipping)clipping.style.maxHeight=expanded?'':'none';
    };
  });
  const play=all('button').find(b=>text(b)==='New Play');
  if(play){
    const bookmark=play.nextElementSibling;
    if(bookmark?.tagName==='BUTTON'){
      bookmark.dataset.favorite=id;bookmark.setAttribute('aria-label','Bookmark story');
      if(context.read('ooc-favorites',[]).includes(bookmark.dataset.favorite))bookmark.innerHTML='♥';
    }
  }
  all('button').filter(b=>text(b)==='Most Liked').forEach(b=>b.onclick=()=>{
    context.show('<h2>Sort comments</h2><button class="primary" data-ref-sort="Most Liked">Most Liked</button><button class="primary" data-ref-sort="Newest">Newest</button>');
    document.querySelectorAll('[data-ref-sort]').forEach(choice=>choice.onclick=()=>{b.textContent=choice.dataset.refSort;document.querySelector('#modal').close();});
  });
}

function grid(items){return `<div class="precision-grid">${items.map(d=>cardMarkup.get(d.id)||`<a href="/story/${d.id}"><img src="${source(d)}" alt="${safe(d.title)}"><p>${safe(d.title)}</p></a>`).join('')}</div>`;}
function bindSearch() {
  const inputs=all('input');
  inputs.forEach(i=>{i.setAttribute('aria-label','Search stories and characters');i.oninput=()=>{
    inputs.forEach(other=>other.value=i.value);
    let results=q('#precision-results');
    if(!results){results=document.createElement('section');results.id='precision-results';results.className='precision-search-results';const content=q('[class*="space-y-4"]');(content||q('#reference-root')).prepend(results);}
    const query=i.value.trim().toLowerCase();
    const found=catalog.filter(d=>(d.title+' '+d.author).toLowerCase().includes(query));
    results.innerHTML=query?`<h2>${found.length} results</h2>${found.length?grid(found):'<p>No matching stories found.</p>'}`:'';
    [...results.parentElement.children].filter(e=>e!==results).forEach(e=>e.style.display=query?'none':'');
    hydrate();
  };});
  const query=new URLSearchParams(location.search).get('q');
  if(query&&inputs[0]){inputs[0].value=query;inputs[0].dispatchEvent(new Event('input'));}
  const back=all('button').find(b=>!text(b));if(back){back.setAttribute('aria-label','Back to stories');back.onclick=()=>context.navigate('/');}
}

export function show(path, helpers) {
  clearInterval(carousel);context=helpers;
  const page=path==='/'?'home':path==='/character'?'character':path==='/search'?'search':path==='/story/69f414d90abbab6f6a2c8131'?'detail':evidence.pages[path]?'captured-detail':path==='/collection'?'collection':path.startsWith('/character/')?'character-detail':null;
  host.hidden=!page;style.media=page?'all':'not all';legacy.disabled=Boolean(page);
  host.dataset.page=page||'';
  document.body.dataset.reference=String(Boolean(page));
  delete document.body.dataset.inspection;
  if(!page)return false;
  host.innerHTML=evidence.pages[page==='collection'||page==='character-detail'?'home':page==='captured-detail'?path:page];
  if(page==='character-detail'){
    const d=catalog.find(d=>d.type==='character'&&d.id===path.split('/')[2]);
    const content=q('[data-shrink]')?.nextElementSibling;
    if(d&&content){
      content.innerHTML=`<div class="precision-collection"><a href="/character">‹ Character Information</a><div class="precision-character-detail"><img src="${source(d)}" alt="${safe(d.title)}"><div><h1>${safe(d.title)}</h1><p>${safe(d.author)}</p><p>${safe(d.description||'')}</p><button class="precision-play" data-play="${d.id}">New Play</button><button class="precision-play" data-favorite="${d.id}" aria-label="Bookmark character">♡</button></div></div><small>Independent local preview. This character's complete information has not been captured.</small></div>`;
    }else if(content)content.innerHTML='<div class="precision-collection"><a href="/character">‹ Back to characters</a><h1>Character unavailable</h1></div>';
  }
  if(page==='collection'){
    const name=new URLSearchParams(location.search).get('name')||'Top Ranked';
    const content=q('[data-shrink]')?.nextElementSibling;
    if(content){
      const known=context.data.filter(d=>d.genre===name);
      const items=name==='OOC Originals'?catalog.filter(d=>d.original):name==='Fantasy'||name==='Romance'?known:catalog;
      content.innerHTML=`<div class="precision-collection"><a href="/">‹ Back</a><h1>${safe(name)}</h1>${grid(items)}</div>`;
    }
  }
  hydrate();
  if(page==='home'||page==='character')bindHome(page);
  if(page==='detail'||page==='captured-detail')bindDetail();
  if(page==='search')bindSearch();
  // Read-only captured consent state for screenshot comparison; no acceptance action.
  if(page==='home'&&new URLSearchParams(location.search).get('inspection')==='reference-terms'){
    document.body.dataset.inspection='reference-terms';
    q('#reference-root').firstElementChild.insertAdjacentHTML('beforeend',evidence.overlays||'');
    all('[role="dialog"] button').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();});
  }
  document.title=(page==='detail'||page==='captured-detail')?(q('h1')?.textContent||'Information')+' · OOC':'OOC · Interactive stories';
  return true;
}
