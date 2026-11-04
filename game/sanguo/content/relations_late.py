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
HERB["art"] = {"scene": "lamp", "layers": [], "illus": "v6_wz_burns"}; HERB["cast"] = [{"id": "wenzhi"}]


def v6(N, VARS):
    VARS["flag.v6_wz_herb"] = {"type": "flag", "init": False, "label": T("温芷给了你一包草", "Wen Zhi gave you a bundle of herbs"), "carry": False}
    byid = intros(N, VARS, V6)
    N.append(HERB)
    sp = byid["c4_spring"]; c2 = next(c for c in sp["choices"] if c["id"] == "cure_2")
    sp["choices"].insert(sp["choices"].index(c2) + 1, choice("cure_herb", "dilemma", T("拿出温芷临行前塞给你的那包草。", "Bring out the bundle Wen Zhi pressed on you before you left."),
        T("草叶的辛味一冲，几个军医都愣了：『这是薤叶芸香！』前军含着草叶，又照当地人指的路喝了安乐泉的水，一个也没死。", "The sharp smell of the leaves stops the army doctors short. 'That's xie-leaf rue!' The vanguard hold the leaves in their mouths and drink from the Anle spring the locals point to, and not one of them dies."),
        [setv("flag.v6_cure"), rel("zhuge", "esteem", 1), rel("wenzhi", "esteem", 1), add("deviation")], when=F("flag.v6_wz_herb")))
    sp["choices"][sp["choices"].index(c2) + 1]["because"] = T("因为温芷给过你那包草", "Because Wen Zhi gave you that bundle")


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


def v7(N, VARS, ENDINGS):
    VARS["grudge.weiyan"] = {"type": "num", "init": 0, "min": 0, "max": 10, "label": T("魏延·记仇", "Wei Yan · grudge"), "carry": False}
    VARS["flag.fate_dead"] = {"type": "flag", "init": False, "label": T("死于非命", "Died before the volume's end"), "carry": False}
    byid = intros(N, VARS, V7)
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


def v8(N, VARS):
    byid = intros(N, VARS, V8)
    dg = byid["c3_duangu"]; w = next(c for c in dg["choices"] if c["id"] == "with")
    _twin(dg, "with", WARM("jiangwei", "warmth"), NOTWARM("jiangwei", "warmth"),
          {"out": [P(T("冲阵之前，姜维把自己的护心镜扣在了你身上。", "Before the charge, Jiang Wei buckles his own breastplate mirror onto you."))] + w["out"],
           "effects": w["effects"] + [rel("jiangwei", "trust", 1)], "because": T("因为姜维和你相熟，把护心镜给了你", "Because Jiang Wei knows you well, he gives you his breastplate mirror")})
    jg = byid["c5_jiange"]; m = next(c for c in jg["choices"] if c["id"] == "memo")
    _twin(jg, "memo", WARM("jiangwei", "trust"), NOTWARM("jiangwei", "trust"),
          {"out": [P(T("姜维当场写了表，又在你的那份地图上盖了自己的印：『有我的印，宫里不敢压。』", "Jiang Wei writes the memorial on the spot and stamps your map with his own seal. 'With my seal on it, the palace won't dare bury it.'"))] + m["out"],
           "effects": m["effects"] + [rel("jiangwei", "trust", 1)], "because": T("因为姜维信你，把自己的印给了你", "Because Jiang Wei trusts you, he puts his seal on it")})
