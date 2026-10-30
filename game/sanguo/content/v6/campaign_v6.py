"""三国·谋士 卷六（南中，第85–90回）。

接着卷五：同名变量由上一卷带来；没玩过卷五的玩家从“前情”开始。先帝崩于白帝，后主即位；你在诸葛亮身边，做他的副手。
方针同卷五（决策记录 v2.11、v2.12）：大势不改——七擒七纵、南人不复反；能改的是代价：渡泸水死多少人、哑泉能不能早解、
盘蛇谷那一把火烧死多少藤甲兵。马谡这一卷献“攻心为上”，你对他的看法留给卷七。
原著引文只取公版原文，并已核对（见 sources）；其余叙述和英文都是我们自己写的。细纲见 docs/全书规划.md。
"""
import json, pathlib, sys
HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent))
from lib import *
import situations
import speech, values
from talks import topic, talk_node
from asks import ans

V5 = json.loads((HERE.parent / "v5" / "campaign_v5.json").read_text())

def flag(label, carry=True):
    d = {"type": "flag", "init": False, "label": label}
    if not carry: d["carry"] = False
    return d
def _neg(c):
    if "all" in c: return ANY(*[_neg(x) for x in c["all"]])
    if "any" in c: return ALL(*[_neg(x) for x in c["any"]])
    if c["op"] == ">=": return {**c, "op": "<=", "val": c["val"] - 1}
    if c["op"] == "<=": return {**c, "op": ">=", "val": c["val"] + 1}
    return {**c, "op": {"==": "!=", "!=": "=="}[c["op"]]}
def twin(cond, a, b):
    """the same option written twice: `a` shows when cond holds, `b` otherwise (effects can't be conditional)"""
    a["when"] = cond; b["when"] = _neg(cond); b["id"] = a["id"] + "_2"
    return [a, b]

AWAY = ANY(F("prev.ended_early"), V("track", "==", "cao"))
STAY = NF("flag.v6_hermit")
STAYING = ALL(NF("flag.v6_hermit"), NF("flag.v6_left"), NF("flag.v6_exposed"))
GUAN, FEI = F("flag.guan_alive"), F("flag.fei_alive")
WZ = ANY(F("flag.wz_west"), F("flag.wz_jingzhou"), F("flag.wz_huatuo"), F("flag.wz_wed"))
WED = F("flag.wz_wed")
BOOK = F("flag.wz_qingnang")

VARS = {k: v for k, v in json.loads(json.dumps(V5["vars"])).items() if not k.startswith(("heat.", "debt."))}
FLAGS = {
    "flag.v6_came_back": T("流落之后回到蜀中", "Came back to Shu after wandering"),
    "flag.v6_hermit": T("就此隐去", "Disappeared from the world"),
    "flag.v6_dengzhi": T("举荐邓芝出使东吴", "Recommended Deng Zhi as envoy to Wu"),
    "flag.v6_to_wu": T("亲自出使东吴", "Went to Wu as envoy yourself"),
    "flag.v6_masu_praise": T("当众称赞马谡“攻心为上”", "Praised Ma Su's 'win their hearts' in front of everyone"),
    "flag.v6_masu_doubt": T("把先帝说马谡的话告诉了丞相", "Told the Chancellor what the late emperor said about Ma Su"),
    "flag.v6_lushui": T("问出了泸水夜渡的法子", "Found out how to cross the Lu at night"),
    "flag.v6_cure": T("温芷认出了哑泉的解药", "Wen Zhi recognised the cure for the Mute Spring"),
    "flag.v6_water": T("下令全军不得饮没查过的水", "Ordered the army to drink no unchecked water"),
    "flag.v6_mercy": T("劝丞相在盘蛇谷留了一条出路", "Persuaded the Chancellor to leave a way out of Coiled Snake Valley"),
    "flag.v6_fire_plan": T("替丞相布置盘蛇谷的火", "Laid the fire in Coiled Snake Valley for the Chancellor"),
    "flag.v6_officials": T("劝丞相在南中留官", "Urged the Chancellor to leave officials in the south"),
    "flag.v6_left": T("被冷落后离开", "Left after being sidelined"),
    "flag.v6_exposed": T("妖人之名坐实", "Branded a sorcerer for good"),
}
for k, lab in FLAGS.items(): VARS[k] = flag(lab)

CHARS = json.loads(json.dumps(V5["chars"]))
CHARS["zhuge"]["persona"] = T("诸葛亮：丞相，受先帝托孤，四十五岁上下，事无大小都亲自过问；南征路上话比在成都多，夜里常一个人看地图。称玩家“子衡兄”。",
                              "Zhuge Liang: Chancellor, entrusted with the realm by the late emperor, about forty-five; he sees to everything himself, great and small. On the southern march he talks more than in Chengdu, and at night often studies the map alone. Calls the player Ziheng.")
CHARS["zhaoyun"]["persona"] = T("赵云：六十多岁，随丞相南征；话少，仗打得还是很稳。称玩家“先生”。",
                                "Zhao Yun: past sixty, marching south with the Chancellor; few words, and still the steadiest fighter in the army. Calls the player Master.")
CHARS["wenzhi"]["persona"] = T("温芷：随军的大夫，南中的瘴气、毒泉、蛇虫，都是她头一回见；忙起来不说话，闲下来话也不多。称玩家“子衡”。",
                               "Wen Zhi: physician with the army; the fevers, poisoned springs and snakes of the south are all new to her. She says nothing when she's busy and not much when she isn't. Calls the player Ziheng.")
DIMS = dict(V5["dims"])
for c in CHARS:
    if CHARS[c].get("heat"):
        VARS[f"heat.{c}"] = {"type": "num", "init": 0, "min": 0, "max": 5, "char": c, "show": False, "carry": False,
                             "label": T(CHARS[c]["name"]["zh"] + "·火气", CHARS[c]["name"]["en"] + " · Temper")}

ECHOES = {
    "e_wu": T("东吴那一趟，是你促成的", "The mission to Wu was your doing"),
    "e_praise": T("你当众称赞过马谡", "You praised Ma Su in front of everyone"),
    "e_doubt": T("你把先帝那句话告诉了丞相", "You told the Chancellor what the late emperor said"),
    "e_release": T("第一次放孟获，你劝过", "You argued for letting Meng Huo go the first time"),
    "e_lushui": T("泸水夜渡的法子，是你问来的", "You were the one who found out how to cross the Lu at night"),
    "e_cure": T("哑泉的解药，温芷先认出来了", "Wen Zhi was the first to recognise the cure for the Mute Spring"),
    "e_mercy": T("盘蛇谷那条出路，是你劝着留的", "The way out of Coiled Snake Valley was your doing"),
}

SIDE_PROMPT = T("这段日子，你只来得及做一件事。", "These days you only have time for one thing.")
CHAPTERS = [
    {"id": "c1", "title": T("邓芝", "Deng Zhi"), "year": T("建兴元年（223）", "Jianxing 1 (223)"), "canon": T("第85–86回", "Ch. 85–86"), "offer": 2,
     "intro": [P(T("先帝葬在惠陵，太子即位。曹丕趁丧起五路大兵来攻。丞相闭门不出，几天以后，四路都退了，只剩东吴一路。他说：要重新和东吴交好。", "The late emperor is laid to rest; the Crown Prince takes the throne. Cao Pi seizes the moment and sends five armies at once. The Chancellor shuts his doors for days, and when he opens them, four of the five have turned back—only Wu remains. He says: we must make friends with Wu again.")),
               P(T("白帝城回来以后，你和丞相，一个管外，一个管内。", "Since Baidi, you and the Chancellor divide the work: he the inside, you the outside."), F("flag.v5_entrusted"))]},
    {"id": "c2", "title": T("攻心", "Winning Hearts"), "year": T("建兴三年（225）", "Jianxing 3 (225)"), "canon": T("第87回", "Ch. 87"), "offer": 2,
     "intro": [P(T("南中的雍闿、高定、朱褒反了，蛮王孟获起兵相应。丞相亲自南征，你随军。出城那天，马谡来送行。", "In the south, Yong Kai, Gao Ding and Zhu Bao have rebelled, and the Man king Meng Huo has risen with them. The Chancellor marches south himself, and you go with him. On the day you leave the city, Ma Su comes to see you off."))]},
    {"id": "c3", "title": T("泸水", "The Lu River"), "year": T("建兴三年（225）", "Jianxing 3 (225)"), "canon": T("第88回", "Ch. 88"), "offer": 2,
     "intro": [P(T("五月，到了泸水边。天热得像在火上烤。河对岸，孟获又聚起了人马。", "The fifth month, and you reach the Lu River. The heat is like being roasted over a fire. On the far bank, Meng Huo has gathered his men again."))]},
    {"id": "c4", "title": T("哑泉", "The Mute Spring"), "year": T("建兴三年（225）", "Jianxing 3 (225)"), "canon": T("第89回", "Ch. 89"), "offer": 2,
     "intro": [P(T("孟获逃进了秃龙洞。往那边去的路，只有两条，一条被石头塞住了，另一条，听说有四口毒泉。", "Meng Huo has fled to Bald Dragon Cave. There are only two roads there; one is blocked with rocks, and on the other, they say, are four poisoned springs."))]},
    {"id": "c5", "title": T("藤甲", "The Rattan Armour"), "year": T("建兴三年（225）", "Jianxing 3 (225)"), "canon": T("第90回", "Ch. 90"), "offer": 2,
     "intro": [P(T("孟获请来了乌戈国的兀突骨。他的兵穿藤甲：藤在油里泡半年，晒干了再泡，刀箭皆不能入，渡河不沉。", "Meng Huo has called in Wutugu of Wuge. His men wear rattan armour: the rattan is soaked in oil for half a year, dried, soaked again—blades and arrows cannot get in, and it floats across rivers."))]},
    {"id": "c6", "title": T("七擒", "The Seventh Capture"), "year": T("建兴三年秋（225）", "Autumn, Jianxing 3 (225)"), "canon": T("第90回", "Ch. 90"), "offer": 1,
     "intro": [P(T("孟获第七次被押进了帐。", "For the seventh time, Meng Huo is brought into the tent in bonds."))]},
]

