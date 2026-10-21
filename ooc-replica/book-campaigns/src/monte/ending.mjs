import { T, node, choice, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

const g = (id, title, fragments, mode) => ({ id, title: T(title), ...(mode ? { mode } : {}), fragments: fragments.map(([fid, text, when]) => ({ id: fid, text: T(text), ...(when ? { when } : {}) })) });

export const endings = [
  g('g_you', '你的去处', [
    ['fled', '你在里昂的一间小旅店里听说了后来的事：法老号回港，莫雷尔商行逃过一劫。你在酒杯上看了很久自己的倒影，没有回去。有些城市，一旦离开，就只能留在别人的故事里。', F('ended_early')],
    ['honest', '马赛的老船东们提起你，总是同一句话：「诺埃尔的话，不用立字据。」这句话比任何勋章都沉，也比任何勋章都容易压弯一个人的背。', GE('renown.reliable', 7)],
    ['double', '你有两份薪水，和一份从不对任何人说的账。莫雷尔不知道你在替谁看账，唐格拉尔也不知道你究竟在替谁。你只知道，这世上没有一个人能同时被两边信任，你却做到了——代价是，你再也找不到一个可以把整颗心放下的地方。', F('flag.double_game')],
    ['sold', '那页底稿成了你的第一笔大钱。你用它买了一间朝南的房子，买了一件像样的外套，也买下了一种你以后一直试图忘记的沉默。每次有人说起「那年二月」，你的手指总是不自觉地摸向空空的衣襟。', F('flag.sold_draft')],
    ['danglars', '你留在了唐格拉尔的银行里。账本越做越漂亮，口音越来越像巴黎人。偶尔有人在酒会上问起莫雷尔商行，你会礼貌地笑一笑，像在谈一个早已盖了章的账目。', IS('track', 'danglars')],
    ['stay_close', '你仍然在莫雷尔商行，仍然睡在账房楼梯下那间隔得很小的屋子里。莫雷尔把钥匙交给了你，说：「从今天起，你坐这把椅子。」你坐上去时，发现椅背上有一道很深的、老旧的刻痕——是很多年前有人用指甲划下的。', ALL(IS('track', 'morrel'), F('flag.sat_with_morrel'))],
    ['took', '你不会忘记那扇门被撞开的声音。莫雷尔后来一直没有再提那只木匣，可每年二月二十四日，他总会在你桌上放一杯酒，什么也不说。', F('flag.took_pistol')],
    ['morrel', '你留在了莫雷尔商行。人们说你是个「死心眼」的账房，说你放着更好的前程不走。你从来没有解释。你知道，有些账，不是数字能结算的。', IS('track', 'morrel')],
  ]),
  g('g_morrel', '莫雷尔一家', [
    ['away', '你离开马赛以后，莫雷尔一家的消息只是零零星星地从来往的商人口里传来。你听说那一天有船回港，也听说那一天有人哭得很厉害，可你不确定，那是不是同一件事。', F('ended_early')],
    ['close_call', '那天上午十点五十八分，朱莉撞开了书房的门。莫雷尔手边是一只打开的木匣，和一张已经写完的遗书。是法老号的汽笛声，让他把手放了下来。这件事后来没有人再提——可那天之后，整个莫雷尔家，对「时间」这个词有了不同的敬畏。', ALL(NF('flag.sat_with_morrel'), NF('flag.took_pistol'), NF('flag.ship_seen'))],
    ['rebuilt', '商行没有恢复昔日的规模，可它活了下来。莫雷尔把你的借据装进镜框，挂在账房最显眼的墙上，旁边是那只红色的丝质钱袋。每个新来的学徒都要听一遍这个故事，然后被问：「你愿意做这样的人吗？」', ALL(GE('house', 8), ANY(F('flag.paid_part'), F('flag.lent_morrel')))],
    ['recovered', '莫雷尔商行重新挂出了招牌，三条新船在年内下水。莫雷尔先生又开始说「会好的」，只是语气里多了一分你从前没听过的、对时间的谦卑。', GE('house', 6)],
    ['thin', '商行活了下来，只是剩下半副骨架。莫雷尔把办公桌搬到窗边，每天傍晚站在那里看船。他从不抱怨，也从不再谈论「信用」这个词。', LE('house', 5)],
  ]),
  g('g_louis', '梅兰街的楼梯', [
    ['word_kept', '每年二月二十四日，你都会带一束花去老路易的墓前，把他最后那句话说一遍。「告诉爱德蒙，我从来没有怪过他。」你说了很多年，没有人回答，但你一直说，直到有一天，墓前出现了另一束更大的花。', ALL(F('flag.louis_word'), F('flag.kept_year_ritual'))],
    ['word', '老路易最后的那句话，你一直记着。你没有写下来，也没有对任何人转述，它就在你心里，像一盏不会熄的小灯，等一个有资格听见它的人。', F('flag.louis_word')],
    ['cared', '老路易的葬礼是你办的，他的墓碑也是你立的。可你一直遗憾，那天清晨你没有在他身边。有些告别，是错过之后才知道它有多重的。', F('flag.louis_cared')],
    ['alone', '老路易是一个人走的。邻居们说，他最后几天一直坐在窗前，望着楼梯口。没有人知道他在等谁，除了你。', NF('flag.louis_cared')],
  ]),
  g('g_mercedes', '梅尔塞苔丝', [
    ['knew', '梅尔塞苔丝从你手里接过的那张字条，她没有烧。她把它夹进了一本很旧的祈祷书里，带去了巴黎。许多年后，有一个人会翻开那本书。', F('flag.told_mercedes')],
    ['attended', '你坐在最后一排的那个下午，梅尔塞苔丝记了一辈子。她后来对很多人说过「我的婚礼上，有一个人是真的为我难过」。她没有说出你的名字，但你知道她说的是谁。', F('flag.attended_wedding')],
    ['wait', '梅尔塞苔丝说过她「还在等」。她随着费尔南去了巴黎，穿上了贵妇人的衣裳，可每当有人谈起大海，她的目光总会飘向很远的地方。你知道她还在等。', F('flag.mercedes_wait')],
    ['gone', '梅尔塞苔丝随费尔南离开了马赛。你们再没有见过面。有时候你在码头上看见一个黑发的女人的背影，心里会轻轻地「咯噔」一下，然后你告诉自己，那不是她。'],
  ]),
  g('g_danglars', '唐格拉尔', [
    ['kept', '那页底稿被唐格拉尔锁进了保险柜最深处。他再也没有拿出来过，可他每次打开保险柜，都会不自觉地停一下。你知道，他是记得你的。', F('flag.sold_draft')],
    ['given', '那页底稿此刻躺在一个英国人的公文包里。你不知道他会拿它做什么，可你知道，从此以后，唐格拉尔每一次笑，都会比从前更用力一点。', F('flag.gave_draft')],
    ['confronted', '拱棚下的那个晚上，你当面说破了他。唐格拉尔从来没有再提起过这件事，可他在你的名字旁边，永远画着一个很小的记号。', F('flag.confronted')],
    ['follower', '唐格拉尔后来成了男爵。他的银行越做越大，账本越来越漂亮。他对你一向客气，也一向戒备。你从他那里学到的东西，让你日后每次签字时，总会多看一眼合同的最后一行。', IS('track', 'danglars')],
    ['plain', '唐格拉尔后来去了巴黎，成了男爵。人们说他是个精明的人，说他从来不做赔本的买卖。你知道，那句话里漏了一个字。'],
  ]),
  g('g_edmond', '英国人的笔记', [
    ['faithful', '那个英国人的笔记本里，有一页写着「守信者」。你的名字在最前面，墨迹比其他的都深。他从来没有告诉过你这件事。你只是在某一天，收到了一份来自远方的、没有署名的礼物：一盒你年轻时在码头上最爱吃的橄榄。', AT('wilmore', 'esteem', 3)],
    ['noted', '英国人的笔记本里，有一页你的名字被圈了一下。他没有说那是什么记号。但你知道，在那本书里，被圈出来的人，往往会在多年后收到一个迟到的、意外的善意。', AT('wilmore', 'esteem', 2)],
    ['blank', '英国人走的时候，在你的名字旁边没有留下任何记号。你不确定这是好事还是坏事。有时候，被忽略，比被记住更安全。', UPTO('wilmore', 'esteem', 0)],
    ['plain', '你在英国人的笔记本里，占了一行。不长，不短，没有记号。你从此再也没有见过他。'],
  ]),
  g('g_gift', '那个傍晚', [
    ['confessed', '你对那个英国人说出了「那晚我没有出声」。这句话，十四年来你对任何人都没有说过。说出口的那一刻你发现，它没有你想象中那么重，只是一直压了你太久。', F('flag.confessed')],
    ['letter', '你写给爱德蒙的那封信，英国人带走了。后来的很多年里，你每一个二月二十四日都会想：那封信，是不是真的有人读过。你不知道的是，有一个人，在很远的海上，把它读了一遍又一遍。', F('flag.left_letter')],
    ['refused', '你谢绝了那袋金币。很久以后，你才明白那天你推开的，不只是一笔钱。', F('flag.refused_gift')],
    ['accepted', '你收下了那袋金币。你用它还了一些旧账，也买下了一份新的安稳。金币上的名字，你一直没有查出是谁。可每当你看见它，总会觉得，有人在远处看着你。', F('flag.accepted_gift')],
  ]),
];

export const endNote = '卷一终。你在这一卷里留下的一切——每一个承诺、每一次沉默、每一句话——都会被记下，带进卷二《伯爵》。';

export const fragFace = {
  g_morrel: { close_call: ['morrel', 'sad'], rebuilt: ['morrel', 'warm'], recovered: ['morrel', 'warm'], thin: ['morrel', 'neutral'] },
  g_louis: { word_kept: ['louis', 'warm'], word: ['louis', 'warm'], cared: ['louis', 'neutral'], alone: ['louis', 'sad'] },
  g_mercedes: { knew: ['mercedes', 'surprised'], attended: ['mercedes', 'warm'], wait: ['mercedes', 'sad'], gone: ['mercedes', 'sad'] },
  g_danglars: { kept: ['danglars', 'neutral'], given: ['danglars', 'cold'], confronted: ['danglars', 'cold'], follower: ['danglars', 'warm'], plain: ['danglars', 'neutral'] },
  g_edmond: { faithful: ['wilmore', 'warm'], noted: ['wilmore', 'neutral'], blank: ['wilmore', 'cold'], plain: ['wilmore', 'neutral'] },
  g_gift: { letter: ['wilmore', 'warm'], refused: ['wilmore', 'neutral'], accepted: ['wilmore', 'neutral'] },
};

export const endingArt = {
  scene: 'ending',
  layers: [
    { id: 'morrel_house', when: IS('track', 'morrel') },
    { id: 'bank', when: IS('track', 'danglars') },
    { id: 'ship', when: GE('house', 6) },
    { id: 'grave_flower', when: F('flag.kept_year_ritual') },
    { id: 'letter', when: F('flag.left_letter') },
    { id: 'lone_figure', when: AT('wilmore', 'esteem', 2) },
  ],
};

export const interrupts = [
  node('mc_int_watch', 'c3', 'interrupt', '宪兵队长的传唤', {
    lock: 'free', canon: '原创', place: 'prefecture', when: GE('watch', 4), cast: [{ id: 'villefort' }],
    art: { scene: 'office', layers: [{ id: 'fire' }, { id: 'summons' }] },
    intro: [
      '一个清早，商行门口站着一个陌生的宪兵。他递来一张盖着省府火漆的传票，上面只有两行字：姓名，和一个时间。',
      { text: '维尔福翻开卷宗时，目光一顿：「哦，原来是那位在走廊里叫住我的年轻人。」他没有提高声音，却让你整个背脊都凉了。', when: F('flag.faced_villefort') },
      '省府的小间里没有窗。桌子对面的人，你只在门缝里见过他一次。维尔福翻着一份卷宗，用平静得没有起伏的声音问：「这位诺埃尔先生，近来对一些不该关心的事，似乎很关心？」',
    ],
    choices: [
      choice('name', 'strategy', '搬出莫雷尔先生的名字担保：「我只是替商行办事。」', '维尔福看了你一会儿，把传票折起来：「莫雷尔先生是个令人尊敬的人。」他没有抬头，「告诉他，下次这类事，他最好自己来。」你走出门，发现手心里全是冷汗，也发现自己用了一个老人一生的信用，去换了一个年轻人几天的清净。',
        { req: AT('morrel', 'trust', 2), hint: '需要莫雷尔「可托」以上的信任', fx: [add('watch', -3), rel('morrel', 'trust', -1), add('renown.reliable', -1)], values: ['zhi'] }),
      choice('deny', 'strategy', '一问三不知，只说自己记性不好。', '「记性不好，」维尔福重复了一遍，慢慢笑了，「对一个账房来说，这可不太光彩。」他把卷宗合上，「你可以走了。但我记得你的脸。」',
        { fx: [add('watch', -2), add('renown.shrewd', 1), add('renown.reliable', -1)], values: ['zhi'] }),
      choice('pay', 'strategy', '托一个书记官，把三个金路易放在他抽屉里。', '书记官看了一眼，咳嗽，把抽屉合上。第二天，你的传票像一张从来没有存在过的纸，被人从档案里抽走了。你没有高兴，因为你很清楚，从今天起，你欠了一个看不见的人。',
        { req: GE('money', 3), hint: '需要积蓄至少 3', fx: [add('money', -3), add('watch', -3)], values: ['li'] }),
      choice('flee', 'dilemma', '当夜离开马赛。', '你把仅有的几件衣服塞进一只旧箱子，趁天没亮上了去里昂的车。窗外，港口的灯一盏一盏落在后面。你不知道自己是在逃跑，还是在给自己留一条命。',
        { ends: true, fx: [setv('ended_early'), add('watch', -4)], values: ['zhi'] }),
    ],
  }),
  node('mc_int_cold', 'c5', 'interrupt', '被冷落的银行', {
    lock: 'free', canon: '原创', place: 'counting', when: ALL(IS('track', 'danglars'), UPTO('danglars', 'trust', 0)), cast: [{ id: 'danglars' }],
    art: { scene: 'salon', layers: [{ id: 'empty_chair' }] },
    intro: [
      '银行里的人突然都变得很客气。你的桌子从窗边搬到了走廊最深处，你名下的账目被一页一页转走，却没有人告诉你为什么。',
      '唐格拉尔路过你的位置，停了一下：「诺埃尔老弟，最近怎么样？」他的笑一如既往，只是眼睛里什么也没有。',
    ],
    choices: [
      choice('back', 'dilemma', '递上辞呈，回莫雷尔商行。', '你走出银行大门时，天正在下雨。你没有带伞，一路走回港口，路过莫雷尔商行的玻璃门，看见里面一盏灯亮着。你推开门。莫雷尔先生没有问你为什么回来，只是说：「桌子还在。」',
        { fx: [setv('track', 'morrel'), rel('morrel', 'trust', 1), add('renown.reliable', 1), add('money', -1), setv('flag.sidelined')], values: ['yi'] }),
      choice('work', 'strategy', '加倍工作，用业绩证明自己。', '你熬了三个月，把别人不愿意碰的老账一本一本清完。有一天，唐格拉尔把一份新合同放在你桌上，什么也没说。你知道自己没有赢，只是没有输。',
        { fx: [rel('danglars', 'trust', 2), add('renown.shrewd', 1), add('money', 1)], values: ['zhi'] }),
    ],
  }),
];

export const commitRules = [
  { char: 'mercedes', kind: 'protect', kept: ANY(F('flag.held_mercedes'), F('flag.told_mercedes'), F('flag.attended_wedding')), broken: ALL(IS('track', 'danglars'), NF('flag.attended_wedding')),
    kept_effects: [rel('mercedes', 'trust', 1)], broken_effects: [rel('mercedes', 'trust', -2)],
    kept_text: '你答应过梅尔塞苔丝的话，你做到了。她没有道谢，只是在路过你时，把头轻轻点了一下。',
    broken_text: '你答应过梅尔塞苔丝的话，没有兑现。她再看你的时候，目光里少了一样东西。' },
  { char: 'morrel', kind: 'loyalty', kept: IS('track', 'morrel'), broken: IS('track', 'danglars'),
    kept_effects: [rel('morrel', 'trust', 1)], broken_effects: [rel('morrel', 'trust', -2)],
    kept_text: '你说过会留在莫雷尔先生身边，你一直在。', broken_text: '你说过会留在莫雷尔先生身边，可你走了。他没有责备你，只是把你的名字从日历上划去了。' },
  { char: 'louis', kind: 'protect', kept: F('flag.louis_cared'), broken: NF('flag.louis_cared'), at_end: true,
    kept_effects: [rel('louis', 'warmth', 1)], broken_effects: [rel('louis', 'warmth', -1)],
    kept_text: '你答应过老路易的事，你做了。', broken_text: '你答应过老路易的事，没有来得及做。' },
];
