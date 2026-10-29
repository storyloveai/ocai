"""三国·谋士 卷八（归晋，第105–120回）。全书最后一卷。

接着卷七：同名变量由上一卷带来；没玩过卷七的玩家从“前情”开始。
方针同卷五至卷七（决策记录 v2.11–v2.14）：大势不改——魏延被斩（门槛高时能活）、九伐无功、阴平偷渡、蜀亡、姜维死于钟会之乱、三分归晋；
能改的是代价和人：魏延的生死和家小、段谷死多少人、阴平差一点守住、绵竹和成都的百姓、北地王的孩子、姜维的家眷和旧部。
视角：前两章是子衡；第二章末子衡去世，第三章起玩家是接班人——和温芷成了亲的，是他们的孩子承之；否则是他的学生守言。
温芷在第二章和子衡一起老去。全书最后有一页“这一生”（life），回顾八卷里玩家改了什么。
原著引文只取公版原文，并已核对（见 sources）；其余叙述和英文都是我们自己写的。细纲见 docs/全书规划.md。
"""
import json, pathlib, sys
HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent))
from lib import *
import speech, values
from talks import topic, talk_node
from asks import ans
import people_v8 as P8

V7 = json.loads((HERE.parent / "v7" / "campaign_v7.json").read_text())

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
def gate(base, cond, a, b):
    """Same label, two outcomes: `a` when `cond` holds (on top of `base`), `b` otherwise."""
    a["when"] = ALL(base, cond); b["when"] = ALL(base, _neg(cond)); b["id"] = a["id"] + "_2"
    return [a, b]

AWAY = ANY(F("prev.ended_early"), V("track", "==", "cao"))
STAY = NF("flag.v8_hermit")
STAYING = ALL(NF("flag.v8_hermit"), NF("flag.v8_left"), NF("flag.v8_exposed"))
WED = F("flag.wz_wed")
WZ = ANY(F("flag.wz_west"), F("flag.wz_jingzhou"), F("flag.wz_huatuo"), WED)
HC = F("flag.v7_child")          # 接班人是孩子承之
HS = NF("flag.v7_child")         # 否则是学生守言
def H(zc, ec, zs, es, when=None):
    """Two versions of one paragraph: for the child, and for the student."""
    a, b = (HC, HS) if when is None else (ALL(when, HC), ALL(when, HS))
    return [P(T(zc, ec), a), P(T(zs, es), b)]

VARS = {k: v for k, v in json.loads(json.dumps(V7["vars"])).items() if not k.startswith(("heat.", "debt."))}
FLAGS = {
    "flag.v8_came_back": T("流落之后回到蜀中", "Came back to Shu after wandering"),
    "flag.v8_hermit": T("就此隐去", "Disappeared from the world"),
    "flag.weiyan_alive": T("魏延没有死在南谷口", "Wei Yan didn't die at the south valley mouth"),
    "flag.v8_weiyan_read": T("魏延读到了丞相留给他的信", "Wei Yan read the letter the Chancellor left him"),
    "flag.v8_weiyan_family": T("保下了魏延的家小", "Saved Wei Yan's family"),
    "flag.v8_court": T("丞相死后，留在成都辅佐蒋琬", "After the Chancellor's death, stayed in Chengdu to help Jiang Wan"),
    "flag.v8_with_jiang": T("丞相死后，随姜维去了汉中", "After the Chancellor's death, went to Hanzhong with Jiang Wei"),
    "flag.v8_home": T("丞相死后，辞官回家", "After the Chancellor's death, resigned and went home"),
    "flag.v8_tuntian": T("劝姜维先安顿汉中的屯田", "Urged Jiang Wei to settle the farm-colonies in Hanzhong first"),
    "flag.v8_simayi_letter": T("收到司马懿的最后一封信", "Received Sima Yi's last letter"),
    "flag.v8_qingnang": T("温芷把青囊书和药箱交给了承之", "Wen Zhi gave Chengzhi the medical book and the medicine chest"),
    "flag.v8_heir_jiang": T("子衡让接班人跟着姜维", "Ziheng told his heir to follow Jiang Wei"),
    "flag.v8_heir_court": T("子衡让接班人守在成都", "Ziheng told his heir to stay in Chengdu"),
    "flag.v8_heir_free": T("子衡让接班人别做官", "Ziheng told his heir not to take office"),
    "flag.v8_fan_heir": T("白羽扇传到了接班人手里", "The white feather fan passed to the heir"),
    "flag.v8_ziheng_gone": T("子衡去世", "Ziheng died"),
    "flag.v8_duangu_saved": T("段谷之败，催来了胡济的兵", "At the Duan Valley defeat, brought Hu Ji's troops"),
    "flag.v8_healer": T("在伤兵营里用上了青囊书", "Put the medical book to use in the wounded camp"),
    "flag.v8_hh_faced": T("当朝弹劾黄皓", "Denounced Huang Hao before the court"),
    "flag.v8_tazhong": T("劝姜维去沓中屯田避祸", "Urged Jiang Wei to go farm at Tazhong out of harm's way"),
    "flag.v8_hh_ally": T("替姜维在黄皓那里周旋", "Smoothed things over with Huang Hao for Jiang Wei"),
    "flag.v8_yp_memo": T("把请守阴平的表送到了成都", "Carried the memorial asking to guard Yinping to Chengdu"),
    "flag.v8_yp_guard": T("带五百人去守阴平", "Took five hundred men to guard Yinping"),
    "flag.v8_nearly": T("差一点守住了阴平", "Nearly held Yinping"),
    "flag.v8_yp_warned": T("阴平失守，派快马报了江油、绵竹", "When Yinping fell, sent riders to warn Jiangyou and Mianzhu"),
    "flag.v8_mz_pass": T("劝诸葛瞻抢先占住险要", "Urged Zhuge Zhan to seize the passes first"),
    "flag.v8_mz_people": T("护着绵竹的伤兵百姓撤回成都", "Got Mianzhu's wounded and townsfolk back to Chengdu"),
    "flag.v8_cd_people": T("请陛下先和邓艾约定不扰百姓", "Asked His Majesty to have Deng Ai promise to spare the people"),
    "flag.v8_beidi_kids": T("北地王的孩子被送出了城", "Got the Prince of Beidi's children out of the city"),
    "flag.v8_follow_jw": T("赶去跟着姜维", "Went to join Jiang Wei"),
    "flag.v8_stay_cd": T("留在成都，守着陛下和百姓", "Stayed in Chengdu with His Majesty and the people"),
    "flag.v8_jw_family": T("把姜维的家眷送出了城", "Got Jiang Wei's household out of the city"),
    "flag.v8_jw_men": T("叫住了姜维的旧部，没让他们出营", "Kept Jiang Wei's old soldiers in their camp"),
    "flag.v8_jw_end": T("姜维死的时候，你在他身边", "You were beside Jiang Wei when he died"),
    "flag.v8_nearly_zhong": T("差一点让姜维的计成了", "Nearly made Jiang Wei's plan work"),
    "flag.v8_luoyang": T("随后主去了洛阳", "Went with the last emperor to Luoyang"),
    "flag.v8_book": T("把子衡的本子整理成了书", "Made Ziheng's notebooks into a book"),
    "flag.v8_left": T("被冷落后离开", "Left after being sidelined"),
    "flag.v8_exposed": T("妖人之名坐实", "Branded a sorcerer for good"),
}
for k, lab in FLAGS.items(): VARS[k] = flag(lab)

CHARS = json.loads(json.dumps(V7["chars"]))
for k, p in P8.PERSONA.items(): CHARS[k]["persona"] = p
CHARS["jiangwei"]["react"] = P8.REACT_JIANGWEI
DIMS = dict(V7["dims"])
for c in CHARS:
    if CHARS[c].get("heat"):
        VARS[f"heat.{c}"] = {"type": "num", "init": 0, "min": 0, "max": 5, "char": c, "show": False, "carry": False,
                             "label": T(CHARS[c]["name"]["zh"] + "·火气", CHARS[c]["name"]["en"] + " · Temper")}

ECHOES = {
    "e_letter": T("魏延读到了丞相的信，放下了刀", "Wei Yan read the Chancellor's letter and put down his blade"),
    "e_wy_family": T("你保下了魏延的家小", "You saved Wei Yan's family"),
    "e_qingnang": T("温芷把青囊书交给了承之", "Wen Zhi gave Chengzhi the medical book"),
    "e_duangu": T("段谷那天，你催来了胡济", "At Duan Valley you brought Hu Ji"),
    "e_tazhong": T("你劝姜维去了沓中", "You urged Jiang Wei to Tazhong"),
    "e_hh": T("你当朝弹劾过黄皓", "You denounced Huang Hao before the court"),
    "e_yp": T("阴平失守的消息，是你最先送到的", "You were first to carry word that Yinping had fallen"),
    "e_mz_people": T("你把绵竹的伤兵百姓带回了成都", "You brought Mianzhu's wounded and townsfolk back to Chengdu"),
    "e_cd_people": T("你请陛下先和邓艾约定不扰百姓", "You asked His Majesty to make Deng Ai promise to spare the people"),
    "e_kids": T("北地王的孩子，是你送出城的", "You got the Prince of Beidi's children out"),
}

SIDE_PROMPT = T("这段日子，你只来得及做一件事。", "These days you only have time for one thing.")
# 第三章起玩家换成接班人；AI 台词和对话记录按章读这里（没有就用全书的 player）。
HEIR_PLAYER = [
    {"when": HC, "name": T("承之", "Chengzhi"),
     "who": T("承之：原创人物，子衡和温芷的孩子，三十多岁，跟母亲学过医，在姜维身边做参军；性别不写明，别用带性别的称呼",
              "Chengzhi, an original character: the child of Ziheng and Wen Zhi, in their thirties, trained in medicine by their mother, serving as an adjutant to Jiang Wei; their gender is never stated, so use no gendered terms")},
    {"name": T("守言", "Shouyan"),
     "who": T("守言：原创人物，男，子衡的学生，四十多岁，字写得好，把老师说过的话都记在本子里，在姜维身边做参军",
              "Shouyan, an original character: a man in his forties, Ziheng's student, with a fine hand, who wrote down everything his teacher said; serving as an adjutant to Jiang Wei")},
]
CHAPTERS = [
    {"id": "c1", "title": T("魏延", "Wei Yan"), "year": T("建兴十二年秋（234）", "Autumn, Jianxing 12 (234)"), "canon": T("第105回", "Ch. 105"), "offer": 1,
     "intro": [P(T("丞相的灵柩在车上。大军按丞相的遗命，悄悄往回撤，杨仪断后，姜维护着灵车。走到半路，前面传来消息：魏延不肯退兵，烧了栈道，拦在路上。", "The Chancellor's coffin is on a cart. As he ordered, the army withdraws quietly, Yang Yi commanding the rear and Jiang Wei guarding the hearse. Halfway along, word comes from ahead: Wei Yan refuses to fall back. He has burned the plank road and is blocking the way.")),
               P(T("你快六十了。", "You're nearly sixty."))]},
    {"id": "c2", "title": T("托付", "Handing On"), "year": T("延熙十二年（249）", "Yanxi 12 (249)"), "canon": T("第105–107回", "Ch. 105–107"), "offer": 1,
     "intro": [P(T("一晃十五年。蒋琬死了，费祎主政。姜维每年都要北伐，费祎每回只给他一万人：『丞相尚不能定中原，何况我辈？』", "Fifteen years go by. Jiang Wan is dead, and Fei Yi governs. Every year Jiang Wei wants to march north, and every time Fei Yi gives him ten thousand men: if the Chancellor himself couldn't settle the Central Plains, how could we?")),
               P(T("你七十多了，走路要拄杖。早上起来，手会抖。", "You're past seventy and walk with a stick. In the mornings your hands shake."))]},
    {"id": "c3", "title": T("段谷", "Duan Valley"), "year": T("延熙十九年（256）", "Yanxi 19 (256)"), "canon": T("第107–112回", "Ch. 107–112"), "offer": 2,
     "player": HEIR_PLAYER,
     "intro": H("父亲走了七年了。你叫承之，今年二十九，背着母亲留下的药箱，在姜维帐下做参军。姜维第一次见你，看了很久：『像你父亲。』",
                "Your father has been gone seven years. Your name is Chengzhi; you're twenty-nine, carrying your mother's medicine chest, serving as an adjutant under Jiang Wei. The first time he saw you, Jiang Wei looked a long while. 'You're like your father.'",
                "先生走了七年了。你叫守言，四十五了，在姜维帐下做参军。先生说过的话，你记了满满三个本子，夜里还翻。",
                "Your teacher has been gone seven years. Your name is Shouyan; you're forty-five, serving as an adjutant under Jiang Wei. You filled three notebooks with what your teacher said, and you still leaf through them at night.") +
              [P(T("先生临终说，别做官。你守了一年，还是来了。", "On his deathbed you were told not to take office. You held to it for a year, and came all the same."), F("flag.v8_heir_free")),
               P(T("姜维又出兵了。这一回，他约了镇西大将军胡济，在上邽会师。", "Jiang Wei has marched again. This time he's arranged to meet the General Who Guards the West, Hu Ji, at Shanggui."))]},
    {"id": "c4", "title": T("黄皓", "Huang Hao"), "year": T("景耀五年（262）", "Jingyao 5 (262)"), "canon": T("第113–115回", "Ch. 113–115"), "offer": 1, "player": HEIR_PLAYER,
     "intro": [P(T("陛下老了，宠着一个宦官，叫黄皓。黄皓想让自己的人替下姜维。姜维从前线回来，要杀黄皓。", "His Majesty has grown old, and dotes on a eunuch named Huang Hao. Huang Hao wants his own man to replace Jiang Wei. Jiang Wei comes back from the front meaning to kill him."))]},
    {"id": "c5", "title": T("阴平", "Yinping"), "year": T("景耀六年（263）", "Jingyao 6 (263)"), "canon": T("第116–117回", "Ch. 116–117"), "offer": 0, "player": HEIR_PLAYER,
     "intro": [P(T("魏国大举伐蜀：钟会领十几万人攻汉中，邓艾从陇西来。姜维退守剑阁。剑阁一夫当关，钟会过不来。", "Wei invades in force: Zhong Hui with over a hundred thousand against Hanzhong, Deng Ai coming from Longxi. Jiang Wei falls back to hold Jiange. At Jiange one man can hold the pass; Zhong Hui can't get through."))]},
    {"id": "c6", "title": T("绵竹", "Mianzhu"), "year": T("景耀六年冬（263）", "Winter, Jingyao 6 (263)"), "canon": T("第117回", "Ch. 117"), "offer": 0, "player": HEIR_PLAYER,
     "intro": [P(T("邓艾过了阴平，江油的守将马邈开城投降。成都慌了。陛下派丞相的儿子诸葛瞻去守绵竹——绵竹再丢，成都就没有门了。", "Deng Ai is through Yinping, and Ma Miao, holding Jiangyou, has opened the gates. Chengdu is in a panic. His Majesty sends the Chancellor's son, Zhuge Zhan, to hold Mianzhu—lose Mianzhu, and Chengdu has no door left."))]},
    {"id": "c7", "title": T("出降", "Surrender"), "year": T("炎兴元年冬（263）", "Winter, Yanxing 1 (263)"), "canon": T("第118回", "Ch. 118"), "offer": 1, "player": HEIR_PLAYER,
     "intro": [P(T("绵竹丢了，诸葛瞻父子都死了。邓艾的兵离成都只有几天的路。朝堂上吵成一团：有人说去东吴，有人说去南中，光禄大夫谯周说：降。", "Mianzhu is lost; Zhuge Zhan and his son are dead. Deng Ai's army is a few days from Chengdu. The court is in uproar: some say flee to Wu, some say to the south. The Grand Master of Splendid Happiness, Qiao Zhou, says: surrender."))]},
    {"id": "c8", "title": T("归晋", "The Realm Made One"), "year": T("咸熙元年至太康元年（264–280）", "Xianxi 1 to Taikang 1 (264–280)"), "canon": T("第119–120回", "Ch. 119–120"), "offer": 1, "player": HEIR_PLAYER,
     "intro": [P(T("姜维在剑阁接到了投降的敕令。将士们哭着问：『吾等死战，何故先降耶！』姜维说：『众将勿忧。吾有一计，可复汉室。』他带着人，去降了钟会。", "At Jiange Jiang Wei receives the order to surrender. His soldiers weep: we were ready to fight to the death—why surrender first? Jiang Wei says: don't despair; I have a plan that can restore the Han. He leads his men to surrender to Zhong Hui."))]},
]

