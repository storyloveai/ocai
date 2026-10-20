// Persistent cover nodes move between shelf positions; changing a slide never swaps an image in place.
const shelves=new WeakMap();
export function updateShelf(hero,features,index,source,move){
 let shelf=shelves.get(hero);
 if(!shelf){
  const original=hero.querySelector('img');if(!original)return;
  const stage=original.parentElement.parentElement;stage.replaceChildren();stage.classList.add('storydate-shelf');stage.setAttribute('aria-label','Featured book covers');
  const cards=features.map((f,i)=>{const card=document.createElement('a');card.className='storydate-shelf-card';card.href=f.href;card.dataset.shelfIndex=i;card.setAttribute('aria-label',f.title);const image=document.createElement('img');image.src=source(f);image.alt=f.title;image.draggable=false;image.decoding='async';card.append(image);stage.append(card);return card;});
  shelf={stage,cards};shelves.set(hero,shelf);
  let start,dragged=false;
  stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={x:e.clientX,y:e.clientY,id:e.pointerId};dragged=false;});
  stage.addEventListener('pointermove',e=>{if(!start)return;const x=e.clientX-start.x,y=e.clientY-start.y;if(Math.abs(x)<8||Math.abs(x)<Math.abs(y))return;dragged=true;stage.classList.add('is-dragging');stage.setPointerCapture?.(e.pointerId);stage.style.setProperty('--shelf-drag',Math.max(-35,Math.min(35,x*.3))+'px');e.preventDefault();});
  const end=e=>{if(!start)return;const x=e.clientX-start.x,y=e.clientY-start.y;stage.classList.remove('is-dragging');stage.style.removeProperty('--shelf-drag');if(dragged&&Math.abs(x)>35&&Math.abs(x)>Math.abs(y))move(x<0?1:-1);start=null;};
  stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',()=>{start=null;dragged=false;stage.classList.remove('is-dragging');stage.style.removeProperty('--shelf-drag');});
  stage.addEventListener('click',e=>{if(dragged){e.preventDefault();e.stopPropagation();dragged=false;}},true);
  stage.addEventListener('dragstart',e=>e.preventDefault());
  stage.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
 }
 shelf.cards.forEach((card,i)=>{
  let offset=(i-index+features.length)%features.length;if(offset>features.length/2)offset-=features.length;
  const active=offset===0;card.dataset.shelfPosition=String(Math.max(-3,Math.min(3,offset)));card.tabIndex=active?0:-1;card.setAttribute('aria-hidden',String(!active));card.setAttribute('aria-current',String(active));
 });
 return shelf;
}
