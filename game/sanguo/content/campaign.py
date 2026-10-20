"""三国·谋士 卷一（许都—赤壁，第20–50回）campaign spec v0.3.

Player: an original young strategist, styled Ziheng (子衡). Famous scenes are nodes the
player can step into, not roles the player plays. Original-novel lines are quoted in Chinese
(public domain); English renderings are our own.
"""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib import *

ROMANCE = "romance"

# ------------------------------------------------------------------ vars
def num(init, lo, hi, label, show=True, group=None):
    d = {"type": "num", "init": init, "min": lo, "max": hi, "label": label, "show": show}
    if group: d["group"] = group
    return d
def flag(label): return {"type": "flag", "init": False, "label": label}

VARS = {
    "track": {"type": "enum", "init": "liu", "values": ["liu", "cao"], "label": T("效力", "Serving")},
    "renown.loyal": num(0, 0, 10, T("名声·忠义", "Name for loyalty"), group="renown"),
    "renown.cunning": num(0, 0, 10, T("名声·权谋", "Name for cunning"), group="renown"),
    "uncanny": num(0, 0, 10, T("异名（先见被人察觉）", "Uncanny (foresight noticed)"), group="renown"),
    "deviation": num(0, 0, 20, T("偏离原著", "Departures from the novel"), show=False),
    "flag.covered_liu": flag(T("煮酒时替刘备遮掩", "Covered for Liu Bei at the plum-wine meeting")),
    "flag.spoke_at_plum": flag(T("青梅亭上评点英雄", "Spoke up at the plum-wine meeting")),
    "flag.asked_wenzhi": flag(T("托温芷留意丞相府", "Asked Wen Zhi to keep her ears open")),
    "flag.asked_yi": flag(T("问关羽何为义", "Asked Guan Yu what righteousness is")),
    "flag.warned_guan": flag(T("提醒关羽提防厚待", "Warned Guan Yu about Cao's generosity")),
    "flag.foresaw_yidai": flag(T("预言衣带诏泄露", "Foretold the belt edict would leak")),
    "flag.fast_departure": flag(T("连夜出许都", "Left Xuchang overnight")),
    "flag.drafted_terms": flag(T("执笔土山三约", "Wrote down the three terms at Tushan")),
    "flag.carried_news": flag(T("突围为刘备报信", "Broke out to carry news to Liu Bei")),
    "flag.with_guanyu": flag(T("随关羽入许都", "Went to Xuchang with Guan Yu")),
    "flag.took_cao_post": flag(T("受曹营官职", "Accepted a post under Cao")),
    "flag.promise_wenzhi": flag(T("许诺回来接温芷", "Promised to come back for Wen Zhi")),
    "flag.pass_from_wenzhi": flag(T("温芷弄来通关文书", "Wen Zhi obtained a travel pass")),
    "flag.kongxiu_spared": flag(T("孔秀未死", "Kong Xiu survived")),
    "flag.urged_fight": flag(T("土山劝关羽死战", "Urged Guan Yu to fight on the hill")),
    "flag.knows_pangtong": flag(T("知道凤雏是庞统", "Knows the Young Phoenix is Pang Tong")),
    "flag.xushu_stayed": flag(T("徐庶留下", "Xu Shu stayed")),
    "flag.pangtong_joined": flag(T("庞统早投刘备", "Pang Tong joined Liu Bei early")),
    "flag.aside_zhuge": flag(T("冷眼看诸葛亮出山", "Watched Zhuge Liang's arrival coldly")),
    "flag.mi_saved": flag(T("救下糜夫人", "Saved Lady Mi")),
    "flag.wounded": flag(T("长坂中箭", "Wounded at Changban")),
    "flag.abandon_advice": flag(T("劝刘备弃民", "Advised Liu Bei to abandon the civilians")),
    "flag.wenzhi_warned": flag(T("提醒温芷离开水寨", "Warned Wen Zhi to leave the river camp")),
    "flag.wenzhi_used": flag(T("利用温芷打探军情", "Used Wen Zhi for intelligence")),
    "flag.wenzhi_with_you": flag(T("赤壁夜接回温芷", "Brought Wen Zhi back on the night of the fire")),
    "flag.wenzhi_safe": flag(T("给温芷送了退路", "Sent Wen Zhi a way out")),
    "flag.wenzhi_together": flag(T("与温芷说破心意", "Spoke your heart to Wen Zhi")),
    "flag.vouched_guan": flag(T("为关羽作保", "Vouched for Guan Yu")),
    "flag.at_huarong": flag(T("随关羽同去华容", "Went to Huarong with Guan Yu")),
    "flag.forged_letter": flag(T("仿写徐母书信", "Forged Xu Shu's mother's letter")),
    "flag.secret_mercy": flag(T("长坂暗放刘备家眷", "Secretly let Liu Bei's people through at Changban")),
    "flag.cao_reserve": flag(T("曹操留下二十条船", "Cao kept twenty ships unchained")),
    "flag.pleaded_guan": flag(T("在华容道求关羽", "Pleaded with Guan Yu at Huarong")),
}
CHARS = {
    "liubei": {"name": T("刘备", "Liu Bei"), "dims": {"trust": [3, 0, 10]}, "main": "trust"},
    "caocao": {"name": T("曹操", "Cao Cao"), "dims": {"regard": [0, 0, 10]}, "main": "regard"},
    "guanyu": {"name": T("关羽", "Guan Yu"), "dims": {"respect": [1, 0, 10], "owes": [0, 0, 10]}, "main": "respect"},
    "zhuge": {"name": T("诸葛亮", "Zhuge Liang"), "dims": {"respect": [0, 0, 10], "wary": [0, 0, 10]}, "from_chapter": "c5", "main": "respect"},
    "wenzhi": {"name": T("温芷", "Wen Zhi"), "dims": {"trust": [2, 0, 10], "intimacy": [1, 0, 10]}, "original": True, "main": "intimacy"},
}
DIMS = {"trust": T("信任", "Trust"), "regard": T("赏识", "Regard"), "respect": T("敬重", "Respect"),
        "owes": T("人情（他欠你）", "Owes you"), "wary": T("戒心", "Wariness"), "intimacy": T("亲近", "Closeness")}
for c, d in CHARS.items():
    for dim, (init, lo, hi) in d["dims"].items():
        VARS[f"rel.{c}.{dim}"] = {"type": "num", "init": init, "min": lo, "max": hi,
                                  "label": T(d["name"]["zh"] + "·" + DIMS[dim]["zh"], d["name"]["en"] + " · " + DIMS[dim]["en"]),
                                  "char": c, "dim": dim}
def R(c, d, op, v): return V(f"rel.{c}.{d}", op, v)
def DEBT(i, state="open"): return V(f"debt.{i}", "==", state)

# ------------------------------------------------------------------ echoes & debts
ECHOES = {
    "e_cover": T("煮酒时你替刘备打翻酒樽", "You knocked over your cup to cover for Liu Bei"),
    "e_spoke": T("青梅亭上曹操记住了你", "Cao Cao noticed you at the plum-wine meeting"),
    "e_yi": T("你问关羽何为义", "You asked Guan Yu what righteousness is"),
    "e_warn_gifts": T("你提醒关羽提防曹操的厚待", "You warned Guan Yu about Cao's gifts"),
    "e_wenzhi_spy": T("你托温芷留意丞相府", "You asked Wen Zhi to listen for you"),
    "e_foresaw": T("你预言衣带诏会泄露", "You foretold the edict would leak"),
    "e_fast": T("你劝刘备连夜出城", "You got Liu Bei out overnight"),
    "e_terms": T("你执笔土山三约", "You wrote the three terms"),
    "e_news": T("你从下邳为刘备带出消息", "You carried news from Xiapi to Liu Bei"),
    "e_promise": T("你许诺回来接温芷", "You promised to come back for Wen Zhi"),
    "e_pass": T("温芷为你弄来通关文书", "Wen Zhi got you a travel pass"),
    "e_xushu": T("你把真相告诉了徐庶", "You told Xu Shu the truth"),
    "e_pangtong": T("你提前举荐了庞统", "You recommended Pang Tong early"),
    "e_aside": T("你冷眼看诸葛亮出山", "You watched Zhuge Liang's arrival coldly"),
    "e_mi": T("你在长坂救下糜夫人", "You saved Lady Mi at Changban"),
    "e_abandon": T("你在长坂劝刘备弃民", "You told Liu Bei to abandon the civilians"),
    "e_warned": T("你提醒温芷离开水寨", "You warned Wen Zhi off the river camp"),
    "e_forged": T("你替程昱仿写了徐母的信", "You forged the letter for Cheng Yu"),
    "e_mercy": T("你在长坂暗中放走刘备的家眷", "You secretly let Liu Bei's people through"),
    "e_reserve": T("你让曹操留下二十条船", "You got Cao to keep twenty ships free"),
    "e_fight": T("你在土山劝关羽死战", "You urged Guan Yu to fight to the death on the hill"),
    "e_post": T("你接下了曹操给的官职", "You accepted a post from Cao"),
    "e_stay": T("你留在了曹营", "You stayed with Cao"),
    "e_angelica": T("你对温芷说破了心意", "You told Wen Zhi how you feel"),
    "e_used": T("你利用了温芷的信", "You used Wen Zhi's letters"),
    "e_row": T("你在赤壁之夜接回了温芷", "You brought Wen Zhi back on the night of the fire"),
}
DEBTS = {
    "d_five_passes": {"title": T("通关文书", "The travel pass"), "lock": "functional",
                      "broken": T("有了文书，“过五关斩六将”失去了起因。", "With a pass, the 'five passes, six generals' episode loses its cause."),
                      "function": T("关羽千里寻兄、一路过关的忠义之名", "Guan Yu's legend of crossing a thousand li for his brother")},
    "d_recommend": {"title": T("走马荐诸葛", "The parting recommendation"), "lock": "literal",
                    "broken": T("徐庶没走，就没有人在城外回马举荐诸葛亮。", "Xu Shu stayed, so no one turns back at the gate to recommend Zhuge Liang."),
                    "function": T("诸葛亮出山", "Zhuge Liang joins Liu Bei")},
    "d_lianhuan": {"title": T("连环计", "The chain plan"), "lock": "literal",
                   "broken": T("庞统已在刘备帐下，没人去曹营献连环计。", "Pang Tong already serves Liu Bei, so no one offers Cao the chain plan."),
                   "function": T("曹军战船连锁，火攻得以成立", "Cao's ships are chained, so the fire attack can work")},
    "d_mi": {"title": T("糜夫人", "Lady Mi"), "lock": "literal",
             "broken": T("糜夫人获救，赵云单骑救主少了悲壮的前因。", "With Lady Mi saved, Zhao Yun's lone ride loses its tragic cause."),
             "function": T("赵云单骑救出阿斗", "Zhao Yun rides out alone with the infant heir")},
}

# ------------------------------------------------------------------ chapters
SIDE_PROMPT = T("这段日子，你只来得及做一件事。", "These days you only have time for one thing.")
CHAPTERS = [
    {"id": "c1", "title": T("许都", "Xuchang"), "year": T("建安四年（199）", "Jian'an 4 (199)"), "canon": T("第20–21回", "Ch. 20–21"), "offer": 3,
     "intro": [P(T("建安四年，许都。刘备寄身曹操门下，每天在后园种菜。你是颍川来的年轻书生，字子衡，经糜竺引荐，做了刘备的门客。府里人都说你话少，记性好。",
                   "Xuchang, Jian'an 4 (199). Liu Bei lives under Cao Cao's eye and spends his days growing vegetables in the back garden. You are a young scholar from Yingchuan, styled Ziheng. Mi Zhu introduced you, and Liu Bei took you in as a retainer. The household says you talk little and forget nothing."))]},
    {"id": "c2", "title": T("出许都", "Leaving Xuchang"), "year": T("建安四年（199）", "Jian'an 4 (199)"), "canon": T("第21回", "Ch. 21"), "offer": 2,
     "intro": [P(T("煮酒之后，刘备坐立不安。消息传来：袁术要北上投奔袁绍，必经徐州。",
                   "After the plum-wine meeting Liu Bei cannot sit still. News arrives: Yuan Shu means to go north to join Yuan Shao, and his road runs through Xuzhou."))]},
    {"id": "c3", "title": T("下邳", "Xiapi"), "year": T("建安五年（200）", "Jian'an 5 (200)"), "canon": T("第24–25回", "Ch. 24–25"), "offer": 2,
     "intro": [P(T("建安五年正月，衣带诏事泄，董承等五家满门被杀。曹操亲率大军东征徐州。刘备兵败，单骑北投袁绍；张飞不知去向。关羽护着两位嫂嫂，被困在下邳城外的土山上。你也在山上。",
                   "First month of Jian'an 5 (200). The belt edict is discovered, and Dong Cheng and four other families are put to death. Cao Cao marches on Xuzhou himself. Liu Bei is routed and flees north alone to Yuan Shao; no one knows where Zhang Fei is. Guan Yu, guarding Liu Bei's two wives, is cut off on a hill outside Xiapi. You are on the hill with him."))]},
    {"id": "c4", "title": T("千里", "A Thousand Li"), "year": T("建安五年（200）", "Jian'an 5 (200)"), "canon": T("第25–28回", "Ch. 25–28"), "offer": 2,
     "intro": [P(T("许都。曹操待关羽极厚：三日一小宴，五日一大宴，送金银，送美女，送锦袍。你住在关羽府里，曹操也记得你。",
                   "Xuchang. Cao Cao treats Guan Yu lavishly: a small banquet every three days, a grand one every five, gold, silver, beautiful women, a brocade robe. You live in Guan Yu's house, and Cao Cao knows who you are."), F("flag.with_guanyu")),
               P(T("冀州，袁绍营中。刘备寄人篱下，天天打听二弟的消息。", "Jizhou, in Yuan Shao's camp. Liu Bei is a guest under another man's roof, asking every day for news of his sworn brother."), NF("flag.with_guanyu"))]},
    {"id": "c5", "title": T("新野", "Xinye"), "year": T("建安十二年（207）", "Jian'an 12 (207)"), "canon": T("第35–38回", "Ch. 35–38"), "offer": 2,
     "intro": [P(T("七年过去了。刘备寄居荆州刘表门下，屯兵新野。徐庶做了军师，打了几场漂亮仗。你还在刘备身边，鬓角多了几根白发。",
                   "Seven years pass. In Jian'an 12 (207) Liu Bei lives under Liu Biao's protection in Jingzhou, garrisoned at Xinye. Xu Shu has become his strategist and won him some fine victories. You are still at Liu Bei's side, with a few more grey hairs."), LIU),
               P(T("七年过去了。曹操平定了河北。你在丞相府做事，日子过得体面，偶尔会想起古城的方向。温芷还在许都。",
                   "Seven years pass. By Jian'an 12 (207) Cao Cao has conquered the north. You serve in the Chancellor's office and live comfortably, though you sometimes think of the road to Gucheng. Wen Zhi is still in Xuchang."), CAO)]},
    {"id": "c6", "title": T("长坂", "Changban"), "year": T("建安十三年（208）", "Jian'an 13 (208)"), "canon": T("第41–42回", "Ch. 41–42"), "offer": 2,
     "intro": [P(T("建安十三年秋，刘表病死，次子刘琮举荆州降曹。曹操五千铁骑一日一夜追三百里。刘备带着十几万百姓南逃，一天只走十几里。",
                   "Autumn, Jian'an 13 (208). Liu Biao dies, and his younger son Liu Cong surrenders Jingzhou to Cao Cao. Five thousand of Cao's armored horsemen ride three hundred li in a day and a night. Liu Bei is fleeing south with over a hundred thousand civilians, covering barely ten li a day."), LIU),
               P(T("建安十三年秋，刘琮举荆州降了。曹操亲率五千铁骑追击刘备，命你随军参谋。",
                   "Autumn, Jian'an 13 (208). Liu Cong surrenders Jingzhou. Cao Cao leads five thousand armored horsemen after Liu Bei and orders you to ride with him as an adviser."), CAO)]},
    {"id": "c7", "title": T("赤壁", "Red Cliffs"), "year": T("建安十三年冬（208）", "Winter, Jian'an 13 (208)"), "canon": T("第43–49回", "Ch. 43–49"), "offer": 2,
     "intro": [P(T("刘备退到夏口。诸葛亮过江去了东吴，说服孙权联手抗曹。曹操号称八十三万大军，战船沿江排开，旌旗蔽日。",
                   "Liu Bei retreats to Xiakou. Zhuge Liang crosses to Wu and persuades Sun Quan to join forces against Cao. Cao claims eight hundred and thirty thousand men; his warships line the river and their banners blot out the sun."), LIU),
               P(T("你肩上的箭伤还没好，提笔都疼。", "The arrow wound in your shoulder hasn't healed; even holding a brush hurts."), ALL(LIU, F("flag.wounded"))),
               P(T("赤壁。北方士兵不习水战，在船上吐得站不起来，军中开始有人生病。温芷作为医女被征召随军，在后营给病兵配药。",
                   "Red Cliffs. Northern soldiers unused to boats are too seasick to stand, and sickness spreads through the camp. Wen Zhi has been called up as an army physician and is mixing medicine for the sick in the rear camp."), CAO)]},
    {"id": "c8", "title": T("华容", "Huarong"), "year": T("建安十三年冬（208）", "Winter, Jian'an 13 (208)"), "canon": T("第49–50回", "Ch. 49–50"), "offer": 2,
     "intro": [P(T("火烧了一夜。", "The fire burns all night."))]},
]

