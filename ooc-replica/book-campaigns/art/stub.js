(function(root){
 const svg=(t)=>`<svg viewBox="0 0 1200 480" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="480" fill="#1b2433"/><text x="600" y="240" fill="#fff" font-size="40" text-anchor="middle">${t}</text></svg>`;
 root.ART={scene:(id)=>svg(id),cg:(id)=>svg(id),charSeal:()=>'',journeyMap:()=>'<svg viewBox="0 0 10 10"></svg>',realmMap:()=>'<svg viewBox="0 0 10 10"></svg>',provinces:[],scenes:[],cgs:[],places:[]};
 root.PORTRAIT={draw:(id)=>`<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="#555"/></svg>`,ids:[],moods:[]};
})(typeof self!=='undefined'?self:this);