N = []
def cast_(*ids): return [{"id": i} for i in ids]

N.append(node("x_return8", "*", "interrupt", T("灵车", "The Hearse"), "free", T("原创", "original"),
    [P(T("你离开蜀中已经很多年了。", "You left Shu many years ago."), F("prev.ended_early")),
     P(T("你在北方住了很多年。", "You've lived in the north many years."), V("track", "==", "cao")),
     P(T("丞相死在五丈原的消息传过来时，姜维的信也到了：『先生，灵车要回成都了。路上怕有变。』", "With the news that the Chancellor died at Wuzhang comes a letter from Jiang Wei. 'Master, the hearse is going back to Chengdu. I fear trouble on the road.'"))],
    [choice("back", "dilemma", T("动身去追灵车。", "Set out after the hearse."),
            T("你在褒斜道上追上了大军。姜维看见你，眼睛一下红了。", "You catch up with the army on the Baoxie road. When Jiang Wei sees you, his eyes go red at once."),
            [setv("flag.v8_came_back"), setv("track", "liu"), rel("jiangwei", "warmth", 1)]),
     choice("hermit", "expression", T("把信收好，不去了。", "Put the letter away. You won't go."),
            T("很多年以后，你听说蜀亡了。", "Many years later you hear that Shu has fallen."), [setv("flag.v8_hermit")])],
    when=AWAY, order=-2))
N[-1]["choices"][1]["ends"] = True

# ---------- c1 魏延 ----------
WORD = F("flag.v7_weiyan_word")
WY_TRUST = AT("weiyan", "trust", 3)
N.append(node("c1_weiyan", "c1", "main", T("谁敢杀我", "Who Dares Kill Me"), "literal", T("第105回", "Ch. 105"),
    [P(T("魏延和杨仪都派人去成都，各说对方反了。两军在南谷口对上了。杨仪身边有丞相临终留下的锦囊，他拆开看了，笑了一下。", "Wei Yan and Yang Yi have each sent to Chengdu, each saying the other has rebelled. The two armies face each other at the south valley mouth. Yang Yi has the brocade bag the Chancellor left him; he opens it, reads, and smiles faintly.")),
     P(T("你怀里揣着丞相写给魏延的另一封信：『文长要是闹，你把这个给他看。』", "Inside your robe is the other letter, the one the Chancellor wrote for Wei Yan: 'If Wenchang makes trouble, show him this.'"), WORD),
     P(T("对面阵里，魏延看见了你。", "From the far line, Wei Yan has seen you."))],
    gate(WORD, WY_TRUST,
         choice("letter", "dilemma", T("拿着丞相的信，一个人走到两军中间。", "Take the Chancellor's letter and walk out alone between the lines."),
                [P(T("魏延下了马，接过信。他看了很久，手开始抖。信上写的是什么，你没看见；你只看见这个一辈子没低过头的人，把刀插在地上，朝着成都的方向跪了下来。", "Wei Yan dismounts and takes the letter. He reads a long time, and his hands begin to shake. You never see what it says; you only see a man who never bowed his head in his life drive his blade into the ground and kneel toward Chengdu.")),
                 P(T("杨仪还要杀他。你和姜维拦在前面。后来朝廷削了魏延的官，让他回汉中种地。", "Yang Yi still means to kill him. You and Jiang Wei stand in the way. Later the court strips Wei Yan of his rank and sends him to farm in Hanzhong."))],
                [setv("flag.weiyan_alive"), setv("flag.v8_weiyan_read"), rel("weiyan", "warmth", 2), rel("jiangwei", "esteem", 1), add("deviation", 3), add("renown.loyal", 2)], echo=["e_letter"]),
         choice("letter", "dilemma", T("拿着丞相的信，一个人走到两军中间。", "Take the Chancellor's letter and walk out alone between the lines."),
                [P(T("魏延接过信，看完，哭了。可他身后的兵已经散了一半，他回头看了一眼，又把刀提了起来：『先生，晚了。』", "Wei Yan takes the letter, reads it, and weeps. But half the men behind him have already melted away; he looks back, then lifts his blade again. 'Master, it's too late.'")),
                 P(T("他提刀按辔，在马上大叫：『谁敢杀我？』一声未毕，脑后一人厉声而应：『吾敢杀你！』——是马岱。", "Blade in hand, reins gathered, he roars from the saddle: who dares kill me? Before the cry is out, a voice behind him answers: I dare! It is Ma Dai."))],
                [setv("flag.v8_weiyan_read"), rel("weiyan", "warmth", 1), add("renown.loyal")])) +
    [choice("family", "strategy", T("去找蒋琬：魏延要是死了，他的家小别连坐。", "Go to Jiang Wan: if Wei Yan dies, don't let his family pay for it."),
            [P(T("魏延还是死在了马岱刀下。杨仪踩着他的头骂：『庸奴！复能作恶不？』可蒋琬听了你的话，魏延的家小一个也没动。", "Wei Yan dies under Ma Dai's blade all the same. Yang Yi sets his foot on the head and curses him. But Jiang Wan heeds you, and not one of Wei Yan's household is touched."))],
            [setv("flag.v8_weiyan_family"), add("renown.loyal"), add("deviation")], echo=["e_wy_family"]),
     choice("yangyi", "expression", T("站在杨仪一边：魏延烧了栈道，就是反了。", "Side with Yang Yi: Wei Yan burned the plank road, and that's rebellion."),
            T("马岱斩了魏延。杨仪带着大军回了成都，觉得自己的功劳最大。", "Ma Dai beheads Wei Yan. Yang Yi leads the army home to Chengdu, sure that his own merit is the greatest."),
            [rel("weiyan", "trust", -2)])],
    quote=T("遂提刀按辔，于马上大叫曰：“谁敢杀我？”一声未毕，脑后一人厉声而应曰：“吾敢杀你！”手起刀落，斩魏延于马下。",
            "Gripping his blade and gathering the reins, he roared from the saddle, \"Who dares kill me?\" Before the cry had died, a voice behind him answered sharply, \"I dare!\"—and with one stroke Wei Yan fell from his horse."),
    when=STAY, order=10))

N.append(node("c1_return", "c1", "main", T("灵柩回成都", "The Coffin Comes Home"), "functional", T("第105回", "Ch. 105"),
    [P(T("陛下穿着孝服，出城二十里迎丞相的灵柩，放声大哭。丞相的遗表里写着：他死以后，可以把大事托给蒋琬，蒋琬之后是费祎。", "His Majesty, in mourning white, rides twenty li out of the city to meet the Chancellor's coffin and weeps aloud. In his last memorial the Chancellor wrote: when he is gone, great affairs may be entrusted to Jiang Wan, and after Jiang Wan to Fei Yi.")),
     P(T("马谡也来了，穿着布衣，站在送葬的人群最后面，哭得站不住。", "Ma Su has come too, in commoner's cotton, at the very back of the mourners, weeping so hard he can barely stand."), F("flag.masu_alive")),
     P(T("陛下拉着你的手：『子衡，你也留下。』", "His Majesty takes your hand. 'Ziheng, you'll stay too.'"))],
    [choice("court", "strategy", T("留在成都，帮蒋琬把丞相留下的摊子撑住。", "Stay in Chengdu and help Jiang Wan hold up what the Chancellor left."),
            T("蒋琬是个稳当人，你们一起熬过了最难的那几年。朝里人心慢慢定了。", "Jiang Wan is a steady man, and together you get through the hardest years. Slowly the court settles."),
            [setv("flag.v8_court"), add("renown.loyal")]),
     choice("jiang", "dilemma", T("随姜维去汉中。丞相的兵书在他手里，你得替丞相看着。", "Go to Hanzhong with Jiang Wei. The Chancellor's books of war are in his hands; you must watch over them for the Chancellor."),
            T("姜维什么也没说，给你牵来一匹老马：『走得慢，可稳当。』", "Jiang Wei says nothing, and leads over an old horse for you. 'Slow, but steady.'"),
            [setv("flag.v8_with_jiang"), rel("jiangwei", "trust", 1), rel("jiangwei", "warmth", 1)]),
     choice("home", "expression", T("辞官回家。这一辈子，够了。", "Resign and go home. This one life has been enough."),
            T("陛下这一回准了。你回到家，院子里的梅树又长高了一截。", "This time His Majesty allows it. You go home, and the plum tree in the yard has grown another span."),
            [setv("flag.v8_home"), rel("wenzhi", "intimacy", 1)])],
    when=STAY, order=20))

N.append(node("c1_wz8", "c1", "side", T("城门口", "At the City Gate"), "free", T("原创人物", "original character"),
    [P(T("灵柩进城那天，温芷在城门口等你，手里牵着孩子。孩子七岁了，躲在她身后，偷偷看你。", "The day the coffin enters the city, Wen Zhi is waiting at the gate, holding the child by the hand. The child is seven now, hiding behind her, peeking at you."), HC),
     P(T("灵柩进城那天，温芷在城门口等你。她头发也白了一些。", "The day the coffin enters the city, Wen Zhi is waiting at the gate. Her hair has gone a little white too."), HS)],
    [choice("hold", "dilemma", T("走过去，什么也不说，抱住她们。", "Walk over, say nothing, and hold them."),
            T("温芷在你耳边说：『回来就好。』", "Wen Zhi says in your ear, 'You're home. That's enough.'"), [rel("wenzhi", "intimacy", 1), rel("wenzhi", "warmth", 1)], when=HC),
     choice("hold2", "dilemma", T("走过去，什么也不说，抱住她。", "Walk over, say nothing, and hold her."),
            T("温芷在你耳边说：『回来就好。』", "Wen Zhi says in your ear, 'You're home. That's enough.'"), [rel("wenzhi", "intimacy", 1), rel("wenzhi", "warmth", 1)], when=HS),
     choice("tell", "expression", T("跟她说五丈原的事。", "Tell her about Wuzhang."),
            T("她听完，说：『丞相是累死的。你别学他。』", "She hears it through and says, 'The Chancellor worked himself to death. Don't you copy him.'"), [rel("wenzhi", "trust", 1)])],
    when=ALL(WZ, STAY), salience=4, order=1))

# ---------- c2 托付 ----------
N.append(node("c2_xiahouba", "c2", "main", T("夏侯霸来降", "Xiahou Ba Comes Over"), "functional", T("第107回", "Ch. 107"),
    [P(T("魏国出了大事：司马懿趁曹爽陪魏主出城祭陵，关了洛阳城门，夺了曹家的兵权。曹家的老将夏侯霸怕被牵连，逃到了蜀中。他带来的话只有一句：魏国，以后是司马家的了。", "Something huge has happened in Wei: while Cao Shuang was out of the city with the Wei emperor at the imperial tombs, Sima Yi shut the gates of Luoyang and seized the Cao clan's armies. Xiahou Ba, an old general of the Cao house, afraid of being dragged down, has fled to Shu. His news is one sentence: Wei belongs to the Simas now.")),
     P(T("这些年你一直在成都，帮蒋琬、费祎守着丞相留下的摊子。", "All these years you've been in Chengdu, helping Jiang Wan and Fei Yi hold up what the Chancellor left."), F("flag.v8_court")),
     P(T("这些年你一直在汉中，跟着姜维。", "All these years you've been in Hanzhong with Jiang Wei."), F("flag.v8_with_jiang")),
     P(T("这些年你在家里，种药，教孩子认字。", "All these years you've been at home, growing herbs, teaching the child to read."), F("flag.v8_home")),
     P(T("姜维连夜来看你。他也快五十了，坐在你床边，问：『先生，该不该打？』", "Jiang Wei comes to see you that night. He's nearly fifty himself. He sits by your bed and asks, 'Master, should we march?'"))],
    [choice("go", "dilemma", T("说：打。魏国在乱，这是丞相等了一辈子的时候。", "Say: march. Wei is in turmoil; this is the moment the Chancellor waited his whole life for."),
            T("姜维的眼睛亮了，握着你的手：『先生懂我。』", "Jiang Wei's eyes light up. He grips your hand. 'You understand me, Master.'"), [rel("jiangwei", "warmth", 2), rel("jiangwei", "trust", 1)]),
     choice("farm", "strategy", T("说：打可以，先把汉中的屯田安顿好。兵要吃饭，百姓也要。", "Say: march if you must, but settle the farm-colonies in Hanzhong first. Soldiers need to eat, and so do the people."),
            T("姜维想了很久，点头：『伯约记下了。』后来汉中的屯田，一直是你说的那个样子。", "Jiang Wei thinks a long time and nods. 'I'll remember.' The Hanzhong farm-colonies were run your way ever after."),
            [setv("flag.v8_tuntian"), rel("jiangwei", "esteem", 2)]),
     choice("wait", "expression", T("说：费祎说得对。丞相都没打下来的地方，别再拿人命去填了。", "Say: Fei Yi is right. Where even the Chancellor couldn't win, stop filling the gap with men's lives."),
            T("姜维低下头，很久没说话。走的时候，他说：『先生保重。』声音是冷的。", "Jiang Wei lowers his head and says nothing for a long time. As he leaves he says, 'Take care, Master.' His voice is cold."),
            [rel("jiangwei", "warmth", -1), rel("jiangwei", "esteem", 1)])],
    when=STAY, order=10))