# Terms a character may not say before the chapter in which they become known (also used to detect player foresight).
FUTURE = [
    (T("下邳", "Xiapi"), "c3"), (T("土山", "Tushan"), "c3"), (T("官渡", "Guandu"), "c4"), (T("过五关", "five passes"), "c4"), (T("千里走单骑", "rode a thousand li"), "c4"),
    (T("赤兔", "Red Hare"), "c4"), (T("诸葛亮", "Zhuge"), "c5"), (T("孔明", "Kongming"), "c5"), (T("卧龙", "Sleeping Dragon"), "c5"),
    (T("隆中", "Longzhong"), "c5"), (T("三顾", "three visits"), "c5"), (T("庞统", "Pang Tong"), "c5"), (T("凤雏", "Young Phoenix"), "c5"),
    (T("长坂", "Changban"), "c6"), (T("阿斗", "Adou"), "c6"), (T("赤壁", "Red Cliffs"), "c7"), (T("连环", "chain the ships"), "c7"),
    (T("东风", "east wind"), "c7"), (T("草船", "straw boats"), "c7"), (T("借箭", "borrow arrows"), "c7"), (T("火攻", "fire attack"), "c7"),
    (T("黄盖", "Huang Gai"), "c7"), (T("华容", "Huarong"), "c8"), (T("落凤坡", "Fallen Phoenix"), "c99"), (T("麦城", "Maicheng"), "c99"),
    (T("白帝城", "Baidi"), "c99"), (T("五丈原", "Wuzhang"), "c99"),
]

N = []
# ================================================================== C1 许都
N.append(node("c1_guanyu", "c1", "side", T("夜访关羽", "A Late Visit to Guan Yu"), "free", T("改编", "adapted"),
    T("夜深了，关羽房里的灯还亮着。他坐在灯下读《春秋》，见你进来，并不放下书。",
      "It is late, but Guan Yu's lamp is still lit. He is reading the Spring and Autumn Annals and does not put it down when you come in."),
    [choice("ask_yi", "expression", T("问他：什么是义？", "Ask him: what is righteousness?"),
            T("关羽沉默良久：『义者，宜也。该做的事，死也要做。』他第一次正眼看你。",
              "Guan Yu is silent a long time. 'Righteousness is doing what ought to be done, even if it kills you.' For the first time he looks at you properly."),
            [rel("guanyu", "respect", 1), setv("flag.asked_yi")], echo=["e_yi"]),
     choice("warn_gifts", "strategy", T("提醒他：曹公待人越厚，越难脱身。", "Warn him: the more generous Cao is, the harder it is to leave."),
            T("关羽放下书：『你是说，曹操要买我？』『是要你欠他。』他想了想，点头：『我记下了。』",
              "Guan Yu puts the book down. 'You mean Cao wants to buy me?' 'He wants you to owe him.' He thinks, then nods. 'I'll remember that.'"),
            [rel("guanyu", "respect", 1), setv("flag.warned_guan")], echo=["e_warn_gifts"]),
     choice("lamp", "expression", T("不打扰他，替他添了灯油便走。", "Don't disturb him. Top up his lamp and go."),
            T("关羽没有抬头，只说了一句：『多谢。』", "Guan Yu doesn't look up. 'Thank you,' is all he says."))],
    salience=1, order=1))

N.append(node("c1_wenzhi", "c1", "side", T("故人温芷", "An Old Friend"), "free", T("原创人物", "original character"),
    T("你在丞相府的偏门外遇见了温芷。你们是颍川同乡，她家世代行医，如今她在曹府内院做医女。她先是一愣，然后笑了：『子衡？你怎么在这里？』",
      "Outside a side gate of the Chancellor's residence you run into Wen Zhi. You grew up in the same town in Yingchuan; her family have been physicians for generations, and she now treats the women of Cao Cao's household. She stares, then laughs. 'Ziheng? What are you doing here?'"),
    [choice("reminisce", "expression", T("和她叙旧，说起颍川的那棵老槐树。", "Catch up with her. Talk about the old locust tree back home."),
            T("你们说了很久，说到天黑。分手时她说：『许都没有槐树。』", "You talk until dark. As you part she says, 'There are no locust trees in Xuchang.'"),
            [rel("wenzhi", "intimacy", 1)]),
     choice("ask_watch", "dilemma", T("请她留意丞相府里关于刘备的议论。", "Ask her to listen for talk about Liu Bei in Cao's household."),
            T("她的笑容收了收：『你在替刘玄德做事。』过了很久，她说：『我只听，不偷。听到了，告诉你。』",
              "Her smile fades a little. 'You work for Liu Bei.' After a long pause: 'I'll listen. I won't steal. If I hear something, I'll tell you.'"),
            [rel("wenzhi", "trust", 1), setv("flag.asked_wenzhi")], echo=["e_wenzhi_spy"]),
     choice("urge_leave", "expression", T("劝她离开许都，这里迟早要出事。", "Urge her to leave Xuchang. Trouble is coming."),
            T("『你呢？你不也在这里？』她摇摇头，『府里有我要治的人。』", "'And you? You're here too.' She shakes her head. 'There are people in that house I have to treat.'"),
            [rel("wenzhi", "trust", 1)])],
    salience=2, order=2))

N.append(node("c1_dongcheng", "c1", "side", T("衣带诏", "The Belt Edict"), "literal", T("第20–21回", "Ch. 20–21"),
    T("车骑将军董承深夜来访，屏退左右，从衣带里取出一道血书：天子密诏，讨曹。刘备看完，手在发抖。董承看了你一眼：『此人可信否？』",
      "General Dong Cheng visits at night, sends everyone out, and draws a letter written in blood from the lining of a belt: a secret edict from the Emperor ordering Cao Cao's destruction. Liu Bei's hands shake as he reads. Dong Cheng glances at you. 'Can this one be trusted?'"),
    [choice("sign", "strategy", T("劝主公签名。这是汉臣的本分。", "Urge your lord to sign. It is a Han subject's duty."),
            T("刘备提笔，写下『左将军刘备』。董承收起诏书，向你拱手。", "Liu Bei takes up the brush and writes 'Liu Bei, General of the Left.' Dong Cheng puts the edict away and bows to you."),
            [rel("liubei", "trust", 1), add("renown.loyal")]),
     choice("delay", "dilemma", T("劝主公先别签：名单越长，越容易泄露。", "Tell him not to sign yet: the longer the list, the easier it leaks."),
            T("刘备犹豫再三，还是签了。事后他对你说：『你说得对，可这个名字我不能不写。』",
              "Liu Bei hesitates, then signs anyway. Afterwards he tells you, 'You were right. But I couldn't leave my name off.'"),
            [rel("liubei", "trust", 1), add("renown.cunning")]),
     choice("foresee", "strategy", T("直说：这份名单将来一定会落到曹操手里。", "Say it plainly: this list will end up in Cao Cao's hands."),
            T("屋里一片寂静。董承脸色发青：『你怎么知道？』刘备按住他的手，还是签了名。散席后，刘备盯着你看了很久。",
              "The room goes silent. Dong Cheng turns grey. 'How would you know?' Liu Bei puts a hand on his arm and signs anyway. When the guest has gone, Liu Bei looks at you for a long time."),
            [add("uncanny"), rel("liubei", "trust", 1), setv("flag.foresaw_yidai")], foresight=True, echo=["e_foresaw"])],
    salience=0, order=3))

N.append(node("c1_plum", "c1", "main", T("煮酒论英雄", "Heroes over Plum Wine"), "literal", T("第21回", "Ch. 21"),
    T("曹操派人来请：后园梅子青了，煮酒小坐。刘备只带了你一个。酒过数巡，阴云漠漠，骤雨将至。曹操一个一个数天下英雄：袁术、袁绍、刘表、孙策……都被他笑着摇头。",
      "Cao Cao sends for Liu Bei: the plums in his garden are green, the wine is warming, come and sit. Liu Bei brings only you. Several cups in, clouds pile up and rain threatens. Cao counts off the heroes of the realm—Yuan Shu, Yuan Shao, Liu Biao, Sun Ce—and laughs at each one."),
    [choice("cover", "strategy", T("趁雷声打翻自己的酒樽，替主公把慌乱遮过去。", "Knock over your own cup under cover of the thunder, to hide your lord's alarm."),
            T("酒樽当啷落地，你连声告罪。刘备借势俯身拾箸：『一震之威，乃至于此。』曹操大笑，目光却在你身上停了一停。",
              "Your cup clatters to the floor and you apologize profusely. Liu Bei uses the moment to stoop for his chopsticks. 'One clap of thunder, and look at us.' Cao laughs, but his eyes rest on you a moment."),
            [rel("liubei", "trust", 2), rel("caocao", "regard", 1), setv("flag.covered_liu")], echo=["e_cover"]),
     choice("still", "expression", T("低头不动，等主公自己圆过去。", "Keep your head down and let your lord handle it."),
            T("刘备从容俯首拾箸：『一震之威，乃至于此。』曹操笑道：『丈夫亦畏雷乎？』没有人看你。",
              "Liu Bei calmly stoops for his chopsticks. 'One clap of thunder, and look at us.' Cao laughs. 'A grown man, afraid of thunder?' No one looks at you.")),
     choice("speak", "dilemma", T("接过话头评点天下英雄，把曹操的注意力引到自己身上。", "Jump in and rate the heroes yourself, drawing Cao's attention to you."),
            T("你把袁绍、刘表、孙策挨个评了一遍，一句比一句狠。曹操拍案：『此子何人？』刘备替你告罪，回去的路上一句话也没说。",
              "You take Yuan Shao, Liu Biao and Sun Ce apart one by one, each verdict harsher than the last. Cao slaps the table. 'Who is this?' Liu Bei apologizes for you and says nothing the whole way home."),
            [rel("caocao", "regard", 2), rel("liubei", "trust", -1), add("renown.cunning"), setv("flag.spoke_at_plum")], echo=["e_spoke"])],
    quote=T("操以手指玄德，后自指，曰：「今天下英雄，惟使君与操耳！」玄德闻言，吃了一惊，手中所执匙箸，不觉落于地下。时正值天雨将至，雷声大作。",
            "Cao pointed at Liu Bei, then at himself. \"The only heroes in the realm today are you, my lord, and I.\" Liu Bei started; the spoon and chopsticks slipped from his hand. Just then the rain broke, and thunder crashed."),
    order=10))

# ================================================================== C2 出许都
N.append(node("c2_note", "c2", "side", T("药包里的纸条", "A Note in the Medicine"), "free", T("原创人物", "original character"),
    T("温芷托人送来一包药，药包里夹着一张纸条：『郭、程二人劝丞相，不可放刘备出城。』",
      "Wen Zhi sends over a packet of medicine. Folded inside is a note: 'Guo Jia and Cheng Yu are urging the Chancellor not to let Liu Bei leave the city.'"),
    [choice("haste", "strategy", T("劝主公一拿到兵马就连夜出城。", "Urge your lord to leave the night he gets his troops."),
            T("刘备点头：『就这么办。』当夜大军出了许都。", "Liu Bei nods. 'So be it.' That night the army leaves Xuchang."),
            [setv("flag.fast_departure"), rel("liubei", "trust", 1), rel("wenzhi", "trust", 1)], echo=["e_fast"]),
     choice("protect", "dilemma", T("烧掉纸条，托人带话：别再为我冒险。", "Burn the note and send word: don't take risks for me again."),
            T("回话只有两个字：『知道。』你不确定她是生气还是放心。", "The reply is two words: 'I know.' You can't tell whether she's angry or relieved."),
            [rel("wenzhi", "intimacy", 1)])],
    when=ANY(F("flag.asked_wenzhi"), R("wenzhi", "intimacy", ">=", 2)), salience=3,
    callbacks=[cb("e_wenzhi_spy", T("她说过『只听，不偷』。这张纸条，已经是在偷了。", "She said she would listen, not steal. This note is stealing."), F("flag.asked_wenzhi"))], order=1))

N.append(node("c2_pretext", "c2", "side", T("出城的理由", "A Reason to Leave"), "functional", T("第21回", "Ch. 21"),
    T("刘备想出城，却需要一个曹操驳不回的理由。", "Liu Bei needs a reason to leave that Cao Cao cannot refuse."),
    [choice("intercept", "strategy", T("献策：请命截击袁术。", "Advise him to volunteer to intercept Yuan Shu."),
            T("次日刘备入朝请命，曹操竟然准了，拨给他五万兵马。", "The next day Liu Bei volunteers at court, and Cao agrees, giving him fifty thousand men."),
            [rel("liubei", "trust", 1)]),
     choice("illness", "expression", T("主张托病闭门，等风头过去。", "Suggest he plead illness and wait it out."),
            T("刘备摇头：『闭门是等死。』他最后还是请命截击袁术。", "Liu Bei shakes his head. 'Hiding at home is waiting to die.' In the end he volunteers to intercept Yuan Shu anyway."))],
    salience=1, order=2))

N.append(node("c2_xuchu", "c2", "main", T("许褚追来", "Xu Chu Gives Chase"), "functional", T("第21回", "Ch. 21"),
    [P(T("大军出城没多久，后面尘头大起：许褚带着五百骑追来，说丞相请将军回去。",
         "Not long after the army leaves, dust rises behind you: Xu Chu with five hundred riders. The Chancellor asks the general to return."), NF("flag.fast_departure")),
     P(T("大军连夜赶路。第二天中午，探马来报：许褚带五百骑追到半路，见追不上，回去了。",
         "The army marches through the night. At noon the next day, scouts report that Xu Chu came after you with five hundred riders, saw he couldn't catch up, and turned back."), F("flag.fast_departure"))],
    [choice("rule", "strategy", T("请主公答他：『将在外，君命有所不受。』", "Have your lord answer: 'A general in the field need not obey every order.'"),
            T("许褚是个直人，听了这话，竟无话可说，回去复命了。", "Xu Chu is a plain man. He has no answer to that and rides back to report."),
            [rel("liubei", "trust", 1), add("renown.loyal")], when=NF("flag.fast_departure")),
     choice("talk", "dilemma", T("你亲自出面，跟许褚东拉西扯，拖到天黑。", "Go out yourself and talk Xu Chu in circles until dark."),
            T("许褚被你绕得头昏，拨马回去了。曹操听说后问：『跟许褚说话的那个书生，叫什么？』",
              "Xu Chu gets so tangled he turns his horse and goes home. When Cao hears about it he asks, 'The scholar who talked to Xu Chu—what's his name?'"),
            [add("renown.cunning"), rel("caocao", "regard", 1)], when=NF("flag.fast_departure")),
     choice("onward", "expression", T("催马继续赶路。", "Ride on."), T("徐州就在前面。", "Xuzhou lies ahead."), when=F("flag.fast_departure")),
     choice("look_back", "expression", T("回头望一眼许都的方向。", "Look back toward Xuchang."), T("城楼已经看不见了。温芷还在那里。", "The city walls are out of sight. Wen Zhi is still there."), when=F("flag.fast_departure"))],
    callbacks=[cb("e_fast", T("要是晚走半天，就得在城门口跟许褚说话了。你想起那包药。", "Half a day later and you'd have been arguing with Xu Chu at the gate. You think of the medicine packet."), F("flag.fast_departure"))],
    order=10))

