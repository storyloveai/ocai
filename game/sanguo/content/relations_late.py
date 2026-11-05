"""卷六至卷八：关系改变你能经历的事 + 命运分支（决策记录 v2.35；做法同卷一至卷五）。
卷六 南中：5 个场景改口；温芷（亲近到「在意」、手里没有华佗的医书时）临行前塞给你一包草，哑泉那天能用；空城前后丞相交情。
卷七 出师：6 个场景改口；空城那天丞相和你交好，城楼上让你坐在琴边；魏延面前第二次冒犯（记仇 ≥ 3）就死在他刀下。
卷八 归晋：6 个场景改口（只用“你”，不写名字）；段谷、剑阁按姜维的交情/信任分两种结果。"""
import copy
from lib import *
from relations import RP, WARM, COLD, NOTWARM, _twin


def intros(N, VARS, table):
    byid = {n["id"]: n for n in N}
    for nid, (c, d, warm, cold) in table.items():
        init = VARS[f"rel.{c}.{d}"]["init"]
        extra = [RP(warm, WARM(c, d), [c, d, 2])] + ([RP(cold, COLD(c, d), [c, d, 0])] if cold and init > TIER_END[0] else [])
        byid[nid]["intro"] = list(byid[nid]["intro"]) + extra
    return byid


# ---------------- 卷六 ----------------
V6 = {
  "c1_wu": ("zhuge", "esteem", T("丞相说完，看着你：『子衡兄心里，怕是已经有人选了。』", "When he's done, the Chancellor looks at you. 'Brother Ziheng, I suspect you already have someone in mind.'"), None),
  "c2_first": ("zhuge", "esteem", T("丞相没有马上开口，转头问你：『子衡兄，放，还是不放？』", "The Chancellor doesn't answer at once; he turns to you. 'Brother Ziheng—release him, or not?'"), None),
  "c3_lushui": ("zhuge", "trust", T("丞相把令箭交到你手里：『过不过河，你看着办。』", "The Chancellor puts the command arrow in your hand. 'Whether we cross—that's your call.'"),
                T("丞相站在河边，没有回头问你。", "The Chancellor stands at the riverbank and doesn't turn to ask you.")),
  "c5_rattan": ("zhuge", "warmth", T("丞相把你拉到一边：『这一把火，亮下不去手。你帮亮想想。』", "The Chancellor draws you aside. 'I can't bring myself to light this fire. Help me think.'"), None),
  "c6_seventh": ("zhuge", "esteem", T("丞相听孟获说完，先看了你一眼。", "When Meng Huo has finished, the Chancellor glances at you first."), None),
}
NO_BOOK = {"any": [{"all": [{"v": f, "op": "!=", "val": True} for f in ("flag.wz_west", "flag.wz_jingzhou", "flag.wz_huatuo", "flag.wz_wed")]}, {"v": "flag.wz_qingnang", "op": "!=", "val": True}]}
HERB = node("x_rel_wzherb", "*", "interrupt", T("一包草", "A Bundle of Herbs"), "free", T("原创", "original"),
    [RP(T("出征前一夜，温芷塞给你一个小布包，里面是晒干的草叶，有一股辛味：『南边的水不干净，听老药农说，含着这个能挡一挡。你别不当回事。』",
          "On the night before the army sets out, Wen Zhi presses a small cloth bundle into your hands: dried leaves with a sharp smell. 'The water in the south is bad. An old herbalist told me holding this in your mouth can ward it off. Don't laugh at it.'"), None, ["wenzhi", "intimacy", 1])],
    [choice("keep", "expression", T("收好，答应她会带回来。", "Keep it, and promise to bring it back."), T("她瞪了你一眼：『用完了才好。』", "She glares at you. 'Better if you use it up.'"),
            [setv("flag.v6_wz_herb"), rel("wenzhi", "intimacy", 1)])],
    when=ALL(AT("wenzhi", "intimacy", 1), NO_BOOK, NF("flag.v6_wz_herb")), order=3)
HERB["art"] = {"scene": "lamp", "layers": [], "illus": "v6_wz_herb"}; HERB["cast"] = [{"id": "wenzhi"}]