N.append(node("c2_simayi", "c2", "side", T("仲达的信", "A Letter from Zhongda"), "free", T("原创", "original"),
    T("一个魏国的商人，辗转把一封信送到你家。信上没有落款，字你认得：『子衡先生：五丈原一别，十五年矣。懿老矣，孔明也走了十五年了。当年先生说孔明食少事烦，懿至今记得。先生如今，吃得多少？』",
      "A Wei merchant, by roundabout ways, brings a letter to your door. It's unsigned, but you know the hand. 'Master Ziheng: fifteen years since we parted at Wuzhang. I am old, and Kongming has been gone fifteen years. I still remember you telling me Kongming ate little and worked much. And you, Master—how much do you eat these days?'"),
    [choice("reply", "dilemma", T("回信：一顿两碗。都督也保重。", "Write back: two bowls a sitting. You take care too, Grand Commander."),
            T("信送出去两年以后，司马懿死了。你听说，他临死前，把这封回信烧了。", "Two years after the letter goes, Sima Yi dies. You hear that before he died, he burned your reply."),
            [setv("flag.v8_simayi_letter"), rel("simayi", "warmth", 2)]),
     choice("burn", "expression", T("把信烧了，不回。", "Burn the letter and don't answer."),
            T("火苗舔着那几行字。你想起五丈原的秋风。", "The flame licks at those few lines. You think of the autumn wind at Wuzhang."), [setv("flag.v8_simayi_letter"), rel("simayi", "esteem", 1)])],
    when=ALL(ANY(F("flag.v7_envoy"), AT("simayi", "esteem", 2)), STAY), salience=3, order=1))

N.append(talk_node("c2_wz_last", "c2", T("夜谈·温芷", "Night Talk: Wen Zhi"),
    T("夜里你醒了，温芷坐在灯下，在给孩子补衣裳。她的眼睛不好了，针要凑得很近。她看见你醒了，笑：『睡不着？那就说说话。』",
      "You wake in the night. Wen Zhi sits by the lamp mending the child's clothes. Her eyes aren't good now; she holds the needle very close. Seeing you awake, she smiles. 'Can't sleep? Then let's talk.'"),
    "wenzhi", 2,
    [topic("xuchang", T("说起许都，你们第一次见面。", "Talk about Xuchang, the first time you met."),
           T("温芷笑出了声：『你那时候傻乎乎的，进门就问我丞相府里谁病了。』她停了停，『五十年了。』", "Wen Zhi laughs aloud. 'You were such a fool then—you came in and asked me who in the Chancellor's household was ill.' She pauses. 'Fifty years.'"),
           [rel("wenzhi", "warmth", 2)]),
     topic("book", T("问她：那本青囊书，打算给谁？", "Ask her: that medical book—who will you give it to?"),
           [P(T("温芷看了一眼睡着的孩子：『给承之。药箱也给。人可以不做官，不能不会救人。』", "Wen Zhi glances at the sleeping child. 'To Chengzhi. The chest too. A person can live without office, but not without knowing how to save a life.'"), F("flag.wz_qingnang")),
            P(T("温芷看了一眼睡着的孩子：『我那些方子，都抄好了，给承之。药箱也给。』", "Wen Zhi glances at the sleeping child. 'I've copied out all my prescriptions—they're for Chengzhi. The chest too.'"), NF("flag.wz_qingnang"))],
           [setv("flag.v8_qingnang"), rel("wenzhi", "trust", 1)], echo=["e_qingnang"], when=HC),
     topic("first", T("问她：要是先走的是我呢？", "Ask her: and if I'm the one who goes first?"),
           T("温芷放下针，握住你的手：『那我就把你说过的话，一句一句讲给孩子听。讲完了，我就来找你。』", "Wen Zhi puts down the needle and takes your hand. 'Then I'll tell the child everything you ever said, one word at a time. And when I've finished telling it, I'll come and find you.'"),
           [rel("wenzhi", "intimacy", 2)])],
    T("灯油快没了。温芷吹了灯，在黑暗里说：『睡吧，子衡。』", "The lamp oil is nearly gone. Wen Zhi blows it out and says in the dark, 'Sleep, Ziheng.'"),
    when=ALL(WED, STAY), order=20))

N.append(node("c2_wz_letter8", "c2", "side", T("最后一封信", "The Last Letter"), "free", T("原创人物", "original character"),
    T("温芷从远处寄来一封信。她在那里行医很多年了，信里写：『这里的人管我叫老温。我收了三个徒弟，都比你当年聪明。』最后一句是：『子衡，保重。我们大概见不着了。』",
      "A letter comes from Wen Zhi, far away. She's practised medicine there many years. 'People here call me Old Wen. I've taken three apprentices, all cleverer than you were.' The last line: 'Ziheng, take care. I don't suppose we'll meet again.'"),
    [choice("write", "dilemma", T("回一封很长的信，把这些年没说的话都写上。", "Write back at length, everything you never said all these years."),
            T("你写了三天。信寄出去以后，再没有回音。", "It takes you three days. After it's sent, no answer ever comes."), [rel("wenzhi", "warmth", 2)]),
     choice("short", "expression", T("回一句：你也保重。", "Write back one line: you take care too."), T("你把信折好，放在枕边。", "You fold her letter and keep it by your pillow."), [rel("wenzhi", "trust", 1)])],
    when=ALL(WZ, NF("flag.wz_wed"), STAY), salience=3, order=2))

FAN = F("flag.v7_fan")
N.append(node("c2_heir", "c2", "main", T("托付", "Handing On"), "free", T("原创人物", "original character"),
    H("入冬以后，你病倒了。承之从军中赶回来，守在床边，给你熬药——那是温芷教的方子。你看着这个孩子，想起很多年前，你也是这么年轻。",
      "When winter comes you fall ill. Chengzhi hurries back from the army to sit by your bed and brew your medicine—from a recipe Wen Zhi taught. You look at this child of yours and remember being that young, many years ago.",
      "入冬以后，你病倒了。守言从军中赶回来——当年营里那个替你誊抄文书的年轻书佐，如今也四十出头了。他守在床边，还是拿着本子，你说一句，他记一句。",
      "When winter comes you fall ill. Shouyan hurries back from the army—the young clerk who once copied your documents in camp, now in his forties himself. He sits by your bed with his notebook as ever, writing down each thing you say.") +
    [P(T("床头挂着那把白羽扇。", "The white feather fan hangs at the head of the bed."), FAN),
     P(T("你想了很久，最后要说的，只有一件事：以后，该往哪里走。", "You think a long time. In the end there's only one thing left to say: where to go from here."))],
    [choice("jiang", "dilemma", T("说：去跟着姜维。他一个人扛着丞相的担子，太重了。", "Say: go and follow Jiang Wei. He carries the Chancellor's load alone, and it's too heavy."),
            T("你把这些年的本子推到床边。几天以后，你走了，走的时候是笑着的。", "You push the notebooks of all those years to the edge of the bed. A few days later you die, and you die smiling."),
            [setv("flag.v8_heir_jiang"), setv("flag.v8_ziheng_gone"), rel("jiangwei", "trust", 1), rel("jiangwei", "warmth", 1)]),
     choice("court", "strategy", T("说：守在成都，看着陛下。朝里要有一个说真话的人。", "Say: stay in Chengdu and watch over His Majesty. The court needs one person who tells the truth."),
            T("你说完这句，就睡着了。几天以后，你走了。", "You fall asleep after saying it. A few days later you die."),
            [setv("flag.v8_heir_court"), setv("flag.v8_ziheng_gone"), add("renown.loyal")]),
     choice("free", "expression", T("说：别做官。好好活着。", "Say: don't take office. Live well."),
            T("你走了以后，你的话被听进去了一年。第二年，姜维的信来了，还是去了。", "After you die, your words are heeded for a year. The next year a letter comes from Jiang Wei, and they go all the same."),
            [setv("flag.v8_heir_free"), setv("flag.v8_ziheng_gone")])],
    callbacks=[cb("e_letter", T("魏延从汉中托人带来一坛酒，什么话也没捎。", "From Hanzhong, Wei Yan sends a jar of wine by someone's hand, and no message."), None),
               cb("e_wy_family", T("魏延的儿子来磕了一个头，放下一篮鸡蛋就走了。", "Wei Yan's son comes, knocks his head once, leaves a basket of eggs, and goes."), None),
               cb("e_qingnang", T("温芷把药箱放在承之脚边：『你父亲的病，你来看。』", "Wen Zhi sets the medicine chest at Chengzhi's feet. 'Your father's illness—you see to it.'"), None)],
    when=STAY, order=30))
# 白羽扇：有扇子的，子衡走时一并交给接班人
for c in N[-1]["choices"]:
    c["out"].append(P(T("那把白羽扇，你交到了接班人手里。", "The white feather fan you put into your heir's hands."), FAN))
# 效果不带条件，所以“扇子到了接班人手里”另写成子衡走后的一幕
N.append(node("c3_fan_pass", "*", "interrupt", T("白羽扇", "The White Feather Fan"), "free", T("原创", "original"),
    H("你把父亲留下的那把白羽扇，用布包了，背在身上。", "You wrap the white feather fan your father left in cloth and carry it on your back.",
      "你把先生留下的那把白羽扇，用布包了，背在身上。", "You wrap the white feather fan your teacher left in cloth and carry it on your back."),
    [choice("carry", "expression", T("带着它去军中。", "Take it with you to the army."), T("姜维看见扇子，伸手摸了一下，又缩了回去。", "When Jiang Wei sees the fan he reaches out to touch it, then draws his hand back."),
            [setv("flag.v8_fan_heir"), rel("jiangwei", "warmth", 1)])],
    when=ALL(FAN, STAY, F("flag.v8_ziheng_gone"), NF("flag.v8_fan_heir")), order=-1))

# ---------- c3 段谷 ----------
N.append(node("c3_duangu", "c3", "main", T("段谷", "Duan Valley"), "functional", T("第111回", "Ch. 111"),
    [P(T("约好的日子到了，胡济没有来。邓艾的兵却到了，堵在段谷。姜维看着地图，脸色铁青。", "The appointed day comes and Hu Ji doesn't. Deng Ai's troops do, blocking Duan Valley. Jiang Wei stares at the map, his face like iron."))],
    [choice("huji", "dilemma", T("自请带几个人，连夜去催胡济。", "Ask to take a few riders and go after Hu Ji through the night."),
            T("你跑死了两匹马，在第三天把胡济的前军带了回来。姜维已经败了，可退路上有了接应，活着回来的人多了好几千。", "You ride two horses to death and bring Hu Ji's vanguard back on the third day. Jiang Wei is already beaten, but now there's someone holding the line of retreat, and several thousand more men come home alive."),
            [setv("flag.v8_duangu_saved"), rel("jiangwei", "trust", 2), add("deviation")], echo=["e_duangu"]),
     choice("wait", "strategy", T("劝姜维：胡济不来，就别进段谷。", "Urge Jiang Wei: if Hu Ji isn't here, don't go into Duan Valley."),
            T("姜维想了一夜，还是进了。他说：『再等，就什么都没了。』段谷一战，蜀兵死了很多。", "Jiang Wei thinks all night and goes in anyway. 'Wait any longer and there'll be nothing left,' he says. At Duan Valley a great many of Shu's soldiers die."),
            [rel("jiangwei", "esteem", 1)]),
     choice("with", "expression", T("什么也不说，跟着他冲阵。", "Say nothing. Charge with him."),
            T("你们杀出来的时候，身边的人少了一大半。姜维浑身是血，回头找你：『你还在。好。』", "When you cut your way out, more than half of those around you are gone. Jiang Wei, covered in blood, turns to look for you. 'You're still here. Good.'"),
            [rel("jiangwei", "warmth", 2)])],
    when=STAY, order=10))

N.append(talk_node("c3_jiangwei", "c3", T("夜谈·姜维", "Night Talk: Jiang Wei"),
    T("退回汉中的那天夜里，姜维一个人坐在帐里，面前是丞相的兵书。他看见你，指了指对面：『坐。』",
      "The night you fall back to Hanzhong, Jiang Wei sits alone in his tent, the Chancellor's books of war before him. Seeing you, he points to the seat opposite. 'Sit.'"),
    "jiangwei", 2,
    [topic("ziheng", T("问他：我父亲／先生，当年是什么样的人？", "Ask him: what was my father—my teacher—like back then?"),
           [P(T("姜维笑了：『当年丞相要拿我母亲做饵，是他劝住的。我降蜀以后，第一个拜的就是他。』", "Jiang Wei smiles. 'Back then the Chancellor meant to use my mother as bait, and it was he who talked him out of it. When I came over to Shu, he was the first man I bowed to.'"), F("flag.v7_mother")),
            P(T("姜维笑了：『他话不多，可丞相每回拿不定主意，都先看他一眼。』", "Jiang Wei smiles. 'He didn't say much. But whenever the Chancellor couldn't decide, he'd glance at him first.'"), NF("flag.v7_mother"))],
           [rel("jiangwei", "warmth", 2)]),
     topic("why", T("问他：打了这么多年，为什么还打？", "Ask him: after all these years, why keep fighting?"),
           T("姜维沉默了很久：『丞相把这个交给我的时候，没说打不下来可以不打。』", "Jiang Wei is silent a long time. 'When the Chancellor gave me this, he didn't say I could stop if I couldn't win.'"),
           [rel("jiangwei", "trust", 1), rel("jiangwei", "esteem", 1)]),
     topic("home", T("问起天水。", "Ask about Tianshui."),
           T("『我母亲早就不在了。』姜维说，『我连她葬在哪里都不知道。』", "'My mother's long gone,' Jiang Wei says. 'I don't even know where she's buried.'"),
           [rel("jiangwei", "warmth", 1), rel("jiangwei", "trust", 1)])],
    T("你走的时候，姜维说：『明天还要练兵。去睡吧。』", "As you leave, Jiang Wei says, 'There's drill tomorrow. Go and sleep.'"), when=STAY, order=20))
