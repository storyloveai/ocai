import { node, choice, callback, talk, ask, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  // ---------------- 支线 ----------------
  node('mp4_prep', 'c4', 'side', '试炼前夜的行囊', {
    canon: '原创', place: 'gate', cast: [{ id: 'ye' }, { id: 'lu' }], art: { scene: 'gate_night', layers: [{ id: 'packs' }, { id: 'lantern' }] },
    intro: [
      '试炼前一夜，山门口的石阶上摆满了行囊。每个人都在清点自己带得起的东西：干粮、火折子、止血散、一两枚压箱底的灵石。',
      '你面前只有一只半空的布袋。叶行舟蹲在你旁边，把几样小东西一件一件摆出来，像摆摊：「雾涧里三天，缺什么都得自己想办法。要买的话，现在还来得及。」',
      '陆晞在不远处，把一包用油纸裹好的药粉塞进另一个人的行囊，抬头时，目光和你碰了一下。',
    ],
    callbacks: [callback('e_lamp', '陆晞朝你走来，手里提着那盏你替她剪过芯的药灯：「雾涧里黑，这个你带着。」', F('flag.lamp_helped'))],
    choices: [
      choice('buy', 'strategy', '花一枚灵石，向叶行舟买一份干粮和火折子。', '叶行舟把东西包好递过来：「懂行。」他停了一下，又往里面塞了一小包盐，「这个不收钱。盐在雾涧里比灵石值钱。」',
        { req: GE('stone', 1), hint: '需要一枚灵石', fx: [add('stone', -1), add('meridian', 1), rel('ye', 'trust', 1)], values: ['jin', 'li'] }),
      choice('medicine', 'dilemma', '请陆晞分你一点止血散。', '陆晞没有问为什么，把药包拆开，分了一半给你，手指在你的掌心里停了一下：「用不到最好。」她想了想，又补了一句：「回来以后，你要告诉我，有没有用上。」',
        { fx: [rel('lu', 'trust', 1), rel('lu', 'warmth', 1), add('meridian', 1)], values: ['ren'] }),
      choice('light', 'expression', '什么也不买，只在石阶上把自己的经脉走了一遍。', '你坐在石阶上，一遍一遍走着大周天。夜风很凉，但经脉里有一条细细的暖流慢慢铺开。天亮的时候，你站起身，觉得今天的自己比昨天稳了一点点。',
        { fx: [add('cult', 1), add('meridian', 1)], values: ['jin'] }),
    ],
  }),

  node('mp4_cache', 'c4', 'side', '旧营地的暗格', {
    canon: '原创', place: 'camp', cast: [{ id: 'han' }], art: { scene: 'camp', layers: [{ id: 'cache' }, { id: 'mist' }] },
    intro: [
      '雾涧外围有一处废弃的营地，几根断木撑着半片破篷。你在石缝里摸到一个用油布包好的小包，里面是几片干粮和一小瓶丹药，瓶口的蜡封还很新。',
      '看起来像是前一批试炼者留下的。他们为什么没有拿走？你不知道。',
      '远处雾里有极轻的脚步声，一步，一步，停下，又走。',
    ],
    callbacks: [callback('e_han', '你想起那个总是慢一拍的同门，他的行事和这个暗格有一种说不出的相似。')],
    choices: [
      choice('take', 'strategy', '把丹药和干粮收进自己的行囊。', '你把东西收好，心里很快盘算了一遍：这是白捡的。丹药入口微苦，经脉里的涩意淡了不少。走了几步，你回头望了一眼那个石缝，忽然觉得，它像一只在黑暗里看着你的眼睛。',
        { fx: [add('cult', 1), add('meridian', 1), add('mark', 1)], values: ['li'] }),
      choice('leave', 'expression', '原样放回去，在旁边做一个记号。', '你把油布包好，塞回石缝，用一块石头压好。走出很远，你才发现自己松了一口气。后来在雾涧里最冷的那一夜，你想起那个暗格，想起它还留在原地，心里有一块地方是暖的。',
        { fx: [add('renown.kind', 1), rel('han', 'trust', 1)], echo: ['e_han'], values: ['jin', 'xin'] }),
      choice('mark', 'strategy', '只取一片干粮，在石缝里留下一枚灵石作抵。', '你把一枚灵石压在石头下面，取走一片干粮。这是一次说不清算不算公平的交易，可你想，如果有一天，有人像你一样饿着肚子走到这里，至少会知道，这里曾经有人付过钱。',
        { req: GE('stone', 1), hint: '需要一枚灵石', fx: [add('stone', -1), add('meridian', 1), add('renown.kind', 1)], values: ['ren', 'xin'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mp4_ravine', 'c4', 'main', '雾涧第一夜', {
    lock: 'functional', canon: '原创', place: 'ravine', order: 10,
    cast: [{ id: 'ye' }, { id: 'lu' }], art: { scene: 'ravine', layers: [{ id: 'mist' }, { id: 'torch' }] },
    intro: [
      '雾涧里的雾比山门外浓得多，像一锅煮开的白粥，伸手不见五指。你们一行十几个人，用一根长绳把彼此系在一起，在涧底摸索着前进。',
      '第一夜，绳子忽然紧了一下——前面有人摔倒了。喊声被雾吞掉，只剩下断断续续的呻吟。你摸到是那个总爱说笑的年轻杂役，他的脚踝折了，骨头从皮里顶出一点白。',
      '前方有一条看起来更近的路，但绳子拉不过去。身后是整个队伍，所有人都在等你的决定。',
    ],
    callbacks: [
      callback('e_stones', '队伍里有人认出了你，那个下午在山路上搬过碎石的人。'),
      callback('e_lamp', '陆晞给的那盏药灯在腰间晃了晃，灯光在雾里只能照出一尺远，却足够看清他的脸。', F('flag.lamp_helped')),
      callback('e_route', '叶行舟当初教你记下的每一个岔口，此刻在脑子里一个一个亮了起来。', F('flag.paid_route')),
    ],
    choices: [
      choice('carry', 'dilemma', '背起伤者，带着整队人走那条远路。', '你把他背在身上，每一步都踩得很深。远路绕了两倍的路，天亮时队伍才走出雾区。你的双腿像灌了铅，经脉里的气被压榨得一滴不剩。可那个年轻杂役伏在你背上，一路都在轻声说：「别放下我，别放下我。」你没有。',
        { fx: [add('meridian', -2), add('cult', -1), add('renown.kind', 2), add('valley', 1), rel('lu', 'trust', 1), rel('ye', 'esteem', 1)], echo: ['e_path'], values: ['ren', 'yong'] }),
      choice('fast', 'strategy', '带着能走的人抢先走近路，让后面的人慢慢跟上。', '近路湿滑，却快。你们比其他队伍早了半天走出雾区，赢得了采药的先机。可在你身后，有人在雾里喊了很久，最后喊声渐渐低下去，再也没有响起。你没有回头。',
        { fx: [setv('flag.fast_path'), add('cult', 2), add('mark', 1), add('renown.sharp', 1), add('valley', -1), rel('lu', 'trust', -1)], echo: ['e_path'], values: ['li', 'jin'] }),
      choice('stay', 'expression', '请队伍原地停下，包扎伤者，等天亮再走。', '你让所有人围成一圈，把火折子点燃，传着一小包盐。有人抱怨耽误时间，有人沉默不语。雾里的一夜很长，但没有一个人被留下。天亮的时候，有人低声说了一句：「还好没走。」',
        { fx: [add('cult', -1), add('renown.kind', 1), add('valley', 1), rel('lu', 'warmth', 1), rel('ye', 'warmth', 1)], echo: ['e_path'], values: ['ren', 'jin'] }),
    ],
  }),

  node('mp4_oldman', 'c4', 'main', '涧底的老人', {
    lock: 'functional', canon: '原创', place: 'ravine', order: 20,
    cast: [{ id: 'ding' }], art: { scene: 'ravine', layers: [{ id: 'old_man' }, { id: 'torch' }] },
    intro: [
      '第二天傍晚，你在一块巨石后面发现了一个人。他靠着石头坐着，身上盖着一件破旧的灰袍，嘴唇干裂，胸口微微起伏。',
      '他听到脚步声，艰难地睁开眼，声音嘶哑得像砂纸：「后生……别怕。我不是妖，只是走不动了。」',
      '他的手边放着一卷用布包好的东西，布角磨破了，露出里面发黄的纸页。他的手指，一直压着那卷东西，没有松开。',
    ],
    callbacks: [callback('e_han', '雾里有人影一闪，那个寡言的同门似乎也在附近，却没有靠近。', F('flag.cushion'))],
    ask: ask('ding', '「后生……你叫什么名字？你为什么停下来？」', [
      { id: 'kind', means: '真诚说明自己想帮忙，或者说不忍心见死不救', match: '帮|救|不忍|看不下去|我是沈微尘|你别动|别怕',
        out: '老丁闭了闭眼，嘴角动了一下，像是想笑：「好……好后生。」他的手指松了一点点，「我活了六十年，路上遇见的人，十个里有九个，转身就走了。」', fx: [rel('ding', 'trust', 2), rel('ding', 'warmth', 1)] },
      { id: 'wary', means: '谨慎试探，问他的来历和这卷东西的来路', match: '你是谁|从哪|哪个宗门|这是什么|卷|来路|凭什么',
        out: '老丁没有生气，反而点了点头：「谨慎，好……这世道，该这样。」他慢慢把布角翻开一点，露出几行潦草的字，「我叫丁远，原是一个小宗门的执事。宗门没了，剩下这个。」', fx: [rel('ding', 'esteem', 1), rel('ding', 'trust', 1)] },
      { id: 'greedy', means: '直接要他手里的东西，或打听里面有什么宝贝', match: '给我|交出来|什么宝|值钱|灵石|宝贝|功法在哪',
        out: '老丁的目光一下子冷了下来，那只压着卷轴的手重新按紧。「后生，」他的声音轻得像风，「你问错了第一句话。」', fx: [rel('ding', 'trust', -2), add('mark', 1)] },
    ], 'wary'),
    choices: [
      choice('heal', 'dilemma', '用自己的止血散和干粮，替他疗伤、喂水。', '你把止血散敷在他腿上的裂口，一口一口喂他喝水。他喝得很慢，像是怕一口喝完，这个梦就会醒。天色渐暗，他靠着石头睡着了，呼吸比刚才稳了许多。你守在他旁边，听着雾里的水声，心里一点也不后悔。',
        { fx: [setv('flag.healed_ding'), add('meridian', -1), add('renown.kind', 1), rel('ding', 'trust', 2), rel('ding', 'warmth', 1)], echo: ['e_old'], values: ['ren'] }),
      choice('scroll', 'dilemma', '听他把话说完，收下那卷没有写完的功法，答应替他送给后人。', '老丁把卷轴放进你手里，那一刻你觉得手心很烫。「我走不出这个涧了，」他说，「这卷东西，是我师门最后留下的。我替它找了二十年的主人……没有找到。你不要觉得负担，能用就用，不能用就烧了。可是……要是你有一天遇见一个真正需要它的孩子……」他没有说完。',
        { req: AT('ding', 'trust', 2), hint: '他还不够信任你', fx: [setv('flag.took_scroll'), add('cult', 2), rel('ding', 'trust', 1)], debt: ['d_scroll'], echo: ['e_scroll', 'e_old'], values: ['xin', 'ren'] }),
      choice('token', 'strategy', '只收下他递来的一枚旧木牌，作为日后去找他同门的凭证。', '木牌磨得发亮，背面刻着一个字：丁。你把它塞进衣襟里，贴着胸口。老丁看着你，轻轻点头：「也好，也好。」他没有再说别的，只是把卷轴重新抱进怀里，像抱着一个沉睡的孩子。',
        { fx: [setv('flag.took_token'), rel('ding', 'trust', 1), add('mark', 1)], echo: ['e_old'], values: ['jin'] }),
      choice('go', 'strategy', '把水留给他，没有多问，继续赶路。', '你把水囊放在他手边，说了一声「保重」。老丁没有回话，只是慢慢地合上了眼睛。你走出很远，仍然觉得背后有一道目光，像一根很轻的线，系在你的脚踝上。',
        { fx: [add('cult', 1), add('renown.sharp', 1)], values: ['jin'] }),
    ],
  }),

  node('mp4_fork', 'c4', 'main', '出涧的岔路', {
    lock: 'functional', canon: '原创', place: 'ravine', order: 30,
    cast: [{ id: 'ye' }, { id: 'tao' }], art: { scene: 'ravine_exit', layers: [{ id: 'fork' }, { id: 'sunrise' }] },
    intro: [
      '第三天清晨，雾终于散了。你们站在涧口，眼前是一条岔路：左边通向黄枫谷的山门，铃声隐约可闻；右边通向山外，路牌上画着一只飞鸟，旁边写着两个小字：「自便」。',
      '叶行舟站在右边的路口，笑吟吟地看着你：「我在谷外有一条路，缺一个识药的人。不是什么大买卖，但每一份，都是你自己的。」他顿了顿，「当然，你也可以回去。」',
      '左边，陶岑派来的杂役已经等在那里，手里捧着一块新做的外门木牌。',
    ],
    callbacks: [
      callback('e_path', '你想起雾涧第一夜绳子忽然绷紧的那一刻，想起自己当时做的那个决定。它此刻就跟在你身后，像一条看不见的影子。'),
      callback('e_route', '叶行舟说：「那条路，我们早就认识了。」'),
      callback('e_haggle', '「你和我谈过条款，」叶行舟笑道，「我知道你不会吃亏。」', F('flag.haggled')),
    ],
    choices: [
      choice('sect', 'dilemma', '回山门，领新的外门木牌，在谷里继续修炼。', '你从杂役手里接过木牌，指尖碰到木头上还没干的漆。山门口的铃声响了三下，像是在迎接一个终于回家的人。你知道，这条路稳，也狭，每一步都有人在看着。',
        { fx: [setv('track', 'sect'), add('valley', 1), add('cult', 1), rel('tao', 'trust', 1)], values: ['jin', 'xin'] }),
      choice('rogue', 'dilemma', '随叶行舟走右边的路，去谷外闯一闯。', '你们并肩走上右边的路。叶行舟哼起一支不成调的曲子，包里的铜钱叮叮作响。他回头看你，眼睛里有笑意：「放心，你会比在谷里自在。」你回头望了一眼山门，雾已经把它吞掉了。',
        { fx: [setv('track', 'rogue'), setv('flag.left_with_ye'), add('mark', -1), add('valley', -2), rel('ye', 'trust', 2), rel('ye', 'warmth', 1)], echo: ['e_route'], values: ['yong', 'li'] }),
      choice('both', 'strategy', '告诉叶行舟：「再给我三个月，我先把谷里的事了了。」', '叶行舟看了你很久，慢慢笑了：「有牵挂的人，走不远。可我不拦你。三个月后，我还在这里。」你转身走向左边，听见他在背后轻轻哼起那支曲子。',
        { fx: [setv('track', 'sect'), rel('ye', 'trust', 1), rel('ye', 'esteem', 1), add('valley', 1)], values: ['xin'] }),
    ],
  }),
];
