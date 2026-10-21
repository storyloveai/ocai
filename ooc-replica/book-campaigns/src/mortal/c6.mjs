import { node, choice, callback, talk, ask, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  // ---------------- 支线 ----------------
  node('mp6_stores', 'c6', 'side', '最后一批药', {
    canon: '原创', place: 'shed', cast: [{ id: 'lu' }], art: { scene: 'shed', layers: [{ id: 'baskets' }, { id: 'lamp' }] },
    intro: [
      '警钟响过的第二天，药棚里乱成一团。陆晞把所有的药包都摊在地上，一个一个按炭笔的记号归类：圆圈、叉、横线。她的动作很快，快得像是怕自己一停下来，就会哭出来。',
      '「云舟只能带人，不能带药，」她头也不抬，「我必须选。」她把两包药举起来给你看，一包是救急的，一包是她母亲的。',
    ],
    callbacks: [callback('e_promise', '她没有提起那个承诺，可你们两个人都知道，它还悬在这间药棚里。', F('flag.promised_lu'))],
    choices: [
      choice('both', 'dilemma', '替她把两包都背上：「你选不了，我替你扛。」', '你把两个药包系在背上，沉得像两块石头。陆晞望着你，眼眶一下子红了，却没有哭。「你不必……」「我不必，」你说，「但我想。」',
        { fx: [add('meridian', -1), rel('lu', 'trust', 2), rel('lu', 'warmth', 1), rel('lu', 'intimacy', 1)], values: ['ren', 'yong'] }),
      choice('first', 'strategy', '劝她先留下救急的那一包，把给母亲的那包托你另想办法。', '陆晞咬着嘴唇，最后点了点头。她把母亲的那包用油纸一层一层裹好，塞进你手里：「如果我回不去，你替我送。」你握着那个油纸包，沉默了很久。',
        { fx: [rel('lu', 'trust', 1), setv('flag.sent_herbs')], echo: ['e_herbs'], values: ['jin', 'xin'] }),
      choice('plain', 'expression', '没有替她选，只是帮她把药一包一包整理好。', '你们一直整理到半夜。陆晞最后把两包药一起放进自己的行囊，笑了一下：「谢谢你没有替我选。我想自己扛一次。」',
        { fx: [rel('lu', 'esteem', 2), rel('lu', 'warmth', 1)], values: ['ren'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mp6_order', 'c6', 'main', '七声警钟', {
    lock: 'functional', canon: '原创', place: 'hall', order: 10,
    cast: [{ id: 'tao' }, { id: 'qiao' }], art: { scene: 'hall', layers: [{ id: 'bell' }, { id: 'crowd' }] },
    intro: [
      '外务堂的大院里挤满了人，火把把每张脸都烧得发红。陶岑站在台阶上，声音不再圆润，每一个字都像从牙缝里挤出来：「兽潮压境，内谷开了一扇小门。云舟六个位置。其余人，随外门执事撤向后山石桥。」',
      '人群安静了一息，随即炸开。有人冲向台阶，有人转身就跑，有人跪在地上。你看见乔素站在台阶侧面，怀里抱着那本厚厚的撤离名册，面白如纸。',
      '她朝你看了一眼，眼神里有一句话，你读懂了：她需要一个人，替她稳住人群。',
    ],
    callbacks: [
      callback('e_receipt', '那一页被撕掉的月例册，在这一夜成了所有人都不愿提起的名字。'),
      callback('e_list', '你想起那份差点外流的名册副本。现在，每个名字都变成了生死。', ANY(F('flag.burned_list'), F('flag.kept_list'), F('flag.sold_list'))),
      callback('e_water', '人群里有几张脸你认得——药田里分过水的，病棚里躺过的。他们也看见了你。', F('flag.shared_water')),
    ],
    choices: [
      choice('steady', 'dilemma', '站到石阶上，替乔素稳住秩序：「按名册，一个一个来。」', '你的声音在人群上方响起，不算大，却有一种奇异的稳。有人停了下来，有人回头。乔素一页一页翻动名册，念出名字。队伍慢慢排成了线。那一夜，你不知道自己是怎么站到天亮的。',
        { req: GE('valley', 5), hint: '谷中人心太散，没人会听你的', fx: [add('valley', 1), add('renown.kind', 1), rel('qiao', 'trust', 2), rel('tao', 'trust', -1), add('mark', 1)], values: ['yong', 'ren'] }),
      choice('list', 'strategy', '帮乔素守住名册，不让人群冲上来抢。', '你们背靠背站在台阶上，你用身体挡着名册。有人伸手来抢，被你推开。乔素低声说：「别伤人。」你说：「我不会。」那一夜，你的手臂上多了三道抓痕。',
        { fx: [add('meridian', -1), rel('qiao', 'trust', 1), rel('qiao', 'warmth', 1), add('renown.kind', 1)], values: ['ren', 'xin'] }),
      choice('run', 'strategy', '趁乱挤向后山石桥，先找到一条退路。', '你挤过人群，在石桥前停下。桥很窄，两边是深涧，水声在黑暗里翻腾。你一个人站在桥头，听着身后的喧嚣越来越远，忽然觉得，自己是这座山里最孤独的一个人。',
        { fx: [add('mark', -1), add('valley', -1), rel('qiao', 'esteem', -1)], values: ['jin', 'li'] }),
    ],
  }),

  node('mp6_seats', 'c6', 'main', '六个位置', {
    lock: 'functional', canon: '原创', place: 'boat', order: 20,
    cast: [{ id: 'lu' }, { id: 'qiao' }, { id: 'wei' }], art: { scene: 'boat_dock', layers: [{ id: 'cloud_boat' }, { id: 'torch' }] },
    intro: [
      '云舟渡的石台上停着一只巨大的银白色飞舟，舷边挂着六条绳梯。持牌的内门弟子站在舷边，目光冷淡。六个位置，已经被内谷的人预留了三个。剩下的三个，要由外门自己决定。',
      '你手里有一张木牌，能换一个位置。你可以替自己换，也可以替别人换。',
      '陆晞站在石台下，药篓背在身上，没有看你，也没有说话。乔素在队尾，仍然抱着名册。魏冲抱着他弟弟，站在最远处，像一尊被人遗忘的石像。',
    ],
    callbacks: [
      callback('e_promise', '陆晞抬起眼睛，那一眼里，你听见了病棚里的那句话。', F('flag.promised_lu')),
      callback('e_brother', '魏冲抱着弟弟的手在发抖，你从没见过他这样。'),
      callback('e_scroll', '你怀里的那卷残卷忽然变得很沉。你想起老丁的话。', F('flag.took_scroll')),
    ],
    choices: [
      choice('lu', 'dilemma', '把位置给陆晞。', '你把木牌塞进陆晞手里，不等她开口，转身就走。她在你身后喊了你的名字，声音被风吹散了。你站在石台边，看着她走上绳梯，一步，一步，没有回头。你不知道自己在笑，还是在哭。',
        { fx: [setv('flag.seat_lu'), rel('lu', 'trust', 2), rel('lu', 'warmth', 2), rel('lu', 'intimacy', 1)], echo: ['e_seat'], values: ['ren'] }),
      choice('qiao', 'dilemma', '把位置给乔素，让她带着名册上船。', '乔素看着你递来的木牌，很久没有动。「名册，」她说，「比我重要。」你说：「你比名册重要。」她愣了一下，慢慢接过。她登上绳梯时，把名册塞进你怀里：「替我守着。」',
        { fx: [setv('flag.seat_qiao'), rel('qiao', 'trust', 2), rel('qiao', 'warmth', 1)], echo: ['e_seat'], values: ['xin', 'ren'] }),
      choice('brother', 'dilemma', '把位置让给魏冲的弟弟。', '魏冲一怔，随即明白了。他抱着弟弟走到你面前，嘴唇动了动，没有说出话来。他最后只是点了点头，那一点头里有很多东西。绳梯上，那个少年回头看了你一眼。',
        { fx: [setv('flag.brother_seat'), rel('wei', 'trust', 3), rel('wei', 'esteem', 2), add('renown.kind', 1)], echo: ['e_seat', 'e_brother'], values: ['ren', 'yong'] }),
      choice('self', 'strategy', '替自己换位置，登上云舟。', '你握着木牌走上绳梯，每一步都觉得脚下发软。身后有人喊你的名字，你没有回头。云舟升起的时候，下面的火光像一片倒映的星空。你知道，这是你的选择。',
        { fx: [setv('flag.self_boat'), add('valley', -2), rel('lu', 'trust', -2), rel('qiao', 'esteem', -1)], echo: ['e_seat'], values: ['jin', 'li'] }),
    ],
  }),

  node('mp6_bridge', 'c6', 'main', '桥头一夜', {
    lock: 'functional', canon: '原创', place: 'bridge', order: 30,
    cast: [{ id: 'ye' }, { id: 'wei' }], art: { scene: 'bridge', layers: [{ id: 'torch' }, { id: 'beasts' }] },
    intro: [
      '后山的石桥窄得只容两人并肩。桥那边，兽潮的嘶吼一阵高过一阵，火光在黑暗里忽明忽暗。桥这边，外门的人正在一队一队往山外撤，而桥头，必须有人守到最后一个人过桥。',
      '外门执事把一面旧旗插在桥头，没有人说话。守桥的人，多半过不了今夜。',
      '叶行舟拎着一只小布包，慢悠悠地走过来，在桥栏上坐下：「喂，沈兄，缺人吗？我不太会打架，但我会数人头。」',
    ],
    callbacks: [
      callback('e_seat', '你想起云舟上那几个位置，想起自己把木牌给了谁，想起没有被选中的那些人。', F('flag.seat_lu')),
      callback('e_old', '你想起涧底那个老人，想起他说：「不要觉得负担。」', ANY(F('flag.healed_ding'), F('flag.took_scroll'), F('flag.took_token'))),
    ],
    choices: [
      choice('hold', 'dilemma', '留在桥头，守到最后一个人过桥。', '你握着那面旧旗，站在桥心。一个一个，一队一队，人从你身边走过。有人低着头，有人回头看你，有人对你说谢谢。天快亮的时候，最后一个人过桥，你的手臂已经麻木。你听见身后兽群的嘶吼，忽然觉得，这一夜，值得。',
        { req: GE('meridian', 3), hint: '经脉太弱，撑不过一整夜', fx: [setv('flag.held_bridge'), add('meridian', -3), add('cult', 1), add('renown.kind', 2), add('valley', 2), rel('ye', 'esteem', 2), rel('wei', 'esteem', 1)], echo: ['e_bridge'], values: ['yong', 'ren'] }),
      choice('both', 'strategy', '和叶行舟一起守半夜，数着人头，撤得动就撤。', '你们并肩站在桥心，叶行舟一边数人头，一边小声哼着那支不成调的曲子。半夜过后，兽潮的火光忽然偏了方向，你们互相看了一眼，笑了。「没想到，」他说，「真能撑下来。」',
        { fx: [setv('flag.held_bridge'), add('meridian', -2), rel('ye', 'trust', 2), rel('ye', 'warmth', 2), add('renown.kind', 1)], echo: ['e_bridge'], values: ['yong', 'xin'] }),
      choice('cross', 'strategy', '随人群过桥，把守桥的活留给执事。', '你过桥的时候，没有回头。桥头那面旧旗在风里猎猎作响，旗下站着几个模糊的影子。你走了很远很远，仍然觉得，那面旗，在你背后一直飘着。',
        { fx: [add('valley', -1), add('mark', -1)], values: ['jin'] }),
    ],
  }),
];
