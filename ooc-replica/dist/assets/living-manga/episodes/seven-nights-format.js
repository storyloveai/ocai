export const line = (en, zh) => ({en, zh});
const julian = line('Julian Vance', '纪沉');
const base = '/assets/living-manga/seven-nights/';
// Coordinates use the uncropped painting. Focus is the median depth at Julian's eyes.
const eyePlanes = {
  p1:[.70,.15,.165], p2:[.79,.19,.129], p3:[.62,.28,.361], p4:[.51,.27,.275],
  ep2_p2:[.77,.19,.157], ep2_p3:[.65,.24,.165], ep2_p4:[.37,.27,.122],
  ep3_p2:[.75,.21,.157], ep3_p3:[.64,.28,.133], ep3_p4:[.39,.14,.169]
};
export function art(id, alt, crop = [0, 0, 1, 1], alignX = .5, alignY = .5) {
  return {image: base + id + '.webp', depth: base + 'depth/' + id + '_depth.webp',
    alt, crop, alignX, alignY, strength: .085, inset: .09,
    eyes: eyePlanes[id]?.slice(0,2), focus: eyePlanes[id]?.[2],
    rain: !['ep2_p1','ep3_p1'].includes(id),
    thunder: ['p3','ep3_p3','ep3_p4'].includes(id),
    lights: ['p4','ep2_p4','ep3_p4'].includes(id)};
}
export function caption(type, position, text) {
  return {type, position, style: 'caption', z: .65, text};
}
export function speech(position, text) {
  return {type: 'bubble', position, style: 'speech', z: 1, speaker: julian, text};
}

export function makeNight({interludeHeading, number, scene, title, subtitle, artDescriptions, location, narration, close, wide, prompt, options, custom, ending, cta}) {
  const id = 'seven-nights-ep' + number;
  const image = n => 'ep' + number + '_p' + n;
  const lastPanel = {scene:'p4', heightClass:'ending', captionRails:true,
    overlays:[caption('narration','top-right',ending[0]), speech('bottom-left',ending[1])]};
  return {
    id, series:'seven-nights', interludeHeading, number, scene, title, subtitle, theme:'color',
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