# ================================================================== C3 下邳
N.append(node("c3_terms", "c3", "main", T("土山约三事", "Three Terms on the Hill"), "functional", T("第25回", "Ch. 25"),
    T("张辽单骑上山，劝关羽暂降。他说关羽若死战，有三罪：负了桃园之誓，负了皇叔托付的两位嫂嫂，负了匡扶汉室之志。关羽沉默了。",
      "Zhang Liao rides up the hill alone to urge Guan Yu to surrender for now. If he fights to the death, Zhang Liao says, he commits three wrongs: he breaks the Peach Garden oath, abandons the two ladies his brother entrusted to him, and gives up on restoring the Han. Guan Yu says nothing."),
    [choice("draft", "strategy", T("替关羽把条件写下来，一条一条和张辽谈。", "Write down Guan Yu's conditions and negotiate them with Zhang Liao point by point."),
            T("你执笔，关羽口述，三条写得清清楚楚：『吾今只降汉帝，不降曹操』；两位嫂嫂由皇叔俸禄供养，闲人不得入门；『但知刘皇叔去向，不管千里万里，便当辞去』。张辽带回去，曹操全都答应了。关羽随曹军入许都，你也一起去了。",
              "Guan Yu dictates and you write, three terms set down plainly: 'I surrender to the Han emperor, not to Cao Cao'; the two ladies are to be kept on Liu Bei's stipend and no one may enter their gate; 'the moment I learn where Liu Bei is, however far, I leave.' Zhang Liao takes them back and Cao agrees to all three. Guan Yu goes to Xuchang with Cao's army, and you go with him."),
            [rel("guanyu", "respect", 2), setv("flag.drafted_terms"), setv("flag.with_guanyu")], echo=["e_terms"]),
     choice("carry", "dilemma", T("趁夜突围北上，去袁绍那里给主公报信。", "Break out at night and ride north to bring your lord the news."),
            T("关羽给了你一匹马：『告诉大哥，我在，嫂嫂在。』你从山后的小路走了。后来听说，关羽与曹操约了三件事，随曹军入了许都。",
              "Guan Yu gives you a horse. 'Tell my brother: I'm alive, and so are the ladies.' You slip away down the back of the hill. Later you hear that Guan Yu agreed three terms with Cao and went to Xuchang with his army."),
            [rel("liubei", "trust", 2), setv("flag.carried_news")], echo=["e_news"]),
     choice("fight", "expression", T("劝关羽死战，宁死不降。", "Urge Guan Yu to fight to the death rather than surrender."),
            T("关羽摇头：『你说的，正是我想说的。可两位嫂嫂怎么办？』他还是派张辽回去传话，约了三件事。你随他入了许都。",
              "Guan Yu shakes his head. 'You're saying what I want to say. But what becomes of the two ladies?' He sends Zhang Liao back with three terms after all. You go to Xuchang with him."),
            [add("renown.loyal"), rel("guanyu", "respect", 1), setv("flag.with_guanyu"), setv("flag.urged_fight")], echo=["e_fight"])],
    callbacks=[cb("e_yi", T("关羽转头看你：『你问过我什么是义。今天这道题，难。』", "Guan Yu turns to you. 'You once asked me what righteousness is. Today the question is hard.'"), F("flag.asked_yi")),
               cb("e_foresaw", T("你想起那天夜里在董承面前说的话。消息传开后，有人说刘备府上有个书生，早就算到了。", "Word gets around that a scholar in Liu Bei's household saw this coming."), F("flag.foresaw_yidai"))],
    order=10))

# ================================================================== C4 千里
N.append(node("c4_horse", "c4", "side", T("赤兔马", "Red Hare"), "free", T("第25回", "Ch. 25"),
    T("曹操把吕布的赤兔马送给关羽。关羽再拜称谢——金银美女都没让他拜过。曹操有些不快：『为何独重一马？』关羽答得坦然。曹操沉默片刻，转向你：『子衡也该有个官职。』",
      "Cao Cao gives Guan Yu Lü Bu's horse, Red Hare. Guan Yu bows twice in thanks—gold and women never got a bow from him. Cao is put out. 'Why does a horse matter more than all the rest?' Guan Yu answers frankly. Cao is quiet a moment, then turns to you. 'Ziheng ought to have a post too.'"),
    [choice("accept_post", "dilemma", T("接下曹操给的主簿之职。", "Accept the clerk's post Cao offers."),
            T("曹操很高兴。关羽看了你一眼，什么也没说。", "Cao is pleased. Guan Yu glances at you and says nothing."),
            [rel("caocao", "regard", 2), setv("flag.took_cao_post"), rel("guanyu", "respect", -1), add("renown.cunning")], echo=["e_post"]),
     choice("decline", "strategy", T("婉拒：『在下是关将军的人。』", "Decline politely: 'I belong to General Guan.'"),
            T("曹操笑笑：『都是一样的脾气。』当晚关羽请你喝了酒。", "Cao smiles. 'The same temper, the pair of you.' That night Guan Yu buys you a drink."),
            [rel("guanyu", "respect", 1), add("renown.loyal")]),
     choice("deflect", "expression", T("装作没听懂。", "Pretend not to understand."), T("曹操也不追问。", "Cao doesn't press."))],
    when=F("flag.with_guanyu"), salience=2,
    quote=T("公曰：「吾知此马日行千里，今幸得之，若知兄长下落，可一日而见面矣。」",
            "Guan Yu said: \"I know this horse covers a thousand li a day. If I learn where my brother is, I can be with him in a single day.\""),
    callbacks=[cb("e_warn_gifts", T("关羽低声对你说：『你说过，他是要我欠他。欠下的，日后要还。』", "Guan Yu says quietly to you, 'You told me he wants me in his debt. Debts have to be repaid.'"), F("flag.warned_guan"))],
    order=1))

N.append(node("c4_garden", "c4", "side", T("药圃", "The Herb Garden"), "free", T("原创人物", "original character"),
    T("温芷约你在城南的药圃见面。她已经知道关羽在打听刘备的下落。『他总会走的，』她说，『你呢？』",
      "Wen Zhi asks you to meet her at the herb garden south of the city. She knows Guan Yu has been asking where Liu Bei is. 'He'll leave sooner or later,' she says. 'And you?'"),
    [choice("promise", "dilemma", T("许诺：等天下稍定，回来接你。", "Promise: when things settle, I'll come back for you."),
            T("她低头笑了一下，把一包止血散塞进你袖子里：『那你得活着回来。』", "She looks down and smiles, and tucks a packet of wound powder into your sleeve. 'Then you'd better come back alive.'"),
            [rel("wenzhi", "intimacy", 2), setv("flag.promise_wenzhi")], echo=["e_promise"]),
     choice("honest", "expression", T("实话实说：前路生死难料，不敢许诺。", "Be honest: you can't promise anything when you might not survive."),
            T("『你倒老实。』她看着药圃，『老实人活得久些。』", "'You're honest, at least.' She looks out over the herbs. 'Honest people live longer.'"),
            [rel("wenzhi", "trust", 1)]),
     choice("ask_come", "dilemma", T("请她和你们一起走。", "Ask her to come with you."),
            T("她摇头：『府里还有三个病人离不开我。』停了一下，她又说：『你问了，我记着。』", "She shakes her head. 'Three patients there can't do without me.' A pause. 'But you asked. I'll remember that.'"),
            [rel("wenzhi", "intimacy", 1), rel("wenzhi", "trust", 1)])],
    when=ALL(F("flag.with_guanyu"), R("wenzhi", "intimacy", ">=", 2)), salience=3, order=2,
    callbacks=[cb("e_wenzhi_spy", T("『你托我听的那些话，』她说，『我还在听。』", "'The things you asked me to listen for,' she says, 'I'm still listening.'"), F("flag.asked_wenzhi"))]))
N[-1]["mood"] = ROMANCE

N.append(node("c4_seal", "c4", "main", T("挂印封金", "Seal Hung, Gold Sealed"), "functional", T("第26–27回", "Ch. 26–27"),
    T("白马一战，关羽斩了颜良，算是报了曹操的恩。不久，消息传来：刘备在袁绍军中。关羽把曹操所赠的金银封存在库，把汉寿亭侯印挂在堂上，就要走了。没有曹操的文书，沿途关隘不会放行。",
      "At White Horse, Guan Yu kills Yan Liang and repays Cao Cao's kindness. Soon word comes: Liu Bei is with Yuan Shao. Guan Yu seals Cao's gold and silver in the storehouse, hangs his seal of office in the hall, and prepares to go. Without a pass from Cao, no checkpoint on the road will let him through."),
    [choice("follow", "strategy", T("随关羽护着两位夫人上路，一关一关闯过去。", "Ride with Guan Yu and the ladies and force your way through, pass by pass."),
            T("一路过东岭、洛阳、汜水、荥阳、黄河渡口，关羽连斩六将。到古城与刘备重逢时，你的马已经换过三匹。",
              "Through Dongling, Luoyang, Sishui, Xingyang and the Yellow River ford, Guan Yu kills six generals. By the time you reunite with Liu Bei at Gucheng, you've worn out three horses."),
            [rel("guanyu", "respect", 1), add("renown.loyal"), rel("liubei", "trust", 1)]),
     choice("pass", "dilemma", T("去求温芷，从丞相府弄一纸通关文书。", "Ask Wen Zhi to get you a travel pass from the Chancellor's office."),
            T("温芷什么也没问，第二天就把盖了印的文书交给你。东岭关的孔秀验过文书，放你们过去了。到了洛阳，韩福不认这份文书，关羽的刀还是出了鞘。后来你听说，温芷为这件事被叫去问了三天话。",
              "Wen Zhi asks nothing. The next day she hands you a stamped pass. At Dongling, Kong Xiu checks it and lets you through. At Luoyang, Han Fu refuses to honor it, and Guan Yu's blade comes out after all. Later you hear Wen Zhi was questioned for three days over it."),
            [setv("flag.pass_from_wenzhi"), setv("flag.kongxiu_spared"), add("deviation"), rel("wenzhi", "trust", 1), rel("guanyu", "respect", 1), rel("liubei", "trust", 1)],
            req=R("wenzhi", "trust", ">=", 2), hint=T("需要温芷的信任 ≥ 2", "Needs Wen Zhi's trust ≥ 2"),
            echo=["e_pass"], debt=["d_five_passes"], resolve=[("d_five_passes", "transform")]),
     choice("stay", "dilemma", T("留下来，做曹操的谋士。", "Stay, and serve Cao Cao as his adviser."),
            T("关羽在门口站了一会儿：『人各有志。保重。』他上马走了。当晚，曹操亲自给你斟了一杯酒。",
              "Guan Yu stands in the doorway a while. 'Every man chooses his own road. Take care.' He mounts and rides away. That evening Cao Cao pours you a cup of wine himself."),
            [setv("track", "cao"), rel("liubei", "trust", -3), rel("guanyu", "respect", -1), rel("caocao", "regard", 2), add("deviation")],
            req=ANY(R("caocao", "regard", ">=", 2), F("flag.took_cao_post")), hint=T("需要曹操的赏识 ≥ 2，或已接受曹营官职", "Needs Cao's regard ≥ 2, or a post under Cao"), echo=["e_stay"])],
    when=F("flag.with_guanyu"),
    callbacks=[cb("e_terms", T("曹操叹道：『土山上那三条，是子衡写的吧？我答应过，便不追了。』", "Cao sighs. 'Those three terms on the hill—Ziheng wrote them, didn't he? I gave my word. I won't pursue.'"), F("flag.drafted_terms")),
               cb("e_spoke", T("曹操把你叫到一边：『青梅亭上那个说话不留情的书生，我一直记得。留下来吧。』", "Cao takes you aside. 'The scholar at the plum pavilion who spared no one—I haven't forgotten. Stay.'"), F("flag.spoke_at_plum")),
               cb("e_cover", T("曹操把你叫到一边：『那天打翻酒樽的，是你吧？好快的手。留下来吧。』", "Cao takes you aside. 'It was you who knocked over that cup, wasn't it? Quick hands. Stay.'"), F("flag.covered_liu")),
               cb("e_warn_gifts", T("关羽封金时对你说：『你说过他要我欠他。今天，能还的我都还了。』", "As he seals the gold, Guan Yu says to you, 'You said he wanted me in his debt. Today I've repaid everything I can.'"), F("flag.warned_guan")),
               cb("e_fight", T("关羽说：『土山上你劝我死战。今天，我总算可以走了。』", "Guan Yu says, 'On the hill you told me to fight to the death. Today, at last, I can leave.'"), F("flag.urged_fight")),
               cb("e_post", T("你的主簿印信还放在案上。", "Your clerk's seal of office is still lying on the desk."), F("flag.took_cao_post"))],
    order=10))

N.append(node("c4_yuan", "c4", "main", T("袁绍营中", "In Yuan Shao's Camp"), "functional", T("第25–28回", "Ch. 25–28"),
    T("消息传到冀州：关羽在白马斩了袁绍的大将颜良。袁绍大怒，要杀刘备。", "News reaches Jizhou: at White Horse, Guan Yu has killed Yuan Shao's general Yan Liang. Yuan Shao is furious and wants Liu Bei dead."),
    [choice("letter", "strategy", T("献策：请主公向袁绍解释，再写信叫二弟来投。", "Advise your lord to explain himself to Yuan Shao, then write to his brother to come."),
            T("袁绍信了，转怒为喜。刘备的信送到许都，关羽很快辞别曹操，一路过关斩将寻来。他见到你，说：『写信这一着，是你出的主意？』",
              "Yuan Shao believes him and cheers up. The letter reaches Xuchang; Guan Yu soon takes leave of Cao and fights his way through the passes to find you. When he sees you he says, 'The letter—that was your idea?'"),
            [rel("liubei", "trust", 1), rel("guanyu", "respect", 1)]),
     choice("leave", "strategy", T("劝主公借口联络刘表，早日离开袁绍。", "Advise him to leave Yuan Shao early, on the pretext of contacting Liu Biao."),
            T("刘备借故南下汝南，在古城与关羽、张飞重聚。袁绍不久便在官渡大败。", "Liu Bei finds a reason to go south to Runan and reunites with Guan Yu and Zhang Fei at Gucheng. Not long after, Yuan Shao is crushed at Guandu."),
            [rel("liubei", "trust", 1), add("renown.cunning")]),
     choice("guard", "dilemma", T("站到主公身前，替他挡袁绍的怒气。", "Step in front of your lord and take Yuan Shao's anger yourself."),
            T("袁绍的刀没有落下来。刘备什么也没说，只是那晚把自己的披风给了你。", "Yuan Shao's sword doesn't fall. Liu Bei says nothing, but that night he gives you his cloak."),
            [rel("liubei", "trust", 2), add("renown.loyal")])],
    when=NF("flag.with_guanyu"),
    callbacks=[cb("e_news", T("刘备握着你的手：『若不是你从下邳带出那句话，我还以为二弟死了。』", "Liu Bei grips your hand. 'If you hadn't brought me word from Xiapi, I'd have thought my brother dead.'"), F("flag.carried_news")),
               cb("e_spoke", T("刘备苦笑：『听说曹操至今还在打听，青梅亭上那个书生是谁。』", "Liu Bei smiles ruefully. 'I hear Cao is still asking who that scholar at the plum pavilion was.'"), F("flag.spoke_at_plum"))],
    order=10))

