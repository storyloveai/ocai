// Public DOM snapshots supply layout; this module supplies independent interactions.
const [evidence, assets] = await Promise.all([
  fetch('/assets/reference-pages.json').then(r => r.json()),
  fetch('/assets/catalog-assets.json').then(r => r.json())
]);
const host = document.createElement('div');
host.id = 'precision-view';
document.body.insertBefore(host, document.querySelector('#modal'));
const style = document.createElement('link');
style.rel = 'stylesheet'; style.href = '/assets/reference.css'; style.disabled = true;
document.head.append(style);
const legacy = document.querySelector('link[href="/style.css"]');
let context, carousel, current = 1;
const featureIds = ['6ab3b736e2e641b7fbeb6312','6ab70e13499de207c7ca13c4','6aaad8746c080a5d3ff0402a','6ac749a7ab586f53935a023d','6ac749fc973e4d7b825f7520','6ab2217bfa760164cd6c2f12'];
evidence.features.forEach((d,i) => d.href = '/story/' + featureIds[i]);
const source = d => assets[d.asset] || d.image;
const q = s => host.querySelector(s);
const all = s => [...host.querySelectorAll(s)];
const text = e => e.textContent.trim();
const safe = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const catalog = evidence.catalog;
const cardMarkup = new Map();
const templateDocument = new DOMParser().parseFromString(evidence.pages.home,'text/html');
templateDocument.querySelectorAll('a[href^="/story/"]').forEach(a => {
  if (a.querySelector('[data-name]')) cardMarkup.set(a.getAttribute('href').split('/').pop(),a.outerHTML);
});
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
  current=(current+step+6)%6;
  const f=evidence.features[current],desktop=q('[data-hero-desktop]');
  if(!desktop||!f)return;
  desktop.querySelector('h1').textContent=f.title;
  desktop.querySelector('h1 + p').textContent=f.description;
  desktop.querySelector('a').href=f.href;
  const imgs=[...desktop.querySelectorAll('img')];
  imgs.forEach((img,i)=>{
    const d=evidence.features[(current+i+5)%6];img.src=source(d);img.alt=d.title;
  });
  const active=imgs[1]?.parentElement.querySelector('a');if(active)active.href=f.href;
  const mobile=q('[data-mobile-track]');
  if(mobile)mobile.style.transform=`translate3d(${-current*100}%,0,0)`;
  all('[data-ref-dot]').forEach((b,i)=>b.setAttribute('aria-current',String(i===current)));
}

function bindHome(page) {
  all('[data-ref-step]').forEach(b=>b.onclick=()=>updateHero(Number(b.dataset.refStep)));
  all('button').filter(b=>context.categories.includes(text(b))).forEach(b=>{
    b.onclick=()=>{
      const label=text(b);
      if(label==='Main')context.navigate(page==='character'?'/character':'/');
      else context.navigate('/collection?name='+encodeURIComponent(label));
    };
  });
  all('button').filter(b=>text(b).startsWith('#')).forEach(b=>b.onclick=()=>context.navigate('/search?q='+encodeURIComponent(text(b).slice(1))));
  const title=q('[data-hero-desktop] h1');
  current=Math.max(0,evidence.features.findIndex(f=>f.title===title?.textContent));
  if(page==='home'){
    updateHero(0);
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches) carousel=setInterval(()=>{
      if(!document.hidden&&!document.querySelector('#modal').open)updateHero(1);
    },6500);
  }
  // The captured mobile carousel retains its six original slides.
  const mobileHeading=all('h2').find(h=>h.classList.contains('text-white'));
  const mobileTrack=mobileHeading?.parentElement?.parentElement?.parentElement;
  if(mobileTrack&&mobileTrack.children.length===6){
    mobileTrack.dataset.mobileTrack='';
    mobileTrack.style.transition='transform 500ms ease';
    let start;
    mobileTrack.addEventListener('touchstart',e=>start=e.touches[0].clientX,{passive:true});
    mobileTrack.addEventListener('touchend',e=>{if(start!==undefined&&Math.abs(e.changedTouches[0].clientX-start)>35)updateHero(e.changedTouches[0].clientX<start?1:-1);},{passive:true});
  }
}

function bindDetail() {
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
      bookmark.dataset.favorite='69f414d90abbab6f6a2c8131';bookmark.setAttribute('aria-label','Bookmark story');
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
    if(!results){results=document.createElement('section');results.id='precision-results';results.className='precision-search-results';q('#reference-root').append(results);}
    const query=i.value.trim().toLowerCase();
    const found=catalog.filter(d=>(d.title+' '+d.author).toLowerCase().includes(query));
    results.innerHTML=query?`<h2>${found.length} results</h2>${found.length?grid(found):'<p>No matching stories found.</p>'}`:'';
    all('[data-slot="empty-inline"]').forEach(e=>e.parentElement.parentElement.hidden=Boolean(query));
    hydrate();
  };});
  const query=new URLSearchParams(location.search).get('q');
  if(query&&inputs[0]){inputs[0].value=query;inputs[0].dispatchEvent(new Event('input'));}
  const back=all('button').find(b=>!text(b));if(back){back.setAttribute('aria-label','Back to stories');back.onclick=()=>context.navigate('/');}
}

export function show(path, helpers) {
  clearInterval(carousel);context=helpers;
  const page=path==='/'?'home':path==='/character'?'character':path==='/search'?'search':path==='/story/69f414d90abbab6f6a2c8131'?'detail':path==='/collection'?'collection':null;
  host.hidden=!page;style.disabled=!page;legacy.disabled=Boolean(page);
  document.body.dataset.reference=String(Boolean(page));
  if(!page)return false;
  host.innerHTML=evidence.pages[page==='collection'?'home':page];
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
  if(page==='detail')bindDetail();
  if(page==='search')bindSearch();
  document.title=page==='detail'?'Lumencia Academy · OOC':'OOC · Interactive stories';
  return true;
}
