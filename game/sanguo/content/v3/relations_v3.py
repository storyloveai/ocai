"""卷三：关系改变你能经历的事 + 命运分支（决策记录 v2.32；做法同卷一 content/relations.py、卷二 v2/relations_v2.py）。
1. 当场改口：7 个主要场景里，关键人物按你们的关系说不同的开场话。
2. 主动找上门：单刀会那天你按剑站在关羽身后，他会把一块腰牌交给你（之后又惹翻了他就不给）；“虎女犬子”那天多一条路。
3. 同一个请求，结果不同：汉水寨门（赵云信不信你）、定军山（黄忠和你熟不熟）。
4. 命运：关羽面前第二次冒犯他（记仇 ≥ 3），他不杀兄长的人，但把你赶出荆州——这一卷提前结束；
   赔罪也能留下，可从此他不再见你（失势）。
数值和结果都由规则决定；台词都是我们自己写的。"""
from lib import *
from relations import RP, WARM, COLD, NOTWARM, _twin

LIU3 = V("track", "!=", "cao")
FLAGS = {"flag.v3_token": T("关羽给了你一块腰牌", "Guan Yu gave you his token")}

INTRO = {   # scene: (person, axis, warm line, cold line or None)
  "c1_jin": ("zhuge", "esteem",
     T("诸葛亮把门掩上：『子衡兄，这话我只问你一个人。』", "Zhuge Liang closes the door. 'Brother Ziheng, I'm asking you and no one else.'"), None),
  "c1_dandao": ("guanyu", "esteem",
     T("临上船，关羽问的不是周仓，是你：『子衡，你说我去不去？』", "As he's about to board, it's you Guan Yu asks, not Zhou Cang. 'Ziheng—should I go?'"), None),
  "c2_hanzhong": ("liubei", "trust",
     T("刘备没等众人开口，先看向了你。", "Before anyone else can speak, Liu Bei turns to you."),
     T("刘备挨个问了一圈，最后才轮到你。", "Liu Bei asks everyone in turn; you're the last.")),
  "c4_dingjun": ("fazheng", "trust",
     T("法正把两面令旗分了一面给你：『白旗你举，红旗我举。』", "Fa Zheng hands you one of the two signal flags. 'You raise the white. I'll raise the red.'"), None),
  "c5_hanshui": ("zhaoyun", "trust",
     T("赵云把寨门的事交给了你：『先生说开，就开。』", "Zhao Yun leaves the gate to you. 'Say open, sir, and it opens.'"),
     T("赵云没有问你，一个人在寨门口站了很久。", "Zhao Yun doesn't ask you. He stands alone at the gate for a long time.")),
  "c7_wang": ("liubei", "trust",
     T("刘备把名单递给你时，低声说：『这份名单，我只给你看过。』", "As Liu Bei hands you the list he says quietly, 'You're the only one I've shown this to.'"),
     T("名单在众人手里传了一圈，才传到你这里。", "The list goes all the way round the room before it reaches you.")),
  "c8_huniu": ("guanyu", "trust",
     T("关羽开口之前，先看了你一眼。", "Before he speaks, Guan Yu glances at you."),
     T("关羽连看都没看你，一拍案就骂了出去。", "Guan Yu doesn't even look your way; he slams the table and starts shouting.")),
}

TOKEN = node("x_rel_token", "*", "interrupt", T("腰牌", "The Token"), "free", T("原创", "original"),
    [RP(T("单刀会回来没几天，关羽派周仓送来一块铜腰牌，背面刻着一个“关”字。周仓说：『将军说，陆口那天先生站在他身后。荆州九郡的城门，先生走到哪里都开。』",
         "A few days after the feast at Lukou, Guan Yu sends Zhou Cang with a bronze token, the character 'Guan' cut into its back. Zhou Cang says, 'The General says you stood behind him at Lukou, sir. Every gate in the nine commanderies of Jingzhou will open for you.'"), None, ["guanyu", "warmth", 1])],
    [choice("keep", "expression", T("收下，托周仓带一句谢。", "Accept it, and send your thanks back with Zhou Cang."), T("周仓咧嘴一笑，走了。", "Zhou Cang grins and goes."),
            [setv("flag.v3_token"), rel("guanyu", "warmth", 1)]),
     choice("visit", "expression", T("亲自去谢关羽。", "Go and thank Guan Yu in person."),
            T("关羽在灯下读《春秋》，听你说完，只点了点头：『收着就是。』", "Guan Yu is reading the Annals by lamplight. He hears you out and only nods. 'Just keep it.'"),
            [setv("flag.v3_token"), rel("guanyu", "trust", 1)])],
    when=ALL(LIU3, F("flag.dd_guard"), AT("guanyu", "warmth", 1), V("grudge.guanyu", "<=", 0), NF("flag.v3_token")), order=3)
