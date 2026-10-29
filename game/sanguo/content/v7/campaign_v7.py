"""三国·谋士 卷七（出师，第91–104回）。

接着卷六：同名变量由上一卷带来；没玩过卷六的玩家从“前情”开始。你年过半百，随诸葛亮北伐。
方针同卷五、卷六（决策记录 v2.11–v2.13）：大势不改——街亭失守、空城退敌、诸葛亮病逝五丈原；
能改的是代价和人：街亭败得多惨、马谡的生死（门槛高）、魏延和杨仪、谁接住丞相的担子。
新人物姜维、司马懿、魏延。卷八的接班人在这一卷定下：和温芷成了亲的有了孩子，否则你收一个学生。
原著引文只取公版原文，并已核对（见 sources）；其余叙述和英文都是我们自己写的。细纲见 docs/全书规划.md。
"""
import json, pathlib, sys
HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent))
from lib import *
import speech, values
from talks import topic, talk_node
from asks import ans
import people_v7 as P7

V6 = json.loads((HERE.parent / "v6" / "campaign_v6.json").read_text())

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
    a["when"] = cond; b["when"] = _neg(cond); b["id"] = a["id"] + "_2"
    return [a, b]

AWAY = ANY(F("prev.ended_early"), V("track", "==", "cao"))
STAY = NF("flag.v7_hermit")
STAYING = ALL(NF("flag.v7_hermit"), NF("flag.v7_left"), NF("flag.v7_exposed"))
GUAN, FEI = F("flag.guan_alive"), F("flag.fei_alive")
WED = F("flag.wz_wed")
WZ = ANY(F("flag.wz_west"), F("flag.wz_jingzhou"), F("flag.wz_huatuo"), WED)
MASU_DOUBT = ANY(F("flag.v6_masu_doubt"), F("flag.v5_masu"))
SAVE_MASU = ALL(F("flag.v7_jt_wangping"), F("flag.v6_masu_doubt"))
TRUSTED = ANY(F("flag.v5_entrusted"), AT("zhuge", "trust", 4))

VARS = {k: v for k, v in json.loads(json.dumps(V6["vars"])).items() if not k.startswith(("heat.", "debt."))}
FLAGS = {
    "flag.v7_came_back": T("流落之后回到蜀中", "Came back to Shu after wandering"),
    "flag.v7_hermit": T("就此隐去", "Disappeared from the world"),
    "flag.v7_biao": T("替丞相改过出师表里的一句", "Suggested a line for the Memorial on Going to War"),
    "flag.v7_child": T("和温芷有了孩子", "Had a child with Wen Zhi"),
    "flag.v7_student": T("收了一个学生", "Took a student"),
    "flag.v7_ziwu": T("替魏延的子午谷之计说过话", "Spoke up for Wei Yan's Ziwu Valley plan"),
    "flag.v7_mother": T("劝丞相别用姜维的母亲做饵", "Urged the Chancellor not to use Jiang Wei's mother as bait"),
    "flag.v7_jt_with": T("随马谡去了街亭", "Went to Jieting with Ma Su"),
    "flag.v7_jt_warned": T("劝丞相别派马谡守街亭", "Urged the Chancellor not to send Ma Su to Jieting"),
    "flag.v7_jt_road": T("劝丞相嘱咐当道扎营", "Urged the Chancellor to order a camp on the road"),
    "flag.v7_jt_wangping": T("在街亭和王平一起守住了路口", "Held the road at Jieting with Wang Ping"),
    "flag.v7_wall": T("空城那天，站在丞相身边", "Stood beside the Chancellor on the wall of the empty city"),
    "flag.masu_alive": T("马谡没有被斩", "Ma Su was not executed"),
    "flag.v7_old_farewell": T("送走了桃园的最后一人", "Saw off the last of the peach-garden brothers"),
    "flag.v7_feud": T("替魏延、杨仪说和过", "Tried to make peace between Wei Yan and Yang Yi"),
    "flag.v7_warned_weiyan": T("上方谷前提醒过魏延", "Warned Wei Yan before Shangfang Valley"),
    "flag.v7_envoy": T("出使司马懿军营", "Went as envoy to Sima Yi's camp"),
    "flag.v7_lamp_guard": T("五丈原守在帐外，没让人闯进去", "Kept watch outside the tent at Wuzhang and let no one burst in"),
    "flag.v7_fan": T("丞相把羽扇留给了你", "The Chancellor left you his feather fan"),
    "flag.v7_weiyan_word": T("劝丞相给魏延留一条路", "Urged the Chancellor to leave Wei Yan a way through"),
    "flag.v7_left": T("被冷落后离开", "Left after being sidelined"),
    "flag.v7_exposed": T("妖人之名坐实", "Branded a sorcerer for good"),
}
for k, lab in FLAGS.items(): VARS[k] = flag(lab)

CHARS = json.loads(json.dumps(V6["chars"]))
for k, d in P7.NEW_CHARS.items():
    CHARS[k] = dict(d); CHARS[k]["romance"] = False; CHARS[k]["react"] = P7.REACT[k]; CHARS[k]["persona"] = P7.PERSONA[k]
    CHARS[k]["openers"] = P7.OPENERS[k]; CHARS[k]["heat"] = P7.HEAT[k]
    for dim, (init, lo, hi) in d["dims"].items():
        VARS[f"rel.{k}.{dim}"] = {"type": "num", "init": init, "min": lo, "max": hi, "char": k, "dim": dim,
                                  "label": T(d["name"]["zh"] + "·" + V6["dims"][dim]["zh"], d["name"]["en"] + " · " + V6["dims"][dim]["en"])}
for k in P7.NEW_CHARS: CHARS[k].pop("from_chapter", None)
CHARS["zhuge"]["persona"] = T("诸葛亮：丞相，四十七岁到五十四岁，六出祁山；越来越瘦，越来越忙，事无大小都要亲自过问。对你说话最不设防。称玩家“子衡兄”。",
                              "Zhuge Liang: Chancellor, forty-seven to fifty-four over this volume, marching on Qishan again and again; thinner and busier every year, seeing to everything great and small himself. With you he is least on guard. Calls the player Ziheng.")
CHARS["zhaoyun"]["persona"] = T("赵云：快七十了，还要上阵；这一卷里是他最后的几年。称玩家“先生”。",
                                "Zhao Yun: nearly seventy, still riding out; these are his last years. Calls the player Master.")
DIMS = dict(V6["dims"])
for c in CHARS:
    if CHARS[c].get("heat"):
        VARS[f"heat.{c}"] = {"type": "num", "init": 0, "min": 0, "max": 5, "char": c, "show": False, "carry": False,
                             "label": T(CHARS[c]["name"]["zh"] + "·火气", CHARS[c]["name"]["en"] + " · Temper")}
for c, k, lab in [("weiyan", "offended", T("被冒犯", "Offended")), ("jiangwei", "offended", T("被冒犯", "Offended"))]:
    VARS[f"imp.{c}.{k}"] = {"type": "num", "init": 0, "min": 0, "max": 5, "label": T(CHARS[c]["name"]["zh"] + "·" + lab["zh"], CHARS[c]["name"]["en"] + " · " + lab["en"]), "char": c, "imp": k, "show": False}

ECHOES = {
    "e_biao": T("出师表里那一句，是你添的", "That line in the Memorial was yours"),
    "e_ziwu": T("你替魏延的子午谷说过话", "You spoke up for Wei Yan's Ziwu Valley plan"),
    "e_mother": T("你劝丞相别拿姜维的母亲做饵", "You urged the Chancellor not to use Jiang Wei's mother as bait"),
    "e_road": T("街亭那条路口，是你和王平守的", "You and Wang Ping held the road at Jieting"),
    "e_warned": T("你劝过丞相别派马谡", "You urged the Chancellor not to send Ma Su"),
    "e_wall": T("空城那天，你在城楼上", "On the day of the empty city, you were on the wall"),
    "e_feud": T("你给魏延和杨仪说过和", "You tried to make peace between Wei Yan and Yang Yi"),
    "e_envoy": T("你在司马懿帐里说过丞相的事", "You spoke of the Chancellor in Sima Yi's tent"),
    "e_child": T("北伐那年，你的孩子出生了", "The year of the northern march, your child was born"),
}

SIDE_PROMPT = T("这段日子，你只来得及做一件事。", "These days you only have time for one thing.")
CHAPTERS = [
    {"id": "c1", "title": T("出师", "Setting Out"), "year": T("建兴五年（227）", "Jianxing 5 (227)"), "canon": T("第91回", "Ch. 91"), "offer": 2,
     "intro": [P(T("南中平定两年了。曹丕死了，他的儿子曹睿做了魏帝。丞相说：是时候了。", "Two years since the south was pacified. Cao Pi is dead, and his son Cao Rui is emperor of Wei. The Chancellor says: it's time.")),
               P(T("你五十多了。早上起来，膝盖会疼。", "You're past fifty now. Your knees ache in the mornings."))]},
    {"id": "c2", "title": T("天水", "Tianshui"), "year": T("建兴六年（228）", "Jianxing 6 (228)"), "canon": T("第92–93回", "Ch. 92–93"), "offer": 2,
     "intro": [P(T("大军出了祁山。南安、安定、天水三郡，一个月里降了两个。只有天水的冀县，有一个年轻人，看穿了丞相的计。", "The army comes out of Qishan. Of Nan'an, Anding and Tianshui, two commanderies surrender within a month. Only at Ji in Tianshui, a young man sees through the Chancellor's plan."))]},
    {"id": "c3", "title": T("街亭", "Jieting"), "year": T("建兴六年（228）", "Jianxing 6 (228)"), "canon": T("第95回", "Ch. 95"), "offer": 1,
     "intro": [P(T("司马懿复出了，直扑街亭。街亭是汉中的咽喉。丞相问：谁去守？", "Sima Yi has returned to command and is driving straight for Jieting. Jieting is the throat of Hanzhong. The Chancellor asks: who will hold it?"))]},
    {"id": "c4", "title": T("空城", "The Empty City"), "year": T("建兴六年（228）", "Jianxing 6 (228)"), "canon": T("第95回", "Ch. 95"), "offer": 1,
     "intro": [P(T("街亭丢了。司马懿的十五万大军，正往西城来。城里只有两千五百人，大将都派出去了。", "Jieting is lost. Sima Yi's hundred and fifty thousand are marching on Xicheng. There are twenty-five hundred men in the city, and every general has been sent elsewhere."))]},
    {"id": "c5", "title": T("挥泪", "Tears"), "year": T("建兴六年（228）", "Jianxing 6 (228)"), "canon": T("第96回", "Ch. 96"), "offer": 2,
     "intro": [P(T("大军退回汉中。马谡被绑着，送到了丞相帐前。", "The army falls back to Hanzhong. Ma Su is brought before the Chancellor's tent in bonds."))]},
    {"id": "c6", "title": T("子龙", "Zilong"), "year": T("建兴七年至九年（229–231）", "Jianxing 7–9 (229–231)"), "canon": T("第97–101回", "Ch. 97–101"), "offer": 2,
     "intro": [P(T("出了几次祁山，拿下了武都、阴平，可长安还是很远。成都传来消息：赵云病重。", "Several marches on Qishan; Wudu and Yinping taken, but Chang'an is still far away. Word comes from Chengdu: Zhao Yun is gravely ill."))]},
    {"id": "c7", "title": T("上方谷", "Shangfang Valley"), "year": T("建兴十二年（234）", "Jianxing 12 (234)"), "canon": T("第102–103回", "Ch. 102–103"), "offer": 2,
     "intro": [P(T("最后一次北伐。大军屯在五丈原，木牛流马运着粮。司马懿就是不出战。", "The last northern march. The army is camped on the Wuzhang Plains, grain hauled by wooden oxen and gliding horses. Sima Yi simply will not come out and fight."))]},
    {"id": "c8", "title": T("五丈原", "Wuzhang Plains"), "year": T("建兴十二年秋（234）", "Autumn, Jianxing 12 (234)"), "canon": T("第103–104回", "Ch. 103–104"), "offer": 1,
     "intro": [P(T("入秋以后，丞相病倒了，吐了好几回血。他夜里出帐看天，回来以后一句话也不说。", "When autumn comes, the Chancellor falls ill and coughs blood more than once. He goes out of his tent at night to look at the sky, and comes back without a word."))]},
]

