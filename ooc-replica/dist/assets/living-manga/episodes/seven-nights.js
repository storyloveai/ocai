import {line, art, caption, speech} from './seven-nights-format.js';
const ending = {scene: 'p4', heightClass: 'ending', captionRails: true, overlays: [
  caption('narration', 'top-right', line('Below the rain-streaked glass, two black sedans cut across the wet avenue. Leaving before dawn isn’t an option anymore.', '雨幕之下，两辆黑车斜停在湿漉漉的街口封死了去路。天亮前离开，已经不可能了。')),
  speech('bottom-left', line('“Walk out if you want—I won’t stop you. Or stay seven nights under my name, and watch every man downstairs learn what it costs to touch what’s under my roof.”', '「想走我现在就开门，不拦你。或者在我名下住满七夜——看楼下那些人，怎么为动我屋檐下的人付出代价。」'))
]};
const choices = [
  {id: 'stand_ground', pattern: "favor|owe|deal|rule|savior|don't touch|back off|人情|规矩|救世主|别碰|条件",
    player: line('“I didn’t come for a savior. I came to cash in the favor you owe me.”','「我不是来找救世主的，是来兑现三年前你欠我的那个人情。」'),
    reaction: line('“Good. I hate damsels. Now let’s see how loud your hunters really are.”','「很好，我最烦只会哭的麻烦。现在看看，追你的人到底有多大本事。」'),
    tags: [line('Unshaken','不落下风'),line('His Intrigue','勾起兴致')],
    draft: line('If I stay seven nights, we set my rules too. What do you really want out of this?','住满七夜可以，但规矩得由我们两个定。你帮我，真正想要什么？')},
  {id: 'probe_close', pattern: 'trouble|afraid|steal|stole|ring|closer|why|麻烦|怕|偷|印章|靠近|为什么',
    player: line('“You haven’t even asked what I stole from them—aren’t you afraid I’m trouble?”','「你连我从他们手里拿了什么都没问——不怕我给你惹麻烦？」'),
    reaction: line('“Sweetheart, trouble is the only thing that makes this city interesting. Come closer and tell me how expensive it is.”','「麻烦才是这座城里唯一有趣的东西。走近点，告诉我——你惹的麻烦值多少钱。」'),
    tags: [line('Bold Probe','危险试探'),line('Dangerous Spark','张力拉满')],
    draft: line('You still haven’t told me why you gave me that signet ring three years ago.','你还没告诉我，三年前为什么把那枚印章留给我。')},
  {id: 'hide_truth', pattern: 'leave|dawn|escape|run|secret|出城|天亮|走|逃|别问|秘密',
    player: line('“Just get me out of the city by dawn. That’s all I’m asking.”','「天亮前送我出城就行，其他的你不用知道。」'),
    reaction: line('“You’re a terrible liar when your pulse is hammering in your throat. Sit down—we’re not going anywhere tonight.”','「你颈侧的脉搏跳成这样，撒谎实在太蹩脚了。坐下——今晚你哪儿也去不了。」'),
    tags: [line('Guarded Secret','隐瞒真相'),line('Caught Lying','当场拆穿')],
    draft: line('How did you know I wasn’t telling you the whole truth?','你怎么知道我没说实话？')}
];
const custom = {id:'custom', reaction: line('“I heard you.” His gaze flicks to the glass. “Now listen.”','「我听见了。」他望向窗玻璃。「现在，听。」'),
  tags:[line('Your Own Terms','自定条件')], draft:line('{playerText}','{playerText}')};
export default {
  id:'seven-nights', series:'seven-nights', number:1, scene:'ep1_study', title:line('2:00 AM · Seven Nights','凌晨两点 · 七夜之约'),
  subtitle:line('Port Veyron · Maison Vance Penthouse','维伦港 · 纪氏顶层私邸'), theme:'color',
  assets:{
    p1:art('p1',line('From the wet doorway, Julian turns beside the brass lamp.','雨湿的门框内，纪沉从黄铜台灯旁回头。'),undefined,.68,0),
    p2Close:art('p2',line('Julian meets your eyes across the desk.','纪沉隔桌直视你。'),[.54,0,.45,.88],.62,.05),
    p2Full:art('p2',line('His ringed hand slides the key toward you.','戴着印章戒的手将钥匙朝你推来。'),[.02,.02,.98,.96],.96,.5),
    p3:art('p3',line('Lightning catches the small smile on Julian’s face.','细闪电映出他嘴角的一丝笑意。'),undefined,.72,0),
    p4:art('p4',line('Beyond the curtain, two black sedans block the street below.','帘后雨夜中，两辆黑车封住了楼下的街口。'))
  },
  openingRows:[
    {layout:'cols-1',panels:[{scene:'p1',heightClass:'wide',overlays:[
      caption('loc','top-left',line('2:04 AM · Maison Vance','凌晨 2:04 · 纪氏顶层')),
      caption('narration','bottom-left',line('Rain hammers the penthouse glass. Everyone in Port Veyron knows two rules: never cross Julian Vance—and never knock on his door after midnight.','暴雨拍打着顶层落地窗。全城都知道两条规矩：别招惹纪沉，更别在午夜后敲开他的门。'))]}]},
    {layout:'cols-2-asym',panels:[
      {scene:'p2Close',heightClass:'close',overlays:[speech('bottom-left',line('“Soaked to the bone, bleeding knuckles—and clutching my signet ring like a blade.”','「淋透了，指节还破着皮——却把我的印章攥得像把刀。」'))]},
      {scene:'p2Full',heightClass:'close',overlays:[speech('top-left',line('“Put the coat on before you freeze. Then tell me whose head I’m collecting tonight.”','「先把大衣披上，别着凉。然后告诉我——今晚，我要替你收拾谁？」'))]}
    ]}
  ],
  decision:{
    prompt:line('His warm wool coat settles over your shoulders—cedar, rain, and quiet danger. How do you answer him?','带着雪松与微雨体温的黑色羊绒大衣落上肩头，他离你极近。你怎么接这一句？'),
    options:choices.map(({id,player})=>({id,branchId:id,label:player,playerText:player})),
    freeInput:{maxLength:200, placeholder:line('Answer Julian…','回应纪沉……'), fallbackBranchId:'custom',
      rules:choices.map(({id,pattern})=>({branchId:id,pattern}))}
  },
  branches:Object.fromEntries([...choices,custom].map(({id,reaction,tags,draft})=>[id,{
    reactionPanels:[{scene:'p3',heightClass:'wide',overlays:[
      {type:'player-bubble',position:'top-left',style:'speech',z:1.15},speech('bottom-left',reaction)]},ending],
    consequenceTags:[...tags,line('Seven-Night Pact','七夜庇护')],
    interlude:[{characterId:'sn-julian',path:'/chat/sn-julian',label:line('Take the key & stay in his study','接过钥匙，留在书房和他聊'),draft}]
  }]))
};
