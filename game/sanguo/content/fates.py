"""卷一试点：命运分支（决策记录 v2.24）。说错话、把人逼急了，会有当场的下场：被斩、下狱、被逐出、负伤。
什么时候触发、落到哪一种下场，由规则决定（这里写死）；这一段怎么演，由 AI 按当时的场景、人物和你说过的话现场写
（选项上的 fate），没接 AI 时用这里写好的那一段。每种下场配一张“命运图”（art/fate/<kind>.webp，Codex 画），
画好之前只显示场景图。台词都是我们自己写的。"""
from lib import *
from moves import mv, KILL_YOU

KINDS = {   # 下场：名字、给 AI 的说明
    "execute": T("被斩", "executed"),
    "jail": T("下狱", "imprisoned"),
    "exile": T("被逐出", "sent away"),
    "wounded": T("负伤", "wounded"),
}

def G(who, k): return V(f"grudge.{who}", ">=", k)
def GL(who, k): return V(f"grudge.{who}", "<=", k)

def fate(c, kind, who):
    c["fate"] = {"kind": kind, "who": who, "label": KINDS[kind]}; return c

DEAD = T("你没有走出许都。那年的梅子，后来是别人摘的。", "You never left Xuchang. Someone else picked the plums that year.")

def extend(N, VARS, ENDINGS, CAMP_MOVES):
    for who, name in (("caocao", T("曹操·记仇", "Cao Cao · grudge")), ("liubei", T("刘备·记仇", "Liu Bei · grudge")), ("guanyu", T("关羽·记仇", "Guan Yu · grudge"))):
        VARS[f"grudge.{who}"] = {"type": "num", "init": 0, "min": 0, "max": 10, "label": name, "carry": False}
    VARS["flag.fate_dead"] = {"type": "flag", "init": False, "label": T("死于非命", "Died before the volume's end"), "carry": False}
    byid = {n["id"]: n for n in N}

    # 曹操：当面威胁之后，在对峙里把那句话再说一遍，就是死；已经记了三笔仇，连“梗着脖子”也是死
    for nid, line in (("x_plum_rage", T("曹操脸上的笑一点一点收了：『推出去。』廊下的甲士把你从席上拖起来。刘备扑过来，被许褚一把按住。雨落下来的时候，刀也落了下来。",
                                         "The smile drains from Cao Cao's face. 'Take him out.' The guards haul you from your seat. Liu Bei lunges forward and Xu Chu pins him. As the rain comes down, so does the blade.")),
                      ("x_cao_rage", T("曹操没有再问第二遍，只抬了抬手。你被拖出门的时候，听见他在身后说：『可惜了。』", "Cao Cao doesn't ask twice; he only lifts his hand. As you're dragged out you hear him behind you: 'A pity.'"))):
        n = byid[nid]
        n["choices"].append(fate(choice("repeat", "dilemma", T("盯着曹操，把那句话再说一遍。", "Look Cao Cao in the eye and say it again."), line,
                                        [setv("flag.fate_dead"), rel("caocao", "esteem", -3)]), "execute", "caocao"))
        n["choices"][-1]["ends"] = True
        for c in list(n["choices"]):
            if c["id"] in ("defy", "defy_cao"):   # three marks of grudge: defiance is death too
                dead = copy_choice(c, c["id"] + "_dead", line, G("caocao", 3))
                c["when"] = ALL(c["when"], GL("caocao", 2)) if c.get("when") else GL("caocao", 2)
                n["choices"].insert(n["choices"].index(c) + 1, fate(dead, "execute", "caocao"))
    # 梅园里梗着脖子：下狱（AI 演这一段）
    for c in byid["x_plum_rage"]["choices"]:
        if c["id"] == "defy": fate(c, "jail", "caocao")
    # 刘备：说“是真话”，被送出城
    for c in byid["x_liu_break"]["choices"]:
        if c["id"] == "true": fate(c, "exile", "liubei")

    # 关羽：当面威胁他，当场对峙
    N.append(node("x_guan_rage1", "*", "flash", T("关羽拔刀", "Guan Yu Draws"), "free", T("原创", "original"),
        T("关羽的丹凤眼睁开了。他没有拍案，只是把青龙刀从架上取了下来，刀尖点地：『你再说一遍。』", "Guan Yu's long eyes open. He doesn't slam the table; he simply lifts the Green Dragon blade from its rack and sets its point to the floor. 'Say that again.'"),
        [choice("bow", "expression", T("收回这句话，向关羽赔罪。", "Take it back and apologize to Guan Yu."),
                T("关羽看了你很久，把刀放回了架上：『下不为例。』", "Guan Yu looks at you a long while, then sets the blade back on its rack. 'Never again.'"), [rel("guanyu", "esteem", -1)]),
         fate(choice("stand", "dilemma", T("不退，手按在剑柄上。", "Don't back down; put your hand on your sword hilt."),
                T("关羽的刀背砸在你肩上，你整个人撞翻了案几。张飞冲进来把你拖了出去，一路骂着。那天夜里，刘备来给你上药，一句话也没说。",
                  "The back of Guan Yu's blade slams into your shoulder and sends you crashing over the table. Zhang Fei storms in and drags you out, cursing all the way. That night Liu Bei comes to dress your wound and says nothing at all."),
                [setv("flag.wounded"), rel("guanyu", "esteem", -2), rel("liubei", "trust", -1), add("renown.rash")]), "wounded", "guanyu"),
         fate(choice("draw", "dilemma", T("拔剑。", "Draw your sword."),
                T("你的剑还没出鞘，就被张飞一把夺了过去。第二天一早，刘备让人牵来一匹马：『先生走吧。我兄弟的刀，我拦得住一次。』",
                  "Before your sword clears the scabbard Zhang Fei has wrenched it away. At dawn Liu Bei has a horse brought round. 'Go, sir. I can stop my brother's blade once.'"),
                [setv("flag.exiled"), rel("guanyu", "esteem", -3), rel("liubei", "trust", -3)], when=G("guanyu", 3)), "exile", "guanyu")]))
    g = byid.get("x_guan_rage1") or N[-1]
    g["choices"][-1]["ends"] = True
    g["cast"] = [{"id": "guanyu"}]; g["art"] = {"scene": "hall", "layers": []}
    CAMP_MOVES.append(mv("guan_threat1", "guanyu", T("当面威胁关羽、说要杀他", "threatens Guan Yu to his face / says they will kill him"),
        T("话音没落，屋里的人都不说话了。", "Before the words have died away, the whole room has gone silent."),
        [rel("guanyu", "esteem", -1), add("renown.rash", 1)], match=KILL_YOU, labels=["threat"], goto="x_guan_rage1", resume=True))

    # 结局：死了的人，没有“后来”
    side = next(x for x in ENDINGS if x["id"] == "g_side")
    side["fragments"].insert(0, {"id": "dead", "text": DEAD, "when": F("flag.fate_dead")})
    for grp in ENDINGS:
        if grp["id"] in ("g_lord", "g_guanyu", "g_zhuge", "g_wenzhi"):
            for f in grp["fragments"]:
                f["when"] = ALL(NF("flag.fate_dead"), f["when"]) if f.get("when") else NF("flag.fate_dead")

def copy_choice(c, id, line, when):
    import copy
    d = copy.deepcopy(c); d["id"] = id; d["out"] = [P(line)]; d["when"] = ALL(c["when"], when) if c.get("when") else when
    d["effects"] = [setv("flag.fate_dead"), rel("caocao", "esteem", -3)]; d["ends"] = True
    for k in ("echo", "debt", "resolve", "place"): d.pop(k, None)
    return d