N = []
def cast_(*ids): return [{"id": i} for i in ids]

N.append(node("x_return7", "*", "interrupt", T("故人来信", "A Letter from an Old Friend"), "free", T("原创", "original"),
    [P(T("你离开蜀中已经很多年了。", "You left Shu many years ago."), F("prev.ended_early")),
     P(T("你在北方住了很多年，头发白了一半。", "You've lived in the north many years; your hair is half white."), V("track", "==", "cao")),
     P(T("丞相的信只有一句：『亮要北伐了。子衡兄，再陪亮走一程。』", "The Chancellor's letter is one line: 'I'm going north. Ziheng—walk one more stretch with me.'"))],
    [choice("back", "dilemma", T("动身去汉中。", "Set out for Hanzhong."),
            T("丞相在营门口等你，瘦得你差点没认出来。他笑着说：『来了就好。』", "The Chancellor waits at the camp gate, so thin you almost don't know him. He smiles. 'You came. Good.'"),
            [setv("flag.v7_came_back"), setv("track", "liu"), rel("zhuge", "warmth", 1)]),
     choice("hermit", "expression", T("把信收好，不去了。", "Put the letter away. You won't go."),
            T("几年以后，你听说丞相死在了五丈原。", "Some years later you hear the Chancellor died on the Wuzhang Plains."), [setv("flag.v7_hermit")])],
    when=AWAY, order=-2))
N[-1]["choices"][1]["ends"] = True

# ---------- c1 出师 ----------
N.append(node("c1_biao", "c1", "main", T("出师表", "The Memorial"), "literal", T("第91回", "Ch. 91"),
    [P(T("出兵前一夜，丞相把写好的表给你看。开头一句：『先帝创业未半，而中道崩殂；今天下三分，益州疲弊，此诚危急存亡之秋也。』后面写到自己：『臣本布衣，躬耕南阳，苟全性命于乱世，不求闻达于诸侯。』他问你：『子衡兄，还缺什么？』", "The night before the march, the Chancellor shows you the memorial he has written. It begins: the late emperor's great work was not half done when he fell midway; now the realm is split in three, Yi province is exhausted, and truly this is a moment of life and death. Further on, of himself: he was a commoner who ploughed at Nanyang, only seeking to keep alive in troubled times, not to be known among the lords. 'Ziheng,' he asks, 'what's missing?'")),
     P(T("你想起白帝城里，先帝把你们两个人的手放在一起。", "You remember Baidi, and the late emperor laying your two hands together."), F("flag.v5_entrusted"))],
    [choice("people", "strategy", T("说：多写几个能用的人名。丞相走了，陛下得知道该问谁。", "Say: name more of the men he can rely on. With you gone, His Majesty must know whom to ask."),
            T("丞相点头，提笔加上了郭攸之、费祎、董允、向宠的名字。他写完，看了你一眼：『子衡兄的名字，亮就不写了。你跟我走。』", "The Chancellor nods and adds the names of Guo Youzhi, Fei Yi, Dong Yun and Xiang Chong. When he's done he glances at you. 'I won't write yours, Ziheng. You're coming with me.'"),
            [setv("flag.v7_biao"), rel("zhuge", "esteem", 1), rel("zhuge", "trust", 1)], echo=["e_biao"]),
     choice("nothing", "dilemma", T("说：什么都不缺。", "Say: nothing's missing."),
            T("丞相把表卷起来：『今当远离，临表涕泣，不知所云。』他念完最后一句，自己笑了笑，眼睛是红的。", "The Chancellor rolls it up. 'Now that I go far away, I weep over this memorial and don't know what I've said.' He reads out the last line, gives a small laugh, and his eyes are red."),
            [rel("zhuge", "warmth", 2)]),
     choice("stay", "expression", T("说：丞相该多写一句——自己保重。", "Say: you should add one more line, Chancellor—take care of yourself."),
            T("丞相摇头：『这个，不能写。』", "The Chancellor shakes his head. 'That can't be written.'"), [rel("zhuge", "warmth", 1)])],
    quote=T("先帝创业未半，而中道崩殂；……臣本布衣，躬耕南阳，苟全性命于乱世，不求闻达于诸侯。……今当远离，临表涕泣，不知所云。",
            "The late emperor's work was not half done when he fell midway… I was a commoner who ploughed at Nanyang, seeking only to keep alive in a troubled age, not to be known among the lords… Now I go far away; I weep over this memorial and know not what I say."),
    when=STAY, order=10))

N.append(node("c1_child", "c1", "main", T("孩子", "A Child"), "free", T("原创人物", "original character"),
    T("出兵前，温芷把你拉到院子里那棵梅树下，压低了声音：『我有了。』她看着你：『你去吧。等你回来，孩子会叫人了。』", "Before the march, Wen Zhi draws you under the plum tree in the yard and lowers her voice. 'I'm with child.' She looks at you. 'Go. By the time you're back, it'll be able to say your name.'"),
    [choice("stay_word", "dilemma", T("抱住她：『我会回来。』", "Hold her. 'I'll come back.'"),
            T("那年冬天，你在汉中收到家书：是个孩子，母子平安。温芷在信里写：名字等你回来起。", "That winter a letter reaches you in Hanzhong: a child, mother and child both well. Wen Zhi writes: the name waits for you to come home."),
            [setv("flag.v7_child"), rel("wenzhi", "intimacy", 2)], echo=["e_child"]),
     choice("take", "strategy", T("说：你和孩子都留在成都，别随军了。", "Say: you and the child stay in Chengdu. No more following the army."),
            T("温芷想了很久，点了头：『这一回，听你的。』那年冬天，孩子出生了。", "Wen Zhi thinks a long time and nods. 'This once, I'll listen to you.' That winter the child is born."),
            [setv("flag.v7_child"), rel("wenzhi", "trust", 1), rel("wenzhi", "intimacy", 1)], echo=["e_child"])],
    when=ALL(WED, STAY), order=20))

N.append(talk_node("c1_zhuge", "c1", T("夜谈·诸葛亮", "Night Talk: Zhuge Liang"),
    T("出兵前最后一夜，丞相没睡。他把灯拨暗了些：『子衡兄，陪亮坐坐。』", "On the last night before the march, the Chancellor doesn't sleep. He turns the lamp down. 'Ziheng, sit with me.'"),
    "zhuge", 2,
    [topic("win", T("问他：这一仗，有几分把握？", "Ask him: how sure are you of this war?"),
           T("丞相想了很久：『先帝说过，汉贼不两立，王业不偏安。』他没有回答几分。", "The Chancellor thinks a long time. 'The late emperor said: Han and the usurper cannot both stand; a king's work can't settle for a corner.' He doesn't say how sure."),
           [rel("zhuge", "trust", 1)]),
     topic("health", T("说：丞相瘦了。", "Say: you've grown thin, Chancellor."),
           T("丞相摸了摸自己的脸，笑了：『子衡兄也老了。』", "The Chancellor touches his own face and smiles. 'You've grown old too, Ziheng.'"), [rel("zhuge", "warmth", 2)]),
     topic("longzhong", T("说起隆中。", "Speak of Longzhong."),
           T("丞相望着灯：『那年在草庐里，亮对先帝说了三分天下。如今三分了，亮还欠先帝一个“兴复汉室”。』", "The Chancellor looks at the lamp. 'That year in the cottage, I told the late emperor the realm would split in three. It has. I still owe him the restoration of the Han.'"),
           [rel("zhuge", "esteem", 1), rel("zhuge", "warmth", 1)])],
    T("你走的时候，丞相说：『明天，就从这里出发。』", "As you leave, the Chancellor says, 'Tomorrow we set out from here.'"), when=STAY, order=30))

N.append(node("c1_wz_north", "c1", "side", T("药箱", "The Medicine Chest"), "free", T("原创人物", "original character"),
    T("温芷又收拾了药箱：『北边冷，冻伤的人会多。』", "Wen Zhi packs her medicine chest again. 'It's cold in the north. There'll be frostbite.'"),
    [choice("go", "dilemma", T("让她随军。", "Let her come."), T("她把药箱背上了车。", "She heaves the chest onto the cart."), [rel("wenzhi", "trust", 1), rel("wenzhi", "intimacy", 1)]),
     choice("stay", "strategy", T("让她留在成都的医馆。", "Ask her to stay at the clinic in Chengdu."), T("她说：『那我把冻伤的方子写给你。』", "She says, 'Then I'll write out the frostbite remedies for you.'"), [rel("wenzhi", "esteem", 1)])],
    when=ALL(WZ, NF("flag.wz_wed"), STAY), salience=3, order=1))

N.append(node("c1_houzhu", "c1", "side", T("后主", "The Young Emperor"), "free", T("原创", "original"),
    T("陛下私下召你进宫，问：『相父这一去，朕在成都，该做什么？』", "His Majesty summons you privately. 'While the Father Chancellor is away, what should We do in Chengdu?'"),
    [choice("read", "strategy", T("说：每天读一遍相父的表。", "Say: read the Chancellor's memorial once a day."), T("陛下笑了：『那朕就背下来。』", "His Majesty laughs. 'Then We'll learn it by heart.'"), [rel("zhuge", "esteem", 1)]),
     choice("ask", "dilemma", T("说：多问董允。他会说难听的话，难听的话最有用。", "Say: ask Dong Yun often. He'll say unpleasant things, and unpleasant things are the most useful."),
            T("陛下愣了一下，点头。后来董允常常把话说得很难听，陛下也常常听。", "His Majesty starts, then nods. Later Dong Yun often says unpleasant things, and His Majesty often listens."), [add("renown.loyal")])],
    when=STAY, salience=2, order=2))

# ---------- c2 天水 ----------
N.append(node("c2_ziwu", "c2", "main", T("子午谷", "Ziwu Valley"), "functional", T("第92回", "Ch. 92"),
    T("魏延请战：给他五千精兵，出子午谷，十天就到长安城下。丞相不许：太险。魏延不服，转过头来看你：『先生说句公道话！』", "Wei Yan asks to go: give him five thousand picked men, out by Ziwu Valley, and in ten days he'll be under the walls of Chang'an. The Chancellor refuses: too risky. Wei Yan won't accept it, and turns to you. 'Master, say something fair!'"),
    [choice("back", "dilemma", T("说：险是险，可值得一试。", "Say: it's risky, but worth trying."),
            T("丞相还是没准。魏延看你的眼神不一样了：『全营只有先生懂我。』丞相看了你一眼，没说话。", "The Chancellor still won't allow it. But Wei Yan looks at you differently now. 'In this whole camp only the Master understands me.' The Chancellor glances at you and says nothing."),
            [setv("flag.v7_ziwu"), rel("weiyan", "trust", 2), rel("weiyan", "warmth", 1), rel("zhuge", "esteem", -1)], echo=["e_ziwu"]),
     choice("zhuge", "strategy", T("说：丞相用兵，求的是万全。子午谷一失，五千人就没了。", "Say: the Chancellor seeks a sure thing. Lose Ziwu Valley and five thousand men are gone."),
            T("魏延冷笑：『你们文官，都一个样。』他甩帘子出去了。", "Wei Yan laughs coldly. 'You civil officials are all the same.' He flings the curtain aside and walks out."),
            [rel("weiyan", "trust", -1), add("imp.weiyan.offended"), rel("zhuge", "esteem", 1)]),
     choice("both", "expression", T("说：子午谷可以先派人去探一探。", "Say: send someone to scout Ziwu Valley first."),
            T("丞相准了。探马回来说，谷里有魏兵。魏延没再说话。", "The Chancellor agrees. The scouts report Wei troops in the valley. Wei Yan says no more."), [rel("weiyan", "esteem", 1)])],
    when=STAY, order=10))

