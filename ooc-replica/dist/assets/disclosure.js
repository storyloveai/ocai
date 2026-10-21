// Shared by full detail pages and quick previews; captures use both inline and utility limits.
export function toggleDisclosure(button){
 const group=button.closest('[class~="group/collapse"]')||button.parentElement;
 const clipped=group.querySelector('[style*="max-height"],[class*="max-h-"]');
 if(!clipped)return false;
 const expanded=button.getAttribute('aria-expanded')!=='true';
 if(!clipped.dataset.collapsedHeight)clipped.dataset.collapsedHeight=clipped.style.maxHeight||'';
 clipped.style.maxHeight=expanded?'none':clipped.dataset.collapsedHeight;
 clipped.style.overflow=expanded?'visible':'';
 group.toggleAttribute('data-collapsed',!expanded);
 group.querySelectorAll('[class*="bg-gradient-to-"]').forEach(shade=>shade.hidden=expanded);
 button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?'Fold':'View All';
 return true;
}
export function bindDisclosures(root){
 root.querySelectorAll('button').forEach(button=>{if(/^(View All(?:Fold)?|Fold)$/.test(button.textContent.trim())){
  const group=button.closest('[class~="group/collapse"]');if(!group)return;
  button.textContent=button.getAttribute('aria-expanded')==='true'?'Fold':'View All';
  button.onclick=()=>toggleDisclosure(button);
 }});
}
