"""卷一《血字的研究》：劳瑞斯顿花园（勘查）、兰斯警员（盘问）、广告、葛莱森、推理问答、落网。
第一部第 3–7 章。查案的做法见 设计方案.md：勘查拿线索（clue.*，同时加 proof），推理问答答对加 deduce。"""
from lib import *

CHAPTERS = [
    {"id": "c3", "title": T("第三章 · 劳瑞斯顿花园疑案", "Chapter 3 · The Lauriston Gardens Mystery"), "intro": [P(T("布里克斯顿路，一座空屋。", "An empty house off the Brixton Road."))], "offer": 0, "main_first": True},
    {"id": "c4", "title": T("第四章 · 警员兰斯的话", "Chapter 4 · What John Rance Had to Tell"), "intro": [P(T("肯宁顿公园门，奥德利大院 46 号。", "46 Audley Court, Kennington Park Gate."))], "offer": 0, "main_first": True},
    {"id": "c5", "title": T("第五章 · 广告引来的访客", "Chapter 5 · Our Advertisement Brings a Visitor"), "intro": [P(T("“布里克斯顿路拾获金质结婚戒指一枚。”", "'In Brixton Road, a plain gold wedding ring, found.'"))], "offer": 0, "main_first": True},
    {"id": "c6", "title": T("第六章 · 黑暗中的光", "Chapter 6 · Light in the Darkness"), "intro": [P(T("第二个死者。", "A second death."))], "offer": 0, "main_first": True},
]

# ---------------- 第三章 · 勘查：三处地方，每处只能细看一样 ----------------
C3_ARRIVE = scene("c3_arrive", "c3", "main", T("空屋门前", "Before the Empty House"), [
    bg("street_fog"),
    show("holmes", "normal", "center"),
    say("holmes", "葛莱森来信了。布里克斯顿路劳瑞斯顿花园 3 号，一个空屋里发现了一具尸体。戴上帽子，华生。", "A letter from Gregson. A body found in an empty house, No. 3, Lauriston Gardens, off the Brixton Road. Get your hat, Watson.", face="normal"),
    bg("lauriston_out"),
    nar("那是一座阴森的空屋，三排窗户空空洞洞。门前一条黄泥小路，被雨淋得一片泥泞。", "It was an ill-omened, empty house, its three tiers of windows blank and dreary. A narrow clay path ran up to the door, sodden with the night's rain."),
    nar("福尔摩斯没有进门，而是慢悠悠地在人行道上来回踱步，看看地，看看天，看看对面的房子和栏杆。", "Holmes did not hurry in. He lounged up and down the pavement, gazing vacantly at the ground, the sky, the opposite houses and the line of railings."),
    show("gregson", "normal", "right"),
    say("gregson", "你来了真好。东西一样都没动过。", "It is indeed kind of you to come. I have had everything left untouched.", face="normal"),
    say("holmes", "除了这条路！就算一群水牛走过，也不会比这更乱了。", "Except that! If a herd of buffaloes had passed along there could not be a greater mess.", face="angry"),
    think("警察的脚印把路踩烂了。可福尔摩斯在路边看了很久。我该看哪里？", "The police have trampled the path. But Holmes spent a long while at the kerb. Where should I look?"),
], [
    choice("kerb", "dilemma", T("看路边：泥地上的车辙和马蹄印。", "The kerb: wheel-marks and hoof-prints in the mud."), [
        think("两道车轮印挨得很近——是出租马车。马蹄印里，有三个旧的，一个是新钉的。", "Two ruts close together — a cab. Of the hoof-prints, three are worn and one is new."),
        nar("福尔摩斯瞥了我一眼，眼睛里有一点意外。", "Holmes glanced at me with a flicker of surprise."),
    ], clue("cab") + [rel("holmes", "esteem", 1)], values=["zhen"]),
    choice("path", "dilemma", T("跟着福尔摩斯，看他在小路边上看什么。", "Follow Holmes and see what he studies along the path."), [
        think("他在路边的草上找脚印。有一双是漆皮靴，一双是方头靴。方头靴的步子……很大。", "He is reading footprints in the grass along the edge. One pair patent leather, one pair square-toed. The square-toed stride is… very long."),
    ], clue("boots") + [rel("holmes", "trust", 1)], values=["ren"]),
    choice("gregson", "expression", T("先跟葛莱森探长打听案情。", "Get the facts from Inspector Gregson first."), [
        say("gregson", "死者叫伊诺克·J·德雷伯，美国俄亥俄州克利夫兰人。身上没有伤口，可屋里有血。雷斯垂德也在里面。", "The dead man is Enoch J. Drebber, of Cleveland, Ohio, U.S.A. No wound on him, but there is blood about the room. Lestrade is inside too.", face="normal"),
        say("gregson", "医生，你是福尔摩斯先生的朋友？那我们可得把功劳分清楚。", "You are Mr Holmes's friend, Doctor? Then we must keep the credit straight between us.", face="smile"),
    ], [rel("gregson", "trust", 1), rel("gregson", "warmth", 1)], values=["li"]),
], order=1, cast=["holmes", "gregson"])