def v6(N, VARS, CAMP_MOVES=None):
    VARS["flag.v6_wz_herb"] = {"type": "flag", "init": False, "label": T("温芷给了你一包草", "Wen Zhi gave you a bundle of herbs"), "carry": False}
    byid = intros(N, VARS, V6)
    N.append(HERB)
    # 威胁丞相：第一次他不说话，第二次把你送回成都
    if CAMP_MOVES is not None:
        from moves import mv, KILL_YOU
        VARS["grudge.zhuge"] = {"type": "num", "init": 0, "min": 0, "max": 10, "label": T("丞相·记仇", "The Chancellor · grudge"), "carry": False}
        CAMP_MOVES.append(mv("zg_threat2", "zhuge", T("又一次当面威胁丞相、说要杀他", "threatens the Chancellor to his face again / says they will kill him"),
            T("丞相这一回没有看你。第二天，他让人送来一纸调令：『子衡兄劳苦，回成都歇歇吧。』押送粮草的车队走的时候，把你也带上了。", "This time the Chancellor doesn't look at you. The next day an order arrives: 'Brother Ziheng has worked hard; let him rest in Chengdu.' When the grain convoy heads back, it takes you with it."),
            [setv("flag.v6_left"), rel("zhuge", "trust", -3)], match=KILL_YOU, labels=["threat"], when=V("grudge.zhuge", ">=", 2)))
        CAMP_MOVES[-1]["ends"] = True
        CAMP_MOVES.append(mv("zg_threat", "zhuge", T("当面威胁丞相、说要杀他", "threatens the Chancellor to his face / says they will kill him"),
            T("丞相手里的羽扇停了一下，又慢慢摇了起来。他什么也没说。", "The Chancellor's feather fan pauses, then slowly starts to move again. He says nothing."),
            [rel("zhuge", "trust", -2), rel("zhuge", "warmth", -1), add("renown.rash", 2)], match=KILL_YOU, labels=["threat"], when=V("grudge.zhuge", "<=", 1)))
    sp = byid["c4_spring"]; c2 = next(c for c in sp["choices"] if c["id"] == "cure_2")
    sp["choices"].insert(sp["choices"].index(c2) + 1, choice("cure_herb", "dilemma", T("拿出温芷临行前塞给你的那包草。", "Bring out the bundle Wen Zhi pressed on you before you left."),
        T("草叶的辛味一冲，几个军医都愣了：『这是薤叶芸香！』前军含着草叶，又照当地人指的路喝了安乐泉的水，一个也没死。", "The sharp smell of the leaves stops the army doctors short. 'That's xie-leaf rue!' The vanguard hold the leaves in their mouths and drink from the Anle spring the locals point to, and not one of them dies."),
        [setv("flag.v6_cure"), rel("zhuge", "esteem", 1), rel("wenzhi", "esteem", 1), add("deviation")], when=F("flag.v6_wz_herb")))
    sp["choices"][sp["choices"].index(c2) + 1]["because"] = T("因为温芷给过你那包草", "Because Wen Zhi gave you that bundle")
    rt = byid["c5_rattan"]; mc = next(c for c in rt["choices"] if c["id"] == "mercy")
    _twin(rt, "mercy", WARM("zhuge", "trust"), NOTWARM("zhuge", "trust"),
          {"out": [P(T("丞相没有犹豫，当场点了头：『就依子衡兄。』那一夜，盘蛇谷烧了起来。谷口那条路上，扔下藤甲跑出来的人，有好几千。丞相站在山上，还是哭了：『吾虽有功于社稷，必损寿矣！』",
                       "The Chancellor doesn't hesitate; he nods at once. 'As you say, Brother Ziheng.' That night Coiled Snake Valley burns. Along the path at its mouth, thousands throw down their rattan armour and run out. Standing on the hill, the Chancellor weeps all the same. 'I have served the state, but this will cost me years of my life!'"))],
           "effects": mc["effects"] + [rel("zhuge", "esteem", 1)], "because": T("因为丞相信你，当场就依了你", "Because the Chancellor trusts you, he agrees on the spot")})


