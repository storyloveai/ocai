"""卷二：关系改变你能经历的事 + 命运分支（决策记录 v2.31；卷一的做法见 content/relations.py、content/fates.py）。
1. 当场改口：6 个主要场景里，关键人物按你们的关系说不同的开场话。
2. 主动找上门：诸葛亮信你到「倚重」，取南郡前后会给你一个锦囊，甘露寺那天能拆。
3. 同一个请求，结果不同：截江时赵云信不信你、落凤坡前庞统和你熟不熟，结果不一样。
4. 命运：在周瑜营里第二次冒犯他（记仇 ≥ 3），就死在他的大营里，这一卷结束，没有下一卷。
数值和结果都由规则决定；台词都是我们自己写的。"""
import copy
from lib import *
from relations import RP, WARM, COLD, NOTWARM, _twin

LIU2 = V("track", "!=", "cao")
FLAGS = {
    "flag.v2_jinnang": T("诸葛亮给了你一个锦囊", "Zhuge Liang gave you a sealed pouch"),
    "flag.v2_after_ganlu": T("甘露寺那一天已经过去", "The day at Ganlu Temple has passed"),
}

INTRO = {   # scene: (person, axis, warm line, cold line or None)
  "c1_nanjun": ("zhuge", "trust",
     T("诸葛亮把兵符推到你面前：『子衡，你先看。看完再说。』", "Zhuge Liang pushes the tally across to you. 'Ziheng, you look first. Then tell me.'"),
     T("诸葛亮把兵符收进了袖子，只给刘备看了一眼。", "Zhuge Liang tucks the tally into his sleeve and shows it only to Liu Bei.")),
  "c2_changsha": ("zhuge", "esteem",
     T("诸葛亮下令之前，先看了你一眼，像在等你开口。", "Before he gives the order, Zhuge Liang glances at you, as if waiting for you to speak."), None),
  "c3_ganlu": ("zhaoyun", "trust",
     T("赵云挪到你身边，压低了声音：『先生说动手，我就动手。』", "Zhao Yun moves to your side and lowers his voice. 'Say the word, sir, and I'll act.'"),
     T("赵云按着剑，看你的眼神里带着提防。", "Zhao Yun keeps his hand on his sword; there's wariness in the way he looks at you.")),
  "c4_mourn": ("zhuge", "warmth",
     T("出发前，诸葛亮来找你：『子衡兄，柴桑这一趟，你陪我去。』", "Before setting out, Zhuge Liang comes to find you. 'Brother Ziheng, come with me to Chaisang.'"), None),
  "c5_zhangsong": ("liubei", "trust",
     T("刘备让你坐在他和张松中间。", "Liu Bei seats you between himself and Zhang Song."),
     T("敬酒的时候，刘备没有叫上你。", "When the toasts go round, Liu Bei doesn't call on you.")),
  "c7_luofeng": ("pangtong", "warmth",
     T("庞统临上马，回头冲你一笑：『子衡，等我进了雒城，请你喝酒。』", "As he mounts, Pang Tong turns back with a grin. 'Ziheng, once I'm in Luo, the wine's on me.'"), None),
}

JINNANG = node("x_rel_jinnang", "*", "interrupt", T("锦囊", "The Pouch"), "free", T("原创", "original"),
    [RP(T("诸葛亮把一个缝得严严实实的锦囊放进你手里：『主公要去东吴招亲。那一天若是万不得已，你再拆。』他没说里面是什么。",
          "Zhuge Liang presses a tightly stitched pouch into your hand. 'Our lord will go to Wu to be wed. If that day comes to the worst, open it.' He doesn't say what is inside."), None, ["zhuge", "trust", 3])],
    [choice("keep", "expression", T("收好，不问。", "Keep it, and don't ask."), T("诸葛亮点点头：『子衡兄，亮信你。』", "Zhuge Liang nods. 'Brother Ziheng, I trust you.'"),
            [setv("flag.v2_jinnang"), rel("zhuge", "warmth", 1)]),
     choice("ask", "expression", T("问他：赵将军不是也有三个吗？", "Ask him: doesn't General Zhao already have three?"),
            T("诸葛亮摇着扇子笑了：『子龙的是给子龙的。这一个，是给你的。』", "Zhuge Liang smiles behind his fan. 'Zilong's are for Zilong. This one is for you.'"),
            [setv("flag.v2_jinnang"), rel("zhuge", "esteem", 1)])],
    when=ALL(LIU2, AT("zhuge", "trust", 3), NF("flag.v2_jinnang"), NF("flag.v2_after_ganlu")), order=3)
JINNANG["art"] = {"scene": "lamp", "layers": [], "illus": "v2_jinnang"}; JINNANG["cast"] = [{"id": "zhuge"}]

# 周瑜：在他营里第二次冒犯他，就是死
DEAD2 = T("你没有走出周瑜的大营。那年冬天，江上的风很冷。", "You never left Zhou Yu's camp. The wind on the river was very cold that winter.")
ZY_DEATH = T("周瑜的剑没有再收回去。鲁肃扑上来拦，被甲士架开。帐外的江风很大，你最后听见的，是鲁肃在喊你的名字。",
             "Zhou Yu's sword does not go back into its sheath. Lu Su lunges to stop him and is dragged aside by the guards. The river wind roars outside the tent; the last thing you hear is Lu Su shouting your name.")


def fate(c, kind, who):
    c["fate"] = {"kind": kind, "who": who, "label": {"execute": T("被斩", "executed")}[kind]}; c["ends"] = True; return c