C3_ROOM = scene("c3_room", "c3", "main", T("前厅", "The Front Room"), [
    bg("lauriston_in"),
    nar("屋里没有家具，墙纸大片剥落，发着霉。壁炉台上有一截红蜡烛头。", "The room was bare of furniture, the cheap wallpaper blotched with mildew and hanging in strips. On the mantelpiece stood the stump of a red wax candle."),
    nar("死者仰面躺着，双手握拳，脸上的表情是我从没见过的——恐惧，还有仇恨。", "The dead man lay on his back, his hands clenched, and on his features such an expression of horror, and of hatred, as I have never seen."),
    show("lestrade", "normal", "right"),
    say("lestrade", "我干这行这么多年，没见过这么怪的案子。", "Beats anything I have seen, and I am no chicken.", face="normal"),
    say("holmes", "你们确定没有伤口？那这些血是另一个人的——如果是凶杀，多半是凶手的。", "You are sure there is no wound? Then this blood belongs to a second individual — presumably the murderer, if murder has been committed.", face="normal"),
    think("屋里有三样东西值得细看。他会全看一遍，可我只看得清一样。", "There are three things here worth a close look. He will see all of them; I can only take in one properly."),
], [
    choice("lips", "dilemma", T("以医生的身份，检查死者的脸和嘴唇。", "As a doctor, examine the dead man's face and lips."), [
        think("没有勒痕，没有伤口。嘴唇上有一股酸涩的气味……像某种药。", "No marks of strangulation, no wound. On the lips, a faint sour smell… like some drug."),
        say("holmes", "你也闻到了，医生。", "You have smelt it too, Doctor.", face="normal"),
    ], clue("lips") + [rel("holmes", "esteem", 1)], values=["zhen"]),
    choice("ring", "dilemma", T("看他们把尸体抬起来。", "Watch them lift the body."), [
        nar("尸体一抬起来，一枚戒指叮的一声掉在地上。雷斯垂德捡起来——是一枚女人的金质结婚戒指。", "As they raised him, a ring tinkled down and rolled across the floor. Lestrade snatched it up — a woman's plain gold wedding ring."),
        say("lestrade", "上帝啊，这下更乱了。", "This complicates matters. Heaven knows, they were complicated enough before.", face="surprised"),
        think("一个死去的男人，身上带着一个女人的结婚戒指。", "A dead man, carrying a woman's wedding ring."),
    ], clue("ring") + [rel("lestrade", "trust", 1)], values=["zhen"]),
    choice("wall", "dilemma", T("拿起蜡烛，看墙角墙纸剥落的地方。", "Take the candle and look at the corner where the paper has peeled."), [
        nar("烛光下，粗糙的灰泥上用血写着一个词：", "In the candlelight, scrawled in blood-red letters across the bare yellow plaster, a single word:"),
        nar("墙上的字是：RACHE", "RACHE"),
        think("Rache……我在阿富汗的德国军医那里听过这个词。", "Rache… I heard that word from the German surgeons in Afghanistan."),
    ], clue("rache"), values=["zhen"]),
], order=2, cast=["holmes", "lestrade"])