N.append(node("c2_jiangwei", "c2", "main", T("伯约", "Boyue"), "literal", T("第92–93回", "Ch. 92–93"),
    T("天水冀县的姜维，看穿了丞相的计，赵云都没占到便宜。丞相大喜，要收这个人。有人献计：姜维是孝子，母亲在冀县，假装去攻冀县，他必回城救母。丞相看你：『子衡兄以为如何？』", "Jiang Wei of Ji in Tianshui saw through the Chancellor's plan; not even Zhao Yun could get the better of him. The Chancellor is delighted and wants the man. Someone proposes: Jiang Wei is a devoted son with his mother in Ji; pretend to attack Ji, and he'll come back to save her. The Chancellor looks at you. 'What do you think, Ziheng?'"),
    [choice("mother", "dilemma", T("说：用他母亲做饵，他就算来了，心也不在这里。", "Say: use his mother as bait and even if he comes, his heart won't be here."),
            T("丞相想了想：『那就让他母亲平平安安。』后来姜维被逼得无处可去，下马投降。他第一句话问的是：『我母亲呢？』你说：平安。他朝你深深一拜。", "The Chancellor considers. 'Then his mother stays safe.' In the end Jiang Wei, cornered with nowhere to go, dismounts and surrenders. His first words: 'My mother?' Safe, you say. He bows deeply to you."),
            [setv("flag.v7_mother"), rel("jiangwei", "trust", 2), rel("jiangwei", "warmth", 1), rel("zhuge", "warmth", 1)], echo=["e_mother"]),
     choice("plan", "strategy", T("说：此计可行。孝子，正是可用之人。", "Say: the plan works. A devoted son is exactly the kind of man worth having."),
            T("计成了。姜维走投无路，下马投降。丞相亲手扶起他：『吾自出茅庐以来，遍求贤者……今遇伯约，吾愿足矣。』姜维看了你一眼。你知道他记住了这个计是谁赞成的。", "The plan works. With nowhere to go, Jiang Wei dismounts and surrenders. The Chancellor raises him with his own hands: since leaving the thatched cottage he has sought worthy men everywhere… now that he has found Boyue, his wish is fulfilled. Jiang Wei glances at you. You know he's remembered who approved the plan."),
            [rel("zhuge", "esteem", 1), rel("jiangwei", "esteem", 1), rel("jiangwei", "warmth", -1)]),
     choice("talk", "expression", T("说：让我去冀县城下，跟他说几句话。", "Say: let me go below the walls of Ji and speak with him."),
            T("你在城下喊了半天，姜维在城上一句也没回。可几天后他投降时，第一个找的是你：『那天城下的人，是先生？』", "You shout below the walls half the day, and Jiang Wei on the walls answers not a word. But when he surrenders days later, the first person he looks for is you. 'The man below the walls that day—was that you, Master?'"),
            [rel("jiangwei", "warmth", 2), add("renown.loyal")])],
    quote=T("我今降蜀，加为上将，安有还魏之理？……今遇伯约，吾愿足矣。",
            "\"I have come over to Shu and been made a general—how could I go back to Wei?\" … \"Now that I have met Boyue, my wish is fulfilled.\""),
    when=STAY, order=20))

N.append(node("c2_wanglang", "c2", "side", T("阵前", "Before the Lines"), "free", T("第93回", "Ch. 93"),
    T("魏国的司徒王朗，七十六岁，在两军阵前劝丞相投降。丞相坐在车上，听他说完，问你：『子衡兄，亮回他，还是你回他？』", "Wang Lang, Minister over the Masses of Wei, seventy-six years old, rides out between the lines to urge the Chancellor to surrender. The Chancellor sits in his carriage, hears him out, and asks you, 'Ziheng, shall I answer him, or will you?'"),
    [choice("zhuge", "expression", T("说：丞相来。", "Say: you answer him, Chancellor."),
            T("丞相开口：『皓首匹夫！苍髯老贼！汝即日将归于九泉之下，何面目见二十四帝乎！』王朗听罢，气满胸膛，大叫一声，撞死于马下。", "The Chancellor speaks: white-headed fool, grey-bearded old traitor—you'll soon go down to the Nine Springs; with what face will you meet the twenty-four emperors of Han? Hearing this, Wang Lang's chest swells with rage; he gives a great cry and falls dead from his horse."),
            [rel("zhuge", "esteem", 1)]),
     choice("self", "dilemma", T("你来，话说得留些余地。", "Answer yourself, and leave him some room."),
            T("你说得很客气，王朗也答得很客气，两边各自收兵。丞相事后说：『子衡兄心软。』他没说是好是坏。", "You speak courteously, Wang Lang answers courteously, and both sides withdraw. Afterward the Chancellor says, 'You're soft-hearted, Ziheng.' He doesn't say whether that's good or bad."),
            [rel("zhuge", "warmth", 1), add("renown.loyal")])],
    quote=T("皓首匹夫！苍髯老贼！汝即日将归于九泉之下，何面目见二十四帝乎！", "White-headed fool! Grey-bearded old traitor! Soon you will go down to the Nine Springs—with what face will you meet the twenty-four emperors?"),
    when=STAY, salience=2, order=1))

# ---------- c3 街亭 ----------
N.append(node("c3_jieting", "c3", "main", T("谁守街亭", "Who Holds Jieting"), "functional", T("第95回", "Ch. 95"),
    [P(T("马谡出班：『某自幼熟读兵书，颇知兵法。岂一街亭不能守耶？』他愿立军令状。丞相看着他，又看你。", "Ma Su steps forward: he has studied the books of war since childhood; can he not hold one Jieting? He offers to sign a pledge on his life. The Chancellor looks at him, then at you.")),
     P(T("你想起白帝城里，先帝压低声音说的那句话。你在南征路上，也跟丞相说过。", "You remember what the late emperor said in Baidi, his voice very low. You told the Chancellor, too, on the march south."), F("flag.v6_masu_doubt")),
     P(T("你当众夸过他的“攻心为上”。他也看了你一眼，像在等你开口。", "You once praised his 'win their hearts' in front of everyone. He glances at you too, as if waiting for you to speak."), F("flag.v6_masu_praise"))],
    [choice("with", "dilemma", T("自请随马谡去街亭，做他的参军。", "Ask to go to Jieting with Ma Su as his adviser."),
            T("丞相想了想，准了，又派王平为副将。临走前他拉住你：『当道扎营，切记。』", "The Chancellor considers and agrees, sending Wang Ping as his deputy as well. Before you go he takes your arm. 'Camp on the road. Don't forget.'"),
            [setv("flag.v7_jt_with"), rel("zhuge", "trust", 1)]),
     choice("road", "strategy", T("说：派他去可以，王平为副；令他当道扎营，画好营图送回来。", "Say: send him if you like, with Wang Ping as deputy; order him to camp on the road and send back a drawing of the camp."),
            T("丞相照你说的下了令。马谡领命去了。", "The Chancellor gives the orders as you said. Ma Su takes his command and goes."),
            [setv("flag.v7_jt_road"), rel("zhuge", "esteem", 1)]),
     choice("warn", "dilemma", T("说：先帝说过，此人言过其实。换人。", "Say: the late emperor said this man's words outrun his worth. Send someone else."),
            T("丞相沉默了很久。马谡跪下立了军令状：『若有差失，乞斩全家。』丞相叹了口气，还是让他去了。", "The Chancellor is silent a long while. Ma Su kneels and signs the pledge: if he fails, let his whole family die. The Chancellor sighs, and sends him all the same."),
            [setv("flag.v7_jt_warned"), rel("zhuge", "trust", 1), rel("zhuge", "warmth", -1)], echo=["e_warned"], when=MASU_DOUBT)],
    when=STAY, order=10))

N.append(node("c3_hill", "c3", "main", T("山上山下", "Hill or Road"), "literal", T("第95回", "Ch. 95"),
    [P(T("到了街亭，马谡看了地势，笑丞相多虑：『此处侧边一山，四面皆不相连，且树木极广，此乃天赐之险也。可就山上屯军。』王平急了：『参军差矣：若屯兵当道，筑起城垣，贼兵总有十万，不能偷过；今若弃此要路，屯兵于山上，倘魏兵骤至，四面围定，将何策保之？』两人都看着你。", "At Jieting Ma Su surveys the ground and laughs at the Chancellor's caution: here beside the road is a hill, cut off on all sides and thickly wooded—a natural stronghold; camp on the hill. Wang Ping is alarmed: if we wall the road, a hundred thousand couldn't slip past; abandon the road for the hill, and if Wei arrives and surrounds us, how will we hold? Both of them look at you."))],
    [choice("wangping", "dilemma", T("站到王平一边。马谡不听，你就和王平带一千人，守在当道的路口。", "Side with Wang Ping. If Ma Su won't listen, take a thousand men with Wang Ping and hold the road."),
            T("马谡上了山。司马懿到了，围山断水，山上的兵渴得自己乱了。马谡败下来的时候，是你和王平在路口接住了他，一路且战且退，带回来的人，比原来多了一半。", "Ma Su goes up the hill. Sima Yi arrives, surrounds it and cuts off the water; the men on the hill go mad with thirst. When Ma Su is driven down, it's you and Wang Ping at the road who catch him and fall back fighting; half again as many men come home as would have."),
            [setv("flag.v7_jt_wangping"), rel("zhuge", "esteem", 1), add("renown.loyal"), add("deviation")], echo=["e_road"]),
     choice("water", "strategy", T("劝马谡：要上山也行，先派兵守住山下的水源。", "Urge Ma Su: if you must go up, first post men to hold the water below."),
            T("马谡想了想，派了五百人。司马懿第一件事，就是把那五百人围了。山上还是断了水。", "Ma Su thinks and sends five hundred. The first thing Sima Yi does is surround those five hundred. The hill still loses its water."),
            [rel("zhuge", "esteem", 1)]),
     choice("masu", "expression", T("听马谡的。他是主将。", "Go with Ma Su. He's in command."),
            T("司马懿围山断水。山上的兵乱了，街亭丢了。你跟着马谡逃下山的时候，听见身后在喊。", "Sima Yi surrounds the hill and cuts the water. The men on the hill break, and Jieting is lost. As you flee down the hill with Ma Su, you hear the shouting behind you."),
            [])],
    quote=T("此处侧边一山，四面皆不相连，且树木极广，此乃天赐之险也。……今若弃此要路，屯兵于山上，倘魏兵骤至，四面围定，将何策保之？",
            "\"Beside the road is a hill, cut off on every side and thickly wooded—Heaven's own stronghold.\" … \"If we abandon this vital road and camp on the hill, and Wei arrives suddenly and surrounds us, how will we hold?\""),
    when=ALL(F("flag.v7_jt_with"), STAY), order=20))

# ---------- c4 空城 ----------
N.append(node("c4_kongcheng", "c4", "main", T("空城", "The Empty City"), "literal", T("第95回", "Ch. 95"),
    [P(T("丞相下令：旌旗都藏起来，大开四门，每门二十个兵扮作百姓扫街。他披上鹤氅，戴上纶巾，带两个小童，抱一张琴，上了城楼，焚香操琴。远远地，司马懿的大军到了。", "The Chancellor gives his orders: hide every banner, throw open all four gates, and at each gate twenty soldiers dressed as townsfolk sweep the street. He puts on his crane-feather cloak and silk cap, takes two boys and a zither up to the gate tower, lights incense and plays. In the distance Sima Yi's army arrives.")),
     P(T("你在城里。丞相回头看了你一眼：『子衡兄，你站哪里？』", "You're in the city. The Chancellor looks back at you. 'Ziheng, where will you stand?'"))],
    [choice("wall", "dilemma", T("上城楼，站在他身边，给他添香。", "Go up the tower and stand at his side, tending the incense."),
            T("司马懿在城下看了很久。你看见他的脸，也看见他在看你。他说：『亮平生谨慎，不曾弄险。今大开城门，必有埋伏。』魏军退了。丞相的手指停下的时候，在发抖。", "Sima Yi looks up from below a long time. You see his face, and see him looking at you. He says Liang has been cautious all his life and never gambled; with the gates wide open there must be an ambush. The Wei army withdraws. When the Chancellor's fingers stop on the strings, they're shaking."),
            [setv("flag.v7_wall"), rel("zhuge", "warmth", 2), rel("simayi", "esteem", 1)], echo=["e_wall"]),
     choice("gate", "strategy", T("换上百姓的衣服，去城门口扫街。", "Put on townsman's clothes and sweep the street at the gate."),
            T("魏军的先锋到了门口，看着你扫地。你没有抬头。后来他们退了，你才发现扫帚柄被你攥裂了。", "Wei's vanguard reaches the gate and watches you sweep. You don't look up. They withdraw, and only then do you notice you've cracked the broom handle in your grip."),
            [rel("zhuge", "esteem", 1), add("renown.loyal")]),
     choice("flee", "expression", T("劝丞相从后门走。", "Urge the Chancellor to leave by the back gate."),
            T("丞相笑着摇头：『走，就走不掉了。』他接着弹琴。魏军退了。", "The Chancellor smiles and shakes his head. 'If we run, we won't get away.' He keeps playing. The Wei army withdraws."),
            [rel("zhuge", "esteem", -1)])],
    quote=T("孔明乃披鹤氅，戴纶巾，引二小童携琴一张，于城上敌楼前，凭栏而坐，焚香操琴。……亮平生谨慎，不曾弄险。今大开城门，必有埋伏。",
            "Kongming put on his crane-feather cloak and silk cap, took two boys carrying a zither, sat at the rail before the gate tower, lit incense and played. … \"Liang has been cautious all his life and never taken a gamble. Now the gates are wide open—there must be an ambush.\""),
    callbacks=[cb("e_road", T("城里的两千五百人里，有一半是你和王平从街亭带回来的。", "Half of the twenty-five hundred in the city are men you and Wang Ping brought back from Jieting."), None)],
    when=STAY, order=10))