# ---------------- 卷七 ----------------
V7 = {
  "c1_biao": ("zhuge", "esteem", T("丞相把表递给你的时候说：『这一份，亮只给你一个人看过。』", "As he hands you the memorial the Chancellor says, 'You're the only one I've shown this to.'"), None),
  "c2_jiangwei": ("zhuge", "esteem", T("丞相问计之前，先把姜维的事一五一十讲给了你。", "Before asking anyone for a plan, the Chancellor tells you everything about Jiang Wei."), None),
  "c3_jieting": ("zhuge", "trust", T("丞相看了马谡很久，又看你：『子衡兄，你说。』", "The Chancellor looks at Ma Su a long time, then at you. 'Brother Ziheng—you say.'"),
                 T("丞相没有问你，自己在案前坐了很久。", "The Chancellor doesn't ask you; he sits at his desk for a long time.")),
  "c5_masu": ("zhuge", "warmth", T("丞相下令之前，攥住了你的手腕，攥得很紧。", "Before he gives the order, the Chancellor grips your wrist, very tight."), None),
  "c7_envoy": ("zhuge", "trust", T("丞相把盒子交给你：『这一趟，只有你去我才放心。』", "The Chancellor hands you the box. 'Only if you go will I rest easy.'"), None),
  "c8_lamp": ("jiangwei", "warmth", T("姜维看见你，眼圈一下就红了：『先生……』", "When Jiang Wei sees you, his eyes redden at once. 'Sir…'"), None),
}
WY_DEATH = T("魏延的刀没有再推回去。帐里的人还没反应过来，刀光已经到了。你最后看见的，是魏延脸上那一点愣住的神情——他也没想到，自己真的砍了下去。",
             "Wei Yan's blade doesn't go back into its sheath. Before anyone in the tent can move, the steel has already fallen. The last thing you see is a flicker of shock on Wei Yan's face—he hadn't thought he would really strike either.")


LING = node("x_rel_zgling", "*", "interrupt", T("令箭", "The Command Arrow"), "free", T("原创", "original"),
    [RP(T("丞相把一支令箭放在你手里：『亮的身子，亮自己知道。营里若有一天乱了，子衡兄凭这支箭，可以替亮挡一挡。』", "The Chancellor places a command arrow in your hand. 'I know the state of my own body. If the camp is ever thrown into disorder, Brother Ziheng, with this arrow you can stand in for me.'"), None, ["zhuge", "trust", 3])],
    [choice("take", "expression", T("双手接过。", "Take it in both hands."), T("丞相点点头，又低头看他的文书了。灯芯爆了一下。", "The Chancellor nods and goes back to his papers. The wick sputters."),
            [setv("flag.v7_zg_ling"), rel("zhuge", "warmth", 1)])],
    when=ALL(AT("zhuge", "trust", 3), NF("flag.v7_zg_ling"), NF("flag.v7_after_lamp")), order=3)
LING["art"] = {"scene": "lamp", "layers": [], "illus": "v7_zg_ling"}; LING["cast"] = [{"id": "zhuge"}]


def v7(N, VARS, ENDINGS):
    VARS["grudge.weiyan"] = {"type": "num", "init": 0, "min": 0, "max": 10, "label": T("魏延·记仇", "Wei Yan · grudge"), "carry": False}
    VARS["flag.fate_dead"] = {"type": "flag", "init": False, "label": T("死于非命", "Died before the volume's end"), "carry": False}
    byid = intros(N, VARS, V7)
    VARS["flag.v7_zg_ling"] = {"type": "flag", "init": False, "label": T("丞相给了你一支令箭", "The Chancellor gave you a command arrow"), "carry": False}
    VARS["flag.v7_after_lamp"] = {"type": "flag", "init": False, "label": T("七星灯那一夜已经过去", "The night of the seven-star lamp has passed"), "carry": False}
    N.append(LING)
    lp = byid["c8_lamp"]
    for c in lp["choices"]: c["effects"] = c["effects"] + [setv("flag.v7_after_lamp")]
    gd = next(c for c in lp["choices"] if c["id"] == "guard")
    lp["choices"].insert(lp["choices"].index(gd) + 1, {**copy.deepcopy(gd), "id": "guard_ling", "when": F("flag.v7_zg_ling"),
        "label": T("举起丞相给你的令箭，拦在帐门口。", "Raise the command arrow the Chancellor gave you and bar the tent door."),
        "out": [P(T("魏延看见令箭，单膝跪了下来：『末将遵令。』军情由你进帐低声禀报，主灯一直亮着。到了第六夜，丞相自己咳了一阵，主灯晃了晃，灭了。丞相反倒笑了：『这一回，谁也不怪。』",
                    "At the sight of the arrow Wei Yan drops to one knee. 'I obey.' You go in and report the news in a low voice, and the main lamp stays lit. On the sixth night the Chancellor has a fit of coughing; the lamp flickers and goes out. He only smiles. 'This time, no one is to blame.'"))],
        "effects": gd["effects"] + [rel("weiyan", "esteem", 1), rel("zhuge", "trust", 1)],
        "because": T("因为丞相给过你那支令箭", "Because the Chancellor gave you that command arrow")})
    kc = byid["c4_kongcheng"]; wl = next(c for c in kc["choices"] if c["id"] == "wall")
    _twin(kc, "wall", WARM("zhuge", "warmth"), NOTWARM("zhuge", "warmth"),
          {"out": [P(T("丞相往旁边让了让，让你坐在琴边：『子衡兄，替亮翻谱。』", "The Chancellor shifts aside and has you sit by the zither. 'Brother Ziheng, turn the pages for me.'"))] + wl["out"],
           "effects": wl["effects"] + [rel("zhuge", "trust", 1)], "because": T("因为丞相和你交好，让你坐在琴边", "Because you and the Chancellor are close, he has you sit by the zither")})
    wr = byid["x_weiyan_rage"]
    for c in wr["choices"]: c["when"] = ALL(c["when"], V("grudge.weiyan", "<=", 2)) if c.get("when") else V("grudge.weiyan", "<=", 2)
    for id, label, first in (("plead", T("拱手赔罪。", "Bow and apologize."), T("魏延冷笑：『晚了。』", "Wei Yan sneers. 'Too late.'")),
                             ("repeat", T("盯着魏延，把那句话再说一遍。", "Look Wei Yan in the eye and say it again."), None)):
        c = choice(id, "dilemma" if id == "repeat" else "expression", label, ([P(first)] if first else []) + [P(WY_DEATH)],
                   [setv("flag.fate_dead"), rel("weiyan", "esteem", -3)], when=V("grudge.weiyan", ">=", 3))
        c["fate"] = {"kind": "execute", "who": "weiyan", "label": T("被斩", "executed")}; c["ends"] = True
        wr["choices"].append(c)
    side = next(g for g in ENDINGS if g["id"] == "g_side")
    side["fragments"].insert(0, {"id": "dead", "text": T("你没有走出魏延的营帐。那一年，北伐还在继续，只是少了一个人。", "You never left Wei Yan's tent. That year the northern campaigns went on, one man short."), "when": F("flag.fate_dead")})
    for g in ENDINGS:
        if g["id"] in ("g_zhuge", "g_heirs", "g_old"):
            for f in g["fragments"]:
                f["when"] = ALL(NF("flag.fate_dead"), f["when"]) if f.get("when") else NF("flag.fate_dead")