C3_RACHEL = scene("c3_rachel", "c3", "main", T("“蕾切尔”", "'Rachel'"), [
    bg("lauriston_in"),
    cg("cg_rache"),
    show("lestrade", "smile", "right"),
    say("lestrade", "写字的人本来要写“Rachel”这个女人的名字，还没写完就被打断了。等着瞧吧，这个案子查清楚，准有个叫蕾切尔的女人。", "It means that the writer was going to put the female name Rachel, but was disturbed before he or she had time to finish. You mark my words, when this case comes to be cleared up, you will find that a woman named Rachel has something to do with it.", face="smile"),
    cg("cg_lens"),
    nar("福尔摩斯掏出卷尺和一个大放大镜，在屋里无声地走来走去，时而跪下，时而趴在地上，又从地板上小心地收起一小撮灰。", "Holmes whipped a tape measure and a large round magnifying glass from his pocket and trotted noiselessly about the room, sometimes stopping, occasionally kneeling, and once lying flat upon his face. He gathered up very carefully a little pile of grey dust from the floor."),
    cgoff(),
    show("holmes", "normal", "center"),
    say("holmes", "这里发生了凶杀，凶手是个男人。他身高六英尺以上，正当壮年，以身高来说脚偏小，穿方头粗皮靴，抽特里奇诺波利雪茄。", "There has been murder done, and the murderer was a man. He was more than six feet high, was in the prime of life, had small feet for his height, wore coarse, square-toed boots and smoked a Trichinopoly cigar.", face="normal"),
    say("holmes", "他和死者坐一辆四轮马车来，拉车的马有三只旧蹄铁，右前腿上是新的。凶手多半脸色红润，右手指甲很长。", "He came here with his victim in a four-wheeled cab, which was drawn by a horse with three old shoes and one new one on his off fore-leg. In all probability the murderer had a florid face, and the finger-nails of his right hand were remarkably long.", face="normal"),
    say("gregson", "要是凶杀，是怎么杀的？", "If this man was murdered, how was it done?", face="surprised"),
    say("holmes", "毒。", "Poison.", face="normal"),
], [
    choice("german", "dilemma", T("开口：“Rache 是德语，意思是‘复仇’。”", "Speak up: \"'Rache' is the German for 'revenge'.\""), [
        say("lestrade", "……德语？", "…German?", face="surprised"),
        say("holmes", "正是。别浪费时间找什么蕾切尔小姐了。", "Exactly. So don't lose your time by looking for Miss Rachel.", face="smile"),
        nar("雷斯垂德的脸一阵红一阵白。福尔摩斯朝我点了点头。", "Lestrade went red and white by turns. Holmes gave me a nod."),
    ], [rel("holmes", "esteem", 1), rel("holmes", "warmth", 1), rel("lestrade", "esteem", -1), add("deduce", 1)], values=["zhen"],
        req=HAS("rache"), hint=T("你没细看墙上的字", "You did not look closely at the word on the wall")),
    choice("laugh", "expression", T("忍不住笑出声。", "Fail to keep a straight face."), [
        say("lestrade", "医生觉得很好笑？", "The Doctor finds it amusing?", face="angry"),
        say("holmes", "临走前再说一句，雷斯垂德：Rache 是德语的“复仇”。别找什么蕾切尔小姐了。", "One other thing, Lestrade. 'Rache' is the German for 'revenge'; so don't lose your time by looking for Miss Rachel.", face="smile"),
    ], [rel("lestrade", "warmth", -1), rel("lestrade", "trust", -1)], values=["hen"]),
    choice("quiet", "expression", T("什么也不说，把一切都记在本子上。", "Say nothing, and write everything down."), [
        say("holmes", "临走前再说一句，雷斯垂德：Rache 是德语的“复仇”。别找什么蕾切尔小姐了。", "One other thing, Lestrade. 'Rache' is the German for 'revenge'; so don't lose your time by looking for Miss Rachel.", face="smile"),
        think("我把他说的每一个细节都记了下来。总有一天，我要弄明白他是怎么看出来的。", "I wrote down every detail he gave. Some day I would understand how he saw it."),
    ], [rel("holmes", "trust", 1), setv("flag.notebook")], values=["ren"]),
], order=3, cast=["holmes", "lestrade", "gregson"])