# ---------- c5 挥泪 ----------
N.append(node("c5_masu", "c5", "main", T("挥泪斩马谡", "Tears for Ma Su"), "functional", T("第96回", "Ch. 96"),
    [P(T("丞相要斩马谡。众将求情，丞相流着泪说：『昔孙武所以能制胜于天下者，用法明也。』马谡被推出去的时候，回头看你。", "The Chancellor means to behead Ma Su. The generals plead; weeping, the Chancellor says that Sun Wu could prevail across the realm because his law was clear. As Ma Su is led out, he looks back at you.")),
     P(T("街亭那条路口，是你和王平守住的。带回来的人里，有一半是马谡的兵。", "You and Wang Ping held the road at Jieting. Half of the men you brought back were Ma Su's."), F("flag.v7_jt_wangping"))],
    twin(SAVE_MASU,
         choice("plead", "dilemma", T("跪下：街亭之败，臣在场，臣也有罪。马谡的命，留着；他的官，削了。", "Kneel: I was at Jieting, and the defeat is mine too. Spare Ma Su's life; strip him of his rank."),
                [P(T("丞相看着你，眼泪流了下来。很久，他说：『杖八十，削为庶人，永不叙用。』马谡被抬下去的时候，抓着你的袖子，什么也说不出。", "The Chancellor looks at you and the tears run down. After a long time he says: eighty strokes, stripped to a commoner, never to serve again. As Ma Su is carried away, he clutches your sleeve and can't say a word.")),
                 P(T("丞相又哭先帝：『吾思先帝在白帝城临危之时曾嘱吾曰：马谡言过其实，不可大用。』", "Then the Chancellor weeps for the late emperor: he remembers how the late emperor, near death at Baidi, told him Ma Su's words outran his worth and he must not be given great charge."))],
                [setv("flag.masu_alive"), rel("zhuge", "trust", 1), add("deviation", 3), add("renown.loyal", 2)]),
         choice("plead", "dilemma", T("跪下替马谡求情。", "Kneel and plead for Ma Su."),
                T("丞相摇头，泪流满面：『他立了军令状。』马谡还是被斩了。丞相上表：『请自贬三等，以督阙咎。』", "The Chancellor shakes his head, tears streaming. 'He signed the pledge.' Ma Su is executed all the same. The Chancellor writes to the throne, asking to be demoted three grades for his own fault."),
                [rel("zhuge", "warmth", 1), add("renown.loyal")])) +
    [choice("law", "strategy", T("不说话。军令状是他自己立的。", "Say nothing. He signed the pledge himself."),
            T("马谡被斩了。丞相哭了很久，又哭先帝：『吾思先帝在白帝城临危之时曾嘱吾曰：马谡言过其实，不可大用。』", "Ma Su is executed. The Chancellor weeps a long time, and then weeps for the late emperor: at Baidi, near death, the late emperor warned him Ma Su's words outran his worth."),
            [rel("zhuge", "esteem", 1)]),
     choice("family", "expression", T("答应马谡：他的家小，你来照看。", "Promise Ma Su: you'll look after his family."),
            T("马谡磕了一个头。后来，他的家小每月都收到一份钱粮，不知道是谁送的。", "Ma Su knocks his head once. Afterward his family receives money and grain every month, and never learns from whom."),
            [add("renown.loyal"), rel("zhuge", "warmth", 1)])],
    quote=T("昔孙武所以能制胜于天下者，用法明也。……请自贬三等，以督阙咎。",
            "\"Sun Wu prevailed across the realm because his law was clear.\" … \"I ask to be demoted three grades, to answer for my fault.\""),
    callbacks=[cb("e_warned", T("丞相说：『子衡兄劝过亮。是亮不听。』", "The Chancellor says, 'You warned me, Ziheng. I wouldn't listen.'"), None)],
    when=STAY, order=10))

N.append(node("c5_jiangwei", "c5", "side", T("兵书", "The Book of War"), "free", T("原创", "original"),
    T("姜维每天夜里在丞相帐外抄兵书，抄完一卷，就来问你哪里没懂。今晚他问：『街亭，若是先生守，会怎么守？』", "Every night Jiang Wei copies books of war outside the Chancellor's tent, and when he finishes a scroll he comes to ask you what he didn't follow. Tonight he asks, 'Jieting—if you'd held it, Master, how would you have done it?'"),
    [choice("road", "strategy", T("在地上画给他看：当道，筑垒，引水。", "Draw it for him in the dirt: on the road, walls, water."),
            T("姜维看了很久，把你画的图描在了纸上。", "Jiang Wei studies it a long time and copies your drawing onto paper."), [rel("jiangwei", "esteem", 2), rel("jiangwei", "trust", 1)]),
     choice("man", "dilemma", T("说：守街亭靠的不是图，是人。先看清派去的是谁。", "Say: Jieting isn't held by maps but by men. First see clearly who you send."),
            T("姜维沉默了：『伯约记下了。』", "Jiang Wei is quiet. 'I'll remember.'"), [rel("jiangwei", "warmth", 1), rel("jiangwei", "trust", 1)])],
    when=STAY, salience=3, order=1))

N.append(node("c5_wz_letter7", "c5", "side", T("家书", "A Letter Home"), "free", T("原创人物", "original character"),
    [P(T("温芷的信到了。信里夹着一张纸，上面是孩子的小手印。", "A letter from Wen Zhi. Folded inside is a sheet with a tiny handprint on it."), F("flag.v7_child")),
     P(T("温芷的信到了：医馆收了几个冻伤的兵，问你在北边冷不冷。", "A letter from Wen Zhi: the clinic has taken in a few frostbitten soldiers, and she asks if you're cold in the north."), NF("flag.v7_child"))],
    [choice("write", "dilemma", T("回信，写很长。", "Write back, a long letter."), T("你写了一夜。天亮时，信纸摞了一指厚。", "You write all night. By dawn the pages are a finger thick."), [rel("wenzhi", "intimacy", 1), rel("wenzhi", "warmth", 1)]),
     choice("short", "expression", T("回一句：平安。", "Write back one line: safe."), T("她回信说：一句也好。", "She writes back: one line is enough."), [rel("wenzhi", "trust", 1)])],
    when=ALL(WZ, STAY), salience=4, order=2))

# ---------- c6 子龙 ----------
N.append(talk_node("c6_zilong", "c6", T("夜谈·赵云", "Night Talk: Zhao Yun"),
    T("你从汉中赶回成都。赵云躺在床上，听见你进来，挣扎着要坐起来：『先生……来得正好。』", "You hurry back from Hanzhong to Chengdu. Zhao Yun lies in bed; hearing you come in, he struggles to sit up. 'Master… just in time.'"),
    "zhaoyun", 2,
    [topic("changban", T("说起长坂坡。", "Speak of Changban."),
           T("赵云笑了：『那天我抱着阿斗……阿斗如今是陛下了。』他闭上眼，『值了。』", "Zhao Yun smiles. 'That day I held A Dou… A Dou is His Majesty now.' He closes his eyes. 'It was worth it.'"), [rel("zhaoyun", "warmth", 2)]),
     topic("north", T("告诉他北边的事。", "Tell him about the north."),
           T("赵云听得很认真，听到街亭，叹了口气；听到空城，笑出了声。『丞相……要保重。』", "Zhao Yun listens carefully; at Jieting he sighs, and at the empty city he laughs aloud. 'The Chancellor… must take care.'"), [rel("zhaoyun", "trust", 1)]),
     topic("spear", T("问他：那杆枪，交给谁？", "Ask him: that spear—who gets it?"),
           T("赵云想了想：『给伯约吧。他用得上。』", "Zhao Yun thinks. 'Give it to Boyue. He'll have use for it.'"), [rel("zhaoyun", "warmth", 1), rel("jiangwei", "warmth", 1)])],
    T("几天以后，赵云去世了。丞相在汉中听到消息，跌足而哭，说自己去了一条臂膀。", "A few days later Zhao Yun dies. In Hanzhong the Chancellor hears the news, stamps his foot and weeps, saying he has lost an arm."), when=STAY, order=10))

N.append(node("c6_old", "c6", "main", T("桃园", "The Peach Garden"), "free", T("原创", "original"),
    [P(T("关羽也老了。他在成都病倒的那个冬天，让人去汉中叫你。你赶到的时候，他已经说不了几句话。他握着你的手：『子衡……麦城那回，谢了。』", "Guan Yu has grown old too. The winter he falls ill in Chengdu, he sends to Hanzhong for you. By the time you arrive he can barely speak. He takes your hand. 'Ziheng… Maicheng. Thank you.'"), GUAN),
     P(T("张飞老了，喝不动酒了。他病倒的那个冬天，让人去汉中叫你。他拉着你的手，嗓门还是很大：『先生！阆中那一夜……俺记着！』", "Zhang Fei has grown old and can't drink anymore. The winter he falls ill, he sends to Hanzhong for you. He grips your hand, his voice still loud. 'Master! That night at Langzhong… I remember!'"), ALL(FEI, NF("flag.guan_alive")))],
    [choice("stay", "dilemma", T("守着他，直到最后。", "Stay with him to the end."),
            T("他走得很安静。桃园里结义的三个人，到这里都走完了。你在他床边坐到天亮。", "He goes quietly. The three who swore brotherhood in the peach garden have all gone now. You sit by his bed until dawn."),
            [setv("flag.v7_old_farewell"), setv("flag.guan_alive", False), setv("flag.fei_alive", False), add("renown.loyal")]),
     choice("story", "strategy", T("给他讲北伐的事，讲到他睡着。", "Tell him about the northern march until he falls asleep."),
            T("你讲到空城，他笑了一声，就再没有醒。", "When you get to the empty city he laughs once, and never wakes again."),
            [setv("flag.v7_old_farewell"), setv("flag.guan_alive", False), setv("flag.fei_alive", False)])],
    when=ALL(ANY(GUAN, FEI), STAY), order=15))

