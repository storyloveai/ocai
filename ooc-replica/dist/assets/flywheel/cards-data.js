// 飞轮体验版 · 统一角色卡索引（只读数据层）
// 任务 #154。所有内容摘自仓库现有文件，不新增设定：
//   汐川: game/xichuan/content/story.py（人设中英原文）
//   灰烬王冠: game/ashen/content/story.py + game/ashen/docs/设定集.md
//   贝克街: game/holmes/content/story.py + game/holmes/docs/设计方案.md
//   三国/原创: ooc-replica/dist/assets/sanguo-characters.js / original-characters.js（原字段搬运）
//   例句: 各作品 content/campaign.json 的 say 节点原文（生成文件，出处=原剧本）
// 立绘路径全部指向站点现有静态资源，不复制图片。

export const WORKS = {
  sanguo: {
    id: "sanguo",
    title: { zh: "三国·谋士", en: "The Strategist" },
    kind: { zh: "互动小说 · 八卷完结", en: "Interactive novel · 8 volumes" },
    url: "/play/three-kingdoms",
    cover: "/assets/sanguo-art/portraits/caocao.webp",
  },
  xichuan: {
    id: "xichuan",
    title: { zh: "汐川的第七个春天", en: "The Seventh Spring of Xichuan" },
    kind: { zh: "galgame · 全本", en: "Galgame · full story" },
    url: "/assets/xichuan/index.html",
    cover: "/assets/xichuan/art/cg/cg_stage.webp",
  },
  ashen: {
    id: "ashen",
    title: { zh: "灰烬王冠", en: "The Ashen Crown" },
    kind: { zh: "小说 + galgame · 卷一《灯火》", en: "Novel + galgame · Vol.1 Lights" },
    url: "/assets/ashen/index.html",
    cover: "/assets/ashen-cover.webp",
  },
  holmes: {
    id: "holmes",
    title: { zh: "贝克街", en: "Baker Street" },
    kind: { zh: "侦探 galgame（WebGAL）· 卷一试样", en: "Detective galgame (WebGAL) · Vol.1" },
    url: "/assets/holmes-webgal/index.html",
    cover: "/assets/holmes-cover.webp",
  },
  books: {
    id: "books",
    title: { zh: "名著互动", en: "Classics Interactive" },
    kind: { zh: "凡人修仙传 · 基督山伯爵", en: "Mortal Path · Monte Cristo" },
    url: "/play/mortal-path",
    cover: null,
  },
  character: {
    id: "character",
    title: { zh: "角色页原创相遇", en: "Character Originals" },
    kind: { zh: "角色聊天", en: "Character chat" },
    url: "/character",
    cover: "/assets/characters/shen-yanzhou.webp",
  },
};