N[-1]["callbacks"] = [cb("e_duangu", T("姜维说：『段谷那回，要不是你跑死两匹马，我回不来。』", "Jiang Wei says, 'At Duan Valley, if you hadn't ridden two horses to death, I wouldn't have come back.'"), None)]

N.append(node("c3_healer", "c3", "side", T("伤兵营", "The Wounded Camp"), "free", T("原创人物", "original character"),
    T("伤兵营里躺满了人。你打开母亲留下的药箱，翻开那本青囊书。", "The wounded camp is full. You open the medicine chest your mother left and turn to the pages of the medical book."),
    [choice("work", "dilemma", T("三天三夜不合眼，一个一个地治。", "Three days and nights without sleep, treating them one by one."),
            T("那个冬天，伤兵营里活下来的人，比往年多。他们管你叫“小温先生”。", "That winter more men live through the wounded camp than in other years. They call you Little Master Wen."),
            [setv("flag.v8_healer"), add("renown.loyal"), rel("jiangwei", "esteem", 1)]),
     choice("teach", "strategy", T("把方子教给营里的军医。", "Teach the prescriptions to the camp's surgeons."),
            T("你走了以后，那些方子还在营里传着。", "After you leave, the prescriptions keep passing from hand to hand in camp."), [setv("flag.v8_healer"), rel("jiangwei", "esteem", 1)])],
    when=ALL(F("flag.v8_qingnang"), STAY), salience=4, order=1))

N.append(node("c3_xiahouba", "c3", "side", T("夏侯霸", "Xiahou Ba"), "free", T("第107回", "Ch. 107"),
    T("夏侯霸喝多了，拉着你说：『我在魏国，打了你们一辈子。如今我是蜀将了，你说可笑不可笑？』", "Xiahou Ba has drunk too much, and grabs your arm. 'In Wei I fought you all my life. Now I'm a general of Shu. Isn't that a joke?'"),
    [choice("laugh", "expression", T("陪他笑。", "Laugh with him."), T("他笑着笑着，哭了。", "He laughs and laughs, and then he weeps."), [rel("jiangwei", "warmth", 1)]),
     choice("ask", "strategy", T("问他司马家的事。", "Ask him about the Sima family."),
            T("他说了很多：司马师、司马昭，一个比一个狠。你都记了下来。", "He tells you a great deal: Sima Shi, Sima Zhao, each more ruthless than the last. You write it all down."), [rel("jiangwei", "esteem", 1)])],
    when=STAY, salience=2, order=2))

# ---------- c4 黄皓 ----------
N.append(node("c4_huanghao", "c4", "main", T("黄皓", "Huang Hao"), "functional", T("第113–115回", "Ch. 113–115"),
    [P(T("姜维进宫，跪着请陛下杀黄皓。陛下笑着说：『黄皓不过是个跑腿的小臣，就算让他专权，又能怎样？』他让黄皓出来给姜维赔罪。黄皓哭着磕头。姜维出了宫，对你说：『祸不远了。』", "Jiang Wei enters the palace and kneels, begging His Majesty to put Huang Hao to death. His Majesty laughs: Huang Hao is just a little errand-runner—even if he had his way, what could he do? He has Huang Hao come out and beg Jiang Wei's pardon. Huang Hao weeps and knocks his head. Outside the palace Jiang Wei says to you, 'Disaster isn't far off.'")),
     P(T("你想起父亲／先生的话：朝里要有一个说真话的人。", "You remember what you were told: the court needs one person who tells the truth."), F("flag.v8_heir_court"))],
    [choice("face", "dilemma", T("第二天上朝，当着百官弹劾黄皓。", "At court the next day, denounce Huang Hao before all the officials."),
            T("满朝没有一个人接你的话。陛下脸色很难看，散朝以后，把你外放到了汉中。黄皓记住了你的名字。", "No one in the whole court takes up your words. His Majesty's face darkens, and after court he posts you away to Hanzhong. Huang Hao remembers your name."),
            [setv("flag.v8_hh_faced"), add("renown.loyal", 2), rel("jiangwei", "esteem", 2)], echo=["e_hh"]),
     choice("tazhong", "strategy", T("劝姜维：带兵去沓中屯田，离成都远一点。", "Urge Jiang Wei: take the army to farm at Tazhong, well away from Chengdu."),
            T("姜维想了想，上表去了沓中。黄皓找不到他的错处，也就算了。", "Jiang Wei considers, then memorializes and goes to Tazhong. Huang Hao can find no fault to pin on him and lets it go."),
            [setv("flag.v8_tazhong"), rel("jiangwei", "trust", 2)], echo=["e_tazhong"]),
     choice("ally", "dilemma", T("备一份厚礼，去黄皓府上，替姜维说几句好话。", "Take a fine gift to Huang Hao's house and put in a good word for Jiang Wei."),
            T("黄皓收了礼，拍着你的手说：『好说。』出门的时候，你觉得自己的手很脏。", "Huang Hao accepts the gift and pats your hand. 'That can be arranged.' Going out, your hand feels filthy."),
            [setv("flag.v8_hh_ally"), add("renown.cunning", 2), rel("jiangwei", "warmth", -1)])],
    when=STAY, order=10))

N.append(node("c4_houzhu", "c4", "side", T("后主", "The Old Emperor"), "free", T("原创", "original"),
    T("陛下私下召你进宫。他五十多了，胖了，坐在那里，忽然问：『相父在的时候，常说起你家里的那位。他……是什么样的人？』", "His Majesty summons you privately. He's past fifty and stout. Sitting there, he suddenly asks, 'When the Father Chancellor was alive, he often spoke of that elder of yours. What… was he like?'"),
    [choice("true", "dilemma", T("说：是个会说难听话的人。", "Say: someone who said unpleasant things."),
            T("陛下愣了很久，笑了：『董允也是。他们都走了。』", "His Majesty is startled a long while, then smiles. 'So was Dong Yun. They're all gone.'"), [add("renown.loyal")]),
     choice("soft", "expression", T("说：是个念着陛下的人。", "Say: someone who always had Your Majesty in his thoughts."),
            T("陛下点点头，赏了你一匹绢。", "His Majesty nods and rewards you with a bolt of silk."), [])],
    when=STAY, salience=2, order=1))

# ---------- c5 阴平 ----------
N.append(node("c5_jiange", "c5", "main", T("剑阁", "Jiange"), "functional", T("第116–117回", "Ch. 116–117"),
    [P(T("钟会在剑阁下面攻了一个月，过不来，粮也快没了。夜里，你在灯下看地图，看见剑阁西边，有一条小路：阴平。七百里，没有人烟。", "Zhong Hui has assaulted Jiange for a month and can't get through, and his grain is running low. At night you study the map by the lamp, and see west of Jiange a little road: Yinping. Seven hundred li without a living soul.")),
     P(T("汉中的屯田还是当年子衡说的样子，剑阁的粮，够吃三个月。", "The Hanzhong farm-colonies are still run the way Ziheng said, and Jiange has grain enough for three months."), F("flag.v8_tuntian")),
     P(T("你在沓中屯田那几年，走过阴平那一带。那条路，人能走。", "In the years of the farm-colony at Tazhong, you walked that country around Yinping. That road can be walked."), F("flag.v8_tazhong"))],
    [choice("memo", "strategy", T("请姜维上表：派兵守阴平。你亲自把表送到成都。", "Ask Jiang Wei to memorialize for troops at Yinping. Carry the memorial to Chengdu yourself."),
            [P(T("你赶到成都，把表递了上去。三天没有回音。后来你才知道，黄皓把表压了下来，说巫师算过了，魏兵不会来。", "You reach Chengdu and hand up the memorial. Three days, no answer. Only later do you learn that Huang Hao kept it back, saying a shaman had read the signs and Wei would not come.")),
             P(T("黄皓收过你的礼。表递到了陛下手上，陛下派了五百个老兵去阴平——太少，太晚。", "Huang Hao once took your gift. The memorial reaches His Majesty, and he sends five hundred old soldiers to Yinping—too few, too late."), F("flag.v8_hh_ally"))],
            [setv("flag.v8_yp_memo"), rel("jiangwei", "esteem", 1)]),
     choice("guard", "dilemma", T("自请带五百人去守阴平。", "Ask to take five hundred men and guard Yinping yourself."),
            T("姜维犹豫了很久。剑阁一个人也不能少。最后他拍了拍你的肩：『去吧。小心。』", "Jiang Wei hesitates a long time. Jiange can't spare a single man. At last he claps your shoulder. 'Go. Be careful.'"),
            [setv("flag.v8_yp_guard"), rel("jiangwei", "trust", 1)], req=AT("jiangwei", "trust", 2), hint=T("需要姜维的信任在「可托」以上，他才肯分兵给你", "Needs Jiang Wei's trust at Reliable or above before he'll spare you men")),
     choice("hold", "expression", T("剑阁要紧。守着剑阁。", "Jiange matters most. Hold Jiange."), T("你们守住了剑阁。钟会一步也没过来。", "You hold Jiange. Zhong Hui doesn't advance a single step."), [rel("jiangwei", "warmth", 1)])],
    callbacks=[cb("e_duangu", T("剑阁的守兵里，有好些是段谷那回活下来的。他们认得你。", "Many of the men holding Jiange are survivors of Duan Valley. They know you."), None),
               cb("e_tazhong", T("姜维说：『要不是你劝我去沓中，我今天不在这里，在牢里。』", "Jiang Wei says, 'If you hadn't urged me to Tazhong, I wouldn't be here today. I'd be in prison.'"), None)],
    when=STAY, order=10))

GUARD = F("flag.v8_yp_guard")
N.append(node("c5_yinping", "c5", "main", T("阴平", "Yinping"), "literal", T("第117回", "Ch. 117"),
    [P(T("邓艾带着两万人，凿山开路，造桥过涧，走了七百里无人之地。到了摩天岭，下面是悬崖，马过不去。邓艾取毡自裹其身，先滚了下去。", "Deng Ai and twenty thousand men cut through mountains and bridged ravines across seven hundred li of empty land. At Motian Ridge there's a cliff below, impassable for horses. Deng Ai wraps himself in a felt blanket and rolls down first.")),
     P(T("你带着五百人守在岭下。天刚亮，你看见崖上一个接一个滚下来的人。", "You're holding the foot of the ridge with five hundred men. At first light you see them rolling down the cliff, one after another."), GUARD),
     P(T("消息传到的时候，已经晚了。", "By the time the news arrives, it's too late."), NF("flag.v8_yp_guard"))],
    gate(GUARD, AT("jiangwei", "trust", 3),
         choice("fight", "dilemma", T("趁他们刚滚下来，还没站稳，冲上去。", "Charge them as they land, before they can find their feet."),
                T("你们把先下来的几百人赶回了崖脚。邓艾在崖上看了你们一天，第二天，他从另一道山梁绕了过去。你只多拦了他一天——就差一天。姜维后来听说，在剑阁上捶了半天墙。", "You drive the first few hundred back against the cliff. Deng Ai watches you from above for a whole day; the next day he goes round by another ridge. You held him one day longer—just one day short. When Jiang Wei hears, he pounds the wall at Jiange for half a day."),
                [setv("flag.v8_nearly"), add("deviation", 3), add("renown.loyal", 2), rel("jiangwei", "trust", 1)]),
         choice("fight", "dilemma", T("趁他们刚滚下来，还没站稳，冲上去。", "Charge them as they land, before they can find their feet."),
                T("可滚下来的人太多了。你那五百人，退回来的时候不到两百。", "But too many come rolling down. Of your five hundred, fewer than two hundred make it back."),
                [add("renown.loyal")])) +
    [choice("warn", "strategy", T("派最快的马，去报江油、绵竹、成都。", "Send the fastest riders to warn Jiangyou, Mianzhu and Chengdu."),
            T("江油的马邈还是开城降了，可绵竹早知道了一天。", "Ma Miao at Jiangyou opens the gates anyway, but Mianzhu learns of it a day sooner."),
            [setv("flag.v8_yp_warned")], echo=["e_yp"]),
     choice("see", "expression", T("什么都来不及了。看着。", "There's no time for anything. Watch."), T("你看着那些人一个一个地滚下来，像雪崩。", "You watch them roll down one after another, like an avalanche."), [])],
    quote=T("艾取毡自裹其身，先滚下去。副将有毡衫者裹身滚下，无毡衫者各用绳索束腰，攀木挂树，鱼贯而进。",
            "Ai wrapped himself in felt and rolled down first. Those officers who had felt coats wrapped themselves and rolled down; those without tied ropes round their waists, clung to trees, and went down one after another like a string of fish."),
    when=STAY, order=20))

