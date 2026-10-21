import { node, choice, callback, talk, ask, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

const onDanglars = ANY(IS('track', 'danglars'), F('flag.double_game'));

export const nodes = [
  // ---------------- 支线 ----------------
  node('mc6_julie', 'c6', 'side', '朱莉的账本', {
    canon: '原创', place: 'counting', cast: [{ id: 'julie' }], art: { scene: 'counting', layers: [{ id: 'candle' }, { id: 'ledger_open' }] },
    intro: [
      '朱莉在夜里把账本摊在饭桌上，丈夫埃马纽埃尔坐在她身边，两个人的影子叠在一起。孩子们都睡了，屋里只剩一盏灯和一本越写越短的账。',
      '「我算了三遍，」她说，声音很轻，「诺埃尔，请你告诉我，是我算错了。」',
    ],
    callbacks: [callback('e_lent', '她看着你，没有说话，只是把那张写着「诺埃尔借款」的借据压在了最上面，像在对你鞠躬。', F('flag.lent_morrel'))],
    choices: [
      choice('honest', 'dilemma', '一栏一栏对完，告诉她：「没有算错。九月五日，缺的数目是三十万。」', '朱莉点了点头，像一个早就知道答案的人。埃马纽埃尔握紧了她的手。「谢谢你，」她说，「我最怕的，就是有人对我说『会好的』。」你们沉默了很久，一起把那三十万写成了一个数字，写进了账本最后一页。',
        { fx: [rel('julie', 'trust', 2), rel('julie', 'esteem', 1), add('renown.reliable', 1)], values: ['cheng'] }),
      choice('soften', 'dilemma', '把数字说得轻一点：「也许还有转机，船会回来的。」', '她看了你很久，终于笑了一下：「你是为了我好。」她把账本合上。「可我宁愿你像对一个大人那样对我。」你想辩解，她已经站起来，去看孩子了。',
        { fx: [rel('julie', 'trust', -1), rel('julie', 'warmth', 1)], values: ['yi'] }),
      choice('house', 'strategy', '提议卖掉她们自己的住宅，作为最后的保证金。', '朱莉没有立刻回答，埃马纽埃尔先开了口：「我愿意。」她点了点头。「不是为了钱，」她说，「是为了让别人知道，莫雷尔家，还没有认输。」你把这个想法写成了一页方案，第二天交给了莫雷尔。他把它压在了最底下，没有说一句话。',
        { fx: [add('house', 1), rel('julie', 'esteem', 2), rel('morrel', 'warmth', -1), add('renown.shrewd', 1)], values: ['zhi', 'yi'] }),
    ],
  }),

  node('mc6_notes', 'c6', 'side', '那几张票据', {
    canon: '原创', place: 'counting', when: onDanglars, cast: [{ id: 'danglars' }], art: { scene: 'salon', layers: [{ id: 'chandelier' }, { id: 'folder' }] },
    intro: [
      '唐格拉尔的密信是用银行的信笺写的，一行字：「莫雷尔手里有四张我们的票据。到期日前一周，通知持票人，停止展期。」',
      '你把那封信读了三遍。你知道，只要你照着做，莫雷尔商行就再也没有一天缓冲。你也知道，你不照做，唐格拉尔的名单上就会多一行你的名字。',
    ],
    choices: [
      choice('obey', 'strategy', '按信上的指示办。', '你一份一份寄出了通知。回信来得很快，每一封都很客气，也每一封都带着一种你很熟悉的冷。唐格拉尔在下个月的信里写道：「干得漂亮。」你把那封信放进抽屉最深处，没有再读。',
        { fx: [rel('danglars', 'trust', 2), rel('danglars', 'esteem', 1), add('money', 2), rel('morrel', 'trust', -2), add('house', -1), add('renown.reliable', -1)], values: ['li'] }),
      choice('delay', 'strategy', '把通知拖一周，理由是「手续需要核对」。', '唐格拉尔对一周的延迟并不满意，但他的信里没有责备，只有一个冷冷的问号。你多出了一周，也多出了一个把柄。你不知道该庆幸还是担心。',
        { fx: [rel('danglars', 'trust', -1), add('house', 1), add('renown.reliable', 1)], values: ['zhi'] }),
      choice('warn', 'dilemma', '把信抄一份，悄悄交给莫雷尔先生。', '莫雷尔读完，把信放下，对着窗外看了很久。「诺埃尔，」他说，「你知道你做了什么吗？」「知道。」「谢谢，」他说，「这件事，我永远不会忘。」他把那封信折好，放进怀里，就像收起一块冰。',
        { fx: [setv('flag.double_game'), rel('morrel', 'trust', 3), rel('morrel', 'warmth', 2), rel('danglars', 'trust', -2), add('watch', 1), add('renown.reliable', 2)], echo: ['e_warn_morrel'], values: ['yi', 'cheng'] }),
    ],
  }),

  node('mc6_harbor', 'c6', 'side', '三条船的消息', {
    canon: '原创', place: 'quay', cast: [], art: { scene: 'quay', layers: [{ id: 'empty_berth' }, { id: 'storm_clouds' }] },
    intro: [
      '港口的小酒馆里坐着几个脸被风吹得发黑的水手，他们看见你进来，沉默了一下。「莫雷尔商行的？」其中一个问。他把酒杯推到你面前，「那条船，真的回不来了。」',
      '你知道他说的是哪一条。你也知道，这个消息如果送到莫雷尔先生桌上，会有什么后果。',
    ],
    choices: [
      choice('tell', 'dilemma', '立刻把消息带回商行。', '莫雷尔听完，一句话也没有说，只是从抽屉里拿出一本旧的航海日志，翻到最后几页，一页一页地盖上了「已失」的章。你站在旁边，看着他的手不停地抖，章却一次也没有盖歪。',
        { fx: [rel('morrel', 'trust', 1), add('renown.reliable', 1), add('house', -1)], values: ['cheng'] }),
      choice('wait', 'strategy', '先压几天，等莫雷尔先生精神好些再说。', '你在酒馆里坐到天黑。回到商行时，莫雷尔正在对账，笑着问你今天港口有什么新闻。你说：「没什么。」后来他得知消息时，什么也没问，只是在你的名字旁画了一个很小的记号。',
        { fx: [rel('morrel', 'trust', -1), add('renown.shrewd', 1)], values: ['zhi'] }),
      choice('seek', 'strategy', '多问几个水手：谁是最后一个见到那条船的人？', '你问了七个人，拼出了一条路线：那条船在好望角的航线上，遇到了一个没有记录的风暴。其中一个水手说：「有人说，一个英国商号买了那条船的保险。」你把这句话记了下来。',
        { fx: [add('renown.shrewd', 1), add('money', -1)], values: ['zhi'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mc6_englishman', 'c6', 'main', '汤姆森与弗伦奇行的人', {
    lock: 'functional', canon: '原著第29章 · 改编', place: 'counting', order: 10,
    cast: [{ id: 'wilmore' }, { id: 'morrel' }], art: { scene: 'counting', layers: [{ id: 'stranger' }, { id: 'ledger_open' }] },
    intro: [
      '那天上午，商行的玻璃门被推开，进来一个陌生人。四十岁上下，脸色苍白，深色旅行装，手里提着一只扁平的公文包。他向每一个人欠身，却没有一个人能看清他的眼睛。',
      '「汤姆森与弗伦奇行，」他说，口音里带着异国的腔调，「我受托持有贵行的全部票据。我想与贵行的账房谈谈。」',
      '莫雷尔先生看了你一眼，那意思是：由你来。',
    ],
    callbacks: [
      callback('e_file', '你想起袖口衬里上的那一页——它在那里藏了十三年，比你的任何一件外套都耐穿。', F('flag.knows_file')),
      callback('e_sold', '你想起那一万法郎，和你把纸推过桌子的那一刻。你忽然很想知道，这个英国人如果早一些来，你会怎么做。', F('flag.sold_draft')),
      callback('e_draft', '你忽然觉得怀里那页发黄的纸变重了，像是在等一个人开口。', F('flag.kept_draft')),
    ],
    ask: ask('wilmore', '「先生，我听说您是这家商行里最老的职员之一。请问，您认识一个叫爱德蒙·唐泰斯的人吗？」', [
      { id: 'warm', means: '承认认识，并带着情感说出他是什么样的人，或者说出自己为他做过什么', match: '认识|朋友|好人|正直|兄弟|最好的|他是|我替他|我为他',
        out: '英国人手里的笔停住了。他没有抬头，只是轻轻问：「他是什么样的人？」你说了很多，说到最后，发现自己的声音有些哑。他听得很认真，一个字也没有打断。「谢谢，」他最后说，「这对我很重要。」', fx: [rel('wilmore', 'esteem', 2), rel('wilmore', 'trust', 1), setv('flag.told_inspector')] },
      { id: 'guarded', means: '含糊其辞，说不熟、不记得，或者拒绝回答', match: '不太|不熟|不认识|忘了|不记得|不知道|没印象',
        out: '英国人在笔记本上写了一行字，没有抬头。「我明白了，」他说，声音里听不出一点情绪，「这件事，是十几年前的事了。」他翻过那页，你却觉得被什么人在一个很深的地方，记下了一笔。', fx: [rel('wilmore', 'esteem', -1)] },
      { id: 'blame', means: '直接指出是谁害了他，或指责某人告密', match: '唐格拉尔|费尔南|卡德鲁斯|告密|陷害|是他们|维尔福',
        out: '英国人慢慢抬起眼睛。那是你第一次看清他的目光——平静得近乎可怕。「您说得很具体，」他说，「您有证据吗？」你一时语塞。他点点头：「没有关系。我会自己去找。」', fx: [rel('wilmore', 'trust', 1), rel('wilmore', 'esteem', 1)] },
    ], 'guarded'),
    choices: [
      choice('delay', 'strategy', '替商行请求展期：「再给三个月。」', '英国人看了你一眼：「展期对贵行并无益处。到期日不动，这对双方都公平。」他的语气没有一点恶意，就像在说一条自然规律。你却在他停顿的那一秒里，隐约看到了某种你不敢细想的东西。',
        { fx: [rel('wilmore', 'trust', 1), add('renown.reliable', 1)], values: ['cheng'] }),
      choice('file', 'dilemma', '从袖口衬里取出那一页抄本，放在他面前。', '英国人的手指落在那张纸上，一动不动。他看了很久，久到商行里的钟走了一圈。「这是您自己抄的？」「十三年前。」他抬起头，眼睛里有一种你没见过的光，一闪而过。「先生，」他说，声音很轻，「您愿意把它留在我这里吗？」',
        { when: F('flag.knows_file'), fx: [setv('flag.gave_file'), rel('wilmore', 'esteem', 3), rel('wilmore', 'trust', 2)], echo: ['e_gave_proof'], values: ['cheng'] }),
      choice('draft', 'dilemma', '把那页发黄的底稿推到他面前。', '英国人读完，一言不发。他把纸折好，放进公文包最里面的夹层。「谢谢您，」他说，「您保存了它这么多年。」他看了你一眼，那一眼里，似乎有一个人对着一面很远的镜子点头。',
        { when: ALL(F('flag.kept_draft'), NF('flag.sold_draft')), fx: [setv('flag.gave_draft'), rel('wilmore', 'esteem', 3), rel('wilmore', 'trust', 2), add('renown.reliable', 1)], echo: ['e_gave_proof'], values: ['cheng', 'yi'] }),
      choice('sell', 'strategy', '把唐格拉尔手里的那几张票据转给他。', '英国人几乎没有讨价还价，数完钱，把票据收进了包里。「谢谢您的合作。」他的语气一点没变，你却觉得，自己刚刚做了一件无法收回的事。莫雷尔先生后来知道了，没有责备，只是一连几天没有看你。',
        { when: onDanglars, fx: [setv('flag.sold_notes'), add('money', 3), rel('danglars', 'trust', 2), rel('morrel', 'trust', -3), rel('wilmore', 'esteem', -1)], echo: ['e_sold_notes'], values: ['li'] }),
      choice('listen', 'expression', '不再多说，听他把话说完。', '英国人说完了所有的条件：九月五日，上午十一点，一分不少。他起身，向莫雷尔先生欠身：「到时候，我会准时到。」他走到门口，停了一下，没有回头：「先生，您的账房，是个很特别的人。」',
        { fx: [rel('wilmore', 'esteem', 1)], values: ['zhi'] }),
    ],
  }),

  node('mc6_dark', 'c6', 'main', '最后一个夏天', {
    lock: 'free', canon: '原创', place: 'counting', order: 20,
    cast: [{ id: 'morrel' }], art: { scene: 'counting', layers: [{ id: 'candle' }, { id: 'drawer' }] },
    intro: [
      '夏天一点一点过去了。莫雷尔先生不再说「会好的」，也不再说「再等等」。他每晚在商行里待到很晚，一个人坐在高桌后，对着一本空账簿，一页一页地翻过去。',
      '那天夜里，你看见他把一个窄长的木匣放进了书桌最下面的抽屉，锁上，把钥匙放进了衬衣口袋。他以为你没有看见。',
    ],
    callbacks: [callback('e_lent', '你想起你借给他的那些钱。他每一次路过你身边，都会不自觉地摸摸胸前的口袋，那里放着你写的借据。', F('flag.lent_morrel'))],
    talk: talk('morrel', 3, [
      { id: 'sleep', label: '劝他回家休息：「今晚的账，我替您守。」', reply: '「回家？」莫雷尔笑了笑，「我已经很久没有睡过一个整觉了。可是你说得对，诺埃尔，该有人去看看孩子们。」他拿起帽子，走到门口，又回过头，「你……别也熬坏了。」', fx: [rel('morrel', 'warmth', 1)] },
      { id: 'children', label: '问他：朱莉和埃马纽埃尔，他们知道了多少？', reply: '「全部，」莫雷尔说，「朱莉比我先知道。她把所有的账都重新算了一遍，然后回来对我说：『父亲，我们会一起面对。』」他的声音哑了，「我这一辈子，只给过孩子们一个教训：人要守信。现在我才知道，这个教训，也会杀人。」', fx: [rel('morrel', 'trust', 1), rel('morrel', 'warmth', 1)] },
      { id: 'drawer', label: '看着那只抽屉：「先生，您锁起来的是什么？」', req: AT('morrel', 'trust', 2), hint: '需要莫雷尔对你「可托」以上的信任', reply: '莫雷尔沉默了很久。「你看见了。」他摸着胸口的钥匙，「诺埃尔，如果九月五日上午十一点，我付不出那笔钱，我不会让这个名字被人踩在泥里。」他看着你，眼神平静得吓人，「你不要劝我。你只需要……记住我今晚告诉过你。」', fx: [setv('flag.knows_pistol'), rel('morrel', 'trust', 2), rel('morrel', 'warmth', 1)], echo: ['e_pistol'] },
      { id: 'ledger', label: '提议重新整理一遍账目：「也许还能找出一条路。」', reply: '你们花了三个晚上，一页一页重核。你找出了两笔被遗漏的应收款，加起来不过几千法郎。莫雷尔看着那个数字，笑了：「一滴水。」他拍拍你的肩，「可是谢谢你，让我看见水还是水。」', fx: [add('house', 1), rel('morrel', 'esteem', 1), add('renown.shrewd', 1)] },
    ]),
    choices: [
      choice('leave', 'expression', '把灯芯剪短，替他关上最后一扇窗。', '你走出商行时，看见街对面一个人影站在路灯下，很快就消失在拐角。你不知道那是谁，只记得他站的姿势，像在记下什么。', {}),
    ],
  }),
];