# ---------------- 第四章 · 盘问兰斯（这里能自由说话，见 talk.py） ----------------
C4_RANCE = scene("c4_rance", "c4", "main", T("警员兰斯", "Constable Rance"), [
    bg("street_fog"),
    nar("发现尸体的是警员约翰·兰斯。我们在他家门口把他从床上叫了起来，他一脸不高兴。", "The constable who found the body was John Rance. We roused him from his bed, and he did not look pleased."),
    show("rance", "normal", "center"),
    say("rance", "我在局里已经报告过了。", "I made my report at the office.", face="normal"),
    show("holmes", "normal", "left"),
    say("holmes", "我们想听你亲口讲一遍。", "We thought that we should like to hear it all from your own lips.", face="normal"),
    say("rance", "夜里两点，我看见那座空屋的窗户里有光。我进去，看见他躺在地上。我出来吹哨子，门口……", "About two in the morning I saw a light in the window of that empty house. I went in and found him lying there. I came out to blow my whistle, and at the gate…", face="normal"),
    say("rance", "门口有个醉汉，靠在栏杆上，扯着嗓子唱什么《哥伦拜恩的新式旗帜》。醉得站都站不稳。", "He was at the gate when I came out, a-leanin' up ag'in the railings, and a-singin' at the pitch o' his lungs about Columbine's New-fangled Banner. He couldn't stand, far less help.", face="smile"),
    think("一个醉汉，偏偏在凶杀现场的门口。", "A drunk man — at the gate of a murder house, of all places."),
], [
    choice("ask_face", "dilemma", T("追问：“那个醉汉长什么样？手里拿着什么？”", "Press him: \"What was the drunk man like? What was he holding?\""), [
        say("rance", "高个子，红脸，下半张脸裹着围巾……手里？好像拿着一根马鞭。", "A tall man, red-faced, the lower part muffled round… In his hand? A whip, I think.", face="normal"),
        say("holmes", "马鞭！他把马车停在哪儿了？……兰斯，你这辈子就毁在这儿了：那个人就是我们要找的人。", "A whip! And where was his cab? …Rance, that man is the very one we want. You had him in your hands.", face="angry"),
        think("他回来，是为了找那枚戒指。", "He came back — for the ring."),
    ], clue("drunk") + [rel("holmes", "esteem", 1)], values=["zhen"]),
    choice("pay", "expression", T("学福尔摩斯，掏出半个金镑放在桌上。", "Like Holmes, lay a half-sovereign on the table."), [
        say("rance", "……先生要知道什么，尽管问。", "…Whatever you want to know, sir, ask away.", face="smile"),
        say("rance", "那醉汉个子很高，脸红红的，围巾裹着下巴。我们把他扶起来，他就走了。", "He was a tall chap, red-faced, his chin wrapped up. We stood him up and he went off.", face="normal"),
    ], clue("drunk") + [rel("rance", "warmth", 1)], values=["li"]),
    choice("leave", "expression", T("没什么好问的，一个醉汉而已。", "Nothing more to ask. Just a drunkard."), [
        say("holmes", "一个醉汉而已？华生，他就站在门口，等着我们去抓。", "Just a drunkard? Watson, he stood at the gate waiting to be caught.", face="sad"),
    ], [rel("holmes", "esteem", -1)]),
], order=1, cast=["rance", "holmes"])

C4_SCARLET = scene("c4_scarlet", "c4", "main", T("血字的研究", "A Study in Scarlet"), [
    bg("street_fog"),
    show("holmes", "smile", "center"),
    say("holmes", "要不是你，我可能就不去了，那就错过了我见过的最好的一项研究：一项血字的研究，嗯？", "I might not have gone but for you, and so have missed the finest study I ever came across: a study in scarlet, eh?", face="smile"),
    say("holmes", "生活这团无色的线里，贯穿着一根凶杀的红线。我们的责任，就是把它解开，抽出来，一寸一寸地暴露出来。", "There's the scarlet thread of murder running through the colourless skein of life, and our duty is to unravel it, and isolate it, and expose every inch of it.", face="normal"),
    say("holmes", "好了，现在去吃午饭，然后去听诺曼-聂鲁达。她的琴弓真是了不起。", "And now for lunch, and then for Norman Neruda. Her attack and her bowing are splendid.", face="smile"),
], [
    choice("concert", "expression", T("陪他去听音乐会。", "Go to the concert with him."), [
        nar("那天下午，他在音乐厅里闭着眼，手指轻轻打着拍子，像是换了一个人。", "That afternoon in the concert hall he sat with his eyes closed and his long thin fingers waving in time — a different man."),
    ], [rel("holmes", "warmth", 1)], values=["qing"]),
    choice("rest", "expression", T("回去休息。这一天够累了。", "Go home and rest. It has been a long day."), [
        think("我躺在沙发上，想睡，却一直看见那张扭曲的脸。", "I lay on the sofa, trying to sleep, and kept seeing that contorted face."),
    ], []),
], order=2, cast=["holmes"])

