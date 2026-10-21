export const RELEASED_CHAPTERS=2;
export function previewCampaign(source){
 const c=structuredClone(source),ids=new Set(c.chapters.slice(0,RELEASED_CHAPTERS).map(ch=>ch.id));
 c.releasedChapters=RELEASED_CHAPTERS;c.preview=true;
 c.chapters=c.chapters.slice(0,RELEASED_CHAPTERS);
 c.nodes=Object.fromEntries(Object.entries(c.nodes).filter(([,n])=>ids.has(n.chapter)));
 c.chapters.push({id:'preview_boundary',title:'试玩到此',intro:[],offer:0,previewBoundary:true});
 c.nodes.preview_boundary={id:'preview_boundary',chapter:'preview_boundary',title:'前两章试玩结束',kind:'main',lock:'functional',order:0,intro:[],cast:[],choices:[],place:'待续'};
 c.endings=[];c.commit_rules=[];c.flash=[];
 c.echoes=Object.fromEntries(Object.keys(c.echoes).map(id=>[id,'后续回响尚待开放']));
 return c;
}