# ---------- c6 绵竹 ----------
N.append(node("c6_mianzhu", "c6", "main", T("绵竹", "Mianzhu"), "literal", T("第117回", "Ch. 117"),
    [P(T("诸葛瞻三十七岁，是丞相五十岁上才得的儿子。邓艾派人送信劝降，许他做琅琊王。诸葛瞻把信撕了，斩了来使。", "Zhuge Zhan is thirty-seven, the son the Chancellor had at fifty. Deng Ai sends a letter urging surrender, offering to make him King of Langya. Zhuge Zhan tears up the letter and beheads the envoy.")),
     P(T("他和你同岁。你们小时候，在成都的同一个学堂里念过书。", "He's the same age as you. You studied in the same school in Chengdu as children."), HC)],
    [choice("pass", "strategy", T("劝诸葛瞻：别在城下等，抢先占住前面的险要。", "Urge Zhuge Zhan: don't wait under the walls—seize the passes ahead first."),
            [P(T("诸葛瞻听了，派兵去抢险要。阴平的消息早到了一天，你们抢到了。邓艾在山口下被拦了好几天。", "Zhuge Zhan heeds you and sends men to seize the passes. Word from Yinping came a day early, and you get there first. Deng Ai is held at the mouth of the pass for several days."), F("flag.v8_yp_warned")),
             P(T("诸葛瞻听了，派兵去抢险要，可邓艾的兵已经先到了。", "Zhuge Zhan heeds you and sends men to the passes, but Deng Ai's troops are already there."), NF("flag.v8_yp_warned")),
             P(T("最后诸葛瞻还是出城决战，死在了阵中。他最后一句话是：『吾力竭矣！当以一死报国！』", "In the end Zhuge Zhan still goes out to fight a decisive battle and dies in the ranks. His last words: my strength is spent; I'll repay the realm with my death."))],
            [setv("flag.v8_mz_pass"), add("deviation")]),
     choice("fight", "dilemma", T("随诸葛瞻出城决战。", "Go out with Zhuge Zhan to fight the decisive battle."),
            T("你在乱军里看见诸葛瞻中了箭，他大叫：『吾力竭矣！当以一死报国！』你被人拖着退了下来，身上的血不知道是谁的。", "In the melee you see Zhuge Zhan struck by an arrow. He cries: my strength is spent; I'll repay the realm with my death. Someone drags you back out of it, covered in blood that might be anyone's."),
            [add("renown.loyal", 2)]),
     choice("people", "dilemma", T("留在城里，护着伤兵和百姓，往成都撤。", "Stay in the town and get the wounded and the townsfolk back toward Chengdu."),
            [P(T("诸葛瞻死在了阵上。你带着几千个伤兵百姓，走了两天两夜，回到成都。", "Zhuge Zhan dies on the field. You lead several thousand of the wounded and the townsfolk two days and two nights back to Chengdu.")),
             P(T("一路上，你打开药箱，能救的都救了。", "All the way, you open the medicine chest and save everyone who can be saved."), F("flag.v8_healer"))],
            [setv("flag.v8_mz_people"), add("renown.loyal")], echo=["e_mz_people"])],
    quote=T("吾力竭矣！当以一死报国！", "My strength is spent! I will repay the realm with my death!"),
    callbacks=[cb("e_yp", T("绵竹的守将说：『阴平的快马，是你派来的？多亏早知道了一天。』", "The commander at Mianzhu says, 'The riders from Yinping—you sent them? That one day's warning saved us.'"), None),
               cb("e_qingnang", T("药箱的底下，压着母亲写的一张纸：先救能救的。", "At the bottom of the chest lies a note in your mother's hand: save the ones who can be saved first."), None)],
    when=STAY, order=10))

# ---------- c7 出降 ----------
N.append(node("c7_beidi", "c7", "main", T("背城一战", "One Last Battle Under the Walls"), "literal", T("第118回", "Ch. 118"),
    [P(T("谯周说：『不如不投吴而降魏。魏必裂土以封陛下，则上能自守宗庙，下可以保安黎民。』陛下的第五个儿子，北地王刘谌，站出来厉声说：『若势穷力极，祸败将及，便当父子君臣背城一战，同死社稷，以见先帝可也；奈何降乎！』", "Qiao Zhou says: better not to flee to Wu but to submit to Wei; Wei will surely grant Your Majesty a fief, so that above you may keep the ancestral temple and below protect the people. His Majesty's fifth son, Liu Chen, Prince of Beidi, steps forward and cries: if our strength is spent and ruin is upon us, then father and son, lord and minister should fight one last battle under the walls and die with the realm, and so go to meet the late emperor—why surrender!")),
     P(T("陛下手里攥着一道旧表——是你当初送来的，请守阴平。他看了很久。", "His Majesty is clutching an old memorial—the one you brought, asking for troops at Yinping. He looks at it a long time."), F("flag.v8_yp_memo")),
     P(T("陛下把北地王赶了出去。然后他看着你。", "His Majesty has the Prince of Beidi thrown out. Then he looks at you."))],
    [choice("liuchen", "dilemma", T("跪下，站到北地王一边：请陛下背城一战。", "Kneel and take the Prince of Beidi's side: beg His Majesty to fight under the walls."),
            T("陛下哭了：『朕……打不动了。』", "His Majesty weeps. 'We… can't fight anymore.'"), [add("renown.loyal", 2)]),
     choice("people", "strategy", T("说：要降，先派人跟邓艾约好——不杀百姓，不烧民宅，不动丞相的庙。", "Say: if we surrender, first send to Deng Ai and settle it—no killing the people, no burning their homes, no touching the Chancellor's shrine."),
            T("陛下照你说的写了降表。邓艾进城那天，下了令：有敢抢掠的，斩。成都的百姓，开门做生意。", "His Majesty writes the surrender as you said. The day Deng Ai enters the city, he gives the order: anyone who loots will be beheaded. The people of Chengdu open their shops."),
            [setv("flag.v8_cd_people"), add("deviation"), add("renown.loyal")], echo=["e_cd_people"]),
     choice("silent", "expression", T("不说话。", "Say nothing."), T("陛下叹了口气，让谯周去写降表。", "His Majesty sighs and has Qiao Zhou write the surrender."), [])],
    quote=T("若势穷力极，祸败将及，便当父子君臣背城一战，同死社稷，以见先帝可也；奈何降乎！",
            "If our strength is spent and ruin is upon us, then father and son, lord and minister, should fight one last battle under the walls and die with the realm, and so go to meet the late emperor—why surrender!"),
    callbacks=[cb("e_hh", T("黄皓不见了。有人说，他早就收拾了金银，躲出城去了。", "Huang Hao is nowhere to be found. Some say he packed his gold and silver long ago and slipped out of the city."), None),
               cb("e_mz_people", T("从绵竹带回来的人里，有几个跪在宫门外，求陛下别降。", "Some of the people you brought back from Mianzhu kneel outside the palace gate, begging His Majesty not to surrender."), None)],
    when=STAY, order=10))

N.append(node("c7_temple", "c7", "side", T("昭烈庙", "The Zhaolie Shrine"), "literal", T("第118回", "Ch. 118"),
    T("那天夜里，你听说北地王去了昭烈庙，先帝的庙。他说：『臣羞见基业弃于他人……祖如有灵，知孙之心！』你赶到的时候，庙门关着。", "That night you hear that the Prince of Beidi has gone to the Zhaolie Shrine, the late emperor's shrine. He has said he is ashamed to see the realm handed to others… if his ancestor has a spirit, let him know his grandson's heart. When you get there, the shrine doors are shut."),
    [choice("kids", "dilemma", T("翻进后院，把北地王的几个孩子抱出来。", "Climb into the back court and carry the Prince of Beidi's children out."),
            T("北地王死在了先帝的庙里。他的孩子，你连夜送出了城，交给一户山里的人家。后来没有人知道他们姓刘。", "The Prince of Beidi dies in the late emperor's shrine. His children you take out of the city that night and leave with a family in the hills. No one afterward ever knows their name was Liu."),
            [setv("flag.v8_beidi_kids"), add("deviation", 2), add("renown.loyal")], echo=["e_kids"]),
     choice("door", "expression", T("在庙门外跪下，陪他到天亮。", "Kneel outside the shrine doors and keep him company until dawn."),
            T("天亮的时候，庙里没有声音了。", "By dawn, there is no sound from the shrine."), [add("renown.loyal")])],
    quote=T("臣羞见基业弃于他人，故先杀妻子，以绝罣念，后将一命报祖！祖如有灵，知孙之心！",
            "\"I am ashamed to see the realm given over to others… and now I offer my life to my ancestor! If my ancestor has a spirit, let him know his grandson's heart!\""),
    when=STAY, salience=4, order=1))

N.append(node("c7_jw_letter", "c7", "main", T("吾有一计", "I Have a Plan"), "free", T("第118回", "Ch. 118"),
    T("姜维的信到了，只有几行：『降了钟会。勿怪。伯约另有计较。』", "A letter from Jiang Wei, a few lines only: 'Surrendered to Zhong Hui. Don't blame me. I have other plans.'"),
    [choice("go", "dilemma", T("赶去成都城外钟会的大营，跟着姜维。", "Hurry to Zhong Hui's great camp outside Chengdu and join Jiang Wei."),
            T("姜维看见你，把你拉到一边，压低了声音：『钟会想自己做皇帝。我要借他的手，把魏兵杀干净，再把陛下迎回来。』", "Seeing you, Jiang Wei draws you aside and lowers his voice. 'Zhong Hui wants to make himself emperor. I'll use his hands to wipe out the Wei troops, then bring His Majesty back.'"),
            [setv("flag.v8_follow_jw"), rel("jiangwei", "trust", 1)]),
     choice("stay", "strategy", T("留在成都，守着陛下和百姓。", "Stay in Chengdu with His Majesty and the people."),
            T("你回信：『城里有我。』姜维再没回信。", "You write back: 'I'm in the city.' Jiang Wei never writes back."), [setv("flag.v8_stay_cd")]),
     choice("warn", "expression", T("回信：钟会信不得。", "Write back: Zhong Hui can't be trusted."),
            T("姜维回了一句：『我知道。』", "Jiang Wei answers with one line: 'I know.'"), [setv("flag.v8_follow_jw"), rel("jiangwei", "esteem", 1)])],
    when=STAY, order=20))

# ---------- c8 归晋 ----------
JW_TOP = AT("jiangwei", "trust", 4)
N.append(node("c8_zhonghui", "c8", "main", T("姜维之死", "The Death of Jiang Wei"), "functional", T("第119回", "Ch. 119"),
    [P(T("正月十八，钟会在成都宫里请魏将们赴宴，要把不肯跟他反的人都关起来。可消息漏了：胡烈的兵听说要被坑杀，先乱了，杀进宫来。", "On the eighteenth of the first month, Zhong Hui invites the Wei generals to a feast in the Chengdu palace, meaning to lock up everyone who won't rebel with him. But word leaks: Hu Lie's soldiers hear they're to be buried alive, mutiny first, and storm the palace.")),
     P(T("你在城里。宫里的喊杀声，隔着三条街都听得见。", "You're in the city. You can hear the killing in the palace three streets away."))],
    gate(F("flag.v8_follow_jw"), JW_TOP,
         choice("warn", "dilemma", T("前一夜就去告诉姜维：胡烈的兵要变，现在就动手。", "Go to Jiang Wei the night before: Hu Lie's men are about to turn—act now."),
                T("姜维信了你，连夜调了兵，差一点就把魏将都扣住了。可钟会犹豫了一夜。天一亮，乱兵杀进来。姜维仰天大叫：『吾计不成，乃天命也！』他把你推出侧门：『替我活着。』", "Jiang Wei believes you and moves troops through the night, and very nearly has every Wei general in hand. But Zhong Hui hesitates one night. At dawn the mutineers break in. Jiang Wei looks up to Heaven and cries: my plan has failed; it is the will of Heaven! He shoves you out through a side door. 'Live, for me.'"),
                [setv("flag.v8_nearly_zhong"), setv("flag.v8_jw_end"), add("deviation", 3), rel("jiangwei", "warmth", 2)]),
         choice("warn", "dilemma", T("前一夜就去告诉姜维：胡烈的兵要变，现在就动手。", "Go to Jiang Wei the night before: Hu Lie's men are about to turn—act now."),
                T("姜维看着你，摇了摇头：『钟会不肯。』第二天，乱兵杀进宫来。姜维仰天大叫：『吾计不成，乃天命也！』遂自刎而死。", "Jiang Wei looks at you and shakes his head. 'Zhong Hui won't do it.' The next day the mutineers break into the palace. Jiang Wei looks up to Heaven and cries: my plan has failed; it is the will of Heaven! And he cuts his own throat."),
                [setv("flag.v8_jw_end"), rel("jiangwei", "warmth", 1)])) +
    [choice("family", "strategy", T("趁乱去姜维家，把他的家眷带出城。", "In the chaos, go to Jiang Wei's house and get his household out of the city."),
            T("乱兵杀到姜维家的时候，屋里已经空了。姜维死在宫里，他的家人，在城外山里活了下来。", "When the mutineers reach Jiang Wei's house, it's already empty. Jiang Wei dies in the palace; his family lives on in the hills outside the city."),
            [setv("flag.v8_jw_family"), add("deviation", 2), add("renown.loyal")]),
     choice("men", "dilemma", T("去姜维旧部的营里，叫蜀兵关上营门，谁也别出去。", "Go to the camp of Jiang Wei's old soldiers and have the Shu men shut the gate and stay inside."),
            T("那一夜，城里死了几百个蜀兵。你守着的那个营，一个也没少。", "That night several hundred Shu soldiers die in the city. In the camp you kept shut, not one is lost."),
            [setv("flag.v8_jw_men"), add("deviation"), add("renown.loyal")])],
    quote=T("维仰天大叫曰：“吾计不成，乃天命也！”遂自刎而死。", "Wei looked up to Heaven and cried, \"My plan has failed—it is the will of Heaven!\" and cut his own throat."),
    when=STAY, order=10))

N.append(node("c8_lebu", "c8", "side", T("此间乐", "Happy Here"), "literal", T("第119回", "Ch. 119"),
    [P(T("你随陛下——如今是安乐公了——到了洛阳。司马昭请他喝酒，叫人在席前演蜀地的歌舞。蜀中的旧臣都哭了，只有安乐公笑着。司马昭问：『颇思蜀否？』安乐公说：『此间乐，不思蜀也。』", "You've come with His Majesty—the Duke of Anle now—to Luoyang. Sima Zhao invites him to drink and has the songs and dances of Shu performed before the table. The old ministers of Shu all weep; only the Duke smiles. Sima Zhao asks: do you miss Shu much? The Duke says: I'm happy here; I don't miss Shu.")),
     P(T("郤正在你旁边，急得直跺脚，小声说：『你去教他。下回再问，就哭着说：先人坟墓，远在蜀地，乃心西悲，无日不思。』", "Xi Zheng, beside you, stamps his foot in frustration and whispers: 'You go and teach him. If he's asked again, have him weep and say: the graves of my forebears are far away in Shu; my heart grieves westward; there's not a day I don't think of it.'"))],
    [choice("teach", "strategy", T("去教他。", "Go and teach him."),
            T("司马昭又问了一回。安乐公照着说了，想哭，哭不出来，只好闭上眼睛。司马昭笑了：『何乃似郤正语耶？』安乐公睁开眼，吃惊地说：『诚如尊命。』满座大笑。只有你知道，他是在保命。", "Sima Zhao asks again. The Duke says it as taught, tries to weep and can't, and simply shuts his eyes. Sima Zhao laughs: why does that sound just like Xi Zheng? The Duke opens his eyes in surprise. 'Exactly as you say.' The whole table roars. Only you know he's saving his life."),
            [setv("flag.v8_luoyang")]),
     choice("let", "dilemma", T("不教。让他这样就好。", "Don't. Let him be as he is."),
            T("你看着他笑，忽然明白了：一个说“不思蜀”的人，司马昭是不会杀的。他比谁都清醒。", "You watch him smile and suddenly understand: Sima Zhao will never kill a man who says he doesn't miss Shu. He's clearer-headed than any of them."),
            [setv("flag.v8_luoyang")])],
    quote=T("后主曰：“此间乐，不思蜀也。”……先人坟墓，远在蜀地，乃心西悲，无日不思。",
            "The last emperor said, \"I am happy here; I do not miss Shu.\" … \"The graves of my forebears are far away in Shu; my heart grieves westward; there is not a day I do not think of it.\""),
    when=ALL(ANY(F("flag.v8_stay_cd"), F("flag.v8_heir_court")), STAY), salience=3, order=1))