def extend(N, VARS, ENDINGS):
    for k, lab in FLAGS.items(): VARS[k] = {"type": "flag", "init": False, "label": lab, "carry": False}
    VARS["grudge.zhouyu"] = {"type": "num", "init": 0, "min": 0, "max": 10, "label": T("周瑜·记仇", "Zhou Yu · grudge"), "carry": False}
    VARS["flag.fate_dead"] = {"type": "flag", "init": False, "label": T("死于非命", "Died before the volume's end"), "carry": False}
    byid = {n["id"]: n for n in N}
    # 1. what people say to you
    for nid, (c, d, warm, cold) in INTRO.items():
        init = VARS[f"rel.{c}.{d}"]["init"]
        extra = [RP(warm, WARM(c, d), [c, d, 2])] + ([RP(cold, COLD(c, d), [c, d, 0])] if cold and init > TIER_END[0] else [])
        byid[nid]["intro"] = list(byid[nid]["intro"]) + extra
    # 2. Zhuge Liang's pouch, and the day you open it
    N.append(JINNANG)
    ga = byid["c3_ganlu"]
    for c in ga["choices"]: c["effects"] = c["effects"] + [setv("flag.v2_after_ganlu")]
    ex = next(c for c in ga["choices"] if c["id"] == "expose")
    ga["choices"].append(choice("jinnang", "strategy", T("拆开诸葛亮给的锦囊。", "Open the pouch Zhuge Liang gave you."),
        [P(T("锦囊里只有一行字：『请国太去廊下看一眼。』你借口请国太赏廊下的花，帐幕一掀，刀斧手无处可藏。国太大怒，当场喝退了吕范。从这天起，东吴没人敢再动主公。",
             "Inside is a single line: 'Ask the Dowager to take a look along the corridor.' You invite her to admire the flowers there; the curtains lift and the axemen have nowhere to hide. The Dowager is furious and dismisses Lü Fan on the spot. From that day, no one in Wu dares lay a hand on your lord."))],
        [e for e in ex["effects"] if not e.get("add", "").startswith("renown.rash")] + [rel("zhuge", "esteem", 1)],
        when=F("flag.v2_jinnang")))
    for k in ("echo", "debt", "resolve"):
        if ex.get(k): ga["choices"][-1][k] = copy.deepcopy(ex[k])
    ga["choices"][-1]["because"] = T("因为诸葛亮给过你一个锦囊", "Because Zhuge Liang gave you a pouch")
    # 3. the same request lands differently
    rv = byid["c6_river"]; bd = next(c for c in rv["choices"] if c["id"] == "board")
    _twin(rv, "board", WARM("zhaoyun", "trust"), NOTWARM("zhaoyun", "trust"),
          {"out": [P(T("赵云把阿斗交给你：『先生抱稳了。』他一个人横枪挡在船头，东吴的人没一个敢上前。夫人看着你怀里的孩子，什么也没说。",
                       "Zhao Yun hands A-Dou to you. 'Hold him tight, sir.' He stands alone at the bow with his spear across, and not one of the Wu men dares come near. Lady Sun looks at the child in your arms and says nothing."))],
           "effects": [e for e in bd["effects"] if e.get("add") != "rel.sunfuren.warmth"] + [rel("zhaoyun", "trust", 1)],
           "because": T("因为赵云信你，把阿斗交给了你", "Because Zhao Yun trusts you, he hands A-Dou to you")})
    lf = byid["c7_luofeng"]
    _twin(lf, "ride", WARM("pangtong", "warmth"), NOTWARM("pangtong", "warmth"),
          {"out": [P(T("庞统让你走在他左边：『你跟着我，我放心。』", "Pang Tong has you ride on his left. 'With you beside me, I'm easy.'"))] + next(c for c in lf["choices"] if c["id"] == "ride")["out"],
           "because": T("因为庞统和你相熟，让你走在他身边", "Because Pang Tong knows you well, he keeps you at his side")})
    # 4. Zhou Yu kills the second time
    zr = byid["x_zhouyu_rage"]
    for c in zr["choices"]: c["when"] = ALL(c["when"], V("grudge.zhouyu", "<=", 2)) if c.get("when") else V("grudge.zhouyu", "<=", 2)
    for id, label, first in (("plead", T("跪下求饶。", "Kneel and beg for your life."), T("周瑜低头看着你：『同样的话，我不听第二遍。』", "Zhou Yu looks down at you. 'I don't hear the same words twice.'")),
                             ("repeat", T("盯着周瑜，把那句话再说一遍。", "Look Zhou Yu in the eye and say it again."), None)):
        out = ([P(first)] if first else []) + [P(ZY_DEATH)]
        zr["choices"].append(fate(choice(id, "dilemma" if id == "repeat" else "expression", label, out,
                                         [setv("flag.fate_dead"), rel("zhouyu", "esteem", -3)], when=V("grudge.zhouyu", ">=", 3)), "execute", "zhouyu"))
    side = next(g for g in ENDINGS if g["id"] == "g_side")
    side["fragments"].insert(0, {"id": "dead", "text": DEAD2, "when": F("flag.fate_dead")})
    for g in ENDINGS:
        if g["id"] in ("g_lord", "g_pangtong", "g_sun", "g_wenzhi"):
            for f in g["fragments"]:
                f["when"] = ALL(NF("flag.fate_dead"), f["when"]) if f.get("when") else NF("flag.fate_dead")