N = []
def cast_(*ids): return [{"id": i} for i in ids]

N.append(node("x_return6", "*", "interrupt", T("故人来信", "A Letter from an Old Friend"), "free", T("原创", "original"),
    [P(T("你离开蜀中已经好多年了。", "It has been many years since you left Shu."), F("prev.ended_early")),
     P(T("你在北方住了很多年。曹丕做了皇帝，又在打东吴。", "You've lived in the north for many years. Cao Pi is emperor, and at war with Wu again."), V("track", "==", "cao")),
     P(T("丞相的信只有一句：『先帝走了。亮一个人，忙不过来。』", "The Chancellor's letter is one line long: 'The late emperor is gone. I can't manage alone.'"))],
    [choice("back", "dilemma", T("动身去成都。", "Set out for Chengdu."),
            T("丞相在相府门口等你，鬓角白了。他说：『来了就好，先吃饭。』", "The Chancellor waits at the gate of his offices, grey at the temples. 'You're here. Good. Eat first.'"),
            [setv("flag.v6_came_back"), setv("track", "liu"), rel("zhuge", "warmth", 1)]),
     choice("hermit", "expression", T("把信收好，不去了。", "Put the letter away. You won't go."),
            T("那年秋天，你听说丞相去了南边，打了好几仗，抓了一个人七次。", "That autumn you hear the Chancellor has gone south, fought several battles, and caught one man seven times."), [setv("flag.v6_hermit")])],
    when=AWAY, order=-2))
N[-1]["choices"][1]["ends"] = True

# ---------- c1 邓芝 ----------
N.append(node("c1_wu", "c1", "main", T("谁去东吴", "Who Goes to Wu"), "functional", T("第85–86回", "Ch. 85–86"),
    [P(T("丞相说，和东吴的仇，先放下；去东吴的人，要能说话，也要不怕死。孙权在殿前支了一口油鼎，等着来使。他问你：谁去？", "The Chancellor says the feud with Wu must be set aside for now; whoever goes must be able to talk and must not fear death. Sun Quan has set a cauldron of boiling oil before his hall to greet the envoy. He asks you: who goes?")),
     P(T("关羽在一旁冷着脸：『和东吴交好？荆州呢？』", "Guan Yu, beside him, is stony. 'Friends with Wu? And Jingzhou?'"), GUAN)],
    [choice("dengzhi", "strategy", T("举荐邓芝：他见过孙权，也不怕那口锅。", "Recommend Deng Zhi: he's met Sun Quan, and he isn't afraid of that cauldron."),
            T("邓芝去了。他在油鼎前大笑，说孙权连一个儒生都怕。孙权撤了鼎，两家又结了盟。丞相说：『子衡兄识人。』", "Deng Zhi goes. Before the cauldron he laughs aloud and says Sun Quan is afraid of a mere scholar. Sun Quan has the cauldron taken away, and the two houses are allied again. The Chancellor says, 'You know your men, Ziheng.'"),
            [setv("flag.v6_dengzhi"), rel("zhuge", "esteem", 1), add("renown.cunning")], echo=["e_wu"]),
     choice("go", "dilemma", T("说：我去。", "Say: I'll go."),
            [P(T("你站在油鼎前，热气扑在脸上。你说：西蜀有山川之险，东吴有三江之固，两家合则进可兼并天下，分则都不保。孙权看了你很久，让人撤了鼎。", "You stand before the cauldron, the heat on your face. You say: Shu has its mountains, Wu its three rivers; together they could take the realm, apart neither is safe. Sun Quan looks at you a long time, and has the cauldron taken away.")),
             P(T("孙权问你：『麦城那天，拉住关羽马的人，是不是你？』你说是。他笑了：『那这盟，我信得过。』", "Sun Quan asks you, 'That day at Maicheng—were you the one who caught Guan Yu's bridle?' You say yes. He laughs. 'Then this alliance I can trust.'"), GUAN)],
            [setv("flag.v6_to_wu"), rel("zhuge", "trust", 1), rel("zhuge", "esteem", 1), add("renown.loyal")], echo=["e_wu"]),
     choice("wait", "expression", T("说：先等东吴来求我们。", "Say: let Wu come to us first."),
            T("丞相摇了摇头，还是派了邓芝。", "The Chancellor shakes his head and sends Deng Zhi all the same."), [rel("zhuge", "esteem", -1)])],
    when=STAY, order=10))

N.append(node("c1_qinmi", "c1", "side", T("天有头乎", "Has Heaven a Head?"), "free", T("第86回", "Ch. 86"),
    T("东吴回访的使者张温在宴席上，仗着酒意，考问蜀中的学士。学士秦宓喝醉了，坐在你旁边，捅了捅你：『先生，他问天有没有头，你说我答，还是你答？』", "At the banquet, Zhang Wen, Wu's return envoy, grows bold with wine and starts quizzing the scholars of Shu. Qin Mi, drunk, sits beside you and nudges you. 'Sir, he's asking whether Heaven has a head. Shall I answer, or will you?'"),
    [choice("qinmi", "expression", T("让秦宓答。", "Let Qin Mi answer."),
            T("秦宓站起来，从《诗经》答到《易经》，天有头、有耳、有足、有姓——姓刘。张温哑口无言，宴席上笑声不断。", "Qin Mi stands and answers from the Songs to the Changes: Heaven has a head, ears, feet, and a surname—Liu. Zhang Wen is struck dumb, and the banquet roars with laughter."),
            [add("renown.cunning")]),
     choice("self", "strategy", T("你来答，留张温一点面子。", "Answer yourself, and leave Zhang Wen some dignity."),
            T("你答得客气，张温也接得客气。散席时他对你拱手：『蜀中有人。』", "You answer courteously, and Zhang Wen takes it courteously. As the banquet breaks up, he bows to you. 'Shu has men.'"),
            [add("renown.loyal"), rel("zhuge", "esteem", 1)])],
    when=STAY, salience=2, order=1))

N.append(node("c1_home", "c1", "side", T("成亲以后", "After the Wedding"), "free", T("原创人物", "original character"),
    T("回成都以后，你和温芷成了亲。院子里种了药，也种了一棵梅。她问你：要是打仗，你还走不走？", "Back in Chengdu, you and Wen Zhi married. The yard has herbs in it now, and a plum tree. She asks you: if there's war again, will you go?"),
    [choice("yes", "dilemma", T("说：走。你也一起。", "Say: I'll go. And you'll come too."),
            T("她笑了：『我本来就要去。』", "She laughs. 'I was going anyway.'"), [rel("wenzhi", "intimacy", 1), rel("wenzhi", "trust", 1)]),
     choice("stay", "strategy", T("说：这回你留下，替我守着院子。", "Say: this time you stay and keep the house for me."),
            T("她没说话，第二天，把药箱放在了门口。", "She says nothing. The next day her medicine chest is by the door."), [rel("wenzhi", "warmth", 1)])],
    when=ALL(WED, STAY), salience=4, order=2))

N.append(node("c1_wz_south", "c1", "side", T("医馆", "The Clinic"), "free", T("原创人物", "original character"),
    T("温芷的医馆收了几个学徒。她听说丞相要南征，来问你：南边的病，她一样都没见过，该带什么药？", "Wen Zhi's clinic has taken on a few apprentices. She's heard the Chancellor is going south and asks you: she's never seen any of the southern sicknesses—what medicines should she bring?"),
    [choice("ask", "strategy", T("陪她去找从南中来的商人，一样一样地问。", "Go with her to find merchants from the south and ask about every one."),
            T("你们问了十几天，记了满满一本。她说，这本子比药还重要。", "You spend more than ten days asking and fill a whole notebook. She says the notebook matters more than the medicine."),
            [rel("wenzhi", "esteem", 1), rel("wenzhi", "trust", 1)]),
     choice("come", "dilemma", T("说：你跟着去，见了再说。", "Say: come along and we'll see when we get there."),
            T("她点点头，开始收拾药箱。", "She nods and starts packing her chest."), [rel("wenzhi", "intimacy", 1)])],
    when=ALL(WZ, NF("flag.wz_wed"), STAY), salience=3, order=2))