# ================================================================== C5 新野 / 许都
N.append(node("c5_letter", "c5", "side", T("徐母之书", "A Letter from His Mother"), "functional", T("第36回", "Ch. 36"),
    T("一封信从许都辗转送到你手里，是温芷的字：『程昱仿徐母笔迹作书，将召徐元直北上。徐母本人不知。』第二天，徐庶就收到了『母亲』的信，哭着要走。",
      "A letter reaches you by a roundabout route from Xuchang, in Wen Zhi's hand: 'Cheng Yu has forged a letter in Xu Shu's mother's handwriting to summon him north. She knows nothing of it.' The next day Xu Shu receives a letter from his 'mother' and, in tears, prepares to go."),
    [choice("tell", "dilemma", T("把真相告诉徐庶。", "Tell Xu Shu the truth."),
            T("徐庶拿着两封信对照了一夜，留下了。可他的母亲还在曹操手里，从那以后，他再没睡过一个整觉。",
              "Xu Shu compares the two letters all night, and stays. But his mother is still in Cao's hands, and he never sleeps through the night again."),
            [setv("flag.xushu_stayed"), add("deviation"), rel("liubei", "trust", 1)], debt=["d_recommend"], echo=["e_xushu"]),
     choice("silent", "dilemma", T("沉默。他的母亲在曹营，他留下也救不了她。", "Say nothing. His mother is in Cao's hands; staying won't save her."),
            T("徐庶走了。出城十里，他又拨马回来，对刘备说：『此间有一奇士，只在襄阳城外二十里隆中。』说完再不回头。你一直看着他的背影。",
              "Xu Shu leaves. Ten li out he turns his horse back and tells Liu Bei, 'There is a remarkable man nearby, at Longzhong, twenty li outside Xiangyang.' Then he rides off without looking back. You watch him until he's gone."),
            [add("renown.cunning")]),
     choice("tell_liu", "strategy", T("先告诉主公，由他决定。", "Tell your lord first and let him decide."),
            T("刘备想了很久：『母子天伦，我不能拦。』徐庶还是走了，临行前举荐了隆中的诸葛亮。刘备对你说：『你能先来问我，很好。』",
              "Liu Bei thinks a long time. 'A son and his mother—I can't stand in the way.' Xu Shu leaves, recommending Zhuge Liang of Longzhong before he goes. Liu Bei tells you, 'It was right of you to come to me first.'"),
            [rel("liubei", "trust", 2)])],
    when=ALL(LIU, ANY(R("wenzhi", "trust", ">=", 3), F("flag.pass_from_wenzhi"))), salience=3,
    callbacks=[cb("e_pass", T("信末一行小字：『文书一事，问了三日，无妨。』", "A line squeezed in at the bottom: 'About the pass—three days of questions. I'm fine.'"), F("flag.pass_from_wenzhi")),
               cb("e_wenzhi_spy", T("这一回，她不只是在听了。", "This time she's done more than listen."), F("flag.asked_wenzhi"))],
    order=1))

N.append(node("c5_mirror", "c5", "side", T("水镜庄", "Water Mirror Manor"), "free", T("第35回", "Ch. 35"),
    T("刘备带你去拜访隐士司马徽。水镜先生抚琴待客，谈到天下人才，只说了一句话。",
      "Liu Bei takes you to call on the recluse Sima Hui. Master Water Mirror receives you with his zither, and when talk turns to talent, he says only one thing."),
    [choice("ask_phoenix", "strategy", T("追问：凤雏是谁？", "Press him: who is the Young Phoenix?"),
            T("司马徽笑而不答。出门时，他的童子悄悄告诉你：『襄阳庞士元。』", "Sima Hui only smiles. On your way out, his servant boy whispers, 'Pang Shiyuan of Xiangyang.'"),
            [setv("flag.knows_pangtong")]),
     choice("ask_dragon", "expression", T("追问：卧龙在何处？", "Press him: where is the Sleeping Dragon?"),
            T("司马徽只说：『好，好。』刘备一路上都在念叨这两个字。", "Sima Hui says only, 'Good, good.' Liu Bei repeats it to himself the whole way home.")),
     choice("self", "expression", T("笑问：『先生看我算哪一种？』", "Ask with a smile: 'And which kind am I?'"),
            T("司马徽认真看了你一会儿：『你是记性好的那种。』刘备大笑。", "Sima Hui studies you seriously. 'You're the kind with a good memory.' Liu Bei roars with laughter."))],
    when=LIU, salience=1,
    quote=T("徽曰：「伏龙、凤雏，两人得一，可安天下。」", "Sima Hui said: \"Sleeping Dragon, Young Phoenix: win either one, and you can bring peace to the realm.\""),
    order=2))

N.append(node("c5_cottage", "c5", "main", T("三顾茅庐", "Three Visits to the Thatched Cottage"), "literal", T("第37–38回", "Ch. 37–38"),
    [P(T("徐庶走马荐了诸葛亮。刘备冒着风雪去了隆中三次，前两次都扑了空。", "Xu Shu, on his way out, recommended Zhuge Liang. Liu Bei goes to Longzhong three times through wind and snow; the first two times he finds no one home."), NF("flag.xushu_stayed")),
     P(T("徐庶留了下来。少了那一场离别，就没有人在城外回马举荐什么人。刘备只记得水镜先生那句『卧龙、凤雏』。", "Xu Shu has stayed. Without that farewell, no one turns back at the gate to recommend anyone. All Liu Bei has is Master Water Mirror's riddle about a dragon and a phoenix."), F("flag.xushu_stayed"))],
    [choice("wait", "strategy", T("陪主公三顾，第三次在门外站着等他睡醒。", "Go with your lord all three times, and the third time stand outside until the man wakes."),
            T("诸葛亮终于出来，为刘备画了一张天下的图：『将军欲成霸业，北让曹操占天时，南让孙权占地利，将军可占人和。』出门时，他特意向你拱了拱手。",
              "Zhuge Liang finally comes out and draws Liu Bei a map of the realm: 'If you would build an empire, let Cao Cao have the moment in the north and Sun Quan the land in the south; you can have the people.' On the way out he makes a point of bowing to you."),
            [rel("zhuge", "respect", 2), rel("liubei", "trust", 1)], when=NF("flag.xushu_stayed")),
     choice("co_rec", "strategy", T("和徐庶一起，向主公举荐隆中的诸葛亮。", "Join Xu Shu in recommending Zhuge Liang of Longzhong to your lord."),
            T("刘备三顾隆中。诸葛亮出山时说：『元直举荐，子衡作陪，亮岂敢不来？』隆中对那张图，你们三个人一起看的。",
              "Liu Bei makes his three visits. When Zhuge Liang agrees to come, he says, 'Recommended by Yuanzhi, escorted by Ziheng—how could I refuse?' The three of you study his map together."),
            [rel("zhuge", "respect", 2), rel("liubei", "trust", 1)], when=F("flag.xushu_stayed"), resolve=[("d_recommend", "reroute")]),
     choice("pangtong", "strategy", T("同时举荐庞统：卧龙、凤雏，为何不能两个都要？", "Recommend Pang Tong as well: why not have both the dragon and the phoenix?"),
            T("刘备三顾隆中，请出了诸葛亮；又派人去襄阳，庞统竟也来了。他长得丑，话却说得漂亮。诸葛亮笑道：『子衡这一手，比我快了好几年。』",
              "Liu Bei makes his three visits and wins Zhuge Liang; he also sends to Xiangyang, and Pang Tong comes too. He's ugly, but he talks beautifully. Zhuge Liang laughs. 'Ziheng's move is several years ahead of mine.'"),
            [setv("flag.pangtong_joined"), add("deviation"), rel("zhuge", "respect", 1), rel("liubei", "trust", 1)],
            req=F("flag.knows_pangtong"), hint=T("需要知道凤雏是谁", "Needs to know who the Young Phoenix is"),
            echo=["e_pangtong"], debt=["d_lianhuan"], resolve=[("d_recommend", "reroute")]),
     choice("aside", "dilemma", T("站在一边冷眼看着：这个年轻人一来，你的位置就没了。", "Stand aside and watch coldly: once this young man arrives, your place is gone."),
            [P(T("刘备自己去了隆中三次。", "Liu Bei goes to Longzhong three times on his own."), F("flag.xushu_stayed")),
             P(T("诸葛亮出山了。他待你客气，客气得让你发冷。有一晚刘备问你：『子衡近来话少了？』",
                 "Zhuge Liang comes. He is polite to you—so polite it chills you. One night Liu Bei asks, 'You've been quiet lately, Ziheng?'"))],
            [rel("zhuge", "wary", 2), rel("liubei", "trust", -1), add("renown.cunning"), setv("flag.aside_zhuge")], echo=["e_aside"], resolve=[("d_recommend", "reroute")])],
    when=LIU,
    quote=T("孔明曰：「……将军欲成霸业，北让曹操占天时，南让孙权占地利，将军可占人和。」", "Zhuge Liang said: \"…If you would build an empire, let Cao Cao have the moment in the north and Sun Quan the land in the south; you can have the people.\""),
    callbacks=[cb("e_cover", T("风雪里，刘备忽然说：『许都那杯酒，我一直记得。先生胆大心细，今天也帮我看看这个人。』", "In the snow Liu Bei suddenly says, 'I've never forgotten that cup of wine in Xuchang. You're bold and careful. Help me judge this man today.'"), F("flag.covered_liu")),
               cb("e_xushu", T("徐庶走在你身边，低声说：『我母亲的事……多谢。』", "Xu Shu walks beside you and says quietly, 'About my mother… thank you.'"), F("flag.xushu_stayed")),
               cb("e_news", T("刘备说：『当年你从下邳带来那一句话，我就知道，你是能托付的人。』", "Liu Bei says, 'When you brought me that message from Xiapi, I knew you were someone I could rely on.'"), F("flag.carried_news")),
               cb("e_pass", T("刘备问起：『听说云长过关时有一纸文书，是哪位贵人？』你没有说出她的名字。", "Liu Bei asks, 'I hear Yunchang had a pass at the checkpoints. Who was the benefactor?' You don't say her name."), F("flag.pass_from_wenzhi"))],
    order=10))

N.append(node("c5_spring", "c5", "side", T("当归", "Angelica"), "free", T("原创人物", "original character"),
    T("春天，温芷在药圃里晒药，你帮她翻竹匾。这样的日子已经过了好几年，你们谁都没有说破。",
      "Spring. Wen Zhi is drying herbs in the garden, and you help turn the trays. You've had years of days like this, and neither of you has said anything."),
    [choice("speak", "dilemma", T("把话说破。", "Say it."),
            T("她把一片当归放进你手心：『这个，叫当归。』她没再说别的，你也懂了。", "She puts a slice of angelica root in your palm. 'This is called danggui—\"you should come home.\"' She says nothing more, and you understand."),
            [rel("wenzhi", "intimacy", 2), setv("flag.wenzhi_together")], echo=["e_angelica"]),
     choice("wait", "expression", T("再等等，等天下定了再说。", "Wait a little longer—until the realm is settled."),
            T("她点点头，像是早就知道你会这么说。", "She nods, as if she knew you'd say that."), [rel("wenzhi", "trust", 1)]),
     choice("chengyu", "strategy", T("问她：丞相府里，谁最不喜欢你？", "Ask her: who in the Chancellor's household likes you least?"),
            T("『程昱，』她说，『他说你骨子里还是刘备的人。』", "'Cheng Yu,' she says. 'He says that deep down you still belong to Liu Bei.'"), [rel("wenzhi", "trust", 1)])],
    when=ALL(CAO, R("wenzhi", "intimacy", ">=", 2)), salience=2, order=1))
N[-1]["mood"] = ROMANCE

N.append(node("c5_forge", "c5", "main", T("程昱之书", "Cheng Yu's Letter"), "functional", T("第36回", "Ch. 36"),
    T("程昱来找你：刘备得了个军师徐庶，屡次坏丞相的事。徐庶是孝子，他母亲就在许都。『你写得一手好字，』程昱说，『仿一封徐母的家书，不难吧？』",
      "Cheng Yu comes to see you. Liu Bei has a new strategist, Xu Shu, who keeps spoiling the Chancellor's plans. Xu Shu is a devoted son, and his mother is in Xuchang. 'You write a fine hand,' Cheng Yu says. 'Forging a letter from his mother shouldn't be hard.'"),
    [choice("forge", "dilemma", T("写。这是丞相的命令。", "Write it. These are the Chancellor's orders."),
            T("信写得很像。徐庶果然来了许都，见到母亲才知道是假信。徐母大骂儿子糊涂，当晚自缢。你在灵前站了很久。",
              "The letter is a good likeness. Xu Shu comes to Xuchang and learns from his mother that it was forged. She rebukes him for a fool and hangs herself that night. You stand before her coffin a long time."),
            [rel("caocao", "regard", 2), add("renown.cunning", 2), setv("flag.forged_letter")], echo=["e_forged"]),
     choice("refuse", "strategy", T("推说手伤，写不了。", "Claim an injured hand and beg off."),
            T("程昱自己写了。徐庶照样来了，徐母照样死了。程昱从此不太和你说话。", "Cheng Yu writes it himself. Xu Shu comes all the same, and his mother dies all the same. Cheng Yu barely speaks to you after that."),
            [rel("caocao", "regard", -1), add("renown.loyal")]),
     choice("warn", "dilemma", T("表面答应，暗中托人给新野送信，揭穿此事。", "Agree to his face, then secretly send word to Xinye exposing the plot."),
            [P(T("信写了，可徐庶没有来。程昱查了半个月，没有查到你。徐母活了下来，被软禁在许都。", "The letter is written, but Xu Shu doesn't come. Cheng Yu investigates for half a month and never finds you. Xu Shu's mother lives, under guard in Xuchang.")),
             P(T("后来听说，刘备还是去隆中请出了诸葛亮——是水镜先生指的路。", "Later you hear Liu Bei went to Longzhong and won Zhuge Liang anyway—Master Water Mirror pointed the way."))],
            [setv("flag.xushu_stayed"), add("deviation"), rel("liubei", "trust", 1)], debt=["d_recommend"], resolve=[("d_recommend", "reroute")])],
    when=CAO,
    callbacks=[cb("e_spoke", T("程昱补了一句：『丞相说，青梅亭上就看出你这人心思多。』", "Cheng Yu adds, 'The Chancellor says he saw at the plum pavilion how many thoughts you keep.'"), F("flag.spoke_at_plum")),
               cb("e_cover", T("程昱说：『丞相还记得你那天打翻的酒樽。他说你手快，心更快。』", "Cheng Yu says, 'The Chancellor still remembers the cup you knocked over. He says your hands are quick and your mind quicker.'"), F("flag.covered_liu")),
               cb("e_post", T("程昱说：『主簿大人，丞相府的笔，你用了七年了。』", "Cheng Yu says, 'Master Clerk, you've held the Chancellor's brush for seven years now.'"), F("flag.took_cao_post"))],
    order=10))

