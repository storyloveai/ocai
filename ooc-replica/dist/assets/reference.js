import {bookMetadata} from './book-catalog.js';
import {updateShelf} from './hero-shelf.js';
import {initSocial,bindSocial,creatorLink} from './social.js';
import {bindDisclosures} from './disclosure.js';
import {bindCarousels} from './carousels.js';
import {paintBrand} from './brand.js';
import {sortStories} from './catalog-sort.js';
import {threeKingdoms} from './three-kingdoms.js';
import {storydateOriginals,storydateCharacters} from './storydate-originals.js';
import {paintSidebar} from './site-shell.js';
import {openTitlePreview,closeTitlePreview} from './title-preview.js';
// Public DOM snapshots supply layout; this module supplies independent interactions.
const style=document.createElement('link');
style.rel='stylesheet';style.href='/assets/reference.css';style.media='not all';
const layoutStyle=document.createElement('link');layoutStyle.rel='stylesheet';layoutStyle.href='/assets/brand-layout.css';
const layoutReady=new Promise((resolve,reject)=>{layoutStyle.onload=resolve;layoutStyle.onerror=()=>reject(new Error('Brand stylesheet could not load'));});
const stylesheetReady=new Promise((resolve,reject)=>{style.onload=resolve;style.onerror=()=>reject(new Error('Reference stylesheet could not load'));});
document.head.append(style,layoutStyle);
const [evidence, coreAssets, titlePreviews] = await Promise.all([
  fetch('/assets/reference-pages.json').then(r => r.json()),
  fetch('/assets/core-assets-index.json').then(r => r.json()),
  fetch('/assets/title-previews.json').then(r=>r.ok?r.json():{titles:{}}).catch(()=>({titles:{}})),
  stylesheetReady,layoutReady
]);
const assets={...coreAssets};
const host = document.createElement('div');
host.id = 'precision-view';
document.body.insertBefore(host, document.querySelector('#modal'));
// Keep the first paint small; the complete offline asset catalogue arrives later.
fetch('/assets/catalog-assets-index.json').then(r=>r.json()).then(full=>{Object.assign(assets,full);if(context&&!host.hidden)hydrate();}).catch(()=>{});
const legacy = document.querySelector('link[href="/style.css"]');
let context, carousel, current = 1, activeFeatures=evidence.features;
const featureIds = ['6ab3b736e2e641b7fbeb6312','6ab70e13499de207c7ca13c4','6aaad8746c080a5d3ff0402a','6ac749a7ab586f53935a023d','6ac749fc973e4d7b825f7520','6ab2217bfa760164cd6c2f12'];
const palettes={
  '三国演义 · 谋士':['rgb(169, 137, 95)','rgb(116, 128, 128)','rgb(43, 38, 24)'],
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
// StoryDate originals take over part of the captured catalogue; each one keeps its own id.
const replaceMap=new Map(storydateOriginals.map(d=>[d.replaces,d]));
evidence.catalog=evidence.catalog.map(d=>replaceMap.get(d.id)||d);
const characterMap=new Map(storydateCharacters.map(d=>[d.replaces,d]));
evidence.characters=(evidence.characters||[]).map(d=>characterMap.get(d.id)||d);
const lumencia=evidence.catalog.find(d=>d.id==='69f414d90abbab6f6a2c8131');if(lumencia)lumencia.sortPlays='0';
function patchOriginals(root){
  root.querySelectorAll('a[href^="/character/"]').forEach(a=>{
    const d=characterMap.get(a.getAttribute('href').split('/').pop());if(!d)return;
    a.setAttribute('href','/character/'+d.id);
    a.querySelectorAll('img').forEach(img=>{if(!img.classList.contains('object-cover'))return;img.src=d.image;img.alt=d.title;img.removeAttribute('data-asset');img.removeAttribute('srcset');});
    const ps=a.querySelectorAll('p');if(ps[0])ps[0].textContent=d.title;if(ps[1])ps[1].textContent=d.description;if(ps[2])ps[2].textContent=d.author;
  });
  root.querySelectorAll('a[href^="/story/"]').forEach(a=>{
    const d=replaceMap.get(a.getAttribute('href').split('/').pop());if(!d)return;
    a.setAttribute('href','/story/'+d.id);
    const name=a.querySelector('[data-name]');if(name)name.textContent=d.title;
    a.querySelectorAll('img').forEach(img=>{if(img.alt==='ORIGINAL')return;img.src=d.image;img.alt=d.title;img.removeAttribute('data-asset');img.removeAttribute('srcset');img.removeAttribute('sizes');});
    const meta=a.querySelector('p:not([data-name])');if(meta)meta.textContent=d.tag;
  });
}
const catalog = [threeKingdoms,...bookMetadata,...evidence.catalog,...(evidence.characters||[])];
evidence.features[0]={...threeKingdoms};
for(const f of evidence.characterFeatures||[]){const id=f.href.split('/').pop();if(!catalog.some(d=>d.id===id))catalog.push({...f,id,type:'character',author:'',plays:'',genre:'Others',original:false});}
initSocial(catalog,evidence,titlePreviews);
const cardMarkup = new Map();
const templateDocument = new DOMParser().parseFromString(evidence.pages.home,'text/html');
patchOriginals(templateDocument);
templateDocument.querySelectorAll('a[href^="/story/"]').forEach(a => {
  if (a.querySelector('[data-name]')) cardMarkup.set(a.getAttribute('href').split('/').pop(),a.outerHTML);
});
const characterDocument=new DOMParser().parseFromString(evidence.pages.character,'text/html');
characterDocument.querySelectorAll('a[href^="/character/"]').forEach(a=>{if(a.querySelector('[data-radix-aspect-ratio-wrapper]')&&a.querySelector('p'))cardMarkup.set(a.getAttribute('href').split('/').pop(),a.outerHTML);});
const collections=new Map();
for(const [kind,doc]of [['story',templateDocument],['character',characterDocument]]){
 for(const section of doc.querySelectorAll('section')){
  const heading=section.querySelector('h2');if(!heading)continue;
  const ids=[...section.querySelectorAll(`a[href^="/${kind}/"]`)].map(a=>a.getAttribute('href').split('/')[2]);
  if(ids.length)collections.set(kind+':'+text(heading),[...new Set(ids)]);
 }
}
export const extraStories = catalog.map(d => ({...d, image:source(d),genre:d.genre||'Others'}));
const searchIndex=new Map(catalog.map(d=>[d.id,[d.title,d.title_zh,d.author,d.description,d.description_zh,d.genre].filter(Boolean).join(' ').toLowerCase()]));
for(const [id,record]of Object.entries(titlePreviews.titles)){const doc=new DOMParser().parseFromString(record.html,'text/html');searchIndex.set(id,(searchIndex.get(id)||'')+' '+[...doc.querySelectorAll('a')].filter(a=>a.textContent.trim().startsWith('#')).map(a=>a.textContent.trim().slice(1).toLowerCase()).join(' '));}

function hydrate() {
  paintBrand(host);
  all('img[data-asset]').forEach(img => {
    const local = assets[img.dataset.asset];
    if(local) img.src = local;
    img.decoding='async';
    if(!img.closest('[data-hero-desktop],[data-mobile-track]'))img.loading='lazy';
  });
  all('button').forEach(b => {
    const label=text(b);
    if(!b.getAttribute('aria-label') && !label) b.setAttribute('aria-label','More options');
    if(label==='Search') b.onclick=()=>context.navigate('/search');
    if(label.startsWith('Continue with')) b.dataset.action='login';
    if(label==='New Play') b.dataset.play=location.pathname.split('/')[2];
    if(b.getAttribute('aria-label')==='Back to Previous Page') b.onclick=()=>window.history.length>1?window.history.back():context.navigate('/');
  });
  all('a').filter(a=>text(a)==='View All').forEach(a=>{
    let parent=a.parentElement;
    while(parent&&parent!==host){const heading=parent.querySelector('h2');if(heading){a.href='/collection?name='+encodeURIComponent(text(heading))+(host.dataset.page==='character'?'&type=character':'');break;}parent=parent.parentElement;}
  });
  all('a[href^="/policy/"]').forEach(a=>{a.href='https://ooc.ai'+a.getAttribute('href');a.target='_blank';a.rel='noopener noreferrer';});
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
  updateShelf(desktop,activeFeatures,current,source,updateHero);
  if(step&&!matchMedia('(prefers-reduced-motion: reduce)').matches){for(const el of desktop.querySelectorAll('h1,h1 + p')){el.getAnimations?.().forEach(a=>a.cancel());el.animate?.([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'ease-out'});}}
  if(palettes[f.title])all('[style*="radial-gradient"]').forEach((e,i)=>{e.dataset.shelfGradient='';e.style.color=palettes[f.title][i];});
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
    let pointerOrigin;
    // The captured Main tab carries a lime border/text; selection is drawn by .category-selected instead.
    b.classList.remove('border-brand','text-brand');
    if(text(b)==='Main'&&!b.dataset.categoryTab){b.dataset.categoryTab='';b.setAttribute('aria-pressed','true');b.classList.add('category-selected');}
    b.onpointerdown=event=>{pointerOrigin={x:window.scrollX||0,y:window.scrollY||0};event.preventDefault();};
    b.onclick=event=>{if(event?.detail>0)b.blur();
      const scroll=pointerOrigin||{x:window.scrollX||0,y:window.scrollY||0};pointerOrigin=null;host.style.overflowAnchor='none';
      const label=text(b);
      const buttons=all('button').filter(button=>context.categories.includes(text(button)));
      const carouselRegion=b.closest('[role="region"]')||b.parentElement.parentElement;
      const region=carouselRegion.parentElement?.classList.contains('sticky')?carouselRegion.parentElement.parentElement:carouselRegion;
      let panel=q('[data-category-panel]');
      if(!panel){panel=document.createElement('section');panel.dataset.categoryPanel='';panel.className='inline-category-panel';region.after(panel);}
      // Keep the hero, navigation and tab strip mounted; only their content panel changes.
      const container=region.parentElement;
      let after=false;
      for(const child of container.children){if(child===region){after=true;continue;}if(after&&child!==panel){if(!child.hasAttribute('data-category-original-hidden'))child.dataset.categoryOriginalHidden=String(child.hidden);child.hidden=label==='Main'?child.dataset.categoryOriginalHidden==='true':true;}}
      panel.hidden=label==='Main';
      buttons.forEach(button=>{const selected=text(button)===label;button.dataset.categoryTab='';button.setAttribute('aria-pressed',String(selected));button.classList.toggle('category-selected',selected);});
      if(label!=='Main'){
        const available=catalog.filter(d=>page==='character'?d.type==='character':d.type!=='character');
        const items=['New Ranking','Rankings','Today'].includes(label)?sortStories(available,label==='New Ranking'?'newest':'played'):available.filter(d=>(context.data.find(x=>x.id===d.id)?.genre||d.genre)===label);
        panel.innerHTML=`<div class="collection-heading"><h2>${safe(label)}</h2><label>Sort by <select aria-label="Sort category"><option value="featured">Featured</option><option value="played">Most Played</option><option value="newest">Newest</option><option value="title">Title A–Z</option></select></label></div><div data-category-grid>${items.length?grid(items,label==='Rankings'):'<p>No titles in this category yet.</p>'}</div>`;
        panel.querySelector('select').onchange=event=>{panel.querySelector('[data-category-grid]').innerHTML=grid(event.target.value==='featured'?items:sortStories(items,event.target.value),label==='Rankings');hydrate();};hydrate();
      }
      // Disabling scroll anchoring avoids a jump when the content below shrinks.
      host.style.overflowAnchor='none';
      const restore=()=>window.scrollTo?.({left:scroll.x,top:scroll.y,behavior:'instant'});restore();window.requestAnimationFrame?.(restore);
    };
  });
  all('button').filter(b=>text(b).startsWith('#')).forEach(b=>b.onclick=()=>context.navigate('/search?q='+encodeURIComponent(text(b).slice(1))));
  const title=q('[data-hero-desktop] h1');
  current=page==='home'?0:Math.max(0,activeFeatures.findIndex(f=>f.title===title?.textContent));
  if(activeFeatures.length){
    updateHero(0);
    if(!new URLSearchParams(location.search).has('inspection')&&!matchMedia('(prefers-reduced-motion: reduce)').matches) carousel=setInterval(()=>{
      if(!document.hidden&&!document.querySelector('#modal').open&&!q('[data-hero-desktop]')?.matches(':hover,:focus-within'))updateHero(1);
    },6500);
  }
  // The captured mobile carousel retains its six original slides.
  const mobileHeading=all('h2').find(h=>h.classList.contains('text-white'));
  const mobileTrack=mobileHeading?.parentElement?.parentElement?.parentElement;
  if(mobileTrack&&mobileTrack.children.length===activeFeatures.length){
    mobileTrack.dataset.mobileTrack='';
    mobileTrack.style.transition='transform 320ms cubic-bezier(.16,1,.3,1)';mobileTrack.style.transform=`translate3d(${-current*100}%,0,0)`;
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
  bindDisclosures(host);
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

function pinThreeKingdoms(){
 const first=all('h2').find(h=>text(h)==='Top Ranked')?.closest('section')?.querySelector('a [data-name]')?.closest('a');
 if(first){
  const card=first.cloneNode(true);card.href=threeKingdoms.href;
  card.querySelector('[data-name]').textContent=threeKingdoms.title;
  const cover=card.querySelector('img');cover.src=threeKingdoms.image;cover.alt=threeKingdoms.title;cover.removeAttribute('data-asset');cover.loading='eager';
  const meta=card.querySelector('p:not([data-name])');if(meta)meta.textContent=threeKingdoms.plays;
  const slide=first.closest('[aria-roledescription="slide"]');
  if(slide){const slot=slide.cloneNode(false);const wrap=document.createElement("div");wrap.className="w-full";wrap.append(card);slot.append(wrap);slide.parentElement.prepend(slot);}else first.parentElement.before(card);
  for(const book of [...bookMetadata].reverse()){
   const bookCard=card.cloneNode(true);bookCard.href=book.href;bookCard.querySelector('[data-name]').textContent=book.title;
   bookCard.querySelectorAll('img').forEach(img=>{if(img.alt==='ORIGINAL'){img.parentElement.remove();return;}img.src=book.image;img.alt=book.title;img.removeAttribute('data-asset');});
   const note=bookCard.querySelector('p:not([data-name])');if(note)note.textContent=book.plays;
   const placed=card.closest('[aria-roledescription="slide"]');if(placed){const slot=placed.cloneNode(false);const wrap=document.createElement('div');wrap.className='w-full';wrap.append(bookCard);slot.append(wrap);placed.after(slot);}else card.after(bookCard);
   cardMarkup.set(book.id,bookCard.outerHTML);
  }
  if(slide)slide.parentElement.append(slide); // Lumencia Academy moves to the end of the rail
  const section=first.closest('section');section.querySelectorAll('span.typo-text-base_leading-none_semibold').forEach((rank,i)=>rank.textContent=String(i+1));
  card.querySelectorAll('img').forEach(img=>{if(img.alt==='Lumencia Academy'){img.alt=threeKingdoms.title;img.src=threeKingdoms.image;img.removeAttribute('data-asset');}});
  cardMarkup.set(threeKingdoms.id,card.outerHTML);
 }
 const mobile=all('h2').find(h=>h.classList.contains('text-white'))?.closest('a');
 if(mobile){mobile.href=threeKingdoms.href;mobile.querySelector('h2').textContent=threeKingdoms.title;const desc=mobile.querySelector('h2')?.nextElementSibling;if(desc)desc.textContent=threeKingdoms.description;mobile.querySelectorAll('img').forEach(img=>{img.src=threeKingdoms.image;img.alt=threeKingdoms.title;img.removeAttribute('data-asset');});}
}

function bindExploreSort(page){
 const heading=all('h2').find(h=>text(h)==='Explore'),section=heading?.closest('section'),button=heading?.parentElement.querySelector('button');
 if(!section||!button)return;
 const select=document.createElement('select');select.setAttribute('aria-label','Sort stories');select.style.cssText='background:#19191c;border:1px solid #36363c;border-radius:8px;color:#ccc;padding:7px 12px;font:inherit;font-size:13px';select.innerHTML='<option value="played">Most Played</option><option value="newest">Newest</option><option value="title">Title A–Z</option>';button.replaceWith(select);
 const container=section.children[1];const nodes=[...container.children];
 const records=nodes.map(node=>({node,id:node.querySelector('a')?.getAttribute('href')?.split('/').pop()}));
 const draw=()=>{const available=records.map(r=>({...catalog.find(d=>d.id===r.id),id:r.id,node:r.node})).filter(d=>d.title);sortStories(available,select.value).forEach(d=>container.append(d.node));};select.onchange=draw;draw();
}

function grid(items,ranked=false){
 return `<div class="precision-grid">${items.map((d,index)=>{
  const holder=document.createElement('div');holder.innerHTML=cardMarkup.get(d.id)||`<a href="/${d.type==='character'?'character':'story'}/${d.id}"><img src="${source(d)}" alt="${safe(d.title)}"><p>${safe(d.title)}</p></a>`;
  const anchor=holder.firstElementChild;
  anchor.querySelectorAll('span[class~="typo-text-base_leading-none_semibold"]').forEach(rank=>{if(/^\d+$/.test(text(rank))){const badge=rank.parentElement;if(text(badge)===text(rank))badge.remove();else rank.remove();}});
  if(ranked)anchor.dataset.gridRank=String(index+1);
  return anchor.outerHTML;
 }).join('')}</div>`;
}
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
  if(path==='/search'){show('/',helpers);openSearch(helpers,new URLSearchParams(location.search).get('q')||'');return true;}
  closeTitlePreview();
  clearInterval(carousel);context=helpers;
  const page=path==='/'?'home':path==='/character'?'character':path==='/search'?'search':path==='/story/69f414d90abbab6f6a2c8131'?'detail':evidence.pages[path]?'captured-detail':path==='/collection'?'collection':path.startsWith('/character/')?'character-detail':path.startsWith('/story/')?'story-detail':null;
  host.hidden=!page;style.media=page?'all':'not all';legacy.disabled=Boolean(page);
  host.dataset.page=page||'';
  document.body.dataset.reference=String(Boolean(page));
  delete document.body.dataset.inspection;
  if(!page)return false;
  host.innerHTML=evidence.pages[page==='collection'||page==='character-detail'||page==='story-detail'?'home':page==='captured-detail'?path:page];patchOriginals(host);paintBrand(host);
  if(page==='story-detail'){
    const id=path.split('/')[2],d=catalog.find(d=>d.id===id),record=titlePreviews.titles[id];
    const content=q('[data-shrink]')?.nextElementSibling;
    if(content&&record){
      const wrapper=document.createElement('div');wrapper.innerHTML=record.html;
      const body=wrapper.children[1];body.classList.add('story-public-body');
      content.innerHTML=`<header class="shell-page-header"><a href="/">‹ Story Information</a></header><article class="replica-story-detail">${body.outerHTML}<div class="story-play-bar"><button class="shell-white-button" data-play="${id}">New Play</button></div></article>`;
      content.querySelectorAll('img').forEach(img=>{const url=img.getAttribute('src');if(assets[url])img.src=assets[url];});
      content.querySelectorAll('[style]').forEach(el=>{const match=/url\(["']?([^"')]+)["']?\)/.exec(el.style.backgroundImage||'');if(match&&assets[match[1]])el.style.backgroundImage=`url("${assets[match[1]]}")`;});
      const avatar=content.querySelector('[data-preview-avatar]');if(avatar)avatar.innerHTML=`<span>${safe(context.read('ooc-profile',{}).name||'Default avatar')}</span>`;
      content.querySelectorAll('[data-preview-bookmark]').forEach(b=>{b.dataset.favorite=id;b.dataset.referenceFavorite='true';b.setAttribute('aria-label','Bookmark story');});
      content.querySelectorAll('[role="combobox"]').forEach(b=>{b.onclick=()=>context.show(`<h2>${b.hasAttribute('data-preview-avatar')?'Avatar Settings':'Starting Scenarios'}</h2><p>${safe(b.textContent)}</p><button class="shell-white-button" data-action="close">Done</button>`);});
      content.querySelectorAll('[data-preview-more]').forEach(b=>b.onclick=()=>context.show('<h2>Story Information</h2><p>Public story information and the default starting scenario are available.</p>'));
      content.querySelectorAll('[data-preview-expand]').forEach(b=>{let parent=b.parentElement;parent.querySelectorAll('[class*="max-h-"]').forEach(el=>el.style.maxHeight='none');});
    }else if(content&&d){
      content.innerHTML=`<header class="shell-page-header"><a href="/">‹ Story Information</a></header><article class="replica-story-detail"><div class="replica-story-top"><img src="${source(d)}" alt="${safe(d.title)}"><div><h1>${safe(d.title)}</h1><p>${safe(d.author||'')}</p><p>${safe(d.genre||'Story')}</p>${d.plays?`<p>${safe(d.plays)} plays</p>`:''}<button class="shell-white-button" data-favorite="${id}">Bookmark</button></div></div><h2>Story Description</h2><p class="story-description">${safe(d.description||d.title)}</p><h2>Settings</h2><div class="story-settings"><span>Avatar Settings</span><span>${safe(context.read('ooc-profile',{}).name||'Default avatar')}</span></div><div class="story-play-bar"><button class="shell-white-button" data-play="${id}">New Play</button></div></article>`;
    }else if(content)content.innerHTML='<div class="shell-empty">Story unavailable.<br><a href="/">Back to stories</a></div>';
  }
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
      const kind=new URLSearchParams(location.search).get('type')==='character'?'character':'story';
      const available=catalog.filter(d=>kind==='character'?d.type==='character':d.type!=='character');
      const ids=collections.get(kind+':'+name);
      let items=ids?ids.map(id=>available.find(d=>d.id===id)).filter(Boolean):name==='OOC Originals'?available.filter(d=>d.original):['New Ranking','Rankings','Today'].includes(name)?sortStories(available,name==='New Ranking'?'newest':'played'):available.filter(d=>context.data.find(v=>v.id===d.id)?.genre===name);
      if(!items.length&&!context.categories.includes(name))items=available;
      if(name==='Top Ranked'&&kind==='story')items=[threeKingdoms,...bookMetadata,...items.filter(d=>![threeKingdoms.id,...bookMetadata.map(b=>b.id)].includes(d.id))];
      content.innerHTML=`<div class="precision-collection"><a href="${kind==='character'?'/character':'/'}">‹ Back</a><div class="collection-heading"><h1>${safe(name)}</h1><label>Sort by <select aria-label="Sort collection"><option value="featured">Featured</option><option value="played">Most Played</option><option value="newest">Newest</option><option value="title">Title A–Z</option></select></label></div><p class="collection-count">${items.length} ${kind==='character'?'characters':'stories'}</p><div data-collection-grid>${items.length?grid(items,name==='Top Ranked'):'<p>No titles in this category yet.</p>'}</div></div>`;
      const sort=content.querySelector('select');sort.onchange=()=>{content.querySelector('[data-collection-grid]').innerHTML=grid(sort.value==='featured'?items:sortStories(items,sort.value),name==='Top Ranked');hydrate();};
    }
  }
  if(page==='home')pinThreeKingdoms();
  hydrate();
  if(page==='home'||page==='character'){bindHome(page);bindExploreSort(page);bindCarousels(host,updateHero);}
  bindDisclosures(host);
  if(page==='detail'||page==='captured-detail'){bindDetail();const panel=q('[role=tabpanel]');if(panel){for(const child of [...panel.children])if(child.querySelector('article'))child.remove();bindSocial(panel,path.split('/')[2],helpers);}}
  if(page==='search')bindSearch();
  // Read-only captured consent state for screenshot comparison; no acceptance action.
  if(page==='home'&&new URLSearchParams(location.search).get('inspection')==='reference-terms'){
    document.body.dataset.inspection='reference-terms';
    q('#reference-root').firstElementChild.insertAdjacentHTML('beforeend',evidence.overlays||'');
    all('[role="dialog"] button').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();});
  }
  document.title=(page==='detail'||page==='captured-detail')?(q('h1')?.textContent||'Information')+' · Storylove':'Storylove · Interactive stories';
  return true;
}