# ---------------- 第五章 · 广告 ----------------
C5_VISITOR = scene("c5_visitor", "c5", "main", T("老太太", "The Old Woman"), [
    bg("baker_night"),
    show("holmes", "normal", "center"),
    say("holmes", "我用你的名字登了一则失物招领：布里克斯顿路拾获金戒指一枚。凶手冒险回去找过一次，他还会再来找。", "I have put an advertisement in every paper this morning in your name: a wedding ring found in Brixton Road. The man risked going back for it once. He will come for it again.", face="normal"),
    say("holmes", "我的左轮手枪在抽屉里。他要是硬来，你就用它。", "I have my old service revolver here. If he is desperate, you must be ready.", face="normal"),
    nar("门铃响了。进来的不是凶手，而是一个满脸皱纹、步履蹒跚的老太太。", "The bell rang. It was not the murderer who came in, but a very old and wrinkled woman, hobbling into the room."),
    say("sawyer", "先生，这是我女儿萨莉的结婚戒指。她丈夫要是知道她丢了戒指……", "It's my Sally's wedding ring, sir. If her husband knew she'd lost it…", face="sad"),
    hide("holmes"),
    think("福尔摩斯朝我递了个眼色。戒指要不要还给她？", "Holmes gave me a look. Do I give her the ring?"),
], [
    choice("give", "expression", T("把戒指给她，记下她的地址。福尔摩斯会跟上去。", "Give her the ring and take her address. Holmes will follow her."), [
        nar("她连声道谢，蹒跚着出了门。福尔摩斯一把抓起大衣，跟着下了楼。", "She thanked me and hobbled out. Holmes snatched up his ulster and was down the stairs after her."),
        nar("快到半夜他才回来，一进门就大笑起来，笑的是他自己。", "He came back near midnight, and burst into a laugh at his own expense."),
        show("holmes", "smile", "center"),
        say("holmes", "她在马车开动时跳了下去，我连影子都没看见。那不是老太太——那一定是个年轻人，身手敏捷，还是个了不起的演员。", "She jumped out while the cab was moving, and I never saw her go. It must have been a young man, and an active one, too, besides being an incomparable actor.", face="smile"),
        say("holmes", "凶手不是一个人。他有同伙，而且同伙肯为他冒险。", "Our man is not alone. He has a friend who is ready to risk something for him.", face="normal"),
    ], clue("accomplice"), values=["ren"]),
    choice("press", "dilemma", T("先问她几个问题：萨莉住哪？她丈夫是做什么的？", "Ask her a few questions first: where does Sally live, what is her husband?"), [
        say("sawyer", "哎呀，先生，我老了，记不清……她丈夫是船上的乘务员……", "Oh, sir, I'm old, I can't recall… her husband's a steward on a ship…", face="surprised"),
        nar("她答得颠三倒四，可手指抓戒指的动作快得出奇。她一出门，福尔摩斯就追了出去。", "Her answers wandered, but her fingers closed on the ring remarkably fast. The moment she left, Holmes was after her."),
        nar("半夜他回来了：人在马车上跑了。", "At midnight he came back: she had slipped out of the cab."),
        say("holmes", "你问得太急了，华生。那人已经起了疑心。", "You pressed too hard, Watson. Our friend has taken alarm.", face="sad"),
    ], [add("alert", 1)] + clue("accomplice"), values=["zhen"]),
    choice("keep", "dilemma", T("不给。这枚戒指是证物。", "Refuse. The ring is evidence."), [
        say("sawyer", "……那就算了，先生，算了。", "…Never mind then, sir, never mind.", face="sad"),
        nar("她一转身就走，快得不像个老太太。福尔摩斯追出去，在街角就跟丢了。", "She was off at once, far too quickly for an old woman. Holmes ran after her and lost her at the corner."),
        say("holmes", "我们手里还有戒指，可也打草惊蛇了。", "We still have the ring. But we have shown our hand.", face="normal"),
    ], [add("alert", 2), rel("holmes", "trust", -1)], values=["li"]),
], order=1, cast=["holmes", "sawyer"])

