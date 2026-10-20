"""三国·谋士 卷二（荆州与西川，第51–65回）campaign spec v0.3.

接着卷一：同名变量（关系、名声、剧情标记）由上一卷带来；没玩过卷一的玩家从“前情”开始。
原著引文只取公版原文，并已逐字核对（见 sources）；其余叙述和英文都是我们自己写的。
"""
import json, pathlib, sys
HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent))
from lib import *
import reactions, speech
from talks import topic, talk_node, PERSONA as PERSONA1
from asks import ans
import people_v2 as PP

V1 = json.loads((HERE.parent / "campaign.json").read_text())

def num(init, lo, hi, label, show=True, group=None, carry=True):
    d = {"type": "num", "init": init, "min": lo, "max": hi, "label": label, "show": show}
    if group: d["group"] = group
    if not carry: d["carry"] = False
    return d
def flag(label, carry=True):
    d = {"type": "flag", "init": False, "label": label}
    if not carry: d["carry"] = False
    return d
def R(c, d, op, v): return V(f"rel.{c}.{d}", op, v)
def I(c, k, op, v): return V(f"imp.{c}.{k}", op, v)
def DEBT(i, state="open"): return V(f"debt.{i}", "==", state)
NOT_CAO = V("track", "!=", "cao")
PREV_EARLY = F("prev.ended_early")

# ------------------------------------------------------------------ vars
VARS = {
    "track": {"type": "enum", "init": "liu", "values": ["liu", "cao"], "label": T("效力", "Serving")},
    "renown.loyal": num(0, 0, 10, T("名声·忠义", "Name for loyalty"), group="renown"),
    "renown.cunning": num(0, 0, 10, T("名声·权谋", "Name for cunning"), group="renown"),
    "uncanny": num(0, 0, 10, T("异名（先见被人察觉）", "Uncanny (foresight noticed)"), group="renown"),
    "deviation": num(0, 0, 30, T("偏离原著", "Departures from the novel"), show=False),
    "prev.ended_early": flag(T("卷一提前收场", "Volume I ended early")),
}
# what Volume I may hand over (read below); same names as in Volume I
for f, lab in {
    "flag.mi_saved": T("救下糜夫人", "Saved Lady Mi"), "flag.pangtong_joined": T("庞统早投刘备", "Pang Tong joined Liu Bei early"),
    "flag.wenzhi_with_you": T("赤壁夜接回温芷", "Brought Wen Zhi back on the night of the fire"), "flag.confessed": T("江边对温芷说出心意", "Told Wen Zhi how you feel by the river"),
    "flag.wenzhi_together": T("与温芷在许都成家", "Made a home with Wen Zhi in Xuchang"), "flag.wenzhi_safe": T("给温芷送了退路", "Sent Wen Zhi a way out"),
    "flag.wenzhi_warned": T("提醒温芷离开水寨", "Warned Wen Zhi to leave the river camp"), "flag.wenzhi_used": T("利用温芷打探军情", "Used Wen Zhi for intelligence"),
    "flag.vouched_guan": T("为关羽作保", "Vouched for Guan Yu"), "flag.pleaded_guan": T("在华容道求关羽", "Pleaded with Guan Yu at Huarong"),
    "flag.exposed": T("被当作妖人", "Branded a sorcerer"), "flag.mi_heng": T("步了祢衡的后尘", "Went the way of Mi Heng"),
}.items():
    VARS[f] = flag(lab)

CHARS = {k: dict(V1["chars"][k]) for k in ("liubei", "caocao", "guanyu", "zhuge", "wenzhi")}
CHARS["zhuge"].pop("from_chapter", None)
for k in CHARS: CHARS[k].pop("react", None); CHARS[k].pop("openers", None); CHARS[k].pop("heat", None)
CHARS.update(PP.NEW_CHARS)
DIMS = dict(V1["dims"]); DIMS.update(PP.NEW_DIMS)
for c, d in CHARS.items():
    for dim, (init, lo, hi) in d["dims"].items():
        VARS[f"rel.{c}.{dim}"] = {"type": "num", "init": init, "min": lo, "max": hi,
                                  "label": T(d["name"]["zh"] + "·" + DIMS[dim]["zh"], d["name"]["en"] + " · " + DIMS[dim]["en"]), "char": c, "dim": dim}
# impressions that this volume reads
for c, k, lab in [("guanyu", "offended", T("被冒犯", "Offended")), ("liubei", "offended", T("被冒犯", "Offended")), ("zhouyu", "offended", T("被冒犯", "Offended")),
                  ("sunfuren", "offended", T("被冒犯", "Offended")), ("zhangsong", "offended", T("被冒犯", "Offended")), ("pangtong", "flattery", T("嫌你谄媚", "Finds you a flatterer"))]:
    VARS[f"imp.{c}.{k}"] = {"type": "num", "init": 0, "min": 0, "max": 5, "label": T(CHARS[c]["name"]["zh"] + "·" + lab["zh"], CHARS[c]["name"]["en"] + " · " + lab["en"]), "char": c, "imp": k, "show": False}
VARS["renown.rash"] = num(0, 0, 10, T("名声·口无遮拦", "Name for loose talk"), group="renown")
HEAT = {"caocao": {"rude": [1], "threat": [2], "nonsense": [0, 1], "romantic": [0, 1], "line": 2},
        "guanyu": {"rude": [1], "threat": [2], "nonsense": [0, 1], "romantic": [0, 1], "line": 3},
        "liubei": {"rude": [1], "threat": [2], "nonsense": [0, 0, 1], "line": 3},
        "zhuge": {"rude": [1], "threat": [1], "nonsense": [0, 0, 1], "line": 4},
        "wenzhi": {"rude": [1], "threat": [2], "line": 3}}
HEAT.update(PP.HEAT)
for c, tbl in HEAT.items():
    CHARS[c]["heat"] = tbl
    VARS[f"heat.{c}"] = {"type": "num", "init": 0, "min": 0, "max": 5, "char": c, "show": False, "carry": False,
                         "label": T(CHARS[c]["name"]["zh"] + "·火气", CHARS[c]["name"]["en"] + " · Temper")}
for c in CHARS:
    if c in reactions.REACT:
        CHARS[c]["romance"] = reactions.REACT[c]["romance"]; CHARS[c]["react"] = dict(reactions.REACT[c]["react"]); CHARS[c]["react"].update(speech.EXTRA_REACT.get(c, {}))
    else:
        CHARS[c]["romance"] = False; CHARS[c]["react"] = PP.REACT[c]
    CHARS[c]["persona"] = PP.PERSONA.get(c) or PERSONA1[c]
    if c in speech.OPENERS: CHARS[c]["openers"] = speech.OPENERS[c]
    if c in PP.OPENERS: CHARS[c]["openers"] = PP.OPENERS[c]
CHARS["zhuge"]["persona"] = T("诸葛亮：二十八九岁，刘备的军师，赤壁之后声望日隆；从容、机敏、谦和而难以看透，喜欢用反问试探人。称玩家“子衡兄”。",
                              "Zhuge Liang: late twenties, Liu Bei's strategist, his reputation rising since Red Cliffs; composed, quick, courteous and hard to read; tests people with questions. Calls the player Ziheng.")

FLAGS = {
    "flag.v2_returned": T("赤壁后离开曹营，回到刘备身边", "Left Cao after Red Cliffs and returned to Liu Bei"),
    "flag.cao_stay": T("赤壁后仍留在曹营", "Stayed with Cao after Red Cliffs"),
    "flag.came_back": T("流落之后回到刘备身边", "Came back to Liu Bei after wandering"),
    "flag.v2_hermit": T("就此隐去", "Disappeared from the world"),
    "flag.took_nanjun": T("劝刘备抢先取南郡", "Urged Liu Bei to seize Nanjun first"),
    "flag.yielded_nanjun": T("劝刘备把南郡让给周瑜", "Urged Liu Bei to leave Nanjun to Zhou Yu"),
    "flag.warned_zhouyu": T("提醒周瑜曹仁诈败", "Warned Zhou Yu about Cao Ren's feint"),
    "flag.wz_treated_zhou": T("温芷替周瑜治箭伤", "Wen Zhi treated Zhou Yu's arrow wound"),
    "flag.wz_spied_zhou": T("让温芷回报周瑜的伤势", "Had Wen Zhi report on Zhou Yu's wound"),
    "flag.liuqi_pretext": T("以刘琦之名推托鲁肃", "Put Lu Su off in Liu Qi's name"),
    "flag.promised_return": T("与鲁肃立约归还荆州", "Signed a promise to return Jingzhou to Lu Su"),
    "flag.zy_refused": T("支持赵云拒婚", "Backed Zhao Yun's refusal of the marriage"),
    "flag.pleaded_weiyan": T("为魏延求情", "Pleaded for Wei Yan"),
    "flag.foresaw_weiyan": T("预言魏延日后", "Foretold Wei Yan's future"),
    "flag.ganlu_exposed": T("当众揭破甘露寺伏兵", "Exposed the ambush at Ganlu Temple"),
    "flag.rearguard": T("江边断后", "Held the rear on the riverbank"),
    "flag.left_sun": T("逃离东吴时撇下孙夫人", "Left Lady Sun behind in the escape"),
    "flag.zhouyu_lives": T("周瑜没有死在巴丘", "Zhou Yu did not die at Baqiu"),
    "flag.met_pangtong": T("在柴桑结识庞统", "Met Pang Tong at Chaisang"),
    "flag.vouched_pangtong": T("为耒阳县令庞统作保", "Vouched for Pang Tong at Leiyang"),
    "flag.tongque": T("在铜雀台上作赋", "Wrote verses at the Bronze Bird Terrace"),
    "flag.saved_cao": T("潼关替曹操解围", "Got Cao Cao out at Tongguan"),
    "flag.defected": T("随张松离开曹营", "Left Cao with Zhang Song"),
    "flag.cao_forever": T("留在了北方", "Stayed in the north"),
    "flag.honored_zs": T("以礼相待张松", "Treated Zhang Song with courtesy"),
    "flag.adou_kept": T("截江夺回阿斗", "Took A Dou back on the river"),
    "flag.sun_parted": T("孙夫人体面地离开", "Lady Sun left with dignity"),
    "flag.wz_west": T("温芷随军入川", "Wen Zhi went west with the army"),
    "flag.wz_jingzhou": T("温芷留在荆州", "Wen Zhi stayed in Jingzhou"),
    "flag.wz_child": T("和温芷说起将来的孩子", "Talked with Wen Zhi about a child"),
    "flag.pt_alive": T("庞统没有死在落凤坡", "Pang Tong did not die at Fallen Phoenix Slope"),
    "flag.with_pangtong": T("随庞统走了小路", "Took the narrow road with Pang Tong"),
    "flag.post_chengdu": T("留在成都", "Stayed in Chengdu"),
    "flag.post_jingzhou": T("回荆州，在关羽身边", "Went back to Jingzhou, beside Guan Yu"),
    "flag.post_none": T("什么都不要", "Asked for nothing"),
    "flag.v2_left": T("被冷落后离开", "Left after being sidelined"),
    "flag.v2_exposed": T("妖人之名坐实", "Branded a sorcerer for good"),
    "flag.sidelined": T("被冷落", "Sidelined"),
    "flag.guan_charge": T("关羽托付了你一句话", "Guan Yu entrusted you with a word"),
}
for k, lab in FLAGS.items(): VARS[k] = flag(lab)

# ------------------------------------------------------------------ echoes & debts
ECHOES = {
    "e_nanjun": T("你劝刘备抢在周瑜之前取了南郡", "You got Liu Bei into Nanjun ahead of Zhou Yu"),
    "e_yield": T("你劝刘备把南郡让给了周瑜", "You had Liu Bei leave Nanjun to Zhou Yu"),
    "e_warned_zy": T("你提醒过周瑜曹仁诈败", "You warned Zhou Yu about Cao Ren's feint"),
    "e_wz_zhou": T("温芷替周瑜治过箭伤", "Wen Zhi treated Zhou Yu's wound"),
    "e_lusu": T("你和鲁肃立过归还荆州的约", "You signed a promise with Lu Su to return Jingzhou"),
    "e_weiyan": T("你在长沙替魏延求过情", "You pleaded for Wei Yan at Changsha"),
    "e_zy": T("你支持赵云拒了桂阳的婚事", "You backed Zhao Yun in refusing the Guiyang marriage"),
    "e_ganlu": T("你在甘露寺当众揭破了伏兵", "You exposed the ambush at Ganlu Temple"),
    "e_rear": T("你在江边替主公断后", "You held the rear on the riverbank"),
    "e_left_sun": T("逃离东吴时，你撇下了孙夫人", "You left Lady Sun behind in the escape"),
    "e_pt": T("你在柴桑结识了庞统", "You met Pang Tong at Chaisang"),
    "e_pt_vouch": T("你在耒阳替庞统作保", "You vouched for Pang Tong at Leiyang"),
    "e_zs": T("你以礼相待张松", "You treated Zhang Song with courtesy"),
    "e_adou": T("你随赵云截江夺回了阿斗", "You took A Dou back on the river with Zhao Yun"),
    "e_wz_road": T("你和温芷定下了去留", "You and Wen Zhi decided where she would go"),
    "e_luofeng": T("你在落凤坡改变了庞统的命", "You changed Pang Tong's fate at Fallen Phoenix Slope"),
    "e_liuqi": T("你以刘琦之名推托了鲁肃", "You put Lu Su off in Liu Qi's name"),
    "e_tongque": T("你在铜雀台上作了一篇文章", "You wrote a piece on the Bronze Bird Terrace"),
    "e_zy_lives": T("你和温芷守住了周瑜的命", "You and Wen Zhi kept Zhou Yu alive"),
    "e_cloak": T("你在潼关把外袍扔给了曹操", "You threw Cao Cao your cloak at Tongguan"),
    "e_defect": T("你随张松离开了曹营", "You left Cao with Zhang Song"),
    "e_cao_stay": T("赤壁之后你仍留在曹营", "You stayed with Cao after Red Cliffs"),
}
DEBTS = {
    "d_base": {"title": T("立足之地", "A place to stand"), "lock": "functional",
               "broken": T("南郡让给了周瑜，刘备没有自己的城。", "With Nanjun left to Zhou Yu, Liu Bei has no city of his own."),
               "function": T("刘备据有荆州，才有后来的入川", "Liu Bei holding Jingzhou, which makes the move west possible")},
    "d_zhouyu": {"title": T("周瑜之死", "Zhou Yu's death"), "lock": "functional",
                 "broken": T("周瑜没有死，东吴的兵权不会落到鲁肃手里。", "Zhou Yu lives, so command in Wu doesn't pass to Lu Su."),
                 "function": T("鲁肃主事，孙刘联盟得以维持", "Lu Su in command, keeping the alliance alive")},
    "d_phoenix": {"title": T("凤雏", "The Young Phoenix"), "lock": "functional",
                  "broken": T("庞统没有死，诸葛亮就没有入川的理由。", "Pang Tong lives, so Zhuge Liang has no reason to come west."),
                  "function": T("诸葛亮入川，关羽独守荆州", "Zhuge Liang comes west, leaving Guan Yu alone in Jingzhou")},
}

