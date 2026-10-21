import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../content/original-catalog/',import.meta.url);
const ideas=JSON.parse(await readFile(new URL('ideas.json',root),'utf8'));
const evidence=JSON.parse(await readFile(new URL('../dist/assets/reference-pages.json',import.meta.url),'utf8'));
const oldStories=evidence.catalog,oldCharacters=evidence.characters;
const known=new Set([...oldStories,...oldCharacters].map(x=>x.id));
for(const f of [...evidence.features,...evidence.characterFeatures])known.add(f.href.split('/').pop());known.add('three-kingdoms');
const negatives='No text, lettering, typography, logos, watermark, recognizable copyrighted characters, celebrity likeness, sexual content, school uniforms or minors.';
const rows=[];
for(const [kind,list,old]of [['story',ideas.stories,oldStories],['character',ideas.characters,oldCharacters]]){
 for(const [i,row]of list.entries()){
  const character=kind==='character',title=row[0],titleZh=row[1],genre=row[2],age=character?row[3]:null;
  const description=row[character?4:3],opening=row[character?5:4],scene=row[character?6:5],tags=row[character?7:6].split(',');
  const id=`storydate-${kind}-${String(i+1).padStart(3,'0')}`,filename=id+'.webp';
  const prompt=`Original ${character?'character portrait':'interactive novel cover illustration'} for StoryDate. ${scene}. Premium ${genre==='Sci-Fi'?'science fiction':genre==='History'?'historically inspired':genre==='Horror'?'atmospheric suspense':'editorial narrative'} illustration, carefully composed for a vertical 2:3 cover, strong focal point readable at thumbnail size, detailed materials and natural expressive lighting. ${character?'The subject is an adult aged '+age+'.':'All depicted people are adults aged 25 or older.'} Create wholly original faces, clothing and scenery. ${negatives}`;
  rows.push({id,type:kind,title,titleZh,genre,tags,author:'StoryDate Studio',description,opening,allParticipantsAdults:true,minimumParticipantAge:21,...(character?{character:{displayName:title,age,persona:description,conversationStyle:'Respond to the actual latest message; maintain the specific personality above, independent goals and clear interpersonal boundaries. Build closeness gradually through mutual interaction.'}}:{}),replacementFor:old[i].id,publicationStatus:'draft_pending_cover_review',interactionDepth:'authored premise and opening; not a Three Kingdoms-style rule campaign',rulesEngineReady:false,cover:{filename,relativePath:'/assets/originals/'+filename,status:'pending',prompt,negativePrompt:negatives,aspectRatio:'2:3',width:1024,height:1536,assetUrl:null}});
 }
}
const pack={schemaVersion:'storydate.catalog-drafts/1',createdAt:'2026-10-20',brand:'StoryDate',status:'prepared_not_published',coveragePlan:{currentUniqueTitles:known.size,candidateReplacements:rows.length,storyDrafts:ideas.stories.length,characterDrafts:ideas.characters.length,plannedReplacementPercent:Number((rows.length/known.size*100).toFixed(2)),preservedIds:['three-kingdoms']},activationPolicy:'Do not replace live titles until their own covers are generated, reviewed and matched to IDs. Do not reuse old covers under new titles. Keep existing private histories attached to their original IDs. Do not fabricate plays, comments or human creator credits.',items:rows};
await writeFile(new URL('catalog-drafts.json',root),JSON.stringify(pack,null,2)+'\n');
await writeFile(new URL('catalog-drafts.jsonl',root),rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
await writeFile(new URL('cover-jobs.jsonl',root),rows.map(r=>JSON.stringify({id:r.id,type:r.type,title:r.title,titleZh:r.titleZh,prompt:r.cover.prompt,negative_prompt:r.cover.negativePrompt,aspect_ratio:r.cover.aspectRatio,width:r.cover.width,height:r.cover.height,output_filename:r.cover.filename,status:'pending'})).join('\n')+'\n');
const index=['# StoryDate original catalogue — draft review index','','Prepared text only. Covers and live replacement remain pending.','',`Plan: ${rows.length} / ${known.size} current catalogue slots (${pack.coveragePlan.plannedReplacementPercent}%).`,'','| ID | Type | Category | Title | 中文标题 |','|---|---|---|---|---|',...rows.map(r=>`| ${r.id} | ${r.type} | ${r.genre} | ${r.title} | ${r.titleZh} |`)];
await writeFile(new URL('INDEX.md',root),index.join('\n')+'\n');
console.log(`${rows.length} original drafts, ${ideas.stories.length} stories + ${ideas.characters.length} characters; planned ${pack.coveragePlan.plannedReplacementPercent}% replacement. No live catalogue changed.`);
