export const line = (en, zh) => ({en, zh});
const julian = line('Julian Vance', '纪沉');
const base = '/assets/living-manga/seven-nights/';
export function art(id, alt, crop = [0, 0, 1, 1], alignX = .5, alignY = .5) {
  return {image: base + id + '.webp', depth: base + 'depth/' + id + '_depth.webp',
    alt, crop, alignX, alignY, strength: .035, inset: .04};
}
export function caption(type, position, text) {
  return {type, position, style: 'caption', z: .65, text};
}
export function speech(position, text) {
  return {type: 'bubble', position, style: 'speech', z: 1, speaker: julian, text};
}

export function makeNight({number, scene, title, subtitle, artDescriptions, location, narration, close, wide, prompt, options, custom, ending, cta}) {
  const id = 'seven-nights-ep' + number;
  const image = n => 'ep' + number + '_p' + n;
  const lastPanel = {scene:'p4', heightClass:'ending', captionRails:true,
    overlays:[caption('narration','top-right',ending[0]), speech('bottom-left',ending[1])]};
  return {
    id, series:'seven-nights', number, scene, title, subtitle, theme:'color',
    assets:{
      p1:art(image(1),artDescriptions[0]),
      p2Close:art(image(2),artDescriptions[1],[.54,0,.45,.88],.62,.05),
      p2Full:art(image(2),artDescriptions[1],[.02,.02,.98,.96],.96,.50),
      p3:art(image(3),artDescriptions[2],undefined,.72,.05),
      p4:art(image(4),artDescriptions[3])
    },
    openingRows:[
      {layout:'cols-1', panels:[{scene:'p1',heightClass:'wide',overlays:[
        caption('loc','top-left',location),caption('narration','bottom-left',narration)]}]},
      {layout:'cols-2-asym', panels:[
        {scene:'p2Close',heightClass:'close',overlays:[speech('bottom-left',close)]},
        {scene:'p2Full',heightClass:'close',overlays:[speech('top-left',wide)]}]}
    ],
    decision:{prompt,options:options.map(o=>({id:o.id,branchId:o.id,label:o.player,playerText:o.player})),
      freeInput:{maxLength:200,placeholder:line('Answer Julian…','回应纪沉……'),fallbackBranchId:'custom',
        rules:options.map(({id,pattern})=>({branchId:id,pattern}))}},
    branches:Object.fromEntries([...options,custom].map(o=>[o.id,{
      reactionPanels:[{scene:'p3',heightClass:'wide',overlays:[
        {type:'player-bubble',position:'top-left',style:'speech',z:1.15},speech('bottom-left',o.reaction)]},lastPanel],
      consequenceTags:o.tags,interlude:[{characterId:'sn-julian',path:'/chat/sn-julian',label:cta,draft:o.draft}]
    }]))
  };
}