SIDE_PROMPT = T("这段日子，你只来得及做一件事。", "These days you only have time for one thing.")
CHAPTERS = [
    {"id": "c1", "title": T("南郡", "Nanjun"), "year": T("建安十三年（208）", "Jian'an 13 (208)"), "canon": T("第51–52回", "Ch. 51–52"), "offer": 2,
     "intro": [P(T("赤壁的火灭了。曹操北还，留曹仁守南郡。周瑜要取南郡，刘备也想要。两家的盟约，从这一天起就开始算账了。",
                   "The fire at Red Cliffs has burned out. Cao Cao has gone north, leaving Cao Ren to hold Nanjun. Zhou Yu wants Nanjun. So does Liu Bei. From this day on, the alliance starts keeping accounts."), NOT_CAO),
               P(T("赤壁的火灭了。你随曹操北还许都。一路上没有人说话。", "The fire at Red Cliffs has burned out. You go north with Cao Cao. No one speaks on the road."), V("track", "==", "cao"))]},
    {"id": "c2", "title": T("四郡", "The Four Commanderies"), "year": T("建安十四年（209）", "Jian'an 14 (209)"), "canon": T("第52–53回", "Ch. 52–53"), "offer": 2,
     "intro": [P(T("荆州南边还有四郡：武陵、长沙、桂阳、零陵。谁先拿下，荆州就算谁的。", "South of Jingzhou lie four commanderies: Wuling, Changsha, Guiyang and Lingling. Whoever takes them holds Jingzhou."), NOT_CAO),
               P(T("许都。曹操在邺城起铜雀台，一年里都在议论南方。你也被问过好几回。", "Xuchang. Cao Cao is building the Bronze Bird Terrace at Ye, and all year the talk is of the south. You are asked about it more than once."), V("track", "==", "cao"))]},
    {"id": "c3", "title": T("甘露寺", "Ganlu Temple"), "year": T("建安十四年（209）", "Jian'an 14 (209)"), "canon": T("第54–55回", "Ch. 54–55"), "offer": 2,
     "intro": [P(T("刘琦病故，甘夫人也去世了。江东来人，说吴侯有个妹妹，愿与皇叔结亲。诸葛亮笑了，赵云皱了眉。", "Liu Qi has died, and so has Lady Gan. Envoys come from the east: the Marquis of Wu has a sister, and would join the houses by marriage. Zhuge Liang smiles. Zhao Yun frowns."), ALL(NOT_CAO, NF("flag.mi_saved"))),
               P(T("刘琦病故，甘夫人也去世了。糜夫人还在——你在长坂坡救下的那位。江东的说辞于是变了：不是续弦，是两家结亲，永为唇齿。诸葛亮笑了，赵云皱了眉。", "Liu Qi has died, and so has Lady Gan. Lady Mi is still alive—the woman you saved at Changban. So the east changes its words: not a second wife but a union of houses, lips and teeth forever. Zhuge Liang smiles. Zhao Yun frowns."), ALL(NOT_CAO, F("flag.mi_saved"))),
               P(T("消息传到许都：刘备要娶孙权的妹妹。曹操听了，把笔一扔。", "News reaches Xuchang: Liu Bei is to marry Sun Quan's sister. Cao Cao throws down his brush."), V("track", "==", "cao"))]},
    {"id": "c4", "title": T("柴桑", "Chaisang"), "year": T("建安十五年（210）", "Jian'an 15 (210)"), "canon": T("第56–57回", "Ch. 56–57"), "offer": 2,
     "intro": [P(T("周瑜的箭伤一直没好。他又想出一计：借道荆州去取西川，路过时顺手收了荆州。", "Zhou Yu's arrow wound has never healed. He has a new plan: march through Jingzhou to take the west, and take Jingzhou on the way."), NOT_CAO),
               P(T("铜雀台落成。曹操大宴文武，要诸将比箭，文官作赋。", "The Bronze Bird Terrace is finished. Cao Cao feasts his officers: the generals will shoot for a prize, the scholars write verses."), V("track", "==", "cao"))]},
    {"id": "c5", "title": T("西川来客", "A Visitor from the West"), "year": T("建安十六年（211）", "Jian'an 16 (211)"), "canon": T("第58–60回", "Ch. 58–60"), "offer": 2,
     "intro": [P(T("西凉马超起兵，曹操亲征潼关。同一年，益州别驾张松带着一张图出了蜀道。他先去了许都。", "Ma Chao rises in the west and Cao Cao marches to Tongguan. That same year, Zhang Song, Lieutenant of Yi province, comes out of the Shu roads with a map. He goes to Xuchang first."))]},
    {"id": "c6", "title": T("截江", "On the River"), "year": T("建安十七年（212）", "Jian'an 17 (212)"), "canon": T("第61回", "Ch. 61"), "offer": 2,
     "intro": [P(T("刘璋请刘备入川拒张鲁。刘备带庞统、黄忠、魏延西去，诸葛亮、关羽、张飞、赵云留守荆州。江东看准了这个空子。", "Liu Zhang invites Liu Bei west to hold off Zhang Lu. Liu Bei goes with Pang Tong, Huang Zhong and Wei Yan; Zhuge Liang, Guan Yu, Zhang Fei and Zhao Yun hold Jingzhou. Wu sees its chance."))]},
    {"id": "c7", "title": T("落凤坡", "Fallen Phoenix Slope"), "year": T("建安十八年（213）", "Jian'an 18 (213)"), "canon": T("第62–63回", "Ch. 62–63"), "offer": 2,
     "intro": [P(T("刘备和刘璋翻了脸。张松事泄被杀。大军直逼雒城，城外有两条路。", "Liu Bei and Liu Zhang have fallen out. Zhang Song's plot was discovered and he has been executed. The army closes on Luocheng, and there are two roads to it."))]},
    {"id": "c8", "title": T("益州", "Yi Province"), "year": T("建安十九年（214）", "Jian'an 19 (214)"), "canon": T("第63–65回", "Ch. 63–65"), "offer": 2,
     "intro": [P(T("雒城破了。张飞在巴郡义释严颜，马超在葭萌关归降。成都城下，刘璋的使者出城来了。", "Luocheng has fallen. Zhang Fei spared Yan Yan at Ba commandery; Ma Chao has submitted at Jiameng Pass. Under the walls of Chengdu, Liu Zhang's envoy rides out."))]},
]

# ------------------------------------------------------------------ nodes
N = []
def cast_(*ids): return [{"id": i} for i in ids]

# ---------- opening interludes (chapter 1 interrupts) ----------
N.append(node("x_return", "*", "interrupt", T("归来", "Coming Back"), "free", T("原创", "original"),
    [P(T("你离开之后，听说了赤壁的火，也听说了华容道。有人说你是妖人，有人说你早死了。", "After you left, you heard about the fire at Red Cliffs, and about Huarong. Some say you're a sorcerer; some say you're long dead."), F("flag.exposed")),
     P(T("荆州那趟出使，你没有死。你在江夏、在长沙、在不知名的渡口之间流落了一年。", "You didn't die on that mission to Jingzhou. You drifted for a year—Jiangxia, Changsha, ferries with no names."), F("flag.mi_heng")),
     P(T("离开之后，你在江湖上走了一年。", "After you left, you spent a year on the roads."), ALL(NF("flag.exposed"), NF("flag.mi_heng"))),
     P(T("一天，鲁肃的船停在你借住的渔村。他认出了你：『孔明说，你若还活着，就该回来。』", "One day Lu Su's boat stops at the fishing village where you're lodging. He recognizes you. 'Kongming says that if you're still alive, you should come back.'"))],
    [choice("back", "dilemma", T("跟鲁肃上船。", "Get on Lu Su's boat."),
            T("刘备见到你，愣了很久，只说了一句：『回来就好。』诸葛亮在旁边，什么也没问。", "When Liu Bei sees you he is still for a long time, then says only, 'You're back. Good.' Zhuge Liang, beside him, asks nothing."),
            [setv("flag.came_back"), setv("track", "liu"), rel("lusu", "trust", 1), rel("liubei", "trust", -1)]),
     choice("hermit", "expression", T("谢过鲁肃，留在渔村。", "Thank Lu Su and stay in the village."),
            T("鲁肃叹了口气，留下一袋钱，开船走了。你在江边看着他的帆，直到看不见。", "Lu Su sighs, leaves you a purse, and sails. You watch his sail from the bank until it's gone."),
            [setv("flag.v2_hermit")])],
    when=PREV_EARLY, order=-2))
N[-1]["choices"][1]["ends"] = True

N.append(node("x_north", "*", "interrupt", T("北还", "Going North"), "free", T("原创", "original"),
    [P(T("赤壁之后，曹操回到许都，第一件事是问你：『孤败在哪里？』你说了。他听完，很久没有说话。", "Back in Xuchang after Red Cliffs, the first thing Cao Cao does is ask you, 'Where did I lose?' You tell him. He listens, and says nothing for a long time.")),
     P(T("那天夜里，有人从窗缝里塞进一封信，没有署名，字是鲁肃的：『孔明问你，可愿南归。』", "That night someone slides a letter through your shutters. Unsigned, but the hand is Lu Su's: 'Kongming asks whether you will come south.'"))],
    [choice("south", "dilemma", T("连夜南下。", "Go south that night."),
            T("你从许都一路逃到江边，搭上了东吴的船。刘备见你回来，没有提曹营的事。可你知道，有人提了。", "You run from Xuchang to the river and get aboard a Wu boat. Liu Bei says nothing about your time with Cao when you come back. But you know others do."),
            [setv("flag.v2_returned"), setv("track", "liu"), rel("caocao", "regard", -3), rel("liubei", "trust", -1), rel("zhuge", "wary", 1)]),
     choice("stay", "dilemma", T("把信烧了。", "Burn the letter."),
            T("第二天，曹操让你随他去邺城看铜雀台的地基。他什么都知道，什么也没说。", "The next day Cao Cao takes you to Ye to see the foundations of the Bronze Bird Terrace. He knows everything, and says nothing."),
            [setv("flag.cao_stay"), rel("caocao", "regard", 1)], echo=["e_cao_stay"])],
    when=ALL(V("track", "==", "cao"), NF("prev.ended_early")), order=-1))

# ---------- c1 南郡 ----------
N.append(node("c1_wound", "c1", "side", T("箭伤", "The Arrow Wound"), "free", T("原创人物", "original character"),
    T("周瑜攻南郡时中了一箭，箭上有毒。东吴的军医束手无策，有人想起了刘备营里那位颍川女医。鲁肃亲自来请温芷。",
      "Zhou Yu took an arrow attacking Nanjun, and the arrow was poisoned. Wu's army doctors are at a loss, and someone remembers the woman physician from Yingchuan in Liu Bei's camp. Lu Su comes himself to ask for Wen Zhi."),
    [choice("let", "dilemma", T("让她去。医者不问来人是哪一边的。", "Let her go. A physician doesn't ask which side the patient is on."),
            T("温芷在周瑜帐里守了三夜。回来时她说：『箭毒拔了。可这伤最怕气，他偏偏是个爱生气的人。』", "Wen Zhi sits three nights in Zhou Yu's tent. When she comes back she says, 'I drew the poison. But this wound can't bear anger, and he's a man who angers easily.'"),
            [setv("flag.wz_treated_zhou"), rel("wenzhi", "trust", 1), rel("zhouyu", "trust", 2), rel("lusu", "trust", 1)], echo=["e_wz_zhou"]),
     choice("spy", "strategy", T("让她去，回来把周瑜的伤势一五一十告诉你。", "Let her go, and have her tell you everything about his condition."),
            T("温芷看了你很久：『你要我做的，到底是大夫，还是探子？』她还是去了，回来也还是说了。只是那几天，她没再跟你多说一句话。", "Wen Zhi looks at you a long time. 'Do you want a physician or a spy?' She goes anyway, and comes back and tells you. But for days after, she says nothing more to you than she must."),
            [setv("flag.wz_spied_zhou"), rel("wenzhi", "trust", -2), rel("wenzhi", "intimacy", -1), add("renown.cunning")], echo=["e_wz_zhou"]),
     choice("refuse", "expression", T("不让她去：周瑜的营里，太险。", "Refuse: Zhou Yu's camp is too dangerous."),
            T("鲁肃失望地走了。温芷没有争，只是把药箱收了起来。", "Lu Su leaves disappointed. Wen Zhi doesn't argue. She just puts her medicine chest away."),
            [rel("lusu", "trust", -1)])],
    when=ALL(NOT_CAO, F("flag.wenzhi_with_you")), salience=3, order=1))

N.append(node("c1_lusu", "c1", "side", T("讨荆州", "Lu Su Comes for Jingzhou"), "functional", T("第52回", "Ch. 52"),
    T("鲁肃来了。他说，曹兵是东吴打退的，荆州理当归东吴。诸葛亮看了你一眼，示意你先开口。",
      "Lu Su has come. Wu drove Cao's army off, he says, so Jingzhou rightly belongs to Wu. Zhuge Liang glances at you: you speak first."),
    [choice("liuqi", "strategy", T("搬出刘琦：荆州是刘表的基业，自然归他的儿子。", "Bring up Liu Qi: Jingzhou was Liu Biao's, so it goes to his son."),
            T("鲁肃无话可说：『那……若公子不在了呢？』诸葛亮笑道：『那时再议。』鲁肃走时，脸色很难看。", "Lu Su has no answer. 'And… if the young lord should pass?' Zhuge Liang smiles. 'Then we'll talk again.' Lu Su leaves looking grim."),
            [setv("flag.liuqi_pretext"), rel("zhuge", "respect", 1), rel("lusu", "trust", -1), add("renown.cunning")], echo=["e_liuqi"]),
     choice("pledge", "dilemma", T("立个约：等主公有了别的地盘，荆州归还东吴。", "Sign a promise: when our lord has other land, Jingzhou goes back to Wu."),
            T("鲁肃松了一口气，郑重地收起了那张纸。诸葛亮没有拦你，只是事后说：『子衡兄，这张纸，以后会有人拿来的。』", "Lu Su breathes out and puts the paper away with care. Zhuge Liang doesn't stop you, but says afterward, 'Ziheng, someone will bring that paper back one day.'"),
            [setv("flag.promised_return"), rel("lusu", "trust", 2), rel("liubei", "trust", 1), add("renown.loyal")], echo=["e_lusu"]),
     choice("foresee", "strategy", T("直说：刘琦公子活不长了，不如现在就谈。", "Say it plainly: Liu Qi won't live long. Better to talk now."),
            T("屋里一静。鲁肃看着你，像看一个说了不吉利话的人。半年后，刘琦果然病故。", "The room goes quiet. Lu Su looks at you as at a man who has said something ill-omened. Six months later, Liu Qi dies."),
            [add("uncanny"), rel("lusu", "trust", 1), rel("zhuge", "wary", 1)], foresight=True)],
    when=NOT_CAO, salience=1, order=2))

N.append(node("c1_nanjun", "c1", "main", T("一气周瑜", "The First Vexation"), "functional", T("第51回", "Ch. 51"),
    [P(T("周瑜和曹仁在南郡城下苦战了好些日子，周瑜中了毒箭。诸葛亮却在这时请刘备看一样东西：从曹营截来的兵符。",
      "Zhou Yu and Cao Ren have fought under Nanjun's walls for days, and Zhou Yu has taken a poisoned arrow. Now Zhuge Liang shows Liu Bei something: an army tally taken from Cao's camp.")),
     P(T("诸葛亮说话时看了你一眼。你从曹营回来才几天，帐里的人还在掂量你。", "Zhuge Liang glances at you as he speaks. You came back from Cao's camp only days ago, and the tent is still weighing you up."), F("flag.v2_returned")),
     P(T("鲁肃把你送回来才半个月。帐里的人看你，像看一个从坟里走出来的人。", "Lu Su brought you back barely a fortnight ago. People in the tent look at you as if you'd walked out of a grave."), F("flag.came_back"))],
    [choice("take", "strategy", T("劝主公趁虚而入：拿兵符赚开南郡，再取荆州、襄阳。", "Urge your lord to slip in: use the tally to open Nanjun, then take Jingzhou and Xiangyang."),
            T("一夜之间，三座城都插上了刘字旗。周瑜赶到城下，赵云在城楼上拱手。周瑜大叫一声，箭疮迸裂，坠下马去。", "In one night three cities fly Liu banners. Zhou Yu arrives under the walls to find Zhao Yun bowing from the gatehouse. He cries out, his wound bursts open, and he falls from his horse."),
            [setv("flag.took_nanjun"), rel("liubei", "trust", 1), rel("zhuge", "respect", 1), rel("zhouyu", "esteem", -1), rel("zhouyu", "trust", -2), add("renown.cunning")], echo=["e_nanjun"]),
     choice("yield", "dilemma", T("劝主公按兵不动：南郡让周瑜去取，盟约要紧。", "Urge your lord to hold back: let Zhou Yu take Nanjun. The alliance matters more."),
            T("刘备犹豫再三，听了你的。周瑜拿下了南郡，派人送来一坛酒。诸葛亮望着那坛酒，说：『主公现在连一座自己的城都没有了。』", "Liu Bei hesitates, then listens to you. Zhou Yu takes Nanjun and sends over a jar of wine. Zhuge Liang looks at the jar and says, 'Now my lord doesn't have a single city of his own.'"),
            [setv("flag.yielded_nanjun"), rel("zhouyu", "trust", 2), rel("lusu", "trust", 1), rel("zhuge", "respect", -1), add("renown.loyal"), add("deviation")], echo=["e_yield"], debt=["d_base"]),
     choice("warn", "strategy", T("连夜去见周瑜：曹仁的败退是诈，城里有伏兵。", "Go to Zhou Yu that night: Cao Ren's retreat is a trick, and the city is full of ambushers."),
            T("周瑜看了你很久，下令缓攻。他没有中第二次计。南郡最后还是被诸葛亮赚了去，可周瑜记住了你。", "Zhou Yu studies you a long time, then orders the attack slowed. He doesn't fall for the second trap. Nanjun still goes to Zhuge Liang's trick in the end, but Zhou Yu remembers you."),
            [setv("flag.warned_zhouyu"), rel("zhouyu", "esteem", 2), rel("zhouyu", "trust", 1), rel("zhuge", "wary", 1), add("uncanny")], foresight=True, echo=["e_warned_zy"])],
    order=10, when=NOT_CAO))