N.append(node("c1_brothers", "c1", "side", T("兄弟", "Brothers"), "free", T("原创", "original"),
    [P(T("关羽在先帝的灵前坐了一整夜。天亮时他对你说：『大哥把阿斗托给了丞相和你。我呢，就替他守着成都。』", "Guan Yu sat all night before the late emperor's tablet. At dawn he tells you, 'My brother left A Dou to the Chancellor and you. As for me, I'll keep Chengdu for him.'"), GUAN),
     P(T("张飞喝了三天酒，第四天把酒坛都砸了：『大哥不在了，俺得替他看着阿斗。』", "Zhang Fei drinks for three days. On the fourth he smashes every jar. 'Elder brother's gone. I've got to watch over A Dou for him.'"), ALL(FEI, NF("flag.guan_alive")))],
    [choice("sit", "dilemma", T("陪他坐一会儿。", "Sit with him a while."), T("你们谁都没说话。", "Neither of you says anything."), [add("renown.loyal")]),
     choice("south", "strategy", T("请他随丞相南征。", "Ask him to march south with the Chancellor."),
            T("他摇摇头：『南边的事，交给你们。成都得有人。』", "He shakes his head. 'The south is yours. Chengdu needs someone.'"), [add("renown.cunning")])],
    when=ALL(ANY(GUAN, FEI), STAY), salience=4, order=3))

# ---------- c2 攻心 ----------
N.append(node("c2_masu", "c2", "main", T("攻心为上", "Win Their Hearts"), "literal", T("第87回", "Ch. 87"),
    [P(T("马谡送了几十里，丞相问他有什么话。马谡说：南蛮仗着地远山险，今天打服了，明天又反。『攻心为上，攻城为下；心战为上，兵战为下。愿丞相但服其心足矣。』丞相叹道：『幼常足知吾肺腑也！』", "Ma Su rides along for dozens of li, and the Chancellor asks if he has anything to say. Ma Su says the southerners trust in distance and mountains; beat them today and they'll rise again tomorrow. Attacking hearts is best, attacking cities worst; war on the mind is best, war with troops worst. Let the Chancellor win their hearts and that will be enough. The Chancellor sighs that Youchang knows his very heart.")),
     P(T("你想起白帝城里，先帝压低了声音说的那句话。", "You remember what the late emperor said in Baidi, his voice very low."), F("flag.v5_masu"))],
    [choice("praise", "dilemma", T("当众说：幼常这番话，说得好。", "Say in front of everyone: Youchang has put it well."),
            T("马谡朝你深深一揖。丞相很高兴，回头又看了马谡一眼。", "Ma Su bows deeply to you. The Chancellor is pleased, and looks back at Ma Su once more."),
            [setv("flag.v6_masu_praise"), rel("zhuge", "warmth", 1)], echo=["e_praise"]),
     choice("doubt", "strategy", T("等马谡走了，私下对丞相说：先帝说过，此人言过其实，不可大用。", "When Ma Su has gone, tell the Chancellor privately: the late emperor said this man's words outrun his worth, and he must not be given great charge."),
            T("丞相沉默了很久：『亮知道。』他又说：『可他今天这句话，是对的。』", "The Chancellor is silent a long time. 'I know.' Then he adds, 'But what he said today was right.'"),
            [setv("flag.v6_masu_doubt"), rel("zhuge", "trust", 1), rel("zhuge", "warmth", -1)], echo=["e_doubt"], when=F("flag.v5_masu")),
     choice("plain", "expression", T("说：话是好话，能不能做到，要看到了南边。", "Say: fine words; whether they can be done, we'll see in the south."),
            T("马谡笑了笑，没说什么。", "Ma Su smiles and says nothing."), [rel("zhuge", "esteem", 1)])],
    quote=T("攻心为上，攻城为下；心战为上，兵战为下。……幼常足知吾肺腑也！",
            "Attacking hearts is best, attacking cities worst; war on the mind is best, war with troops worst. … Youchang knows my very heart!"),
    when=STAY, order=10))

N.append(node("c2_first", "c2", "main", T("一擒", "The First Capture"), "literal", T("第87回", "Ch. 87"),
    [P(T("孟获被王平、关索诱进山谷，捆了来。丞相问：『吾今擒汝，汝心服否？』孟获说：山路狭窄，误中你的计，怎么服？『汝放我回去，再整军马，共决雌雄；若能再擒吾，吾方服也。』丞相转头看你。", "Lured into a valley, Meng Huo is taken and brought in bound. The Chancellor asks whether, now he's been caught, his heart submits. Meng Huo says he fell into a trick on a narrow mountain road—why should he submit? Let him go, and he'll gather his men and fight it out; catch him again and he'll submit. The Chancellor turns to you."))],
    [choice("free", "dilemma", T("说：放。马谡说得对，要服的是心。", "Say: let him go. Ma Su is right—it's the heart that has to submit."),
            T("丞相笑了，让人给孟获松绑，赐酒，送他出营。孟获走的时候，一直回头看。", "The Chancellor smiles, has Meng Huo untied, gives him wine, and sees him out of the camp. Meng Huo keeps looking back as he goes."),
            [rel("zhuge", "esteem", 1), rel("zhuge", "warmth", 1)], echo=["e_release"]),
     choice("hold", "strategy", T("说：放他，但把他手下的几个头人留下，打听清楚南中的路。", "Say: let him go, but keep a few of his chieftains and learn the southern roads from them."),
            T("丞相想了想，留了两个人。后来这两个人领着蜀兵，走了好几条没人知道的小路。", "The Chancellor considers, and keeps two. Later those two lead the Shu army down several paths no one else knew."),
            [rel("zhuge", "esteem", 1), add("renown.cunning")]),
     choice("kill", "expression", T("说：杀了。放虎归山，后患无穷。", "Say: kill him. Let a tiger back into the hills and you'll never be rid of it."),
            T("丞相摇头：『杀一个孟获，南中还有十个孟获。』他还是放了。", "The Chancellor shakes his head. 'Kill one Meng Huo and the south has ten more.' He lets him go all the same."),
            [rel("zhuge", "esteem", -1)])],
    quote=T("吾今擒汝，汝心服否？……汝放我回去，再整军马，共决雌雄；若能再擒吾，吾方服也。",
            "\"I have taken you now—does your heart submit?\" … \"Let me go back, gather my army again, and we'll settle it; if you can take me again, then I'll submit.\""),
    callbacks=[cb("e_praise", T("马谡不在这里。可你说的那句“说得好”，丞相还记着。", "Ma Su isn't here. But the Chancellor still remembers you saying 'well put.'"), F("flag.v6_masu_praise"))],
    when=STAY, order=20))

N.append(talk_node("c2_zhuge", "c2", T("夜谈·诸葛亮", "Night Talk: Zhuge Liang"),
    T("南征路上的一个晚上，丞相把地图收起来，对你说：『子衡兄，今晚不看图了。陪亮坐坐。』", "One night on the march south, the Chancellor rolls up his map. 'No maps tonight, Ziheng. Sit with me a while.'"),
    "zhuge", 2,
    [topic("charge", T("问他：先帝那句“君可自取”，你怎么想？", "Ask him: what do you make of the late emperor's 'you may take it yourself'?"),
           T("丞相很久没说话。最后他说：『那句话，是先帝给亮的一把刀。亮这辈子，只能把刀柄朝着自己。』", "The Chancellor says nothing for a long time. At last: 'Those words were a knife the late emperor handed me. All my life I'll have to hold it by the blade.'"),
           [rel("zhuge", "trust", 1), rel("zhuge", "warmth", 1)]),
     topic("north", T("问他：打完南边呢？", "Ask him: and after the south?"),
           T("丞相把地图又摊开了一角，指着北边：『南边是为了北边。』他又把图卷上了，『今晚不说这个。』", "The Chancellor unrolls a corner of the map again and points north. 'The south is for the sake of the north.' He rolls it up again. 'Not tonight.'"),
           [rel("zhuge", "esteem", 1)]),
     topic("rest", T("劝他：事情不必都自己管。", "Tell him: you don't have to see to everything yourself."),
           T("丞相笑了：『子衡兄，你是第三个这么劝亮的人。』前两个是谁，他没说。", "The Chancellor smiles. 'You're the third man to tell me that, Ziheng.' He doesn't say who the first two were."),
           [rel("zhuge", "warmth", 2)])],
    T("你走的时候，丞相说：『白帝城那天，先帝把你的手和亮的手放在一起。亮记着。』", "As you leave, the Chancellor says, 'That day at Baidi, the late emperor laid your hand with mine. I remember.'"), when=STAY, order=30))
N[-1]["intro"].append(P(T("他看着你，像是有话要说，又咽了回去。", "He looks at you as if he has something to say, and swallows it."), NF("flag.v5_entrusted")))
N[-1]["leave_alt"] = None
N[-1]["choices"][0]["out"] = [P(T("你走的时候，丞相说：『白帝城那天，先帝把你的手和亮的手放在一起。亮记着。』", "As you leave, the Chancellor says, 'That day at Baidi, the late emperor laid your hand with mine. I remember.'"), F("flag.v5_entrusted")),
                              P(T("你走的时候，丞相说：『子衡兄，以后夜里，常来坐坐。』", "As you leave, the Chancellor says, 'Come and sit with me of an evening, Ziheng. Often.'"), NF("flag.v5_entrusted"))]