N.append(node("c6_feud", "c6", "main", T("魏延与杨仪", "Wei Yan and Yang Yi"), "functional", T("第98–101回", "Ch. 98–101"),
    T("魏延又和长史杨仪吵了起来。魏延拔了刀，杨仪哭着去找丞相。丞相两边都舍不得，把你叫来：『子衡兄，这两个人，你看怎么办？』", "Wei Yan has quarrelled with the chief clerk Yang Yi again. Wei Yan drew his blade, and Yang Yi went weeping to the Chancellor. The Chancellor can spare neither, and sends for you. 'Ziheng, what do we do about these two?'"),
    [choice("mend", "dilemma", T("去魏延营里，跟他喝一夜酒，再去杨仪那里坐一夜。", "Go to Wei Yan's camp and drink with him all night, then sit up a night with Yang Yi."),
            T("两个人都给了你面子，那个月没再吵。魏延说：『先生是个实在人。』杨仪说：『先生太好说话了。』", "Both of them give you face, and they don't quarrel again that month. Wei Yan says, 'The Master is a straight man.' Yang Yi says, 'The Master is too easygoing.'"),
            [setv("flag.v7_feud"), rel("weiyan", "warmth", 2), rel("weiyan", "trust", 1), rel("zhuge", "warmth", 1)], echo=["e_feud"]),
     choice("split", "strategy", T("说：一个管前军，一个管粮草，别让他们在一个帐里。", "Say: give one the vanguard and the other the supplies, and keep them out of the same tent."),
            T("丞相照办了。两个人见面少了，仇却没少。", "The Chancellor does it. They meet less, but the hatred doesn't lessen."), [rel("zhuge", "esteem", 1)]),
     choice("yangyi", "expression", T("说：魏延拔刀，就是不对。", "Say: Wei Yan drew his blade. That's wrong, plain and simple."),
            T("魏延知道了，从此看见你就扭头。", "Wei Yan hears of it, and from then on turns his head away whenever he sees you."), [rel("weiyan", "trust", -2), add("imp.weiyan.offended")])],
    callbacks=[cb("e_ziwu", T("魏延说：『子午谷那回，只有先生替我说话。』", "Wei Yan says, 'At Ziwu Valley, only you spoke for me, Master.'"), None)],
    when=STAY, order=20))

N.append(node("c6_student", "c6", "main", T("学生", "A Student"), "free", T("原创人物", "original character"),
    T("营里有个年轻的书佐，十九岁，字写得好，话很少，每天替你誊抄文书。今天他鼓起勇气问你：『先生，我能跟您学吗？』", "There's a young clerk in camp, nineteen, with a fine hand and few words, who copies your documents every day. Today he works up the courage to ask, 'Master, may I study with you?'"),
    [choice("yes", "dilemma", T("收下他。", "Take him on."),
            T("他跪下磕了三个头。从那天起，你说的话，他都记在一个本子上。", "He kneels and knocks his head three times. From that day on he writes down everything you say in a notebook."),
            [setv("flag.v7_student"), add("renown.loyal")]),
     choice("jiangwei", "strategy", T("说：你该去跟姜维学。", "Say: you should study under Jiang Wei."),
            T("他去了。后来他跟着姜维，打了很多年仗。", "He goes. Later he follows Jiang Wei through many years of war."), [rel("jiangwei", "trust", 1)])],
    when=ALL(NF("flag.v7_child"), STAY), order=30))

# ---------- c7 上方谷 ----------
N.append(node("c7_shangfang", "c7", "main", T("上方谷", "Shangfang Valley"), "literal", T("第103回", "Ch. 103"),
    [P(T("丞相在上方谷里埋了地雷火药，让魏延诱司马懿进谷。司马懿父子果然进来了。火起的时候，忽然下起了倾盆大雨，火全灭了。丞相叹道：『谋事在人，成事在天。不可强也！』", "The Chancellor has buried fire and powder in Shangfang Valley and sends Wei Yan to lure Sima Yi in. Sima Yi and his sons do come in. Just as the fire takes, a downpour falls and puts it all out. The Chancellor sighs: man proposes, Heaven disposes; it can't be forced.")),
     P(T("魏延退出谷来，满脸烟灰，大骂：谷口的火，差点把他也烧在里面。", "Wei Yan comes out of the valley, his face black with smoke, cursing: the fire at the valley mouth nearly burned him in there too."))],
    [choice("warned", "dilemma", T("火起之前，你就派人告诉魏延：出谷别走谷口。", "Before the fire, you sent word to Wei Yan: don't come out by the valley mouth."),
            T("魏延从侧边的小路出来，身上一点灰都没有。他找到你，什么也没说，给你倒了一碗酒。", "Wei Yan comes out by a side path without a speck of ash on him. He finds you, says nothing, and pours you a bowl of wine."),
            [setv("flag.v7_warned_weiyan"), rel("weiyan", "trust", 2), rel("weiyan", "warmth", 1), rel("zhuge", "esteem", -1)]),
     choice("calm", "strategy", T("去劝魏延：火是冲着司马懿的，不是冲着你。", "Go and calm Wei Yan: the fire was meant for Sima Yi, not you."),
            T("魏延不信：『那谷口为什么要烧？』你答不上来。", "Wei Yan doesn't believe it. 'Then why was the valley mouth set to burn?' You have no answer."), [rel("weiyan", "esteem", 1)]),
     choice("rain", "expression", T("什么也不说，看着雨。", "Say nothing. Watch the rain."),
            T("雨下了一整夜。丞相在帐里咳了一整夜。", "It rains all night. The Chancellor coughs all night in his tent."), [rel("zhuge", "warmth", 1)])],
    quote=T("谋事在人，成事在天。不可强也！", "Man proposes; Heaven disposes. It cannot be forced!"),
    callbacks=[cb("e_feud", T("魏延说：『先生给我和杨仪说过和。这回，杨仪在丞相面前怎么说我，先生也听见了吧？』", "Wei Yan says, 'You made peace between me and Yang Yi once, Master. This time—you heard what Yang Yi said about me to the Chancellor, didn't you?'"), None)],
    when=STAY, order=10))

N.append(node("c7_envoy", "c7", "main", T("巾帼", "A Woman's Clothes"), "literal", T("第103回", "Ch. 103"),
    [P(T("司马懿坚守不出。丞相让人把一套女人的衣裳装进盒子，派使者送去。他问：谁去？", "Sima Yi holds fast and won't come out. The Chancellor has a set of women's clothes packed in a box and sent by envoy. Who goes, he asks.")),
     P(T("你去了。司马懿打开盒子，笑了笑，收下了，还请你喝茶。他不问打仗的事，只问：『孔明寝食及事之烦简若何？』", "You go. Sima Yi opens the box, smiles, accepts it, and invites you to tea. He asks nothing about the war—only how Kongming eats and sleeps, and how heavy his work is."))],
    [choice("truth", "dilemma", T("照实说：丞相每天睡得很少，吃得很少，二十杖以上的罚，都要亲自看。", "Tell the truth: the Chancellor sleeps little, eats little, and personally reviews every punishment of twenty strokes or more."),
            T("司马懿点点头，送你出营。你走出很远，听见他对身边的人说：『孔明食少事烦，其能久乎！』", "Sima Yi nods and sees you out. You're well away before you hear him say to those beside him that Kongming eats little and works much—how long can he last?"),
            [setv("flag.v7_envoy"), rel("simayi", "esteem", 1), rel("simayi", "trust", 1)], echo=["e_envoy"]),
     choice("lie", "strategy", T("说：丞相一顿能吃三碗饭。", "Say: the Chancellor eats three bowls of rice at a sitting."),
            T("司马懿看着你，笑了：『先生的脸色，比你的话诚实。』", "Sima Yi looks at you and smiles. 'Your face is more honest than your words, Master.'"),
            [setv("flag.v7_envoy"), rel("simayi", "esteem", 2)], echo=["e_envoy"]),
     choice("silent", "expression", T("说：丞相的事，不劳都督挂念。", "Say: the Chancellor's affairs needn't concern the Grand Commander."),
            T("司马懿也不恼：『好。先生请回。』", "Sima Yi isn't put out. 'Very well. You may go, Master.'"), [setv("flag.v7_envoy"), rel("simayi", "esteem", 1)])],
    quote=T("孔明食少事烦，其能久乎！", "Kongming eats little and works much—how long can he last?"),
    when=STAY, order=20))

N.append(talk_node("c7_jiangwei", "c7", T("夜谈·姜维", "Night Talk: Jiang Wei"),
    T("姜维在营外站岗，替丞相守夜。他看见你，压低了声音：『先生，丞相今夜又吐血了。』", "Jiang Wei is standing guard outside, keeping watch for the Chancellor. Seeing you, he lowers his voice. 'Master, the Chancellor coughed blood again tonight.'"),
    "jiangwei", 2,
    [topic("after", T("问他：丞相要是不在了，你怎么办？", "Ask him: if the Chancellor were gone, what would you do?"),
           T("姜维很久没说话。最后他说：『接着打。丞相要的，我替他拿回来。』你从他的眼睛里，看见了你自己年轻的时候。", "Jiang Wei says nothing for a long time. At last: 'Keep fighting. What the Chancellor wanted, I'll take back for him.' In his eyes you see yourself when you were young."),
           [rel("jiangwei", "trust", 1), rel("jiangwei", "esteem", 1)]),
     topic("mother", T("问起他母亲。", "Ask about his mother."),
           [P(T("姜维笑了：『她还在冀县。先生那时候替她说过话，我一直记着。』", "Jiang Wei smiles. 'She's still in Ji. You spoke for her back then, Master. I've never forgotten.'"), F("flag.v7_mother")),
            P(T("姜维低下头：『她来信说，叫我别回去了。』", "Jiang Wei lowers his head. 'She wrote that I shouldn't come back.'"), NF("flag.v7_mother"))],
           [rel("jiangwei", "warmth", 2)]),
     topic("teach", T("把你这些年记下的东西，说给他听。", "Tell him what you've written down over the years."),
           T("你们说到天亮。姜维说：『先生，伯约有两个老师了。』", "You talk until dawn. Jiang Wei says, 'Master, I have two teachers now.'"),
           [rel("jiangwei", "esteem", 2), rel("jiangwei", "warmth", 1)])],
    T("你走的时候，姜维说：『先生，您也要保重。』", "As you leave, Jiang Wei says, 'Master, take care of yourself too.'"), when=STAY, order=30))
N[-1]["callbacks"] = [cb("e_mother", T("姜维说：『我母亲来信，问起那位替她说过话的先生。』", "Jiang Wei says, 'My mother wrote. She asked after the gentleman who spoke up for her.'"), None)]

# ---------- c8 五丈原 ----------
N.append(node("c8_lamp", "c8", "main", T("禳星", "The Seven Lamps"), "literal", T("第103回", "Ch. 103"),
    [P(T("丞相在帐中设了七星灯，主灯一盏。他说：七日之内主灯不灭，可以再活十二年。他让姜维带四十九个人守在帐外。第六夜，主灯还亮着。外面忽然喊声大作：魏兵来了。", "In his tent the Chancellor sets out seven lamps for the Northern Dipper, with one master lamp. If the master lamp burns seven days without going out, he says, he may live twelve more years. He sets Jiang Wei and forty-nine men to guard outside. On the sixth night the master lamp still burns. Then shouting outside: the Wei army is coming.")),
     P(T("你在帐外。魏延提着刀，急急忙忙地往帐里闯，要报军情。", "You're outside the tent. Wei Yan, blade in hand, is rushing for the entrance to report."))],
    [choice("guard", "dilemma", T("拦住魏延：『军情我来报。你别进去。』", "Stop Wei Yan. 'I'll make the report. Don't go in.'"),
            T("魏延愣了一下，站住了。你掀开帘子，轻轻走进去。主灯还亮着。你刚要开口，一阵风从帐缝里钻进来——主灯灭了。丞相弃剑而叹：『死生有命，不可得而禳也！』他看着你：『不怪你。也不怪他。』", "Wei Yan pulls up short. You lift the flap and step softly inside. The master lamp still burns. You open your mouth to speak, and a gust slips in through a gap in the tent—the master lamp goes out. The Chancellor lets fall his sword and sighs: life and death are fated; they cannot be prayed away. He looks at you. 'It isn't your fault. Nor his.'"),
            [setv("flag.v7_lamp_guard"), rel("weiyan", "trust", 1), rel("zhuge", "warmth", 1)]),
     choice("let", "expression", T("来不及拦。", "There's no time to stop him."),
            T("魏延脚步急，竟将主灯扑灭。姜维拔剑要杀魏延，丞相拦住了：『此吾命当绝，非文长之过也。』他弃剑而叹：『死生有命，不可得而禳也！』", "In his haste Wei Yan knocks the master lamp out. Jiang Wei draws his sword to kill him; the Chancellor stops him—it's his fate that has run out, not Wenchang's fault. He lets fall the sword and sighs: life and death are fated; they cannot be prayed away."),
            [rel("jiangwei", "trust", 1)]),
     choice("kneel", "strategy", T("走进帐里，跪在丞相身边，替他看着灯。", "Go into the tent and kneel beside the Chancellor, watching the lamp for him."),
            T("魏延闯进来的时候，你伸手去护那盏灯，还是慢了一步。丞相拉住你的手：『子衡兄，算了。』", "When Wei Yan bursts in, you reach out to shield the lamp and are a moment too slow. The Chancellor takes your hand. 'Ziheng. Let it be.'"),
            [rel("zhuge", "warmth", 2)])],
    quote=T("延脚步急，竟将主灯扑灭。……死生有命，不可得而禳也！", "In his haste Yan knocked out the master lamp. … \"Life and death are fated; they cannot be prayed away!\""),
    when=STAY, order=10))