TOKEN["art"] = {"scene": "lamp", "layers": [], "illus": "v3_guan_hall"}; TOKEN["cast"] = [{"id": "guanyu"}]

GUAN_OUT = T("关羽没有拔刀。他只说了一个字：『滚。』第二天一早，周仓把你的行李放在了城门外。荆州，你回不去了。",
             "Guan Yu doesn't draw his blade. He says only one word: 'Out.' Early the next morning Zhou Cang leaves your things outside the city gate. You can't go back to Jingzhou.")


LUKOU_DEATH = T("鲁肃的脸色变了。他把酒杯往地上一摔，帐后的刀斧手涌了出来。关羽一把挟住鲁肃，提刀退到江边，上了船。你被隔在了人群的另一边。江上的船越来越远，周仓回头喊你的名字。",
                 "Lu Su's face changes. He dashes his cup to the floor, and the axemen pour out from behind the curtains. Guan Yu seizes Lu Su, backs to the river with his blade raised, and boards the boat. You are cut off on the other side of the crowd. The boat pulls away; Zhou Cang turns back, shouting your name.")


def extend(N, VARS, CAMP_MOVES=None, ENDINGS=None):
    for k, lab in FLAGS.items(): VARS[k] = {"type": "flag", "init": False, "label": lab, "carry": False}
    VARS["grudge.guanyu"] = {"type": "num", "init": 0, "min": 0, "max": 10, "label": T("关羽·记仇", "Guan Yu · grudge"), "carry": False}
    byid = {n["id"]: n for n in N}
    # 1. what people say to you
    for nid, (c, d, warm, cold) in INTRO.items():
        init = VARS[f"rel.{c}.{d}"]["init"]
        extra = [RP(warm, WARM(c, d), [c, d, 2])] + ([RP(cold, COLD(c, d), [c, d, 0])] if cold and init > TIER_END[0] else [])
        byid[nid]["intro"] = list(byid[nid]["intro"]) + extra
    # 2. Guan Yu's token, and the day it matters
    N.append(TOKEN)
    hn = byid["c8_huniu"]; sf = next(c for c in hn["choices"] if c["id"] == "soft")
    hn["choices"].insert(hn["choices"].index(sf) + 1, {**{k: v for k, v in sf.items() if k not in ("req", "hint")},
        "id": "soft_token", "when": F("flag.v3_token"),
        "label": T("趁关羽还没开口，把他给你的腰牌放在案上。", "Before Guan Yu can speak, set the token he gave you on the table."),
        "out": [P(T("关羽看着那块腰牌，到了嘴边的话又咽了回去。他对诸葛瑾说：『小女的事，要问过汉中王。』诸葛瑾松了一口气。",
                    "Guan Yu looks at the token, and the words on his lips go unsaid. He tells Zhuge Jin, 'My daughter's marriage is for the King of Hanzhong to decide.' Zhuge Jin lets out a breath."))],
        "because": T("因为关羽给过你那块腰牌", "Because Guan Yu gave you his token")})
    # 3. the same request lands differently
    hs = byid["c5_hanshui"]; op = next(c for c in hs["choices"] if c["id"] == "open")
    _twin(hs, "open", WARM("zhaoyun", "trust"), NOTWARM("zhaoyun", "trust"),
          {"out": [P(T("赵云一句话没问，下令开门。", "Zhao Yun asks nothing; he orders the gate opened."))] + op["out"],
           "effects": op["effects"] + [rel("zhaoyun", "warmth", 1)], "because": T("因为赵云信你，你一开口他就照做", "Because Zhao Yun trusts you, he acts the moment you speak")},
          {"out": [P(T("赵云犹豫了好一会儿，才下令开门。曹军的前锋已经冲到了寨前。", "Zhao Yun hesitates a long moment before ordering the gate opened. Cao's vanguard is already at the stockade."))] + op["out"],
           "effects": [e for e in op["effects"] if not (e.get("add") == "rel.zhaoyun.trust")] + [rel("zhaoyun", "trust", 1)],
           "because": T("因为赵云还不够信你，耽误了一会儿", "Because Zhao Yun doesn't trust you enough yet, time is lost")})
    dj = byid["c4_dingjun"]; ch = next(c for c in dj["choices"] if c["id"] == "charge")
    _twin(dj, "charge", WARM("huangzhong", "warmth"), NOTWARM("huangzhong", "warmth"),
          {"out": [P(T("黄忠把自己的副马牵给你：『先生跟紧老夫。』", "Huang Zhong brings you his spare horse. 'Stay close to this old man, sir.'"))] + ch["out"],
           "because": T("因为黄忠和你相熟，把副马给了你", "Because Huang Zhong knows you well, he gives you his spare horse")})
    # 5. 单刀会上第二次威胁鲁肃：鲁肃摔杯为号，你死在陆口
    if ENDINGS is not None:
        from moves import mv, KILL_YOU
        VARS["grudge.lusu"] = {"type": "num", "init": 0, "min": 0, "max": 10, "label": T("鲁肃·记仇", "Lu Su · grudge"), "carry": False}
        VARS["flag.fate_dead"] = {"type": "flag", "init": False, "label": T("死于非命", "Died before the volume's end"), "carry": False}
        dd = byid["c1_dandao"]; t1 = next(m for m in dd["moves"] if m["id"] == "threat_lusu")
        m2 = mv("threat_lusu2", "lusu", T("又一次威胁鲁肃、说要他的命", "threatens Lu Su again / says they'll take his life"), LUKOU_DEATH,
                [setv("flag.fate_dead"), rel("lusu", "trust", -3)], match=t1["match"], labels=["threat"], when=V("grudge.lusu", ">=", 2))
        m2["ends"] = True
        t1["when"] = ALL(t1["when"], V("grudge.lusu", "<=", 1)) if t1.get("when") else V("grudge.lusu", "<=", 1)
        dd["moves"].insert(0, m2)
        side = next(g for g in ENDINGS if g["id"] == "g_side")
        side["fragments"].insert(0, {"id": "dead", "text": T("你没有回到荆州。陆口的江水，那天流得很急。", "You never made it back to Jingzhou. The river at Lukou ran very fast that day."), "when": F("flag.fate_dead")})
        for g in ENDINGS:
            if g["id"] in ("g_lord", "g_guanyu", "g_dingjun", "g_wenzhi"):
                for f in g["fragments"]:
                    f["when"] = ALL(NF("flag.fate_dead"), f["when"]) if f.get("when") else NF("flag.fate_dead")

    # 4. Guan Yu doesn't kill his brother's man — he drives you out
    gr = byid["x_guan_rage"]
    for c in gr["choices"]: c["when"] = ALL(c["when"], V("grudge.guanyu", "<=", 2)) if c.get("when") else V("grudge.guanyu", "<=", 2)
    gr["choices"].append(choice("bow_late", "expression", T("拱手赔罪。", "Bow and apologize."),
        T("关羽看了你很久：『你走吧。』从那天起，他议事不再叫你，路上遇见了，也只当没看见。", "Guan Yu looks at you a long while. 'Go.' From that day on he no longer calls you to council; if you pass on the road, he looks straight through you."),
        [setv("flag.sidelined"), rel("guanyu", "esteem", -2), rel("guanyu", "warmth", -1)], when=V("grudge.guanyu", ">=", 3)))
    out = choice("stand_late", "dilemma", T("不退。", "Don't back down."), GUAN_OUT,
                 [setv("flag.v3_left"), rel("guanyu", "esteem", -3), rel("liubei", "trust", -2)], when=V("grudge.guanyu", ">=", 3))
    out["fate"] = {"kind": "exile", "who": "guanyu", "label": T("被逐出", "sent away")}; out["ends"] = True
    gr["choices"].append(out)
