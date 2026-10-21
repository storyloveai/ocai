import { node, choice, callback, talk, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  // ---------------- 支线 ----------------
  node('mc2_stairs', 'c2', 'side', '梅兰街的楼梯', {
    canon: '原创', place: 'meilhan', cast: [{ id: 'louis' }], art: { scene: 'stairs', layers: [{ id: 'bread', choice: 'bread' }] },
    intro: [
      '梅兰街的楼梯很窄，每一级都被几十年的脚磨得发亮。老路易坐在顶层门口，把一张折过又展开的纸搁在膝上——那是爱德蒙上次寄回来的、一张写着「很快到家」的便条。',
      '他三天没有好好吃东西。邻居的饭菜被他原样推了回去，说：「等孩子回来一起吃。」',
      { text: '你注意到他的外套领子已经被他整理了一整天，仍然是歪的。', when: F('flag.held_mercedes') },
    ],
    callbacks: [callback('e_hand', '老路易抬头看你，慢慢地说：「那天晚上，是你扶住了我。」', F('flag.held_mercedes'))],
    choices: [
      choice('promise', 'dilemma', '蹲下来，对他说：「从今天起，每天我都来。他回来之前，您不会一个人吃饭。」', '老人的手抖了一下。他没有说话，只是慢慢把那张便条折好，放进外套内袋。「孩子，」他说，「我不好意思……」「您别说，」你说。从这天起，梅兰街的楼梯上多了一个每天傍晚来敲门的人。',
        { fx: [setv('flag.louis_cared'), rel('louis', 'warmth', 2), rel('louis', 'trust', 1), add('renown.reliable', 1)], debt: ['d_father'], echo: ['e_soup'], values: ['yi', 'cheng'] }),
      choice('bread', 'strategy', '放下面包和汤，替他把门掩上：「先吃一口，不用说话。」', '他在你转身下楼的时候，吃了半块面包。你在楼梯拐角站了很久，听见他一个人在屋里咳嗽，又咳嗽。',
        { fx: [add('money', -1), rel('louis', 'warmth', 1)], values: ['yi'] }),
      choice('court', 'strategy', '把法院贴出来的告示念给他听，并写下他想问的话。', '你一个字一个字地读，读到「国事嫌疑」时，他问：「什么叫嫌疑？」你说：「就是还没有证明。」他点点头，若有所思：「那就好。我儿子什么也没做，没有什么可证明的。」',
        { fx: [rel('louis', 'trust', 1), rel('louis', 'esteem', 1), add('renown.shrewd', 1)], values: ['zhi'] }),
    ],
  }),

  node('mc2_sea', 'c2', 'side', '加泰兰村的海堤', {
    canon: '原创', place: 'catalans', cast: [{ id: 'mercedes' }], art: { scene: 'seawall', layers: [{ id: 'if_light' }] },
    intro: [
      '梅尔塞苔丝每天傍晚都坐在海堤上，面朝港外。从这里望出去，能看见远处海面上一小块比夜更黑的影子——伊夫堡，那座关国事犯的石头城。',
      '她没有哭。她把婚纱的料子折了又折，放在膝头。费尔南站在她身后三步远，不说话，像一堵没有心的墙。',
    ],
    callbacks: [callback('e_orders', '你想起那一夜记下的方向。你知道他们往哪里去，而她不知道。', F('flag.noted_orders'))],
    choices: [
      choice('tell', 'dilemma', '告诉她：「我看见他们往老港走了，不是市政厅。」', '她猛地转过身。「你看见了？」「八个人，一位中尉，往老港。」她抓住你的手，那只手冷得像海水。「谢谢，」她说，「谢谢你，诺埃尔先生。」费尔南在她身后慢慢转过身去，看向另一边。',
        { when: F('flag.noted_orders'), fx: [rel('mercedes', 'trust', 2), rel('mercedes', 'esteem', 1), rel('fernand', 'trust', -1), setv('flag.mercedes_wait')], echo: ['e_mercedes'], values: ['cheng', 'yi'] }),
      choice('sit', 'expression', '在她旁边坐下，什么也不说，陪她看海。', '她坐了很久很久，直到天色全暗。「你不问我怕不怕？」她忽然说。「您会告诉我。」「我怕，」她说，「可我更怕我一动，他回来就找不到我。」',
        { fx: [rel('mercedes', 'warmth', 1), rel('mercedes', 'trust', 1), setv('flag.mercedes_wait')], echo: ['e_mercedes'], values: ['yi'] }),
      choice('fernand', 'strategy', '转向费尔南：「你要真想帮她，就别站在她身后。」', '费尔南的肩膀僵了僵。他走过来，在离她两步远的地方蹲下，一个字也没有说。梅尔塞苔丝没有回头。你看见他的手背在发抖，不知是愤怒还是愧疚。',
        { fx: [rel('fernand', 'trust', 1), rel('mercedes', 'esteem', 1), add('renown.shrewd', 1)], values: ['zhi'] }),
    ],
  }),

  node('mc2_cellar', 'c2', 'side', '卡德鲁斯的酒窖', {
    canon: '原创', place: 'meilhan', cast: [{ id: 'caderousse' }], art: { scene: 'cellar', layers: [{ id: 'bottle' }] },
    intro: [
      '卡德鲁斯的酒窖里有一股潮湿的橡木味。他一手握着瓶颈，一手掐着自己的膝盖，像是怕它们会抖得停不下来。',
      '「我……我什么都没写，」他对着空气说，「他们俩，一个写，一个拿，我、我就喝了点酒。」他忽然抬头看你，眼睛红得吓人，「小诺埃尔，你说我是不是……是不是……」',
    ],
    callbacks: [callback('e_silence', '他死死盯着你的脸：「那天晚上，你也在，对不对？」', F('flag.silent_arbour'))],
    choices: [
      choice('press', 'dilemma', '抓住这一刻：「你亲眼看见了。告诉莫雷尔先生，或者告诉我。」', '卡德鲁斯一下子清醒了。他拼命摇头：「不行，不行，他们会杀了我，我什么都没说……」他踉跄着把你推出门外。可你在关门前听见他喃喃地说：「是左手。是左手写的。」',
        { fx: [rel('caderousse', 'trust', -1), rel('caderousse', 'warmth', -1), add('renown.shrewd', 1), setv('flag.heard_plot')], echo: ['e_cellar'], values: ['cheng', 'zhi'] }),
      choice('comfort', 'expression', '递过去一杯水，等他自己说。', '他喝了一口，手稳了些。「我老了，」他说，「胆子比头发掉得还快。」他靠着墙，慢慢笑起来，笑得很难看。「你是个好孩子，诺埃尔。别学我。」',
        { fx: [rel('caderousse', 'warmth', 2), rel('caderousse', 'trust', 1)], values: ['yi'] }),
      choice('leave', 'strategy', '不说破，不安慰，只在他桌上放下一枚小钱：「买点吃的，别全喝了。」', '他看着那枚硬币，像是被它烫到了。你走出去很远，还听见他在后面喊：「我不要你的钱！」可他没有追出来。',
        { fx: [add('money', -1), rel('caderousse', 'warmth', 1)], values: ['li'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mc2_office', 'c2', 'main', '检察官的外厅', {
    lock: 'literal', canon: '原著第7章 · 改编', place: 'palais', order: 10,
    cast: [{ id: 'villefort' }, { id: 'morrel' }], art: { scene: 'office', layers: [{ id: 'fire' }, { id: 'letter' }, { id: 'pale', when: F('flag.saw_pale'), choice: 'watch' }] },
    intro: [
      '法院的外厅铺着黑白相间的石砖，每个人说话都压低了声音。莫雷尔先生把帽子放在膝上，指节紧扣，像在祈祷。你坐在他身边的长凳上，手里拿着一叠备好的货单和证明。',
      '书记官叫到了莫雷尔的名字。你跟到门口，被拦在了外面——门没有关严，留下一道一指宽的缝。',
      '缝里是一间生着炉火的办公室。年轻的副检察官维尔福坐在桌后，指尖夹着一封信。你看不见内容，只看见信封上的收信人：巴黎，诺瓦蒂埃。',
      '他读完，脸色在火光里一点一点褪成了纸的颜色。',
    ],
    callbacks: [
      callback('e_fetch', '莫雷尔的手搭在你肩上，很轻。「那天夜里，是你跑来叫醒我的。」他低声说，「我一直记着。」', F('flag.fetched_morrel')),
      callback('e_spoke_for', '书记官抬头看了你一眼，眼神里没有一丝意外：「又是你。那晚在拉雷塞尔，你替嫌犯作过保。」', F('flag.spoke_for')),
    ],
    choices: [
      choice('watch', 'strategy', '把门缝里的一切记下来：那封信，那只炉子，那张脸。', '维尔福把信翻过来，对着炉火停了一下，然后把它放进火里。火苗吞掉信纸时他没有看，而是看着自己的指尖。莫雷尔的声音在里面响起来，维尔福的回答温和、克制、完美无瑕：「事情比您想的严重得多。」你把这一切刻进脑子里。',
        { fx: [setv('flag.saw_pale'), add('renown.shrewd', 1)], echo: ['e_pale'], values: ['zhi'] }),
      choice('certificate', 'strategy', '趁莫雷尔出来之前，把品行证明交给书记官。', '书记官接过证明，看都没看就压在了一摞纸的最底下。「我会转交，」他说。可他的动作告诉你：这是一张永远不会被翻到的纸。莫雷尔出来时，你把证明的副本塞进他手里，他握着它，像握着一根并不存在的绳子。',
        { fx: [setv('flag.certificate'), rel('morrel', 'trust', 1), rel('morrel', 'esteem', 1), add('watch', 1)], echo: ['e_cert'], values: ['yi'] }),
      choice('tell_after', 'dilemma', '出门以后，低声对莫雷尔说你看见的东西。', '莫雷尔停下脚步，盯着你：「你说他烧了一封信？」「我看见火。」莫雷尔沉默了很久。「诺埃尔，」他终于说，「在法院里，看见和说出来，是两回事。」他的手在颤，却握住了你的肩膀。「谢谢你告诉我。从现在起，别再对任何人说。」',
        { fx: [setv('flag.saw_pale'), rel('morrel', 'trust', 2), rel('morrel', 'warmth', 1), add('renown.reliable', 1)], echo: ['e_pale'], values: ['cheng', 'yi'] }),
    ],
  }),

  node('mc2_night', 'c2', 'main', '夜里的账房', {
    lock: 'free', canon: '原创', place: 'counting', order: 20,
    art: { scene: 'counting', layers: [{ id: 'candle' }] }, cast: [{ id: 'morrel' }],
    intro: [
      '商行里的灯一盏一盏熄了，只剩账房的一盏。莫雷尔先生没有回家。他坐在高桌后，面前摊着一本没有写字的新账簿。',
      '「他们说，」他轻声说，「事情很严重，只有等。诺埃尔，我一辈子都在等船，等货，等钱。我从来不知道，等一个人，是这么难受。」',
    ],
    callbacks: [
      callback('e_draft', '你想起怀里那页底稿，它像一块烧红的炭，贴着肋骨。', F('flag.kept_draft')),
      callback('e_silence', '你想起拱棚下那个晚上，想起自己说过的每一个字——和没有说的每一个字。', F('flag.silent_arbour')),
    ],
    talk: talk('morrel', 3, [
      { id: 'again', label: '问他：还会再去见维尔福吗？', reply: '「去。」他说，「我会去到他厌烦为止。可我也知道，厌烦的人，从来不是被求的那一个，而是求的那一个。」他笑了，笑得很疲倦，「我会再去的。」', fx: [rel('morrel', 'trust', 1)] },
      { id: 'money', label: '提出把积蓄借给商行周转（需要积蓄 ≥ 3）。', req: V('money', '>=', 3), hint: '需要积蓄 3 以上', reply: '莫雷尔摇头：「我不能收你的钱。」你坚持了半个钟头，他终于翻开新账簿的第一页，写下「诺埃尔借款」几个字，亲手把借据递给你。「我会还，」他说，「连本带利。这是第一笔，我不会让它是最后一笔。」', fx: [add('money', -2), setv('flag.lent_morrel'), rel('morrel', 'warmth', 2), rel('morrel', 'trust', 1)], echo: ['e_lent'] },
      { id: 'truth', label: '告诉他拱棚下发生的事。', when: F('flag.heard_plot'), reply: [{ text: '莫雷尔听完，沉默了很久。「唐格拉尔，」他慢慢说，「我相信你的话，可我不能凭一句话把一个人拉出商行。」他看着你，「你有证据吗？」' }, { text: '「你为什么不早说？」他问，声音很轻，却让你抬不起头。', when: F('flag.silent_arbour') }, { text: '你把怀里的那页底稿放在桌上。莫雷尔盯着那几行歪斜的字，喉咙动了一下。「左手，」他说，「他用左手写的。」', when: F('flag.kept_draft') }], fx: [setv('flag.told_morrel'), rel('morrel', 'trust', 2), rel('morrel', 'esteem', 1)] },
      { id: 'why', label: '问他：您为什么这么在意爱德蒙？', reply: '「因为我年轻的时候，也有一个人这样帮过我。」莫雷尔看着灯，「他不是我的亲戚，也没有收我一分钱。他只是在我最难的时候，替我扛了一年。我这一生，只会做一件事：把那一年还给别人。」', fx: [rel('morrel', 'warmth', 1), rel('morrel', 'esteem', 1)] },
    ]),
    choices: [
      choice('leave', 'expression', '请他早点回去休息，自己守着最后一盏灯。', '莫雷尔摇摇头，拿起帽子。「你也别熬太晚。」他走到门口，又回过头：「诺埃尔，别让这件事把你变成别的人。」门关上后，你坐在高桌前，直到灯油烧尽。', {}),
    ],
  }),
];