# ---------------- 卷八（第三章起说话的是接班人，台词里只用“你”） ----------------
V8 = {
  "c1_weiyan": ("jiangwei", "trust", T("姜维把丞相的信交给你：『这封信，只有你拿着走过去，两边才肯听。』", "Jiang Wei hands you the Chancellor's letter. 'Only if you carry it across will both sides listen.'"), None),
  "c2_xiahouba": ("jiangwei", "esteem", T("姜维把夏侯霸的降书先给你看了。", "Jiang Wei shows you Xiahou Ba's letter of surrender before anyone else."), None),
  "c3_duangu": ("jiangwei", "trust", T("姜维把地图推到你面前：『你说，进不进？』", "Jiang Wei pushes the map across to you. 'You tell me—do we go in?'"), None),
  "c4_huanghao": ("jiangwei", "warmth", T("姜维出宫的时候，在台阶上等了你一会儿。", "Leaving the palace, Jiang Wei waits for you a while on the steps."), None),
  "c5_jiange": ("jiangwei", "esteem", T("姜维把灯往你那边推了推：『你看得比我细。』", "Jiang Wei pushes the lamp toward you. 'You see more closely than I do.'"), None),
  "c8_zhonghui": ("jiangwei", "trust", T("姜维的计划，只告诉了你一个人。", "Jiang Wei has told his plan to no one but you."), None),
}


BOOK = node("x_rel_jwbook", "*", "interrupt", T("兵书", "The Book of War"), "free", T("原创", "original"),
    [RP(T("姜维把丞相留下的兵书推到你面前：『丞相的东西，不该只在我一个人手里。你拿去抄。』书页边上，是丞相的小字，画着蜀中的每一条路。", "Jiang Wei pushes the Chancellor's book of war across to you. 'The Chancellor's legacy shouldn't sit in my hands alone. Take it and copy it.' In its margins, in the Chancellor's small hand, every road in Shu is drawn."), None, ["jiangwei", "warmth", 2])],
    [choice("copy", "expression", T("连夜抄。", "Copy it through the night."), T("你抄到天亮。阴平那一页，你多看了两眼。", "You copy until dawn. You linger twice over the page about Yinping."),
            [setv("flag.v8_jw_book"), rel("jiangwei", "trust", 1)])],
    when=ALL(AT("jiangwei", "warmth", 2), NF("flag.v8_jw_book"), NF("flag.v8_after_jiange")), order=3)