N.append(node("c8_end", "c8", "main", T("三分归一", "Three Made One"), "literal", T("第120回", "Ch. 120"),
    [P(T("太康元年，晋兵顺江而下，吴主孙皓出降。从黄巾起事算起，九十七年，天下又是一家了。", "In the first year of Taikang, the Jin fleets sail down the river and Sun Hao, ruler of Wu, surrenders. Ninety-seven years after the Yellow Turbans rose, the realm is one house again.")),
     *H("你五十三岁了，头发白了一半。母亲留下的药箱，你还背着。", "You're fifty-three, your hair half white. You still carry your mother's medicine chest.",
        "你快七十了。先生的那三个本子，纸都黄了。", "You're nearly seventy. The paper of your teacher's three notebooks has gone yellow."),
     P(T("那把白羽扇，挂在你家堂上。", "The white feather fan hangs in your hall."), F("flag.v8_fan_heir"))],
    [choice("grave", "dilemma", T("去坟前，把这些年的事，一件一件说给他听。", "Go to the grave and tell him everything of these years, one thing at a time."),
            H("你在父母的坟前坐了一天。说到最后，你说：『天下一统了。可你们要是问我值不值……我不知道。』",
              "You sit a whole day at your parents' grave. At the end you say, 'The realm is one again. But if you asked me whether it was worth it… I don't know.'",
              "你在先生的坟前坐了一天。说到最后，你说：『天下一统了。先生要是问值不值……学生不知道。』",
              "You sit a whole day at your teacher's grave. At the end you say, 'The realm is one again. If you asked me whether it was worth it… I don't know, Master.'"),
            [add("renown.loyal")]),
     choice("book", "strategy", T("把那些本子整理成一本书。不写名字。", "Make the notebooks into a book. Without a name on it."),
            T("书写成了，没有书名，也没有作者。后来有人抄，有人传，传着传着，就成了说书人嘴里的“或曰”。", "The book is finished, with no title and no author. Later people copy it and pass it on, and as it passes on, it becomes the 'some say' in the storytellers' mouths."),
            [setv("flag.v8_book"), add("deviation")]),
     choice("river", "expression", T("去江边走走。", "Go walk by the river."),
            T("江水还是往东流。你想起有人说过，赤壁那一夜，江上全是火。", "The river still flows east. You remember someone telling you that on the night of Red Cliffs, the whole river was on fire."), [])],
    quote=T("纷纷世事无穷尽，天数茫茫不可逃。鼎足三分已成梦，后人凭吊空牢骚。",
            "The world's affairs go tumbling on without end; Heaven's vast reckoning none can escape. The three-legged cauldron is a dream now past; those who come after mourn it, and their grief is empty air."),
    callbacks=[cb("e_kids", T("山里有一户人家，每年清明都派个孩子来给你磕头。你从来没问过他姓什么。", "A family in the hills sends a child every Qingming to knock their head before you. You've never asked their surname."), None),
               cb("e_cd_people", T("成都的老人还说：魏兵进城那年，没烧一间房。", "The old people of Chengdu still say: the year the Wei army came in, not one house was burned."), None)],
    when=STAY, order=30))

# ---------- crises ----------
def crisis(id, title, intro, choices, when, order):
    return node(id, "*", "interrupt", title, "free", T("原创危机", "original crisis"), intro, choices, when=when, order=order)
N.append(crisis("x_cold8", T("冷落", "Sidelined"),
    T("姜维已经很久没叫你进帐了。军中有人说，他嫌你多嘴。", "It's been a long time since Jiang Wei called you into his tent. Some in the army say he finds you meddlesome."),
    [choice("mend", "strategy", T("去找姜维，把话说开。", "Go to Jiang Wei and talk it through."), T("你们谈了一夜。天亮时，姜维说：『是我脾气不好。』", "You talk all night. At dawn Jiang Wei says, 'It's my temper.'"), [rel("jiangwei", "trust", 2)]),
     choice("wait", "expression", T("等。做好手上的事。", "Wait. Do the work in front of you."), T("你的位子挪到了后排。", "Your seat moves to the back row."), [rel("jiangwei", "trust", 1), setv("flag.sidelined")]),
     choice("go", "dilemma", T("告辞。", "Take your leave."), T("姜维没有留你。", "Jiang Wei doesn't ask you to stay."), [setv("flag.v8_left")])],
    ALL(UPTO("jiangwei", "trust", 0), STAY), 3))
N[-1]["choices"][2]["ends"] = True
N.append(crisis("x_uncanny8", T("妖人", "Sorcerer"),
    T("成都城里都在传：子衡家里的人，能知后事。黄皓派人来打听。", "All Chengdu is saying that someone in Ziheng's house can tell what's to come. Huang Hao sends men to ask."),
    [choice("hide", "strategy", T("从此闭口。", "Hold your tongue from now on."), T("人们慢慢忘了。", "People slowly forget."), [add("uncanny", -2)]),
     choice("leave", "dilemma", T("离开成都，免得连累别人。", "Leave Chengdu, so no one else is tainted."), T("你在一个雨夜出了城。", "You leave the city one rainy night."), [setv("flag.v8_exposed")])],
    ALL(V("uncanny", ">=", 8), STAY), 2))
N[-1]["choices"][1]["ends"] = True
N.append(crisis("x_loose8", T("失言", "A Slip of the Tongue"),
    T("你说过的那些话，有人抄了下来，送到了黄皓手里。", "Someone has copied down things you've said and put them in Huang Hao's hands."),
    [choice("own", "strategy", T("认：话说过了头。", "Own it: you spoke out of turn."), T("姜维替你挡了下来：『管住嘴。』", "Jiang Wei shields you. 'Mind your tongue.'"), [add("renown.rash", -3), rel("jiangwei", "trust", -1)]),
     choice("argue", "dilemma", T("辩：句句是真话。", "Argue: every word was true."), T("『有些真话，要挑时候说。』", "'Some truths need the right moment.'"), [add("renown.rash", -1), rel("jiangwei", "esteem", 1)])],
    ALL(V("renown.rash", ">=", 6), STAY), 4))

