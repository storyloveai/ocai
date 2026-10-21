import { node, choice, callback, talk, ask, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  // ---------------- 支线 ----------------
  node('mp7_han', 'c7', 'side', '山门外的背影', {
    canon: '原创', place: 'gate', cast: [{ id: 'han' }], art: { scene: 'gate_night', layers: [{ id: 'trampled' }, { id: 'lantern' }] },
    intro: [
      '兽潮退去后的山门口，满地是被踏平的药苗和折断的竹竿。有人在一株一株地扶起还没死透的草，动作很慢，很轻，像是怕惊醒什么。',
      '是那个寡言的同门。他蹲在地上，手指沾满泥，看见你走近，只抬了抬眼，没有说话。',
      '你看见他腰间挂着一只很普通的小瓶，瓶口用蜡封着。他把一株半死的草放进去，像是随手，又像是郑重。',
    ],
    callbacks: [callback('e_han', '你想起旧蒲团、枯井、涧底的雾。这个人似乎一直在你的旁边，又似乎一直在很远的地方。')],
    choices: [
      choice('help', 'expression', '蹲下来，和他一起扶药苗。', '你们谁也没有说话。天快亮的时候，满地的药苗扶起了一半。他站起身，拍了拍手上的泥，对你点了点头：「谢了。」他走得很慢，但每一步都很稳。你在晨光里看着他的背影，忽然觉得，有些人注定要走到很远的地方。',
        { fx: [rel('han', 'trust', 1), add('renown.kind', 1)], echo: ['e_han'], values: ['ren', 'jin'] }),
      choice('ask', 'strategy', '问他：「你以后，打算去哪里？」', '他停了一下，才说：「往上走。」就这三个字，没有别的。你知道，他不会告诉你更多了。他把那只小瓶收进怀里，看了你一眼：「你呢？」你说：「还不知道。」他点点头，像是在说：这也是答案。',
        { fx: [rel('han', 'esteem', 1)], echo: ['e_han'], values: ['xin'] }),
      choice('leave', 'expression', '没有打扰他，从另一条路走开。', '你绕过那片药苗，没有回头。远处的天一点一点亮起来，像一张慢慢被展开的纸。',
        { fx: [add('cult', 1)], values: ['jin'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mp7_night', 'c7', 'main', '除夕前夜', {
    lock: 'functional', canon: '原创', place: 'quiet', order: 10,
    cast: [{ id: 'lu' }, { id: 'ye' }], art: { scene: 'quiet_room', layers: [{ id: 'stones' }, { id: 'candle' }] },
    intro: [
      '你把灵石摆在榻前，一枚一枚排成一列。它们在烛光下泛着很淡的光，像几颗被冻住的星星。',
      '三年之期，只剩今夜。你可以把它们全部用在冲关上，赌一次；也可以把一部分留给别人，把后路留给自己。',
      '门外有人轻轻敲了两下，没有说话，也没有走。',
    ],
    callbacks: [
      callback('e_promise', '你想起病棚里那句承诺。它在这间屋子里，比任何一枚灵石都重。', F('flag.promised_lu')),
      callback('e_loan', '你想起那张借息契。你欠的东西，不止灵石。', F('flag.loan')),
      callback('e_water', '你想起旱季里那一瓢一瓢的水。它们都去了该去的地方，或者不该去的地方。'),
      callback('e_ledger', '乔素的暗账，在这个夜晚终于有了一个归宿——或者没有。'),
      callback('e_manual', '你把那卷功法翻到最后一页，上面有你自己做的所有批注。', ANY(F('flag.manual_full'), F('flag.manual_part'), F('flag.manual_lib'))),
    ],
    talk: talk('lu', 2, [
      { id: 'afraid', label: '问她：「你怕不怕？」', reply: '「怕。」陆晞说，「但我更怕的是，你一个人关起门，什么话也不留。」她把一包热汤放在门口，「喝了，再决定。」', fx: [rel('lu', 'warmth', 1), rel('lu', 'trust', 1)] },
      { id: 'stay', label: '对她说：「冲关之后，我陪你下山。」', reply: '陆晞怔了怔，眼里有一点光，像刚被风吹旺的灯芯。「微尘，」她说，「你冲得成，我陪你；你冲不成，我也陪你。」她说得很轻，却比任何誓言都稳。', fx: [setv('flag.confessed'), rel('lu', 'trust', 1), rel('lu', 'intimacy', 2)], req: AT('lu', 'trust', 2), hint: '再熟一些才说得出口' },
    ]),
    choices: [
      choice('all', 'strategy', '把所有灵石留给自己，全力冲关。', '你关上门，把灯吹灭，只留一线月光。灵石一枚一枚在你掌心化作微光，顺着经脉往上冲。你听见门外的人站了很久，最后慢慢走远。',
        { fx: [add('cult', 1)], values: ['li', 'yong'] }),
      choice('give', 'dilemma', '分出两枚灵石，托人送给病棚里最需要的人。', '你把两枚灵石放进一个小布包，隔着门递出去。陆晞接过去，没有说话，只是在门外站了很久。她最终低声说：「我替你送。」那一夜，你的灵石少了，心里却有一块地方，是满的。',
        { req: GE('stone', 3), hint: '需要至少三枚灵石', fx: [add('stone', -2), setv('flag.gave_stones'), rel('lu', 'trust', 1), add('valley', 1), add('renown.kind', 1)], values: ['ren'] }),
      choice('manual', 'strategy', '不冲关，先把功法从头到尾复盘一遍。', '你坐在榻前，一页一页地翻着功法，把自己写过的每一条批注都重读了一遍。有一条是三个月前的，你已经不记得为什么要写它。可读到今天，你忽然明白了。',
        { fx: [add('meridian', 1), add('cult', 1)], values: ['jin', 'xin'] }),
    ],
  }),

  node('mp7_break', 'c7', 'main', '冲关', {
    lock: 'functional', canon: '原创', place: 'quiet', order: 20,
    cast: [{ id: 'ding' }], art: { scene: 'break_through', layers: [{ id: 'qi_flow' }, { id: 'candle' }] },
    intro: [
      '子时的钟声没有响。整座山都屏着呼吸。你盘膝坐好，把气沉入丹田，沿着经脉一寸一寸往上推。',
      '第一道关，像撞在一堵墙上；第二道关，墙开始松动；第三道关，所有的路忽然亮了。又在下一息，全灭了。',
      '黑暗里，你听到一个很远的声音，像老丁在涧底说话：「后生，不要怕。」',
    ],
    callbacks: [
      callback('e_old', '老丁最后的那句话，在这一刻变得比任何功法都清楚。', ANY(F('flag.healed_ding'), F('flag.took_scroll'))),
      callback('e_scroll', '那卷没有写完的功法，在你体内亮了一瞬，像一盏忽然被人点着的灯。', F('flag.took_scroll')),
    ],
    choices: [
      choice('push', 'dilemma', '倾尽全力，一鼓作气冲过去。', '一股热流顺着经脉冲上顶门。你觉得整个人被抛到半空，又重重落下。睁开眼睛的时候，窗外已经亮了，你的呼吸里有一种从未有过的清冽。你成了。',
        { req: ALL(GE('cult', 7), GE('stone', 3), GE('meridian', 4)), hint: '修为、灵石、经脉都要足够', fx: [setv('flag.broke_through'), add('cult', 2), add('stone', -3), add('meridian', -2)], values: ['yong', 'jin'] }),
      choice('steady', 'strategy', '放慢速度，一寸一寸地推，不求一次到位。', '关隘松动了一半，你停在那里，不进也不退。窗外天色渐白，你吐出一口很长很长的气。你知道，这不是你想要的结果，却是你能握得住的结果。',
        { req: GE('cult', 4), hint: '修为至少要到 4', fx: [setv('flag.half_through'), add('cult', 1), add('meridian', -1)], values: ['jin'] }),
      choice('fail', 'dilemma', '经脉已到极限，你只能硬撑。', '气在经脉里乱撞，你喉头一甜，吐出一口血。窗外天色渐白，你靠在榻边，浑身是汗。你没有成，可你活着。活着，就还有下一年。',
        { fx: [setv('flag.failed_through'), add('meridian', -2), add('stone', -1)], values: ['yong'] }),
    ],
  }),

  node('mp7_dawn', 'c7', 'main', '谷外', {
    lock: 'free', canon: '原创', place: 'gate', order: 30,
    cast: [{ id: 'ye' }, { id: 'lu' }], art: { scene: 'gate_dawn', layers: [{ id: 'sunrise' }, { id: 'road' }] },
    on_enter: [{ when: F('flag.took_scroll'), effects: [], resolve: [['d_scroll', 'transform']] }, { when: NF('flag.took_scroll'), effects: [], resolve: [['d_scroll', 'cancel']] }],
    intro: [
      '除夕的天亮得很晚。山门口的积雪被踩出一条泥泞的路，一头通向谷里，一头通向山外。',
      '你站在路中间，手里握着那块外门木牌，木牌的边已经被你的手磨得发亮。',
      '你知道，这是三年来，你第一次，不必被任何人安排。',
    ],
    callbacks: [
      callback('e_seat', '你想起云舟上那几个位置，想起自己把木牌给了谁，想起没有被选中的那些人。', ANY(F('flag.seat_lu'), F('flag.seat_qiao'), F('flag.brother_seat'), F('flag.self_boat'))),
      callback('e_bridge', '桥头那一夜还留在你的肩膀上，像一块没有凉透的石头。', F('flag.held_bridge')),
    ],
    choices: [
      choice('stay', 'dilemma', '留在黄枫谷，继续做外门弟子。', '你把木牌挂回腰间，转身走回山门。谷里的钟敲了一下，像是在欢迎你，也像是在提醒你：这条路，还很长。',
        { fx: [setv('flag.stayed_valley'), add('valley', 1)], values: ['jin', 'xin'] }),
      choice('with_lu', 'dilemma', '和陆晞一起下山，去看她的母亲。', '陆晞站在山门口，背着药篓，等你走近。「走吧，」她说，没有问你想好了没有。你们并肩走下山，积雪在脚下吱吱作响。你回头看了一眼，山门在晨光里，只是一个很小很小的黑点。',
        { req: AT('lu', 'trust', 3), hint: '需要陆晞足够信任你', fx: [setv('flag.left_valley'), setv('flag.with_lu'), rel('lu', 'intimacy', 2), rel('lu', 'warmth', 1)], values: ['ren', 'xin'] }),
      choice('leave', 'strategy', '一个人下山，去外面闯一闯。', '你没有回头。山路在脚下一点一点铺开，雪化了，露出下面湿漉漉的泥土。风很冷，可你觉得自己比来的时候，轻了很多。',
        { fx: [setv('flag.left_valley'), add('mark', -1)], values: ['yong', 'li'] }),
      choice('ye', 'strategy', '随叶行舟走：「我去你说的那条路上看看。」', '叶行舟把布包往肩上一甩，笑着回头：「我就知道。」他吹了一声口哨，把一枚铜钱抛向空中，又接住，「放心，你会比在谷里自在。」',
        { req: IS('track', 'rogue'), hint: '需要在雾涧口选择过右边的路', fx: [setv('flag.left_valley'), setv('flag.left_with_ye'), rel('ye', 'trust', 1), add('mark', -1)], values: ['yong', 'li'] }),
    ],
  }),
];