# ================================================================== C6 长坂
N.append(node("c6_slope", "c6", "main", T("长坂坡", "Changban Slope"), "literal", T("第41–42回", "Ch. 41–42"),
    T("当阳长坂，曹军追到了。百姓哭喊着四散，刘备的家眷在乱军中走散了。", "Changban, near Dangyang. Cao's cavalry catches up. Civilians scatter, screaming, and Liu Bei's family is lost in the chaos."),
    [choice("abandon", "strategy", T("劝主公扔下百姓，轻骑快走。", "Urge your lord to leave the civilians and ride for it."),
            T("刘备红着眼睛：『举大事者必以人为本。今人归我，奈何弃之？』他没听你的。身边几个将领看你的眼神变了。",
              "Liu Bei's eyes are red. 'Great undertakings rest on the people. They have come to me—how can I abandon them?' He doesn't take your advice. Several of his officers look at you differently after that."),
            [rel("liubei", "trust", -2), add("renown.cunning"), setv("flag.abandon_advice")], echo=["e_abandon"]),
     choice("search", "dilemma", T("跟赵云一起杀回去，找夫人和小公子。", "Ride back in with Zhao Yun to find the lady and the young heir."),
            T("你们在一堵断墙后找到了糜夫人，她腿上中了枪，怀里抱着阿斗。赵云接过孩子，你扶夫人上了你的马。赵云单骑在前，怀抱阿斗冲出重围；你带着夫人从小路绕出来，左肩挨了一箭。",
              "Behind a broken wall you find Lady Mi, a spear wound in her leg, the infant Adou in her arms. Zhao Yun takes the child; you lift the lady onto your horse. Zhao Yun rides out alone through the encirclement with Adou at his chest, while you take the lady out by a back path and catch an arrow in your left shoulder."),
            [setv("flag.mi_saved"), setv("flag.wounded"), add("deviation"), rel("liubei", "trust", 2), add("renown.loyal")],
            echo=["e_mi"], debt=["d_mi"], resolve=[("d_mi", "transform")]),
     choice("dust", "strategy", T("献策：让张飞在长坂桥东的树林里拖着树枝跑马，扬尘作疑兵。", "Suggest Zhang Fei have riders drag branches through the woods east of the bridge to raise dust and fake an army."),
            T("张飞横矛立马桥上，大喝一声：『我乃燕人张翼德也！谁敢与我决一死战？』身后林中尘土大起。曹军疑有伏兵，竟不敢过桥。",
              "Zhang Fei plants himself on the bridge with his spear across his saddle and roars, 'I am Zhang Yide of Yan! Who dares fight me to the death?' Behind him dust boils up from the woods. Suspecting an ambush, Cao's army won't cross."),
            [rel("liubei", "trust", 1), add("renown.loyal")])],
    when=LIU,
    callbacks=[cb("e_aside", T("诸葛亮在乱军里喊你的名字，让你护着百姓先走。他的声音很稳，你却没有回头。", "Through the chaos Zhuge Liang calls your name, telling you to get the civilians moving. His voice is steady; you don't look back."), F("flag.aside_zhuge"))],
    order=10))

N.append(node("c6_pursuit", "c6", "main", T("长坂追击", "The Pursuit at Changban"), "literal", T("第41回", "Ch. 41"),
    T("长坂坡上，一员白袍将抱着婴孩，在你们的阵里杀进杀出，所向披靡。曹操在山顶看着，问：『那是谁？』",
      "On the slope at Changban, a general in a white robe with an infant strapped to his chest cuts through your lines again and again. From the hilltop Cao Cao asks, 'Who is that?'"),
    [choice("alive", "strategy", T("答：『常山赵子龙。此人只可活捉，不可射杀。』", "Answer: 'Zhao Zilong of Changshan. Take him alive; don't shoot him.'"),
            T("曹操点头，急令传报：『如赵云到，不许放冷箭，只要捉活的。』赵云就这样一路杀了出去。曹操望着他的背影：『好一员将。』",
              "Cao nods and sends word down the lines: 'If Zhao Yun comes your way, no arrows—take him alive.' And so Zhao Yun fights his way out. Cao watches him go. 'What a general.'"),
            [rel("caocao", "regard", 1)]),
     choice("shoot", "dilemma", T("劝曹操下令放箭：这一个人能抵一支军队。", "Urge Cao to order the archers to shoot: this one man is worth an army."),
            T("曹操犹豫了一下：『这样的人，杀了可惜。』他还是下令捉活的。赵云冲了出去。曹操看了你一眼，没说什么。",
              "Cao hesitates. 'A man like that—it would be a waste to kill him.' He orders him taken alive. Zhao Yun breaks out. Cao glances at you and says nothing."),
            [rel("caocao", "regard", -1), add("renown.cunning")]),
     choice("gap", "dilemma", T("借口查看后军，悄悄让开一条路，放刘备的家眷过去。", "Make an excuse to inspect the rear and quietly open a gap for Liu Bei's people."),
            T("几辆车从你让开的缺口里逃了出去。没有人看见——你希望没有人看见。", "A few carts escape through the gap you've opened. No one saw—you hope no one saw."),
            [setv("flag.secret_mercy"), rel("liubei", "trust", 1), add("renown.loyal")], echo=["e_mercy"])],
    when=CAO,
    quote=T("（曹操传令各处）「如赵云到，不许放冷箭，只要捉活的。」", "(Cao Cao's order to every unit) \"If Zhao Yun comes, no stray arrows. Take him alive.\""),
    callbacks=[cb("e_forged", T("你想起徐庶。他也在刘备的队伍里吗？", "You think of Xu Shu. Is he in Liu Bei's column too?"), F("flag.forged_letter")),
               cb("e_stay", T("远处是刘备的旗号。七年前，你本该在那面旗下面。", "In the distance fly Liu Bei's banners. Seven years ago you would have been under them."), CAO)],
    order=10))

# ================================================================== C7 赤壁
N.append(node("c7_arrows", "c7", "side", T("草船借箭", "Borrowing Arrows"), "literal", T("第46回", "Ch. 46"),
    T("周瑜要诸葛亮十天造十万支箭，诸葛亮说三天就够。第三天夜里，大雾漫江，他请鲁肃和你上船喝酒。",
      "Zhou Yu demands a hundred thousand arrows in ten days; Zhuge Liang says three days will do. On the third night thick fog covers the river, and he invites Lu Su and you aboard to drink."),
    [choice("drink", "expression", T("陪他饮酒，听北岸箭如雨下。", "Drink with him and listen to the arrows rain down from the north bank."),
            T("二十条草船靠近曹营擂鼓呐喊。曹军不敢出战，只管放箭。天亮收船，船两边插满了箭。诸葛亮举杯：『子衡今夜不慌，难得。』",
              "Twenty straw-lined boats close on Cao's camp with drums and shouting. Cao's men won't come out; they just shoot. At dawn the boats pull back bristling with arrows. Zhuge Liang raises his cup. 'You kept calm tonight, Ziheng. That's rare.'"),
            [rel("zhuge", "respect", 1)]),
     choice("tell_lusu", "dilemma", T("先把计策悄悄告诉鲁肃，免得他吓坏。", "Quietly explain the plan to Lu Su first, so he doesn't panic."),
            T("鲁肃松了一口气，转身却把话告诉了周瑜。周瑜对诸葛亮更加忌惮。诸葛亮看你的眼神多了一分探究：『这条计，我对谁都没说过。』",
              "Lu Su is relieved—and then tells Zhou Yu, who grows warier still of Zhuge Liang. Zhuge Liang studies you more closely. 'I never told anyone this plan.'"),
            [add("uncanny"), rel("zhuge", "wary", 1)], foresight=True)],
    when=ALL(LIU, NF("flag.wounded")), salience=1, order=1))

N.append(node("c7_letter", "c7", "side", T("江上来信", "A Letter Across the River"), "free", T("原创人物", "original character"),
    T("一封信穿过两军的封锁送到你手里：温芷随曹军南下了，在乌林后营给病兵配药。信里说北兵晕船，丞相在想办法让船稳下来。末尾一句：『江上风大，你多穿些。』",
      "A letter slips through both armies' lines to you: Wen Zhi has come south with Cao's army and is mixing medicine for the sick at the rear camp at Wulin. Northern soldiers are seasick, she writes, and the Chancellor is looking for a way to steady the boats. The last line: 'It's windy on the river. Dress warmly.'"),
    [choice("warn", "dilemma", T("回信：『冬至以后，离开水寨，越远越好。』", "Write back: 'After the solstice, get away from the river camp. As far as you can.'"),
            T("你没法解释为什么。回信只有一个字：『好。』", "You can't explain why. Her reply is a single word: 'Yes.'"),
            [setv("flag.wenzhi_warned"), add("uncanny"), rel("wenzhi", "intimacy", 1)], foresight=True, echo=["e_warned"]),
     choice("use", "strategy", T("回信请她多写些曹营的事。", "Write back asking her to tell you more about Cao's camp."),
            T("她又写来两封，第三封没有来。你把信里的消息交给了诸葛亮，他说很有用。", "She writes twice more; the third letter never comes. You pass what she wrote to Zhuge Liang, who says it's very useful."),
            [setv("flag.wenzhi_used"), rel("wenzhi", "trust", -2), rel("liubei", "trust", 1), rel("zhuge", "respect", 1), add("renown.cunning")], echo=["e_used"]),
     choice("care", "expression", T("只回一句：『你也是。』", "Write back just: 'You too.'"),
            T("信送出去了。你不知道她能不能收到。", "The letter goes out. You don't know if it will reach her."), [rel("wenzhi", "intimacy", 1)])],
    when=ALL(LIU, ANY(F("flag.promise_wenzhi"), F("flag.pass_from_wenzhi"), R("wenzhi", "intimacy", ">=", 2))), salience=3,
    callbacks=[cb("e_promise", T("你想起药圃里那包止血散，到现在还没用完。", "You think of the wound powder from the herb garden. You still haven't used it all."), F("flag.promise_wenzhi")),
               cb("e_wenzhi_spy", T("她说过只听不偷。这一封，她什么都没偷，只是在担心你。", "She said she'd listen, not steal. This letter steals nothing. She's just worried about you."), F("flag.asked_wenzhi"))],
    order=2))
N[-1]["mood"] = ROMANCE

N.append(node("c7_phoenix", "c7", "side", T("凤雏的去向", "Where the Phoenix Goes"), "functional", T("第47回", "Ch. 47"),
    T("诸葛亮和周瑜都定了火攻。问题是：曹操的船分散着，一把火烧不了几条。得有人让曹操自己把船连起来。原本该做这件事的人，现在坐在你对面喝茶——庞统。",
      "Zhuge Liang and Zhou Yu have both settled on fire. The trouble is that Cao's ships are spread out; one fire won't catch many. Someone has to get Cao to chain them together himself. The man who should have done it is sitting across from you, drinking tea: Pang Tong."),
    [choice("send", "strategy", T("请庞统诈投曹营，献连环计。", "Ask Pang Tong to defect to Cao in pretense and offer the chain plan."),
            T("庞统笑道：『我本来就想去看看曹孟德。』几天后，曹营的大船三十一排、五十一排，用铁环连在了一起。",
              "Pang Tong laughs. 'I've been wanting a look at Cao Mengde anyway.' A few days later Cao's big ships are linked in rows of thirty and fifty with iron rings."),
            [add("renown.cunning")], resolve=[("d_lianhuan", "transform")]),
     choice("seasick", "dilemma", T("不必派人：北兵晕船，曹操自己会想到把船连起来。", "No need to send anyone: his northerners are seasick. Cao will think of chaining the ships himself."),
            T("诸葛亮看了你很久：『你怎么知道？』十天后探马来报：曹操听了蔡瑁的建议，用铁环把大船连在了一起。庞统留在了刘备身边。",
              "Zhuge Liang looks at you a long time. 'How would you know?' Ten days later scouts report that, on Cai Mao's advice, Cao has chained his big ships together. Pang Tong stays with Liu Bei."),
            [add("uncanny"), rel("zhuge", "wary", 1)], foresight=True, resolve=[("d_lianhuan", "reroute")]),
     choice("go_self", "dilemma", T("你自己过江，去曹营献这条计。", "Cross the river yourself and offer Cao the plan."),
            T("你在曹营待了五天，曹操听你讲连船之妙，抚掌大笑。离开那天，你在后营门口远远看见一个背药箱的身影。",
              "You spend five days in Cao's camp. Cao listens to you explain the virtues of chained ships and claps with delight. On the day you leave, you glimpse from the rear gate a distant figure carrying a medicine chest."),
            [add("renown.cunning", 2), rel("caocao", "regard", 1)], req=NF("flag.wounded"), hint=T("需要伤已痊愈", "Needs your wound to have healed"),
            resolve=[("d_lianhuan", "transform")])],
    when=ALL(LIU, F("flag.pangtong_joined")), salience=4,
    callbacks=[cb("e_pangtong", T("庞统放下茶杯：『是你把我早拉进来的。这件事，你说怎么办？』", "Pang Tong sets down his cup. 'You brought me in early. So—what do we do about this?'"), F("flag.pangtong_joined"))],
    order=3))

N.append(node("c7_fire", "c7", "main", T("火烧赤壁", "Fire at Red Cliffs"), "literal", T("第49回", "Ch. 49"),
    T("十一月二十日，东南风起。黄盖的二十条火船直冲曹营，连在一起的战船一条接一条烧起来。江面红了半边天。",
      "The twentieth day of the eleventh month: the southeast wind rises. Huang Gai's twenty fire ships ram straight into Cao's fleet, and the chained warships catch one after another. Half the sky over the river turns red."),
    [choice("row", "dilemma", T("趁乱驾一条小船，去乌林后营接温芷。", "Take a small boat in the chaos and go to the rear camp at Wulin for Wen Zhi."),
            [P(T("乌林后营已经空了一半。你在江边找到她时，她正背着药箱等船。『我就知道你会来，』她说，『你信里那个字写得太急。』",
                 "The rear camp at Wulin is half empty already. When you find her on the bank she's waiting for a boat with her medicine chest. 'I knew you'd come,' she says. 'Your handwriting in that letter was too rushed.'"), F("flag.wenzhi_warned")),
             P(T("后营已经烧起来了。你在烟里喊她的名字，嗓子都喊哑了，最后在江边一条破船底下找到她。她的手烧伤了，还抱着药箱。",
                 "The rear camp is already burning. You shout her name through the smoke until your voice gives out, and finally find her under a wrecked boat on the bank, her hands burned, still clutching her medicine chest."), NF("flag.wenzhi_warned")),
             P(T("回到南岸时，仗已经打完了。刘备问你去了哪里，你没有回答。", "By the time you're back on the south bank, the battle is over. Liu Bei asks where you went. You don't answer."))],
            [setv("flag.wenzhi_with_you"), rel("liubei", "trust", -1), rel("wenzhi", "intimacy", 2), add("deviation")], echo=["e_row"],
            req=ANY(F("flag.wenzhi_warned"), R("wenzhi", "intimacy", ">=", 3)), hint=T("需要与温芷足够亲近", "Needs to be close enough to Wen Zhi")),
     choice("ambush", "strategy", T("留在诸葛亮身边，帮他调度追击的伏兵。", "Stay with Zhuge Liang and help him deploy the ambushes."),
            T("诸葛亮一道一道发令：赵云去乌林，张飞去葫芦口……最后才看向关羽。", "Zhuge Liang gives his orders one by one: Zhao Yun to Wulin, Zhang Fei to Hulu Pass… and only at the end does he look at Guan Yu."),
            [rel("zhuge", "respect", 1)]),
     choice("watch", "expression", T("站在南岸，看这一把火。", "Stand on the south bank and watch the fire."),
            T("火烧了一夜。你知道史书会怎么写这一夜，但亲眼看见，还是不一样。", "It burns all night. You know how the histories will tell it, but seeing it is different."))],
    when=LIU,
    on_enter=[{"when": ALL(F("flag.pangtong_joined"), DEBT("d_lianhuan")),
               "text": T("你没顾上庞统的事。好在北兵晕船，蔡瑁出了主意，曹操自己用铁环把船连了起来。", "You never dealt with the Pang Tong question. As luck would have it, the northerners were seasick, Cai Mao made a suggestion, and Cao chained his ships together himself."),
               "resolve": [["d_lianhuan", "reroute"]]}],
    callbacks=[cb("e_pangtong", T("庞统站在你旁边看着火光：『这把火，有我一分。』", "Pang Tong stands beside you watching the flames. 'Part of this fire is mine.'"), ALL(F("flag.pangtong_joined"), DEBT("d_lianhuan", "transform"))),
               cb("e_warned", T("你望着乌林的方向。她走了没有？", "You look toward Wulin. Did she get out?"), F("flag.wenzhi_warned")),
               cb("e_mi", T("糜夫人派人送来一件夹袄，说是给子衡挡江风。", "Lady Mi sends over a padded jacket—'to keep the river wind off Ziheng.'"), F("flag.mi_saved")),
               cb("e_xushu", T("徐庶站在船头，脸被火光照得通红：『我娘还在北边。』", "Xu Shu stands at the bow, his face red in the firelight. 'My mother is still in the north.'"), F("flag.xushu_stayed")),
               cb("e_pangtong", T("庞统看着火光：『这把火没用上我。也好。』", "Pang Tong watches the flames. 'This fire didn't need me. Just as well.'"), ALL(F("flag.pangtong_joined"), DEBT("d_lianhuan", "reroute"))),
               cb("e_promise", T("你摸了摸袖子里那包止血散。乌林就在火的那一边。", "You feel the packet of wound powder in your sleeve. Wulin is on the other side of the fire."), F("flag.promise_wenzhi")),
               cb("e_used", T("你想起那封没有来的第三封信。", "You think of the third letter that never came."), F("flag.wenzhi_used"))],
    order=10))