// Authenticated layouts use the same captured stylesheet and asset map.
export function mountInteraction(html,helpers){closeTitlePreview();clearInterval(carousel);context=helpers;host.hidden=false;style.media='all';legacy.disabled=true;document.body.dataset.reference='true';host.dataset.page='interaction';host.innerHTML=html;paintBrand(host);all('img').forEach(img=>{const original=img.getAttribute('src');const packed=Object.entries(assets).find(([key])=>key===original);if(packed)img.src=packed[1];});return host;}

export function preview(path,helpers){
 const match=/^\/(story|character)\/([^/?]+)$/.exec(path);if(!match)return false;
 const id=match[2],d=catalog.find(d=>d.id===id);if(!d)return false;
 const record=titlePreviews.titles[id]||capturedPreview(d)||fallbackPreview(d);
 const dialog=openTitlePreview(record,id,{...helpers,assets});
 dialog.setAttribute('aria-label',match[1]==='character'?'Character Information':'Story Information');
 dialog.querySelector('h1')?.closest('a')?.setAttribute('data-full-info','');
 bindSocial(dialog,id,helpers);return true;
}
function capturedPreview(d){
 const html=evidence.pages[`/${d.type==='character'?'character':'story'}/${d.id}`];if(!html)return null;
 const doc=new DOMParser().parseFromString(html,'text/html'),panel=doc.querySelector('[role="tabpanel"]');if(!panel)return null;
 // Keep public information and intro, and let the local community layer own comments.
 for(const child of [...panel.children])if(child.querySelector('article'))child.remove();
 panel.removeAttribute('id');panel.removeAttribute('role');panel.className='captured-dialog-body';
 panel.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
 panel.querySelectorAll('button').forEach(b=>{if(b.textContent.trim()==='New Play'){b.dataset.previewPlay=d.id;}else if(b.closest('[class~="group/collapse"]')){b.dataset.previewExpand='';}else if(b.getAttribute('role')==='combobox'){b.outerHTML='<button data-preview-avatar><span>Default avatar</span>⌄</button>';}});
 const template=document.createElement('div');template.innerHTML=Object.values(titlePreviews.titles)[0].html;
 const header=template.firstElementChild,footer=template.lastElementChild;
 header.querySelector('h2').textContent=d.type==='character'?'Character Information':'Story Information';header.querySelector('[data-preview-close]')?.setAttribute('aria-label',d.type==='character'?'Close Character Information':'Close Story Information');
 footer.querySelectorAll('[data-preview-play]').forEach(b=>b.dataset.previewPlay=d.id);
 panel.querySelector('h1')?.closest('a')?.setAttribute('data-full-info','');
 for(const a of panel.querySelectorAll('a'))if(a.textContent.trim().startsWith('#'))a.href='/search?q='+encodeURIComponent(a.textContent.trim().slice(1));
 const actions=[...panel.querySelectorAll('button')].filter(b=>!b.textContent.trim()&&b.querySelector('svg'));
 actions.forEach((b,i)=>{if(i===0){b.dataset.previewBookmark=d.id;b.setAttribute('aria-label','Bookmark character');}else{b.dataset.previewMore='';b.setAttribute('aria-label','Character options');}});
 return {type:d.type,html:header.outerHTML+panel.outerHTML+footer.outerHTML};
}
function bookPreview(d){
 const mortal=d.id==='mortal-path';
 const chapters=mortal?['山门与薄册','坊市的两种价','药田无雨','试炼里的回声','来收账的人','撤离名册','能不能再走一步','各自的长路']:['一封迟到的信','石墙里的缺页','意大利的化名','巴黎的门槛','三条证据链','谁会一起倒下','让证据说话','等待与希望'];
 const setting=mortal?'你是二十七岁的沈微尘，一个刚进黄枫谷的普通修行者。每月的灵石得靠工役挣来，练功与跑腿争着同一段时辰。借息契能让修为先走一步，契主却要你在到期时交出一份不该外流的名单。':'你是二十七岁的档案修复员诺埃尔·瓦莱特。一封入藏记录对不上的旧信，让你与伯爵、核验员莉奥娜以及那些被旧案改变命运的人相遇。付款人有自己的目标，证人也有不愿交出的生活。';
 const guide=mortal?'每章从三段支线中选一件事，之后进入主线。灵力、灵石和经脉共同限制修行；资源不足可以延期、换路或照应同行者。承诺会在后续行动中受检验，先前借来的修为须明确结算。':'每章选一条调查或人物支线，再推进旧案。信件、账目与口述须核验来源；经费、时间和身份暴露会限制做法。可以公开证据、先存档补缺，或拒绝让无辜者成为施压工具。';
 return {type:'story',html:`<header><h2>Story Information</h2><button data-preview-close aria-label="Close information">×</button></header><div class="public-detail"><div class="public-detail-top"><img src="${safe(d.image)}" alt="${safe(d.title)}"><div><h1>${safe(d.title)}</h1>${creatorLink(d.author)}<p>${safe(d.subtitle)}</p><p>${safe(d.description)}</p><button data-preview-bookmark="${safe(d.id)}" aria-label="Bookmark story">♡ Bookmark</button></div></div><section><h2>故事设定</h2><p>${safe(setting)}</p><p>${mortal?'本卷为原著世界中的原创随行支线。韩立保有自己的目标与秘密，你从普通人的处境开始，不会直接获得他的机缘。':'本卷采用1842年的改编时间线，以原创见证人视角进入伯爵的复仇计划。你能影响证据如何被使用，不能替其他人物决定全部命运。'}</p></section><section><h2>怎样游玩</h2><p>${safe(guide)}</p><p>目前开放前两章，后续内容待试玩反馈后再完善。</p><p>可以点击行动，也可以用自己的话回答人物。情景对白随当前处境展开，结果由已知条件判定。进度与关系按当前账号自动保存。</p></section><section><h2>已开放 · 前两章</h2><ol>${chapters.slice(0,2).map(t=>`<li>${safe(t)}</li>`).join('')}</ol></section></div><footer><button data-preview-play="${safe(d.id)}" class="shell-white-button">New Play</button></footer>`};
}
function fallbackPreview(d){
 const book=bookMetadata.find(b=>b.id===d.id);if(book)return bookPreview(book);
 const kind=d.type==='character'?'Character':'Story';
 const description=d.description||'The full description for this title has not been captured yet.';
 return {type:d.type,html:`<header><h2>${kind} Information</h2><button data-preview-close aria-label="Close information">×</button></header><div class="public-detail"><div class="public-detail-top"><img src="${safe(source(d))}" alt="${safe(d.title)}"><div><h1>${safe(d.title)}</h1>${creatorLink(d.author)}<p>${safe(d.plays||'')}</p><p>${safe(description)}</p><button data-preview-bookmark="${safe(d.id)}" aria-label="Bookmark ${kind.toLowerCase()}">♡ Bookmark</button></div></div><section><h2>${kind} Description</h2><p>${safe(description)}</p></section>${bookMetadata.some(b=>b.id===d.id)?'<section><h2>八章连续战役</h2><p>原创玩家视角 · 规则判定 · 人物关系 · 承诺与回响 · 独立账号存档。每个场景有不同的行动，AI 沿当前情景生成对白。</p><p>当前开放卷一。书封为原创排版设计，插图待接入作图接口。</p></section>':''}${d.id==='three-kingdoms'?'<section><h2>Chapters</h2><p>许都 · 出许都 · 下邳 · 千里 · 新野 · 长坂 · 赤壁 · 华容</p><p>化身原创谋士子衡。人物关系、承诺、记事与回响贯穿八章；规则决定结果，AI 理解话意并生成对白。经典三章仍可从游戏页进入。</p></section>':''}<section><h2>Settings</h2><p>Avatar Settings</p><button data-preview-avatar><span>Default avatar</span>⌄</button><p>Starting Scenarios</p><button data-preview-scenario><span>Default</span>⌄</button></section></div><footer><button data-preview-play="${safe(d.id)}" class="shell-white-button">New Play</button></footer>`};
}
export function openSearch(helpers,initial=''){
 const dialog=openTitlePreview({html:`<header><button data-preview-close aria-label="Back to stories" class="dialog-back">‹</button><h2>Search</h2></header><div class="search-dialog-content"><label class="search-dialog-input"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search stories, characters and creators" placeholder="Search stories, characters, creators" maxlength="100"></label><div class="search-kind-tabs" role="tablist" aria-label="Search type">${['All','Story','Character','Creator'].map((label,i)=>`<button role="tab" data-search-kind="${label}" aria-selected="${i===0}">${label}</button>`).join('')}</div><div data-search-results aria-live="polite"></div></div><footer><small>Explore stories, characters and creators</small></footer>`},'search',{...helpers,assets});
 dialog.classList.add('search-dialog');dialog.setAttribute('aria-label','Search');
 const input=dialog.querySelector('input'),output=dialog.querySelector('[data-search-results]');let kind='All';
 const draw=()=>{const query=input.value.trim().replace(/^#+/,'').toLowerCase();const found=catalog.filter(d=>(searchIndex.get(d.id)||'').includes(query)).filter(d=>kind==='Character'?d.type==='character':kind==='Story'?d.type!=='character':true);output.innerHTML=kind==='Creator'?`<h3>Creators</h3><div class="creator-search">${[...new Set(catalog.map(d=>d.author).filter(Boolean))].filter(name=>name.toLowerCase().includes(query)).map(name=>creatorLink(name)).join('')||'<p>No matching creators.</p>'}</div>`:`<h3>${query?found.length+' results':'Popular titles'}</h3>${grid(query?found:found.slice(0,12))}`;};
 input.value=initial;input.oninput=draw;dialog.querySelectorAll('[data-search-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.searchKind;dialog.querySelectorAll('[data-search-kind]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));draw();});draw();input.focus({preventScroll:true});return dialog;
}


export function mountShell(html,helpers,page='account'){
 closeTitlePreview();clearInterval(carousel);context=helpers;host.hidden=false;style.media='all';legacy.disabled=true;document.body.dataset.reference='true';host.dataset.page=page;host.innerHTML=evidence.pages.home;paintBrand(host);
 const content=q('[data-shrink]')?.nextElementSibling;
 if(content){content.innerHTML=html;content.classList.add('shell-content');}
 hydrate();return host;
}
export function syncAccount(account){if(host.hidden||host.dataset.page==='interaction')return false;return paintSidebar(host,account,{read:context?.read||(()=>[]),data:context?.data||[],navigate:context?.navigate,show:context?.show});}