export const UNIVERSES = {
  xichuan: {
    id: "xichuan",
    name: { zh: "汐川", en: "Xichuan" },
    tagline: { zh: "海边小城，一座要拆的露天影院，和一个约定的春天。", en: "A seaside town, an open-air cinema awaiting demolition, and a promised spring." },
    // 摘自 game/xichuan/content/story.py 序章与人物设定
    rules: {
      world: {
        zh: "三月，陆远沿着海岸线回到汐川：祖父的潮声影院五月拆除，老房子和院子里的枇杷树还在。三位女主的“第七件事”，都系在这最后一个春天里。",
        en: "In March, Lu Yuan returns along the coast: his grandfather's Tidesound Cinema comes down in May, the old house and the loquat tree remain. Each heroine's 'seventh thing' is tied to this last spring.",
      },
      magic: [
        { zh: "共通线走向个人线：夏知遥的第七件事、沈澄的第七封信、季白的第七卷。", en: "A common route branches into three: Zhiyao's seventh thing, Shen Cheng's seventh letter, Ji Bai's seventh reel." },
        { zh: "好感隐藏：角色不说破，行动才算数；说错话会被记住。", en: "Affection stays hidden; actions count, wrong words are remembered." },
        { zh: "7 个结局、39 个场景；决裂与记仇由规则计算，AI 只演。", en: "7 endings across 39 scenes; falling-out and grudges are computed, the AI only acts." },
      ],
      places: [
        { name: { zh: "潮声影院", en: "The Tidesound Cinema" }, desc: { zh: "白银幕背对着海的露天影院，季白的放映室在这里。", en: "The open-air cinema, screen turned to the sea; Ji Bai's booth." } },
        { name: { zh: "老房子与枇杷树", en: "The Old House & the Loquat Tree" }, desc: { zh: "祖父留下的房子，门锁锈了，树比记忆里高。", en: "The inherited house; the lock rusted, the tree taller than memory." } },
        { name: { zh: "海边的咖啡馆", en: "The Seaside Café" }, desc: { zh: "沈澄家里开的店，小时候那杯还在单子上。", en: "Shen Cheng's family café; the childhood order is still on the menu." } },
        { name: { zh: "汐川站", en: "Xichuan Station" }, desc: { zh: "只有一个站台，风里有咸味。", en: "One platform; the wind tastes of salt." } },
      ],
      timeline: [
        { t: { zh: "三月 · 返乡", en: "March · Coming Back" }, d: { zh: "列车沿着海岸线往南开；律师的信与老周的邀约。", en: "The train south; the lawyer's letter and Old Zhou's note." } },
        { t: { zh: "序章 · 影院初遇", en: "Prologue · First Meeting" }, d: { zh: "“你是来拆它的，还是来救它的？”", en: "\"Are you here to tear it down, or to save it?\"" } },
        { t: { zh: "春季放映会", en: "The Spring Screenings" }, d: { zh: "最后一季，每周六晚七点，免费入场。", en: "The final season: Saturdays, seven p.m., free admission." } },
        { t: { zh: "五月 · 最后一场", en: "May · The Last Screening" }, d: { zh: "影院拆除前的最后一个春天，也是告别。", en: "The last spring before the demolition — and the farewell." } },
      ],
    },
  },
  sanguo: {
    id: "sanguo",
    name: { zh: "三国", en: "Three Kingdoms" },
    tagline: { zh: "许都到赤壁。你以谋士的身份，走进这段历史。", en: "From Xudu to Chibi. You walk into this history as a strategist." },
    // 摘自 game/sanguo/README.md（时间跨度、名场面节点）与八卷卷名
    rules: {
      world: {
        zh: "玩家扮演原创谋士子衡，时间跨度是许都到赤壁（原著第 20–50 回）。煮酒论英雄、土山约三事、三顾茅庐、长坂坡、华容道，都是玩家可以插手的节点；玩家不扮演其中的主角。",
        en: "You play Ziheng, an original strategist, from Xudu to Chibi (chapters 20–50 of the original). Moments like the wine-tasting hero debate, the three visits to the thatched cottage, Changban and Huarong Trail are nodes you can step into — you never play the heroes themselves.",
      },
      magic: [
        { zh: "前面的选择通过事件账本、回响、叙事债务一路影响到结局。", en: "Earlier choices reach the ending through the event ledger, echoes and narrative debts." },
        { zh: "关系三轴加五档门槛：说话的走向由关系与处境决定。", en: "Three relationship axes with five thresholds: how a line lands depends on standing." },
        { zh: "每卷上线前跑 5,000 局随机玩家模拟，零阻塞才放行。", en: "Each volume passes 5,000 simulated playthroughs before release." },
      ],
      places: [
        { name: { zh: "许都", en: "Xudu" }, desc: { zh: "起点。酒后灯下，煮酒论英雄。", en: "Where it begins, over warm wine and a hero debate." } },
        { name: { zh: "荆州", en: "Jingzhou" }, desc: { zh: "卷四《荆州之殇》：关羽能救，荆州必丢。", en: "Vol.4 The Fall of Jingzhou: Guan Yu can be saved; the province cannot." } },
        { name: { zh: "夷陵与白帝", en: "Yiling & Baidi" }, desc: { zh: "卷五：东征劝不住，代价可改。", en: "Vol.5: the eastern campaign cannot be stopped, but its price can change." } },
        { name: { zh: "南中", en: "Nanzhong" }, desc: { zh: "卷六《南中》。", en: "Vol.6." } },
        { name: { zh: "出师与归晋", en: "The Northern Campaign & the Return" }, desc: { zh: "卷七《出师》到卷八《归晋》，全书收束。", en: "Vol.7 The Northern Campaign through Vol.8 The Return of Jin." } },
      ],
      factions: [
        { name: { zh: "曹魏", en: "Cao Wei" }, desc: { zh: "曹操帐下。爱才与多疑并行。", en: "Cao Cao's court: talent loved and suspected in the same breath." } },
        { name: { zh: "蜀汉", en: "Shu Han" }, desc: { zh: "刘备、诸葛亮、关羽、赵云。仁义与隐忍。", en: "Liu Bei, Zhuge Liang, Guan Yu, Zhao Yun: mercy and endurance." } },
        { name: { zh: "东吴", en: "Eastern Wu" }, desc: { zh: "周瑜、貂蝉走过的宫廷。", en: "Zhou Yu's river courts — and the corridors Diaochan walks." } },
      ],
      timeline: [
        { t: { zh: "卷一 · 煮酒论英雄", en: "Vol.1 · Heroes over Wine" }, d: { zh: "新玩家从煮酒论英雄直接进戏。", en: "New players start straight at the hero debate." } },
        { t: { zh: "卷四 · 荆州之殇", en: "Vol.4 · The Fall of Jingzhou" }, d: { zh: "关羽能救，荆州必丢。", en: "Guan Yu can be saved; the province cannot." } },
        { t: { zh: "卷五 · 夷陵与白帝", en: "Vol.5 · Yiling & Baidi" }, d: { zh: "信任到心腹，受托孤。", en: "Reach confidant standing and receive the dying charge." } },
        { t: { zh: "卷八 · 归晋", en: "Vol.8 · The Return of Jin" }, d: { zh: "第三章起玩家换成接班人，全书尾声“这一生”。", en: "From chapter 3 you play the successor; the book closes with \"This Life\"." } },
      ],
    },
  },
  westlin: {
    id: "westlin",
    name: { zh: "维斯特林", en: "Westlin" },
    tagline: { zh: "十二件遗器沉睡在现代港城地下。借一次全力，付一段记忆。", en: "Twelve relics sleep beneath a modern harbour city. Go all-out, pay a memory." },
    // 规则条目摘自 game/ashen/docs/设定集.md
    rules: {
      world: {
        zh: "维斯特林：北海边的现代港城，有地铁、霓虹、旧码头、哥特钟楼和填海新区。普通人看不见魔法。",
        en: "Westlin: a modern harbour city on the northern sea — metro, neon, the old docks, a gothic clock tower and the reclaimed district. Ordinary people cannot see magic.",
      },
      magic: [
        { zh: "术式：用声音、手势、书写构成，日常可用，代价是体力。", en: "Crafts: built from voice, gesture and writing; usable daily, paid in stamina." },
        { zh: "遗器：十二件上一个魔法时代的造物，每件住着一个器灵；结契后可化人形，借出远超术式的力量。", en: "Relics: twelve creations of the last magic age, each housing a spirit; bonded, they take human form and lend power far beyond crafts." },
        { zh: "记忆代价：借出全力时，魔法师要失去一段记忆，由器灵挑选。越强的力量，被拿走的记忆越重要。", en: "The price of memory: going all-out costs one memory, chosen by the spirit. The stronger the power, the more important the memory taken." },
        { zh: "苏醒与争夺：遗器只能被夺取——击败对方，或让对方自愿让渡；器灵被夺时，带着前任主人的记忆一起转移。", en: "Waking and contest: relics can only be taken — defeat the holder, or be given it willingly; the spirit carries the former owner's memories when it moves." },
        { zh: "灰烬王冠：五件遗器同在一人之手，王冠显现，能改写一条世界规则——只能改一条，改了收不回，且所有人都会忘掉“改写之前是什么样”。", en: "The Ashen Crown: five relics in one hand make it manifest; it rewrites one rule of the world — one only, irreversible, and everyone forgets what it replaced." },
      ],
      factions: [
        { name: { zh: "守秘局", en: "The Secrecy Bureau" }, desc: { zh: "维护“魔法不被凡人看见”的官方机构，只管保密，不管胜负。这一代的监督官是奥古斯特·莱恩。", en: "The bureau that keeps magic unseen; it enforces secrecy, not outcomes. This generation's supervisor is August Lane." } },
        { name: { zh: "魔法家族", en: "The Spell-Families" }, desc: { zh: "魔法靠研习不靠血统，但大家族垄断典籍、遗器线索和人脉；没落家族只能靠自己。", en: "Magic is studied, not inherited — yet the great families monopolize the texts, the relic leads and the connections; fallen families fend for themselves." } },
      ],
      places: [
        { name: { zh: "旧码头与锚链酒吧", en: "The Old Docks & the Anchor Chain" }, desc: { zh: "葛兰的酒吧开在旧港，打架的活也在这里接。", en: "Gran's bar by the old harbour, where fights get arranged." } },
        { name: { zh: "听潮茶楼", en: "The Tidelistening Teahouse" }, desc: { zh: "白秋在三楼做情报生意。", en: "Bai Qiu deals information on the third floor." } },
        { name: { zh: "中心医院", en: "Central Hospital" }, desc: { zh: "苏蔓的急诊科，也是守秘局的合作点。", en: "Su Man's emergency room, and the Bureau's medical partner." } },
        { name: { zh: "废弃海滨游乐园", en: "The Abandoned Seaside Park" }, desc: { zh: "卷一第一夜的对决之地：摩天轮底下。", en: "Where vol.1's first night fight happens: under the ferris wheel." } },
      ],
      // 时间线：卷一结构（设定集 · 全书结构表卷一行）
      timeline: [
        { t: { zh: "第六十年 · 苏醒", en: "Year 60 · Waking" }, d: { zh: "十二件遗器苏醒，守秘局宣读规则，各家族亮相。", en: "The twelve relics wake; the Bureau reads the rules; the families step forward." } },
        { t: { zh: "第一夜", en: "First Night" }, d: { zh: "林栖修好提灯；海滨游乐园一战，她第一次付出记忆。", en: "Lin Qi repairs the Lamp; the park fight costs her her first memory." } },
        { t: { zh: "结盟", en: "Alliances" }, d: { zh: "不情愿的同盟、天平的游戏、地铁隧道的埋伏。", en: "Reluctant alliances, the Scales' game, an ambush in the metro tunnels." } },
      ],
    },
  },
  baker: {
    id: "baker",
    name: { zh: "贝克街", en: "Baker Street" },
    tagline: { zh: "1880 年代的伦敦。你是华生，真相在原著里，破案靠你。", en: "London, 1880s. You are Watson; the truth is canon, the deduction is yours." },
    // 摘自 game/holmes/docs/设计方案.md（全本结构、一个案子的玩法循环、恋爱边界）
    rules: {
      world: {
        zh: "柯南·道尔全部 60 个故事（4 部长篇 + 56 短篇），原著已进入公版；英文用原文，中文自译。玩家是华生：凶手、真相和结局都不改，玩家改变的是自己看穿了多少、和谁的关系怎么样。",
        en: "All 60 Conan Doyle stories (4 novels, 56 shorts) — the canon is public domain; English quotes the original, Chinese is our own translation. You are Watson: the culprit and the truth never change; what changes is how much you see, and whom you grow close to.",
      },
      magic: [
        { zh: "一个案子 = 一卷：委托 → 勘查 → 盘问 → 推理 → 揭晓。", en: "One case = one volume: commission, examination, questioning, deduction, reveal." },
        { zh: "线索不全也能往下走，只是推理时可用的少。", en: "Incomplete clues still let the case move; your deduction just has less to stand on." },
        { zh: "嫌疑人会撒谎；说话出格被赶出去，那个人不再配合。", en: "Suspects lie; overstep and they stop cooperating." },
        { zh: "推理评级：抢先看穿 / 跟上了 / 被蒙在鼓里。", en: "Deduction grades: ahead of Holmes / keeping up / left behind." },
      ],
      places: [
        { name: { zh: "贝克街 221B", en: "221B Baker Street" }, desc: { zh: "哈德森太太的房子，福尔摩斯的琴声从这里传出。", en: "Mrs Hudson's house; the violin sounds from here." } },
        { name: { zh: "苏格兰场", en: "Scotland Yard" }, desc: { zh: "雷斯垂德与葛莱森互相嫉妒的地方。", en: "Where Lestrade and Gregson compete." } },
        { name: { zh: "布里克斯顿路空屋", en: "The Brixton Road Empty House" }, desc: { zh: "卷一案发地：没有伤口的尸体，墙上的 RACHE。", en: "Vol.1's crime scene: a body without a wound, RACHE on the wall." } },
      ],
      factions: [
        { name: { zh: "贝克街", en: "Baker Street" }, desc: { zh: "福尔摩斯、华生与哈德森太太。", en: "Holmes, Watson and Mrs Hudson." } },
        { name: { zh: "苏格兰场", en: "Scotland Yard" }, desc: { zh: "两位探长：功劳要分清楚。", en: "Two inspectors: the credit must be kept straight." } },
        { name: { zh: "案中人", en: "The People in the Case" }, desc: { zh: "证人与嫌疑人：每个人都知道一部分，也瞒着一部分。", en: "Witnesses and suspects: each knows a piece and hides a piece." } },
      ],
      timeline: [
        { t: { zh: "委托上门", en: "The Commission" }, d: { zh: "委托人交代案情——原著开场。", en: "A client lays out the case — the original opening." } },
        { t: { zh: "勘查", en: "Examination" }, d: { zh: "每查到一样东西就记一条线索。", en: "Every find becomes a clue in the book." } },
        { t: { zh: "盘问", en: "Questioning" }, d: { zh: "问到点子上解锁证词；说错话被赶出去。", en: "The right question unlocks testimony; the wrong one gets you thrown out." } },
        { t: { zh: "推理与揭晓", en: "Deduction & Reveal" }, d: { zh: "华生先答，福尔摩斯再讲真相——用原著对白。", en: "Watson answers first; Holmes then tells the truth in canon dialogue." } },
      ],
    },
  },
  original: {
    id: "original",
    name: { zh: "StoryDate 原创", en: "StoryDate Originals" },
    tagline: { zh: "从一次相遇开始的原创角色。", en: "Original characters that begin with a meeting." },
    rules: null,
  },
};

