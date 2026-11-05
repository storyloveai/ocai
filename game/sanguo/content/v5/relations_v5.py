"""卷五：关系改变你能经历的事（决策记录 v2.34；做法同前几卷）。卷五本来就有很多按信任分的路（劝阻称帝、连营、托孤），这里补上：
1. 当场改口：6 个场景。
2. 主动找上门：赵云信你到「可托」，去江州之前会和你约好——营里若起火，往江州方向退，他在路口接你；火烧连营那夜多一条路。
3. 同一个请求，结果不同：阆中噩耗后劝东征缓一缓（陛下信不信你）。
命运：卷五的冒犯对象是陛下，原来就有“说是真话就离开”，不再加死路。"""
import copy
from lib import *
from relations import RP, WARM, COLD, NOTWARM, _twin

FLAGS = {"flag.v5_zy_pact": T("赵云和你约好了退路", "Zhao Yun agreed a line of retreat with you")}

INTRO = {
  "c1_caodeath": ("liubei", "trust",
     T("汉中王没有先问诸葛亮，先问的是你。", "The King asks you before he asks Zhuge Liang."),
     T("汉中王问了一圈，最后才想起你也在。", "The King goes round the room and only at the end remembers you're there.")),
  "c3_emperor": ("zhuge", "esteem",
     T("劝进的表文，丞相让你看过才递上去。", "The Chancellor had you read the petition before he presented it."), None),
  "c5_jin": ("liubei", "warmth",
     T("陛下问你的时候，声音放低了：『只有你，不会拿好听的话哄朕。』", "When he asks you, His Majesty lowers his voice. 'You're the one who won't soothe me with pretty words.'"), None),
  "c6_camps": ("liubei", "trust",
     T("陛下把营图摊在你面前：『你看看，朕扎得怎么样？』", "His Majesty spreads the camp map in front of you. 'Take a look. How have I laid them out?'"),
     T("陛下的营图，没有给你看。", "His Majesty doesn't show you the camp map.")),
  "c7_burn": ("zhaoyun", "trust",
     T("火光里，有人喊你的名字。是赵云的亲兵：『将军让我来找先生！』", "Through the firelight someone is shouting your name. It's one of Zhao Yun's guards: 'The General sent me to find you, sir!'"), None),
  "c8_tuogu": ("zhuge", "trust",
     T("丞相进门时，先看了你一眼，像是有话要对你说。", "As the Chancellor comes in, he glances at you first, as if he has something to say to you."), None),
}

PACT = node("x_rel_zypact", "*", "interrupt", T("江州", "Jiangzhou"), "free", T("原创", "original"),
    [RP(T("赵云临去江州的前一夜来找你，压低了声音：『先生，陛下这一仗，我劝不住。营里若是起火，你护着陛下往江州这边退。我在路口等你们。』",
          "On the night before he leaves for Jiangzhou, Zhao Yun comes to you and lowers his voice. 'Sir, I can't talk His Majesty out of this war. If the camps ever catch fire, bring him back toward Jiangzhou. I'll be waiting at the crossroads.'"), None, ["zhaoyun", "trust", 2])],
    [choice("promise", "expression", T("点头：『一言为定。』", "Nod: 'Agreed.'"), T("赵云抱了抱拳，转身走进夜里。", "Zhao Yun clasps his hands to you and walks off into the night."),
            [setv("flag.v5_zy_pact"), rel("zhaoyun", "trust", 1)]),
     choice("worry", "expression", T("问他：『将军就没想过，这一仗赢了呢？』", "Ask him: 'Have you never thought we might win?'"),
            T("赵云笑了笑：『那我就白等一场。』", "Zhao Yun smiles. 'Then I'll have waited for nothing.'"),
            [setv("flag.v5_zy_pact"), rel("zhaoyun", "warmth", 1)])],
    when=ALL(AT("zhaoyun", "trust", 2), NF("flag.v5_zy_pact"), NF("flag.v5_after_burn")), order=3)
PACT["art"] = {"scene": "lamp", "layers": [], "illus": "v5_zy_pact"}; PACT["cast"] = [{"id": "zhaoyun"}]


def extend(N, VARS):
    for k, lab in FLAGS.items(): VARS[k] = {"type": "flag", "init": False, "label": lab, "carry": False}
    VARS["flag.v5_after_burn"] = {"type": "flag", "init": False, "label": T("火烧连营已经过去", "The burning of the camps has passed"), "carry": False}
    byid = {n["id"]: n for n in N}
    for nid, (c, d, warm, cold) in INTRO.items():
        init = VARS[f"rel.{c}.{d}"]["init"]
        extra = [RP(warm, WARM(c, d), [c, d, 2])] + ([RP(cold, COLD(c, d), [c, d, 0])] if cold and init > TIER_END[0] else [])
        byid[nid]["intro"] = list(byid[nid]["intro"]) + extra
    # Zhao Yun's pact, and the night of the fire
    N.append(PACT)
    bu = byid["c7_burn"]
    for c in bu["choices"]: c["effects"] = c["effects"] + [setv("flag.v5_after_burn")]
    gd = next(c for c in bu["choices"] if c["id"] == "guard")
    gp = copy.deepcopy(gd)
    gp.update({"id": "guard_pact", "when": F("flag.v5_zy_pact"),
               "label": T("照赵云说的，护着陛下往江州方向退。", "As Zhao Yun said, take His Majesty back toward Jiangzhou."),
               "out": [P(T("你们在山路口看见了白马银枪。赵云带着江州的兵已经等了一夜，把陛下接上马，一路护进了白帝城。追兵到了路口，看见江州的旗，没敢再追。",
                           "At the mountain crossroads you see the white horse and the silver spear. Zhao Yun has waited all night with the Jiangzhou troops; he puts His Majesty on a horse and escorts him all the way into Baidi. When the pursuers reach the crossroads and see the Jiangzhou banners, they dare not follow."))],
               "effects": gd["effects"] + [rel("zhaoyun", "trust", 1), add("renown.loyal")],
               "because": T("因为赵云和你约好了退路", "Because Zhao Yun agreed a line of retreat with you")})
    gd["when"] = ALL(gd["when"], NF("flag.v5_zy_pact")) if gd.get("when") else NF("flag.v5_zy_pact")
    bu["choices"].insert(bu["choices"].index(gd) + 1, gp)
    # the same request lands differently
    nw = byid["c4_news"]; pa = next(c for c in nw["choices"] if c["id"] == "pause")
    _twin(nw, "pause", WARM("liubei", "trust"), NOTWARM("liubei", "trust"),
          {"out": [P(T("陛下睁着眼睛看了你很久，终于点了头：『缓一个月。就一个月。让朕把三弟送回去。』", "His Majesty looks at you a long while with open eyes, and at last he nods. 'One month. Just one. Let Us send Third Brother home first.'"))],
           "effects": pa["effects"] + [rel("liubei", "trust", 1)], "because": T("因为陛下信你，听进去了", "Because His Majesty trusts you, he takes it in")})