N.append(node("c1_cao", "c1", "main", T("孤败在哪里", "Where Did I Lose"), "free", T("原创", "original"),
    T("许都。曹操设宴，席上没有人提赤壁。酒到半酣，他忽然点了你的名。",
      "Xuchang. Cao Cao holds a banquet; no one mentions Red Cliffs. Half drunk, he suddenly calls your name."),
    [choice("truth", "dilemma", T("当众说实话：败在骄兵，败在不识水战。", "Tell the truth in front of everyone: arrogance, and not knowing how to fight on water."),
            T("满座变色。曹操却笑了：『好！这话只有你敢说。』", "The whole table changes color. Cao Cao laughs. 'Good! Only you would dare say that.'"),
            [rel("caocao", "regard", 2), add("renown.rash")]),
     choice("fate", "expression", T("说是天意，东南风不该在冬天来。", "Say it was Heaven's will: a southeast wind had no business blowing in winter."),
            T("曹操点点头，又摇摇头，没说什么。", "Cao Cao nods, then shakes his head, and says nothing."), [rel("caocao", "regard", -1)])],
    when=V("track", "==", "cao"), order=10))

# ---------- c2 四郡 ----------
N.append(node("c2_guiyang", "c2", "side", T("桂阳", "Guiyang"), "functional", T("第52回", "Ch. 52"),
    T("赵云取了桂阳。太守赵范设宴，请出他寡居的嫂嫂樊氏，要许给赵云。赵云把酒席掀了。赵范连夜派人来找你，请你去劝。",
      "Zhao Yun has taken Guiyang. At the feast the governor, Zhao Fan, brings out his widowed sister-in-law, Lady Fan, and offers her to Zhao Yun in marriage. Zhao Yun overturns the table. That night Zhao Fan sends for you to talk him round."),
    [choice("back", "dilemma", T("站在赵云这边：刚降的城，娶不得降将的家眷。", "Side with Zhao Yun: you don't marry into a surrendered governor's family in a city just taken."),
            T("赵云对你抱了抱拳：『先生懂我。』后来赵范果然有异心，没能得逞。", "Zhao Yun clasps his hands to you. 'You understand me, sir.' Later Zhao Fan does try to turn, and fails."),
            [setv("flag.zy_refused"), rel("zhaoyun", "trust", 2), rel("zhaoyun", "warmth", 1), add("renown.loyal")], echo=["e_zy"]),
     choice("persuade", "strategy", T("劝赵云：结了这门亲，桂阳就稳了。", "Persuade Zhao Yun: the marriage would make Guiyang secure."),
            T("赵云听完，只说了一句：『天下女子不少，子龙只怕名不立。』他没再理你。", "Zhao Yun hears you out and says only, 'There are many women in the world. What I fear is failing to make my name.' He doesn't speak to you again that night."),
            [rel("zhaoyun", "trust", -1), rel("zhaoyun", "warmth", -1), add("renown.cunning")])],
    when=NOT_CAO, salience=2, order=1))

N.append(node("c2_changsha", "c2", "main", T("义释黄汉升", "Mercy for Huang Zhong"), "literal", T("第53回", "Ch. 53"),
    T("关羽取长沙，和老将黄忠战了一百多合不分胜负。第二天黄忠马失前蹄，关羽没有杀他；黄忠也只射了关羽的盔缨。太守韩玄要斩黄忠，魏延杀了韩玄，开城献降。诸葛亮却下令：把魏延推出去斩了。",
      "Guan Yu attacks Changsha and fights the old general Huang Zhong for over a hundred bouts without a winner. Next day Huang Zhong's horse stumbles and Guan Yu spares him; Huang Zhong, in turn, shoots only the tassel of Guan Yu's helmet. The governor, Han Xuan, means to behead Huang Zhong—so Wei Yan kills Han Xuan and opens the gates. And Zhuge Liang orders: take Wei Yan out and behead him."),
    [choice("plead", "dilemma", T("出来为魏延求情：杀了献城的人，以后谁还敢来投？", "Step forward for Wei Yan: kill the man who opened the gates, and who will ever come over to us?"),
            T("刘备也开了口。诸葛亮看了你一眼，饶了魏延，却指着他说：『汝可尽忠报主，勿生异心。』魏延叩头。退下时，他回头看了你一眼。", "Liu Bei speaks up too. Zhuge Liang glances at you and spares Wei Yan, but points at him: 'Serve your lord loyally and harbor no other thought.' Wei Yan bows his head to the floor. On his way out he looks back at you."),
            [setv("flag.pleaded_weiyan"), rel("liubei", "trust", 1), rel("zhuge", "respect", -1), add("renown.loyal")], echo=["e_weiyan"]),
     choice("silent", "expression", T("不出声，看主公怎么说。", "Say nothing. See what your lord says."),
            T("刘备开口求情，诸葛亮饶了魏延。这件事和你无关。", "Liu Bei pleads, and Zhuge Liang spares Wei Yan. It has nothing to do with you.")),
     choice("foresee", "strategy", T("私下对诸葛亮说：军师看得不错，这个人，以后要防。", "Tell Zhuge Liang privately: you're right about him. This one will need watching."),
            T("诸葛亮的扇子停了：『子衡兄也看出来了？』他没再说什么。可从那天起，魏延每次出战，诸葛亮都会多派一支兵在后面。", "Zhuge Liang's fan stops. 'You see it too?' He says no more. But from that day, whenever Wei Yan goes out to fight, Zhuge Liang sends another column behind him."),
            [setv("flag.foresaw_weiyan"), add("uncanny"), rel("zhuge", "respect", 1), rel("zhuge", "wary", 1)], foresight=True, echo=["e_weiyan"])],
    quote=T("孔明喝令刀斧手推下斩之。……孔明曰：「……吾观魏延脑后有反骨，久后必反，故先斩之，以绝祸根。」玄德曰：「若杀此人，恐降者人人自危；望军师恕之。」",
            "Kongming ordered the axemen to take him out and behead him. … \"I see a rebel's bone at the back of Wei Yan's head; he will turn in the end. I mean to cut him down first and pull the trouble up by the root.\" Xuande said, \"Kill this man, and everyone who surrenders to us will fear for his life. I beg you to pardon him.\""),
    order=10, when=NOT_CAO))

N.append(talk_node("c2_zhaoyun", "c2", T("夜谈·赵云", "Night Talk: Zhao Yun"),
    T("桂阳城头，赵云在擦枪。长坂坡之后，你们还没有好好说过话。", "On the Guiyang wall, Zhao Yun is cleaning his spear. Since Changban, the two of you have never really talked."),
    "zhaoyun", 2,
    [topic("changban", T("问他长坂坡那天，怕不怕。", "Ask whether he was afraid that day at Changban."),
           [P(T("赵云想了很久：『怕。怕的不是死，是怀里那孩子。』他看了你一眼：『糜夫人能活下来，是你的功劳。』", "Zhao Yun thinks a long time. 'Yes. Not of dying—of the child in my arms.' He looks at you. 'Lady Mi lived because of you.'"), F("flag.mi_saved")),
            P(T("赵云想了很久：『怕。怕的不是死，是怀里那孩子。』他没再说下去。糜夫人投井的事，他从不提。", "Zhao Yun thinks a long time. 'Yes. Not of dying—of the child in my arms.' He says no more. He never mentions Lady Mi and the well."), NF("flag.mi_saved"))],
           [rel("zhaoyun", "warmth", 1)]),
     topic("lord", T("问他为什么跟着刘备。", "Ask why he follows Liu Bei."),
           T("『我在公孙瓒那里时，见过很多主公。』他说，『只有这一位，打了败仗还记得百姓。』", "'With Gongsun Zan I saw a lot of lords,' he says. 'Only this one remembers the people even when he's losing.'"),
           [rel("zhaoyun", "trust", 1)]),
     topic("east", T("提醒他：以后去江东，多留个心眼。", "Warn him: if he's ever sent east, keep his eyes open."),
           T("赵云点点头：『先生放心。子龙去哪里，都只信主公一个人。』", "Zhao Yun nods. 'Don't worry, sir. Wherever I go, I trust no one but our lord.'"),
           [rel("zhaoyun", "trust", 1), add("renown.loyal")])],
    T("赵云送你下了城楼。", "Zhao Yun sees you down from the wall."), when=NOT_CAO, order=20))

# ---------- c3 甘露寺 ----------
N.append(node("c3_ganlu", "c3", "main", T("甘露寺", "Ganlu Temple"), "functional", T("第54回", "Ch. 54"),
    T("南徐。吴国太在甘露寺相看女婿，一见刘备就喜欢上了。可你在廊下看见：两廊的帐幕后面，藏着刀斧手。赵云按着剑，看着你。",
      "Nanxu. Lady Wu, the Marquis's mother, receives her prospective son-in-law at Ganlu Temple, and takes to Liu Bei at once. But in the corridors you see it: behind the curtains on both sides are men with axes. Zhao Yun, hand on his sword, looks at you."),
    [choice("kneel", "strategy", T("让主公当着国太的面哭诉：要杀就在这里杀。", "Have your lord kneel before Lady Wu and weep: if they mean to kill him, let them do it here."),
            T("刘备跪在国太面前流泪。国太大怒，把孙权、吕范骂得抬不起头，当场认下了这个女婿。", "Liu Bei kneels and weeps before her. Lady Wu is furious; she berates Sun Quan and Lü Fan until they can't raise their heads, and accepts the son-in-law on the spot."),
            [rel("liubei", "trust", 1), add("renown.cunning")]),
     choice("expose", "dilemma", T("你自己走出去，一把扯开帐幕。", "Walk out yourself and pull the curtain aside."),
            T("帐幕后面的刀斧手面面相觑。国太的脸色铁青。婚事成了，可孙权从此记住了你的名字，周瑜也是。", "The axemen behind it stare at one another. Lady Wu's face goes iron-grey. The marriage goes ahead—but from that day Sun Quan knows your name, and so does Zhou Yu."),
            [setv("flag.ganlu_exposed"), rel("liubei", "trust", 2), rel("zhaoyun", "trust", 1), rel("zhouyu", "esteem", 1), rel("zhouyu", "trust", -1), add("renown.rash")], echo=["e_ganlu"]),
     choice("stone", "expression", T("什么也不做，陪主公去看那块石头。", "Do nothing; go with your lord to see the stone."),
            T("刘备拔剑向天祝祷，一剑把石头劈成两半。孙权也劈了一剑。两道剑痕交成一个十字。你知道，两人许的愿不一样。", "Liu Bei draws his sword, prays, and splits a rock in two. Sun Quan strikes it too. The two cuts cross. You know the two men wished for different things."))],
    callbacks=[cb("e_liuqi", T("鲁肃也在席上。他这回没带笑：刘琦公子已经不在了，荆州的事，该议了。", "Lu Su is at the feast too, and not smiling this time: the young lord Liu Qi is gone, so it is time to settle Jingzhou."), F("flag.liuqi_pretext"))],
    order=10, when=NOT_CAO))

N.append(node("c3_flight", "c3", "main", T("赔了夫人", "Losing the Bride"), "functional", T("第55回", "Ch. 55"),
    T("刘备在东吴住得忘了回去。赵云拆开第二个锦囊，谎报曹操来攻荆州。孙夫人跟着刘备连夜出逃，东吴的追兵一路追到江边。",
      "Liu Bei is so comfortable in Wu he forgets to go home. Zhao Yun opens the second brocade bag and reports, falsely, that Cao Cao is attacking Jingzhou. Lady Sun flees with Liu Bei that night, and Wu's riders chase them to the river."),
    [choice("lady", "strategy", T("请孙夫人出面，喝退追兵。", "Ask Lady Sun to face the pursuers and order them back."),
            T("孙夫人掀开车帘，把追来的将领骂得下马请罪。没人敢拦吴侯的妹妹。船到了，诸葛亮的人在岸上齐声大喊，周瑜气得箭疮又裂了。", "Lady Sun throws back the curtain and berates the pursuing generals until they dismount and beg her pardon. No one dares stop the Marquis's sister. The boats arrive, Zhuge Liang's men shout from the bank, and Zhou Yu's wound tears open again."),
            [rel("sunfuren", "trust", 1), rel("sunfuren", "warmth", 1), rel("liubei", "trust", 1)]),
     choice("rear", "dilemma", T("你带几个人留在江边断后。", "Stay at the riverbank with a few men to hold the rear."),
            T("你在江边拖了一个时辰，背上挨了一刀。上船时，孙夫人亲手给你裹了伤：『荆州人，原来也有不怕死的。』", "You hold them for an hour and take a cut across the back. When you board, Lady Sun binds the wound herself. 'So some Jingzhou men aren't afraid to die.'"),
            [setv("flag.rearguard"), rel("sunfuren", "warmth", 2), rel("sunfuren", "trust", 1), rel("zhaoyun", "warmth", 1), rel("liubei", "trust", 1)], echo=["e_rear"]),
     choice("leave", "dilemma", T("劝主公先走：夫人的车太慢，追兵追的是她。", "Urge your lord to go ahead: the lady's carriage is too slow, and it's her they're after."),
            T("刘备犹豫了。孙夫人在车里听见了，冷笑一声，自己挥鞭赶车追了上来。她一路没再看你一眼。", "Liu Bei hesitates. Lady Sun hears it from her carriage, laughs coldly, and whips her own horses to catch up. She doesn't look at you again the whole way."),
            [setv("flag.left_sun"), rel("sunfuren", "warmth", -2), rel("sunfuren", "trust", -2), add("renown.cunning")], echo=["e_left_sun"])],
    callbacks=[cb("e_ganlu", T("东吴的追兵追得格外凶：甘露寺扯帐子的那个人，也在车队里。", "Wu's riders chase hardest of all: the man who pulled the curtain at Ganlu Temple is with the carriages."), F("flag.ganlu_exposed"))],
    order=20, when=NOT_CAO))

# ---------- c4 柴桑 ----------
N.append(node("c4_tongque", "c4", "main", T("铜雀台", "The Bronze Bird Terrace"), "literal", T("第56回", "Ch. 56"),
    T("铜雀台上，武将们比箭夺锦袍，文官们轮番献诗。曹操让你也写一篇。",
      "On the Bronze Bird Terrace the generals shoot for a brocade robe and the scholars take turns presenting poems. Cao Cao has you write one too."),
    [choice("praise", "expression", T("写一篇颂德的赋。", "Write a rhapsody in his praise."),
            T("曹操笑道：『你们都说孤的功德，孤自己知道，孤不过想做个征西将军。』", "Cao Cao laughs. 'You all talk of my virtue. I know myself: all I ever wanted was to be General Who Subdues the West.'"),
            [setv("flag.tongque"), rel("caocao", "regard", 1)], echo=["e_tongque"]),
     choice("warn", "dilemma", T("写一篇讽喻：台越高，越看不见江南。", "Write an allegory: the higher the terrace, the less you see of the south."),
            T("满座无声。曹操看完，把你的文章收进了袖子里，没有念。", "The terrace falls silent. Cao Cao reads it, tucks it into his sleeve, and doesn't read it aloud."),
            [setv("flag.tongque"), rel("caocao", "regard", 2), add("renown.rash")], echo=["e_tongque"])],
    when=V("track", "==", "cao"), order=10))