N.append(node("c8_last", "c8", "main", T("秋风五丈原", "Autumn Wind on the Wuzhang Plains"), "literal", T("第104回", "Ch. 104"),
    [P(T("丞相让人扶着，坐上小车，出营看了一圈。秋风吹得他发抖。他叹道：『再不能临阵讨贼矣！悠悠苍天，曷此其极！』回到帐里，他把姜维叫到床前，把一生写下的兵书交给他：『吾兵法皆授与姜维，他自能继吾之志，为国家出力。』", "With help, the Chancellor is lifted into a small carriage and taken round the camp once. The autumn wind sets him shivering. He sighs: never again to face the enemy in battle; O distant Heaven, where is the end of this? Back in his tent he calls Jiang Wei to the bed and gives him the books of war he has written all his life: all his art of war he passes to Jiang Wei, who will carry on his purpose and serve the realm.")),
     P(T("然后他转过头来找你。", "Then he turns his head to look for you."))],
    twin(TRUSTED,
         choice("fan", "dilemma", T("坐到床边。", "Sit at the bedside."),
                T("丞相把那把白羽扇放进你手里：『白帝城那天，先帝把我们两个人的手放在一起。如今亮先走一步。伯约年轻，陛下也年轻……子衡兄，替亮看着。』你握着扇子，说不出话。那天是建兴十二年秋八月二十三日，丞相寿五十四岁。", "The Chancellor puts the white feather fan into your hand. 'That day at Baidi the late emperor laid our two hands together. Now I go first. Boyue is young, and so is His Majesty… Ziheng—watch over them for me.' You hold the fan and can't speak. It is the twenty-third day of the eighth month, autumn, in the twelfth year of Jianxing. The Chancellor was fifty-four."),
                [setv("flag.v7_fan"), rel("jiangwei", "trust", 2), add("renown.loyal", 2)]),
         choice("fan", "dilemma", T("坐到床边。", "Sit at the bedside."),
                T("丞相拉着你的手：『子衡兄，这些年，辛苦了。』他闭上眼睛，再没有睁开。那天是建兴十二年秋八月二十三日，丞相寿五十四岁。", "The Chancellor takes your hand. 'Ziheng, all these years—thank you.' He closes his eyes and never opens them again. It is the twenty-third day of the eighth month, autumn, in the twelfth year of Jianxing. The Chancellor was fifty-four."),
                [rel("jiangwei", "trust", 1), add("renown.loyal")])) +
    [choice("weiyan", "strategy", T("趁丞相还清醒，劝他：魏延和杨仪，给魏延留一条路。", "While he's still clear, urge him: Wei Yan and Yang Yi—leave Wei Yan a way through."),
            T("丞相想了很久，让人拿笔来，写了一封信，封好交给你：『等亮走了，文长要是闹，你把这个给他看。』那天夜里，丞相走了，寿五十四岁。", "The Chancellor thinks a long time, then calls for a brush, writes a letter, seals it and gives it to you. 'When I'm gone, if Wenchang makes trouble, show him this.' That night the Chancellor dies, aged fifty-four."),
            [setv("flag.v7_weiyan_word"), rel("weiyan", "trust", 1), add("deviation")])],
    quote=T("再不能临阵讨贼矣！悠悠苍天，曷此其极！……吾兵法皆授与姜维，他自能继吾之志，为国家出力。",
            "\"Never again shall I face the rebels in battle! O distant Heaven, where is the end?\" … \"All my art of war I pass to Jiang Wei; he will carry on my purpose and serve the realm.\""),
    callbacks=[cb("e_wall", T("丞相说：『空城那天，你站在亮身边。亮的手在抖，你看见了。』", "The Chancellor says, 'At the empty city you stood beside me. My hands were shaking. You saw.'"), None),
               cb("e_biao", T("丞相说：『出师表里那几个名字，是你让亮写的。陛下用得上。』", "The Chancellor says, 'Those names in the Memorial—you had me write them. His Majesty will need them.'"), None),
               cb("e_envoy", T("丞相笑了一下：『司马仲达问亮吃得多少。你怎么答的？』", "The Chancellor smiles faintly. 'Sima Zhongda asked how much I eat. What did you tell him?'"), None),
               cb("e_child", T("丞相说：『你的孩子，该会叫人了吧。』", "The Chancellor says, 'Your child must be talking by now.'"), None)],
    when=STAY, order=20))

N.append(node("c8_wz_home", "c8", "side", T("回家", "Home"), "free", T("原创人物", "original character"),
    [P(T("护送灵柩回成都的路上，你收到温芷的信：孩子会写自己的名字了。", "On the road escorting the coffin back to Chengdu, a letter reaches you from Wen Zhi: the child can write its own name now."), F("flag.v7_child")),
     P(T("护送灵柩回成都的路上，你收到温芷的信，只有一行：『回来吧。』", "On the road escorting the coffin back to Chengdu, a letter reaches you from Wen Zhi. One line: 'Come home.'"), NF("flag.v7_child"))],
    [choice("home", "dilemma", T("回成都以后，辞官回家。", "Once back in Chengdu, resign and go home."),
            T("陛下没准，只给了你三个月的假。三个月里，你每天都在院子里。", "His Majesty won't allow it, but gives you three months' leave. For three months you're in your yard every day."), [rel("wenzhi", "intimacy", 2)]),
     choice("serve", "strategy", T("回信：丞相的担子，我还得替他挑一阵。", "Write back: I still have to carry the Chancellor's load for a while."),
            T("她回信说：『我知道。』", "She writes back: 'I know.'"), [rel("wenzhi", "trust", 1)])],
    when=ALL(WZ, STAY), salience=5, order=1))

# ---------- crises ----------
def crisis(id, title, intro, choices, when, order):
    return node(id, "*", "interrupt", title, "free", T("原创危机", "original crisis"), intro, choices, when=when, order=order)
N.append(crisis("x_cold7", T("冷落", "Sidelined"),
    T("丞相已经很久没有问过你了。姜维私下说：『先生，丞相心里有事。』", "It's been a long time since the Chancellor asked your opinion. Jiang Wei says privately, 'Master, something's on the Chancellor's mind.'"),
    [choice("mend", "strategy", T("去找丞相，把话说开。", "Go to the Chancellor and talk it through."), T("你们谈了一夜。天亮时，丞相说：『是亮想多了。』", "You talk all night. At dawn the Chancellor says, 'I've been overthinking.'"), [rel("zhuge", "trust", 2)],
            req=AT("jiangwei", "trust", 2), hint=T("需要姜维的信任在「可托」以上，才有人替你说一句话", "Needs Jiang Wei's trust at Reliable or above for someone to put in a word")),
     choice("wait", "expression", T("等。做好手上的事。", "Wait. Do the work in front of you."), T("你的位子挪到了后排。", "Your seat moves to the back row."), [rel("zhuge", "trust", 1), setv("flag.sidelined")]),
     choice("go", "dilemma", T("告辞。", "Take your leave."), T("丞相没有留你。", "The Chancellor doesn't ask you to stay."), [setv("flag.v7_left")])],
    ALL(UPTO("zhuge", "trust", 0), STAY), 3))
N[-1]["choices"][2]["ends"] = True
N.append(crisis("x_uncanny7", T("妖人", "Sorcerer"),
    T("魏营里都在传：诸葛亮身边有个老先生，什么都知道。司马懿派人来打听你的名字。", "In the Wei camp they're saying Zhuge Liang has an old man beside him who knows everything. Sima Yi has sent men to learn your name."),
    [choice("hide", "strategy", T("从此闭口。", "Hold your tongue from now on."), T("人们慢慢忘了。", "People slowly forget."), [add("uncanny", -2), rel("zhuge", "trust", 1)]),
     choice("leave", "dilemma", T("离开，免得连累丞相。", "Leave, so the Chancellor isn't tainted by you."), T("你在一个雨夜出了营。", "You leave the camp one rainy night."), [setv("flag.v7_exposed")])],
    ALL(V("uncanny", ">=", 8), STAY), 2))
N[-1]["choices"][1]["ends"] = True
N.append(crisis("x_loose7", T("失言", "A Slip of the Tongue"),
    T("你说过的那些话，有人抄了下来，送到了丞相案头。", "Someone has copied down things you've said and put them on the Chancellor's desk."),
    [choice("own", "strategy", T("认：话说过了头。", "Own it: you spoke out of turn."), T("丞相没有罚你：『子衡兄，管住嘴。』", "The Chancellor doesn't punish you. 'Ziheng—mind your tongue.'"), [add("renown.rash", -3), rel("zhuge", "trust", -1)]),
     choice("argue", "dilemma", T("辩：句句是真话。", "Argue: every word was true."), T("『有些真话，要挑时候说。』", "'Some truths need the right moment.'"), [add("renown.rash", -1), rel("zhuge", "esteem", 1)])],
    ALL(V("renown.rash", ">=", 6), STAY), 4))
N.append(node("x_weiyan_rage", "*", "flash", T("魏延拔刀", "Wei Yan Draws"), "free", T("原创", "original"),
    T("魏延的刀已经出鞘了一半：『你再说一遍！』", "Wei Yan's blade is half out of its sheath. 'Say that again!'"),
    [choice("bow", "expression", T("拱手赔罪。", "Bow and apologize."), T("魏延哼了一声，把刀推了回去。", "Wei Yan snorts and slams the blade home."), [rel("weiyan", "esteem", -1), add("renown.rash")]),
     choice("stand", "dilemma", T("不退：『你拔刀，丞相就护不住你了。』", "Don't back down: 'Draw that, and the Chancellor can't protect you anymore.'"),
            T("魏延盯着你看了很久，把刀收了回去：『先生说得对。』", "Wei Yan stares at you a long time, then sheathes the blade. 'You're right, Master.'"), [rel("weiyan", "esteem", 1), rel("weiyan", "trust", 1), add("renown.rash", 2)])]))