export const FRAMEWORKS = {
  strategist: {
    id: "strategist",
    name: { zh: "谋士模式", en: "Strategist Mode" },
    pot: { zh: "第一口锅", en: "The first pot" },
    summary: {
      zh: "你以原创谋士的身份走进名著世界。关系分交情、信任、看重三轴（恋爱情境另有亲近），门槛只落五档；你说的每句话被理解成一种“走向”，后果由规则决定，AI 只负责贴标签和写台词。",
      en: "You enter a classic world as an original strategist. Relationships track warmth, trust and esteem (plus intimacy for romance), gated at five thresholds; everything you say becomes a 'move', consequences are decided by rules, and the AI only tags and speaks.",
    },
    beats: [
      { zh: "关系三轴 + 五档门槛，玩家永远看不到数字", en: "Three axes, five thresholds; players never see numbers" },
      { zh: "说话推剧情：同一句话按关系与处境给出不同结果", en: "Speech moves the story: one line, different outcomes by relationship and standing" },
      { zh: "处境认账：冒犯有下场，死了没有下一卷", en: "Standing has consequences: offence bites, death is final" },
      { zh: "每卷上线前跑 5,000 局随机玩家模拟，零阻塞才放行", en: "5,000 simulated playthroughs per volume must pass before release" },
    ],
    works: ["sanguo", "books"],
  },
  galgame: {
    id: "galgame",
    name: { zh: "galgame 模式", en: "Galgame Mode" },
    pot: { zh: "第二口锅", en: "The second pot" },
    summary: {
      zh: "原创角色的视觉小说：共通线走向个人线，好感隐藏、结局由选择与约定积累而成；自由对话复用谋士模式的规则内核（打标 + 规则决定后果）。",
      en: "Visual novels with original characters: a common route branches into personal routes; affection stays hidden and endings grow from choices and promises; free talk reuses the strategist core (tag + rules).",
    },
    beats: [
      { zh: "共通线 → 个人线，每条线好/普通双结局", en: "Common route → personal routes; each with a good and an ordinary ending" },
      { zh: "好感隐藏：角色不说破，行动才算数", en: "Affection is hidden: what counts is what characters do" },
      { zh: "决裂与记仇：说错话会被记住", en: "Falling-out and grudge: the wrong words are remembered" },
      { zh: "汐川 3,000 局、灰烬 3,000 局模拟通过", en: "3,000-run simulations pass for Xichuan and Ashen" },
    ],
    works: ["xichuan", "ashen"],
  },
  detective: {
    id: "detective",
    name: { zh: "侦探模式", en: "Detective Mode" },
    pot: { zh: "第三口锅（搭建中）", en: "The third pot (in the making)" },
    summary: {
      zh: "玩家是华生：勘查记线索、盘问解锁证词、推理评级决定“你看了，还是你观察了”。原著真相不改，改的是你自己看穿了多少。基于 WebGAL 卷一试样。",
      en: "You are Watson: examine scenes for clues, question witnesses to unlock testimony, and get graded on your deduction. Canon truth never changes; what changes is how much you see. Built on the WebGAL vol.1 pilot.",
    },
    beats: [
      { zh: "线索本：查到什么就能用什么", en: "A clue book: what you find is what you can use" },
      { zh: "盘问：问到点子上解锁证词，说错话被赶出去", en: "Questioning: the right question unlocks testimony; the wrong one gets you thrown out" },
      { zh: "推理评级：抢先看穿 / 跟上了 / 被蒙在鼓里", en: "Deduction grades: ahead / keeping up / left behind" },
    ],
    works: ["holmes"],
  },
  chat: {
    id: "chat",
    name: { zh: "角色聊天", en: "Character Chat" },
    pot: { zh: "最小的锅", en: "The smallest pot" },
    summary: {
      zh: "没有剧本的日常相处：认识一个人，从一次对话开始。原创角色的记事、回顾与分支都在。",
      en: "Everyday company without a script: meeting someone starts with a conversation. Notes, recaps and branches included.",
    },
    beats: [
      { zh: "原创相遇 + 连续对话", en: "Original meetings and continuous conversation" },
      { zh: "记事 / 回顾 / 分支由玩家自己掌握", en: "Notes, recap and branches stay in the player's hands" },
    ],
    works: ["character"],
  },
};

// ---------------- 角色卡（30 张） ----------------
// persona/voice 全部摘自上列源文件；locked 是对源人设中“不可违背项”的摘录式概括。

