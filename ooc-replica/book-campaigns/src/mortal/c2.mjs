import { node, choice, callback, ask, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  // ---------------- 支线 ----------------
  node('mp2_scale', 'c2', 'side', '一杆偏了二分的秤', {
    canon: '原创', place: 'market', cast: [{ id: 'ye' }], art: { scene: 'market', layers: [{ id: 'scale' }, { id: 'stalls' }] },
    intro: [
      '青石坊卖药材的摊位挤在一条窄巷里，每个摊子都挂着一杆小秤。你替陆晞买三钱当归，称出来的东西总觉得轻了一点，轻得几乎看不出来。',
      '摊主是个胖胖的中年人，笑得很和气。他把包好的药推到你手边：「三钱，一分不少。」',
      { text: '叶行舟靠在对面的墙上，没有看你，只是慢条斯理地剥着一颗花生。', when: F('flag.paid_route') },
    ],
    callbacks: [callback('e_route', '叶行舟朝你抬了抬下巴，像是在说：看你的了。', F('flag.paid_route'))],
    choices: [
      choice('weigh', 'strategy', '把药包放到旁边另一家的秤上再称一遍。', '另一家的秤给出了三钱二分。摊主的笑僵了一下，随即又堆起来：「哎呀，这杆秤是旧了，我给您添上。」周围几个摊子都安静了一下。你付了钱走开，背后有人低声骂了一句，不知道骂的是你还是他。',
        { fx: [setv('flag.caught_scale'), add('renown.sharp', 1), add('mark', 1), rel('ye', 'esteem', 1)], echo: ['e_scale'], values: ['jin', 'xin'] }),
      choice('quiet', 'expression', '不动声色，付钱走开，回头悄悄告诉陆晞这家的秤不准。', '你什么也没有说。回到药棚，把话原样转给陆晞，她点点头，在炭笔画的小本子上记了一行。「下回换一家，」她说，「别和他们撕破脸，这条巷子我们还要走很久。」',
        { fx: [rel('lu', 'trust', 1), add('renown.kind', 1)], echo: ['e_scale'], values: ['jin', 'ren'] }),
      choice('pay', 'dilemma', '多付两分，换一句「下次别这样」。', '摊主一愣，收了钱，低声说：「小兄弟，你是明白人。」他没有承认，也没有道歉，但下一回称药的时候，那杆秤再也没有偏过。你不知道这算不算赢。',
        { req: GE('stone', 1), hint: '需要一点灵石', fx: [add('stone', -1), rel('ye', 'warmth', 1), add('renown.sharp', 1)], echo: ['e_scale'], values: ['li'] }),
    ],
  }),

  node('mp2_pharmacy', 'c2', 'side', '药龄', {
    canon: '原创', place: 'market', cast: [{ id: 'qiao' }], art: { scene: 'market', layers: [{ id: 'roots' }, { id: 'tag' }] },
    intro: [
      '外务堂收购一批药田出来的灵草，要你当个帮手点数。木牌上写的药龄是三年，可你捏起一株根须，指腹按过去，只觉得发软、发空。',
      '乔素站在旁边，拿着笔，没有催你。她的目光落在你手指的位置，停了一下。',
    ],
    choices: [
      choice('report', 'dilemma', '低声告诉她：「这批是一年的，木牌写错了。」', '乔素的笔尖在纸上落下一个小点。她没有说话，只是把那一页翻了过去，在后面写了几个你看不清的字。「谢谢你告诉我，」她说，「这件事我会处理。」你没有看见她后来怎么处理的，只在几天后听说，药田的某位管事被调去了别处。',
        { fx: [setv('flag.fake_age'), rel('qiao', 'trust', 2), rel('tao', 'trust', -1), add('mark', 1)], echo: ['e_age'], values: ['xin', 'yong'] }),
      choice('hide', 'strategy', '照着木牌的数字点完，什么也不说。', '你把数字一个一个报出去，乔素一个一个写下来。这批药被登记成了三年的。傍晚收工，你的手上沾着泥，心里有一块地方一直悬着。你没有想清楚那是为什么。',
        { fx: [add('mark', -1), rel('qiao', 'esteem', -1), setv('flag.fake_age')], echo: ['e_age'], values: ['jin'] }),
      choice('ask', 'expression', '问她：「药龄是怎么定的？谁来写这块牌子？」', '乔素放下笔，看了你一会儿。「牌子是药田管事写的，」她说，「我只负责把它抄进册子里。」她停了一下，「你问的是一个很好的问题。可惜没有人愿意回答。」她从册子下面抽出一张纸，递给你：「这是上个月的收购单，你自己看。」',
        { fx: [rel('qiao', 'trust', 1), rel('qiao', 'esteem', 1), add('renown.sharp', 1)], echo: ['e_age'], values: ['xin'] }),
    ],
  }),

  node('mp2_alley', 'c2', 'side', '后巷里的一碗面', {
    canon: '原创', place: 'market', cast: [{ id: 'lu' }, { id: 'tao' }], art: { scene: 'alley', layers: [{ id: 'noodles' }, { id: 'steam' }] },
    intro: [
      '青石坊后巷有一家面摊，只有四张小桌，面汤里放的是最便宜的骨头，却热得烫舌头。你在这里撞见了陶岑，他正和一个陌生人对坐，面前放着两碗没有动过的面。',
      '陆晞也在。她缩在角落里，把自己的那碗面推到你面前：「我吃不下，你吃吧。」她的声音很轻，眼睛却一直盯着陶岑那张桌子。',
    ],
    choices: [
      choice('eat', 'expression', '把面吃完，什么也不看。', '你吃完了那碗面。汤很烫，咸得发苦。陆晞一直没有说话，等你放下碗，她才慢慢问：「你什么都没有看到，对不对？」你说：「对。」她点点头，那是你们之间第一个没有说出口的约定。',
        { fx: [rel('lu', 'trust', 1), rel('lu', 'warmth', 1), add('mark', -1)], values: ['jin', 'xin'] }),
      choice('listen', 'strategy', '借着添汤的机会，往陶岑那张桌子靠近一点。', '你只听到半句：「……谷里这批水票，月底前要……」然后陌生人看了你一眼，陶岑的笑一点也没有变。「小沈，」他说，「来碗面？」你说不用了。你走出巷口，才发现自己后背全湿了。',
        { fx: [add('mark', 1), rel('tao', 'esteem', 1), rel('tao', 'trust', -1), add('renown.sharp', 1)], values: ['jin', 'yong'] }),
      choice('greet', 'strategy', '大大方方走过去，和陶岑打了个招呼。', '陶岑起身，满脸笑意：「哎，小沈！正好，我给你介绍一位朋友。」那个陌生人站起来拱了拱手，眼神很稳，没有说名字。你们寒暄了一会儿。陶岑送你出门时，轻轻拍了拍你的肩：「有胆子的年轻人，我喜欢。」',
        { fx: [rel('tao', 'trust', 1), rel('tao', 'warmth', 1), add('mark', 1), rel('lu', 'esteem', -1)], values: ['li', 'yong'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mp2_manual', 'c2', 'main', '两种价的功法', {
    lock: 'functional', canon: '原创', place: 'market', order: 10,
    cast: [{ id: 'ye' }], art: { scene: 'market', layers: [{ id: 'scroll' }, { id: 'stall_night' }] },
    intro: [
      '夜市的角落里，一个不起眼的摊子摆着三卷功法。第一卷纸页发黄，封面写着《青元诀》，标价三枚灵石；第二卷只有半卷，缺了后面的页，标价一枚；第三卷根本没有价牌，摊主只是敲了敲桌子。',
      '叶行舟蹲在摊边，随手翻着残卷：「完整的稳，残缺的险，藏经阁里抄的免费，只是要排队，要写名字，要被人记住你抄过什么。」他把残卷放回去，「我不替你选，只告诉你每一种的价钱。」',
    ],
    callbacks: [callback('e_haggle', '叶行舟懒洋洋地说：「上次谈条款的那位，今天想买什么？」', F('flag.haggled'))],
    choices: [
      choice('full', 'strategy', '花三枚灵石，买下完整的《青元诀》。', '你把灵石一枚一枚数出去，摊主把功法裹进油纸，递到你手上。那是你进谷以来花得最痛的一笔钱，可你把功法翻开的那一刻，每一行字都清清楚楚，像一条铺好的路。',
        { req: GE('stone', 3), hint: '需要三枚灵石', fx: [add('stone', -3), setv('flag.manual_full'), add('cult', 1), add('meridian', 1)], echo: ['e_manual'], values: ['jin', 'li'] }),
      choice('part', 'dilemma', '花一枚灵石，买下那半卷残本。', '残卷的前半截写得很细，后半截没有了，只留下一个断掉的句子。叶行舟看着你付钱，没有劝你。「残卷练到后面，」他淡淡地说，「要自己补。补对了是你的本事，补错了是你的命。」',
        { req: GE('stone', 1), hint: '需要一枚灵石', fx: [add('stone', -1), setv('flag.manual_part'), add('cult', 2), add('meridian', -1)], echo: ['e_manual'], values: ['yong', 'li'] }),
      choice('library', 'strategy', '不花钱，去藏经阁排队抄录。', '藏经阁的管事一边登记你的名字，一边记录你抄的篇目。你抄了整整三个晚上，手腕酸得抬不起来。抄完的那一天，管事在簿子上画了一道线：「沈微尘，抄《青元诀》上卷。」你知道，从今天起，有人知道你在练什么了。',
        { fx: [setv('flag.manual_lib'), add('cult', 1), add('mark', 1), rel('qiao', 'esteem', 1)], echo: ['e_manual'], values: ['jin', 'xin'] }),
    ],
  }),

  node('mp2_wei', 'c2', 'main', '买路钱', {
    lock: 'functional', canon: '原创', place: 'road', order: 20,
    cast: [{ id: 'wei' }], art: { scene: 'road', layers: [{ id: 'shadow_men' }, { id: 'lantern' }] },
    intro: [
      '回谷的路上，三个人站在山路正中，不让也不挡。为首的是个高个子，袖子卷到肘部，手臂上有一道蛇一样的旧疤。他看着你，微微侧过头：「新来的？我叫魏冲。这条路，是我们走的。」',
      '他没有动手，也没有威胁，只是慢慢地说：「你要过去，一枚灵石。不贵。这条路上，我们保你安全。」',
      '你知道这三个人不是在抢劫，他们在收一种比抢劫更长久的东西——习惯。',
    ],
    callbacks: [
      callback('e_scale', '魏冲歪了歪头：「坊市里那个称药的？我听说了。」', F('flag.caught_scale')),
      callback('e_manual', '魏冲扫了一眼你怀里露出的功法一角，目光停了一瞬。', ANY(F('flag.manual_full'), F('flag.manual_part'))),
    ],
    ask: ask('wei', '「你叫什么？谁带你来的？」', [
      { id: 'plain', means: '平静地报上名字和来历，不卑不亢', match: '沈微尘|我叫|荐书|药铺|学徒|山下',
        out: '魏冲点点头，像是在心里画了一个很小的记号。「沈微尘，」他念了一遍，「记住了。」他的眼神松了一些。', fx: [rel('wei', 'esteem', 1)] },
      { id: 'bluff', means: '虚张声势，抬出别的靠山或威胁对方', match: '你敢|信不信|我认识|师兄|长老|外务堂|报上去',
        out: '魏冲笑了，笑得很慢：「靠山？谁的靠山？」他把手指在袖口里捻了捻，「说话要小心，因为我会去核实。」', fx: [rel('wei', 'trust', -1), add('mark', 1)] },
      { id: 'quiet', means: '沉默或含糊其辞', match: '没什么|不说|随便',
        out: '魏冲没有追问，只是把你上下看了一遍。沉默有时候也是一种回答，他显然在心里把它归了类。', fx: [] },
    ], 'quiet'),
    choices: [
      choice('pay', 'strategy', '掏出一枚灵石，递给魏冲。', '魏冲接过灵石，在指尖弹了一下，收进袖子里。「懂事，」他说，侧身让开半步。你从他身边走过，没有回头。你知道从今天起，这条路上多了一个认识你的人。',
        { req: GE('stone', 1), hint: '需要一枚灵石', fx: [add('stone', -1), setv('flag.paid_wei'), rel('wei', 'trust', 1), add('mark', 1)], echo: ['e_wei'], values: ['jin', 'li'] }),
      choice('defy', 'dilemma', '看着他：「路是谷里的，不是你的。我不付。」', '空气一下子凝住了。魏冲身后的两个人往前迈了半步，又停住。魏冲盯着你，慢慢咧开嘴，笑了：「有意思。」他侧身让路，「今天算你的。下一次，没有这么便宜。」你走过去的时候，后背一片冷汗。',
        { req: GE('meridian', 5), hint: '经脉太弱，硬顶可能会受伤', fx: [setv('flag.defied_wei'), rel('wei', 'esteem', 2), rel('wei', 'trust', -1), add('mark', 2), add('renown.sharp', 1)], echo: ['e_wei'], values: ['yong', 'xin'] }),
      choice('detour', 'strategy', '转身另走一条山路，多绕半个时辰。', '你没有争，也没有付，只是绕了过去。那条路更陡，更暗，你摔了一跤，膝盖流了血。回到谷里的时候，天已经黑透了。魏冲看着你的背影，没有追。他只是在心里把你归到了另一个类别里。',
        { fx: [add('meridian', -1), rel('wei', 'esteem', -1)], echo: ['e_wei'], values: ['jin'] }),
    ],
  }),
];
