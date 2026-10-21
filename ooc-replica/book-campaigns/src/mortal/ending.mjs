import { T, node, choice, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

const g = (id, title, fragments, mode) => ({ id, title: T(title), ...(mode ? { mode } : {}), fragments: fragments.map(([fid, text, when]) => ({ id: fid, text: T(text), ...(when ? { when } : {}) })) });

export const endings = [
  g('g_you', '你的去处', [
    ['fled', '你在山外的一间小客栈里听说了后来的事：兽潮退去，黄枫谷守住了山门。你对着一碗凉透的面坐了很久，没有回去。有些山门，一旦走出，就只能留在别人的故事里。', F('ended_early')],
    ['with_lu', '你和陆晞下山的那天，雪刚好停。她母亲的院子里晾着一排干草，老人看见你，拉着你的手，一遍一遍地说「好孩子」。你站在那里，忽然明白，所谓修行，有时候，只是替一个人把门槛垫稳。', F('flag.with_lu')],
    ['rogue', '你跟着叶行舟走了很远很远的路。你在不同的坊市里认出不同的药，在不同的岔口里学会记路，名册上再也没有你的名字，可你的行囊里，装满了没有人替你登记的日子。', F('flag.left_with_ye')],
    ['left', '你离开了黄枫谷。山外的路很长，没有人替你登记名字，也没有人替你记账。你把木牌留在了谷里，把自己带走了。', F('flag.left_valley')],
    ['stay', '你留在了黄枫谷，继续做外门弟子。药田重新种上了苗，病棚里换了新的草席，你的名字依旧写在最普通的那一栏。可每一个清晨，你都比昨天走得更稳一点。'],
  ]),
  g('g_realm', '那道门槛', [
    ['broke', '你踏过了那道三年没有迈过去的门槛。气在经脉里转成一条稳稳的河，你第一次觉得，自己真的在这世上有了一小块立足的地方。', F('flag.broke_through')],
    ['half', '你只过了一半。关还在那里，门缝里透着光，你伸手摸得到，却迈不过。可你已经知道，那扇门是真的存在的。这比三年前的你，多了很多很多。', F('flag.half_through')],
    ['failed', '你没有冲过去，可你活着。你把那卷功法收好，把灵石数了又数，在下一个春天来之前，你又盘膝坐在了那只旧蒲团上。', F('flag.failed_through')],
  ]),
  g('g_lu', '陆晞', [
    ['confessed', '那天夜里在门外说的那句话，陆晞没有再提。可每年冬至，她都会在药棚门口多放一碗热汤，什么也不说。', F('flag.confessed')],
    ['stones', '你分出去的那两枚灵石，陆晞替你送给了病棚里最需要的人。她后来说，那是她见过的，最没有算计的一笔账。', F('flag.gave_stones')],
    ['together', '陆晞后来在山下开了一间小小的药铺。门口挂着一盏旧药灯，灯油总是满的。有人问她为什么，她说：「有个人，替我剪过芯。」', ALL(F('flag.with_lu'), F('flag.lamp_helped'))],
    ['seat', '云舟上的那个位置，陆晞坐了一整夜。她抱着药篓，没有回头，直到云舟越过山脊，才轻轻地说了一句什么。风太大，你没有听见。', F('flag.seat_lu')],
    ['promise', '病棚里的那句话，陆晞一直当真。她后来在每一包药上都画了一个很小的圆圈——三日量。有人问是什么意思，她说：「是一个人答应过要回来的日子。」', F('flag.promised_lu')],
    ['herbs', '陆晞母亲的药，你送到了。老人的咳嗽在春天里慢慢轻了。陆晞没有道谢，只是在你的行囊里塞了一小包炒瓜子，和一张用炭笔画的小地图。', F('flag.sent_herbs')],
    ['water', '旱季里你分出去的那些水，病棚里的人都记得。陆晞说，你们那一整个夏天，没有一个人是被抬出去的。', F('flag.shared_water')],
    ['far', '陆晞留在了药棚。你们后来偶尔还会在山路上遇见，她点点头，你点点头。很多话没有说，也不必说了。'],
  ]),
  g('g_ye', '叶行舟', [
    ['paid', '你把借息契的最后一枚灵石还清的那天，叶行舟在茶棚里替你烧了那张纸。他说：「账清了，以后可以只谈交情。」', F('flag.paid_loan')],
    ['road', '叶行舟后来在一个很远的坊市里开了一家铺子，铺子里最贵的东西是一壶茶。他说，那是一个新来的朋友当年用一包茶叶跟他还价还来的。', F('flag.haggled')],
    ['vouch', '叶行舟替你认下的那笔账，你一笔一笔还了。最后一笔还完的那天，他笑着把借息契扔进火里：「你比我想的，要有出息。」', F('flag.left_with_ye')],
    ['route', '那条私径，后来成了很多人的路。叶行舟没有把它写进任何地图，可每个走过的人，都在岔口的石头上留下了一个小小的记号。', F('flag.paid_route')],
    ['plain', '叶行舟在某个春天离开了青石坊。没有人知道他去了哪里，只在茶棚的桌上留下一枚铜钱。']],
  ),
  g('g_qiao', '乔素与名册', [
    ['seat', '云舟上的那个位置，乔素最终还是坐了。她怀里的名册，后来成了黄枫谷重建时第一本被翻开的册子。', F('flag.seat_qiao')],
    ['exposed', '陶岑被调去了别处。乔素的暗账成了一份真正的账，被人一页一页地翻了出来。她依旧坐在案后，写字时背脊挺得很直，像一根终于有了依靠的竹竿。', F('flag.exposed_tao')],
    ['kept', '那份名册，你一直替乔素收着。多年以后，有一个新来的小弟子在翻旧册时问起：「这些名字，是谁写的？」你说：「是一个很固执的人。」', F('flag.kept_list')],
    ['burned', '名册化成了灰，没有人知道上面写过什么。乔素后来对你说：「你烧掉的，不只是纸。你烧掉的是一个可能被人利用的世界。」', F('flag.burned_list')],
    ['sold', '那份名册在陶岑的手里，换走了很多人的前程。乔素后来再也没有和你说过话。有些东西，不是灵石换得回的。', F('flag.sold_list')],
    ['age', '那批被改了药龄的灵草，后来被人悄悄重新登记。乔素在册子的边角，替你记了一个极小的点。', F('flag.fake_age')],
    ['plain', '乔素还在外务堂的案后写字。她的字很小，很稳，一个一个，把这个世界的数字记得清清楚楚。']],
  ),
  g('g_wei', '魏冲与他弟弟', [
    ['brother', '魏冲的弟弟坐上了云舟。魏冲后来一直没有再收过谁的买路钱。有人在山路上遇见他，他只是侧身让开，对你说：「过去吧。」', F('flag.brother_seat')],
    ['stalled', '你拖了一个月才把魏冲的账还上。他没有追，也没有忘，只是从那以后，山路上再遇见你，会多看一眼你的钱袋。', F('flag.stalled_loan')],
    ['defied', '你当面顶撞过魏冲，他一直记着。可他记着的不是你的话，而是你说话时没有后退的那半步。后来他在山路上遇见你，只是点了点头。', F('flag.defied_wei')],
    ['paid', '你付过魏冲的买路钱。这件事后来没有人再提起，可你知道，山路上有一个人认得你的脚步。', F('flag.paid_wei')],
    ['plain', '魏冲在兽潮之后，换了另一条路走。没有人知道他去了哪里，只有山路边的一块石头，被人坐出了一个凹痕。']],
  ),
  g('g_tao', '陶岑', [
    ['fallen', '陶岑被人从外务堂的案后请了出去。那张圆圆的脸，依旧挂着笑，笑得和以前一模一样。你忽然觉得，这个人从来没有变过，变的是你。', F('flag.reported_tao')],
    ['warm', '陶岑后来对你一向客气。他在案后笑眯眯地说「小沈，进步很快」。你知道，这是一个很会写账的人，也是一个很会算人的人。', ANY(F('flag.col_patrol'), F('flag.has_license'), F('flag.sold_list'))],
    ['plain', '陶岑还坐在外务堂的案后。他的笑，和三年前一模一样。']],
  ),
  g('g_valley', '黄枫谷', [
    ['warm', '兽潮之后，黄枫谷的药田重新有了苗。有人说，那个夏天里，是有人分过水的；有人说，那个冬天里，是有人守过桥的。人们没有说出你的名字，可每个人都知道。', ALL(GE('valley', 8), ANY(F('flag.shared_water'), F('flag.held_bridge')))],
    ['bridge', '桥头那面旧旗，后来被人收进了外务堂。守桥的名字没有写在上面，可每年冬至，总有人在桥头多放一只空碗。', F('flag.held_bridge')],
    ['cold', '兽潮之后，谷里的人心散了。有人搬走，有人沉默，药田里最后一茬苗，也没有人再浇。你知道，有些东西，一旦凉了，就不容易再热起来。', LE('valley', 3)],
    ['sharp', '谷里的人说起你，总说一句：「那个精明的沈师兄。」这话里有敬，也有一点点距离。', GE('renown.sharp', 5)],
    ['kind', '谷里的人说起你，总说一句：「那个厚道的沈师兄。」这话里有暖，也有一点点心疼。', GE('renown.kind', 5)],
    ['fast', '雾涧里那条近路，后来有人在石壁上刻了一道很浅的痕。没有人说是谁刻的，也没有人把它抹掉。', F('flag.fast_path')],
    ['home', '你留在谷里的那些日子，药田慢慢长出了新苗。有人叫你师兄的时候，不再带着试探。', F('flag.stayed_valley')],
    ['plain', '黄枫谷的钟声，在每一个黄昏里敲三下。你在钟声里，慢慢习惯了这里的日子。']],
  ),
];

export const endNote = '卷一终。你在这一卷里留下的一切——每一笔账、每一次沉默、每一句话——都会被记下，带进下一卷。';

export const fragFace = {
  g_realm: { broke: ['han', 'neutral'], half: ['ding', 'neutral'], failed: ['ding', 'sad'] },
  g_lu: { together: ['lu', 'warm'], seat: ['lu', 'warm'], promise: ['lu', 'warm'], herbs: ['lu', 'warm'], water: ['lu', 'neutral'], far: ['lu', 'sad'] },
  g_ye: { road: ['ye', 'warm'], vouch: ['ye', 'warm'], route: ['ye', 'neutral'], plain: ['ye', 'neutral'] },
  g_qiao: { exposed: ['qiao', 'warm'], kept: ['qiao', 'neutral'], burned: ['qiao', 'sad'], sold: ['qiao', 'cold'], seat: ['qiao', 'warm'], plain: ['qiao', 'neutral'] },
  g_wei: { brother: ['wei', 'warm'], defied: ['wei', 'cold'], paid: ['wei', 'neutral'], plain: ['wei', 'neutral'] },
  g_tao: { fallen: ['tao', 'cold'], warm: ['tao', 'warm'], plain: ['tao', 'neutral'] },
};

export const endingArt = {
  scene: 'ending',
  layers: [
    { id: 'glow_gate', when: F('flag.broke_through') },
    { id: 'lamp', when: F('flag.with_lu') },
    { id: 'road', when: F('flag.left_with_ye') },
    { id: 'bridge_flag', when: F('flag.held_bridge') },
    { id: 'ledger_book', when: F('flag.kept_list') },
  ],
};

export const interrupts = [
  node('mp_int_mark', 'c5', 'interrupt', '深夜的敲门声', {
    lock: 'free', canon: '原创', place: 'quiet', when: GE('mark', 4), cast: [{ id: 'wei' }],
    art: { scene: 'quiet_room', layers: [{ id: 'shadow_men' }, { id: 'candle' }] },
    intro: [
      '深夜，你的住处响起三声很轻的敲门声。你开门的时候，门外站着两个陌生的外门弟子，他们没有说话，只把一块木牌举到灯下：那是内门某位师兄的信物。',
      '「沈微尘，」其中一个人说，「有人想请你去喝一杯茶。」',
      { text: '你想起魏冲坐在茶棚里的那张脸，想起他说过的：「说出口的话，是会被人当成价码的。」', when: ANY(F('flag.paid_wei'), F('flag.defied_wei')) },
    ],
    choices: [
      choice('go', 'dilemma', '跟他们去，看看对方想要什么。', '茶很苦，对方的话很短。他只问了三个问题，每一个，都落在你最不想被人看见的地方。你把答案一个一个说完，才发现自己的后背已经湿透。临走时，他说：「你是个聪明人。聪明人，不会做多余的事。」',
        { fx: [add('mark', -3), rel('wei', 'trust', -1), add('valley', -1), setv('flag.sidelined')], values: ['jin'] }),
      choice('stone', 'strategy', '塞给他们两枚灵石：「天晚了，改日我亲自登门。」', '两个人对看了一眼，收下灵石，什么也没有说。他们走了，月光照在地上，像一层薄薄的霜。你知道，这件事只是被推迟了。',
        { req: GE('stone', 2), hint: '需要至少两枚灵石', fx: [add('stone', -2), add('mark', -2)], values: ['li'] }),
      choice('ye', 'dilemma', '把叶行舟的名字抬出来。', '「叶行舟？」其中一个人皱了皱眉，「他是你什么人？」你说：「朋友。」两个人沉默了一会儿，终于转身离开。第二天，叶行舟没有问发生了什么，只是在茶棚里替你多添了一杯茶。',
        { req: AT('ye', 'trust', 2), hint: '需要叶行舟足够信任你', fx: [add('mark', -3), rel('ye', 'trust', 1)], values: ['xin'] }),
      choice('flee', 'dilemma', '当夜翻墙离开黄枫谷。', '你把木牌留在榻上，披上外衣，翻过矮墙。山风很冷，你一路没有回头。你知道自己在逃跑，可你更知道，如果不走，今夜之后，你可能没有明天。',
        { ends: true, fx: [setv('ended_early'), add('mark', -4)], values: ['jin'] }),
    ],
  }),
];

export const commitRules = [
  { char: 'lu', kind: 'protect', kept: ANY(F('flag.promised_lu'), F('flag.sent_herbs')), broken: ALL(F('flag.promised_lu'), F('flag.self_boat')),
    kept_effects: [rel('lu', 'trust', 1)], broken_effects: [rel('lu', 'trust', -2)],
    kept_text: '你答应过陆晞的事，你做到了。她没有道谢，只是把药灯的灯芯，又剪短了一点。',
    broken_text: '你答应过陆晞的话，没有兑现。她再看你的时候，目光里少了一样东西。' },
  { char: 'qiao', kind: 'loyalty', kept: F('flag.kept_list'), broken: F('flag.sold_list'),
    kept_effects: [rel('qiao', 'trust', 1)], broken_effects: [rel('qiao', 'trust', -2)],
    kept_text: '你替乔素守住了名册。她没有说话，只是在册子的扉页写了一个很小的「沈」字。',
    broken_text: '你把名册卖了出去。乔素没有当面责备你，只是在名册的空白处，把你的名字划掉了。' },
  { char: 'wei', kind: 'protect', kept: F('flag.brother_seat'), broken: ALL(F('flag.self_boat'), NF('flag.brother_seat')), at_end: true,
    kept_effects: [rel('wei', 'trust', 1)], broken_effects: [rel('wei', 'trust', -1)],
    kept_text: '你答应过魏冲的事，你做了。', broken_text: '你答应过魏冲的事，没有来得及做。' },
];