# ------------------------------------------------------------------ open questions
ASKS = {
  "c2_jiangwei": {"who": "jiangwei", "fallback": "dodge",
    "q": T("那天夜里，姜维来找你，跪在你面前：『先生，我母亲在冀县，我降了蜀。你说，我是不是不孝？』", "That night Jiang Wei comes to you and kneels. 'Master, my mother is in Ji, and I've come over to Shu. Tell me—am I an unfilial son?'"),
    "answers": [
      ans("no", T("说不是，忠孝难两全", "says no—loyalty and filial duty can't always both be kept"), T("姜维的眼泪掉了下来：『先生……』他磕了一个头。", "Tears fall from Jiang Wei's eyes. 'Master…' He knocks his head once."), [rel("jiangwei", "warmth", 2), rel("jiangwei", "trust", 1)], match=r"不是|两全|忠|没有不孝|she would understand|no|loyal|can't have both", mood="warm"),
      ans("write", T("说常写信给她", "says write to her often"), T("姜维点头：『伯约每个月都写。』", "Jiang Wei nods. 'I'll write every month.'"), [rel("jiangwei", "warmth", 1), rel("jiangwei", "esteem", 1)], match=r"写信|书信|家书|消息|write|letter|send word", mood="warm"),
      ans("yes", T("说是", "says yes"), T("姜维的脸白了。他站起来，行了一礼，走了。", "Jiang Wei goes pale. He gets up, bows, and leaves."), [rel("jiangwei", "warmth", -2), add("renown.rash")], match=r"是|不孝|yes|unfilial|you are", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("姜维没有再问。", "Jiang Wei doesn't ask again."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
  "c7_envoy": {"who": "simayi", "fallback": "dodge",
    "q": T("送你出营的时候，司马懿走在你旁边，忽然问：『子衡先生，你跟了孔明这么多年。你说，你们这样打下去，图什么？』", "Seeing you out of the camp, Sima Yi walks beside you and suddenly asks, 'Master Ziheng, you've followed Kongming all these years. Tell me—what are you fighting for, going on like this?'"),
    "answers": [
      ans("han", T("说为了汉室", "says for the Han"), T("司马懿笑了：『汉室……』他没有说下去，只是点了点头。", "Sima Yi smiles. 'The Han…' He doesn't go on; he only nods."), [rel("simayi", "esteem", 1)], match=r"汉室|兴复|先帝|汉|for the han|restore|the late emperor", mood="neutral"),
      ans("him", T("说为了丞相", "says for the Chancellor"), T("司马懿看了你很久：『孔明有你，是他的福气。』", "Sima Yi looks at you a long time. 'Kongming is lucky to have you.'"), [rel("simayi", "esteem", 2)], match=r"丞相|孔明|他|for him|the chancellor|kongming", mood="neutral"),
      ans("ask", T("反问他图什么", "asks him the same"), T("司马懿哈哈大笑：『懿图的，是活得比他长。』", "Sima Yi laughs aloud. 'What I'm after is outliving him.'"), [rel("simayi", "esteem", 1), rel("simayi", "warmth", 1)], match=r"你呢|你图|你又|都督|and you|what about you|you\?", mood="neutral"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("司马懿也不追问：『先生慢走。』", "Sima Yi doesn't press. 'Safe travels, Master.'"), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
  "c8_last": {"who": "jiangwei", "fallback": "dodge",
    "q": T("丞相走后的那天夜里，姜维跪在灵前，问你：『先生，丞相走了。伯约以后，该听谁的？』", "On the night after the Chancellor dies, Jiang Wei kneels before the coffin and asks you, 'Master, the Chancellor is gone. Whom should I listen to now?'"),
    "answers": [
      ans("self", T("说听你自己的", "says listen to yourself"), T("姜维抬起头，看了你很久：『伯约记住了。』", "Jiang Wei raises his head and looks at you a long time. 'I'll remember.'"), [rel("jiangwei", "esteem", 1), rel("jiangwei", "trust", 1)], match=r"自己|你自己|你的心|yourself|your own|your heart", mood="warm"),
      ans("me", T("说有事来问我", "says come and ask me"), T("姜维握住你的手：『先生不嫌伯约烦就好。』", "Jiang Wei grips your hand. 'As long as you don't tire of me, Master.'"), [rel("jiangwei", "warmth", 2), rel("jiangwei", "trust", 1)], match=r"我|问我|来找我|ask me|come to me|me", mood="warm"),
      ans("court", T("说听陛下和朝廷的", "says listen to His Majesty and the court"), T("姜维沉默了：『是。』", "Jiang Wei is silent. 'Yes.'"), [rel("jiangwei", "esteem", 1)], match=r"陛下|朝廷|天子|蒋琬|费祎|his majesty|the court|emperor", mood="neutral"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("姜维没有再问，只是跪着。", "Jiang Wei doesn't ask again. He just stays kneeling."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
}
ASK_ORDER = {"c2_jiangwei": ["yes", "no", "write", "dodge"], "c7_envoy": ["ask", "him", "han", "dodge"], "c8_last": ["me", "self", "court", "dodge"]}

V7_TAGS = {
    ("x_return7", "back"): ["yi"],
    ("c1_biao", "people"): ["zhi", "cheng"], ("c1_child", "stay_word"): ["cheng"], ("c1_child", "take"): ["ren"],
    ("c1_houzhu", "ask"): ["cheng"],
    ("c2_ziwu", "back"): ["yong"], ("c2_ziwu", "zhuge"): ["zhi"], ("c2_ziwu", "both"): ["zhi"],
    ("c2_jiangwei", "mother"): ["ren", "yi"], ("c2_jiangwei", "plan"): ["zhi", "li"], ("c2_jiangwei", "talk"): ["cheng"],
    ("c2_wanglang", "self"): ["ren"],
    ("c3_jieting", "with"): ["yi", "yong"], ("c3_jieting", "road"): ["zhi"], ("c3_jieting", "warn"): ["cheng", "zhi"],
    ("c3_hill", "wangping"): ["zhi", "yong"], ("c3_hill", "water"): ["zhi"],
    ("c4_kongcheng", "wall"): ["yong", "yi"], ("c4_kongcheng", "gate"): ["yong"],
    ("c5_masu", "plead"): ["ren", "yi"], ("c5_masu", "plead_2"): ["ren"], ("c5_masu", "law"): ["zhi"], ("c5_masu", "family"): ["ren", "yi"],
    ("c5_jiangwei", "road"): ["zhi"], ("c5_jiangwei", "man"): ["cheng"],
    ("c6_old", "stay"): ["yi", "ren"], ("c6_feud", "mend"): ["ren"], ("c6_feud", "split"): ["zhi"], ("c6_feud", "yangyi"): ["cheng"],
    ("c6_student", "yes"): ["ren"],
    ("c7_shangfang", "warned"): ["ren", "yi"], ("c7_envoy", "truth"): ["cheng"], ("c7_envoy", "lie"): ["zhi"],
    ("c8_lamp", "guard"): ["yi", "yong"], ("c8_lamp", "kneel"): ["ren"],
    ("c8_last", "fan"): ["yi"], ("c8_last", "fan_2"): ["yi"], ("c8_last", "weiyan"): ["ren", "zhi"],
    ("x_weiyan_rage", "stand"): ["yong"],
}
for k, v in P7.VALUES.items(): values.VALUES.setdefault(k, v)
values.VALUES.setdefault("huangzhong", {"yong": ["esteem", 1], "yi": ["warmth", 1], "cheng": ["trust", 1], "li": ["esteem", -1]})
values.VALUES.setdefault("fazheng", {"zhi": ["esteem", 1], "yong": ["esteem", 1], "li": ["warmth", 1], "ren": ["esteem", -1]})
values.apply(N, CHARS, V7_TAGS)
byid = {n["id"]: n for n in N}
for nid, a in ASKS.items():
    a["answers"].sort(key=lambda x: ASK_ORDER[nid].index(x["id"]))
    byid[nid]["ask"] = a

CAST = {
    "x_return7": cast_("zhuge"), "x_cold7": cast_("zhuge", "jiangwei"), "x_uncanny7": cast_("zhuge"), "x_loose7": cast_("zhuge"), "x_weiyan_rage": cast_("weiyan"),
    "c1_biao": cast_("zhuge"), "c1_child": cast_("wenzhi"), "c1_zhuge": cast_("zhuge"), "c1_wz_north": cast_("wenzhi"), "c1_houzhu": [],
    "c2_ziwu": cast_("weiyan", "zhuge"), "c2_jiangwei": cast_("zhuge", "jiangwei"), "c2_wanglang": cast_("zhuge"),
    "c3_jieting": cast_("zhuge"), "c3_hill": [],
    "c4_kongcheng": cast_("zhuge", "simayi"),
    "c5_masu": cast_("zhuge"), "c5_jiangwei": cast_("jiangwei"), "c5_wz_letter7": cast_("wenzhi"),
    "c6_zilong": cast_("zhaoyun"), "c6_old": [], "c6_feud": cast_("zhuge", "weiyan"), "c6_student": [],
    "c7_shangfang": cast_("zhuge", "weiyan"), "c7_envoy": cast_("simayi"), "c7_jiangwei": cast_("jiangwei"),
    "c8_lamp": cast_("zhuge", "weiyan", "jiangwei"), "c8_last": cast_("zhuge", "jiangwei"), "c8_wz_home": cast_("wenzhi"),
}
CAST["c6_old"] = []
def lay(id, when=None, choice=None):
    d = {"id": id}
    if when: d["when"] = when
    if choice: d["choice"] = choice
    return d
ART = {
    "x_return7": ("letter", [], None, "v3_letter"), "x_cold7": ("lamp", [], None, "g_cold"), "x_uncanny7": ("lamp", [], None, "g_uncanny"),
    "x_loose7": ("letter", [], None, "g_cold"), "x_weiyan_rage": ("camp", [], None, "v7_weiyan"),
    "c1_biao": ("lamp", [], "chengdu", "v7_biao"), "c1_child": ("garden", [], "chengdu", "v7_child"), "c1_zhuge": ("lamp", [], "chengdu", "v7_biao"),
    "c1_wz_north": ("herbs", [lay("two")], "chengdu", "v3_clinic"), "c1_houzhu": ("hall", [], "chengdu", "v7_houzhu"),
    "c2_ziwu": ("camp", [], "qishan", "v7_weiyan"), "c2_jiangwei": ("citywall", [], "tianshui", "v7_jiangwei"), "c2_wanglang": ("hill", [lay("rider")], "qishan", "v7_wanglang"),
    "c3_jieting": ("camp", [], "qishan", "v7_jieting"), "c3_hill": ("hill", [], "jieting", "v7_hill"),
    "c4_kongcheng": ("citywall", [lay("open")], "xicheng", "v7_kongcheng"),
    "c5_masu": ("camp", [], "hanzhong", "v7_masu"), "c5_jiangwei": ("lamp", [], "hanzhong", "v7_jiangwei_night"), "c5_wz_letter7": ("letter", [], "hanzhong", "v4_wz_letter"),
    "c6_zilong": ("lamp", [], "chengdu", "v7_zilong"), "c6_old": ("lamp", [], "chengdu", "v7_old"), "c6_feud": ("camp", [], "hanzhong", "v7_feud"),
    "c6_student": ("letter", [], "hanzhong", "v7_student"),
    "c7_shangfang": ("fire", [lay("burning")], "shangfang", "v7_shangfang"), "c7_envoy": ("hall", [], "wei_camp", "v7_envoy"), "c7_jiangwei": ("campfire", [], "wuzhang", "v7_jiangwei_night"),
    "c8_lamp": ("lamp", [], "wuzhang", "v7_lamp"), "c8_last": ("road", [], "wuzhang", "v7_last"), "c8_wz_home": ("road", [], "chengdu", "v7_home"),
}
for n in N:
    sc, ls, place, illus = ART[n["id"]]
    n["art"] = {"scene": sc, "layers": ls}
    if illus: n["art"]["illus"] = illus
    if place: n["place"] = place
    if n["id"] in CAST: n["cast"] = CAST[n["id"]]
PLACE_AFTER = {("x_return7", "back"): "hanzhong", ("c3_jieting", "with"): "jieting", ("c3_hill", "*"): "xicheng", ("c4_kongcheng", "*"): "hanzhong",
               ("c6_old", "*"): "hanzhong", ("c8_wz_home", "*"): "chengdu"}
for n in N:
    for c in n["choices"]:
        pa = PLACE_AFTER.get((n["id"], c["id"])) or PLACE_AFTER.get((n["id"], "*"))
        if pa and pa != n.get("place"): c["place"] = pa

import moves_v7
CAMP_MOVES = moves_v7.extend(N)

PLACES = {"chengdu": V6["places"]["chengdu"], "hanzhong": {"x": 375, "y": 50, "rx": 372, "ry": 346, "zh": "汉中", "en": "Hanzhong"}}
PLACES.update({
    "qishan": {"x": 300, "y": 25, "rx": 345, "ry": 330, "zh": "祁山", "en": "Qishan"},
    "tianshui": {"x": 250, "y": 15, "rx": 325, "ry": 322, "zh": "天水", "en": "Tianshui"},
    "jieting": {"x": 285, "y": 8, "rx": 337, "ry": 318, "zh": "街亭", "en": "Jieting"},
    "xicheng": {"x": 330, "y": 35, "rx": 352, "ry": 338, "zh": "西城", "en": "Xicheng"},
    "shangfang": {"x": 412, "y": 30, "rx": 392, "ry": 335, "zh": "上方谷", "en": "Shangfang Valley"},
    "wei_camp": {"x": 430, "y": 18, "rx": 400, "ry": 328, "zh": "渭南魏营", "en": "The Wei camp south of the Wei"},
    "wuzhang": {"x": 400, "y": 22, "rx": 385, "ry": 330, "zh": "五丈原", "en": "Wuzhang Plains"},
})
RIVERS = V6["rivers"]

FUTURE = [(T("街亭", "Jieting"), "c3"), (T("空城", "the empty city"), "c4"), (T("上方谷", "Shangfang Valley"), "c7"), (T("五丈原", "Wuzhang Plains"), "c7"),
          (T("阴平", "Yinping"), "v8"), (T("钟会", "Zhong Hui"), "v8"), (T("邓艾", "Deng Ai"), "v8"), (T("乐不思蜀", "too happy to miss Shu"), "v8")]

def frag(id, text, when=None, mood=None):
    d = {"id": id, "text": text}
    if when: d["when"] = when
    if mood: d["mood"] = mood
    return d
LIU = ALL(V("track", "==", "liu"), STAYING)
ENDINGS = [
    {"id": "g_side", "title": T("去处", "Where You Ended Up"), "fragments": [
        frag("hermit", T("你没有北上。五丈原的消息，是从集市上听来的。", "You never went north. You heard about Wuzhang in the market."), F("flag.v7_hermit")),
        frag("exposed", T("你在一个雨夜出了营。魏营里少了一个打听的名字。", "You left the camp one rainy night. The Wei camp had one less name to ask about."), F("flag.v7_exposed")),
        frag("left", T("你离开了。丞相走的那天，你在路上。", "You left. The day the Chancellor died, you were on the road."), F("flag.v7_left")),
        frag("coffin", T("你护着丞相的灵柩，回到了成都。", "You escorted the Chancellor's coffin home to Chengdu."), LIU)]},
    {"id": "g_zhuge", "title": T("丞相", "The Chancellor"), "fragments": [
        frag("fan", T("丞相把白羽扇放进了你手里：替亮看着。", "The Chancellor put the white feather fan in your hand: watch over them for me."), F("flag.v7_fan"), "warm"),
        frag("lamp", T("五丈原那一夜，你拦住了魏延。灯还是灭了。丞相说，不怪你。", "That night at Wuzhang you stopped Wei Yan. The lamp went out all the same. The Chancellor said it wasn't your fault."), F("flag.v7_lamp_guard"), "sad"),
        frag("wall", T("空城那天，你在城楼上给丞相添香。他的手在抖，只有你看见了。", "On the day of the empty city you tended the incense on the wall. His hands were shaking, and only you saw."), F("flag.v7_wall")),
        frag("canon", T("建兴十二年秋，丞相病逝于五丈原，寿五十四岁。蜀中人谚曰：死诸葛能走生仲达。", "In the autumn of Jianxing 12 the Chancellor died on the Wuzhang Plains, aged fifty-four. In Shu they said: a dead Zhuge put a living Zhongda to flight."), None, "sad")]},
    {"id": "g_jieting", "title": T("街亭", "Jieting"), "mode": "all", "fragments": [
        frag("masu", T("马谡没有死。他被削为庶人，在汉中教孩子读兵书，每一课都从“当道扎营”讲起。", "Ma Su didn't die. Stripped to a commoner, he teaches children the books of war in Hanzhong, and every lesson starts with 'camp on the road.'"), F("flag.masu_alive")),
        frag("road", T("街亭败了。可你和王平守住的那个路口，带回来了一半的人。", "Jieting was lost. But the road you and Wang Ping held brought half the men home."), F("flag.v7_jt_wangping")),
        frag("warned", T("你劝过丞相别派马谡。丞相后来说，是他不听。", "You urged the Chancellor not to send Ma Su. He said afterward it was he who wouldn't listen."), F("flag.v7_jt_warned"))]},
    {"id": "g_heirs", "title": T("后来的人", "Those Who Come After"), "fragments": [
        frag("child", T("你和温芷的孩子，会写自己的名字了。将来的路，要他自己走。", "Your child with Wen Zhi can write their own name now. The road ahead is theirs to walk."), F("flag.v7_child"), "romance"),
        frag("student", T("你收的那个学生，把你说的每一句话都记在本子上。将来的路，要他自己走。", "The student you took on writes down every word you say. The road ahead is his to walk."), F("flag.v7_student")),
        frag("jiangwei", T("姜维说：伯约有两个老师。", "Jiang Wei says he has two teachers."), AT("jiangwei", "esteem", 3)),
        frag("none", T("你身边，没有接你担子的人。", "There is no one beside you to take up your load."))]},
    {"id": "g_weiyan", "title": T("魏延", "Wei Yan"), "fragments": [
        frag("letter", T("你怀里揣着丞相写给魏延的一封信。还没到拆的时候。", "Inside your robe is a letter the Chancellor wrote to Wei Yan. It isn't time to open it yet."), F("flag.v7_weiyan_word")),
        frag("friend", T("魏延说：全营只有先生懂他。", "Wei Yan says that in the whole camp, only the Master understands him."), AT("weiyan", "trust", 3)),
        frag("feud", T("魏延和杨仪的仇，丞相一走，就要爆出来了。", "The feud between Wei Yan and Yang Yi will burst open the moment the Chancellor is gone."))]},
    {"id": "g_old", "title": T("老兄弟", "Old Brothers"), "mode": "all", "fragments": [
        frag("peach", T("桃园结义的三个人，最后一个，是在你手边走的。", "Of the three who swore brotherhood in the peach garden, the last one died with your hand in his."), F("flag.v7_old_farewell"), "sad"),
        frag("zilong", T("赵云把那杆枪留给了姜维。", "Zhao Yun left his spear to Jiang Wei."), AT("zhaoyun", "warmth", 3))]},
    {"id": "g_name", "title": T("名声", "Your Name"), "fragments": [
        frag("simayi", T("司马懿记住了你的名字。", "Sima Yi remembered your name."), AT("simayi", "esteem", 2)),
        frag("uncanny", T("魏营里传说，诸葛亮身边有个老先生，什么都知道。", "In the Wei camp they said Zhuge Liang had an old man beside him who knew everything."), V("uncanny", ">=", 5)),
        frag("loyal", T("人说子衡重义。", "People say Ziheng keeps faith."), V("renown.loyal", ">", "@renown.cunning")),
        frag("none", T("史书里没有你的传，只有几处『或曰』。", "The histories give you no biography—just a few lines beginning 'some say.'"))]},
    {"id": "g_history", "title": T("天下", "The Realm"), "fragments": [
        frag("far", T("说书人讲到北伐，有好几处讲不顺——那几处，都是你。", "When storytellers reach the northern campaigns, several places never quite fit. Those places are you."), V("deviation", ">=", 12)),
        frag("plain", T("丞相死了。蜀中的灯，暗了一半。", "The Chancellor is dead. Half the lamps in Shu have gone dark."))]},
]
FRAG_FACE = {"g_zhuge": {"fan": ("zhuge", "warm"), "lamp": ("zhuge", "sad"), "wall": ("zhuge", "neutral"), "canon": ("zhuge", "sad")},
             "g_heirs": {"child": ("wenzhi", "shy"), "jiangwei": ("jiangwei", "warm")},
             "g_weiyan": {"letter": ("weiyan", "neutral"), "friend": ("weiyan", "warm"), "feud": ("weiyan", "cold")}}
ENDING_ART = {"scene": "ending", "layers": [{"id": "city", "when": STAYING}, {"id": "home", "when": ANY(F("flag.v7_child"), WED)},
                                            {"id": "lone", "when": ANY(F("flag.v7_hermit"), F("flag.v7_left"), F("flag.v7_exposed"))}]}

REALM = json.loads(json.dumps(V6["realm"]))
base = dict(REALM["control"]["c6"])
REALM["control"] = {f"c{i}": dict(base) for i in range(1, 9)}
REALM["captions"] = {"c1": T("建兴五年：丞相上《出师表》，北驻汉中", "227: the Memorial; the army moves north to Hanzhong"),
                     "c2": T("一出祁山，三郡响应", "First march on Qishan; three commanderies waver"), "c3": T("街亭失守", "Jieting is lost"),
                     "c4": T("西城退仲达", "Sima Yi turned back at Xicheng"), "c5": T("退回汉中", "Back to Hanzhong"),
                     "c6": T("数出祁山；赵云病逝", "Repeated marches on Qishan; Zhao Yun dies"), "c7": T("最后一次北伐，屯兵五丈原", "The last campaign: camped on the Wuzhang Plains"),
                     "c8": T("建兴十二年：丞相病逝五丈原", "234: the Chancellor dies at Wuzhang")}

COMMIT_RULES = speech.commit_rules()
PORTRAIT_PROMPTS = dict(V6["portrait_prompts"]); PORTRAIT_PROMPTS.update(P7.PORTRAIT_PROMPTS)
PRESETS = json.loads((HERE / "presets.json").read_text()) if (HERE / "presets.json").exists() else []

CAMPAIGN = {
    "spec": SPEC, "tiers": TIERS(), "pack": PACK("history-strategy"),
    "resources": {"reputation": ["renown.loyal", "renown.cunning"], "risk": ["uncanny", "renown.rash"], "drift": ["deviation"]},
    "carry_compress": {"pivot": 4, "k": 0.5},
    "id": "sanguo_strategist_v7", "prev": "sanguo_strategist_v6",
    "title": T("三国·谋士", "Three Kingdoms: The Strategist"), "volume": T("卷七 · 出师", "Volume VII · The Northern Campaigns"),
    "rights": {"source": "《三国演义》（罗贯中，明代），公版", "quotes": "中文原文直接引用；英文为本项目自译", "original_characters": ["子衡（玩家）", "温芷", "子衡的学生"]},
    "player": {"name": T("子衡", "Ziheng")}, "side_prompt": SIDE_PROMPT,
    "vars": VARS, "chars": CHARS, "dims": DIMS, "echoes": ECHOES, "debts": {},
    "chapters": CHAPTERS, "nodes": {n["id"]: n for n in N}, "endings": ENDINGS,
    "future_terms": [{"term": t, "from": c} for t, c in FUTURE],
    "ending_art": ENDING_ART, "art_prompts": dict(V6["art_prompts"]), "frag_face": FRAG_FACE, "portrait_prompts": PORTRAIT_PROMPTS, "cg_captions": V6["cg_captions"], "realm": REALM,
    "react_patterns": V6["react_patterns"], "value_tags": values.TAGS, "commit_rules": COMMIT_RULES,
    "flash": [{"char": "weiyan", "node": "x_weiyan_rage", "resume": True}], "moves": CAMP_MOVES,
    "witness": [{"who": "jiangwei", "to": "zhuge", "labels": ["rude", "threat"], "effects": [rel("jiangwei", "trust", -1)]}],
    "places": PLACES, "rivers": RIVERS,
    "meters": {"uncanny": T("到 8：被当作妖人", "At 8: branded a sorcerer"), "rash": T("到 6：有人会把你的话报上去", "At 6: someone reports what you've said")},
    "presets": PRESETS,
    "sources": [{"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2010/01/12/a386459.html", "checked": "2026-10-27", "note": "第91回（出师表）；此本作“躬耕南阳”“临表涕泣，不知所云”，照录"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/b5/2010/01/21/a387424.html", "checked": "2026-10-27", "note": "第93回（姜维归降、骂死王朗），繁体转简体"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2010/01/31/a389127.html", "checked": "2026-10-27", "note": "第95回（街亭、空城）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/b5/2010/02/02/a389902.html", "checked": "2026-10-27", "note": "第96回（斩马谡、自贬三等），繁体转简体"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2010/02/23/a393218.html", "checked": "2026-10-27", "note": "第103回（上方谷、食少事烦、禳星）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2010/02/25/a393738.html", "checked": "2026-10-27", "note": "第104回（临终、授书姜维、寿五十四）"}],
    "end_note": T("卷七终。下一卷：卷八《归晋》，全书最后一卷。", "End of Volume VII. Next: Volume VIII, The Realm Made One—the last volume."),
}

if __name__ == "__main__":
    out = HERE / "campaign_v7.json"
    dump(CAMPAIGN, out)
    print("nodes", len(N), "->", out)