# ------------------------------------------------------------------ open questions
ASKS = {
  "c1_weiyan": {"who": "weiyan", "fallback": "dodge",
    "q": T("隔着两军，魏延冲你喊：『先生！你说句公道话——我魏延，反了吗？』", "Across the lines Wei Yan shouts at you, 'Master! Say something fair—have I, Wei Yan, rebelled?'"),
    "answers": [
      ans("no", T("说没有，他只是不服杨仪", "says no—he just won't take orders from Yang Yi"), T("魏延大笑，笑出了眼泪：『还是先生懂我！』", "Wei Yan laughs until tears come. 'You still understand me, Master!'"), [rel("weiyan", "trust", 2), rel("weiyan", "warmth", 1)], match=r"没有|没反|不是反|杨仪|不服|no|not a rebel|yang yi", mood="warm"),
      ans("yes", T("说烧了栈道，就是反", "says burning the road is rebellion"), T("魏延的脸一下子白了：『好，好。』", "Wei Yan's face goes white. 'Fine. Fine.'"), [rel("weiyan", "trust", -2)], match=r"反了|是反|栈道|yes|you have|rebel", mood="cold"),
      ans("stop", T("劝他先放下刀", "urges him to put down his blade first"), T("魏延看着手里的刀，没有放，也没有举。", "Wei Yan looks at the blade in his hand, neither lowering nor raising it."), [rel("weiyan", "esteem", 1), rel("weiyan", "trust", 1)], match=r"放下|收刀|先停|别打|put it down|lower|stop", mood="neutral"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("魏延啐了一口，转过马头。", "Wei Yan spits and turns his horse."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
  "c3_duangu": {"who": "jiangwei", "fallback": "dodge",
    "q": T("战前那一夜，姜维忽然问你：『你说，丞相要是还在，会进段谷吗？』", "The night before the battle, Jiang Wei suddenly asks you, 'Tell me—if the Chancellor were still here, would he go into Duan Valley?'"),
    "answers": [
      ans("no", T("说不会，丞相求的是万全", "says no—the Chancellor sought a sure thing"), T("姜维苦笑：『是啊。可我不是丞相。』", "Jiang Wei smiles bitterly. 'Yes. But I'm not the Chancellor.'"), [rel("jiangwei", "esteem", 1)], match=r"不会|万全|谨慎|no|careful|sure thing", mood="neutral"),
      ans("you", T("说你不必做丞相", "says you needn't be the Chancellor"), T("姜维看了你很久：『你父亲也这么说过。』", "Jiang Wei looks at you a long time. 'Your father—your teacher—said that too.'"), [rel("jiangwei", "warmth", 2), rel("jiangwei", "trust", 1)], match=r"不必|不用|你就是你|你自己|don't have to|yourself|you're not him", mood="warm"),
      ans("yes", T("说会，丞相也冒过险", "says yes—the Chancellor took risks too"), T("姜维点头：『空城那一回。』他没再说话。", "Jiang Wei nods. 'The empty city.' He says no more."), [rel("jiangwei", "trust", 1)], match=r"会|冒险|空城|yes|risk|empty city", mood="neutral"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("姜维没有再问。", "Jiang Wei doesn't ask again."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
  "c8_zhonghui": {"who": "jiangwei", "fallback": "dodge",
    "q": T("乱起之前，姜维问你：『我降了钟会，又要反钟会。你说，丞相在天上看着，会不会怪我？』", "Before the chaos breaks, Jiang Wei asks you, 'I surrendered to Zhong Hui, and now I mean to turn on him. Tell me—watching from Heaven, would the Chancellor blame me?'"),
    "answers": [
      ans("no", T("说不会，丞相知道你的心", "says no—the Chancellor knows his heart"), T("姜维的眼眶红了：『那就好。』", "Jiang Wei's eyes redden. 'Then that's enough.'"), [rel("jiangwei", "warmth", 2), rel("jiangwei", "trust", 1)], match=r"不会|知道|明白|你的心|no|he knows|understand", mood="warm"),
      ans("stop", T("劝他收手", "urges him to stop"), T("姜维摇头：『收不了手了。』", "Jiang Wei shakes his head. 'It's too late to stop.'"), [rel("jiangwei", "esteem", 1)], match=r"收手|算了|别|停|stop|don't|let it go", mood="sad"),
      ans("with", T("说你陪着他", "says you'll stand with him"), T("姜维握住你的手，没说话。", "Jiang Wei grips your hand and says nothing."), [rel("jiangwei", "trust", 2)], match=r"陪|跟着|一起|我在|with you|beside you|together", mood="warm"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("姜维笑了笑，没有再问。", "Jiang Wei smiles faintly and doesn't ask again."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
}
ASK_ORDER = {"c1_weiyan": ["yes", "no", "stop", "dodge"], "c3_duangu": ["yes", "no", "you", "dodge"], "c8_zhonghui": ["no", "stop", "with", "dodge"]}

V8_TAGS = {
    ("x_return8", "back"): ["yi"],
    ("c1_weiyan", "letter"): ["ren", "yong"], ("c1_weiyan", "letter_2"): ["ren", "yong"], ("c1_weiyan", "family"): ["ren"], ("c1_weiyan", "yangyi"): ["li"],
    ("c1_return", "court"): ["cheng"], ("c1_return", "jiang"): ["yi"],
    ("c2_xiahouba", "go"): ["yong"], ("c2_xiahouba", "farm"): ["zhi", "ren"], ("c2_xiahouba", "wait"): ["cheng"],
    ("c2_heir", "jiang"): ["yi"], ("c2_heir", "court"): ["cheng"],
    ("c3_duangu", "huji"): ["yong", "yi"], ("c3_duangu", "wait"): ["zhi"], ("c3_duangu", "with"): ["yong"],
    ("c3_healer", "work"): ["ren"],
    ("c4_huanghao", "face"): ["cheng", "yong"], ("c4_huanghao", "tazhong"): ["zhi"], ("c4_huanghao", "ally"): ["li"],
    ("c5_jiange", "memo"): ["zhi", "cheng"], ("c5_jiange", "guard"): ["yong"],
    ("c5_yinping", "fight"): ["yong"], ("c5_yinping", "fight_2"): ["yong"], ("c5_yinping", "warn"): ["zhi"],
    ("c6_mianzhu", "pass"): ["zhi"], ("c6_mianzhu", "fight"): ["yong", "yi"], ("c6_mianzhu", "people"): ["ren"],
    ("c7_beidi", "liuchen"): ["yi"], ("c7_beidi", "people"): ["ren", "zhi"], ("c7_temple", "kids"): ["ren"],
    ("c7_jw_letter", "go"): ["yi", "yong"], ("c7_jw_letter", "warn"): ["cheng"],
    ("c8_zhonghui", "warn"): ["zhi", "yi"], ("c8_zhonghui", "warn_2"): ["zhi", "yi"], ("c8_zhonghui", "family"): ["ren"], ("c8_zhonghui", "men"): ["ren"],
}
values.apply(N, CHARS, V8_TAGS)
byid = {n["id"]: n for n in N}
for nid, a in ASKS.items():
    a["answers"].sort(key=lambda x: ASK_ORDER[nid].index(x["id"]))
    byid[nid]["ask"] = a

CAST = {
    "x_return8": cast_("jiangwei"), "x_cold8": cast_("jiangwei"), "x_uncanny8": [], "x_loose8": cast_("jiangwei"),
    "c1_weiyan": cast_("weiyan", "jiangwei"), "c1_return": [], "c1_wz8": cast_("wenzhi"),
    "c2_xiahouba": cast_("jiangwei"), "c2_simayi": [], "c2_wz_last": cast_("wenzhi"), "c2_wz_letter8": [], "c2_heir": [],
    "c3_fan_pass": cast_("jiangwei"), "c3_duangu": cast_("jiangwei"), "c3_jiangwei": cast_("jiangwei"), "c3_healer": [], "c3_xiahouba": [],
    "c4_huanghao": cast_("jiangwei"), "c4_houzhu": [],
    "c5_jiange": cast_("jiangwei"), "c5_yinping": [],
    "c6_mianzhu": [],
    "c7_beidi": [], "c7_temple": [], "c7_jw_letter": [],
    "c8_zhonghui": cast_("jiangwei"), "c8_lebu": [], "c8_end": [],
}
def lay(id, when=None, choice=None):
    d = {"id": id}
    if when: d["when"] = when
    if choice: d["choice"] = choice
    return d
# (墨画场景, 图层, 地点, 插画)
ART = {
    "x_return8": ("road", [], None, "v8_hearse"), "x_cold8": ("lamp", [], None, "g_cold"), "x_uncanny8": ("lamp", [], None, "g_uncanny"),
    "x_loose8": ("letter", [], None, "g_cold"),
    "c1_weiyan": ("camp", [], "nangu", "v8_weiyan"), "c1_return": ("citywall", [], "chengdu", "v8_return"), "c1_wz8": ("citywall", [], "chengdu", "v8_gate"),
    "c2_xiahouba": ("lamp", [], "chengdu", "v8_oldman"), "c2_simayi": ("letter", [], "chengdu", "v8_simayi_letter"),
    "c2_wz_last": ("lamp", [], "chengdu", "v8_wz_last"), "c2_wz_letter8": ("letter", [], "chengdu", "v4_wz_letter"), "c2_heir": ("lamp", [], "chengdu", "v8_heir"),
    "c3_fan_pass": ("road", [], "hanzhong", "v8_fan"), "c3_duangu": ("hill", [], "duangu", "v8_duangu"), "c3_jiangwei": ("lamp", [], "hanzhong", "v8_jiangwei_night"),
    "c3_healer": ("herbs", [], "hanzhong", "v8_healer"), "c3_xiahouba": ("campfire", [], "hanzhong", "v8_jiangwei_night"),
    "c4_huanghao": ("hall", [], "chengdu", "v8_huanghao"), "c4_houzhu": ("hall", [], "chengdu", "v7_houzhu"),
    "c5_jiange": ("citywall", [], "jiange", "v8_jiange"), "c5_yinping": ("hill", [], "yinping", "v8_yinping"),
    "c6_mianzhu": ("fire", [lay("burning")], "mianzhu", "v8_mianzhu"),
    "c7_beidi": ("hall", [], "chengdu", "v8_beidi"), "c7_temple": ("lamp", [], "chengdu", "v8_temple"), "c7_jw_letter": ("letter", [], "chengdu", "v3_letter"),
    "c8_zhonghui": ("fire", [lay("burning")], "chengdu", "v8_zhonghui"), "c8_lebu": ("hall", [], "luoyang", "v8_lebu"), "c8_end": ("road", [], "chengdu", "v8_end"),
}
for n in N:
    sc, ls, place, illus = ART[n["id"]]
    n["art"] = {"scene": sc, "layers": ls}
    if illus: n["art"]["illus"] = illus
    if place: n["place"] = place
    n["cast"] = CAST[n["id"]]
PLACE_AFTER = {("x_return8", "back"): "nangu", ("c1_weiyan", "*"): "chengdu", ("c1_return", "jiang"): "hanzhong",
               ("c2_heir", "*"): "chengdu", ("c3_duangu", "*"): "hanzhong", ("c4_huanghao", "face"): "hanzhong", ("c4_huanghao", "tazhong"): "tazhong",
               ("c5_jiange", "memo"): "chengdu", ("c5_jiange", "guard"): "yinping", ("c5_yinping", "*"): "mianzhu", ("c6_mianzhu", "*"): "chengdu",
               ("c8_lebu", "*"): "luoyang"}
for n in N:
    for c in n["choices"]:
        pa = PLACE_AFTER.get((n["id"], c["id"])) or PLACE_AFTER.get((n["id"], c["id"].removesuffix("_2"))) or PLACE_AFTER.get((n["id"], "*"))
        if pa and pa != n.get("place"): c["place"] = pa

import moves_v8
CAMP_MOVES = moves_v8.extend(N, VARS)

PLACES = {k: V7["places"][k] for k in ("chengdu", "hanzhong", "qishan", "tianshui")}
PLACES.update({
    "nangu": {"x": 360, "y": 80, "rx": 366, "ry": 360, "zh": "南谷口", "en": "South Valley Mouth"},
    "duangu": {"x": 265, "y": 22, "rx": 330, "ry": 326, "zh": "段谷", "en": "Duan Valley"},
    "tazhong": {"x": 215, "y": 60, "rx": 302, "ry": 345, "zh": "沓中", "en": "Tazhong"},
    "jiange": {"x": 235, "y": 140, "rx": 315, "ry": 395, "zh": "剑阁", "en": "Jiange"},
    "yinping": {"x": 175, "y": 100, "rx": 290, "ry": 368, "zh": "阴平", "en": "Yinping"},
    "mianzhu": {"x": 125, "y": 255, "rx": 256, "ry": 466, "zh": "绵竹", "en": "Mianzhu"},
    "luoyang": {"x": 690, "y": 40, "rx": 565, "ry": 362, "zh": "洛阳", "en": "Luoyang"},
})
RIVERS = V7["rivers"]

FUTURE = [(T("段谷", "Duan Valley"), "c3"), (T("沓中", "Tazhong"), "c4"), (T("阴平", "Yinping"), "c5"), (T("邓艾", "Deng Ai"), "c3"),
          (T("钟会", "Zhong Hui"), "c5"), (T("绵竹", "Mianzhu"), "c6"), (T("乐不思蜀", "too happy to miss Shu"), "c8"), (T("归晋", "the realm passes to Jin"), "c8")]

def frag(id, text, when=None, mood=None):
    d = {"id": id, "text": text}
    if when: d["when"] = when
    if mood: d["mood"] = mood
    return d
ENDINGS = [
    {"id": "g_side", "title": T("去处", "Where You Ended Up"), "fragments": [
        frag("hermit", T("你没有去追灵车。蜀亡的消息，是从集市上听来的。", "You never went after the hearse. You heard Shu had fallen in the market."), F("flag.v8_hermit")),
        frag("exposed", T("你在一个雨夜出了城。成都少了一个能知后事的人。", "You left the city one rainy night. Chengdu had one less person who could tell what was to come."), F("flag.v8_exposed")),
        frag("left", T("你离开了。姜维死的那天，你在路上。", "You left. The day Jiang Wei died, you were on the road."), F("flag.v8_left")),
        frag("luoyang", T("你陪安乐公在洛阳住了很多年。他到死，都没再说过一句想蜀。", "You lived many years in Luoyang beside the Duke of Anle. To the day he died, he never once said he missed Shu."), F("flag.v8_luoyang")),
        frag("stay", T("你留在了成都。城还是那座城，只是换了旗。", "You stayed in Chengdu. The city is the same city; only the banners have changed."), STAYING)]},
    {"id": "g_ziheng", "title": T("子衡", "Ziheng"), "fragments": [
        frag("wed", T("子衡和温芷葬在一起，坟边种了一棵梅。", "Ziheng and Wen Zhi are buried together, with a plum tree planted by the grave."), ALL(WED, F("flag.v8_ziheng_gone")), "romance"),
        frag("fan", T("丞相的白羽扇，从子衡手里，传到了你手里。", "The Chancellor's white feather fan passed from Ziheng's hands into yours."), F("flag.v8_fan_heir")),
        frag("jiang", T("子衡临终前说：去跟着姜维。你去了，一直跟到最后。", "On his deathbed Ziheng said: go and follow Jiang Wei. You went, and followed him to the end."), F("flag.v8_heir_jiang")),
        frag("plain", T("子衡死在延熙年间。史书里没有他的传。", "Ziheng died in the Yanxi years. The histories give him no biography."), F("flag.v8_ziheng_gone"))]},
    {"id": "g_weiyan", "title": T("魏延", "Wei Yan"), "fragments": [
        frag("alive", T("魏延没有死在南谷口。他在汉中种了二十年地，蜀亡那年，听说他朝着成都哭了一场。", "Wei Yan didn't die at the south valley mouth. He farmed in Hanzhong for twenty years; the year Shu fell, they say he wept toward Chengdu."), F("flag.weiyan_alive"), "warm"),
        frag("family", T("魏延死了，可他的家小活了下来。", "Wei Yan died, but his family lived."), F("flag.v8_weiyan_family")),
        frag("read", T("魏延死前，读到了丞相留给他的信。", "Before he died, Wei Yan read the letter the Chancellor left him."), F("flag.v8_weiyan_read")),
        frag("canon", T("马岱一刀，斩了魏延。", "One stroke of Ma Dai's blade, and Wei Yan was dead."), None, "sad")]},
    {"id": "g_jiangwei", "title": T("姜维", "Jiang Wei"), "mode": "all", "fragments": [
        frag("nearly", T("那一夜，姜维的计只差一步就成了。你把这件事记了一辈子。", "That night Jiang Wei's plan came within one step of success. You remembered it all your life."), F("flag.v8_nearly_zhong")),
        frag("family", T("姜维的家人，在城外山里活了下来。", "Jiang Wei's family lived on in the hills outside the city."), F("flag.v8_jw_family")),
        frag("men", T("姜维的旧部，那一夜一个也没少。", "Of Jiang Wei's old soldiers, not one was lost that night."), F("flag.v8_jw_men")),
        frag("end", T("姜维死的时候，你在他身边。他说：替我活着。", "When Jiang Wei died, you were beside him. He said: live, for me."), F("flag.v8_jw_end"), "sad"),
        frag("canon", T("姜维死在成都的乱兵里。丞相交给他的担子，他一直扛到了最后。", "Jiang Wei died among the mutineers in Chengdu. The load the Chancellor gave him, he carried to the very end."), None, "sad")]},
    {"id": "g_shu", "title": T("蜀亡的代价", "What the Fall Cost"), "mode": "all", "fragments": [
        frag("yinping", T("阴平那一天，你差一点就守住了。", "That day at Yinping, you very nearly held."), F("flag.v8_nearly")),
        frag("pass", T("绵竹的险要，你们抢在了邓艾前面，拦了他好几天。", "At Mianzhu you took the passes ahead of Deng Ai and held him for days."), ALL(F("flag.v8_mz_pass"), F("flag.v8_yp_warned"))),
        frag("duangu", T("段谷之败，因为你跑死的两匹马，多回来了几千人。", "At the Duan Valley defeat, because of the two horses you rode to death, several thousand more came home."), F("flag.v8_duangu_saved")),
        frag("mianzhu", T("绵竹的伤兵百姓，你带回了成都。", "Mianzhu's wounded and townsfolk you brought back to Chengdu."), F("flag.v8_mz_people")),
        frag("chengdu", T("魏兵进成都那年，没烧一间房。", "The year the Wei army entered Chengdu, not one house was burned."), F("flag.v8_cd_people")),
        frag("kids", T("北地王的孩子，在山里长大了。", "The Prince of Beidi's children grew up in the hills."), F("flag.v8_beidi_kids"))]},
    {"id": "g_heir", "title": T("接班的人", "The One Who Carried On"), "fragments": [
        frag("healer", T("伤兵营里的人管你叫“小温先生”。你一辈子没做大官，救的人比杀的人多。", "In the wounded camps they called you Little Master Wen. You never held high office, and you saved more lives than you took."), F("flag.v8_healer")),
        frag("book", T("你把那些本子整理成了一本书，没有书名，也没有作者。", "You made the notebooks into a book, with no title and no author."), F("flag.v8_book")),
        frag("court", T("你在朝里，做了那个说真话的人。", "At court, you were the one who told the truth."), F("flag.v8_hh_faced")),
        frag("child", T("你是子衡和温芷的孩子。你走的路，是你自己选的。", "You were the child of Ziheng and Wen Zhi. The road you walked, you chose."), HC),
        frag("student", T("你是子衡的学生。先生说过的话，你一句也没忘。", "You were Ziheng's student. Not one word your teacher said did you forget."), HS)]},
    {"id": "g_name", "title": T("名声", "Your Name"), "fragments": [
        frag("simayi", T("司马懿临死前，烧了子衡的回信。", "Before he died, Sima Yi burned Ziheng's reply."), F("flag.v8_simayi_letter")),
        frag("uncanny", T("成都城里传说，子衡家里的人能知后事。", "In Chengdu they said someone in Ziheng's house could tell what was to come."), V("uncanny", ">=", 5)),
        frag("loyal", T("人说子衡一家，两代重义。", "People say Ziheng's house kept faith for two generations."), V("renown.loyal", ">", "@renown.cunning")),
        frag("cunning", T("人说子衡一家，会做人。", "People say Ziheng's house knew how to get along."), V("renown.cunning", ">=", "@renown.loyal")),
        frag("none", T("史书里没有你们的传，只有几处『或曰』。", "The histories give your house no biography—just a few lines beginning 'some say.'"))]},
    {"id": "g_history", "title": T("天下", "The Realm"), "fragments": [
        frag("far", T("说书人讲到三国，有好些地方讲不顺——那些地方，都是你们。", "When storytellers tell of the Three Kingdoms, many places never quite fit. Those places are your house."), V("deviation", ">=", 15)),
        frag("plain", T("话说天下大势，分久必合。三分归晋。", "As they say, the realm long divided must unite. The three kingdoms passed to Jin."))]},
]
FRAG_FACE = {"g_weiyan": {"alive": ("weiyan", "warm"), "read": ("weiyan", "sad"), "canon": ("weiyan", "sad")},
             "g_jiangwei": {"nearly": ("jiangwei", "sad"), "end": ("jiangwei", "sad"), "canon": ("jiangwei", "sad")},
             "g_ziheng": {"wed": ("wenzhi", "warm")}}
ENDING_ART = {"scene": "ending", "layers": [{"id": "city", "when": STAYING}, {"id": "home", "when": ANY(HC, WED)},
                                            {"id": "lone", "when": ANY(F("flag.v8_hermit"), F("flag.v8_left"), F("flag.v8_exposed"))}]}

REALM = json.loads(json.dumps(V7["realm"]))
REALM["factions"]["jin"] = {"name": T("司马氏（晋）", "the Simas (Jin)"), "color": "#5d5a7a"}
base = dict(REALM["control"]["c8"])
REALM["control"] = {f"c{i}": dict(base) for i in range(1, 9)}
for c in ("c7",):
    REALM["control"][c] = {k: ("cao" if v == "liubei" else v) for k, v in base.items()}
REALM["control"]["c8"] = {k: "jin" for k in base}
REALM["captions"] = {"c1": T("建兴十二年：丞相灵柩回成都，魏延被斩", "234: the Chancellor's coffin returns; Wei Yan is cut down"),
                     "c2": T("延熙十二年：司马懿夺魏权，夏侯霸来降", "249: Sima Yi seizes power in Wei; Xiahou Ba comes over"),
                     "c3": T("姜维九伐中原，段谷之败", "Jiang Wei's northern campaigns; defeat at Duan Valley"),
                     "c4": T("黄皓弄权，姜维沓中屯田", "Huang Hao in power; Jiang Wei farms at Tazhong"),
                     "c5": T("钟会、邓艾伐蜀；姜维守剑阁", "Zhong Hui and Deng Ai invade; Jiang Wei holds Jiange"),
                     "c6": T("邓艾偷渡阴平，绵竹失守", "Deng Ai slips through Yinping; Mianzhu falls"),
                     "c7": T("炎兴元年：后主出降，蜀亡", "263: the last emperor surrenders; Shu falls"),
                     "c8": T("太康元年：吴亡，三分归晋", "280: Wu falls; the three kingdoms pass to Jin")}

# ------------------------------------------------------------------ 这一生（全书尾声页）
# 每一卷列几件“你改了的事”。页面沿着存档的“接着玩下一卷”一路往回找每一卷那一局，用那一局结束时的状态判断；
# 没有亲身玩过的卷（从前情开始），就用现在这一局里还带着的变量判断，判断不了的标成“从前情开始”。
# saved：这一条算“你救下的人”，汇总在页首。
def L(text, when, saved=None):
    d = {"text": text, "when": when}
    if saved: d["saved"] = saved
    return d
LIFE = {
    "title": T("这一生", "A Life"),
    "sub": T("从许都到归晋，八卷里，你改了这些事。", "From Xuchang to the end of the Three Kingdoms—eight volumes, and these are the things you changed."),
    "saved_title": T("你救下的人", "The people you saved"),
    "none_saved": T("你没能把谁从书里救下来。可你在场。", "You couldn't save anyone from the book. But you were there."),
    "not_played": T("这一卷你是从前情开始的，没有亲身走过。", "You began this volume from a backstory and didn't walk it yourself."),
    "from_preset": T("这一卷是从前情开始的，上面这几条记在前情里。", "You began this volume from a backstory; these lines come from it."),
    "nothing": T("这一卷，你照着原著走了过去。", "This volume, you walked as the book was written."),
    "deviation": T("偏离原著", "Departure from the novel"),
    "vols": [
        {"vol": "sanguo_strategist_v1", "title": T("卷一 · 许都至赤壁", "Volume I · Xuchang to Red Cliffs"), "items": [
            L(T("长坂坡，你救下了糜夫人。", "At Changban you saved Lady Mi."), F("flag.mi_saved"), T("糜夫人", "Lady Mi")),
            L(T("徐庶留了下来。", "Xu Shu stayed."), F("flag.xushu_stayed")),
            L(T("庞统早早就投了刘备。", "Pang Tong came over to Liu Bei early."), F("flag.pangtong_joined")),
            L(T("过五关时，孔秀没有死。", "At the five passes, Kong Xiu didn't die."), F("flag.kongxiu_spared"), T("孔秀", "Kong Xiu")),
            L(T("赤壁那一夜，你把温芷接了回来。", "On the night of Red Cliffs, you brought Wen Zhi back."), F("flag.wenzhi_with_you")),
            L(T("江边，你对温芷说出了心意。", "By the river, you told Wen Zhi how you felt."), ANY(F("flag.confessed"), F("flag.wenzhi_together"))),
            L(T("你在曹营做过官。", "You held office in Cao Cao's camp."), F("flag.took_cao_post"))]},
        {"vol": "sanguo_strategist_v2", "title": T("卷二 · 荆州与西川", "Volume II · Jingzhou and the West"), "items": [
            L(T("周瑜没有死在巴丘。", "Zhou Yu didn't die at Baqiu."), F("flag.zhouyu_lives"), T("周瑜", "Zhou Yu")),
            L(T("庞统没有死在落凤坡。", "Pang Tong didn't die at Fallen Phoenix Slope."), F("flag.pt_alive"), T("庞统", "Pang Tong")),
            L(T("孙夫人体面地走了。", "Lady Sun left with her dignity."), F("flag.sun_parted")),
            L(T("温芷随你入了川。", "Wen Zhi came west with you."), F("flag.wz_west"))]},
        {"vol": "sanguo_strategist_v3", "title": T("卷三 · 汉中", "Volume III · Hanzhong"), "items": [
            L(T("单刀赴会，你在关羽身边。", "At the meeting with a single sword, you were at Guan Yu's side."), F("flag.dd_guard")),
            L(T("定军山，你随黄忠冲了下去。", "At Mount Dingjun you charged down with Huang Zhong."), F("flag.dj_charge")),
            L(T("你替糜芳在关羽面前说过话。", "You spoke up for Mi Fang before Guan Yu."), F("flag.mf_mended")),
            L(T("你早就劝主公派兵接应荆州。", "You urged your lord early on to send help to Jingzhou."), F("flag.warned_jing"))]},
        {"vol": "sanguo_strategist_v4", "title": T("卷四 · 荆州之殇", "Volume IV · The Fall of Jingzhou"), "items": [
            L(T("关羽活着退回了西川。", "Guan Yu made it back to the west alive."), F("flag.guan_alive"), T("关羽", "Guan Yu")),
            L(T("放水之前，你让下游的百姓先撤了。", "Before the flood, you had the people downstream evacuated."), F("flag.flood_people")),
            L(T("你劝关羽留了庞德一命。", "You urged Guan Yu to spare Pang De."), F("flag.pd_spare")),
            L(T("温芷跟着华佗走了。", "Wen Zhi went with Hua Tuo."), F("flag.wz_huatuo"))]},
        {"vol": "sanguo_strategist_v5", "title": T("卷五 · 夷陵与白帝", "Volume V · Yiling and Baidi"), "items": [
            L(T("东征，你差一点就劝住了。", "You very nearly talked them out of the eastern war."), F("flag.v5_nearly")),
            L(T("张飞没有死在阆中。", "Zhang Fei didn't die at Langzhong."), F("flag.fei_alive"), T("张飞", "Zhang Fei")),
            L(T("刘封没有死。", "Liu Feng didn't die."), F("flag.liufeng_spared"), T("刘封", "Liu Feng")),
            L(T("营间留了防火的空地。", "Firebreaks were left between the camps."), F("flag.v5_firebreak")),
            L(T("白帝城，先帝把托孤的手放在你手上。", "At Baidi, the late emperor laid his last charge in your hands."), F("flag.v5_entrusted")),
            L(T("你和温芷说定了成亲。", "You and Wen Zhi agreed to marry."), F("flag.wz_wed"))]},
        {"vol": "sanguo_strategist_v6", "title": T("卷六 · 南中", "Volume VI · The South"), "items": [
            L(T("泸水夜渡，少死了很多人。", "The night crossing of the Lu cost far fewer lives."), F("flag.v6_lushui")),
            L(T("温芷认出了哑泉的解药。", "Wen Zhi knew the cure for the Mute Spring."), F("flag.v6_cure")),
            L(T("盘蛇谷，你劝丞相留了一条出路。", "At Coiled Snake Valley, you urged the Chancellor to leave a way out."), F("flag.v6_mercy")),
            L(T("你把先帝说马谡的话，告诉了丞相。", "You told the Chancellor what the late emperor said of Ma Su."), F("flag.v6_masu_doubt"))]},
        {"vol": "sanguo_strategist_v7", "title": T("卷七 · 出师", "Volume VII · The Northern Campaigns"), "items": [
            L(T("马谡没有被斩。", "Ma Su was not executed."), F("flag.masu_alive"), T("马谡", "Ma Su")),
            L(T("街亭的路口，你和王平守住了。", "You and Wang Ping held the road at Jieting."), F("flag.v7_jt_wangping")),
            L(T("空城那天，你站在丞相身边。", "On the day of the empty city, you stood beside the Chancellor."), F("flag.v7_wall")),
            L(T("丞相把白羽扇留给了你。", "The Chancellor left you his white feather fan."), F("flag.v7_fan")),
            L(T("你和温芷有了孩子。", "You and Wen Zhi had a child."), F("flag.v7_child"))]},
        {"vol": "sanguo_strategist_v8", "title": T("卷八 · 归晋", "Volume VIII · The Realm Made One"), "items": [
            L(T("魏延没有死在南谷口。", "Wei Yan didn't die at the south valley mouth."), F("flag.weiyan_alive"), T("魏延", "Wei Yan")),
            L(T("阴平，你差一点守住了。", "At Yinping, you very nearly held."), F("flag.v8_nearly")),
            L(T("绵竹的伤兵百姓，你带回了成都。", "You brought Mianzhu's wounded and townsfolk back to Chengdu."), F("flag.v8_mz_people")),
            L(T("北地王的孩子活了下来。", "The Prince of Beidi's children lived."), F("flag.v8_beidi_kids"), T("北地王的孩子", "the Prince of Beidi's children")),
            L(T("姜维的家人活了下来。", "Jiang Wei's family lived."), F("flag.v8_jw_family"), T("姜维的家人", "Jiang Wei's family")),
            L(T("姜维的计，差一点就成了。", "Jiang Wei's plan very nearly worked."), F("flag.v8_nearly_zhong"))]},
    ],
}
# 写错 flag 名字时，这里直接报错（页面上只会静悄悄地少一条）
_VOL_FILES = {"sanguo_strategist_v1": "campaign.json", **{f"sanguo_strategist_v{i}": f"v{i}/campaign_v{i}.json" for i in range(2, 8)}}
def _vars_in(c):
    if "v" in c: yield c["v"]
    for k in ("all", "any"):
        for x in c.get(k, []): yield from _vars_in(x)
for vol in LIFE["vols"]:
    known = set(VARS) if vol["vol"] == "sanguo_strategist_v8" else set(json.loads((HERE.parent / _VOL_FILES[vol["vol"]]).read_text())["vars"])
    for it in vol["items"]:
        for v in _vars_in(it["when"]): assert v in known, (vol["vol"], v)

COMMIT_RULES = speech.commit_rules()
PRESETS = json.loads((HERE / "presets.json").read_text()) if (HERE / "presets.json").exists() else []

CAMPAIGN = {
    "spec": SPEC, "tiers": TIERS(), "pack": PACK("history-strategy"),
    "resources": {"reputation": ["renown.loyal", "renown.cunning"], "risk": ["uncanny", "renown.rash"], "drift": ["deviation"]},
    "carry_compress": {"pivot": 4, "k": 0.5},
    "id": "sanguo_strategist_v8", "prev": "sanguo_strategist_v7",
    "title": T("三国·谋士", "Three Kingdoms: The Strategist"), "volume": T("卷八 · 归晋", "Volume VIII · The Realm Made One"),
    "rights": {"source": "《三国演义》（罗贯中，明代），公版", "quotes": "中文原文直接引用；英文为本项目自译", "original_characters": ["子衡（玩家）", "温芷", "承之（子衡和温芷的孩子）", "守言（子衡的学生）"]},
    "player": {"name": T("子衡", "Ziheng")}, "side_prompt": SIDE_PROMPT,
    "vars": VARS, "chars": CHARS, "dims": DIMS, "echoes": ECHOES, "debts": {},
    "chapters": CHAPTERS, "nodes": {n["id"]: n for n in N}, "endings": ENDINGS, "moves": CAMP_MOVES,
    "future_terms": [{"term": t, "from": c} for t, c in FUTURE],
    "ending_art": ENDING_ART, "art_prompts": dict(V7["art_prompts"]), "frag_face": FRAG_FACE, "portrait_prompts": dict(V7["portrait_prompts"]), "cg_captions": V7["cg_captions"], "realm": REALM,
    "react_patterns": V7["react_patterns"], "value_tags": values.TAGS, "commit_rules": COMMIT_RULES,
    "witness": [{"who": "jiangwei", "to": "weiyan", "labels": ["rude", "threat"], "effects": [rel("jiangwei", "trust", -1)]}],
    "places": PLACES, "rivers": RIVERS,
    "meters": {"uncanny": T("到 8：被当作妖人", "At 8: branded a sorcerer"), "rash": T("到 6：有人会把你的话报上去", "At 6: someone reports what you've said")},
    "presets": PRESETS, "life": LIFE,
    "sources": [{"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2010/02/27/a393740.html", "checked": "2026-10-28", "note": "第105回（谁敢杀我、吾敢杀你）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2010/04/01/a398559.html", "checked": "2026-10-28", "note": "第117回（以毡自裹、诸葛瞻“吾力竭矣”）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2010/04/05/a399277.html", "checked": "2026-10-28", "note": "第118回（谯周劝降、北地王、昭烈庙、剑阁将士“何故先降”、姜维“吾有一计”）"},
                {"what": "中文引文核对底本", "url": "https://blog.sina.com.cn/s/blog_54028f030102vmdz.html", "checked": "2026-10-28", "note": "第119回毛评本录文（姜维“吾计不成，乃天命也”、此间乐不思蜀、郤正语）"},
                {"what": "中文引文核对底本", "url": "https://sanguo.5000yan.com/1084.html", "checked": "2026-10-28", "note": "第120回卷末诗末四句；与 donglishuzhai.net 繁体本互校一致"}],
    "end_note": T("全书终。谢谢你陪子衡走完这一程。", "The end of the book. Thank you for walking the whole road with Ziheng."),
}

if __name__ == "__main__":
    out = HERE / "campaign_v8.json"
    dump(CAMPAIGN, out)
    print("nodes", len(N), "->", out)
