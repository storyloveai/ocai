export function paintBrand(root=document){
 for(const image of root.querySelectorAll('img[alt="OOC"],img[alt="Storylove"]')){
  const compact=Number(image.getAttribute('width'))<30;
  image.src=compact?'/assets/storylove-mark.svg':'/assets/storylove-logo.svg';image.alt='Storylove';
  image.width=compact?24:140;image.height=compact?24:30;
  image.style.objectFit='contain';image.style.maxWidth='100%';
 }
}