N.append(node("c4_death", "c4", "main", T("三气周瑜", "The Third Vexation"), "functional", T("第56–57回", "Ch. 56–57"),
    [P(T("周瑜让人传话：想见你一面。", "Zhou Yu sends word: he would like to see you."), R("zhouyu", "trust", ">=", 3)),
     P(T("周瑜的人说起你，脸色都不好看。", "Zhou Yu's men don't look pleased when your name comes up."), I("zhouyu", "offended", ">=", 1)),
     P(T("周瑜借道取川的计被诸葛亮一眼看穿。大军到了荆州城下，城上遍插旗帜，四面都有伏兵。周瑜在马上大叫一声，箭疮复裂。", "Zhuge Liang sees through Zhou Yu's 'borrowed road' at a glance. When Zhou Yu's army reaches Jingzhou, the walls are thick with banners and ambushes wait on every side. Zhou Yu cries out in the saddle; his wound tears open again.")),
     P(T("他被抬回巴丘，一直没有起来。", "He is carried back to Baqiu and never rises again."))],
    [choice("visit", "dilemma", T("赶去巴丘看他。", "Go to Baqiu to see him."),
            T("周瑜躺着，脸色像纸。他看见你，笑了笑：『你来看孔明的笑话，还是我的？』说完，望着帐顶，叹了口气：『既生瑜，何生亮？』连叫数声而亡。",
              "Zhou Yu lies there, his face like paper. He sees you and smiles. 'Come to watch Kongming's joke, or mine?' Then, staring up at the tent: 'Since Heaven made Zhou Yu, why did it make Zhuge Liang too?' He cries it out several times, and dies."),
            [rel("zhouyu", "esteem", 1), rel("lusu", "trust", 1)]),
     choice("save", "dilemma", T("带上温芷连夜赶去：只要他不再动气，伤还有救。", "Take Wen Zhi and go that night: if he can stop raging, the wound can still heal."),
            T("温芷在周瑜帐里守了半个月，你守在帐外，挡掉所有提荆州、提孔明的人。周瑜活了下来，却再也上不了战场。他把兵权交给了鲁肃，回了柴桑。", "Wen Zhi sits by Zhou Yu for half a month, and you stand outside the tent turning away anyone who mentions Jingzhou or Kongming. Zhou Yu lives—but he will never take the field again. He hands command to Lu Su and goes home to Chaisang."),
            [setv("flag.zhouyu_lives"), rel("zhouyu", "trust", 2), rel("zhouyu", "esteem", 1), rel("wenzhi", "trust", 1), add("deviation", 2)], debt=["d_zhouyu"], echo=["e_zy_lives"],
            req=ALL(F("flag.wz_treated_zhou"), F("flag.wenzhi_with_you")), hint=T("需要温芷先前替周瑜治过箭伤", "Needs Wen Zhi to have treated Zhou Yu's wound before")),
     choice("away", "expression", T("不去。这是东吴的事。", "Don't go. It's Wu's affair."),
            T("消息传来时，你正在灯下看地图。诸葛亮说要去柴桑吊丧，问你去不去。", "When the news comes you're studying a map by lamplight. Zhuge Liang says he'll go to Chaisang to mourn, and asks whether you'll come."))],
    callbacks=[cb("e_nanjun", T("你想起南郡城下周瑜坠马的那一幕。第一口气，是你劝主公给的。", "You remember Zhou Yu falling from his horse under Nanjun's walls. The first vexation was your advice."), F("flag.took_nanjun")),
               cb("e_yield", T("周瑜让人带话：『南郡的事，我记着刘使君的情。』可他也没打算还这个情。", "Zhou Yu sends word: 'I remember Lord Liu's kindness over Nanjun.' He has no plans to repay it."), F("flag.yielded_nanjun")),
               cb("e_warned_zy", T("周瑜对鲁肃说过：刘备那边，只有一个人跟我说过真话。", "Zhou Yu once told Lu Su: in Liu Bei's camp, only one man ever told me the truth."), F("flag.warned_zhouyu")),
               cb("e_wz_zhou", T("温芷说过：这伤最怕气。", "Wen Zhi said it: this wound can't bear anger."), ANY(F("flag.wz_treated_zhou"), F("flag.wz_spied_zhou"))),
               ],
    on_enter=[{"when": DEBT("d_base"), "effects": [], "resolve": [("d_base", "reroute")],
               "text": T("你想起诸葛亮那句话：主公连一座自己的城都没有。鲁肃最后还是说服了孙权，把南郡“借”给了刘备。从此有了“借荆州”的说法。", "You remember Zhuge Liang's words: our lord doesn't have a city of his own. In the end Lu Su persuades Sun Quan to 'lend' Nanjun to Liu Bei. From then on, people speak of 'the borrowed Jingzhou'.")}],
    order=10, when=NOT_CAO))

N.append(node("c4_mourn", "c4", "main", T("卧龙吊丧", "Mourning at Chaisang"), "literal", T("第57回", "Ch. 57"),
    [P(T("诸葛亮带着赵云去柴桑吊丧。东吴的将领个个想杀他。他伏在灵前，哭得泪如涌泉，祭文念到一半，满堂的人都哭了。", "Zhuge Liang goes to Chaisang to mourn, with Zhao Yun beside him. Every general in Wu wants him dead. He throws himself down before the coffin and weeps like a spring, and halfway through his elegy the whole hall is weeping too."), NF("flag.zhouyu_lives")),
     P(T("周瑜没死。诸葛亮却还是要去柴桑——去探病。东吴的将领个个想杀他，周瑜在病榻上摆了摆手。", "Zhou Yu didn't die. Zhuge Liang goes to Chaisang anyway—to visit the sick. Every general in Wu wants him dead. From his sickbed, Zhou Yu waves them off."), F("flag.zhouyu_lives")),
     P(T("出门时，一个黑面短髯、相貌古怪的人一把拉住了诸葛亮：『你气死了周郎，还来吊丧，欺东吴无人吗？』", "On the way out, a dark-faced, short-bearded, strange-looking man grabs Zhuge Liang by the sleeve. 'You vexed Zhou Yu to death and now you come to mourn him? Do you think Wu has no one left?'"), NF("flag.pangtong_joined"))],
    [choice("pt", "strategy", T("留下来，和这个怪人喝一顿酒。", "Stay behind and drink with the strange man."),
            T("他叫庞统，道号凤雏。你们喝到半夜。他说：『孙权不喜欢我这张脸。刘备呢？』", "His name is Pang Tong; they call him the Young Phoenix. You drink until midnight. 'Sun Quan doesn't like my face,' he says. 'What about Liu Bei?'"),
            [setv("flag.met_pangtong"), rel("pangtong", "warmth", 2), rel("pangtong", "esteem", 1)], echo=["e_pt"], when=NF("flag.pangtong_joined")),
     choice("guard", "dilemma", T("寸步不离诸葛亮，和赵云一左一右。", "Stay at Zhuge Liang's side, Zhao Yun on the other."),
            T("没有人敢动手。回程的船上，诸葛亮说：『子衡兄，今天是你和子龙救了亮的命。』", "No one dares move. On the boat home Zhuge Liang says, 'Today you and Zilong saved my life.'"),
            [rel("zhuge", "respect", 2), rel("zhaoyun", "trust", 1)]),
     choice("old", "expression", T("陪庞统在灵前站一会儿。", "Stand before the coffin a while with Pang Tong."),
            T("庞统早已在刘备帐下，这一趟是陪诸葛亮来的。他看着灵位说：『公瑾也算知己。可惜了。』", "Pang Tong has served Liu Bei for some time now and came with Zhuge Liang. Looking at the tablet he says, 'Gongjin was a man who understood me. A pity.'"),
            [rel("pangtong", "warmth", 1)], when=F("flag.pangtong_joined"))],
    quote=T("孔明……设祭物于灵前，亲自奠酒，跪于地下，读祭文曰：「呜呼公瑾，不幸夭亡，修短故天，人岂不伤？我心实痛，酹酒一觞……」",
            "Kongming … set out the offerings before the coffin, poured the wine himself, knelt, and read his elegy: \"Alas, Gongjin, taken so young! Long life or short is Heaven's to give, yet who would not grieve? My heart truly aches; I pour out this cup …\""),
    on_enter=[{"when": DEBT("d_zhouyu"), "effects": [], "resolve": [("d_zhouyu", "transform")],
               "text": T("周瑜病退柴桑，东吴的兵权交到了鲁肃手里。孙刘的盟约，还是由鲁肃来守。", "Zhou Yu retires sick to Chaisang, and command in Wu passes to Lu Su. The alliance is still in Lu Su's keeping.")}],
    callbacks=[cb("e_rear", T("赵云在船上对你说：『那天江边，你背上那一刀，夫人一直记着。』", "On the boat Zhao Yun tells you, 'That cut you took on the riverbank—the lady hasn't forgotten.'"), F("flag.rearguard")),
               cb("e_lusu", T("鲁肃送你们上船时摸了摸怀里。那张约还在。", "Seeing you to the boat, Lu Su pats the front of his robe. The agreement is still there."), F("flag.promised_return")),
               cb("e_zy_lives", T("周瑜在病榻上对你点了点头。", "From his sickbed, Zhou Yu nods to you."), F("flag.zhouyu_lives"))],
    order=20, when=NOT_CAO))

N.append(node("c4_leiyang", "c4", "side", T("耒阳县令", "The Magistrate of Leiyang"), "literal", T("第57回", "Ch. 57"),
    T("庞统来投刘备，只分到一个耒阳县令。他到任一百天，天天喝酒，不理公事。张飞奉命去查，你也跟着去了。",
      "Pang Tong comes to Liu Bei and is given only the county of Leiyang. In a hundred days there he has done nothing but drink. Zhang Fei is sent to inspect, and you go along."),
    [choice("vouch", "strategy", T("请张飞先别发火，让他当面理事。", "Ask Zhang Fei to hold his temper and let the man work in front of him."),
            T("庞统把一百多天的公文抱上堂来，不到半日，全部断完，掷笔于地。张飞看傻了。回去之后，你和张飞一起替他作保。", "Pang Tong has a hundred days of papers carried in, and in less than half a day he has decided every case and thrown down his brush. Zhang Fei gapes. Back at headquarters, you and Zhang Fei vouch for him together."),
            [setv("flag.vouched_pangtong"), rel("pangtong", "esteem", 2), rel("pangtong", "warmth", 1), rel("liubei", "trust", 1)], echo=["e_pt_vouch"]),
     choice("report", "expression", T("照实回报：这人整天喝酒。", "Report what you saw: the man drinks all day."),
            T("后来诸葛亮回来，说了一句：『庞士元非百里之才。』刘备才把他请了回来。庞统见了你，只笑了笑。", "Later Zhuge Liang returns and says, 'Pang Shiyuan is not a man to be wasted on a hundred-li county.' Only then does Liu Bei call him back. When Pang Tong sees you, he just smiles."),
            [rel("pangtong", "esteem", -1)])],
    when=ALL(NOT_CAO, NF("flag.pangtong_joined")), salience=2, order=1))

# ---------- c5 西川来客 ----------
N.append(node("c5_tongguan", "c5", "main", T("割须弃袍", "Shaving the Beard"), "literal", T("第58回", "Ch. 58"),
    [P(T("潼关大败。马超的人在乱军中大喊：穿红袍的是曹操！曹操脱了袍子。又喊：长髯的是曹操！曹操割了胡须。你就在他身边。",
      "Disaster at Tongguan. Ma Chao's men shout through the chaos: the one in the red robe is Cao Cao! Cao throws off his robe. Then: the one with the long beard is Cao Cao! Cao cuts off his beard. You are right beside him.")),
     ],
    [choice("cloak", "dilemma", T("把自己的外袍扔给他，自己往另一边跑。", "Throw him your own cloak and run the other way."),
            T("追兵追着你跑了半里地。你被曹洪救下时，曹操已经过了河。他后来对人说：『那天替孤挨刀的，是刘备那边来的人。』", "The pursuers chase you half a li. By the time Cao Hong pulls you out, Cao Cao is across the river. Later he tells people, 'The man who took the blades for me that day came from Liu Bei's side.'"),
            [setv("flag.saved_cao"), rel("caocao", "regard", 3), add("renown.loyal")], echo=["e_cloak"]),
     choice("flee", "expression", T("各自逃命。", "Every man for himself."),
            T("你跟着溃兵跑了一夜。第二天才知道，曹操也活了下来。", "You run with the routed men all night. Only the next day do you learn Cao Cao lived too."), [])],
    callbacks=[cb("e_tongque", T("你那篇铜雀台上的文章，他一直收在袖子里。", "That piece you wrote on the Bronze Bird Terrace—he has kept it in his sleeve ever since."), F("flag.tongque"))],
    when=V("track", "==", "cao"), order=5))

N.append(node("c5_zhangsong", "c5", "main", T("张松献图", "Zhang Song's Map"), "literal", T("第60回", "Ch. 60"),
    [P(T("张松到了许都。曹操嫌他相貌猥琐，又听他言语冲撞，拂袖而去。杨修拿出曹操新写的兵书考他，张松看了一遍，从头到尾背了出来，说这是蜀中三尺小童都会背的古书。", "Zhang Song reaches Xuchang. Cao Cao finds him repulsive and, hearing him speak bluntly, sweeps out of the room. Yang Xiu tests him with Cao's new book on war; Zhang Song reads it once and recites it from start to finish, calling it an old text every child in Shu knows by heart."), V("track", "==", "cao")),
     P(T("张松离开许都，往荆州来了。赵云在郢州界口等他，关羽在荆州界口等他，刘备、诸葛亮、庞统亲自出城十里相迎。", "Zhang Song leaves Xuchang and comes to Jingzhou. Zhao Yun is waiting at the Yingzhou border, Guan Yu at the Jingzhou border, and Liu Bei, Zhuge Liang and Pang Tong ride out ten li to meet him."), NOT_CAO)],
    [choice("host", "strategy", T("尽地主之谊：陪他喝了三天酒，一个字也不提西川。", "Play the host: three days of wine, and not one word about the west."),
            T("第三天送别时，张松从袖中取出一张图：『松感明公盛德，敢献此图。』他把图递给刘备，却回头看了你一眼。", "On the third day, at the farewell, Zhang Song takes a map from his sleeve. 'Moved by your great virtue, I dare to offer this.' He hands it to Liu Bei, but looks back at you."),
            [setv("flag.honored_zs"), rel("zhangsong", "esteem", 2), rel("liubei", "trust", 1)], echo=["e_zs"], when=NOT_CAO),
     choice("ask", "dilemma", T("开门见山：先生此来，是为西川找一个新主人吧？", "Get straight to it: you've come to find the west a new master, haven't you?"),
            T("张松的脸色变了变，随即大笑：『痛快！』图还是献了，可他跟刘备说话时，再也没看过你。", "Zhang Song's face flickers, then he roars with laughter. 'Refreshing!' He still offers the map—but when he talks to Liu Bei, he never looks at you again."),
            [rel("zhangsong", "esteem", -1), rel("liubei", "trust", 1), add("renown.cunning")], when=NOT_CAO),
     choice("follow", "dilemma", T("跟张松一起走。去荆州。", "Leave with Zhang Song. Go to Jingzhou."),
            T("你在城外追上了张松。他打量着你：『你是刘备的人，还是曹操的人？』『今天起，是刘备的。』到了荆州，刘备拉着你的手，半晌没说话。", "You catch Zhang Song outside the walls. He looks you over. 'Are you Liu Bei's man, or Cao Cao's?' 'From today, Liu Bei's.' In Jingzhou, Liu Bei takes your hands and can't speak for a while."),
            [setv("flag.defected"), setv("track", "liu"), rel("caocao", "regard", -4), rel("zhangsong", "esteem", 2), rel("liubei", "trust", 1)], when=V("track", "==", "cao"), echo=["e_defect"]),
     choice("north", "dilemma", T("留下。", "Stay."),
            T("张松走了。几年后，你在许都听说刘备取了西川，有人说起一张地图。曹操那天喝了很多酒，问你：『当初，孤是不是该留住那个矮子？』", "Zhang Song leaves. Years later, in Xuchang, you hear that Liu Bei has taken the west, and people talk about a map. Cao Cao drinks a great deal that day and asks you, 'Should I have kept that little man after all?'"),
            [setv("flag.cao_forever"), rel("caocao", "regard", 1)], when=V("track", "==", "cao"))],
    quote=T("其人生得额镢头尖，鼻偃齿露，身短不满五尺，言语有若铜钟。……松于袖中取出一图，递与玄德曰：「松感明公盛德，敢献此图。便知蜀中道路矣。」",
            "The man had a pointed skull, a flat nose and teeth that showed, stood under five feet tall, and spoke like a bronze bell. … Song took a map from his sleeve and handed it to Xuande. \"Moved by your virtue, I dare to offer this map. With it you will know the roads of Shu.\""),
    callbacks=[cb("e_cloak", T("曹操把一件新袍子扔给你：『潼关那件，孤还你。』", "Cao Cao tosses you a new robe. 'For the one at Tongguan.'"), F("flag.saved_cao")),
               cb("e_cao_stay", T("你烧掉的那封信，鲁肃又写了一封，托张松带来了。", "Lu Su has written again, the letter you burned, and sent it with Zhang Song."), F("flag.cao_stay"))],
    order=10))
N[-1]["choices"][3]["ends"] = True