# 打草惊蛇到线：他会更小心（风险变量必须咬人）
X_ALERT = scene("x_alert", "*", "interrupt", T("报纸", "The Papers"), [
    bg("baker_day"),
    show("holmes", "angry", "center"),
    nar("第二天，几份报纸都登了“警方已掌握重要线索”的消息，引的是葛莱森的话。", "Next day several papers carried 'the police have an important clue', quoting Gregson."),
    say("holmes", "现在他知道有人在找他了。他会更小心，我们得更快。", "Now he knows that he is hunted. He will be more careful, and we must be quicker.", face="angry"),
], [
    choice("ok", "expression", T("“我能做什么？”", "\"What can I do?\""), [say("holmes", "等着。还有，把你的枪擦干净。", "Wait. And clean your revolver.", face="normal")], [setv("flag.hope_warned")]),
], order=-1, when=ALL(V("alert", ">=", 2), NF("flag.hope_warned")))

# ---------------- 第六章 · 葛莱森、斯坦格森、两颗药丸 ----------------
C6_GREGSON = scene("c6_gregson", "c6", "main", T("葛莱森的功劳", "Gregson Shows What He Can Do"), [
    bg("baker_day"),
    nar("一群衣衫褴褛的流浪儿冲上楼来，领头的叫维金斯。他们是福尔摩斯的“贝克街分队”。", "A dozen ragged street Arabs came clattering up the stairs, led by one Wiggins: Holmes's Baker Street division of the detective police force."),
    nar("他们刚走，葛莱森就来了，得意洋洋。", "They had hardly gone when Gregson arrived, radiant."),
    show("gregson", "smile", "right"),
    say("gregson", "案子破了！我抓到了亚瑟·夏庞蒂埃，海军中尉。德雷伯住在他母亲的公寓里，喝醉了侮辱他妹妹，他拿着棍子追了出去。", "The case is solved! I have arrested Arthur Charpentier, sub-lieutenant in Her Majesty's Navy. Drebber lodged at his mother's house, insulted his sister in drink, and he went after him with a stick.", face="smile"),
    show("lestrade", "sad", "left"),
    say("lestrade", "约瑟夫·斯坦格森——德雷伯的秘书——今天早上六点钟，在哈利戴旅馆被人杀了。", "Joseph Stangerson — Drebber's secretary — was murdered at Halliday's Private Hotel about six o'clock this morning.", face="sad"),
    say("lestrade", "心口一刀。墙上，血写着同一个词：RACHE。", "Stabbed in the side. And above him, written in blood, the same word: RACHE.", face="sad"),
    say("lestrade", "他口袋里有一封电报，上面写着“J·H 在欧洲”。还有一个小盒子，里面有两颗药丸。", "In his pocket, a telegram reading 'J. H. is in Europe.' And a little box with two pills in it.", face="normal"),
], [
    choice("pills", "dilemma", T("提议：“用房东太太那条快不行的老狗试试那两颗药丸。”", "Suggest it: \"Try the pills on the landlady's poor old terrier.\""), [
        say("holmes", "医生，你和我想到一块儿了。", "Doctor, you are ahead of me.", face="surprised"),
        nar("半颗药丸泡进牛奶，那条狗喝下去，什么事也没有。另外半颗放进去，它舔了一口，四肢一抽，倒下死了。", "Half of one pill in milk: the dog lapped it and nothing happened. Half of the other: it gave a convulsive shiver and lay as rigid as though struck by lightning."),
        say("holmes", "两颗药，一颗剧毒，一颗无害。", "Of the two pills, one was of the most deadly poison, and the other was entirely harmless.", face="normal"),
    ], clue("pills") + [rel("holmes", "esteem", 1), add("deduce", 1)], values=["zhen"]),
    choice("watch", "expression", T("看福尔摩斯怎么处理那两颗药丸。", "Watch what Holmes does with the pills."), [
        nar("福尔摩斯把两颗药丸各取一半，喂给房东太太那条快死的老狗。第一颗没事，第二颗一下去，狗就死了。", "Holmes gave half of each pill to the landlady's dying terrier. The first did nothing. With the second, the creature died at once."),
        say("holmes", "两颗药，一颗剧毒，一颗无害。", "Of the two pills, one was of the most deadly poison, and the other was entirely harmless.", face="normal"),
    ], clue("pills"), values=["ren"]),
    choice("telegram", "dilemma", T("盯着那封电报：J·H 是谁？", "Fix on the telegram: who is J. H.?"), [
        think("J·H 在欧洲。有人从美国追了过来，追了很多年。", "J. H. is in Europe. Someone followed them from America — for years."),
        nar("葛莱森和雷斯垂德还在争论，福尔摩斯已经把药丸喂给了房东太太的老狗：一颗无害，一颗剧毒。", "While Gregson and Lestrade argued, Holmes had fed the pills to the landlady's old dog: one harmless, one deadly."),
    ], clue("telegram") + clue("pills"), values=["zhen"]),
], order=1, cast=["holmes", "gregson", "lestrade"])

