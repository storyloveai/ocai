import test from 'node:test';import assert from 'node:assert/strict';import{parseHTML}from'linkedom';
import{toggleDisclosure,bindDisclosures}from'../dist/assets/disclosure.js';import{bindCarousels}from'../dist/assets/carousels.js';
test('View All expands inline-clipped content, removes fade, and restores its exact limit',()=>{
 const{document}=parseHTML('<div class="group/collapse" data-collapsed><div><div style="max-height:320px" class="overflow-hidden"><p>Full text</p><div class="bg-gradient-to-b"></div></div></div><button>View AllFold</button></div>');
 bindDisclosures(document);const b=document.querySelector('button'),clip=document.querySelector('[style]'),shade=document.querySelector('.bg-gradient-to-b');b.click();assert.equal(clip.style.maxHeight,'none');assert.equal(b.getAttribute('aria-expanded'),'true');assert.equal(shade.hidden,true);assert.equal(b.textContent,'Fold');toggleDisclosure(b);assert.equal(clip.style.maxHeight,'320px');assert.equal(shade.hidden,false);
});
test('catalog uses native horizontal scrolling and hero wheel ignores vertical or zoom gestures',()=>{
 const{document,window}=parseHTML('<section><h2>Top Ranked</h2><div aria-roledescription="carousel"><div><div style="transform:translateX(-200px)"><div aria-roledescription="slide"></div></div></div></div></section><div data-hero-desktop></div>');globalThis.matchMedia=()=>({matches:true});const steps=[];bindCarousels(document,n=>steps.push(n));const view=document.querySelector('.native-carousel');assert.ok(view);assert.equal(view.getAttribute('tabindex'),'0');assert.equal(view.firstElementChild.style.transform,'none');
 const hero=document.querySelector('[data-hero-desktop]');function wheel(x,y,ctrl=false){const e=new window.Event('wheel',{cancelable:true});Object.assign(e,{deltaX:x,deltaY:y,deltaMode:0,ctrlKey:ctrl});hero.dispatchEvent(e);return e;}
 assert.equal(wheel(0,100).defaultPrevented,false);assert.equal(wheel(100,0,true).defaultPrevented,false);assert.equal(wheel(60,1).defaultPrevented,true);assert.deepEqual(steps,[1]);wheel(90,0);assert.deepEqual(steps,[1]);
});