del N[-1]["leave_alt"]

# ---------- c3 泸水 ----------
N.append(node("c3_lushui", "c3", "main", T("泸水", "Crossing the Lu"), "literal", T("第88回", "Ch. 88"),
    [P(T("第一批过河的兵见水浅，没上筏子，光着身子蹚过去，走到河中间一个个倒下，抬到岸边，口鼻出血而死。丞相大惊。", "The first men across see the water is shallow, skip the rafts and wade over naked; halfway across they fall one after another, and when they're dragged to the bank, they die bleeding from mouth and nose. The Chancellor is aghast.")),
     P(T("河边有几个当地人，远远地看着，不说话。", "A few local people stand by the river at a distance, watching, saying nothing."))],
    [choice("ask", "strategy", T("走过去，给那几个当地人递上干粮，问他们怎么渡。", "Walk over, offer the locals some rations, and ask how to cross."),
            T("一个老人说：『若要渡时，须待夜静水冷，毒气不起，饱食渡之，方可无事。』那天夜里，大军吃饱了，一个不少地过了河。丞相对你说：『攻心，原来是这样攻的。』", "An old man tells you: to cross, wait for the quiet of night when the water is cold and the poison doesn't rise, eat well, then cross, and no harm will come. That night the army eats its fill and crosses without losing a man. The Chancellor says to you, 'So that's how you win hearts.'"),
            [setv("flag.v6_lushui"), rel("zhuge", "esteem", 2), add("renown.loyal")], echo=["e_lushui"]),
     choice("wz", "dilemma", T("去找温芷：这是什么毒？", "Go to Wen Zhi: what poison is this?"),
            T("温芷看了尸体，又试了水：『是热毒，太阳一晒就起来。』她说夜里水凉了也许能过。丞相照她说的试了，夜里果然过去了，只是试的那一次，又倒了几个人。", "Wen Zhi examines the dead and tests the water. 'It's a heat poison—the sun brings it up.' She thinks it might be crossed at night when the water cools. The Chancellor tries it her way, and at night it works—only, in the trial, a few more men fell."),
            [rel("wenzhi", "esteem", 2), rel("zhuge", "esteem", 1)], when=WZ),
     choice("wait", "expression", T("劝丞相先停下，等弄明白了再说。", "Urge the Chancellor to stop until it's understood."),
            T("丞相等了三天，派人四处打听，才问到夜渡的法子。这三天里，又有几拨兵偷偷下河取水。", "The Chancellor waits three days and sends men everywhere to ask before he learns the trick of crossing at night. In those three days, several more parties sneak down to the river for water."),
            [rel("zhuge", "esteem", -1)])],
    quote=T("若要渡时，须待夜静水冷，毒气不起，饱食渡之，方可无事。",
            "If you must cross, wait for the quiet of night when the water is cold and the poison does not rise; eat your fill and cross, and no harm will come."),
    callbacks=[cb("e_release", T("那几个当地人里，有一个认得你：『你就是劝丞相放孟大王的人？』", "One of the locals knows you. 'You're the one who told the Chancellor to let King Meng go?'"), None)],
    when=STAY, order=10))

N.append(node("c3_mengyou", "c3", "main", T("诈降", "The False Surrender"), "literal", T("第88回", "Ch. 88"),
    T("孟获的弟弟孟优带着一百多个人，抬着金珠宝贝来投降，说哥哥知道错了。丞相收下了礼物，留他们在营里喝酒。散席后，他问你：『子衡兄，怎么看？』", "Meng Huo's brother Meng You comes with a hundred-odd men bearing gold and pearls to surrender: his brother knows he was wrong, he says. The Chancellor accepts the gifts and keeps them in camp to drink. After the feast he asks you, 'Ziheng, what do you think?'"),
    [choice("trick", "strategy", T("说：一百多个人，都是精壮的。这是里应外合。", "Say: a hundred-odd men, every one of them strong. This is to open the gates from inside."),
            T("丞相笑了：『和亮想的一样。』那天夜里，孟获来劫寨，进来的是空营，酒里下了药的，是孟优那一百多人。丞相对孟获说：『汝先令汝弟以礼诈降，如何瞒得我过！今番又被我擒，汝可服否？』", "The Chancellor smiles. 'Just what I thought.' That night Meng Huo comes to raid the camp and finds it empty; it's Meng You's hundred men whose wine was drugged. The Chancellor says to Meng Huo: you had your brother feign surrender with gifts—how did you think that would fool me? Caught again—do you submit now?"),
            [rel("zhuge", "esteem", 1), add("renown.cunning")]),
     choice("trust", "dilemma", T("说：也许是真的。先当真的待。", "Say: it may be real. Treat it as real for now."),
            T("丞相看了你一眼，没说话。那天夜里，他还是布好了伏兵。孟获又被擒了。孟优被押走的时候，对你说：『只有你信过我们。』", "The Chancellor glances at you and says nothing. That night he lays his ambush all the same. Meng Huo is caught again. As Meng You is led away he says to you, 'Only you believed us.'"),
            [rel("zhuge", "esteem", -1), add("renown.loyal")])],
    quote=T("汝先令汝弟以礼诈降，如何瞒得我过！今番又被我擒，汝可服否？",
            "You first had your brother feign surrender with gifts—how could that deceive me? Now you are taken again—do you submit?"),
    when=STAY, order=20))

N.append(node("c3_wz_fever", "c3", "side", T("瘴气", "The Fever"), "free", T("原创人物", "original character"),
    T("营里一半的人发了热。温芷三天三夜没睡，眼睛熬得通红。她说药不够了。", "Half the camp is down with fever. Wen Zhi hasn't slept in three days and nights; her eyes are red raw. She says the medicine's running out."),
    [choice("herbs", "strategy", T("带人上山，照她说的样子采草药。", "Take men up the hills and gather herbs the way she describes."),
            T("你们采回来三筐，有一筐是对的。温芷说：『够了。』", "You bring back three baskets, and one of them is right. Wen Zhi says, 'That's enough.'"), [rel("wenzhi", "trust", 1), rel("wenzhi", "esteem", 1)]),
     choice("sleep", "dilemma", T("把她按到床上：剩下的你来守。", "Make her lie down: you'll take the watch."),
            T("她睡了两个时辰，醒来看见你还守在病人中间，没说话，把一碗药递给你：『你也喝。』", "She sleeps for four hours, wakes to find you still among the sick, says nothing, and hands you a bowl. 'You drink some too.'"), [rel("wenzhi", "intimacy", 1), rel("wenzhi", "warmth", 1)])],
    when=ALL(WZ, STAY), salience=4, order=1))

# ---------- c4 哑泉 ----------
N.append(node("c4_spring", "c4", "main", T("哑泉", "The Mute Spring"), "literal", T("第89回", "Ch. 89"),
    [P(T("王平带的前军走了一天，渴极了，找到一口泉，人马都喝了。回到大寨的时候，皆不能言，但指口而已。丞相大惊。", "Wang Ping's vanguard marches all day, parched, finds a spring, and men and horses all drink. When they get back to the main camp, none of them can speak; they can only point at their mouths. The Chancellor is aghast.")),
     P(T("温芷翻着那几页抄来的医书，手停在了一页上。", "Wen Zhi is leafing through the pages she copied, and her hand stops on one."), ALL(WZ, BOOK))],
    twin(ALL(WZ, BOOK),
         choice("cure", "dilemma", T("看着温芷：『你找到了？』", "Look at Wen Zhi. 'You've found something?'"),
                T("她点头：『华佗先生写过，南边有一种泉，喝了失声，要用一种叫薤叶芸香的草，还要喝另一口泉的水。』丞相派人四处找，第二天就在山里找到了一个隐者。那人说：『某乃孟获之兄孟节是也。』他指了安乐泉，又让众人口含薤叶。前军一个没死。", "She nods. 'Master Hua wrote of it: a spring in the south that takes away the voice; the cure is an herb called xie-leaf rue, and water from another spring.' The Chancellor sends men searching, and the next day they find a hermit in the hills who names himself Meng Jie, Meng Huo's elder brother. He shows them the Spring of Peace and has everyone hold a xie leaf in their mouths. Not a man of the vanguard dies."),
                [setv("flag.v6_cure"), rel("wenzhi", "esteem", 2), rel("zhuge", "esteem", 1), add("deviation")], echo=["e_cure"]),
         choice("cure", "dilemma", T("跟丞相一起进山，找懂这泉的人。", "Go into the hills with the Chancellor to find someone who knows the spring."),
                T("你们在一座古庙里问到了路，又在山里找到了一个隐者。那人说：『某乃孟获之兄孟节是也。』他指了安乐泉，又让众人口含薤叶。前军救回来一大半。", "In an old shrine you learn the way, and deep in the hills you find a hermit who names himself Meng Jie, Meng Huo's elder brother. He shows you the Spring of Peace and has everyone hold a xie leaf in their mouths. More than half the vanguard is saved."),
                [rel("zhuge", "esteem", 1), rel("zhuge", "trust", 1)])) +
    [choice("order", "strategy", T("先传令全军：没查过的水，一口也不许喝。", "First send word to the whole army: not a mouthful of unchecked water."),
            T("后面的几营都停了下来，渴了一天一夜。有人骂你。第二天，他们知道了前军的事，不骂了。", "The rear camps halt and go thirsty a whole day and night. Some men curse you. The next day they hear what happened to the vanguard, and stop."),
            [setv("flag.v6_water"), rel("zhaoyun", "esteem", 1), add("uncanny")], foresight=True)],
    quote=T("比及到大寨之时，皆不能言，但指口而已。……某乃孟获之兄孟节是也。",
            "By the time they reached the main camp, none of them could speak; they could only point at their mouths. … \"I am Meng Jie, Meng Huo's elder brother.\""),
    callbacks=[cb("e_lushui", T("丞相说：『泸水那回是你问的路。这回，也劳你去问。』", "The Chancellor says, 'At the Lu it was you who asked the way. This time too, I'll trouble you to ask.'"), None)],
    when=STAY, order=10))