# ---------------- 推理问答：福尔摩斯揭晓之前，华生先说 ----------------
def q(id, order, ask, opts):
    return scene(id, "c6", "main", T("推理", "Deduction"), [bg("baker_day"), think(*ask)], opts, order=order, cast=["holmes"])

Q1 = q("c6_q1", 2, ("先别看他。我自己来想：凶手是谁？", "Don't look at him. Think it through myself: who is the murderer?"), [
    choice("cab", "dilemma", T("一个赶马车的人。", "A man who drives a cab."), [think("车辙、马鞭、门口那个“醉汉”。他就在马车上，在伦敦的大街上，没人会多看他一眼。", "The ruts, the whip, the 'drunkard' at the gate. He drives a cab — no one in London looks twice at a cabman.")],
           [add("deduce", 1)], values=["zhen"], req=ANY(HAS("cab"), HAS("drunk")), hint=T("你还没把马车和醉汉连起来", "You have not yet connected the cab and the drunkard")),
    choice("arthur", "expression", T("亚瑟·夏庞蒂埃，葛莱森抓的那个人。", "Arthur Charpentier, Gregson's man."), [think("可斯坦格森死的时候，他已经被关起来了。", "But he was in custody when Stangerson died.")], []),
    choice("rachel", "expression", T("一个叫蕾切尔的女人。", "A woman named Rachel."), [think("……雷斯垂德的说法。", "…Lestrade's theory.")], []),
    choice("pass", "expression", T("我不知道。等福尔摩斯说。", "I don't know. I'll wait for Holmes."), [think("我还没看清。", "I can't see it yet.")], []),
])
Q2 = q("c6_q2", 3, ("他是怎么杀死德雷伯的？", "How did he kill Drebber?"), [
    choice("pills", "dilemma", T("两颗药丸，一颗有毒一颗无害，让对方先挑——像是交给命运裁决。", "Two pills, one poisoned and one harmless; he made the other man choose — a judgement left to chance."), [think("死者脸上的恐惧……他知道自己挑错了。", "The horror on the dead man's face… he knew he had chosen wrong.")],
           [add("deduce", 1)], values=["zhen"], req=HAS("pills"), hint=T("你没注意到那两颗药丸的秘密", "You missed the secret of the two pills")),
    choice("stick", "expression", T("用棍子打死的。", "Beaten with a stick."), [think("可尸体上没有伤。", "But there was no wound on the body.")], []),
    choice("drink", "expression", T("在他的酒里下了毒。", "Poisoned his drink."), [think("也许……可那两颗药丸又是怎么回事？", "Perhaps… but then why the two pills?")], []),
])
Q3 = q("c6_q3", 4, ("为什么？", "Why?"), [
    choice("revenge", "dilemma", T("复仇。为了那枚结婚戒指的主人——一个已经死去的女人。", "Revenge. For the woman the wedding ring belonged to — a woman who is dead."), [think("Rache。一个女人的戒指。从美国追到欧洲。这不是抢劫，是讨债。", "Rache. A woman's ring. From America to Europe. Not robbery — a debt being collected.")],
           [add("deduce", 1)], values=["qing"], req=ALL(HAS("ring"), ANY(HAS("rache"), HAS("telegram"))), hint=T("你缺一条线索：戒指，或者墙上的字", "You are missing a clue: the ring, or the word on the wall")),
    choice("rob", "expression", T("为了钱。", "For money."), [think("可德雷伯的金表和钱包都还在。", "But Drebber's gold watch and purse were untouched.")], []),
    choice("secret", "expression", T("政治暗杀，某个秘密会社。", "A political killing by some secret society."), [think("报纸上是这么写的。", "That is what the papers say.")], []),
])

