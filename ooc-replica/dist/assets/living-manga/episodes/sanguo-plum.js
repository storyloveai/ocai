// Adapted from server/sanguo-campaign.json: c1_plum, c1_guanyu, c1_dongcheng.
// Repeated panels and labels are shared data. The exported object round-trips through JSON.
const cao = { zh: '曹操', en: 'Cao Cao' };
const liu = { zh: '刘备', en: 'Liu Bei' };
const guan = { zh: '关羽', en: 'Guan Yu' };
const player = {
  type: 'player-bubble', position: 'top-left', style: 'speech', z: 1.15,
  speaker: { zh: '你', en: 'You' },
};

const lampEnding = {
  scene: 'lamp', heightClass: 'ending', fx: [],
  overlays: [
    { type: 'loc', z: 0.5, position: 'top-left', style: 'caption', text: { zh: '当夜 · 偏院', en: 'That night · Side courtyard' } },
    {
      type: 'narration', z: 0.7, position: 'bottom-right', style: 'caption',
      text: {
        zh: '关羽窗前还亮着灯。你推门进去，他手里的《春秋》始终没有放下。',
        en: 'A lamp burns in Guan Yu’s window. You step inside. He keeps his place in the Spring and Autumn Annals.',
      },
    },
  ],
};

const letterEnding = {
  scene: 'letter', heightClass: 'ending', fx: [],
  overlays: [
    { type: 'loc', z: 0.5, position: 'top-left', style: 'caption', text: { zh: '三日后 · 深夜', en: 'Three nights later' } },
    {
      type: 'narration', z: 0.7, position: 'bottom-right', style: 'caption',
      text: {
        zh: '董承屏退左右，从衣带里抽出一幅血书。他看向你，问刘备：「此人可信否？」',
        en: 'Dong Cheng sends the servants out and unfolds the blood-written edict. He looks at you. “Can this one be trusted?”',
      },
    },
  ],
};