BOOK["art"] = {"scene": "lamp", "layers": [], "illus": "v8_jw_book"}; BOOK["cast"] = [{"id": "jiangwei"}]


def v8(N, VARS, CAMP_MOVES):
    from moves import mv, KILL_YOU
    VARS["flag.v8_jw_book"] = {"type": "flag", "init": False, "label": T("姜维把丞相的兵书给你抄", "Jiang Wei let you copy the Chancellor's book of war"), "carry": False}
    VARS["flag.v8_after_jiange"] = {"type": "flag", "init": False, "label": T("剑阁那一夜已经过去", "The night at Jiange has passed"), "carry": False}
    VARS["grudge.jiangwei"] = {"type": "num", "init": 0, "min": 0, "max": 10, "label": T("姜维·记仇", "Jiang Wei · grudge"), "carry": False}
    byid = intros(N, VARS, V8)
    N.append(BOOK)
    jg0 = byid["c5_jiange"]
    for c in jg0["choices"]: c["effects"] = c["effects"] + [setv("flag.v8_after_jiange")]
    gd = next(c for c in jg0["choices"] if c["id"] == "guard")
    jg0["choices"].insert(jg0["choices"].index(gd) + 1, {**{k: v for k, v in copy.deepcopy(gd).items() if k not in ("req", "hint")}, "id": "guard_book", "when": F("flag.v8_jw_book"),
        "label": T("翻开抄来的兵书，指着阴平那一页，自请带五百人去守。", "Open the copy of the book of war at the Yinping page and volunteer to hold it with five hundred men."),
        "out": [P(T("姜维看着丞相画的那条小路，半天没说话。最后他拍了拍你的肩：『丞相早就看见了。去吧。』", "Jiang Wei stares at the little road the Chancellor drew and says nothing for a long while. At last he claps your shoulder. 'The Chancellor saw it long ago. Go.'"))],
        "because": T("因为姜维给你抄过丞相的兵书", "Because Jiang Wei let you copy the Chancellor's book of war")})
    # 第二次威胁姜维：他不杀人，把你送走
    for m in CAMP_MOVES:
        if m["id"] == "jw_threat": m["when"] = ALL(m["when"], V("grudge.jiangwei", "<=", 1)) if m.get("when") else V("grudge.jiangwei", "<=", 1)
    m2 = mv("jw_threat2", "jiangwei", T("又一次当面威胁姜维、说要杀他", "threatens Jiang Wei to his face again / says they will kill him"),
            T("姜维这一回没有沉默。他把你的东西收拾好，放在营门口：『你走吧。我不想哪天真的对你拔枪。』那天起，汉中的营里没有你了。", "This time Jiang Wei doesn't stay silent. He packs your things and leaves them at the camp gate. 'Go. I don't want the day to come when I really raise my spear at you.' From that day on there is no place for you in the Hanzhong camps."),
            [setv("flag.v8_left"), rel("jiangwei", "trust", -3)], match=KILL_YOU, labels=["threat"], when=V("grudge.jiangwei", ">=", 2))   # 说话走向在记仇之前判断：上一次威胁已记 2 笔
    m2["ends"] = True
    CAMP_MOVES.insert(0, m2)
    dg = byid["c3_duangu"]; w = next(c for c in dg["choices"] if c["id"] == "with")
    _twin(dg, "with", WARM("jiangwei", "warmth"), NOTWARM("jiangwei", "warmth"),
          {"out": [P(T("冲阵之前，姜维把自己的护心镜扣在了你身上。", "Before the charge, Jiang Wei buckles his own breastplate mirror onto you."))] + w["out"],
           "effects": w["effects"] + [rel("jiangwei", "trust", 1)], "because": T("因为姜维和你相熟，把护心镜给了你", "Because Jiang Wei knows you well, he gives you his breastplate mirror")})
    jg = byid["c5_jiange"]; m = next(c for c in jg["choices"] if c["id"] == "memo")
    _twin(jg, "memo", WARM("jiangwei", "trust"), NOTWARM("jiangwei", "trust"),
          {"out": [P(T("姜维当场写了表，又在你的那份地图上盖了自己的印：『有我的印，宫里不敢压。』", "Jiang Wei writes the memorial on the spot and stamps your map with his own seal. 'With my seal on it, the palace won't dare bury it.'"))] + m["out"],
           "effects": m["effects"] + [rel("jiangwei", "trust", 1)], "because": T("因为姜维信你，把自己的印给了你", "Because Jiang Wei trusts you, he puts his seal on it")})