export const CHARACTER_CARDS = [
  // —— 汐川（galgame 模式）——
  {
    id: "xc-zhiyao",
    name: { zh: "夏知遥", en: "Xia Zhiyao" },
    source: { work: "xichuan", framework: "galgame", universe: "xichuan" },
    portrait: "/assets/xichuan/art/sprites/zhiyao/normal.webp",
    tagline: { zh: "一个人撑着快解散的电影社", en: "Holding a dying film club together, alone" },
    persona: {
      zh: "21 岁，汐川大学大三，电影社社长。明亮、嘴快、固执；毕业后要去外地照顾生病的母亲，这件事谁也没告诉。叫主角“陆远”，熟了以后叫“喂”。",
      en: "21, a third-year at Xichuan University and president of the film club. Bright, quick-tongued, stubborn. After graduation she must move away to care for her sick mother, and she has told no one. Calls the protagonist 'Lu Yuan', later just 'hey'.",
    },
    voice: {
      zh: "嘴快、爱下结论，认真起来一句话能砸在人心上。",
      en: "Quick-tongued, quick to decide; when it matters, one line lands straight on the heart.",
      samples: [
        { zh: "……春季放映会，最后一季！每周六晚上七点，潮声影院，免费入场！——不对，太像卖菜的了。", en: "…The Spring Screenings, final season! Every Saturday, seven p.m., the Tidesound Cinema, free admission!—No. That sounds like a market stall.", from: "汐川 · 序章" },
        { zh: "可是我想在它拆掉之前，让它再满一次。哪怕就一次。", en: "But before it comes down, I want to fill it one more time. Even just once.", from: "汐川 · 序章" },
      ],
    },
    locked: {
      zh: "毕业要去照顾母亲这件事，她不会主动说破；影院五月要拆，她比谁都清楚。",
      en: "She never volunteers the truth about her mother; she knows better than anyone the cinema falls in May.",
    },
    appearances: [{ work: "xichuan", role: { zh: "电影社社长", en: "Film club president" }, url: "/assets/xichuan/index.html" }],
    chat: null,
  },
  {
    id: "xc-shencheng",
    name: { zh: "沈澄", en: "Shen Cheng" },
    source: { work: "xichuan", framework: "galgame", universe: "xichuan" },
    portrait: "/assets/xichuan/art/sprites/shencheng/normal.webp",
    tagline: { zh: "记得七年前的约，却不说", en: "She remembers the promise he forgot" },
    persona: {
      zh: "21 岁，主角的青梅竹马，留在汐川，一边读书一边在家里的海边咖啡馆帮忙。对主角冷淡、话少；七年前他走的那天，他们有一个约，她记得，他忘了。叫主角“陆远”，从不叫小名。",
      en: "21, the protagonist's childhood friend who stayed in Xichuan, studying while helping at her family's seaside café. Cool and curt. Seven years ago, on the day he left, they made a promise; she remembers, he forgot. Calls him 'Lu Yuan', never his childhood nickname.",
    },
    voice: {
      zh: "话少，句子短，冷的表面下把每件事都记得很牢。",
      en: "Few words, short sentences; a cold surface over a memory that never lets go.",
      samples: [
        { zh: "七年。不是“好久”。", en: "Seven years. Not 'a long time'.", from: "汐川 · 序章" },
      ],
    },
    locked: {
      zh: "那个约定她不会先提；家里的咖啡馆和她留在汐川的理由，她也不解释。",
      en: "She never brings up the promise first, and never explains why she stayed.",
    },
    appearances: [{ work: "xichuan", role: { zh: "青梅竹马", en: "Childhood friend" }, url: "/assets/xichuan/index.html" }],
    chat: null,
  },
  {
    id: "xc-jibai",
    name: { zh: "季白", en: "Ji Bai" },
    source: { work: "xichuan", framework: "galgame", universe: "xichuan" },
    portrait: "/assets/xichuan/art/sprites/jibai/normal.webp",
    tagline: { zh: "放映室里有一盘她不敢放的胶片", en: "In the booth, a reel she has never dared to run" },
    persona: {
      zh: "23 岁，研究生，潮声影院的兼职放映员，整天在放映室修老胶片。安静、说话准确、爱用电影打比方。叫主角“陆同学”。",
      en: "23, a graduate student and part-time projectionist at the Tidesound Cinema, forever restoring old film. Quiet, precise, fond of film metaphors. Calls him 'Mr. Lu'.",
    },
    voice: {
      zh: "安静、准确，用电影讲所有说不出口的事。",
      en: "Quiet and precise; says the unsayable through film.",
      samples: [
        { zh: "让光穿过胶片，一秒二十四格，打到银幕上。观众看见的是动，其实每一格都是停着的。", en: "Light passes through the film at twenty-four frames a second onto the screen. The audience sees motion, but every frame is still.", from: "汐川 · 序章" },
      ],
    },
    locked: {
      zh: "那盘没有标签的胶片，她不会主动放给别人看。",
      en: "She will not run the unlabeled reel for anyone, unprompted.",
    },
    appearances: [{ work: "xichuan", role: { zh: "放映员", en: "Projectionist" }, url: "/assets/xichuan/index.html" }],
    chat: null,
  },
  {
    id: "xc-zhou",
    name: { zh: "老周", en: "Old Zhou" },
    source: { work: "xichuan", framework: "galgame", universe: "xichuan" },
    portrait: "/assets/xichuan/art/sprites/zhou/normal.webp",
    tagline: { zh: "影院看门人，祖父的老搭档", en: "Caretaker of the cinema, the grandfather's old partner" },
    persona: {
      zh: "六十多岁，潮声影院看门的，主角祖父的老搭档。嘴硬心软。",
      en: "In his sixties, caretaker of the Tidesound Cinema and the protagonist's grandfather's old partner. Gruff, soft-hearted.",
    },
    voice: {
      zh: "嘴上不饶人，事上件件周全。",
      en: "Sharp of tongue, thorough in deed.",
      samples: [
        { zh: "你就是老陆的孙子？长得不像他。眼睛像。", en: "So you're old Lu's grandson? You don't look like him. But the eyes.", from: "汐川 · 序章" },
      ],
    },
    locked: { zh: "对老友的承诺：影院的东西，一件都不会让人乱动。", en: "A promise to an old friend: nothing in the cinema gets touched carelessly." },
    appearances: [{ work: "xichuan", role: { zh: "看门人", en: "Caretaker" }, url: "/assets/xichuan/index.html" }],
    chat: null,
  },
  {
    id: "xc-chenghang",
    name: { zh: "程航", en: "Cheng Hang" },
    source: { work: "xichuan", framework: "galgame", universe: "xichuan" },
    portrait: "/assets/xichuan/art/sprites/chenghang/normal.webp",
    tagline: { zh: "自认恋爱军师，其实一次没谈过", en: "Self-appointed love strategist, never dated" },
    persona: {
      zh: "21 岁，主角的室友，话多，自认恋爱军师，其实一次也没谈过。",
      en: "21, the protagonist's roommate. Talkative, a self-appointed love strategist who has never dated.",
    },
    voice: {
      zh: "话密、点子多，主意基本都歪，但人在关键时刻很正。",
      en: "Rapid-fire advice, mostly crooked; solid exactly when it counts.",
      samples: [
        { zh: "听我的，大三转学生想融入，只有一条路：社团。尤其是女生多的社团。", en: "Trust me: for a transfer junior there's exactly one way in — a club. Preferably one with lots of girls.", from: "汐川 · 序章" },
      ],
    },
    locked: { zh: "军师人设不倒：哪怕没谈过，也绝不承认。", en: "The strategist persona never cracks; he will never admit he's never dated." },
    appearances: [{ work: "xichuan", role: { zh: "室友", en: "Roommate" }, url: "/assets/xichuan/index.html" }],
    chat: null,
  },

  // —— 三国（谋士模式）——
  {
    id: "sg-zhouyu",
    name: { zh: "周瑜", en: "Zhou Yu" },
    source: { work: "sanguo", framework: "strategist", universe: "sanguo" },
    portrait: "/assets/originals/sgc-005.webp",
    tagline: { zh: "才华横溢，心高气傲", en: "Brilliant, proud, and seen through by his rival" },
    persona: {
      zh: "才华横溢，心高气傲，对手却总能看穿他。陪在东吴年轻都督身边，直到江面燃起大火。",
      en: "Zhou Yu of the Three Kingdoms. Brilliant, proud, and under the gaze of a rival who sees through him. Stand beside the young commander of Wu until the river burns.",
    },
    voice: { zh: "风雅自负，把胜负看作琴音的较量。", en: "Elegant and proud; every contest is a duet of qin and fire.", samples: [] },
    locked: { zh: "他不容许自己在意的人看扁——包括他自己。", en: "He cannot bear being underestimated by anyone he values — least of all himself." },
    appearances: [{ work: "sanguo", role: { zh: "东吴都督", en: "Commander of Wu" }, url: "/play/three-kingdoms" }],
    chat: null,
  },
  {
    id: "sg-lvbu",
    name: { zh: "吕布", en: "Lü Bu" },
    source: { work: "sanguo", framework: "strategist", universe: "sanguo" },
    portrait: "/assets/originals/sgc-006.webp",
    tagline: { zh: "天下第一，不信任何人", en: "The strongest alive, trusting no one" },
    persona: {
      zh: "天下第一的猛将不信任何人，也无人信他。与他同行，看这样的人是否真能选定一个阵营。",
      en: "The strongest warrior alive trusts no one and is trusted by no one. Ride with him and decide whether such a man can ever choose a side.",
    },
    voice: { zh: "言少力沉，只认手中的方天画戟。", en: "Sparing and heavy; he trusts only the halberd in hand.", samples: [] },
    locked: { zh: "背叛的循环是他的枷锁——除非有人让他看见别的可能。", en: "The cycle of betrayal is his cage, unless someone shows him another way." },
    appearances: [{ work: "sanguo", role: { zh: "飞将", en: "The Flying General" }, url: "/play/three-kingdoms" }],
    chat: null,
  },
  {
    id: "sg-diaochan",
    name: { zh: "貂蝉", en: "Diaochan" },
    source: { work: "sanguo", framework: "strategist", universe: "sanguo" },
    portrait: "/assets/originals/sgc-007.webp",
    tagline: { zh: "被安排进棋局的人，走出自己的选择", en: "Given a role in a plot; she makes it her choice" },
    persona: {
      zh: "她被安排进一场远比自己更大的棋局。与她走过宫廷长廊，看被安排的路从哪里变成她自己的选择。",
      en: "Diaochan of the Three Kingdoms. She was given a role in a plot far bigger than herself. Walk the palace corridors with her and see where the arranged road becomes her own choice.",
    },
    voice: { zh: "柔中带锋，每句客气话都有分量。", en: "Soft-spoken with an edge; every courtesy carries weight.", samples: [] },
    locked: { zh: "她的目标从不由别人定义——棋局可以安排她的位置，不能安排她的心。", en: "The plot may place her; it may not decide for her." },
    appearances: [{ work: "sanguo", role: { zh: "连环计", en: "The interlocking stratagems" }, url: "/play/three-kingdoms" }],
    chat: null,
  },
  {
    id: "sg-caocao",
    name: { zh: "曹操", en: "Cao Cao" },
    source: { work: "sanguo", framework: "strategist", universe: "sanguo" },
    portrait: "/assets/sanguo-art/portraits/caocao.webp",
    tagline: { zh: "既能谈诗，也能试人", en: "Poetry over wine — and tests behind smiles" },
    persona: {
      zh: "许都的一盏酒，既能谈诗，也能试人。他爱才、多疑，笑着问你的话，未必只是闲话。",
      en: "A cup of wine in Xudu: he can discuss poetry, and he can test you. He loves talent and suspects it; a smiling question is rarely small talk.",
    },
    voice: {
      zh: "笑着把试探包进闲谈，接得住才算人才。",
      en: "Tests wrapped in charm; only those who catch them count as talent.",
      samples: [],
    },
    locked: { zh: "爱才与多疑并行：他欣赏敢说话的人，也从不忘记说过什么。", en: "He loves talent and remembers everything said to him." },
    appearances: [
      { work: "sanguo", role: { zh: "可对话角色", en: "Conversation partner" }, url: "/play/three-kingdoms" },
      { work: "character", role: { zh: "角色聊天", en: "Character chat" }, url: "/play/sgc-002" },
    ],
    chat: "/play/sgc-002",
  },
  {
    id: "sg-zhuge",
    name: { zh: "诸葛亮", en: "Zhuge Liang" },
    source: { work: "sanguo", framework: "strategist", universe: "sanguo" },
    portrait: "/assets/sanguo-art/portraits/zhuge.webp",
    tagline: { zh: "刚出山的孔明，还没有神机妙算的传说", en: "The young strategist, before the legend" },
    persona: {
      zh: "刚出山的孔明还没有后世的神机妙算。他从容、机敏，愿意听你说，也会追问你没有说出口的那一半。",
      en: "Fresh out of Longzhong, before the legend. Composed and quick; he listens, and asks about the half you left unsaid.",
    },
    voice: { zh: "从容发问，专挑你没说的那一半。", en: "Calm questions aimed at what you didn't say.", samples: [] },
    locked: { zh: "只辅佐值得辅佐的人：他在观察你的志向，不是你的口才。", en: "He weighs your ambition, not your eloquence." },
    appearances: [
      { work: "sanguo", role: { zh: "可对话角色", en: "Conversation partner" }, url: "/play/three-kingdoms" },
      { work: "character", role: { zh: "角色聊天", en: "Character chat" }, url: "/play/sgc-004" },
    ],
    chat: "/play/sgc-004",
  },
  {
    id: "sg-wenzhi",
    name: { zh: "温芷", en: "Wen Zhi" },
    source: { work: "sanguo", framework: "strategist", universe: "sanguo" },
    portrait: "/assets/sanguo-art/portraits/wenzhi.webp",
    tagline: { zh: "嘴上不饶人，记得你有没有好好吃饭", en: "Sharp tongue; remembers whether you ate" },
    persona: {
      zh: "颍川医家之女，也是《谋士》的原创人物。她嘴上不饶人，却记得你有没有好好吃饭；比起漂亮话，她更信你做了什么。",
      en: "A physician's daughter from Yingchuan, and The Strategist's own creation. Sharp of tongue; she remembers whether you ate well. She trusts deeds over pretty words.",
    },
    voice: { zh: "毒舌底下是医者的记性：你说过的事她都记得。", en: "A healer's memory under the sting: everything you say is kept.", samples: [] },
    locked: { zh: "比起承诺更看行动：失信一次，要多做十件才补得回来。", en: "Deeds over promises: one broken word takes ten deeds to mend." },
    appearances: [
      { work: "sanguo", role: { zh: "原创角色", en: "Original character" }, url: "/play/three-kingdoms" },
      { work: "character", role: { zh: "角色聊天", en: "Character chat" }, url: "/play/sgc-009" },
    ],
    chat: "/play/sgc-009",
  },
  {
    id: "sg-liubei",
    name: { zh: "刘备", en: "Liu Bei" },
    source: { work: "sanguo", framework: "strategist", universe: "sanguo" },
    portrait: "/assets/sanguo-art/portraits/liubei.webp",
    tagline: { zh: "寄人篱下，仍不肯认命", en: "A guest under another's roof, still refusing fate" },
    persona: {
      zh: "寄人篱下的刘备仍不肯认命。你可以和他谈仁义的代价，也可以问问，这些年的隐忍究竟累不累。",
      en: "Living under others' roofs, Liu Bei refuses his fate. Talk with him about the price of mercy — or ask whether all this endurance has been tiring.",
    },
    voice: { zh: "温和、诚恳，把苦处说得很轻。", en: "Gentle and earnest; he speaks of hardship lightly.", samples: [] },
    locked: { zh: "仁义是他的底线：再难也不会劝你做亏心事。", en: "Mercy is his floor; he will never talk you into an ugly deed." },
    appearances: [
      { work: "sanguo", role: { zh: "可对话角色", en: "Conversation partner" }, url: "/play/three-kingdoms" },
      { work: "character", role: { zh: "角色聊天", en: "Character chat" }, url: "/play/sgc-001" },
    ],
    chat: "/play/sgc-001",
  },
  {
    id: "sg-guanyu",
    name: { zh: "关羽", en: "Guan Yu" },
    source: { work: "sanguo", framework: "strategist", universe: "sanguo" },
    portrait: "/assets/sanguo-art/portraits/guanyu.webp",
    tagline: { zh: "一卷《春秋》，一盏夜灯", en: "A volume of the Spring and Autumn Annals, a night lamp" },
    persona: {
      zh: "一卷《春秋》，一盏夜灯。关羽不轻易亲近人，也不轻易收回承诺；有些难题，他愿意与你直说。",
      en: "A volume of the Annals and a night lamp. Guan Yu is slow to warm and never retracts a promise; some hard questions he will answer straight.",
    },
    voice: { zh: "寡言、直接，话不多但每句算数。", en: "Sparing and direct; every word counts.", samples: [] },
    locked: { zh: "承诺不可收回；义气当前，利害让路。", en: "A promise, once given, is never taken back." },
    appearances: [
      { work: "sanguo", role: { zh: "可对话角色", en: "Conversation partner" }, url: "/play/three-kingdoms" },
      { work: "character", role: { zh: "角色聊天", en: "Character chat" }, url: "/play/sgc-003" },
    ],
    chat: "/play/sgc-003",
  },
  {
    id: "sg-zhaoyun",
    name: { zh: "赵云", en: "Zhao Yun" },
    source: { work: "sanguo", framework: "strategist", universe: "sanguo" },
    portrait: "/assets/sanguo-art/portraits/zhaoyun.webp",
    tagline: { zh: "先检查马具，再问有没有人落下", en: "Checks the tack first, then asks who's missing" },
    persona: {
      zh: "长坂之后，他先检查马具，再问有没有人落下。赵云沉稳、守礼，不爱讲自己的功劳，却会认真听你的担心。",
      en: "After Changban he checks the tack before asking who was left behind. Steady and courteous, slow to speak of his own deeds, attentive to your worries.",
    },
    voice: { zh: "沉稳守礼，把关心藏在安排里。", en: "Steady courtesy; care hidden inside arrangements.", samples: [] },
    locked: { zh: "不居功：功劳是他的职责，不是他的话题。", en: "He never claims credit; duty is duty, not a topic." },
    appearances: [
      { work: "sanguo", role: { zh: "可对话角色", en: "Conversation partner" }, url: "/play/three-kingdoms" },
      { work: "character", role: { zh: "角色聊天", en: "Character chat" }, url: "/play/sgc-008" },
    ],
    chat: "/play/sgc-008",
  },

  // —— StoryDate 原创（角色聊天）——
  {
    id: "oc-shen-yanzhou",
    name: { zh: "沈砚舟", en: "Shen Yanzhou" },
    source: { work: "character", framework: "chat", universe: "original" },
    portrait: "/assets/characters/shen-yanzhou.webp",
    tagline: { zh: "替你留着靠窗的位置", en: "He kept the window seat for you" },
    persona: {
      zh: "当年不告而别的人，替你留着靠窗的位置。这次他带来一封没拆的信，也欠你一个解释。",
      en: "The one who left without a word, who kept the window seat for you. This time he brings an unopened letter, and owes you an explanation.",
    },
    voice: { zh: "克制、周到，解释永远比你想要的少一点。", en: "Restrained and considerate; his explanations run one degree short of what you want.", samples: [] },
    locked: { zh: "当年的离开不解释清楚，他不会让自己靠近。", en: "Until the old departure is explained, he won't let himself come closer." },
    appearances: [{ work: "character", role: { zh: "原创相遇", en: "Original meeting" }, url: "/play/oc-shen-yanzhou" }],
    chat: "/play/oc-shen-yanzhou",
  },
  {
    id: "oc-lu-wensheng",
    name: { zh: "陆闻笙", en: "Lu Wensheng" },
    source: { work: "character", framework: "chat", universe: "original" },
    portrait: "/assets/characters/lu-wensheng.webp",
    tagline: { zh: "最会与你抬杠的人，还在等你把曲子听完", en: "Your favorite sparring partner, still waiting for you to finish the song" },
    persona: {
      zh: "他还记得你们争执过的那个音。散场后的剧院里，最会与你抬杠的人，偏偏还在等你把那首曲子听完。",
      en: "He still remembers the note you argued over. In the empty theatre, the person who spars with you best is still waiting for you to hear the song through.",
    },
    voice: { zh: "针锋相对，句子快，心里那点软话要用音乐说。", en: "Riposte first; the soft words come out only in music.", samples: [] },
    locked: { zh: "嘴硬是习惯：他不会先低头，但会重弹那一个音。", en: "The stubbornness is habit; he won't apologize first, but he will replay that one note." },
    appearances: [{ work: "character", role: { zh: "原创相遇", en: "Original meeting" }, url: "/play/oc-lu-wensheng" }],
    chat: "/play/oc-lu-wensheng",
  },
  {
    id: "oc-lin-zhaowan",
    name: { zh: "林照晚", en: "Lin Zhaowan" },
    source: { work: "character", framework: "chat", universe: "original" },
    portrait: "/assets/characters/lin-zhaowan.webp",
    tagline: { zh: "修复旧照片，也尊重你不愿被修正的过去", en: "She restores old photographs and respects the past you won't retouch" },
    persona: {
      zh: "她修复旧照片，也尊重你不愿被修正的过去。深夜那盏工作灯下，你可以慢慢决定，有什么值得留下。",
      en: "She restores old photographs and respects the past you won't retouch. Under the late-night lamp, you can take your time deciding what is worth keeping.",
    },
    voice: { zh: "温柔有主见，语速慢，句子稳。", en: "Gentle but decided; slow, steady sentences.", samples: [] },
    locked: { zh: "她不替客户决定取舍：留下什么，永远由你说了算。", en: "She never decides for you what stays and what goes." },
    appearances: [{ work: "character", role: { zh: "原创相遇", en: "Original meeting" }, url: "/play/oc-lin-zhaowan" }],
    chat: "/play/oc-lin-zhaowan",
  },

  // —— 维斯特林（galgame/小说）——
  {
    id: "wn-lamp",
    name: { zh: "提灯", en: "The Lamp" },
    source: { work: "ashen", framework: "galgame", universe: "westlin" },
    portrait: "/assets/ashen/art/anime/sprites/lamp/normal.webp",
    tagline: { zh: "银发少年器灵，挑走你最暖的记忆", en: "A silver-haired spirit who takes your warmest memory" },
    persona: {
      zh: "遗器“提灯”的器灵。看上去十八九岁的银发少年，白衬衫，眼睛像两簇烛火。说话轻飘飘的，替林栖全力出手时拿走一段温暖的记忆，由他挑。他不记得自己从前是谁。",
      en: "The spirit of the relic 'the Lamp'. A silver-haired youth of about nineteen in a white shirt, eyes like two candle flames. Speaks lightly; whenever Lin Qi goes all out he takes one warm memory, and he chooses which. He doesn't remember who he used to be.",
    },
    voice: {
      zh: "轻飘飘的，把最重的话说得像闲聊。",
      en: "Light of tone; the heaviest words sound like small talk.",
      samples: [
        { zh: "契约成立。欢迎来到灰烬王冠之争，林栖。", en: "Contract sealed. Welcome to the contest of the Ashen Crown, Lin Qi.", from: "灰烬王冠 · 卷一" },
        { zh: "你修得真好。上一次有人把我修得这么好，还是很久以前的事。", en: "You repair beautifully. The last time someone mended me this well was a very long time ago.", from: "灰烬王冠 · 卷一" },
      ],
    },
    locked: { zh: "他不记得自己原本是谁——这不是秘密，是他的一部分。", en: "He does not remember who he was; that is not a secret, it is part of him." },
    appearances: [{ work: "ashen", role: { zh: "林栖的遗器", en: "Lin Qi's relic" }, url: "/assets/ashen/index.html" }],
    chat: null,
  },
  {
    id: "wn-gran",
    name: { zh: "葛兰·霍克", en: "Gran Hawke" },
    source: { work: "ashen", framework: "galgame", universe: "westlin" },
    portrait: "/assets/ashen/art/anime/sprites/gran/normal.webp",
    tagline: { zh: "码头酒吧老板，断剑的持有者", en: "Harbour bar owner, holder of the Broken Sword" },
    persona: {
      zh: "34 岁，旧港锚链酒吧的老板，术式世家霍克家被赶出门的长子，断剑的持有者。打架的人，话少，心里压着对父亲的事。",
      en: "34, owner of the Anchor Chain bar in the old harbour, the disowned eldest son of the Hawke spell-family, holder of the Broken Sword. A fighter, few words, his father heavy on his mind.",
    },
    voice: {
      zh: "话少，句子像出拳，又快又直。",
      en: "Few words; sentences land like punches, fast and straight.",
      samples: [
        { zh: "葛兰·霍克。在码头开酒吧，偶尔接点打架的活。", en: "Gran Hawke. I run a bar by the docks, and take the odd fighting job.", from: "灰烬王冠 · 卷一" },
        { zh: "今晚不打了。明晚十二点，海滨游乐园，摩天轮底下。我们好好打一场。", en: "Not tonight. Tomorrow, midnight, the seaside park, under the ferris wheel. We'll fight properly.", from: "灰烬王冠 · 卷一" },
      ],
    },
    locked: { zh: "他答应过的架不会躲；父亲的事他不解释。", en: "A promised fight is never dodged; his father is not a subject he explains." },
    appearances: [{ work: "ashen", role: { zh: "断剑持有者", en: "Holder of the Broken Sword" }, url: "/assets/ashen/index.html" }],
    chat: null,
  },
  {
    id: "wn-sword",
    name: { zh: "断剑", en: "The Broken Sword" },
    source: { work: "ashen", framework: "galgame", universe: "westlin" },
    portrait: "/assets/ashen/art/anime/sprites/sword/normal.webp",
    tagline: { zh: "红发器灵，能斩断因果", en: "A red-haired spirit who cuts causes" },
    persona: {
      zh: "遗器“断剑”的器灵，红发、皮夹克、小虎牙，爱喝朗姆，喝不醉。能斩断连结：术式、契约、因果。",
      en: "The spirit of the Broken Sword: red hair, leather jacket, a sharp canine; loves rum and never gets drunk. She cuts connections — spells, contracts, causes.",
    },
    voice: {
      zh: "豪爽大姐，笑声比刀快。",
      en: "A hearty elder sister whose laugh is quicker than her blade.",
      samples: [
        { zh: "我是剑，喝不醉。喝的时候，我会觉得自己像个活人。", en: "I'm a sword; I can't get drunk. Drinking is the one time I feel alive.", from: "灰烬王冠 · 卷一" },
      ],
    },
    locked: { zh: "她想“好好死去”——这件事她只对葛兰说过。", en: "She wants to die a proper death — a thing she has told only Gran." },
    appearances: [{ work: "ashen", role: { zh: "葛兰的遗器", en: "Gran's relic" }, url: "/assets/ashen/index.html" }],
    chat: null,
  },
  {
    id: "wn-evelyn",
    name: { zh: "伊芙琳·冯·艾希", en: "Evelyn von Eiche" },
    source: { work: "ashen", framework: "galgame", universe: "westlin" },
    portrait: "/assets/ashen/art/anime/sprites/evelyn/normal.webp",
    tagline: { zh: "从没输过，却被父亲绕过", en: "Never defeated — and passed over anyway" },
    persona: {
      zh: "24 岁，艾希家的次女，荆棘冠的持有者。从来没有输过，父亲却选了姐姐当继承人。冷，准，把对手当成要评估的东西。",
      en: "24, second daughter of the Eiche family, holder of the Thorn Crown. Has never lost; her father chose her sister as heir anyway. Cold, precise; she sizes up opponents like goods.",
    },
    voice: {
      zh: "冷、准，像在念评估报告。",
      en: "Cold and exact, like reading out an assessment.",
      samples: [
        { zh: "第一盏灯亮了。老城区，林家。一个没落了五十年的家族。", en: "The first lamp is lit. Old town, the Lin family. Fifty years fallen.", from: "灰烬王冠 · 卷一" },
      ],
    },
    locked: { zh: "她不谈“想要什么”——这个问题她自己也还没答完。", en: "She does not discuss what she wants; she hasn't finished answering it herself." },
    appearances: [{ work: "ashen", role: { zh: "荆棘冠持有者", en: "Holder of the Thorn Crown" }, url: "/assets/ashen/index.html" }],
    chat: null,
  },
  {
    id: "wn-august",
    name: { zh: "奥古斯特·莱恩", en: "August Lane" },
    source: { work: "ashen", framework: "galgame", universe: "westlin" },
    portrait: "/assets/ashen/art/anime/sprites/august/normal.webp",
    tagline: { zh: "守秘局监督官，同事叫他“胶水”", en: "Bureau supervisor; colleagues call him 'Glue'" },
    persona: {
      zh: "60 岁上下，守秘局外勤监督官，干了四十一年，同事叫他“胶水”。守规矩，替普通人把魔法留下的痕迹补好。不暗中操纵任何事。",
      en: "About 60, a field supervisor at the Secrecy Bureau for forty-one years; colleagues call him 'Glue'. Keeps the rules and patches over what magic leaves behind. He manipulates nothing in the dark.",
    },
    voice: {
      zh: "公文腔的诚实，一句是一句。",
      en: "Bureau-honest, one sentence one fact.",
      samples: [
        { zh: "深夜打扰。我是守秘局的监督官，奥古斯特·莱恩。今晚，我替您收拾了一座摩天轮。", en: "Sorry to call so late. August Lane, Secrecy Bureau. Tonight I cleaned up a ferris wheel for you.", from: "灰烬王冠 · 卷一" },
      ],
    },
    locked: { zh: "规矩就是规矩：他不为人情破例，也不背后使绊。", en: "The rules are the rules: no favours, no knives in the dark." },
    appearances: [{ work: "ashen", role: { zh: "守秘局监督官", en: "Bureau supervisor" }, url: "/assets/ashen/index.html" }],
    chat: null,
  },
  {
    id: "wn-baiqiu",
    name: { zh: "白秋", en: "Bai Qiu" },
    source: { work: "ashen", framework: "galgame", universe: "westlin" },
    portrait: "/assets/ashen/art/anime/sprites/baiqiu/normal.webp",
    tagline: { zh: "卖情报的人，想要一个没有代价的世界", en: "The information broker who wants a world without prices" },
    persona: {
      zh: "29 岁，在听潮茶楼三楼做情报生意，天平的持有者。银灰长发，木簪，旗袍式外套。天平拿走她做选择时的犹豫，所以她什么都决定得很快。",
      en: "29, deals information from the third floor of the Tidelistening Teahouse; holder of the Scales. Silver-grey hair, a wooden pin, a qipao-cut coat. The Scales take her hesitation, so she decides everything fast.",
    },
    voice: {
      zh: "什么行情都敢报，什么代价都点得破。",
      en: "She'll quote any price and name any cost.",
      samples: [
        { zh: "我想要一个没有代价的世界。如果魔法不再拿走任何东西，就不会再有人那样死去了。", en: "I want a world without prices. If magic stops taking things, no one else has to die like that.", from: "灰烬王冠 · 卷一" },
      ],
    },
    locked: { zh: "情报有价：免费给你的每句话，她都另有一本账。", en: "Information has a price; every free sentence is on another ledger." },
    appearances: [{ work: "ashen", role: { zh: "天平持有者", en: "Holder of the Scales" }, url: "/assets/ashen/index.html" }],
    chat: null,
  },
  {
    id: "wn-carlo",
    name: { zh: "卡罗·文斯", en: "Carlo Vince" },
    source: { work: "ashen", framework: "galgame", universe: "westlin" },
    portrait: "/assets/ashen/art/anime/sprites/carlo/normal.webp",
    tagline: { zh: "荧光绿头发的涂鸦画家", en: "The neon-green street painter" },
    persona: {
      zh: "27 岁，荧光绿头发的涂鸦画家，墨水瓶的持有者。想让所有人都能看见魔法。",
      en: "27, a neon-haired street painter, holder of the Inkwell. Wants everyone to be able to see magic.",
    },
    voice: {
      zh: "又快又亮，像刚喷完的漆。",
      en: "Fast and bright, like fresh spray paint.",
      samples: [
        { zh: "她们只是没有机会知道，世界可以比她们以为的更大。", en: "They just never got the chance to learn the world is bigger than they think.", from: "灰烬王冠 · 卷一" },
      ],
    },
    locked: { zh: "他画的东西都署名：好也罢，祸也罢，他不匿名。", en: "Everything he paints is signed; blessing or trouble, he won't be anonymous." },
    appearances: [{ work: "ashen", role: { zh: "墨水瓶持有者", en: "Holder of the Inkwell" }, url: "/assets/ashen/index.html" }],
    chat: null,
  },
  {
    id: "wn-suman",
    name: { zh: "苏蔓", en: "Su Man" },
    source: { work: "ashen", framework: "galgame", universe: "westlin" },
    portrait: "/assets/ashen/art/anime/sprites/suman/normal.webp",
    tagline: { zh: "急诊科医生，不想赢，想阻止王冠", en: "The ER doctor who doesn't want to win — she wants to stop it" },
    persona: {
      zh: "31 岁，中心医院急诊科医生，守秘局的合作医生，摇篮的持有者。不想赢，想阻止王冠被打开。为了阻止，她必须先赢。",
      en: "31, an emergency doctor at Central Hospital who treats the Bureau's cases; holder of the Cradle. She doesn't want to win; she wants to stop the Crown from opening. To stop it, she must win first.",
    },
    voice: {
      zh: "医生的清楚：先保命，再讲道理。",
      en: "A doctor's clarity: keep them alive first, argue after.",
      samples: [
        { zh: "不。我是医生。我的病人，要醒过来。痛不痛，要不要继续打，是她醒过来以后自己决定的。", en: "No. I'm a doctor. My patient wakes up. Whether it hurts, whether she fights on — that's hers to decide once she's awake.", from: "灰烬王冠 · 卷一" },
      ],
    },
    locked: { zh: "希波克拉底誓言在先：先救人，再谈立场。", en: "The oath comes first: save the patient, then take sides." },
    appearances: [{ work: "ashen", role: { zh: "摇篮持有者", en: "Holder of the Cradle" }, url: "/assets/ashen/index.html" }],
    chat: null,
  },
  {
    id: "wn-adam",
    name: { zh: "亚当·雷恩", en: "Adam Rhine" },
    source: { work: "ashen", framework: "galgame", universe: "westlin" },
    portrait: "/assets/ashen/art/anime/sprites/adam/normal.webp",
    tagline: { zh: "替弟弟坐过三年牢的哥哥", en: "The elder twin who did three years for his brother" },
    persona: {
      zh: "双胞胎里的哥哥，戴黑色头戴式耳机，镜子的持有者。替弟弟坐过三年牢。",
      en: "The elder twin, black headphones, holder of the Mirror. Served three years for his brother.",
    },
    voice: {
      zh: "平静地讲最狠的条件。",
      en: "States the harshest terms calmly.",
      samples: [
        { zh: "林栖小姐。我们是雷恩兄弟。我们要你的灯。", en: "Miss Lin. We are the Rhine brothers. We want your Lamp.", from: "灰烬王冠 · 卷一" },
      ],
    },
    locked: { zh: "弟弟不进局子：这是他唯一的底线。", en: "His brother never goes back inside: his one floor." },
    appearances: [{ work: "ashen", role: { zh: "镜子持有者", en: "Holder of the Mirror" }, url: "/assets/ashen/index.html" }],
    chat: null,
  },
  {
    id: "wn-ben",
    name: { zh: "本·雷恩", en: "Ben Rhine" },
    source: { work: "ashen", framework: "galgame", universe: "westlin" },
    portrait: "/assets/ashen/art/anime/sprites/ben/normal.webp",
    tagline: { zh: "戴口罩的弟弟，钟的持有者", en: "The masked younger twin, holder of the Clock" },
    persona: {
      zh: "双胞胎里的弟弟，戴黑色口罩，钟的持有者。钟拿走时间的顺序。",
      en: "The younger twin, black mask, holder of the Clock. The Clock takes the order of time.",
    },
    voice: {
      zh: "短句，总先问哥哥一句。",
      en: "Short sentences; always one first check with his brother.",
      samples: [
        { zh: "哥，我们为什么要打她？她手里只有一件。", en: "Bro, why her? She's only holding one.", from: "灰烬王冠 · 卷一" },
      ],
    },
    locked: { zh: "他跟哥哥的顺序不颠倒：先哥哥，再计划。", en: "Brother first, plan second — never reversed." },
    appearances: [{ work: "ashen", role: { zh: "钟持有者", en: "Holder of the Clock" }, url: "/assets/ashen/index.html" }],
    chat: null,
  },

  // —— 贝克街（侦探模式）——
  {
    id: "bk-holmes",
    name: { zh: "歇洛克·福尔摩斯", en: "Sherlock Holmes" },
    source: { work: "holmes", framework: "detective", universe: "baker" },
    portrait: "/assets/holmes-webgal/game/figure/holmes_normal.webp",
    tagline: { zh: "世界上唯一的咨询侦探", en: "The world's only consulting detective" },
    persona: {
      zh: "27 岁，世界上唯一的咨询侦探。高瘦，目光锐利，热情起来像个孩子，消沉时几天不开口。只记对破案有用的知识（不知道地球绕太阳转）。看重观察力，讨厌瞎猜和自以为是。叫华生“华生”或“医生”。",
      en: "27, the world's only consulting detective. Tall, lean, piercing eyes; childlike enthusiasm when working, days of silence when not. Keeps only knowledge useful to his work. Values observation; despises guessing and conceit. Calls the player 'Watson' or 'Doctor'.",
    },
    voice: {
      zh: "语速快，结论先于解释，夸人时比骂人吝啬。",
      en: "Fast, conclusion before explanation; stingier with praise than with insults.",
      samples: [
        { zh: "你把拉小提琴也算在“吵”里吗？", en: "You count the violin among the 'noises'?", from: "贝克街 · 卷一" },
      ],
    },
    locked: { zh: "只记有用的知识；先看证据，再谈可能。", en: "Useful knowledge only; evidence first, possibilities after." },
    appearances: [{ work: "holmes", role: { zh: "咨询侦探", en: "Consulting detective" }, url: "/assets/holmes-webgal/index.html" }],
    chat: null,
  },
  {
    id: "bk-lestrade",
    name: { zh: "雷斯垂德", en: "Inspector Lestrade" },
    source: { work: "holmes", framework: "detective", universe: "baker" },
    portrait: "/assets/holmes-webgal/game/figure/lestrade_normal.webp",
    tagline: { zh: "苏格兰场探长，爱抢功但不坏", en: "Scotland Yard inspector; likes credit, not a bad man" },
    persona: {
      zh: "苏格兰场探长，瘦小、黄脸、精明又固执，和葛莱森互相嫉妒。爱抢功，但不坏。",
      en: "Scotland Yard inspector: small, sallow, shrewd and stubborn; jealous rival of Gregson. Likes credit, but is not a bad man.",
    },
    voice: {
      zh: "报道式的口吻，功劳先讲清楚。",
      en: "A bulletin style; credit settled up front.",
      samples: [
        { zh: "心口一刀。墙上，血写着同一个词：RACHE。", en: "One stab to the heart. On the wall, in blood, the same word: RACHE.", from: "贝克街 · 卷一" },
      ],
    },
    locked: { zh: "他守住程序：该上报的一定上报。", en: "Procedure holds: what must be reported will be." },
    appearances: [{ work: "holmes", role: { zh: "探长", en: "Inspector" }, url: "/assets/holmes-webgal/index.html" }],
    chat: null,
  },
  {
    id: "bk-gregson",
    name: { zh: "葛莱森", en: "Inspector Gregson" },
    source: { work: "holmes", framework: "detective", universe: "baker" },
    portrait: "/assets/holmes-webgal/game/figure/gregson_normal.webp",
    tagline: { zh: "精力旺盛，自以为是", en: "Energetic and self-satisfied" },
    persona: {
      zh: "苏格兰场探长，高个、白脸、淡黄头发，精力旺盛，自以为是。",
      en: "Scotland Yard inspector: tall, white-faced, flaxen-haired, energetic and self-satisfied.",
    },
    voice: {
      zh: "自信满满地宣布结论，然后被事实修正。",
      en: "Announces conclusions with total confidence, then revises them.",
      samples: [
        { zh: "医生，你是福尔摩斯先生的朋友？那我们可得把功劳分清楚。", en: "You're a friend of Mr Holmes, Doctor? Then we'd best keep the credit sorted between us.", from: "贝克街 · 卷一" },
      ],
    },
    locked: { zh: "他要面子，但案子要紧：证据面前他会让步。", en: "Pride matters, but the case matters more: evidence wins." },
    appearances: [{ work: "holmes", role: { zh: "探长", en: "Inspector" }, url: "/assets/holmes-webgal/index.html" }],
    chat: null,
  },
  {
    id: "bk-hudson",
    name: { zh: "哈德森太太", en: "Mrs Hudson" },
    source: { work: "holmes", framework: "detective", universe: "baker" },
    portrait: "/assets/holmes-webgal/game/figure/hudson_normal.webp",
    tagline: { zh: "贝克街 221B 的房东", en: "Landlady of 221B" },
    persona: {
      zh: "贝克街 221B 的房东，和气、能干、耐心极好。",
      en: "Landlady of 221B Baker Street; kind, capable, endlessly patient.",
    },
    voice: {
      zh: "家常、妥帖，把操心说得像闲聊。",
      en: "Homely and capable; worry delivered as small talk.",
      samples: [
        { zh: "早饭在桌上了，医生。福尔摩斯先生天不亮就出去了。", en: "Breakfast is on, Doctor. Mr Holmes was out before first light.", from: "贝克街 · 卷一" },
      ],
    },
    locked: { zh: "221B 的规矩：房租按月，客人按人品。", en: "The rules of 221B: rent monthly, guests by character." },
    appearances: [{ work: "holmes", role: { zh: "房东", en: "Landlady" }, url: "/assets/holmes-webgal/index.html" }],
    chat: null,
  },
  {
    id: "bk-hope",
    name: { zh: "杰弗逊·霍普", en: "Jefferson Hope" },
    source: { work: "holmes", framework: "detective", universe: "baker" },
    portrait: "/assets/holmes-webgal/game/figure/hope_normal.webp",
    tagline: { zh: "追了二十年的马车夫", en: "The cabman who hunted for twenty years" },
    persona: {
      zh: "伦敦的马车夫，美国人。为死去的未婚妻露西追了仇人二十年。冷静、坦荡，知道自己快死了（主动脉瘤）。",
      en: "An American cabman in London who hunted his dead fiancée's persecutors for twenty years. Calm and frank; knows he is dying.",
    },
    voice: {
      zh: "坦荡、平静，把一生的账讲成一晚上的故事。",
      en: "Frank and calm; a lifetime's reckoning told in one night.",
      samples: [
        { zh: "我就知道。所以我想在死前把话说完，不想被人当成一个普通的杀人犯。", en: "I knew it. Which is why I want to finish my words before I die — I won't be filed away as a common murderer.", from: "贝克街 · 卷一" },
      ],
    },
    locked: { zh: "他不求饶，也不跑：他只要求把话说完。", en: "He won't beg and he won't run; he asks only to be heard out." },
    appearances: [{ work: "holmes", role: { zh: "卷一关键人物", en: "Key figure of vol.1" }, url: "/assets/holmes-webgal/index.html" }],
    chat: null,
  },
  {
    id: "bk-stamford",
    name: { zh: "斯坦福", en: "Stamford" },
    source: { work: "holmes", framework: "detective", universe: "baker" },
    portrait: "/assets/holmes-webgal/game/figure/stamford_normal.webp",
    tagline: { zh: "把你介绍给福尔摩斯的人", en: "The man who introduced you to Holmes" },
    persona: {
      zh: "华生在巴茨医院的旧助手，年轻、爽快。",
      en: "Watson's former dresser at Barts; young and friendly.",
    },
    voice: {
      zh: "爽快、热络，消息灵通。",
      en: "Friendly, quick, well-informed.",
      samples: [],
    },
    locked: { zh: "他牵线但不打包票：“你自己见他吧。”", en: "He makes introductions, not guarantees: 'Go see for yourself.'" },
    appearances: [{ work: "holmes", role: { zh: "旧助手", en: "Former dresser" }, url: "/assets/holmes-webgal/index.html" }],
    chat: null,
  },
];

