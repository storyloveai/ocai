export function paintBrand(root=document){
 for(const image of root.querySelectorAll('img[alt="OOC"],img[alt="Storylove"],img[alt="StoryDate"]')){
  const compact=Number(image.getAttribute('width'))<40;
  image.src=compact?'/assets/storydate-mark.svg':'/assets/storydate-logo.svg';image.alt='StoryDate';
  image.width=compact?32:164;image.height=compact?32:40;
  image.classList.add('storydate-brand');image.classList.toggle('storydate-brand-compact',compact);
  image.style.objectFit='contain';image.style.maxWidth='100%';
 }
}