# ---------- c6 截江 ----------
N.append(node("c6_river", "c6", "main", T("截江夺阿斗", "On the River"), "literal", T("第61回", "Ch. 61"),
    [P(T("东吴来信，说国太病重，要孙夫人带阿斗回去见一面。夫人带着阿斗上了船。赵云得了信，沿江追来。你在他的小船上。", "A letter comes from Wu: Lady Wu is gravely ill and wants to see her daughter—and the boy, A Dou. Lady Sun takes A Dou aboard a ship. Zhao Yun hears of it and races down the river. You are in his little boat.")),
     P(T("鲁肃事先派人悄悄告诉了你：那封信是假的。", "Lu Su had already sent someone to tell you quietly: the letter is a fake."), R("lusu", "trust", ">=", 5)),
     P(T("孙夫人看见你，脸色变了：江边那一夜，你撇下过她。", "Lady Sun sees you and her face hardens: that night on the riverbank, you left her behind."), F("flag.left_sun")),
     P(T("她也没忘你说过的那些话。", "Nor has she forgotten the things you said to her."), I("sunfuren", "offended", ">=", 1)),
     P(T("孙夫人看见你，神色一松：江边那一刀，是你替她挨的。", "Lady Sun sees you and something in her eases: that cut on the riverbank, you took for her."), F("flag.rearguard"))],
    [choice("board", "strategy", T("随赵云跳上大船，挡在夫人面前。", "Leap aboard the big ship with Zhao Yun and stand before the lady."),
            T("赵云掣剑在手：『主母欲何往？何故不令军师知会？』僵持到天明，张飞的船横截江面，大喊：『嫂嫂留下侄儿！』阿斗被抱了回来，孙夫人带着五只船回了东吴。", "Zhao Yun draws his sword. 'My lady, where are you going? Why did you not tell the strategist?' The standoff lasts till dawn, when Zhang Fei's boats block the river and he bellows, 'Sister, leave my nephew!' A Dou is carried back; Lady Sun sails home to Wu with five ships."),
            [setv("flag.adou_kept"), rel("zhaoyun", "trust", 1), rel("sunfuren", "warmth", -1), add("renown.loyal")], echo=["e_adou"]),
     choice("talk", "dilemma", T("先上船，单独和夫人说几句。", "Board first and speak to the lady alone."),
            T("你在船舱里跟她说了很久。最后她亲手把阿斗交给你：『告诉玄德，我不是来偷他儿子的。我只是想回家看我娘。』她走得很体面，东吴那边也挑不出理来。", "You speak with her a long while in the cabin. In the end she hands A Dou to you herself. 'Tell Xuande I didn't come to steal his son. I only wanted to go home and see my mother.' She leaves with dignity, and Wu can find no grievance in it."),
            [setv("flag.sun_parted"), setv("flag.adou_kept"), rel("sunfuren", "trust", 2), rel("liubei", "trust", 1), add("deviation")], echo=["e_adou"],
            req=R("sunfuren", "warmth", ">=", 3), hint=T("需要孙夫人对你有足够的交情（≥ 3）", "Needs enough friendship with Lady Sun (≥ 3)")),
     choice("let", "expression", T("让她走。", "Let her go."),
            T("赵云不肯。他一个人跳上了大船。后来的事，和原著写的一样。", "Zhao Yun won't hear of it. He leaps aboard alone. What follows happens just as the novel tells it."),
            [rel("zhaoyun", "trust", -1)])],
    quote=T("赵云……掣所佩青釭剑在手，……云曰：「主母欲何往？何故不令军师知会？」……张飞……大叫：「嫂嫂留下侄儿！」",
            "Zhao Yun … drew the Qinggang sword at his side. … \"My lady, where are you going? Why did you not tell the strategist?\" … Zhang Fei … roared, \"Sister, leave my nephew behind!\""),
    callbacks=[cb("e_zy", T("赵云在船头低声对你说：『桂阳那回，先生懂我。今天，子龙也懂先生。』", "At the bow Zhao Yun says quietly, 'At Guiyang you understood me, sir. Today I understand you.'"), F("flag.zy_refused")),
               cb("e_defect", T("赵云看见你，愣了一下：『先生从北边回来了？』他什么也没再问。", "Zhao Yun sees you and pauses. 'You've come back from the north, sir?' He asks nothing more."), F("flag.defected")),
               cb("e_left_sun", T("你想起江边那一夜，她自己挥鞭赶车的样子。", "You remember her whipping her own horses on the riverbank that night."), F("flag.left_sun")),
               ],
    order=10, when=NOT_CAO))

N.append(node("c6_wenzhi", "c6", "side", T("去留", "Going or Staying"), "free", T("原创人物", "original character"),
    [P(T("温芷这些日子话很少。", "Wen Zhi has said very little these days."), R("wenzhi", "trust", "<=", 1)),
     P(T("大军要西去了。温芷在收拾药箱，收了一半，停下来问你：『你要我跟着去西川，还是留在荆州？』", "The army is going west. Wen Zhi is packing her medicine chest; halfway through she stops. 'Do you want me to come west, or stay in Jingzhou?'")),
     P(T("她顿了一下，又说：『要是……以后有了孩子，我想他在一个不打仗的地方长大。』", "She pauses. 'If… one day there's a child, I'd like him to grow up somewhere without a war.'"), F("flag.confessed"))],
    [choice("west", "dilemma", T("跟我去西川。", "Come west with me."),
            T("『好。』她把药箱合上了，『那就去看看蜀道到底有多难。』", "'All right.' She shuts the chest. 'Then let's see how hard those Shu roads really are.'"),
            [setv("flag.wz_west"), rel("wenzhi", "intimacy", 1), rel("wenzhi", "trust", 1)], echo=["e_wz_road"]),
     choice("stay", "dilemma", T("留在荆州。关将军那里，更需要大夫。", "Stay in Jingzhou. General Guan will need a physician more."),
            T("她点点头，没说什么，过了一会儿才说：『那你记得写信。』", "She nods and says nothing; after a while: 'Then remember to write.'"),
            [setv("flag.wz_jingzhou"), rel("wenzhi", "trust", 1), rel("guanyu", "respect", 1)], echo=["e_wz_road"]),
     choice("child", "expression", T("说：等打下西川，我们就有一个不打仗的地方了。", "Say: once the west is taken, we'll have a place without a war."),
            T("温芷笑了，把头靠在你肩上，没有说话。窗外，江上起了雾。", "Wen Zhi smiles and leans her head on your shoulder, saying nothing. Outside, mist is rising on the river."),
            [setv("flag.wz_child"), setv("flag.wz_west"), rel("wenzhi", "intimacy", 2)], when=F("flag.confessed"), echo=["e_wz_road"],
            req=R("wenzhi", "intimacy", ">=", 3), hint=T("需要和温芷足够亲近（≥ 3）", "Needs enough closeness with Wen Zhi (≥ 3)"))],
    when=ALL(NOT_CAO, F("flag.wenzhi_with_you")), salience=4, order=1))

N.append(talk_node("c6_pangtong", "c6", T("夜谈·庞统", "Night Talk: Pang Tong"),
    [P(T("入川前一夜。庞统一个人在帐里喝酒，见你掀帘进来，往旁边挪了挪。", "The night before the march west. Pang Tong is drinking alone in his tent; when you lift the flap he moves over.")),
     P(T("『今天不许夸我。』他先说。", "'No compliments tonight,' he says first."), I("pangtong", "flattery", ">=", 1))],
    "pangtong", 2,
    [topic("kongming", T("问他：你和孔明，到底谁更厉害？", "Ask him: you or Kongming—who is really better?"),
           T("庞统哈哈大笑：『卧龙、凤雏，得一可安天下。主公两个都有了，天下怎么还没安？』笑完了，他低声说：『这一趟，我要让人看看凤雏。』", "Pang Tong laughs aloud. 'The Sleeping Dragon or the Young Phoenix—either one can settle the realm. Our lord has both, so why isn't it settled?' Then, quietly: 'This time I'll show them the phoenix.'"),
           [rel("pangtong", "warmth", 1)]),
     topic("road", T("劝他：入川的路，宁可慢，不可险。", "Urge him: on the road west, better slow than dangerous."),
           T("庞统摆摆手：『兵贵神速。慢了，刘璋就醒过来了。』他看了你一眼：『不过你的话，我记下了。』", "Pang Tong waves it off. 'Speed is everything. Go slow, and Liu Zhang wakes up.' He glances at you. 'But I'll remember you said it.'"),
           [rel("pangtong", "esteem", 1)]),
     topic("face", T("问他：孙权不用你，是因为那张脸吗？", "Ask him: did Sun Quan turn you down because of your face?"),
           T("『是，也不是。』庞统摸了摸自己的脸，『他嫌我丑，也嫌我狂。主公只嫌我狂。』他举杯：『所以我跟主公。』", "'Yes and no.' Pang Tong touches his face. 'He found me ugly, and arrogant. Our lord only finds me arrogant.' He raises his cup. 'So I follow our lord.'"),
           [rel("pangtong", "warmth", 1), rel("pangtong", "esteem", 1)])],
    T("庞统没有送你，只是在你身后说了一句：『到了雒城，我请你喝西川的酒。』", "Pang Tong doesn't see you out, only calls after you: 'At Luocheng, the western wine's on me.'"), when=NOT_CAO, order=20))
N[-1]["callbacks"] = [cb("e_pt", T("『柴桑那顿酒，』庞统说，『还欠着你一顿。』", "'That night at Chaisang,' Pang Tong says, 'I still owe you a drink.'"), F("flag.met_pangtong")),
                      cb("e_pt_vouch", T("『耒阳的事，』庞统说，『张飞到现在还跟人讲。』", "'That business at Leiyang,' Pang Tong says. 'Zhang Fei still tells everyone.'"), F("flag.vouched_pangtong")),
                      ]

# ---------- c7 落凤坡 ----------
N.append(node("c7_luofeng", "c7", "main", T("落凤坡", "Fallen Phoenix Slope"), "literal", T("第63回", "Ch. 63"),
    [P(T("雒城外有两条路：大路平坦，小路险窄。庞统要走小路。临行前，他的马把他掀了下来。刘备把自己的白马让给了他。", "Two roads lead to Luocheng: the main road, level and open, and a narrow one through the hills. Pang Tong means to take the narrow road. Just before setting out, his horse throws him. Liu Bei gives him his own white horse.")),
     P(T("你记得这个地方的名字。你一直记得。", "You remember what this place is called. You always have."), V("uncanny", ">=", 2)),
     P(T("张松死前没给你留一句话。", "Zhang Song left no word for you before he died."), I("zhangsong", "offended", ">=", 1))],
    [choice("stop", "dilemma", T("拦住庞统：今天不能走小路。不要问为什么。", "Stop Pang Tong: not the narrow road today. Don't ask why."),
            T("庞统盯着你看了很久，最后骂了一句，调转马头。那天，小路上的伏兵等了一整天，射死了一匹探路的白马。雒城晚破了三个月，庞统活了下来。他再也没问过你为什么。",
              "Pang Tong stares at you a long time, then swears and turns his horse. That day the ambush on the narrow road waits from dawn to dusk and kills one white horse sent ahead to scout. Luocheng falls three months later than it would have. Pang Tong lives. He never asks you why."),
            [setv("flag.pt_alive"), add("uncanny", 2), add("deviation", 2), rel("pangtong", "warmth", 2), rel("pangtong", "esteem", -1), rel("zhuge", "wary", 1)], debt=["d_phoenix"], echo=["e_luofeng"],
            foresight=True, req=ANY(R("pangtong", "warmth", ">=", 3), R("pangtong", "esteem", ">=", 3)), hint=T("需要庞统肯听你的（交情或看重 ≥ 3）", "Needs Pang Tong to listen to you (friendship or esteem ≥ 3)")),
     choice("ride", "dilemma", T("陪他走小路。", "Ride the narrow road with him."),
            T("走到半路，庞统勒住马问：『此处是何地名？』降兵说：『此处地名落凤坡。』庞统惊道：『吾道号凤雏，此处名落凤坡，不利于吾。』话音未落，山坡上一声炮响，箭如飞蝗，只朝骑白马的人射来。你扑过去时，已经晚了。他倒下前，抓住你的袖子说了一句话。",
              "Halfway along Pang Tong reins in. 'What is this place called?' A surrendered soldier answers, 'This is Fallen Phoenix Slope.' Pang Tong starts. 'They call me the Young Phoenix, and this is called Fallen Phoenix Slope. This bodes ill for me.' Before the words are out a cannon booms on the hillside and arrows fly like locusts, all aimed at the man on the white horse. You throw yourself toward him, too late. Before he falls, he grips your sleeve and says one thing."),
            [setv("flag.with_pangtong"), rel("pangtong", "warmth", 2), rel("liubei", "trust", 1), add("renown.loyal")], echo=["e_luofeng"]),
     choice("main", "expression", T("随主公走大路。", "Go by the main road with your lord."),
            T("傍晚，小路上的兵逃回来报信：军师被乱箭射死了。刘备望西大哭。", "At dusk survivors from the narrow road come back with the news: the strategist has been shot dead by a storm of arrows. Liu Bei faces west and weeps."), [])],
    quote=T("庞统心下甚疑，勒住马问：「此处是何地名？」内有新降军士，指道：「此处地名落凤坡。」庞统惊曰：「吾道号凤雏，此处名落凤坡，不利于吾。」令后军疾退。只听山坡前一声炮响，箭如飞蝗，只望骑白马者射来。可怜庞统竟死于乱箭之下。时年止三十六岁。",
            "Pang Tong grew uneasy, reined in and asked, \"What is this place called?\" A newly surrendered soldier pointed: \"This place is called Fallen Phoenix Slope.\" Pang Tong started. \"My name is the Young Phoenix, and this is Fallen Phoenix Slope. It bodes ill for me.\" He ordered the rear to fall back at once. A cannon boomed on the slope, arrows flew like locusts, all aimed at the rider on the white horse. Alas, Pang Tong died beneath the arrows, only thirty-six years old."),
    callbacks=[cb("e_weiyan", T("魏延抢着打头阵。你想起诸葛亮在长沙之后的安排：每次都多派一支兵跟在他后面。", "Wei Yan pushes to lead the van. You remember Zhuge Liang's arrangement after Changsha: always another column behind him."), F("flag.foresaw_weiyan")),
               cb("e_weiyan", T("黄忠、魏延争着打头阵。魏延路过你身边，低声说：『长沙那天，先生的话，魏某记着。』", "Huang Zhong and Wei Yan argue over who leads the van. Passing you, Wei Yan says quietly, 'That day at Changsha—I remember what you said, sir.'"), F("flag.pleaded_weiyan")),
               cb("e_zs", T("张松死了。临死前，他托人带给你一句话：『荆州那三天的酒，松记着。』", "Zhang Song is dead. Before he died he sent you a message: 'Those three days of wine in Jingzhou—I remember them.'"), F("flag.honored_zs"))],
    order=10))
N[-1]["when"] = NOT_CAO

N.append(talk_node("c7_guanyu", "c7", T("夜谈·关羽", "Night Talk: Guan Yu"),
    [P(T("诸葛亮奉命入川，荆州交给关羽一个人守。临行前一夜，你去关羽那里坐了坐。", "Zhuge Liang has been summoned west, and Jingzhou is left to Guan Yu alone. The night before you leave, you go and sit with him."), NF("flag.pt_alive")),
     P(T("庞统没死，雒城却迟迟攻不下。刘备还是把诸葛亮召进了川，荆州交给关羽一个人守。临行前一夜，你去关羽那里坐了坐。", "Pang Tong lived, but Luocheng won't fall. Liu Bei summons Zhuge Liang west after all, and Jingzhou is left to Guan Yu alone. The night before you leave, you go and sit with him."), F("flag.pt_alive"))],
    "guanyu", 2,
    [topic("wu", T("劝他：东吴那边，能和就和。", "Urge him: with Wu, keep the peace if he can."),
           T("关羽捋着胡须：『军师也是这么说的，八个字。』他没有说是哪八个字，只说：『孙权那个人，我看不上。』", "Guan Yu strokes his beard. 'The strategist said the same. Eight characters.' He doesn't say which eight. He only says, 'That Sun Quan—I don't think much of him.'"),
           [rel("guanyu", "respect", 1)]),
     topic("brother", T("说：大哥把荆州交给你，是最信你。", "Say: your brother left Jingzhou to you because he trusts you most."),
           T("关羽沉默了很久：『我知道。所以我不能丢。』", "Guan Yu is silent a long time. 'I know. That's why I can't lose it.'"),
           [rel("guanyu", "respect", 1), setv("flag.guan_charge")]),
     topic("huarong", T("说起华容道。", "Bring up Huarong."),
           [P(T("『那一跪，』关羽说，『我还记着。』他给你斟满了酒。", "'You knelt,' Guan Yu says. 'I still remember.' He fills your cup."), F("flag.vouched_guan")),
            P(T("『那一天你在道上求我，』关羽说，『我放了他。到现在也不知道对不对。』", "'That day on the road you begged me,' Guan Yu says, 'and I let him go. I still don't know if it was right.'"), F("flag.pleaded_guan")),
            P(T("关羽摇摇头：『那件事，不提了。』", "Guan Yu shakes his head. 'Let's not speak of that.'"), ALL(NF("flag.vouched_guan"), NF("flag.pleaded_guan")))],
           [rel("guanyu", "owes", 1)], when=ANY(F("flag.vouched_guan"), F("flag.pleaded_guan"), NF("flag.vouched_guan")))],
    T("关羽送你到门口：『到了西川，替我看看大哥。』", "Guan Yu walks you to the door. 'In the west, look after my brother for me.'"), when=NOT_CAO, order=20))
N[-1]["callbacks"] = [
                      cb("e_wz_road", T("关羽说：『温大夫的事，你放心。』", "Guan Yu says, 'Don't worry about Physician Wen.'"), F("flag.wz_jingzhou")),
                      cb("e_wz_road", T("关羽说：『听说温大夫也要西去。蜀道难，让她多带些药。』", "Guan Yu says, 'I hear Physician Wen is going west too. The Shu roads are hard; tell her to take plenty of medicine.'"), F("flag.wz_west"))]
N[-1]["intro"].append(P(T("关羽给你留了座位，酒已经温好了。", "Guan Yu has kept a seat for you, and the wine is already warm."), R("guanyu", "respect", ">=", 6)))
N[-1]["intro"].append(P(T("关羽看了你一眼，又低下头去擦刀。你们之间，还隔着以前那些话。", "Guan Yu glances at you, then goes back to his blade. What you said to him before still stands between you."), I("guanyu", "offended", ">=", 1)))