N.append(node("c7_chain", "c7", "main", T("连环", "The Chain"), "literal", T("第47–48回", "Ch. 47–48"),
    T("庞统来献连环计：用铁环把大船连起来，北兵就不晕了。曹操大喜，众谋士都说好，只有程昱开口。",
      "Pang Tong offers his chain plan: link the big ships with iron rings and the northern soldiers will stop being sick. Cao Cao is delighted and his advisers all agree. Only Cheng Yu speaks up."),
    [choice("second", "dilemma", T("附和程昱：『冬至前后，常有东南风。』", "Back Cheng Yu: 'Around the solstice there's often a southeast wind.'"),
            T("曹操笑了：『你也学程仲德？』但他还是准你留下二十条船不连锁，泊在下游。", "Cao laughs. 'Now you're imitating Cheng Zhongde?' But he lets you keep twenty ships unchained, moored downstream."),
            [add("uncanny"), setv("flag.cao_reserve"), add("deviation")], foresight=True, echo=["e_reserve"]),
     choice("agree", "strategy", T("附和丞相：北兵能站稳，比什么都要紧。", "Back the Chancellor: getting the northerners on their feet matters more than anything."),
            T("曹操很高兴，赏了你一匹马。", "Cao is pleased and gives you a horse."), [rel("caocao", "regard", 1)]),
     choice("wenzhi", "dilemma", T("什么也不说，回营让温芷把病兵和药都搬到岸上。", "Say nothing. Go back and tell Wen Zhi to move the sick and the medicine ashore."),
            T("温芷看着你：『你知道什么？』你说：『什么都不知道。搬吧。』", "Wen Zhi looks at you. 'What do you know?' 'Nothing,' you say. 'Just move them.'"),
            [setv("flag.wenzhi_warned"), add("uncanny"), rel("wenzhi", "intimacy", 1)], foresight=True, echo=["e_warned"],
            req=R("wenzhi", "intimacy", ">=", 2), hint=T("需要与温芷足够亲近", "Needs to be close enough to Wen Zhi"))],
    when=CAO,
    quote=T("程昱曰：「船皆连锁，固是平稳；但彼若用火攻，难以回避。不可不防。」……操曰：「凡用火攻，必藉风力。方今隆冬之际，但有西风北风，安有东风南风耶？」",
            "Cheng Yu said: \"Chained ships are steady, yes—but if they use fire we'll have no escape. We must guard against it.\" … Cao replied: \"Fire depends on the wind. In the depth of winter there is only west wind and north wind. Where would an east or south wind come from?\""),
    callbacks=[cb("e_forged", T("庞统经过你身边，低声说：『徐元直托我问候你。』你的手抖了一下。", "Passing you, Pang Tong murmurs, 'Xu Yuanzhi sends his regards.' Your hand trembles."), F("flag.forged_letter")),
               cb("e_angelica", T("温芷把一片当归塞进你衣襟：『记得回家。』", "Wen Zhi tucks a slice of angelica into your collar. 'Remember to come home.'"), F("flag.wenzhi_together"))],
    order=10))

# ================================================================== C8 华容
N.append(node("c8_huarong", "c8", "main", T("华容道", "The Huarong Road"), "literal", T("第49–50回", "Ch. 49–50"),
    T("诸葛亮派关羽去守华容道。关羽当众立下军令状：若放走曹操，愿依军法。散帐后，刘备低声说：『吾弟义气深重，若曹操果然投华容道去时，只恐端的放了。』",
      "Zhuge Liang sends Guan Yu to hold the Huarong road, and Guan Yu swears before everyone to forfeit his life if Cao escapes. Afterwards Liu Bei says quietly, 'My brother has a deep sense of honor. If Cao really comes by Huarong, I fear he'll let him go.'"),
    [choice("vouch", "dilemma", T("替关羽作保：若他放了曹操，你与他同罪。", "Vouch for Guan Yu: if he lets Cao go, you share his punishment."),
            [P(T("关羽在华容道等到了曹操。曹操只剩三百多骑，人人带伤。他提起当年的恩情，关羽长叹一声，把马头拨开了。",
                 "Guan Yu waits on the Huarong road, and Cao comes—three hundred riders left, every one of them wounded. Cao speaks of old kindnesses. Guan Yu sighs and turns his horse aside.")),
             P(T("回营后诸葛亮要斩关羽，你跪在关羽身边。刘备求情，诸葛亮便收了令。关羽扶你起来的时候，手很重。",
                 "Back in camp Zhuge Liang orders Guan Yu executed, and you kneel beside him. Liu Bei pleads, and Zhuge Liang withdraws the order. When Guan Yu helps you up, his grip is heavy."))],
            [setv("flag.vouched_guan"), rel("guanyu", "owes", 2), rel("guanyu", "respect", 1), add("renown.loyal")]),
     choice("go_with", "strategy", T("请求随关羽同去华容道监军。", "Ask to go to Huarong with Guan Yu as overseer."),
            [P(T("华容道上，曹操认出了你。", "On the Huarong road, Cao Cao recognizes you.")),
             P(T("『土山三约的执笔人也在。云长，我守了约。』", "'The man who wrote the three terms is here too. Yunchang, I kept my word.'"), F("flag.drafted_terms")),
             P(T("『青梅亭上的书生，你如今替谁说话？』", "'The scholar from the plum pavilion. Whose side are you speaking for now?'"), F("flag.spoke_at_plum")),
             P(T("关羽看了你一眼。你点了点头——或者你只是没有摇头。关羽拨开了马头。", "Guan Yu looks at you. You nod—or perhaps you only fail to shake your head. Guan Yu turns his horse aside.")),
             P(T("回营复命时，诸葛亮只问了一句：『你点头了？』你没有回答。他也没再问。", "When you report back, Zhuge Liang asks only, 'Did you nod?' You don't answer. He doesn't ask again."))],
            [setv("flag.at_huarong"), rel("guanyu", "owes", 1), rel("zhuge", "wary", 1)],
            req=R("zhuge", "respect", ">=", 3), hint=T("需要诸葛亮的敬重 ≥ 3", "Needs Zhuge Liang's respect ≥ 3")),
     choice("warn_wenzhi", "dilemma", T("托一个渔夫给曹营的温芷送一句话：走华容道，别走大路。", "Pay a fisherman to take Wen Zhi a message in Cao's camp: take the Huarong road, not the main road."),
            T("你不知道话有没有送到。很久以后你才听说：曹军残部走华容道时，后队有个背药箱的女子，一路给伤兵包扎。",
              "You never learn whether the message arrived. Much later you hear that when Cao's remnants came through Huarong, a woman with a medicine chest at the rear of the column bandaged the wounded all the way."),
            [setv("flag.wenzhi_safe"), rel("wenzhi", "intimacy", 1)],
            req=ALL(NF("flag.wenzhi_with_you"), R("wenzhi", "intimacy", ">=", 2)), hint=T("需要与温芷足够亲近，且她仍在曹营", "Needs closeness with Wen Zhi, and for her to still be in Cao's camp")),
     choice("silent", "expression", T("什么也不说。", "Say nothing."),
            T("关羽在华容道放走了曹操。回营后诸葛亮要斩他，刘备求情才免了。一切都和后来说书人讲的一样。",
              "Guan Yu lets Cao go on the Huarong road. Back in camp Zhuge Liang orders his execution, and only Liu Bei's pleading spares him. Everything happens just as the storytellers will tell it."))],
    when=LIU,
    quote=T("孔明曰：「亮夜观乾象，操贼未合身亡。留这人情，教云长做了，亦是美事。」", "Zhuge Liang said: \"I have watched the heavens at night. Cao is not fated to die yet. Let Guan Yu repay his debt—that too is a fine thing.\""),
    callbacks=[cb("e_terms", T("关羽出帐前对你说：『土山那三条是你写的。曹公守了约。』他没有说下去。", "On his way out, Guan Yu says to you, 'You wrote those three terms on the hill. Lord Cao kept them.' He leaves it there."), F("flag.drafted_terms")),
               cb("e_yi", T("关羽说：『你问过我什么是义。这一回，我也不知道答案。』", "Guan Yu says, 'You once asked me what righteousness is. This time I don't know the answer either.'"), F("flag.asked_yi")),
               cb("e_aside", T("诸葛亮布置完，特意看了你一眼，像是在等你开口，又像是在防你开口。", "When his orders are done, Zhuge Liang gives you a deliberate look—as if waiting for you to speak, or guarding against it."), F("flag.aside_zhuge")),
               cb("e_abandon", T("刘备看着你：『长坂上你劝我弃民。今天你又要劝我什么？』", "Liu Bei looks at you. 'At Changban you told me to abandon the people. What will you tell me today?'"), F("flag.abandon_advice")),
               cb("e_row", T("温芷在帐后给伤兵换药，抬头看了你一眼。", "Behind the tent, Wen Zhi is changing a wounded man's dressing. She looks up at you."), F("flag.wenzhi_with_you")),
               cb("e_promise", T("你摸了摸袖子里那包止血散。", "You touch the packet of wound powder in your sleeve."), ALL(F("flag.promise_wenzhi"), NF("flag.wenzhi_with_you")))],
    order=10))

N.append(node("c8_cao", "c8", "main", T("华容道·曹营", "Huarong, from Cao's Side"), "literal", T("第50回", "Ch. 50"),
    T("曹操带着残兵往华容道逃，人马都饿得站不住。转过山口，一彪人马拦住去路，为首的是关羽。",
      "Cao Cao flees by the Huarong road with what's left of his army, men and horses half-starved. Around a bend a troop blocks the way, and at its head is Guan Yu."),
    [choice("plead", "dilemma", T("你上前，求关羽念旧日情分。", "Step forward and ask Guan Yu to remember old friendships."),
            [P(T("『土山三约，是我写，丞相守。』你说，『将军也守一个吧。』", "'I wrote the three terms on that hill, and the Chancellor kept them,' you say. 'Keep one for us, General.'"), F("flag.drafted_terms")),
             P(T("关羽沉默良久，拨开马头，挥手让部下散开。曹操走过去的时候，关羽没有看他，看的是你。", "Guan Yu is silent a long time, then turns his horse aside and waves his men apart. As Cao passes, Guan Yu doesn't look at him. He looks at you."))],
            [setv("flag.pleaded_guan"), rel("caocao", "regard", 2)],
            req=R("guanyu", "respect", ">=", 3), hint=T("需要关羽的敬重 ≥ 3", "Needs Guan Yu's respect ≥ 3")),
     choice("cao_pleads", "strategy", T("劝曹操亲自去说，提起当年的恩情。", "Urge Cao to speak to him himself and recall old kindnesses."),
            T("曹操上前，说起当年五关斩将、他没有追究的事。关羽长叹一声，放他们过去了。", "Cao rides forward and reminds Guan Yu how he never punished him for the generals killed at the five passes. Guan Yu sighs heavily and lets them through."),
            [rel("caocao", "regard", 1)]),
     choice("draw", "expression", T("拔剑，站到曹操前面。", "Draw your sword and stand in front of Cao."),
            T("你的剑在发抖。关羽看着你，像看一个孩子：『收起来吧。』他还是放了你们。", "Your sword is shaking. Guan Yu looks at you as if at a child. 'Put it away.' He lets you all through anyway."),
            [rel("caocao", "regard", 1), add("renown.loyal")])],
    when=CAO,
    quote=T("操……欠身谓云长曰：「将军别来无恙？」云长亦欠身答曰：「关某奉军师将令，等候丞相多时。」", "Cao bowed slightly to Guan Yu: \"General, have you been well since we parted?\" Guan Yu bowed in return. \"By the strategist's orders, I have been waiting for you a long time, Chancellor.\""),
    callbacks=[cb("e_reserve", T("下游那二十条船救出了三千多人。曹操回头看了你一眼：『子衡那天说的，是真的。』", "The twenty ships downstream saved over three thousand men. Cao glances back at you. 'What you said that day was true.'"), F("flag.cao_reserve")),
               cb("e_warned", T("温芷就在后队，药箱一件没丢。", "Wen Zhi is at the rear of the column, not a single medicine chest lost."), F("flag.wenzhi_warned")),
               cb("e_mercy", T("关羽看见你，眼神动了一下：『长坂上那个缺口，是你开的？』", "Guan Yu sees you and something moves in his face. 'That gap at Changban—was that you?'"), F("flag.secret_mercy")),
               cb("e_terms", T("关羽看见你：『你也在。』", "Guan Yu sees you. 'You're here too.'"), F("flag.drafted_terms")),
               cb("e_stay", T("关羽看着你，说的还是那四个字：『人各有志。』", "Guan Yu looks at you and says the same words as before: 'Every man chooses his own road.'"), CAO),
               cb("e_angelica", T("你回头看了一眼后队。温芷还在。", "You glance back at the rear of the column. Wen Zhi is still there."), F("flag.wenzhi_together"))],
    order=10))

# ------------------------------------------------------------------ v1.2: night talks, crises, extra foresight
import talks
talks.extend(N, VARS, ECHOES, CHARS)
import reactions
for _c, _r in reactions.REACT.items():
    CHARS[_c]["romance"] = _r["romance"]; CHARS[_c]["react"] = _r["react"]
import speech
for _c, _r in speech.EXTRA_REACT.items(): CHARS[_c]["react"].update(_r)
reactions.PATTERNS.update(speech.EXTRA_PATTERNS)
SPEECH_ENDINGS = {}
speech.extend(N, VARS, CHARS, SPEECH_ENDINGS)
for _c, _o in speech.OPENERS.items(): CHARS[_c]["openers"] = _o
import flare
flare.extend(N, VARS, CHARS, SPEECH_ENDINGS)

# ------------------------------------------------------------------ endings (each group shows its first matching fragment; "all" groups show every match)
def frag(id, text, when=None, mood=None):
    d = {"id": id, "text": text}
    if when: d["when"] = when
    if mood: d["mood"] = mood
    return d