export default {
  id: 'sanguo-plum',
  title: { zh: '煮酒论英雄', en: 'Heroes over Plum Wine' },
  subtitle: { zh: '三国演义 · 第二十一回', en: 'Romance of the Three Kingdoms · Chapter 21' },
  theme: 'color',
  assets: {
    garden: {
      alt: { zh: '梅枝斜过池塘，亭中刘备向曹操举杯。你背立在两人身后。', en: 'Beyond a plum branch and pond, Liu Bei raises his cup to Cao Cao. You stand with your back to us.' },
      image: '/assets/sanguo-art/scenes/garden.webp', depth: '/assets/living-manga/depth/garden_depth.webp',
      crop: [0.25, 0, 0.75, 1], strength: 0.04,
    },
    thunderCao: {
      alt: { zh: '曹操持杯侧过脸来，背后窗棂间一道闪电。', en: 'Cao Cao turns, wine cup in hand. Lightning forks beyond the lattice at his back.' },
      image: '/assets/sanguo-art/cg/thunder.webp', depth: '/assets/living-manga/depth/thunder_depth.webp',
      crop: [0.50, 0, 0.49, 0.83], strength: 0.04,
    },
    thunder: {
      alt: { zh: '刘备惊回头，案上匙箸倾斜，酒水溅起。对座的曹操仍端着杯。', en: 'Liu Bei turns in alarm. The chopsticks slip and wine splashes. Across the table, Cao Cao still holds his cup.' },
      image: '/assets/sanguo-art/cg/thunder.webp', depth: '/assets/living-manga/depth/thunder_depth.webp',
      crop: [0, 0, 1, 1], strength: 0.078,
    },
    feast: {
      alt: { zh: '酒案前，灰袍门客背对灯火，曹操隔案望着他。', en: 'Beyond the scholar in grey, Cao Cao watches from the far side of the wine table.' },
      image: '/assets/sanguo-art/scenes/v2_cao_feast.webp', depth: '/assets/living-manga/depth/feast_depth.webp',
      crop: [0.35, 0, 0.55, 0.43], strength: 0.04,
    },
    lamp: {
      alt: { zh: '关羽在灯下读书，纸窗上映着竹影。', en: 'Guan Yu reads by lamplight. Bamboo casts shadows across the paper windows.' },
      image: '/assets/sanguo-art/scenes/lamp.webp', depth: '/assets/living-manga/depth/lamp_depth.webp',
      crop: [0, 0, 1, 1], strength: 0.045,
    },
    letter: {
      alt: { zh: '烛火照着案上信纸，一人执笔低头，窗外河面映着月色。', en: 'A man bends over a letter, brush in hand. Beyond the candle a moonlit river fills the window.' },
      image: '/assets/sanguo-art/scenes/letter.webp', depth: '/assets/living-manga/depth/letter_depth.webp',
      crop: [0, 0, 1, 1], strength: 0.045,
    },
  },
  openingRows: [
    {
      layout: 'cols-1',
      panels: [{
        scene: 'garden', heightClass: 'wide', fx: ['rain'],
        overlays: [
          { type: 'loc', z: 0.5, position: 'top-left', style: 'caption', text: { zh: '许都 · 曹府后园', en: 'Xuchang · Cao Cao’s garden' } },
          {
            type: 'narration', z: 0.75, position: 'bottom-left', style: 'caption',
            text: {
              zh: '梅子还青，酒已煮好。刘备赴席，只带了你。几巡酒过，雨压城头，曹操放下杯子。',
              en: 'Green plums, warm wine. Liu Bei brings only you to the table. As rain gathers over the city, Cao Cao sets down his cup.',
            },
          },
        ],
      }],
    },
    {
      layout: 'cols-2-asym',
      panels: [
        {
          scene: 'thunderCao', heightClass: 'close', fx: [],
          overlays: [{
            type: 'bubble', speaker: cao, z: 1, position: 'bottom-left', style: 'speech',
            text: { zh: '今天下英雄，惟使君与操耳。', en: 'Only two men in the realm deserve the name of hero. You, my lord, and I.' },
          }],
        },
        {
          scene: 'thunder', heightClass: 'close', fx: ['lightning'],
          overlays: [{
            type: 'sfx', z: 1.3, position: 'top-right', style: 'impact',
            text: { zh: '轰——！！', en: 'KRAK!!' },
          }, {
            type: 'narration', z: 0.7, position: 'bottom-left', style: 'caption',
            text: { zh: '一声雷。刘备手中匙箸落地，酒溅上案。', en: 'Thunder. Liu Bei drops his chopsticks. Wine spatters the table.' },
          }],
        },
      ],
    },
  ],
  decision: {
    prompt: { zh: '下一格由你决定', en: 'The next panel is yours' },
    options: [
      {
        id: 'cover', branchId: 'cover',
        label: { zh: '趁雷声打翻自己的酒樽', en: 'Knock over your cup as the thunder breaks' },
        playerText: { zh: '丞相恕罪！是我打翻了酒樽。', en: 'Forgive me, Chancellor! It was my cup.' },
      },
      {
        id: 'speak', branchId: 'speak',
        label: { zh: '接过话头评点天下英雄', en: 'Give your own verdict on the heroes' },
        playerText: { zh: '袁绍、刘表、孙策……容我逐一说来。', en: 'Yuan Shao, Liu Biao, Sun Ce… Allow me to take them in turn.' },
      },
      {
        id: 'still', branchId: 'still',
        label: { zh: '低头不动，静观其变', en: 'Lower your eyes and wait' },
        playerText: { zh: '（低下头，一言不发。）', en: '(I lower my eyes and say nothing.)' },
      },
    ],
    freeInput: {
      placeholder: { zh: '雷声未歇，你想说什么？', en: 'What do you say while the thunder lasts?' },
      maxLength: 180,
      // Match intent in either language, independent of the reader's interface language.
      rules: [
        {
          branchId: 'warn_liu',
          pattern: '快走|快逃|速走|赶紧走|离开许(都|昌)|早[点些日]?(走|离开)|出城|小心曹操|曹操[要想]杀你|\\b(leave|flee|escape) (from )?(xuchang|xudu|the city|the capital)\\b|\\b(get out|leave now|go now|be careful of cao)\\b',
          unless: '别(急着|再)?(走|离开|出城)|不(能|必|要|可)(走|离开|出城)|\\b(don.t|do not|never) (leave|go|get out|flee|escape)\\b',
        },
        {
          branchId: 'hero_liu',
          pattern: '(刘备|刘使君|刘皇叔|玄德|主公|使君).{0,8}英雄|英雄.{0,8}(刘备|刘使君|刘皇叔|玄德)|\\b(liu bei|lord liu|xuande|my lord)\\b.{0,24}\\bhero\\b|\\bhero (is|here is) (liu bei|lord liu|xuande)\\b',
          unless: '(不是|并非|算不得|不算).{0,3}英雄|\\b(not|never|isn.t|no)\\b.{0,12}\\bhero\\b',
        },
        {
          branchId: 'challenge',
          pattern: '(何必|为何|何苦|休再|何须|莫再|别再).{0,5}(试探|相试|探问)|试探.{0,6}(主公|玄德|刘备)|\\b(why|must you|stop|no need to)\\b.{0,32}\\b(test|testing|probe|probing|bait|baiting)\\b',
        },
      ],
      fallbackBranchId: 'custom',
    },
  },
  branches: {
    cover: {
      reactionPanels: [{
        scene: 'feast', heightClass: 'wide', fx: [],
        overlays: [player, {
          type: 'narration', z: 0.75, position: 'bottom-right', style: 'caption',
          text: {
            zh: '酒樽还在滚，刘备已趁势俯身拾箸。曹操放声大笑，目光却在你身上停了一停。',
            en: 'Your cup rolls away. Liu Bei bends for his chopsticks. Cao Cao laughs. His eyes linger on you.',
          },
        }],
      }, lampEnding],
      consequenceTags: [{ zh: '刘备领情', en: 'Liu Bei owes you a kindness' }, { zh: '曹操留意', en: 'Cao Cao notices you' }],
      interlude: [
        { characterId: 'sgc-002', label: cao, draft: { zh: '丞相，我打翻酒樽时您笑了。那一眼，是已经看穿我了吗？', en: 'Chancellor, you laughed when I upset my cup. Had you already seen through me?' } },
        { characterId: 'sgc-003', label: guan, draft: { zh: '云长，今天在梅园，我拿一樽酒替主公遮了失态。丞相看了我一眼，你说他看出了多少？', en: 'Yunchang, I spilled my wine to cover your brother’s alarm. How much do you think Cao Cao saw?' } },
      ],
    },
    speak: {
      reactionPanels: [{
        scene: 'feast', heightClass: 'wide', fx: [],
        overlays: [player, {
          type: 'narration', z: 0.75, position: 'bottom-right', style: 'caption',
          text: {
            zh: '你一句比一句狠。曹操拍案：「此子何人？」刘备替你告罪。归途上，他一言未发。',
            en: 'Each verdict cuts deeper. Cao Cao slaps the table. “Who is this?” Liu Bei apologizes for you. He is silent all the way home.',
          },
        }],
      }, letterEnding],
      consequenceTags: [{ zh: '曹操赏才', en: 'Cao Cao respects your wit' }, { zh: '刘备疏心', en: 'Liu Bei trusts you less' }],
      interlude: [
        { characterId: 'sgc-002', label: cao, draft: { zh: '丞相，今日我评袁绍、刘表、孙策，您拍案问我是谁。您记住了哪一句？', en: 'When I judged Yuan Shao, Liu Biao and Sun Ce, you struck the table and asked who I was. Which verdict stayed with you?' } },
        { characterId: 'sgc-003', label: guan, draft: { zh: '云长，今天我抢着说了几句英雄，主公却替我告罪，回程一句话也没说。我该怎么开这个口？', en: 'Yunchang, your brother apologized for my talk of heroes and said nothing on the way home. How do I speak to him now?' } },
      ],
    },
    still: {
      reactionPanels: [{
        scene: 'garden', heightClass: 'wide', fx: ['rain'],
        overlays: [player, {
          type: 'narration', z: 0.75, position: 'bottom-left', style: 'caption',
          text: {
            zh: '刘备俯身拾箸：「一震之威，乃至于此。」曹操笑问：「丈夫亦畏雷乎？」席上无人看你。',
            en: 'Liu Bei stoops. “One clap of thunder, and look at me.” Cao laughs. “A grown man, afraid of thunder?” No one looks your way.',
          },
        }],
      }, lampEnding],
      consequenceTags: [{ zh: '未引人注目', en: 'You escape notice' }],
      interlude: [
        { characterId: 'sgc-001', label: liu, draft: { zh: '主公，丞相笑问您是否畏雷时，我一直低着头。那一刻，您盼我开口吗？', en: 'My lord, I kept my eyes down when Cao Cao asked if you feared thunder. Did you want me to say something?' } },
        { characterId: 'sgc-003', label: guan, draft: { zh: '云长，今日席上主公落了箸，我没有动。你跟了他那么久，怎么知道他什么时候要人帮一把？', en: 'Yunchang, I held still when your brother dropped his chopsticks. How do you know when he wants a hand?' } },
      ],
    },
    warn_liu: {
      reactionPanels: [{
        scene: 'garden', heightClass: 'wide', fx: ['rain'],
        overlays: [player, {
          type: 'narration', z: 0.75, position: 'bottom-left', style: 'caption',
          text: {
            zh: '刘备在案下按住你的手，仍笑着给曹操斟酒。曹操的目光在你们两人之间转了一圈。',
            en: 'Beneath the table, Liu Bei presses your hand. He keeps smiling as he pours. Cao Cao’s eyes travel from him to you.',
          },
        }],
      }, letterEnding],
      consequenceTags: [{ zh: '刘备会意', en: 'Liu Bei takes your warning' }, { zh: '曹操起疑', en: 'Cao Cao grows suspicious' }],
      interlude: [
        { characterId: 'sgc-001', label: liu, draft: { zh: '主公，席间我劝您早走，您按住我的手。是叫我再等等，还是曹操已在看我们？', en: 'My lord, you pressed my hand when I urged you to leave. Did you mean to wait, or was Cao Cao already watching?' } },
        { characterId: 'sgc-003', label: guan, draft: { zh: '云长，今日我悄声劝主公离开许都，曹操还是往我们这里看了一眼。你可知道主公的打算？', en: 'Yunchang, I warned your brother to leave Xuchang. Cao Cao looked straight at us. Do you know what your brother intends?' } },
      ],
    },
    hero_liu: {
      reactionPanels: [{
        scene: 'garden', heightClass: 'wide', fx: [],
        overlays: [player, {
          type: 'narration', z: 0.75, position: 'bottom-left', style: 'caption',
          text: {
            zh: '曹操拊掌：「子衡与孤，所见略同。」酒斟满了，他还盯着刘备的脸。案下，刘备踩了你一脚。',
            en: 'Cao Cao claps. “Ziheng and I see alike.” He fills Liu Bei’s cup, eyes fixed on his face. Under the table, Liu Bei steps on your foot.',
          },
        }],
      }, lampEnding],
      consequenceTags: [{ zh: '曹操生疑', en: 'Cao Cao is wary' }, { zh: '刘备见怪', en: 'Liu Bei resents your candor' }],
      interlude: [
        { characterId: 'sgc-001', label: liu, draft: { zh: '主公，我说您是真英雄，您就在桌下踩了我一脚。我是不是把您最想藏住的事说破了？', en: 'My lord, you stepped on my foot when I called you a hero. Did I say aloud the one thing you most needed hidden?' } },
        { characterId: 'sgc-002', label: cao, draft: { zh: '丞相，我说刘使君是英雄，您便给他斟酒。那时您在他脸上找什么？', en: 'Chancellor, when I named Liu Bei a hero, you filled his cup. What were you looking for in his face?' } },
      ],
    },
    challenge: {
      // An open challenge takes the cold response from c1_plum.ask.answers.rude.
      reactionPanels: [{
        scene: 'feast', heightClass: 'wide', fx: [],
        overlays: [player, {
          type: 'narration', z: 0.75, position: 'bottom-right', style: 'caption',
          text: { zh: '席上静了一瞬。曹操盯着你：「你再说一遍？」', en: 'The table falls silent. Cao Cao fixes his eyes on you. “Say that again?”' },
        }],
      }, letterEnding],
      consequenceTags: [{ zh: '曹操动怒', en: 'Cao Cao bristles' }, { zh: '出言冒进', en: 'A rash word' }],
      interlude: [
        { characterId: 'sgc-002', label: cao, draft: { zh: '丞相，我问您何必试探，您叫我再说一遍。若此间只有你我，您还肯听我往下说吗？', en: 'Chancellor, when I questioned your test you asked me to say it again. With only the two of us here, will you hear me out?' } },
        { characterId: 'sgc-001', label: liu, draft: { zh: '主公，今日我问破了曹操的试探，他叫我再说一遍。那时我该怎样把话收回来？', en: 'My lord, I challenged Cao Cao and he asked me to repeat myself. What could I have said to mend things?' } },
      ],
    },
    custom: {
      // For an unrecognized line, use Cao Cao's neutral c1_plum.ask fallback.
      reactionPanels: [{
        scene: 'garden', heightClass: 'wide', fx: [],
        overlays: [player, {
          type: 'narration', z: 0.75, position: 'bottom-left', style: 'caption',
          text: { zh: '曹操也不勉强：「书生谨慎。」他转回头，接着说他自己的。', en: 'Cao Cao lets it pass. “A cautious scholar.” He turns away and carries on naming men who might be heroes.' },
        }],
      }, lampEnding],
      consequenceTags: [{ zh: '曹操未再追问', en: 'Cao Cao lets the matter rest' }],
      interlude: [
        { characterId: 'sgc-002', label: cao, draft: { zh: '丞相，席间我说「{playerText}」，您只回了句「书生谨慎」。我想听您把后半句也说完。', en: 'Chancellor, at the table I said, “{playerText}” You called me a cautious scholar. What did you leave unsaid?' } },
        { characterId: 'sgc-003', label: guan, draft: { zh: '云长，今天在梅园，我对曹操说了「{playerText}」。你听听，我说得妥当吗？', en: 'Yunchang, I said this to Cao Cao in the garden. “{playerText}” Would you have spoken differently?' } },
      ],
    },
  },
};