# ---------- c8 益州 ----------
N.append(node("c8_chengdu", "c8", "main", T("益州牧", "Governor of Yi"), "functional", T("第65回", "Ch. 65"),
    [P(T("刘璋开城出降。刘备入成都，自领益州牧，大封文武。轮到你的时候，他没有念名单，而是放下了竹简。", "Liu Zhang opens the gates and surrenders. Liu Bei enters Chengdu, makes himself Governor of Yi, and hands out rewards to all his officers. When he comes to you he doesn't read from the list; he puts down the slips.")),
     P(T("庞统坐在诸葛亮旁边，冲你挤了挤眼。", "Pang Tong, seated beside Zhuge Liang, winks at you."), F("flag.pt_alive")),
     P(T("诸葛亮旁边的那个位子空着。那是留给庞统的。", "The seat beside Zhuge Liang is empty. It was meant for Pang Tong."), NF("flag.pt_alive")),
     P(T("诸葛亮看你的时候，总像在算什么。", "When Zhuge Liang looks at you, he always seems to be calculating something."), R("zhuge", "wary", ">=", 3)),
     P(T("刘备看你的眼神，比在许都时冷了一些。你说过的那些话，他没忘。", "Liu Bei's eyes are a little cooler than they were in Xuchang. He hasn't forgotten the things you said."), I("liubei", "offended", ">=", 2))],
    [choice("stay", "dilemma", T("留在成都，帮主公治理益州。", "Stay in Chengdu and help govern Yi."),
            T("刘备点头：『有子衡在，我放心。』你领了一个治中从事的职位，住进了城西的一座小院。", "Liu Bei nods. 'With you here, I can rest easy.' You take a post as administrator and move into a small house on the west side of the city."),
            [setv("flag.post_chengdu"), rel("liubei", "trust", 1), rel("zhuge", "respect", 1)]),
     choice("jingzhou", "dilemma", T("请命回荆州，去关将军身边。", "Ask to go back to Jingzhou, to General Guan's side."),
            T("刘备沉默了一会儿：『二弟性子刚，有你在旁边，我也放心。』诸葛亮看着你，扇子停了很久。", "Liu Bei is quiet a moment. 'My brother is hard-tempered. With you beside him, I can rest easy.' Zhuge Liang looks at you, his fan still for a long time."),
            [setv("flag.post_jingzhou"), rel("guanyu", "respect", 1), rel("liubei", "trust", 1)]),
     choice("none", "expression", T("什么都不要。", "Ask for nothing."),
            T("刘备看了你很久，笑了：『子衡还是子衡。』那天散席后，他一个人来你的住处坐了很久。", "Liu Bei looks at you a long time, then smiles. 'Ziheng is still Ziheng.' After the feast he comes to your lodging alone and sits a long while."),
            [setv("flag.post_none"), rel("liubei", "trust", 2), add("renown.loyal")])],
    on_enter=[{"when": DEBT("d_phoenix"), "effects": [], "resolve": [("d_phoenix", "reroute")],
               "text": T("诸葛亮终究还是入了川——不是因为庞统死了，是因为雒城久攻不下。荆州，还是只剩关羽一个人。", "Zhuge Liang came west after all—not because Pang Tong died, but because Luocheng would not fall. Jingzhou is still left to Guan Yu alone.")}],
    callbacks=[cb("e_adou", T("阿斗在席间跑来跑去，跑到你跟前停了一下。赵云说：『那天在船上，抱他的是先生。』", "A Dou runs about the hall and stops in front of you. Zhao Yun says, 'That day on the ship, it was you who held him, sir.'"), F("flag.adou_kept")),
               cb("e_luofeng", T("你想起落凤坡的箭雨。", "You think of the arrows at Fallen Phoenix Slope."), ANY(F("flag.with_pangtong"), F("flag.pt_alive")))],
    order=10, when=NOT_CAO))

# ---------- crises (any chapter) ----------
def crisis(id, title, intro, choices, when, order):
    return node(id, "*", "interrupt", title, "free", T("原创危机", "original crisis"), intro, choices, when=when, order=order)
N.append(crisis("x_cold", T("冷落", "Sidelined"),
    T("议事时，刘备已经很久没有问过你了。诸葛亮私下对你说：『子衡兄，主公心里有个结。』", "It's been a long time since Liu Bei asked your opinion at council. Zhuge Liang tells you privately, 'Ziheng, our lord has a knot in his heart.'"),
    [choice("mend", "strategy", T("去找主公，把话说开。", "Go to your lord and talk it through."),
            T("你们谈了一夜。天亮时，刘备说：『是我多心了。』", "You talk all night. At dawn Liu Bei says, 'I've been too suspicious.'"), [rel("liubei", "trust", 2), add("renown.loyal")],
            req=ANY(R("zhuge", "respect", ">=", 3), R("zhaoyun", "trust", ">=", 4)), hint=T("需要诸葛亮敬重你（≥ 3）或赵云信任你（≥ 4），替你说一句话", "Needs Zhuge Liang's respect (≥ 3) or Zhao Yun's trust (≥ 4) to put in a word for you")),
     choice("wait", "expression", T("等。做好手上的事。", "Wait. Do the work in front of you."), T("日子过得很慢。议事时，你的位子挪到了后排。", "The days pass slowly. At council your seat has moved to the back row."), [rel("liubei", "trust", 1), setv("flag.sidelined")]),
     choice("go", "dilemma", T("告辞。", "Take your leave."), T("刘备没有留你。", "Liu Bei doesn't ask you to stay."), [setv("flag.v2_left")])],
    ALL(NOT_CAO, R("liubei", "trust", "<=", 1)), 3))
N[-1]["callbacks"] = [cb("e_defect", T("有人在背后说：曹营来的人，靠不住。", "Behind your back people say: a man from Cao's camp can't be trusted."), F("flag.defected"))]
N[-1]["choices"][2]["ends"] = True
N.append(crisis("x_uncanny", T("妖人", "Sorcerer"),
    T("你说中的事情太多了。蜀中有人传，刘备帐下有一个能知未来的妖人。诸葛亮来找你：『子衡兄，亮不问你从哪里知道的。可别人会问。』", "You've been right about too many things. In Shu people whisper that Liu Bei has a sorcerer who knows the future. Zhuge Liang comes to you. 'I won't ask how you know, Ziheng. But others will.'"),
    [choice("hide", "strategy", T("从此闭口：只说眼前的事。", "Hold your tongue from now on: speak only of what's in front of you."), T("你很久没有再说过一句准话。人们慢慢忘了。", "For a long time you say nothing that comes true. People slowly forget."), [add("uncanny", -2), rel("zhuge", "wary", -1)]),
     choice("trust", "dilemma", T("把实话告诉诸葛亮一个人。", "Tell Zhuge Liang alone the truth."), T("诸葛亮听完，摇着扇子笑了很久：『原来如此。那亮以后，要多问问子衡兄了。』", "Zhuge Liang hears you out and laughs a long while behind his fan. 'So that's it. Then I shall have to ask you more often.'"),
            [rel("zhuge", "respect", 2), rel("zhuge", "wary", 2), add("uncanny", -1)], req=R("zhuge", "respect", ">=", 4), hint=T("需要诸葛亮足够敬重你（≥ 4）", "Needs Zhuge Liang's respect (≥ 4)")),
     choice("leave", "dilemma", T("离开，免得连累主公。", "Leave, so your lord isn't tainted by you."), T("你在一个雨夜出了成都。", "You leave Chengdu one rainy night."), [setv("flag.v2_exposed")])],
    V("uncanny", ">=", 6), 2))
N[-1]["choices"][2]["ends"] = True
N.append(crisis("x_loose", T("失言", "A Slip of the Tongue"),
    T("你说过的那些话，有人一句句抄了下来，送到了主公案头。", "Someone has copied down the things you've said, line by line, and put them on your lord's desk."),
    [choice("own", "strategy", T("认：话说过了头。", "Own it: you spoke out of turn."), T("主公没有罚你：『先生是聪明人，聪明人最该管住嘴。』", "Your lord doesn't punish you. 'You're a clever man. Clever men should mind their tongues most of all.'"), [add("renown.rash", -3), rel("liubei", "trust", -1)]),
     choice("argue", "dilemma", T("辩：句句是真话。", "Argue: every word was true."), T("主公听完：『有些真话，要挑时候说。』", "Your lord hears you out. 'Some truths need the right moment.'"), [add("renown.rash", -1), rel("liubei", "trust", -1), rel("zhuge", "respect", 1)])],
    V("renown.rash", ">=", 6), 4))

# Zhou Yu loses his temper on the spot
N.append(node("x_zhouyu_rage", "*", "flash", T("周瑜拔剑", "Zhou Yu Draws His Sword"), "free", T("原创", "original"),
    T("周瑜霍地站起，剑已出鞘：『刘备的人，敢在我营中放肆？』帐下的甲士围了上来。鲁肃急得直跺脚。",
      "Zhou Yu is on his feet with his sword out. 'One of Liu Bei's men, running his mouth in my camp?' Guards close in. Lu Su is stamping with anxiety."),
    [choice("bow", "expression", T("拱手赔罪。", "Bow and apologize."), T("鲁肃打了圆场。周瑜收剑入鞘，冷冷地说：『看在子敬面上。』", "Lu Su smooths it over. Zhou Yu sheathes his sword and says coldly, 'For Zijing's sake.'"), [rel("zhouyu", "esteem", -1), rel("zhouyu", "trust", -1), add("renown.rash")]),
     choice("stand", "dilemma", T("不退：『大都督要杀盟友的人，请便。』", "Don't back down: 'If the Grand Commander wants to kill an ally's man, go ahead.'"),
            T("周瑜盯着你，剑尖慢慢垂了下去：『你倒是有胆。』他转身走了，伤口在衣服下渗出了血。", "Zhou Yu stares at you; slowly his sword point drops. 'You've got nerve.' He turns away; under his robe, his wound is seeping blood."),
            [rel("zhouyu", "esteem", 1), rel("zhouyu", "trust", -2), add("renown.rash", 2), rel("lusu", "trust", -1)])]))

# ------------------------------------------------------------------ open questions
ASKS = {
  "c1_nanjun": {"who": "zhouyu", "fallback": "dodge",
    "q": T("周瑜在阵前遇见你，勒住马：『子衡，你说实话——孔明与我，谁更高明？』", "Zhou Yu meets you before the lines and reins in. 'Ziheng, tell me honestly: Kongming or I—who is the better man?'"),
    "answers": [
      ans("rude", T("讽刺或冒犯周瑜", "mocks or insults Zhou Yu"), T("周瑜的脸色一下子白了。", "Zhou Yu's face goes white."), [add("heat.zhouyu"), rel("zhouyu", "esteem", -1), add("renown.rash")], match=r"气死|小肚|心胸|嫉妒|丢人|jealous|petty|sore loser", mood="cold"),
      ans("kongming", T("说诸葛亮更高明", "says Zhuge Liang"), T("周瑜笑了，笑得很难看：『你倒是诚实。』他拨马就走。", "Zhou Yu smiles, an ugly smile. 'You're honest, at least.' He wheels his horse and goes."), [rel("zhouyu", "esteem", -1), add("heat.zhouyu")], match=r"孔明|诸葛|卧龙|军师|他更|kongming|zhuge", mood="cold"),
      ans("you", T("说周瑜更高明", "says Zhou Yu"), T("周瑜看了你一眼：『这话，你在孔明面前也敢说？』他嘴上这么问，眼里却亮了。", "Zhou Yu looks at you. 'Would you say that in front of Kongming?' But his eyes light up."), [rel("zhouyu", "esteem", 1), rel("zhuge", "wary", 1)], match=r"都督|公瑾|周郎|你更|您更|大都督|zhou yu|gongjin|you are|you're better", mood="warm"),
      ans("both", T("说两人各有所长、不可比", "says each has his own strengths"), T("周瑜沉默了一会儿：『各有所长……可天下只有一个荆州。』", "Zhou Yu is silent a moment. 'Each has his strengths… but there is only one Jingzhou.'"), [rel("zhouyu", "esteem", 1)], match=r"各有|不分|都|难分|一个.*一个|each|both|equal", mood="neutral"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("周瑜冷笑一声：『刘备手下的人，说话都学会绕弯了。』", "Zhou Yu snorts. 'Liu Bei's people have all learned to talk in circles.'"), [], match=r"不知|不好说|不敢|不便|i don't know|can't say", mood="cold"),
    ]},
  "c2_changsha": {"who": "guanyu", "fallback": "dodge",
    "q": T("散了帐，关羽叫住你：『黄忠刀法不在我之下，他马失前蹄，我放了他。你说，我做得对不对？』", "After the council Guan Yu calls you back. 'Huang Zhong's blade is as good as mine. His horse stumbled and I let him go. Tell me—was I right?'"),
    "answers": [
      ans("right", T("说对：这是义", "says yes—that was righteous"), T("关羽点了点头：『你懂。』", "Guan Yu nods. 'You understand.'"), [rel("guanyu", "respect", 1)], match=r"对|义|应该|没错|好汉|英雄|right|honou?r|righteous|yes", mood="warm"),
      ans("wrong", T("说不对：战场上不该留情", "says no—no mercy on the battlefield"), T("关羽的脸沉了下来：『那你和韩玄，有什么两样？』", "Guan Yu's face darkens. 'Then how are you different from Han Xuan?'"), [rel("guanyu", "respect", -1)], match=r"不对|不该|错|心软|妇人之仁|wrong|weak|mistake|no\b", mood="cold"),
      ans("gain", T("说结果是好的：收了黄忠这员大将", "says it worked out—it won them Huang Zhong"), T("关羽皱眉：『我放他，不是为了收他。』他顿了顿，『不过……也好。』", "Guan Yu frowns. 'I didn't spare him to win him.' A pause. 'Still… it's well.'"), [rel("guanyu", "respect", 0), add("renown.cunning")], match=r"收|得了|大将|归降|值|won him|recruit|gain", mood="neutral"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("关羽看了你一会儿，不再问了。", "Guan Yu looks at you a while and asks no more."), [], match=r"不知|不好说|将军自己|you know best|can't say", mood="neutral"),
    ]},
  "c3_flight": {"who": "sunfuren", "fallback": "dodge",
    "q": T("马车停下来换马时，孙夫人掀开帘子看着你：『你说实话——你家主公娶我，是真心，还是借我？』", "While the horses are changed, Lady Sun pulls back the curtain and looks at you. 'Tell me the truth—did your lord marry me because he wanted me, or to use me?'"),
    "answers": [
      ans("both", T("说两者都有", "says both"), T("孙夫人愣了一下，笑了：『你倒是不骗人。』", "Lady Sun blinks, then laughs. 'You don't lie, at least.'"), [rel("sunfuren", "trust", 2), rel("sunfuren", "warmth", 1)], match=r"都有|既.*也|一半|两者|both|a bit of both|half", mood="warm"),
      ans("use", T("直说是借她、联姻是为了政治", "admits it was politics"), T("孙夫人的脸色变了，又慢慢平复：『至少你说了实话。别人都在哄我。』", "Lady Sun's face changes, then slowly settles. 'At least you told me the truth. Everyone else just humors me.'"), [rel("sunfuren", "trust", 2), rel("sunfuren", "warmth", -1), rel("liubei", "trust", -1)], match=r"借|政治|联盟|结盟|两家|利益|politic|alliance|use you", mood="cold"),
      ans("love", T("说主公是真心", "says Liu Bei truly loves her"), T("孙夫人看着你：『你说得这么快，是早想好的吧？』她放下了帘子。", "Lady Sun studies you. 'You said that very quickly. Did you prepare it?' She drops the curtain."), [rel("sunfuren", "trust", -1)], match=r"真心|喜欢|爱|真情|love|truly|really cares", mood="neutral"),
      ans("rude", T("冒犯她或说她不配", "insults her"), T("孙夫人的刀已经架在了车窗上：『再说一遍？』", "Lady Sun's blade is already resting on the carriage window. 'Say that again?'"), [add("heat.sunfuren"), rel("sunfuren", "warmth", -2), add("renown.rash")], match=r"不配|人质|筹码|棋子|hostage|pawn|bargaining chip", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("孙夫人冷哼一声：『荆州人都这样说话。』", "Lady Sun snorts. 'Everyone from Jingzhou talks like that.'"), [rel("sunfuren", "warmth", -1)], match=r"不知|不好说|问主公|ask him|can't say", mood="cold"),
    ]},
  "c5_zhangsong": {"who": "zhangsong", "fallback": "dodge", "when": NOT_CAO,
    "q": T("酒过三巡，张松忽然放下杯子：『松这副模样，在许都被人当笑话。你家主公，为何以礼相待？』", "Several cups in, Zhang Song suddenly sets down his cup. 'In Xuchang they laughed at a man who looks like me. Why does your lord treat me with such courtesy?'"),
    "answers": [
      ans("talent", T("说看重的是他的才学", "says it's his talent"), T("张松的眼睛亮了：『过目不忘这点小本事，也有人看得上？』", "Zhang Song's eyes light up. 'This little knack of never forgetting a page—someone actually values it?'"), [rel("zhangsong", "esteem", 2)], match=r"才|学|本事|过目不忘|学问|talent|learning|memory|ability", mood="warm"),
      ans("virtue", T("说主公待人一向如此", "says Liu Bei treats everyone this way"), T("张松点头：『曹操若有皇叔一半的气度……罢了。』", "Zhang Song nods. 'If Cao Cao had half Lord Liu's grace… never mind.'"), [rel("zhangsong", "esteem", 1), rel("liubei", "trust", 1)], match=r"仁|一向|待人|宽厚|礼贤|always|kind|courtesy", mood="warm"),
      ans("west", T("直说是为了西川", "admits it's about the west"), T("张松大笑：『痛快！』笑完了，他慢慢说：『可松最恨被人当成一张地图。』", "Zhang Song roars with laughter. 'Refreshing!' Then, slowly: 'But what I hate most is being treated as a map.'"), [rel("zhangsong", "esteem", -1), add("renown.cunning")], match=r"西川|益州|蜀|地图|图|the west|map|shu", mood="surprised"),
      ans("rude", T("取笑他的相貌", "mocks his looks"), T("张松的脸一下子沉了：『原来刘家和曹家，一样。』", "Zhang Song's face falls. 'So the Liu house is no different from Cao's.'"), [add("heat.zhangsong"), rel("zhangsong", "esteem", -2), add("renown.rash")], match=r"丑|矮|难看|样子|长相|ugly|short|looks", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("张松也不追问，自顾自喝酒。", "Zhang Song doesn't press, and goes back to his wine."), [], match=r"不知|不好说|i don't know|can't say", mood="neutral"),
    ]},
  "c7_luofeng": {"who": "pangtong", "fallback": "dodge",
    "q": T("出发前，庞统忽然问你，半开玩笑：『子衡，你总像是知道些什么。你说——这一路，我会死在哪里？』", "Before setting out Pang Tong suddenly asks you, half joking, 'Ziheng, you always seem to know something. Tell me—where on this road will I die?'"),
    "answers": [
      ans("name", T("说出落凤坡、坡、伏兵之类的地名或预言", "names the slope, the ambush, or foretells his death"), T("庞统的笑容僵住了。他看了你很久：『你说的，我会记着。』", "Pang Tong's smile freezes. He looks at you a long time. 'I'll remember what you said.'"), [add("uncanny"), rel("pangtong", "esteem", 1), rel("pangtong", "warmth", 1)], match=r"落凤|凤|坡|伏兵|小路|白马|箭|slope|phoenix|ambush|arrow|white horse|narrow road", mood="surprised"),
      ans("dont", T("劝他别去、别走小路", "begs him not to go"), T("庞统拍拍你的肩：『放心，我命硬。』", "Pang Tong claps your shoulder. 'Don't worry. I'm hard to kill.'"), [rel("pangtong", "warmth", 1)], match=r"别去|不要去|别走|留下|don't go|stay|please don't", mood="warm"),
      ans("with", T("说我陪你去", "says he'll go with him"), T("『好！』庞统笑道，『那就一起去喝西川的酒。』", "'Good!' Pang Tong laughs. 'Then we'll drink the western wine together.'"), [rel("pangtong", "warmth", 2)], match=r"陪你|一起|我也去|跟你|with you|together|i'll come", mood="warm"),
      ans("joke", T("开玩笑、说他长命百岁", "jokes, or says he'll live forever"), T("庞统大笑：『借你吉言！』", "Pang Tong roars. 'From your lips to Heaven's ears!'"), [], match=r"长命|百岁|酒|醉|不会死|live forever|hundred|drunk", mood="warm"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("庞统耸耸肩：『不说就算了。』", "Pang Tong shrugs. 'Don't, then.'"), [], match=r"不知|不好说|i don't know|can't say", mood="neutral"),
    ]},
  "c8_chengdu": {"who": "liubei", "fallback": "nothing",
    "q": T("刘备看着你：『子衡，从许都跟到成都，你要什么？』", "Liu Bei looks at you. 'Ziheng, you've followed me from Xuchang to Chengdu. What do you want?'"),
    "answers": [
      ans("guan", T("要回荆州、陪关羽", "to go back to Jingzhou, to Guan Yu"), T("刘备点点头：『我也正想说这件事。』", "Liu Bei nods. 'I was about to raise that myself.'"), [rel("guanyu", "respect", 1)], match=r"荆州|关羽|关将军|云长|二将军|jingzhou|guan yu", mood="warm"),
      ans("wz", T("要和温芷安个家", "a home with Wen Zhi"), T("刘备笑了：『这个好办。城西有座小院，我让人收拾出来。』", "Liu Bei laughs. 'That's easily done. There's a little house on the west side; I'll have it made ready.'"), [rel("wenzhi", "intimacy", 1), rel("liubei", "trust", 1)], match=r"温芷|成家|家|娶|妻|wen zhi|a home|marry|wife", mood="warm"),
      ans("post", T("要官职、要权", "an office, power"), T("刘备想了想：『你想做什么，就去做吧。』", "Liu Bei thinks. 'Whatever you want to do, do it.'"), [rel("liubei", "trust", 0), add("renown.cunning")], match=r"官|职|太守|权|兵|an office|post|power|command", mood="neutral"),
      ans("peace", T("要天下太平、百姓安稳", "peace for the people"), T("刘备沉默了很久：『这个……我还给不了你。』", "Liu Bei is silent a long time. 'That… I can't give you yet.'"), [rel("liubei", "trust", 1), add("renown.loyal")], match=r"太平|百姓|天下|安稳|汉室|peace|the people|the realm|han", mood="sad"),
      ans("nothing", T("什么都不要", "nothing"), T("刘备看着你，没有说话。", "Liu Bei looks at you and says nothing."), [], match=r"不要|没有|什么都|nothing|don't want", mood="warm"),
    ]},
}
ASK_ORDER = {"c1_nanjun": ["rude", "kongming", "you", "both", "dodge"], "c2_changsha": ["wrong", "right", "gain", "dodge"],
             "c3_flight": ["rude", "both", "use", "love", "dodge"], "c5_zhangsong": ["rude", "west", "talent", "virtue", "dodge"],
             "c7_luofeng": ["name", "dont", "with", "joke", "dodge"], "c8_chengdu": ["guan", "wz", "peace", "post", "nothing"]}