ENDINGS = [
    {"id": "g_side", "title": T("归属", "Allegiance"), "fragments": [
        frag("exposed", T("你的名字后来出现在好几本笔记里，都在“异人”那一卷。至于赤壁，你是在家乡听说的——和你梦见的一模一样。", "Your name later turns up in several miscellanies, always in the chapter on strange men. As for Red Cliffs, you hear about it back home—exactly as you dreamed it."), ALL(F("flag.exiled"), F("flag.exposed"))),
        frag("left", T("你带着一匹马离开了。后来的事，你是从说书人嘴里听来的。", "You left with a horse and little else. You heard the rest of the story from the storytellers."), F("flag.exiled")),
        frag("liu", T("你仍在刘备帐下，随他南取荆州。", "You remain in Liu Bei's service and follow him south to take Jingzhou."), LIU),
        frag("cao", T("你随曹操北还许都，名字写进了丞相府的名册。", "You return north to Xuchang with Cao Cao, your name entered in the Chancellor's rolls."), CAO)]},
    {"id": "g_lord", "title": T("主公", "Your Lord"), "fragments": [
        frag("liu_high", T("刘备说：『孔明是我的水，子衡是我的井。』这话传出去被人笑了很久，你却记了一辈子。", "Liu Bei says, 'Kongming is my river; Ziheng is my well.' People laugh at that for years. You remember it all your life."), ALL(LIU, R("liubei", "trust", ">=", 10))),
        frag("liu_mid", T("刘备敬重你，遇事会问你。但你知道，最后拿主意的人已经是诸葛亮了。", "Liu Bei respects you and asks your opinion. But you know the man who decides is Zhuge Liang now."), ALL(LIU, R("liubei", "trust", ">=", 7))),
        frag("liu_low", T("刘备待你始终客气。客气，就是隔着一层。", "Liu Bei is always courteous to you. Courtesy is a kind of distance."), LIU),
        frag("cao_high", T("曹操把你列为心腹谋臣，与程昱、荀攸同席。", "Cao Cao counts you among his closest advisers, seated with Cheng Yu and Xun You."), ALL(CAO, R("caocao", "regard", ">=", 8))),
        frag("cao_low", T("曹操用你，也防你。他从没忘记你是从刘备那里来的。", "Cao Cao uses you, and watches you. He never forgets you came from Liu Bei."), CAO)]},
    {"id": "g_name", "title": T("名声", "Your Name"), "fragments": [
        frag("uncanny", T("坊间传说你能知未来。敬你的人叫你『先生』，怕你的人叫你『妖人』。", "People say you can see the future. Those who respect you call you 'Master'; those who fear you call you a sorcerer."), V("uncanny", ">=", 3)),
        frag("loyal", T("人说子衡有古人之风，重义。", "People say Ziheng is a man of the old kind, who keeps faith."), V("renown.loyal", ">", "@renown.cunning")),
        frag("cunning", T("人说子衡多智，也说子衡心深。", "People say Ziheng is clever, and that his mind runs deep."), V("renown.cunning", ">", "@renown.loyal")),
        frag("none", T("史书里没有你的传，只有几处『或曰』。", "The histories give you no biography—just a few lines beginning 'some say.'"))]},
    {"id": "g_guanyu", "title": T("关羽", "Guan Yu"), "fragments": [
        frag("vouched", T("华容道之后，关羽每次喝酒都要先敬你一杯：『那一跪，我记着。』", "After Huarong, whenever Guan Yu drinks, he raises the first cup to you. 'I remember that you knelt.'"), F("flag.vouched_guan")),
        frag("pleaded", T("华容道上关羽让开的那条路，曹操记在了你的名下。", "Cao Cao credits you with the road Guan Yu opened at Huarong."), F("flag.pleaded_guan")),
        frag("owes", T("关羽一直记着欠你的那份情。他不常说，但每逢有人议论你，他就把刀往桌上一放。", "Guan Yu never forgets what he owes you. He rarely mentions it, but whenever someone talks about you behind your back, he sets his blade on the table."), R("guanyu", "owes", ">=", 1)),
        frag("respect", T("关羽敬你。在他那里，这比喜欢难得多。", "Guan Yu respects you. With him, that is much harder to earn than liking."), R("guanyu", "respect", ">=", 6)),
        frag("cold", T("关羽说起你，只有两个字：『可惜。』", "When Guan Yu speaks of you, it's one word: 'Pity.'"), R("guanyu", "respect", "<=", 0)),
        frag("plain", T("你和关羽，始终是点头之交。", "You and Guan Yu remain nodding acquaintances."))]},
    {"id": "g_zhuge", "title": T("诸葛亮", "Zhuge Liang"), "fragments": [
        frag("nod", T("那一句『你点头了？』，诸葛亮到最后也没有再问。", "Zhuge Liang never asks again whether you nodded."), ALL(LIU, F("flag.at_huarong"))),
        frag("wary", T("诸葛亮对你始终存着一分戒心。你知道得太多，又说不出是从哪里知道的。", "Zhuge Liang never quite lowers his guard with you. You know too much, and can't say how."), ALL(LIU, R("zhuge", "wary", ">=", 2))),
        frag("respect", T("诸葛亮出兵前，会把方略先给你看一遍。", "Before any campaign, Zhuge Liang shows you his plans first."), ALL(LIU, R("zhuge", "respect", ">=", 4))),
        frag("plain", T("诸葛亮与你相处融洽，却没有深交。", "You and Zhuge Liang get along, but never grow close."), LIU)]},
    {"id": "g_wenzhi", "title": T("温芷", "Wen Zhi"), "fragments": [
        frag("married", T("那一夜江边说出口的话，你们谁都没有收回。后来你们在公安城外成了亲，开了一间药铺，不问来人是哪一边的。", "Neither of you ever took back what was said by the river that night. Later you married outside Gong'an and opened an apothecary that never asked which side its patients were on."), ALL(F("flag.wenzhi_with_you"), F("flag.confessed")), ROMANCE),
        frag("with_you", T("温芷跟你回了南岸。她手上的疤一直没消。后来你们在公安城外开了一间药铺，晒药的竹匾你来翻。", "Wen Zhi comes back to the south bank with you. The scars on her hands never fade. Later the two of you open an apothecary outside Gong'an, and you turn the drying trays."), F("flag.wenzhi_with_you"), ROMANCE),
        frag("together", T("你和温芷在许都成了家。你在丞相府起草文书，她在药圃里晒当归。", "You and Wen Zhi make a home in Xuchang. You draft documents for the Chancellor; she dries angelica in the garden."), ALL(CAO, F("flag.wenzhi_together")), ROMANCE),
        frag("cao_saved", T("赤壁那一夜，后营的病兵一个没丢。温芷说，那天你叫她搬，是她这辈子听过最没道理、也最对的话。", "On the night of the fire, not one patient in the rear camp was lost. Wen Zhi says that when you told her to move them, it was the least reasonable and most correct thing she ever heard."), ALL(CAO, F("flag.wenzhi_warned"))),
        frag("used", T("温芷再没回过信。你后来才明白：她冒着性命写来的东西，被你当成了军报。", "Wen Zhi never writes again. Only later do you understand: what she risked her life to write, you treated as military intelligence."), F("flag.wenzhi_used")),
        frag("safe", T("温芷随曹军北还。每年冬至，你都会收到一包止血散，没有信。", "Wen Zhi goes north with Cao's army. Every year at the solstice a packet of wound powder arrives for you, with no letter."), ANY(F("flag.wenzhi_safe"), F("flag.wenzhi_warned"))),
        frag("far", T("你很久没有温芷的消息了。", "You haven't heard from Wen Zhi in a long time."))]},
    {"id": "g_lives", "title": T("因你而不同的人", "Lives You Changed"), "mode": "all", "fragments": [
        frag("xushu", T("徐庶没有北去。他的母亲被软禁在许都，母子再没见面，但都活着。", "Xu Shu never went north. His mother lives under guard in Xuchang; they never meet again, but both are alive."), F("flag.xushu_stayed")),
        frag("mi", T("糜夫人没有投井。阿斗长大后，叫你『子衡叔』。", "Lady Mi never threw herself into the well. When Adou grows up, he calls you Uncle Ziheng."), F("flag.mi_saved")),
        frag("kongxiu", T("东岭关的孔秀活了下来。说书人讲『过五关斩六将』时，你总想纠正：是五将。", "Kong Xiu of Dongling Pass survived. Whenever storytellers recite 'five passes, six generals,' you want to correct them: five."), F("flag.kongxiu_spared")),
        frag("pangtong", T("庞统早来了好几年。很久以后，你会想起一个叫落凤坡的地名，然后决定什么都不说。", "Pang Tong came years early. Long afterwards, a place called Fallen Phoenix Slope will cross your mind, and you will decide to say nothing."), F("flag.pangtong_joined")),
        frag("mercy", T("长坂坡上那个缺口，你到死都没有告诉曹操。", "You never tell Cao Cao about the gap at Changban, not to your dying day."), F("flag.secret_mercy")),
        frag("forged", T("徐母的灵位，你每年都去上一炷香。", "Every year you light incense before Xu Shu's mother's spirit tablet."), F("flag.forged_letter")),
        frag("reserve", T("下游那二十条船上的三千人，后来有很多成了你的兵。", "Many of the three thousand saved on those twenty ships later served under you."), F("flag.cao_reserve"))]},
    {"id": "g_history", "title": T("天下", "The Realm"), "fragments": [
        frag("far", T("说书人讲到这一段，总有几处讲不顺——那几处，都是你。", "When storytellers reach this part, a few places never quite fit. Those places are you."), V("deviation", ">=", 3)),
        frag("near", T("史书和演义大体如常，只在几个角落多了几行小字。", "The histories and the novel run much as they always did, with a few lines of small print added in the corners."), V("deviation", ">=", 1)),
        frag("same", T("后人读《三国》，找不到你的名字。你只是改变了一些人的一些日子。", "Later readers of the Three Kingdoms will never find your name. You only changed some days in some lives."))]},
]

# ------------------------------------------------------------------ art: scene + state layers (layers with "choice" switch on after that choice)
def lay(id, when=None, choice=None):
    d = {"id": id}
    if when: d["when"] = when
    if choice: d["choice"] = choice
    return d
ART = {
    "c1_guanyu": ("lamp", [], "xuchang"), "c1_wenzhi": ("herbs", [], "xuchang"), "c1_dongcheng": ("lamp", [lay("edict")], "xuchang"),
    "c1_plum": ("garden", [lay("storm")], "xuchang"),
    "c2_note": ("letter", [lay("packet")], "xuchang"), "c2_pretext": ("road", [], "xuchang"), "c2_xuchu": ("road", [lay("chase", NF("flag.fast_departure"))], "xiapi"),
    "c3_terms": ("hill", [lay("escape", choice="carry")], "xiapi"),
    "c4_horse": ("hall", [lay("horse")], "xuchang"), "c4_garden": ("herbs", [lay("two"), lay("romance")], "xuchang"),
    "c4_seal": ("hall", [lay("seal")], "xuchang"), "c4_yuan": ("camp", [], "jizhou"),
    "c5_letter": ("letter", [lay("seal")], "xinye"), "c5_mirror": ("mirror", [], "xinye"),
    "c5_cottage": ("snow", [lay("three"), lay("xushu", F("flag.xushu_stayed"))], "xinye"),
    "c5_spring": ("herbs", [lay("two"), lay("spring"), lay("romance")], "xuchang"), "c5_forge": ("letter", [lay("seal")], "xuchang"),
    "c6_slope": ("bridge", [lay("dust", choice="dust"), lay("rescue", choice="search")], "changban"),
    "c6_pursuit": ("slope", [lay("gap", choice="gap")], "changban"),
    "c7_arrows": ("fog", [lay("arrows")], "chibi"), "c7_letter": ("letter", [lay("window")], "xiakou"), "c7_phoenix": ("fog", [], "xiakou"),
    "c7_fire": ("fire", [lay("burning"), lay("fireships"), lay("camp_empty", F("flag.wenzhi_warned")), lay("camp_burning", NF("flag.wenzhi_warned")), lay("boat", choice="row")], "chibi"),
    "c7_chain": ("fire", [lay("reserve", choice="second"), lay("camp_empty", choice="wenzhi")], "chibi"),
    "c8_huarong": ("huarong", [lay("blocker"), lay("medic", F("flag.wenzhi_safe")), lay("medic", choice="warn_wenzhi")], "huarong"),
    "c2_campfire": ("campfire", [], "xiapi"), "c4_gucheng": ("campfire", [lay("wall")], "gucheng"), "c5_lamp": ("lamp", [], "xinye"),
    "c5_feast": ("hall", [], "xuchang"), "c8_river": ("riverbank", [lay("two")], "chibi"), "c8_vigil": ("campfire", [lay("blade")], "chibi"),
    "c8_north": ("road", [], "huarong"), "x_miheng": ("letter", [], None), "x_plum_rage": ("garden", [lay("storm")], None), "x_cao_rage": ("hall", [], None), "x_loose": ("lamp", [], None), "x_exposed": ("lamp", [], None), "x_cold_liu": ("hall", [], None), "x_cold_cao": ("hall", [], None),
    "c8_cao": ("huarong", [lay("blocker"), lay("medic", ANY(F("flag.wenzhi_warned"), F("flag.wenzhi_together")))], "huarong"),
}
PLACE_AFTER = {("c4_seal", "follow"): "gucheng", ("c4_seal", "pass"): "gucheng", ("c4_yuan", "*"): "gucheng", ("c7_fire", "*"): "chibi"}
for nid, (sc, layers, place) in ART.items():
    nd = next(n for n in N if n["id"] == nid)
    nd["art"] = {"scene": sc, "layers": layers}
    nd["place"] = place
    for c in nd["choices"]:
        pa = PLACE_AFTER.get((nid, c["id"])) or PLACE_AFTER.get((nid, "*"))
        if pa and pa != place: c["place"] = pa
assert all("art" in n for n in N), [n["id"] for n in N if "art" not in n]
# who is on stage (portraits under the scene title; expressions follow the relationship changes of the choice)
def cast(*ids, when=None): return [{"id": i, **({"when": when} if when else {})} for i in ids]
CAST = {
    "c1_guanyu": cast("guanyu"), "c1_wenzhi": cast("wenzhi"), "c1_dongcheng": cast("liubei"), "c1_plum": cast("caocao", "liubei"),
    "c2_note": cast("wenzhi"), "c2_pretext": cast("liubei"), "c2_xuchu": cast("liubei"), "c2_campfire": cast("guanyu"),
    "c3_terms": cast("guanyu"),
    "c4_horse": cast("caocao", "guanyu"), "c4_garden": cast("wenzhi"), "c4_seal": cast("guanyu", "caocao"), "c4_yuan": cast("liubei"), "c4_gucheng": cast("liubei"),
    "c5_letter": cast("wenzhi"), "c5_mirror": cast("liubei"), "c5_cottage": cast("zhuge", "liubei"), "c5_lamp": cast("zhuge"), "c5_spring": cast("wenzhi"), "c5_forge": cast("caocao"), "c5_feast": cast("caocao"),
    "c6_slope": cast("liubei"), "c6_pursuit": cast("caocao"),
    "c7_arrows": cast("zhuge"), "c7_letter": cast("wenzhi"), "c7_phoenix": cast("zhuge"), "c7_fire": cast("zhuge") + cast("wenzhi", when=F("flag.wenzhi_with_you")), "c7_chain": cast("caocao") + cast("wenzhi", when=R("wenzhi", "intimacy", ">=", 2)),
    "c8_huarong": cast("guanyu", "zhuge"), "c8_cao": cast("guanyu", "caocao"), "c8_river": cast("wenzhi"), "c8_vigil": cast("guanyu"), "c8_north": cast("caocao"),
    "x_exposed": cast("liubei", "zhuge", when=LIU) + cast("caocao", when=CAO), "x_cold_liu": cast("liubei"), "x_cold_cao": cast("caocao"),
}
for nid, cs in CAST.items():
    next(n for n in N if n["id"] == nid)["cast"] = cs