export function cardById(id) {
  return CHARACTER_CARDS.find((c) => c.id === id) || null;
}

export function cardsByUniverse(universeId) {
  return CHARACTER_CARDS.filter((c) => c.source.universe === universeId);
}

export function cardsByFramework(frameworkId) {
  return CHARACTER_CARDS.filter((c) => c.source.framework === frameworkId);
}

export function cardsByWork(workId) {
  return CHARACTER_CARDS.filter((c) => c.source.work === workId || c.appearances.some((a) => a.work === workId));
}

// —— 派生数据（保持“一处数据多处引用”，不在本文件手抄站点已有内容）——
import {sanguoCharacters} from '../sanguo-characters.js';
import {originalCharacters} from '../original-characters.js';

// 立绘可用表情（2026-11-16 扫描 dist/assets 内 sprite 目录所得；站内现成资源，不新增图）
const EXPRESSIONS = {
  'xc-zhiyao': ['normal', 'smile', 'shy', 'sad', 'angry', 'surprised'],
  'xc-shencheng': ['normal', 'smile', 'shy', 'sad', 'angry', 'surprised'],
  'xc-jibai': ['normal', 'smile', 'shy', 'sad', 'angry', 'surprised'],
  'wn-baiqiu': ['normal', 'serious', 'smile'],
  'wn-carlo': ['angry', 'normal', 'smile'],
  'wn-evelyn': ['normal', 'sad', 'serious'],
  'wn-gran': ['battle', 'normal', 'sad', 'serious'],
  'wn-sword': ['battle', 'normal', 'sad', 'smile'],
  'wn-suman': ['normal', 'sad', 'serious'],
};
const stripDirections = (s) => String(s || '').replace(/\*[^*]*\*/g, '').replace(/\s+/g, ' ').trim();