C6_ARREST = scene("c6_arrest", "c6", "main", T("落网", "The Arrest"), [
    bg("baker_day"),
    show("holmes", "normal", "center"),
    iff(V("deduce", ">=", 3), say("holmes", "华生，你脸上的表情告诉我，你已经知道了。", "Watson, I see from your face that you have it.", face="smile")),
    iff(V("deduce", "<=", 1), say("holmes", "你看了，华生，可你没有观察。", "You see, Watson, but you do not observe.", face="normal")),
    nar("门上轻轻一敲，维金斯探进头来：“马车在楼下了，先生。”", "A tap at the door, and young Wiggins put his head in. 'Please, sir, I have the cab downstairs.'"),
    say("holmes", "让车夫上来帮我捆一下箱子。", "Just ask him to step up, Wiggins, and help with my box.", face="normal"),
    nar("一个高大魁梧的车夫走进来，弯腰去抓箱子的皮带。只听咔嗒一声——福尔摩斯把一副手铐锁在了他的手腕上。", "A broad-shouldered cabman entered and bent to the strap of the box. There was a sharp click, the jangling of metal — Holmes had snapped a pair of handcuffs on his wrists."),
    iff(F("flag.hope_warned"), nar("那人像发了疯一样挣扎，四个人才把他按住。他早有防备。", "The man fought like a madman; it took four of us to hold him. He had been on his guard.")),
    cg("cg_arrest"),
    say("holmes", "先生们，请允许我介绍：杰弗逊·霍普先生，杀害伊诺克·德雷伯和约瑟夫·斯坦格森的凶手。", "Gentlemen, let me introduce you to Mr Jefferson Hope, the murderer of Enoch Drebber and of Joseph Stangerson.", face="smile"),
], [
    choice("hold", "expression", T("上前按住他。", "Step in and hold him."), [cgoff(), nar("他一点一点安静下来，喘着气，看着我们，脸上竟然带着一点笑。", "Little by little he went quiet, breathing hard, and looked at us with something like a smile.")],
           [rel("holmes", "trust", 1)], values=["yi"]),
    choice("look", "expression", T("看着他的脸。", "Look at his face."), [cgoff(), think("那不是一张凶手的脸。那是一个把一件事做完了的人的脸。", "It was not a murderer's face. It was the face of a man who had finished something.")], [], values=["qing"]),
], order=5, cast=["holmes", "hope", "gregson", "lestrade"])

NODES = [C3_ARRIVE, C3_ROOM, C3_RACHEL, C4_RANCE, C4_SCARLET, C5_VISITOR, X_ALERT, C6_GREGSON, Q1, Q2, Q3, C6_ARREST]
FLAGS = [("flag.notebook", "把福尔摩斯的推断都记在了本子上", "Wrote down all of Holmes's deductions"),
         ("flag.hope_warned", "凶手被惊动了", "The murderer was put on his guard")]
CLUES = [("cab", "车辙：一辆四轮出租马车", "Ruts: a four-wheeled cab"), ("boots", "方头靴的大步子", "The long stride of square-toed boots"),
         ("lips", "死者嘴唇上的药味", "A drug smell on the dead man's lips"), ("ring", "一枚女人的结婚戒指", "A woman's wedding ring"),
         ("rache", "墙上的 RACHE：德语“复仇”", "RACHE on the wall: German for 'revenge'"), ("drunk", "门口的“醉汉”拿着马鞭", "The 'drunkard' at the gate had a whip"),
         ("accomplice", "来取戒指的“老太太”是个年轻人", "The 'old woman' who came for the ring was a young man"),
         ("telegram", "电报：“J·H 在欧洲”", "The telegram: 'J. H. is in Europe'"), ("pills", "两颗药丸，一颗剧毒一颗无害", "Two pills: one deadly, one harmless")]