N.append(talk_node("c4_zhaoyun", "c4", T("夜谈·赵云", "Night Talk: Zhao Yun"),
    T("赵云在帐外擦枪。枪杆上的漆磨掉了一大半。他看见你，往旁边挪了挪：『先生坐。』", "Zhao Yun is polishing his spear outside his tent. Most of the lacquer on the shaft has worn away. He sees you and shifts aside. 'Sit, Master.'"),
    "zhaoyun", 2,
    [topic("old", T("问他：这杆枪，跟了你多少年？", "Ask him: how many years has this spear been with you?"),
           T("赵云想了想：『从公孙瓒那里出来，就是它。』他摸着枪杆，『长坂坡那天，它比我还累。』", "Zhao Yun thinks. 'Since I left Gongsun Zan. Always this one.' He runs his hand along the shaft. 'That day at Changban it was more tired than I was.'"),
           [rel("zhaoyun", "warmth", 2)]),
     topic("north", T("问他：丞相要北伐，你还去吗？", "Ask him: when the Chancellor goes north, will you go?"),
           T("赵云笑了：『丞相不让我去，我也去。』", "Zhao Yun smiles. 'Even if the Chancellor won't let me, I'll go.'"), [rel("zhaoyun", "trust", 1)]),
     topic("lord", T("说起先帝。", "Speak of the late emperor."),
           T("赵云低下头，过了很久才说：『先帝信我，一辈子。』", "Zhao Yun lowers his head, and after a long while says, 'The late emperor trusted me. All his life.'"), [rel("zhaoyun", "warmth", 1), rel("zhaoyun", "trust", 1)])],
    T("你走的时候，赵云说：『先生，往后的仗，我们这些老的，打一仗少一仗了。』", "As you leave, Zhao Yun says, 'Master, from here on, for us old ones, every battle is one fewer.'"), when=STAY, order=20))

# ---------- c5 藤甲 ----------
N.append(node("c5_rattan", "c5", "main", T("盘蛇谷", "Coiled Snake Valley"), "literal", T("第90回", "Ch. 90"),
    [P(T("藤甲兵刀箭不入，蜀兵连败了几阵。丞相看了一天地形，回来说：前面有个山谷，叫盘蛇谷，两边是光秃秃的石壁，只有一条路。他让人运去十辆黑油柜车，在谷里埋下火药。他把布置说给你听，问你：『子衡兄，你看呢？』", "Blades and arrows can't touch the rattan troops, and the Shu army loses several engagements. The Chancellor studies the ground all day, then comes back: ahead is a valley called Coiled Snake, bare rock on both sides and a single road. He has ten carts of black oil sent in and powder buried in the valley. He lays out the plan for you and asks, 'What do you think, Ziheng?'"))],
    [choice("mercy", "dilemma", T("说：火可以放。可谷口留一条出路，让愿意扔下藤甲的人走出来。", "Say: set the fire. But leave a way out at the mouth of the valley, for anyone who throws off his armour."),
            T("丞相想了很久，点了头。那一夜，盘蛇谷烧了起来。谷口那条路上，扔下藤甲跑出来的人，有好几千。丞相站在山上，还是哭了：『吾虽有功于社稷，必损寿矣！』", "The Chancellor thinks a long time, then nods. That night Coiled Snake Valley burns. Along the road at its mouth, several thousand men come running out, their armour flung away. Standing on the hill, the Chancellor weeps all the same: though he has served the realm, this will cost him years of his life."),
            [setv("flag.v6_mercy"), rel("zhuge", "warmth", 2), rel("zhuge", "trust", 1), add("deviation", 2), add("renown.loyal")], echo=["e_mercy"]),
     choice("plan", "strategy", T("说：油车不如分两处，前后一起点，一个也跑不出去。", "Say: split the oil carts in two places, light both ends at once, and not one will escape."),
            T("丞相看了你一眼，照做了。那一夜，盘蛇谷里三万藤甲兵，没有一个出来。丞相在山上垂泪：『吾虽有功于社稷，必损寿矣！』他没有看你。", "The Chancellor glances at you and does it. That night not one of the thirty thousand rattan soldiers comes out of Coiled Snake Valley. On the hill the Chancellor weeps that though he has served the realm, this will cost him years. He doesn't look at you."),
            [setv("flag.v6_fire_plan"), rel("zhuge", "esteem", 1), rel("zhuge", "warmth", -1), add("renown.cunning")]),
     choice("silent", "expression", T("什么也说不出来。", "You can't say anything."),
            T("那一夜，盘蛇谷烧了起来。丞相在山上垂泪：『吾虽有功于社稷，必损寿矣！』你站在他身后，闻到了风里的味道。", "That night Coiled Snake Valley burns. On the hill the Chancellor weeps that though he has served the realm, this will cost him years. You stand behind him and smell what the wind carries."),
            [])],
    quote=T("吾虽有功于社稷，必损寿矣！", "Though I have done service to the realm, this will surely shorten my life!"),
    callbacks=[cb("e_release", T("你想起第一次放孟获的那天。攻心——心也会被火烧。", "You think of the day you let Meng Huo go the first time. Win their hearts—hearts burn too."), None)],
    when=STAY, order=10))

N.append(node("c5_wz", "c5", "side", T("火后", "After the Fire"), "free", T("原创人物", "original character"),
    T("火灭了以后，温芷一个人去了谷口。她在那里给烧伤的南人包扎，有人用你听不懂的话骂她，她也不停手。", "When the fire is out, Wen Zhi goes alone to the mouth of the valley. She's binding the burns of southerners there; some of them curse her in words you can't understand, and she doesn't stop."),
    [choice("help", "dilemma", T("过去帮她。", "Go and help her."),
            T("你们忙到天亮。一个被你们救下的人，临走时把一串骨珠塞进了温芷手里。", "You work until dawn. One of the men you saved presses a string of bone beads into Wen Zhi's hand as he leaves."),
            [rel("wenzhi", "intimacy", 1), rel("wenzhi", "esteem", 1), add("renown.loyal")]),
     choice("guard", "strategy", T("调几个兵过去守着她。", "Send a few soldiers to stand guard over her."),
            T("兵到了，她让他们也来帮忙抬人。", "The soldiers arrive, and she puts them to work carrying the wounded."), [rel("wenzhi", "trust", 1)])],
    when=ALL(WZ, STAY), salience=4, order=1))

# ---------- c6 七擒 ----------
N.append(node("c6_seventh", "c6", "main", T("七擒", "The Seventh Capture"), "literal", T("第90回", "Ch. 90"),
    [P(T("丞相又让人给孟获松绑：『你再回去，再来。』孟获不走了。他跪在帐前，垂泪说：『七擒七纵，自古未尝有也。』又说：『丞相天威，南人不复反矣！』", "Once more the Chancellor has Meng Huo untied: go back, and come again. Meng Huo won't go. He kneels before the tent and weeps: seven times caught, seven times freed—such a thing has never been. And then: the Chancellor's majesty is like Heaven's; the people of the south will never rebel again.")),
     P(T("费祎劝丞相在南中设官留兵。丞相说：『留外人则当留兵，兵无所食，一不易也……』他又转头问你。", "Fei Yi urges the Chancellor to set up officials and leave a garrison in the south. The Chancellor says that to leave outsiders means leaving soldiers, and soldiers with nothing to eat—that's the first difficulty… He turns to ask you."))],
    [choice("home", "strategy", T("说：不留官，不留兵，南中交给孟获自己管。", "Say: no officials, no garrison. Let Meng Huo govern the south himself."),
            T("丞相点头。南人听说了，家家户户给丞相立了生祠。", "The Chancellor nods. When the southerners hear, every household sets up a shrine to him."), [rel("zhuge", "esteem", 1), add("renown.loyal")]),
     choice("officials", "dilemma", T("说：兵不留，可留几个懂医、懂农的人。", "Say: leave no soldiers—but leave a few people who know medicine and farming."),
            T("丞相想了想：『这倒不算外人。』后来南中的几个寨子里，有了药铺和水车。", "The Chancellor considers. 'Those don't count as outsiders.' Later, in several southern villages, there are herb shops and waterwheels."),
            [setv("flag.v6_officials"), rel("zhuge", "esteem", 1), rel("zhuge", "trust", 1), add("deviation")]),
     choice("hostage", "expression", T("说：把孟获的儿子带回成都，以防万一。", "Say: take Meng Huo's son back to Chengdu, just in case."),
            T("丞相摇头：『攻心，心已经攻下来了，还要人质做什么？』", "The Chancellor shakes his head. 'Win the heart—and the heart is won. What do we need a hostage for?'"), [rel("zhuge", "esteem", -1)])],
    quote=T("丞相天威，南人不复反矣！……留外人则当留兵，兵无所食，一不易也。",
            "\"The Chancellor's majesty is like Heaven's; the people of the south will never rebel again!\" … \"To leave outsiders means to leave soldiers, and soldiers with nothing to eat—that is the first difficulty.\""),
    callbacks=[cb("e_mercy", T("孟获说：『盘蛇谷口那条路，我们的人都知道是谁劝着留的。』", "Meng Huo says, 'The road out of Coiled Snake Valley—all our people know who argued for it.'"), None),
               cb("e_cure", T("孟获说：『我哥哥说，你们营里有个女大夫，比他还认得草。』", "Meng Huo says, 'My brother says there's a woman physician in your camp who knows herbs better than he does.'"), None),
               cb("e_doubt", T("班师路上，丞相忽然说：『幼常的那句攻心，是对的。先帝的那句话，亮也记着。』", "On the march home the Chancellor suddenly says, 'Youchang was right about winning hearts. And I remember the late emperor's words too.'"), None),
               cb("e_wu", T("东吴派人来贺。来的人说，是因为蜀中有人去过东吴。", "Wu sends envoys to offer congratulations. They say it's because someone from Shu came to Wu."), None)],
    when=STAY, order=10))