byid = {n["id"]: n for n in N}
for nid, a in ASKS.items():
    a["answers"].sort(key=lambda x: ASK_ORDER[nid].index(x["id"]))
    byid[nid]["ask"] = a


# ------------------------------------------------------------------ cast, art, places
CAST = {
    "x_return": cast_("lusu"), "x_north": cast_("caocao"), "x_cold": cast_("liubei", "zhuge"), "x_uncanny": cast_("zhuge"), "x_loose": cast_("liubei"), "x_zhouyu_rage": cast_("zhouyu", "lusu"),
    "c1_wound": cast_("wenzhi", "lusu"), "c1_lusu": cast_("lusu", "zhuge"), "c1_nanjun": cast_("zhouyu", "zhuge"), "c1_cao": cast_("caocao"),
    "c2_guiyang": cast_("zhaoyun"), "c2_changsha": cast_("guanyu", "zhuge"),
    "c3_ganlu": cast_("liubei", "zhaoyun"), "c3_flight": cast_("sunfuren", "zhaoyun"),
    "c4_tongque": cast_("caocao"), "c4_death": cast_("zhouyu", "lusu"), "c4_mourn": cast_("zhuge", "pangtong"), "c4_leiyang": cast_("pangtong"),
    "c5_tongguan": cast_("caocao"), "c5_zhangsong": cast_("zhangsong") + [{"id": "liubei", "when": NOT_CAO}],
    "c6_river": cast_("sunfuren", "zhaoyun"), "c6_wenzhi": cast_("wenzhi"),
    "c7_luofeng": cast_("pangtong", "liubei"),
    "c8_chengdu": cast_("liubei", "zhuge"),
}
def lay(id, when=None, choice=None):
    d = {"id": id}
    if when: d["when"] = when
    if choice: d["choice"] = choice
    return d
ART = {
    "x_return": ("riverbank", [], None), "x_north": ("letter", [], None), "x_cold": ("lamp", [], None), "x_uncanny": ("lamp", [], None), "x_loose": ("letter", [], None), "x_zhouyu_rage": ("hall", [], None),
    "c1_wound": ("herbs", [lay("two")], "jiangling"), "c1_lusu": ("hall", [], "jiangling"), "c1_nanjun": ("citywall", [lay("siege"), lay("flag_liu", choice="take"), lay("flag_wu", choice="yield"), lay("rider")], "jiangling"),
    "c1_cao": ("hall", [], "xuchang"),
    "c2_guiyang": ("citywall", [lay("flag_liu"), lay("dusk")], "guiyang"), "c2_changsha": ("citywall", [lay("open"), lay("flag_liu"), lay("rider")], "changsha"), "c2_zhaoyun": ("campfire", [lay("wall")], "guiyang"),
    "c3_ganlu": ("temple", [lay("ambush"), lay("rock", choice="stone")], "jingkou"), "c3_flight": ("bigriver", [lay("wu_ships"), lay("blockade", choice="lady")], "gongan"),
    "c4_tongque": ("hall", [], "xuchang"), "c4_death": ("lamp", [], "chaisang"), "c4_mourn": ("mourning", [lay("crowd"), lay("phoenix", NF("flag.zhouyu_lives"))], "chaisang"), "c4_leiyang": ("letter", [lay("seal")], "leiyang"),
    "c5_tongguan": ("slope", [], "tongguan"), "c5_zhangsong": ("hall", [], "jiangling"),
    "c6_river": ("bigriver", [lay("child"), lay("zhaoyun"), lay("blockade", choice="board")], "gongan"), "c6_wenzhi": ("herbs", [lay("two")], "gongan"), "c6_pangtong": ("campfire", [], "jiameng"),
    "c7_luofeng": ("ravine", [lay("arrows", choice="ride"), lay("arrows", choice="main"), lay("you", choice="ride"), lay("turnback", choice="stop")], "luofeng"), "c7_guanyu": ("campfire", [lay("blade")], "jiangling"),
    "c8_chengdu": ("citywall", [lay("open"), lay("crowd"), lay("flag_liu")], "chengdu"),
}
for n in N:
    sc, ls, place = ART[n["id"]]
    n["art"] = {"scene": sc, "layers": ls}
    if place: n["place"] = place
    if n["id"] in CAST: n["cast"] = CAST[n["id"]]
PLACE_AFTER = {("c3_ganlu", "*"): "jingkou", ("c5_zhangsong", "follow"): "jiangling", ("c7_luofeng", "stop"): "luocheng", ("c8_chengdu", "jingzhou"): "jiangling"}
for n in N:
    for c in n["choices"]:
        pa = PLACE_AFTER.get((n["id"], c["id"])) or PLACE_AFTER.get((n["id"], "*"))
        if pa and pa != n.get("place"): c["place"] = pa

PLACES = {
    "xuchang": {"x": 760, "y": 70, "rx": 612, "ry": 392, "zh": "许都", "en": "Xuchang"}, "tongguan": {"x": 520, "y": 50, "rx": 440, "ry": 300, "zh": "潼关", "en": "Tongguan"},
    "jiameng": {"x": 250, "y": 110, "rx": 330, "ry": 380, "zh": "葭萌", "en": "Jiameng"}, "luofeng": {"x": 175, "y": 225, "rx": 285, "ry": 455, "zh": "落凤坡", "en": "Fallen Phoenix"},
    "luocheng": {"x": 140, "y": 265, "rx": 262, "ry": 470, "zh": "雒城", "en": "Luocheng"}, "chengdu": {"x": 85, "y": 310, "rx": 238, "ry": 492, "zh": "成都", "en": "Chengdu"},
    "jiangling": {"x": 560, "y": 300, "rx": 540, "ry": 500, "zh": "南郡", "en": "Nanjun"}, "gongan": {"x": 590, "y": 340, "rx": 556, "ry": 516, "zh": "公安", "en": "Gong'an"},
    "changsha": {"x": 650, "y": 420, "rx": 592, "ry": 584, "zh": "长沙", "en": "Changsha"}, "guiyang": {"x": 660, "y": 495, "rx": 602, "ry": 640, "zh": "桂阳", "en": "Guiyang"},
    "leiyang": {"x": 690, "y": 470, "rx": 620, "ry": 620, "zh": "耒阳", "en": "Leiyang"}, "chaisang": {"x": 810, "y": 330, "rx": 700, "ry": 540, "zh": "柴桑", "en": "Chaisang"},
    "jingkou": {"x": 950, "y": 230, "rx": 860, "ry": 452, "zh": "南徐", "en": "Nanxu"},
}
RIVERS = [{"d": "M30 330 C140 340 240 300 360 300 C470 300 540 290 600 320 C680 360 750 345 820 330 C880 318 940 260 1000 240", "w": 14, "label": [880, 300, {"zh": "长江", "en": "Yangtze"}]},
          {"d": "M300 110 C420 150 500 220 560 300", "w": 6, "op": .35, "label": [360, 150, {"zh": "汉水", "en": "Han River"}]},
          {"d": "M60 150 C80 220 75 280 100 330", "w": 5, "op": .3}]

FUTURE = [(T("单刀赴会", "the meeting with a single sword"), "v3"), (T("定军山", "Mount Dingjun"), "v3"), (T("汉中王", "King of Hanzhong"), "v3"),
          (T("水淹七军", "the flooding of the seven armies"), "v4"), (T("刮骨疗毒", "scraping the bone"), "v4"), (T("麦城", "Maicheng"), "v4"),
          (T("夷陵", "Yiling"), "v5"), (T("白帝", "Baidi"), "v5"), (T("托孤", "entrusting the heir"), "v5"), (T("七擒", "seven captures"), "v6"),
          (T("出师表", "the Memorial on Going to War"), "v7"), (T("街亭", "Jieting"), "v7"), (T("空城计", "the empty fort"), "v7"), (T("五丈原", "Wuzhang Plains"), "v7"),
          (T("落凤坡", "Fallen Phoenix Slope"), "c7")]

# ------------------------------------------------------------------ endings
def frag(id, text, when=None, mood=None):
    d = {"id": id, "text": text}
    if when: d["when"] = when
    if mood: d["mood"] = mood
    return d