TOPIC_MOOD = {("c2_campfire", "peach"): "warm", ("c2_campfire", "fear"): "sad", ("c2_campfire", "warn"): "surprised", ("c4_gucheng", "bitter"): "sad",
              ("c4_gucheng", "south"): "surprised", ("c5_lamp", "test"): "surprised", ("c5_lamp", "rival"): "warm", ("c5_feast", "guan"): "sad", ("c5_feast", "wind"): "cold",
              ("c8_river", "hands"): "sad", ("c8_river", "home"): "warm", ("c8_river", "confess"): "shy", ("c8_vigil", "regret"): "sad", ("c8_vigil", "fear"): "sad",
              ("c8_north", "common"): "cold", ("c8_north", "pride"): "surprised"}
for (nid, tid), m in TOPIC_MOOD.items():
    next(t for t in next(n for n in N if n["id"] == nid)["talk"]["topics"] if t["id"] == tid)["mood"] = m
# expression of the character a fragment is about
FRAG_FACE = {"g_lord": {"liu_high": ("liubei", "warm"), "liu_mid": ("liubei", "neutral"), "liu_low": ("liubei", "cold"), "cao_high": ("caocao", "warm"), "cao_low": ("caocao", "cold")},
             "g_guanyu": {"vouched": ("guanyu", "warm"), "pleaded": ("guanyu", "sad"), "owes": ("guanyu", "warm"), "respect": ("guanyu", "neutral"), "cold": ("guanyu", "cold"), "plain": ("guanyu", "neutral")},
             "g_zhuge": {"nod": ("zhuge", "surprised"), "wary": ("zhuge", "cold"), "respect": ("zhuge", "warm"), "plain": ("zhuge", "neutral")},
             "g_wenzhi": {"married": ("wenzhi", "shy"), "with_you": ("wenzhi", "warm"), "together": ("wenzhi", "shy"), "cao_saved": ("wenzhi", "warm"), "used": ("wenzhi", "cold"), "safe": ("wenzhi", "sad"), "far": ("wenzhi", "sad")}}

PORTRAIT_PROMPTS = {
    "liubei": T("水墨淡彩半身像，四十岁左右的汉室宗亲，面如冠玉，两耳垂肩，短须，小冠，青灰色交领长袍。表情：平静/温和/冷淡/忧伤/吃惊。", "Ink-wash bust portrait: an imperial kinsman around forty, fair face, very long earlobes, short beard, small crown, grey-green crossed-collar robe. Expressions: neutral / warm / cold / sad / surprised."),
    "guanyu": T("水墨淡彩半身像，面如重枣，丹凤眼，卧蚕眉，长髯过胸，绿头巾，绿袍。表情同上。", "Ink-wash bust portrait: face the deep red of a jujube, phoenix eyes, thick 'silkworm' brows, a beard past the chest, green headscarf and green robe. Same expressions."),
    "caocao": T("水墨淡彩半身像，丞相，细眼，长须，高冠，深红黑色官袍。表情同上。", "Ink-wash bust portrait: the Chancellor, narrow eyes, long thin beard, tall official hat, dark red-black robe. Same expressions."),
    "zhuge": T("水墨淡彩半身像，二十七岁，纶巾，白色鹤氅，手持羽扇，神情从容。表情同上。", "Ink-wash bust portrait: twenty-seven, silk scholar's cap, white crane-feather cloak, feather fan, composed. Same expressions."),
    "wenzhi": T("水墨淡彩半身像，原创人物：成年女医者，高髻，金簪，一朵梅花，浅蓝灰衣裙。表情同上，另加害羞。", "Ink-wash bust portrait, original character: an adult woman physician, high bun, gold hairpin, a plum blossom, pale blue-grey dress. Same expressions plus shy."),
}

# key moments: a large illustration after the choice (or talk topic)
CG = {("c1_plum", "*"): "thunder", ("c3_terms", "draft"): "terms", ("c7_fire", "row"): "fireboat",
      ("c8_huarong", "vouch"): "turn", ("c8_huarong", "go_with"): "turn", ("c8_huarong", "silent"): "turn",
      ("c8_cao", "*"): "turn", ("c8_river", "topic:confess"): "river"}
CG_CAPTION = {"thunder": T("惊雷", "Thunder"), "terms": T("三约", "Three Terms"), "fireboat": T("火中一舟", "A Boat Through the Fire"),
              "turn": T("拨马", "He Turns His Horse"), "river": T("说出口", "Said Aloud")}
for (nid, key), cgid in CG.items():
    nd = next(n for n in N if n["id"] == nid)
    if key.startswith("topic:"):
        next(t for t in nd["talk"]["topics"] if t["id"] == key[6:])["cg"] = cgid
    else:
        for c in nd["choices"]:
            if key == "*" or c["id"] == key: c["cg"] = cgid

# realm view of the map: who holds which province at each chapter (schematic; Eastern Han provinces, borders approximate)
_base = {"sili": "cao", "yan": "cao", "yu": "cao", "xu": "cao", "ji": "yuan", "qing": "yuan", "you": "yuan", "bing": "yuan",
         "jing": "liubiao", "yang": "sun", "yi": "liuzhang", "liang": "xiliang", "jiao": "shixie"}
def _ctl(**kw): d = dict(_base); d.update(kw); return d
_north = dict(ji="cao", qing="cao", you="cao", bing="cao")
REALM = {
    "note": T("疆界为示意，不是精确的历史地图", "Borders are schematic, not an exact historical map"),
    "provinces": {"liang": T("凉州", "Liang"), "bing": T("并州", "Bing"), "you": T("幽州", "You"), "ji": T("冀州", "Ji"), "qing": T("青州", "Qing"),
                  "sili": T("司隶", "Sili"), "yan": T("兖州", "Yan"), "yu": T("豫州", "Yu"), "xu": T("徐州", "Xu"), "jing": T("荆州", "Jing"),
                  "yang": T("扬州", "Yang"), "yi": T("益州", "Yi"), "jiao": T("交州", "Jiao")},
    "factions": {"cao": {"name": T("曹操", "Cao Cao"), "color": "#4f6688"}, "yuan": {"name": T("袁绍", "Yuan Shao"), "color": "#a58a3c"},
                 "liubei": {"name": T("刘备", "Liu Bei"), "color": "#4f7a58"}, "sun": {"name": T("孙氏", "the Suns"), "color": "#b0503a"},
                 "liubiao": {"name": T("刘表", "Liu Biao"), "color": "#7a5a8a"}, "liuzhang": {"name": T("刘璋", "Liu Zhang"), "color": "#8a6a4a"},
                 "xiliang": {"name": T("西凉诸将", "Western warlords"), "color": "#8c8a80"}, "shixie": {"name": T("士燮", "Shi Xie"), "color": "#a9a493"}},
    "control": {"c1": _ctl(), "c2": _ctl(xu=["cao", "liubei"]), "c3": _ctl(), "c4": _ctl(), "c5": _ctl(**_north),
                "c6": _ctl(jing="cao", **_north), "c7": _ctl(jing=["cao", "sun"], **_north), "c8": _ctl(jing=["cao", "sun"], **_north)},
    "captions": {"c1": T("建安四年：曹操挟天子居许都，袁绍据河北", "199: Cao Cao holds the Emperor at Xuchang; Yuan Shao holds the north"),
                 "c2": T("刘备离开许都，夺回徐州", "Liu Bei leaves Xuchang and retakes Xuzhou"),
                 "c3": T("曹操东征，徐州复归曹氏", "Cao Cao marches east and takes Xuzhou back"),
                 "c4": T("官渡前后：曹、袁对峙于河北与中原之间", "Around Guandu: Cao and Yuan face off across the Yellow River"),
                 "c5": T("建安十二年：曹操平定河北", "207: Cao Cao has conquered the north"),
                 "c6": T("刘琮举荆州降曹", "Liu Cong surrenders Jingzhou to Cao"),
                 "c7": T("赤壁：曹军南下，与孙、刘联军隔江相持", "Red Cliffs: Cao's army faces the Sun–Liu alliance across the river"),
                 "c8": T("赤壁之后：荆州成为三方必争之地，三分之势初现", "After Red Cliffs: Jingzhou is contested, and a three-way split begins to show")},
}

ENDING_ART = {"scene": "ending", "layers": [lay("two_boat", F("flag.wenzhi_with_you")), lay("home", F("flag.wenzhi_together")), lay("city", CAO),
              lay("lone", ALL(NF("flag.wenzhi_with_you"), NF("flag.wenzhi_together"))), lay("plum", F("flag.covered_liu")), lay("sail")]}
# prompts for replacing the code-drawn paintings with commissioned or generated art later (one per scene; layers listed so variants stay consistent)
ART_PROMPTS = {
    "garden": T("水墨淡彩，宽幅。许都后园，青梅枝从左上探入，远处城墙，右侧小亭中二人对坐煮酒，雷雨将至。图层：雷雨（闪电、雨丝）。", "Chinese ink wash with light color, wide banner. A walled garden in Xuchang: green-plum branches from the upper left, distant city wall, two men seated drinking in a small pavilion on the right, storm gathering. Layer: storm (lightning, rain)."),
    "lamp": T("夜，窗格内一灯如豆，一人跪坐读书，窗外竹影。图层：案上一道红色血诏。", "Night. Through a lattice window a single lamp, a seated man reading, bamboo shadows outside. Layer: a red silk edict on the desk."),
    "herbs": T("药圃，圆形月洞门，竹匾晒药，一名医女。图层：同行男子；春日落花；粉色花瓣（恋爱时刻）。", "Herb garden with a round moon gate, bamboo drying trays, a woman physician. Layers: a man beside her; spring blossoms; pink petals (romance moment)."),
    "road": T("平原大路，行军队列与红旗，远处许都城墙。图层：远处尘土中的追骑。", "A plain with a marching column and red banners, Xuchang's walls in the distance. Layer: pursuing riders in a dust cloud."),
    "letter": T("夜，烛光书案，信笺、毛笔、砚台。图层：药包；朱印；窗外江面火光。", "Night desk by candlelight: letter, brush, inkstone. Layers: medicine packet; red seal; river glow through a window."),
    "hill": T("土山被围，山顶一将与两位女眷，山下敌营红旗，一骑来劝降。图层：一骑从山后小路突围。", "A surrounded earthen hill: a general and two ladies on top, enemy tents with red flags below, a lone rider approaching to parley. Layer: a rider escaping down the back path."),
    "hall": T("厅堂内景，梁柱，门外天光。图层：梁上悬印、贴封条的箱笼；一匹赤红骏马。", "Hall interior, beams and pillars, daylight through the door. Layers: an official seal hanging from a beam and sealed chests; a red warhorse."),
    "camp": T("北方营寨，群山，蓝红旗帜林立。", "A northern army camp among mountains, forests of blue and red banners."),
    "mirror": T("竹林溪畔，隐士抚琴，二客远立。", "Bamboo grove by a stream, a recluse playing the zither, two visitors standing at a distance."),
    "snow": T("雪中茅庐，篱笆，门外数人立雪等候。图层：第四人（徐庶）。", "A thatched cottage in snow with a fence, several men waiting outside. Layer: a fourth man (Xu Shu)."),
    "bridge": T("长坂桥，一将横矛立马桥上，桥东树林，百姓奔逃。图层：林中尘土（疑兵）；白袍骑将救人。", "Changban bridge: a general with a spear on horseback on the bridge, woods to the east, fleeing civilians. Layers: dust in the woods (feint); a white-robed rider rescuing."),
    "slope": T("山坡上曹操与旌旗，坡下枪阵，一白袍将怀抱婴儿突围。图层：阵边缺口中逃出的车辆。", "Cao Cao and banners on a hilltop, spear ranks below, a white-robed general breaking through with an infant. Layer: carts escaping through a gap."),
    "fog": T("大雾江面，远岸营火。图层：插满箭的草船。", "Fog on the river, distant campfires. Layer: straw boats bristling with arrows."),
    "fire": T("赤壁夜江，铁索连舟。图层：火攻与红天；火船；后营空/后营起火；提灯小舟（接人）；下游未连锁的船。", "Night river at Red Cliffs, ships chained together. Layers: fire and red sky; fire ships; rear camp empty or burning; a small boat with a lantern (rescue); unchained ships downstream."),
    "huarong": T("华容道，两侧峭壁，泥泞小路，残兵队列，一将立马拦路。图层：背药箱的女子在队尾。", "Huarong road between cliffs, a muddy path, a column of defeated soldiers, a general blocking the way on horseback. Layer: a woman with a medicine chest at the rear."),
    "campfire": T("夜营篝火，帐篷剪影，二人对坐火边，火星飞起。图层：城楼（古城）；横在膝上的刀。", "A night camp: a fire with sparks, tent silhouettes, two men seated by the fire. Layers: a city wall (Gucheng); a blade across the knees."),
    "riverbank": T("战后夜江，水面漂着焦木，远处余火，江边一名女子洗药杵。图层：身旁一名男子。", "The river at night after battle: charred timbers drifting, distant embers, a woman washing a pestle at the water's edge. Layer: a man beside her."),
    "ending": T("尾声：晨江远山，红日。图层：两人同舟；江边茅屋炊烟；城郭；独立江岸；梅枝；远帆。", "Epilogue: river and mountains at dawn, red sun. Layers: two people in a boat; a cottage with smoke; city walls; a lone figure on the shore; plum branch; distant sail."),
}

for _g in ENDINGS:
    if _g["id"] in SPEECH_ENDINGS: _g["fragments"] = SPEECH_ENDINGS[_g["id"]] + _g["fragments"]
CAST["x_miheng"] = cast("caocao"); CAST["x_loose"] = cast("liubei", when=LIU) + cast("caocao", when=CAO)
CAST["x_plum_rage"] = cast("caocao", "liubei"); CAST["x_cao_rage"] = cast("caocao")
for _nid in ("x_miheng", "x_loose", "x_plum_rage", "x_cao_rage"): next(n for n in N if n["id"] == _nid)["cast"] = CAST[_nid]

CAMPAIGN = {
    "spec": "storydate.campaign/0.3",
    "id": "sanguo_strategist_v1",
    "title": T("三国·谋士", "Three Kingdoms: The Strategist"),
    "volume": T("卷一 · 许都至赤壁", "Volume I · Xuchang to Red Cliffs"),
    "rights": {"source": "《三国演义》（罗贯中，明代），公版", "quotes": "中文原文直接引用；英文为本项目自译", "original_characters": ["子衡（玩家）", "温芷"]},
    "player": {"name": T("子衡", "Ziheng")},
    "side_prompt": SIDE_PROMPT,
    "vars": VARS, "chars": CHARS, "dims": DIMS, "echoes": ECHOES, "debts": DEBTS,
    "chapters": CHAPTERS, "nodes": {n["id"]: n for n in N}, "endings": ENDINGS,
    "future_terms": [{"term": t, "from": c} for t, c in FUTURE],
    "ending_art": ENDING_ART, "art_prompts": ART_PROMPTS, "frag_face": FRAG_FACE, "portrait_prompts": PORTRAIT_PROMPTS, "cg_captions": CG_CAPTION, "realm": REALM, "react_patterns": reactions.PATTERNS, "commit_rules": speech.commit_rules(), "flash": flare.FLASH, "witness": flare.WITNESS,
    "sources": [{"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/supplement/ancient-books/62", "checked": "2026-10-20",
                 "note": "第21、25、35、36、38、41、42、48、49、50回引文逐字核对；张飞桥上喝语、华容道问候两处据此修正"}],
    "end_note": T("卷一终。卷二（荆州—入川）尚未开放。", "End of Volume I. Volume II (Jingzhou to Shu) is not yet open."),
}

if __name__ == "__main__":
    out = pathlib.Path(__file__).parent / "campaign.json"
    dump(CAMPAIGN, out)
    print("nodes", len(N), "->", out)