N.append(node("c6_return", "c6", "main", T("班师", "Home"), "free", T("原创", "original"),
    [P(T("大军回到泸水边，起了大风，过不了河。当地人说，要用人头祭河。丞相不肯，让人用面裹了肉，捏成人头的样子，祭了泸水。风停了。", "The army reaches the Lu again, and a great wind rises; it can't cross. The locals say the river must be offered human heads. The Chancellor refuses; he has meat wrapped in dough and shaped like heads, and offers those to the Lu. The wind dies down.")),
     P(T("回到成都的那天，关羽在城门口等着，一句话没说，拍了拍你的肩。", "The day you're back in Chengdu, Guan Yu is waiting at the gate. He says nothing; he claps your shoulder."), GUAN),
     P(T("回到成都的那天，张飞在城门口大喊：『先生回来了！』", "The day you're back in Chengdu, Zhang Fei is at the gate bellowing, 'The Master's back!'"), FEI)],
    [choice("north", "strategy", T("问丞相：下一步，是北边了吧？", "Ask the Chancellor: next is the north, isn't it?"),
            T("丞相看着你，没有回答。那天夜里，相府的灯亮到天明。", "The Chancellor looks at you and doesn't answer. That night the lamps in his offices burn until dawn."), [rel("zhuge", "trust", 1)]),
     choice("rest", "dilemma", T("说：丞相，先歇一个冬天。", "Say: Chancellor, rest for one winter first."),
            T("丞相笑了：『好，歇一个冬天。』你知道他不会。", "The Chancellor smiles. 'All right. One winter.' You know he won't."), [rel("zhuge", "warmth", 1)])],
    when=STAY, order=20))

# ---------- crises ----------
def crisis(id, title, intro, choices, when, order):
    return node(id, "*", "interrupt", title, "free", T("原创危机", "original crisis"), intro, choices, when=when, order=order)
N.append(crisis("x_cold6", T("冷落", "Sidelined"),
    T("丞相已经很久没有问过你了。赵云私下说：『先生，丞相心里有事。』", "It's been a long time since the Chancellor asked your opinion. Zhao Yun says privately, 'Master, something's on the Chancellor's mind.'"),
    [choice("mend", "strategy", T("去找丞相，把话说开。", "Go to the Chancellor and talk it through."),
            T("你们谈了一夜。天亮时，丞相说：『是亮想多了。』", "You talk all night. At dawn the Chancellor says, 'I've been overthinking.'"), [rel("zhuge", "trust", 2)],
            req=AT("zhaoyun", "trust", 2), hint=T("需要赵云的信任在「可托」以上，才有人替你说一句话", "Needs Zhao Yun's trust at Reliable or above for someone to put in a word")),
     choice("wait", "expression", T("等。做好手上的事。", "Wait. Do the work in front of you."), T("你的位子挪到了后排。", "Your seat moves to the back row."), [rel("zhuge", "trust", 1), setv("flag.sidelined")]),
     choice("go", "dilemma", T("告辞。", "Take your leave."), T("丞相没有留你。", "The Chancellor doesn't ask you to stay."), [setv("flag.v6_left")])],
    ALL(UPTO("zhuge", "trust", 0), STAY), 3))
N[-1]["choices"][2]["ends"] = True
N.append(crisis("x_uncanny6", T("妖人", "Sorcerer"),
    T("南人都在传：丞相身边有个人，比丞相还早知道山里有什么。连丞相也来问你：『子衡兄，你是从哪里知道的？』", "All the southerners are saying the Chancellor has a man who knows what's in the hills before the Chancellor does. Even the Chancellor comes to ask: 'Ziheng, where do you learn these things?'"),
    [choice("hide", "strategy", T("从此闭口。", "Hold your tongue from now on."), T("人们慢慢忘了。", "People slowly forget."), [add("uncanny", -2), rel("zhuge", "trust", 1)]),
     choice("leave", "dilemma", T("离开，免得连累丞相。", "Leave, so the Chancellor isn't tainted by you."), T("你在一个雨夜出了营。", "You leave the camp one rainy night."), [setv("flag.v6_exposed")])],
    ALL(V("uncanny", ">=", 8), STAY), 2))
N[-1]["choices"][1]["ends"] = True
N.append(crisis("x_loose6", T("失言", "A Slip of the Tongue"),
    T("你说过的那些话，有人抄了下来，送到了丞相案头。", "Someone has copied down things you've said and put them on the Chancellor's desk."),
    [choice("own", "strategy", T("认：话说过了头。", "Own it: you spoke out of turn."), T("丞相没有罚你：『子衡兄，管住嘴。』", "The Chancellor doesn't punish you. 'Ziheng—mind your tongue.'"), [add("renown.rash", -3), rel("zhuge", "trust", -1)]),
     choice("argue", "dilemma", T("辩：句句是真话。", "Argue: every word was true."), T("『有些真话，要挑时候说。』", "'Some truths need the right moment.'"), [add("renown.rash", -1), rel("zhuge", "esteem", 1)])],
    ALL(V("renown.rash", ">=", 6), STAY), 4))

