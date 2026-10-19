export function bindCarousels(root,moveHero){
 const category=[...root.querySelectorAll('button')].find(b=>b.textContent.trim()==='Main');
 const categoryTrack=category?.parentElement?.parentElement,categoryViewport=categoryTrack?.parentElement;
 if(categoryViewport&&categoryViewport.classList.contains('overflow-hidden')){categoryTrack.style.transform='none';categoryViewport.classList.add('native-carousel');categoryViewport.tabIndex=0;categoryViewport.setAttribute('aria-label','Story categories');}
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const region of root.querySelectorAll('[aria-roledescription="carousel"]')){
  const slide=region.querySelector('[aria-roledescription="slide"]');if(!slide)continue;
  const track=slide.parentElement,viewport=track.parentElement;
  if(region.querySelector('[data-hero-desktop]')||track.hasAttribute('data-mobile-track'))continue;
  track.style.transform='none';viewport.classList.add('native-carousel');
  viewport.setAttribute('tabindex','0');viewport.setAttribute('aria-label',viewport===categoryViewport?'Story categories':(region.closest('section')?.querySelector('h2')?.textContent||'Stories')+' carousel');
  const step=direction=>viewport.scrollBy({left:direction*Math.max(200,viewport.clientWidth*.8),behavior:reduced()?'instant':'smooth'});
  region.querySelectorAll('button').forEach(button=>{const label=button.getAttribute('aria-label')||button.textContent.trim();if(/previous|next/i.test(label))button.onclick=()=>step(/previous/i.test(label)?-1:1);});
  viewport.addEventListener('keydown',event=>{if(event.target!==viewport||!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();step(event.key==='ArrowRight'?1:-1);});
 }
 // Hero panels change slides rather than scroll. Ignore vertical gestures and momentum tails.
 for(const hero of root.querySelectorAll('[data-hero-desktop],[data-mobile-track]')){
  let distance=0,last=0,locked=0;
  hero.addEventListener('wheel',event=>{
   if(event.ctrlKey||Math.abs(event.deltaX)<=Math.abs(event.deltaY))return;
   event.preventDefault();const now=Date.now();if(now<locked)return;
   if(now-last>180||Math.sign(distance)!==Math.sign(event.deltaX))distance=0;
   last=now;distance+=event.deltaX*(event.deltaMode===1?16:1);
   if(Math.abs(distance)>=55){moveHero(distance>0?1:-1);distance=0;locked=now+500;}
  },{passive:false});
 }
}