LIU = ALL(NOT_CAO, NF("flag.v2_hermit"), NF("flag.v2_exposed"), NF("flag.v2_left"))
ENDINGS = [
    {"id": "g_side", "title": T("去处", "Where You Ended Up"), "fragments": [
        frag("hermit", T("你留在了那个渔村。后来的事，你是从过往客商嘴里听来的。", "You stayed in that fishing village. The rest you heard from passing merchants."), F("flag.v2_hermit")),
        frag("north", T("你留在了北方。曹操封魏公那年，你就在台下。", "You stayed in the north. The year Cao Cao became Duke of Wei, you were in the crowd below the dais."), F("flag.cao_forever")),
        frag("exposed", T("你在一个雨夜离开了成都。蜀中从此多了一个关于妖人的故事。", "You left Chengdu one rainy night. Shu gained a new story about a sorcerer."), F("flag.v2_exposed")),
        frag("left", T("你离开了刘备。没有人留你，也没有人忘了你。", "You left Liu Bei. No one asked you to stay. No one forgot you either."), F("flag.v2_left")),
        frag("jingzhou", T("你回了荆州，住在关羽府旁边。江对岸，东吴的灯火一夜比一夜多。", "You went back to Jingzhou and lived beside Guan Yu's residence. Across the river, Wu's lights grew more numerous each night."), F("flag.post_jingzhou")),
        frag("chengdu", T("你留在成都，城西有你的一座小院。", "You stayed in Chengdu, in a little house on the west side."), F("flag.post_chengdu")),
        frag("none", T("你什么都没要。刘备记得这件事，记了很多年。", "You asked for nothing. Liu Bei remembered that for many years."), F("flag.post_none")),
        ]},
    {"id": "g_lord", "title": T("主公", "Your Lord"), "fragments": [
        frag("high", T("刘备入成都那天，第一个叫的名字是诸葛亮，第二个是你。", "The day Liu Bei entered Chengdu, the first name he called was Zhuge Liang's. The second was yours."), ALL(LIU, R("liubei", "trust", ">=", 10))),
        frag("mid", T("刘备遇事会问你。你说的，他大多会听。", "Liu Bei asks your opinion, and mostly takes it."), ALL(LIU, R("liubei", "trust", ">=", 6))),
        frag("low", T("刘备待你客气。你知道，客气就是隔着一层。", "Liu Bei is courteous to you. You know courtesy is a kind of distance."), LIU),
        frag("cao_high", T("曹操说：天下能让孤脱袍相赠的，只有一个人。", "Cao Cao says there is only one man in the realm he would give the robe off his back."), ALL(V("track", "==", "cao"), R("caocao", "regard", ">=", 8))),
        frag("cao", T("曹操用你，也防你。", "Cao Cao uses you, and watches you."), V("track", "==", "cao"))]},
    {"id": "g_zhouyu", "title": T("周瑜", "Zhou Yu"), "fragments": [
        frag("lives", T("周瑜在柴桑养病，每逢江上起风，就让人抬他到城头去看。他对鲁肃说：『替我谢谢那个大夫，和那个守门的。』", "Zhou Yu convalesces at Chaisang; whenever the wind rises on the river he has himself carried up to the walls to watch. He tells Lu Su, 'Thank that physician for me—and the one who guarded my door.'"), F("flag.zhouyu_lives")),
        frag("esteem", T("周瑜临死前问过鲁肃：『刘备那边那个子衡，还在吗？』", "Before he died, Zhou Yu asked Lu Su, 'That Ziheng in Liu Bei's camp—is he still there?'"), R("zhouyu", "esteem", ">=", 5)),
        frag("rival", T("东吴的人提起你，总说：周郎的死，也有他一份。", "When people in Wu speak of you, they say: he had a hand in Zhou Yu's death too."), ALL(F("flag.took_nanjun"), NF("flag.zhouyu_lives"))),
        frag("plain", T("周瑜死在巴丘，三十六岁。你想起他按着琴弦的手。", "Zhou Yu died at Baqiu at thirty-six. You remember his hand on the zither strings."), ALL(LIU, NF("flag.zhouyu_lives")))]},
    {"id": "g_pangtong", "title": T("庞统", "Pang Tong"), "fragments": [
        frag("alive", T("庞统活着，和诸葛亮一左一右坐在刘备身边。他总说欠你一顿西川的酒，一直没还。", "Pang Tong lives, seated with Zhuge Liang at Liu Bei's left and right. He always says he owes you a cup of western wine. He never pays."), F("flag.pt_alive")),
        frag("words", T("庞统倒下前抓着你的袖子，说的是：『告诉孔明，西川的路，我替他走了一半。』你一直没告诉别人。", "Before he fell, Pang Tong gripped your sleeve and said, 'Tell Kongming I walked half the western road for him.' You never told anyone else."), F("flag.with_pangtong")),
        frag("dead", T("庞统死在落凤坡，三十六岁。", "Pang Tong died at Fallen Phoenix Slope at thirty-six."), LIU)]},
    {"id": "g_sun", "title": T("孙夫人", "Lady Sun"), "fragments": [
        frag("parted", T("孙夫人回了东吴。临走前她托人带给你一张弓：『荆州人里，就你一个说话算话。』", "Lady Sun went back to Wu. Before she left she sent you a bow: 'Of all the Jingzhou men, you're the only one who kept his word.'"), F("flag.sun_parted")),
        frag("letter", T("孙夫人回东吴后给你写过一封信，只问了一句：荆州的弓，还好用吗？", "After she went back to Wu, Lady Sun wrote you a single letter. It asked only: are the Jingzhou bows any good?"), R("sunfuren", "trust", ">=", 4)),
        frag("cold", T("孙夫人走的那天，没有回头看一眼。", "The day Lady Sun left, she never looked back."), ALL(LIU, R("sunfuren", "warmth", "<=", 0))),
        frag("plain", T("孙夫人回了东吴，再也没有回来。", "Lady Sun went back to Wu and never came back."), LIU)]},
    {"id": "g_wenzhi", "title": T("温芷", "Wen Zhi"), "fragments": [
        frag("child", T("成都城西的小院里，温芷种的当归开了花。她说，等孩子会走路了，就教他认药。", "In the little yard on the west side of Chengdu, Wen Zhi's angelica has flowered. She says that once the child can walk, she'll teach him the herbs."), F("flag.wz_child"), "romance"),
        frag("west", T("温芷跟着大军走过了蜀道。她说，路是难，可也没传说的那么难。", "Wen Zhi crossed the Shu roads with the army. Hard, she says, but not as hard as the stories."), F("flag.wz_west")),
        frag("jingzhou", T("温芷留在荆州，在关羽的营里做大夫。她的信一个月一封，从不说想你。", "Wen Zhi stayed in Jingzhou as physician to Guan Yu's army. Her letters come once a month and never say she misses you."), F("flag.wz_jingzhou")),
        frag("north", T("每年冬至，你都会收到一包止血散，从北方寄来，没有信。", "Every year at the solstice a packet of wound powder comes from the north, with no letter."), ANY(F("flag.wenzhi_safe"), F("flag.wenzhi_warned"))),
        frag("together", T("你和温芷在许都安了家。她在药圃里晒当归，你在丞相府起草文书。", "You and Wen Zhi have made a home in Xuchang. She dries angelica in the herb garden; you draft documents for the Chancellor."), ALL(V("track", "==", "cao"), F("flag.wenzhi_together")), "romance"),
        frag("used", T("温芷再没回过信。", "Wen Zhi never wrote again."), F("flag.wenzhi_used")),
        frag("far", T("你很久没有温芷的消息了。", "You haven't heard from Wen Zhi in a long time."))]},
    {"id": "g_lives", "title": T("因你而不同的人", "Lives You Changed"), "mode": "all", "fragments": [
        frag("weiyan", T("魏延记得长沙城里是谁替他说的话。这件事，以后还会有人提起。", "Wei Yan remembers who spoke for him at Changsha. Someone will bring it up again one day."), F("flag.pleaded_weiyan")),
        frag("zhaoyun", T("赵云后来娶了妻，喜酒请你坐了上席。", "Zhao Yun married in the end, and gave you the seat of honor at the wedding."), ALL(F("flag.zy_refused"), R("zhaoyun", "warmth", ">=", 4))),
        frag("zhangsong", T("张松死后，他的那张地图一直挂在刘备的书房里。", "After Zhang Song died, his map hung in Liu Bei's study for years."), ANY(F("flag.honored_zs"), R("zhangsong", "esteem", ">=", 3))),
        frag("tongguan", T("曹操一直记得潼关那件外袍。", "Cao Cao never forgot the cloak at Tongguan."), F("flag.saved_cao")),
        frag("defected", T("你是随张松一起离开曹营的。许都那边，再没人提你的名字。", "You left Cao's camp with Zhang Song. In Xuchang, no one speaks your name again."), F("flag.defected")),
        frag("owes", T("关羽说，欠你的，他记在心里。", "Guan Yu says what he owes you, he keeps in his heart."), R("guanyu", "owes", ">=", 2)),
        frag("lusu", T("鲁肃一直留着那张约。每次来荆州，都要拿出来看一看。", "Lu Su kept that agreement. Every time he came to Jingzhou he took it out and looked at it."), F("flag.promised_return")),
        frag("guan", T("关羽那句『我不能丢』，你后来想起过很多次。", "You thought often, later, about Guan Yu saying: that's why I can't lose it."), F("flag.guan_charge"))]},
    {"id": "g_name", "title": T("名声", "Your Name"), "fragments": [
        frag("uncanny", T("蜀中有人叫你先生，有人叫你妖人。", "In Shu some call you Master; some call you sorcerer."), V("uncanny", ">=", 4)),
        frag("rash", T("人说子衡口无遮拦。喜欢你的人说你真，怕你的人说你狂。", "People say Ziheng can't hold his tongue. Those who like you call it honesty; those who fear you call it madness."), V("renown.rash", ">=", 4)),
        frag("loyal", T("人说子衡重义。", "People say Ziheng keeps faith."), V("renown.loyal", ">", "@renown.cunning")),
        frag("cunning", T("人说子衡多智，也说子衡心深。", "People say Ziheng is clever, and that his mind runs deep."), V("renown.cunning", ">", "@renown.loyal")),
        frag("none", T("史书里没有你的传，只有几处『或曰』。", "The histories give you no biography—just a few lines beginning 'some say.'"))]},
    {"id": "g_history", "title": T("天下", "The Realm"), "fragments": [
        frag("far", T("说书人讲到荆州和西川，有好几处讲不顺——那几处，都是你。", "When storytellers reach Jingzhou and the west, several places never quite fit. Those places are you."), V("deviation", ">=", 5)),
        frag("near", T("刘备有了荆州，也有了益州。天下三分，和书上写的差不多。", "Liu Bei has Jingzhou, and now Yi as well. The realm is split in three, much as the books say."))]},
]
FRAG_FACE = {"g_lord": {"high": ("liubei", "warm"), "mid": ("liubei", "neutral"), "low": ("liubei", "cold"), "cao": ("caocao", "cold")},
             "g_zhouyu": {"lives": ("zhouyu", "warm"), "esteem": ("zhouyu", "sad"), "rival": ("zhouyu", "cold"), "plain": ("zhouyu", "sad")},
             "g_pangtong": {"alive": ("pangtong", "warm"), "words": ("pangtong", "sad"), "dead": ("pangtong", "sad")},
             "g_sun": {"parted": ("sunfuren", "warm"), "cold": ("sunfuren", "cold"), "plain": ("sunfuren", "neutral")},
             "g_wenzhi": {"child": ("wenzhi", "shy"), "west": ("wenzhi", "warm"), "jingzhou": ("wenzhi", "neutral"), "north": ("wenzhi", "sad"), "far": ("wenzhi", "sad")}}
ENDING_ART = {"scene": "ending", "layers": [{"id": "city", "when": F("flag.post_chengdu")}, {"id": "home", "when": ANY(F("flag.wz_child"), F("flag.wz_west"))},
                                            {"id": "lone", "when": ANY(F("flag.v2_hermit"), F("flag.v2_left"), F("flag.v2_exposed"))}, {"id": "sail", "when": F("flag.post_jingzhou")}, {"id": "two_boat", "when": F("flag.wz_jingzhou")}]}

# ------------------------------------------------------------------ realm
def _ctl(**kw):
    base = {"liang": "xiliang", "bing": "cao", "you": "cao", "ji": "cao", "qing": "cao", "sili": "cao", "yan": "cao", "yu": "cao", "xu": "cao",
            "jing": ["cao", "sun"], "yang": "sun", "yi": "liuzhang", "jiao": "shixie"}
    base.update(kw); return base
REALM = dict(V1["realm"])
REALM["control"] = {"c1": _ctl(), "c2": _ctl(jing=["liubei", "sun"]), "c3": _ctl(jing=["liubei", "sun"]), "c4": _ctl(jing=["liubei", "sun"]),
                    "c5": _ctl(jing=["liubei", "sun"], liang=["cao", "xiliang"]), "c6": _ctl(jing="liubei", liang="cao"),
                    "c7": _ctl(jing="liubei", liang="cao", yi=["liuzhang", "liubei"]), "c8": _ctl(jing="liubei", liang="cao", yi="liubei")}
REALM["captions"] = {"c1": T("赤壁之后：曹仁守南郡，孙、刘都盯着荆州", "After Red Cliffs: Cao Ren holds Nanjun, and both Sun and Liu want Jingzhou"),
                     "c2": T("刘备取荆南四郡，荆州一分为二", "Liu Bei takes the four southern commanderies; Jingzhou is split"),
                     "c3": T("孙刘结亲，盟约暂稳", "A marriage between the Sun and Liu houses steadies the alliance"),
                     "c4": T("周瑜死，鲁肃主事；刘备“借”得南郡", "Zhou Yu dies; Lu Su takes command, and Liu Bei 'borrows' Nanjun"),
                     "c5": T("曹操西征马超，关中归曹", "Cao Cao campaigns west against Ma Chao and takes the passes"),
                     "c6": T("刘备应刘璋之邀入川", "Liu Bei goes west at Liu Zhang's invitation"),
                     "c7": T("刘备与刘璋反目，益州烽烟四起", "Liu Bei turns on Liu Zhang; war spreads through Yi"),
                     "c8": T("建安十九年：刘备领益州牧，三分之势已成", "214: Liu Bei governs Yi; the three-way split is set")}

COMMIT_RULES = speech.commit_rules() + [
    {"char": "pangtong", "kind": "protect", "kept": F("flag.pt_alive"), "broken": ALL(NF("flag.pt_alive"), V("debt.d_phoenix", "==", "none")), "at_end": True,
     "kept_effects": [rel("pangtong", "warmth", 2)], "broken_effects": [rel("liubei", "trust", -1)],
     "kept_text": T("你答应过庞统，会护着他。他活着进了成都。", "You promised Pang Tong you'd look after him. He rode into Chengdu alive."),
     "broken_text": T("你答应过庞统，会护着他。落凤坡上，你没能做到。", "You promised Pang Tong you'd look after him. At Fallen Phoenix Slope, you couldn't.")},
    {"char": "sunfuren", "kind": "other", "kept": F("flag.sun_parted"), "broken": F("flag.left_sun"), "at_end": True,
     "kept_effects": [rel("sunfuren", "trust", 1)], "broken_effects": [],
     "kept_text": T("你答应过孙夫人的话，算数了。", "What you promised Lady Sun, you kept."),
     "broken_text": T("你答应过孙夫人的话，在江边那一夜就作废了。", "What you promised Lady Sun was void the night on the riverbank.")},
]

ART_PROMPTS = dict(V1["art_prompts"])
ART_PROMPTS.update({
    "citywall": T("水墨淡彩，宽幅。城墙与城门，城上旗帜。图层：攻城的长梯与枪林；刘字绿旗或东吴红旗；城门洞开；城下人群；黄昏。", "Ink and wash, wide. A city wall and gate with banners. Layers: siege ladders and spears; Liu's green banners or Wu's red; open gate; crowd below; dusk."),
    "temple": T("山寺，松树，亭台，主客数人。图层：廊下暗藏的刀斧手；被劈开的石头。", "Hillside temple, pines, pavilions, a few figures. Layers: axemen hidden in the corridor; a split rock."),
    "bigriver": T("大江上一艘大船，船上女子与侍从。图层：小船上的武将；怀中孩子；横江拦截的船队与绿旗；东吴的红旗船。", "A large ship on the river, a woman and attendants aboard. Layers: a general on a small boat; a child; a blockade of boats with green banners; Wu's red-bannered ships."),
    "mourning": T("夜，灵堂，白幡，灵位与烛火，一人跪拜。图层：两侧吊客；角落一个相貌古怪的人。", "Night, a mourning hall, white banners, spirit tablet and candles, one figure kneeling. Layers: mourners on both sides; an odd-looking man in the corner."),
    "ravine": T("竹林夹道的山间小路，一骑白马。图层：箭雨；倒地的随从；勒马回头。", "A narrow hill path between bamboo, a rider on a white horse. Layers: a hail of arrows; a fallen companion; the rider turning back."),
})
PORTRAIT_PROMPTS = dict(V1["portrait_prompts"]); PORTRAIT_PROMPTS.update(PP.PORTRAIT_PROMPTS)

PRESETS = json.loads((HERE / "presets.json").read_text()) if (HERE / "presets.json").exists() else []

CAMPAIGN = {
    "spec": "storydate.campaign/0.3",
    "id": "sanguo_strategist_v2",
    "prev": "sanguo_strategist_v1",
    "title": T("三国·谋士", "Three Kingdoms: The Strategist"),
    "volume": T("卷二 · 荆州与西川", "Volume II · Jingzhou and the West"),
    "rights": {"source": "《三国演义》（罗贯中，明代），公版", "quotes": "中文原文直接引用；英文为本项目自译", "original_characters": ["子衡（玩家）", "温芷"]},
    "player": {"name": T("子衡", "Ziheng")},
    "side_prompt": SIDE_PROMPT,
    "vars": VARS, "chars": CHARS, "dims": DIMS, "echoes": ECHOES, "debts": DEBTS,
    "chapters": CHAPTERS, "nodes": {n["id"]: n for n in N}, "endings": ENDINGS,
    "future_terms": [{"term": t, "from": c} for t, c in FUTURE],
    "ending_art": ENDING_ART, "art_prompts": ART_PROMPTS, "frag_face": FRAG_FACE, "portrait_prompts": PORTRAIT_PROMPTS, "cg_captions": V1["cg_captions"], "realm": REALM,
    "react_patterns": V1["react_patterns"], "commit_rules": COMMIT_RULES,
    "flash": [{"char": "zhouyu", "node": "x_zhouyu_rage", "resume": True}],
    "witness": [{"who": "liubei", "to": "zhouyu", "labels": ["rude", "threat"], "effects": [rel("liubei", "trust", -1)]},
                {"who": "lusu", "to": "zhouyu", "labels": ["rude", "threat"], "effects": [rel("lusu", "trust", -1)]},
                {"who": "zhaoyun", "to": "sunfuren", "labels": ["rude", "threat"], "effects": [rel("zhaoyun", "trust", -1)]}],
    "places": PLACES, "rivers": RIVERS,
    "meters": {"uncanny": T("到 6：被当作妖人", "At 6: branded a sorcerer"), "rash": T("到 6：有人会把你的话报上去", "At 6: someone reports what you've said")},
    "presets": PRESETS,
    "sources": [{"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/supplement/ancient-books/61", "checked": "2026-10-20",
                 "note": "第53、57、60、61、63回引文逐字核对（第53、57回据繁体版转为简体）；其余各回只作情节依据，不直接引用"}],
    "end_note": T("卷二终。卷三《汉中》尚未开放。", "End of Volume II. Volume III (Hanzhong) is not yet open."),
}

if __name__ == "__main__":
    out = HERE / "campaign_v2.json"
    dump(CAMPAIGN, out)
    print("nodes", len(N), "->", out)
