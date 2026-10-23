import test from 'node:test';
import assert from 'node:assert/strict';
import {analyticsAllowed,scrub,gameTracker,startAnalytics} from '../dist/assets/analytics.js';

test('analytics stays off locally, in automated browsers and in tests', () => {
  const doc={createElement(){}};
  assert.equal(analyticsAllowed({location:{hostname:'localhost'},document:doc,navigator:{}}),false);
  assert.equal(analyticsAllowed({location:{hostname:'storydate-zhou.vercel.app'},document:doc,navigator:{webdriver:true}}),false);
  assert.equal(analyticsAllowed({location:{hostname:'storydate-zhou.vercel.app'},document:doc,navigator:{}}),true);
  assert.equal(startAnalytics(globalThis),false);
});

test('autocapture never carries the text of what was clicked', () => {
  const e=scrub({event:'$autocapture',properties:{$el_text:'I love you',$elements:[{tag_name:'button',$el_text:'secret'}],$elements_chain:'button.choice:text="Knock over your cup"nth-child="1"'}});
  assert.equal(e.properties.$el_text,undefined);
  assert.equal(e.properties.$elements[0].$el_text,undefined);
  assert.doesNotMatch(e.properties.$elements_chain,/Knock/);
  assert.equal(scrub({event:'game_scene',properties:{scene:'c1'}}).properties.scene,'c1');
});

test('game progress events come from the saved run list', () => {
  const sent=[],send=(n,p)=>sent.push([n,p]);
  const track=gameTracker({game:'three-kingdoms',edition:'illustrated'},send,100000);
  const old={id:'a',vol:'v1',ch:2,chap:'c3',node:'c3_main',status:'play',created:0};
  track([{...old,status:'end'}]); assert.equal(sent.length,0); // a finished run from before this visit sends nothing
  track([old]); assert.equal(sent.length,0); // a run that existed before opening is the baseline
  track([{...old,node:'c3_side'}]); track([{...old,ch:3,chap:'c4',node:'c4_main'}]); track([{...old,ch:7,node:'end',status:'end',frags:['a.b','c.d']}]);
  assert.deepEqual(sent.map(([n])=>n),['game_scene','game_chapter_reached','game_scene','game_chapter_reached','game_volume_ended']);
  assert.equal(sent.at(-1)[1].endings,2);
  sent.length=0; track([{id:'b',vol:'v2',ch:0,chap:'c1',node:'x_return',status:'play',created:100000}]);
  assert.deepEqual(sent.map(([n])=>n),['game_run_started','game_chapter_reached']);
  assert.equal(sent[0][1].vol,'v2'); assert.equal(sent[0][1].chapter,1);
});