# ------------------------------------------------------------------ open questions
ASKS = {
  "c2_first": {"who": "zhuge", "fallback": "dodge",
    "q": T("孟获被押走以后，丞相问你：『子衡兄，你说，一个人要被抓几次，心才会服？』", "When Meng Huo has been taken away, the Chancellor asks, 'Ziheng, how many times must a man be caught before his heart submits?'"),
    "answers": [
      ans("many", T("说要抓到他自己不想走", "says until he no longer wants to leave"), T("丞相笑了：『那就抓到他不想走为止。』", "The Chancellor smiles. 'Then we catch him until he doesn't want to go.'"), [rel("zhuge", "esteem", 1), rel("zhuge", "warmth", 1)], match=r"不想走|自己|心服|几次都|直到|until|doesn't want|his own|heart", mood="warm"),
      ans("seven", T("说七次", "says seven"), T("丞相愣了一下，看了你很久：『为什么是七？』你没有回答。", "The Chancellor starts, and looks at you a long time. 'Why seven?' You don't answer."), [add("uncanny"), rel("zhuge", "trust", -1)], match=r"七|seven|7", mood="neutral"),
      ans("never", T("说抓几次都不会服", "says no number will do it"), T("丞相摇头：『那南中就永远不会太平了。』", "The Chancellor shakes his head. 'Then the south will never be at peace.'"), [rel("zhuge", "esteem", -1)], match=r"不会服|永远不|几次都不|never|no number|won't", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("丞相没有追问。", "The Chancellor doesn't press."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
  "c5_rattan": {"who": "zhuge", "fallback": "dodge",
    "q": T("火灭以后，丞相一个人坐在山石上，问你：『子衡兄，亮今天做的事，会不会遭报应？』", "When the fire is out, the Chancellor sits alone on a rock and asks you, 'Ziheng, will what I did today come back on me?'"),
    "answers": [
      ans("no", T("说不会，这是为了南中太平", "says no—it was for the south's peace"), T("丞相没有说话，过了很久才说：『但愿。』", "The Chancellor says nothing for a long time, then: 'Let's hope so.'"), [rel("zhuge", "warmth", 1)], match=r"不会|为了|太平|不得已|没办法|no|for peace|had to|no choice", mood="sad"),
      ans("yes", T("说会，要记着", "says yes—remember it"), T("丞相点头：『亮会记着。』他把那天的日子，写在了扇子上。", "The Chancellor nods. 'I'll remember.' He writes the day's date on his fan."), [rel("zhuge", "trust", 1), rel("zhuge", "esteem", 1)], match=r"会|记着|报应|代价|yes|remember|price|will", mood="sad"),
      ans("share", T("说一半算在自己头上", "says half of it is on you"), T("丞相看了你一眼，眼眶红了：『子衡兄……』他没说下去。", "The Chancellor looks at you, eyes reddening. 'Ziheng…' He doesn't go on."), [rel("zhuge", "warmth", 2), rel("zhuge", "trust", 1)], match=r"一半|我也|算我|我们|half|me too|on me|we both", mood="warm"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("丞相站起来，拍了拍衣上的灰：『走吧。』", "The Chancellor stands and brushes off his robe. 'Let's go.'"), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
  "c6_seventh": {"who": "zhuge", "fallback": "dodge",
    "q": T("班师前一夜，丞相问你：『子衡兄，七擒七纵，花了大半年，死了那么多人。你说，值不值？』", "The night before the march home the Chancellor asks, 'Ziheng, seven captures, seven releases, most of a year, so many dead. Was it worth it?'"),
    "answers": [
      ans("yes", T("说值，南边以后不会再反", "says yes—the south won't rise again"), T("丞相点头：『南边稳了，北边才能去。』", "The Chancellor nods. 'With the south steady, the north is possible.'"), [rel("zhuge", "esteem", 1)], match=r"值|不会再反|稳|北伐|worth|won't rise|steady|north", mood="warm"),
      ans("cost", T("说值不值，要看以后对南人怎么样", "says it depends how the south is treated from now on"), T("丞相想了很久：『你说得对。』他让人把南中的赋税减了一半。", "The Chancellor thinks a long time. 'You're right.' He has the south's taxes cut by half."), [rel("zhuge", "trust", 1), rel("zhuge", "esteem", 1), add("renown.loyal")], match=r"以后|怎么待|对南人|赋税|看|depends|from now|treat|tax", mood="neutral"),
      ans("no", T("说不值", "says no"), T("丞相没有反驳，只是说：『那就让它变得值。』", "The Chancellor doesn't argue. 'Then let's make it worth it.'"), [rel("zhuge", "warmth", -1)], match=r"不值|no|wasn't|not worth", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("丞相笑了笑，没有再问。", "The Chancellor smiles and doesn't ask again."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
}
ASK_ORDER = {"c2_first": ["seven", "never", "many", "dodge"], "c5_rattan": ["share", "yes", "no", "dodge"], "c6_seventh": ["cost", "yes", "no", "dodge"]}

V6_TAGS = {
    ("x_return6", "back"): ["yi"],
    ("c1_wu", "dengzhi"): ["zhi"], ("c1_wu", "go"): ["yong", "yi"], ("c1_qinmi", "self"): ["ren"],
    ("c1_wz_south", "ask"): ["zhi"], ("c1_home", "yes"): ["cheng"],
    ("c2_masu", "praise"): ["ren"], ("c2_masu", "doubt"): ["cheng", "zhi"],
    ("c2_first", "free"): ["ren", "zhi"], ("c2_first", "hold"): ["zhi"], ("c2_first", "kill"): ["li"],
    ("c3_lushui", "ask"): ["ren", "zhi"], ("c3_lushui", "wz"): ["zhi"],
    ("c3_mengyou", "trick"): ["zhi"], ("c3_mengyou", "trust"): ["ren", "cheng"],
    ("c3_wz_fever", "herbs"): ["ren"],
    ("c4_spring", "cure"): ["zhi", "ren"], ("c4_spring", "cure_2"): ["yong"], ("c4_spring", "order"): ["zhi"],
    ("c5_rattan", "mercy"): ["ren"], ("c5_rattan", "plan"): ["zhi", "li"],
    ("c5_wz", "help"): ["ren"],
    ("c6_seventh", "home"): ["ren", "cheng"], ("c6_seventh", "officials"): ["ren", "zhi"], ("c6_seventh", "hostage"): ["li"],
}
values.VALUES.setdefault("huangzhong", {"yong": ["esteem", 1], "yi": ["warmth", 1], "cheng": ["trust", 1], "li": ["esteem", -1]})
values.VALUES.setdefault("fazheng", {"zhi": ["esteem", 1], "yong": ["esteem", 1], "li": ["warmth", 1], "ren": ["esteem", -1]})
values.apply(N, CHARS, V6_TAGS)
byid = {n["id"]: n for n in N}
for nid, a in ASKS.items():
    a["answers"].sort(key=lambda x: ASK_ORDER[nid].index(x["id"]))
    byid[nid]["ask"] = a

CAST = {
    "x_return6": cast_("zhuge"), "x_cold6": cast_("zhuge", "zhaoyun"), "x_uncanny6": cast_("zhuge"), "x_loose6": cast_("zhuge"),
    "c1_wu": cast_("zhuge"), "c1_qinmi": [], "c1_home": cast_("wenzhi"), "c1_wz_south": cast_("wenzhi"), "c1_brothers": [],
    "c2_masu": cast_("zhuge"), "c2_first": cast_("zhuge"), "c2_zhuge": cast_("zhuge"),
    "c3_lushui": cast_("zhuge"), "c3_mengyou": cast_("zhuge"), "c3_wz_fever": cast_("wenzhi"),
    "c4_spring": cast_("zhuge"), "c4_zhaoyun": cast_("zhaoyun"),
    "c5_rattan": cast_("zhuge"), "c5_wz": cast_("wenzhi"),
    "c6_seventh": cast_("zhuge"), "c6_return": cast_("zhuge"),
}
CAST["c1_brothers"] = []
def lay(id, when=None, choice=None):
    d = {"id": id}
    if when: d["when"] = when
    if choice: d["choice"] = choice
    return d
ART = {
    "x_return6": ("letter", [], None, "v3_letter"), "x_cold6": ("lamp", [], None, "g_cold"), "x_uncanny6": ("lamp", [], None, "g_uncanny"), "x_loose6": ("letter", [], None, "g_cold"),
    "c1_wu": ("hall", [], "chengdu", "v6_wu"), "c1_qinmi": ("hall", [lay("crowd")], "chengdu", "v6_qinmi"), "c1_home": ("garden", [], "chengdu", "v6_home"),
    "c1_wz_south": ("herbs", [lay("two")], "chengdu", "v3_clinic"), "c1_brothers": ("mourning", [], "chengdu", "v6_tablet"),
    "c2_masu": ("road", [], "chengdu", "v6_masu"), "c2_first": ("camp", [], "yizhou", "v6_first"), "c2_zhuge": ("campfire", [], "yizhou", "v6_zhuge_night"),
    "c3_lushui": ("bigriver", [], "lushui", "v6_lushui"), "c3_mengyou": ("camp", [], "lushui", "v6_mengyou"), "c3_wz_fever": ("herbs", [lay("two")], "lushui", "g_wounded"),
    "c4_spring": ("ravine", [], "tulong", "v6_spring"), "c4_zhaoyun": ("campfire", [], "tulong", "v2_zhaoyun_night"),
    "c5_rattan": ("fire", [lay("burning")], "panshe", "v6_rattan"), "c5_wz": ("herbs", [], "panshe", "v6_wz_burns"),
    "c6_seventh": ("camp", [], "yinkeng", "v6_seventh"), "c6_return": ("bigriver", [], "lushui", "v6_offering"),
}
for n in N:
    sc, ls, place, illus = ART[n["id"]]
    n["art"] = {"scene": sc, "layers": ls}
    if illus: n["art"]["illus"] = illus
    if place: n["place"] = place
    if n["id"] in CAST: n["cast"] = CAST[n["id"]]
PLACE_AFTER = {("x_return6", "back"): "chengdu", ("c6_return", "*"): "chengdu"}
for n in N:
    for c in n["choices"]:
        pa = PLACE_AFTER.get((n["id"], c["id"])) or PLACE_AFTER.get((n["id"], "*"))
        if pa and pa != n.get("place"): c["place"] = pa

import moves_v6
CAMP_MOVES = moves_v6.extend(N, VARS)

PLACES = {"chengdu": V5["places"]["chengdu"]}
PLACES.update({
    "yizhou": {"x": 120, "y": 400, "rx": 250, "ry": 540, "zh": "益州郡", "en": "Yizhou Commandery"},
    "lushui": {"x": 110, "y": 440, "rx": 245, "ry": 560, "zh": "泸水", "en": "the Lu River"},
    "tulong": {"x": 85, "y": 470, "rx": 232, "ry": 575, "zh": "秃龙洞", "en": "Bald Dragon Cave"},
    "panshe": {"x": 140, "y": 480, "rx": 258, "ry": 582, "zh": "盘蛇谷", "en": "Coiled Snake Valley"},
    "yinkeng": {"x": 100, "y": 500, "rx": 240, "ry": 592, "zh": "银坑洞", "en": "Silver Pit Cave"},
})
RIVERS = V5["rivers"]

FUTURE = [(T("泸水", "the Lu River"), "c3"), (T("哑泉", "the Mute Spring"), "c4"), (T("藤甲", "rattan armour"), "c5"), (T("盘蛇谷", "Coiled Snake Valley"), "c5"),
          (T("出师表", "the Memorial on Going to War"), "v7"), (T("街亭", "Jieting"), "v7"), (T("空城计", "the empty fort"), "v7"), (T("五丈原", "Wuzhang Plains"), "v7")]

def frag(id, text, when=None, mood=None):
    d = {"id": id, "text": text}
    if when: d["when"] = when
    if mood: d["mood"] = mood
    return d
LIU = ALL(V("track", "==", "liu"), STAYING)
ENDINGS = [
    {"id": "g_side", "title": T("去处", "Where You Ended Up"), "fragments": [
        frag("hermit", T("你没有回蜀中。南中的事，是从集市上听来的。", "You never went back to Shu. You heard about the south in the market."), F("flag.v6_hermit")),
        frag("exposed", T("你在一个雨夜出了营。南人说，丞相身边的那个先生，回山里去了。", "You left the camp one rainy night. The southerners say the Chancellor's Master went back into the hills."), F("flag.v6_exposed")),
        frag("left", T("你离开了。丞相回成都那天，你在城外的人群里。", "You left. The day the Chancellor came back to Chengdu, you were in the crowd outside the walls."), F("flag.v6_left")),
        frag("south", T("你随丞相南征，七擒七纵，回到了成都。", "You marched south with the Chancellor, through seven captures and seven releases, and came home to Chengdu."), LIU)]},
    {"id": "g_south", "title": T("南中", "The South"), "mode": "all", "fragments": [
        frag("lushui", T("泸水夜渡，一个人都没少。那几个当地人后来给大军带了一路的路。", "The night crossing of the Lu cost not a single man. Those locals guided the army the whole way after."), F("flag.v6_lushui")),
        frag("cure", T("哑泉边，温芷翻出了华佗的那一页。前军一个没死。", "At the Mute Spring, Wen Zhi found Hua Tuo's page. Not a man of the vanguard died."), F("flag.v6_cure"), "warm"),
        frag("mercy", T("盘蛇谷口留了一条路。走出来的几千人，后来都回了家。", "A road was left open at the mouth of Coiled Snake Valley. The several thousand who walked out all went home in the end."), F("flag.v6_mercy")),
        frag("plan", T("盘蛇谷两头的火，是你布置的。丞相后来再也没让你管过火攻。", "The fires at both ends of Coiled Snake Valley were your arrangement. The Chancellor never put you in charge of fire again."), F("flag.v6_fire_plan"), "sad"),
        frag("officials", T("南中的几个寨子里，有了药铺和水车。", "In several southern villages there are herb shops and waterwheels now."), F("flag.v6_officials"))]},
    {"id": "g_masu", "title": T("马谡", "Ma Su"), "fragments": [
        frag("doubt", T("先帝说马谡言过其实。你把这句话告诉了丞相。丞相说，他记着。", "The late emperor said Ma Su's words outran his worth. You told the Chancellor. He said he remembered."), F("flag.v6_masu_doubt")),
        frag("praise", T("马谡记得，攻心那句话，是你第一个说好的。", "Ma Su remembers that you were the first to praise his 'win their hearts.'"), F("flag.v6_masu_praise")),
        frag("plain", T("马谡的那句攻心，丞相写在了自己的书里。", "The Chancellor wrote Ma Su's 'win their hearts' into his own book."))]},
    {"id": "g_wenzhi", "title": T("温芷", "Wen Zhi"), "fragments": [
        frag("wed", T("温芷跟着你去了南中。回来的时候，她的药箱里多了一串骨珠。", "Wen Zhi went south with you. When she came home, there was a string of bone beads in her medicine chest."), ALL(WED, WZ), "romance"),
        frag("near", T("温芷在南中救了很多人，有蜀人，也有南人。", "Wen Zhi saved many lives in the south, Shu men and southerners both."), WZ),
        frag("far", T("你很久没有温芷的消息了。", "You haven't heard from Wen Zhi in a long time."))]},
    {"id": "g_name", "title": T("名声", "Your Name"), "fragments": [
        frag("uncanny", T("南人说，丞相身边有个人，山里的事他都知道。", "The southerners say the Chancellor has a man who knows everything in the hills."), V("uncanny", ">=", 5)),
        frag("loyal", T("南人记得你的名字。", "The southerners remember your name."), V("renown.loyal", ">", "@renown.cunning")),
        frag("cunning", T("人说子衡多智，也说子衡心深。", "People say Ziheng is clever, and that his mind runs deep."), V("renown.cunning", ">", "@renown.loyal")),
        frag("none", T("史书里没有你的传，只有几处『或曰』。", "The histories give you no biography—just a few lines beginning 'some say.'"))]},
    {"id": "g_history", "title": T("天下", "The Realm"), "fragments": [
        frag("far", T("说书人讲到南中，有好几处讲不顺——那几处，都是你。", "When storytellers reach the south, several places never quite fit. Those places are you."), V("deviation", ">=", 10)),
        frag("plain", T("建兴三年秋，丞相平定南中，班师回成都。南人不复反。", "In the autumn of Jianxing 3 the Chancellor pacified the south and marched home to Chengdu. The south never rose again."))]},
]
FRAG_FACE = {"g_wenzhi": {"wed": ("wenzhi", "shy"), "near": ("wenzhi", "warm"), "far": ("wenzhi", "sad")}}
ENDING_ART = {"scene": "ending", "layers": [{"id": "city", "when": STAYING}, {"id": "home", "when": WED},
                                            {"id": "lone", "when": ANY(F("flag.v6_hermit"), F("flag.v6_left"), F("flag.v6_exposed"))}]}

REALM = json.loads(json.dumps(V5["realm"]))
base = dict(REALM["control"]["c8"])
REALM["control"] = {f"c{i}": dict(base) for i in range(1, 7)}
REALM["captions"] = {"c1": T("后主即位；邓芝使吴，吴蜀复盟", "Liu Shan takes the throne; Deng Zhi renews the alliance with Wu"),
                     "c2": T("南中叛乱，丞相南征", "The south rebels; the Chancellor marches south"), "c3": T("五月渡泸", "Crossing the Lu in the fifth month"),
                     "c4": T("秃龙洞与四泉", "Bald Dragon Cave and the four springs"), "c5": T("盘蛇谷火烧藤甲", "The rattan troops burn in Coiled Snake Valley"),
                     "c6": T("建兴三年：七擒孟获，南中平定", "225: Meng Huo caught seven times; the south at peace")}

COMMIT_RULES = speech.commit_rules()
PRESETS = json.loads((HERE / "presets.json").read_text()) if (HERE / "presets.json").exists() else []

CAMPAIGN = {
    "spec": SPEC, "tiers": TIERS(), "pack": PACK("history-strategy"),
    "resources": {"reputation": ["renown.loyal", "renown.cunning"], "risk": ["uncanny", "renown.rash"], "drift": ["deviation"]},
    "carry_compress": {"pivot": 4, "k": 0.5},
    "id": "sanguo_strategist_v6", "prev": "sanguo_strategist_v5",
    "title": T("三国·谋士", "Three Kingdoms: The Strategist"), "volume": T("卷六 · 南中", "Volume VI · The South"),
    "rights": {"source": "《三国演义》（罗贯中，明代），公版", "quotes": "中文原文直接引用；英文为本项目自译", "original_characters": ["子衡（玩家）", "温芷"]},
    "player": {"name": T("子衡", "Ziheng")}, "side_prompt": SIDE_PROMPT,
    "vars": VARS, "chars": CHARS, "dims": DIMS, "echoes": ECHOES, "debts": {},
    "chapters": CHAPTERS, "nodes": {n["id"]: n for n in N}, "endings": ENDINGS, "situations": situations.volume(N, VARS), "moves": CAMP_MOVES,
    "future_terms": [{"term": t, "from": c} for t, c in FUTURE],
    "ending_art": ENDING_ART, "art_prompts": dict(V5["art_prompts"]), "frag_face": FRAG_FACE, "portrait_prompts": dict(V5["portrait_prompts"]), "cg_captions": V5["cg_captions"], "realm": REALM,
    "react_patterns": V5["react_patterns"], "value_tags": values.TAGS, "commit_rules": COMMIT_RULES,
    "witness": [{"who": "zhaoyun", "to": "zhuge", "labels": ["rude", "threat"], "effects": [rel("zhaoyun", "trust", -1)]}],
    "places": PLACES, "rivers": RIVERS,
    "meters": {"uncanny": T("到 8：被当作妖人", "At 8: branded a sorcerer"), "rash": T("到 6：有人会把你的话报上去", "At 6: someone reports what you've said")},
    "presets": PRESETS,
    "sources": [{"what": "中文引文核对底本", "url": "https://www.ntdtv.com/b5/2010/01/05/a385131.html", "checked": "2026-10-27", "note": "第87回（马谡攻心、一擒），繁体转简体"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2010/01/06/a385655.html", "checked": "2026-10-27", "note": "第88回（渡泸、孟优诈降）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/b5/2010/01/08/a385805.html", "checked": "2026-10-27", "note": "第89回（哑泉、孟节），繁体转简体"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/b5/2010/01/10/a385955.html", "checked": "2026-10-27", "note": "第90回（藤甲、盘蛇谷、七擒）；此本作“丞相天威，南人不复反矣”，照录"}],
    "end_note": T("卷六终。卷七《出师》尚未开放。", "End of Volume VI. Volume VII (The Northern Campaigns) is not yet open."),
}

if __name__ == "__main__":
    out = HERE / "campaign_v6.json"
    dump(CAMPAIGN, out)
    print("nodes", len(N), "->", out)