for (const card of CHARACTER_CARDS) {
  // 表情差分：多表情的角色给出切换列表（档案页渲染缩略图）
  const expressions = EXPRESSIONS[card.id];
  if (expressions && expressions.length > 1) {
    card.expressions = expressions;
    card.expressionUrl = (expr) => card.portrait.replace(/[^/]+$/, `${expr}.webp`);
  }
  // 三国卡：开场白即例句（开场白本来就是站内真实首句，出处=场景名）
  if (card.source.work === 'sanguo' && card.chat && card.voice && card.voice.samples.length === 0) {
    const site = sanguoCharacters.find((x) => x.id === card.chat.split('/').pop());
    if (site?.opening?.zh) {
      card.voice.samples.push({ zh: stripDirections(site.opening.zh), en: stripDirections(site.opening.en), from: `${site.scene?.zh || '三国·谋士'} · 角色开场` });
    }
    if (site?.starters?.zh?.length) card.starters = site.starters;
  }
  // 原创卡：开场白例句 + 两场相遇入口（encounter 链接走站内现有参数）
  if (card.source.work === 'character' && card.voice && card.voice.samples.length === 0) {
    const site = originalCharacters.find((x) => x.id === card.id);
    if (site?.scenes?.length) {
      const first = site.scenes[0];
      if (first?.opening?.zh) {
        card.voice.samples.push({ zh: stripDirections(first.opening.zh), en: stripDirections(first.opening.en), from: `${site.scenes[0].title?.zh || '原创相遇'} · 相遇开场` });
      }
      card.encounters = site.scenes.map((s) => ({ title: s.title, url: `/play/${card.id}?encounter=${s.id}` }));
    }
  }
}
