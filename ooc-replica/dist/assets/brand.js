import {getVariant} from './logo-lab/variants.js';
// A URL opt-in lets the comparison page show alternatives without changing the default brand.
const variant=getVariant(new URLSearchParams(globalThis.location?.search||'').get('logo'));
export function paintBrand(root=document){
 for(const badge of root.querySelectorAll('img[alt="ORIGINAL"]')){badge.src="/assets/original-badge.svg";badge.removeAttribute("data-asset");badge.classList.add("storydate-original-badge");}

 for(const image of root.querySelectorAll('img[alt="OOC"],img[alt="Storylove"],img[alt="StoryDate"]')){
  const compact=Number(image.getAttribute('width'))<40;
  image.src=compact?variant.mark:variant.logo;image.alt='StoryDate';
  image.width=compact?32:164;image.height=compact?32:40;
  image.classList.add('storydate-brand');image.classList.toggle('storydate-brand-compact',compact);
  image.classList.toggle('storydate-brand-halo',Boolean(variant.halo));
  image.style.objectFit='contain';image.style.maxWidth='100%';image.style.height=(compact?32:40)+'px';
 }
}
