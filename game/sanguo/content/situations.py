"""你的处境（决策记录 v2.27）：出了事，后面的故事要认账。由引擎执行（CC.situations），这里只写卷一有哪几种、各管什么。
- 死了（dead）：这一局结束，不能进下一卷。
- 不在场（absent）：人在牢里、被送走，这一章剩下的事你做不了。
- 负伤（hurt）：伤好之前，要动手、要赶路的选项锁住。
- 失势（sidelined）：议事时没人再问你的主意——出主意的选项锁住，支线少一个，过一章才有人想起你。
“离开”（逐出、请辞、外放）照旧：这一卷提前收场，下一卷开头有人找你回来。"""
from lib import *

def S(id, kind, flag, label, lock=None, locks=None, lasts=None, back=None):
    d = {"id": id, "kind": kind, "flag": flag, "label": label}
    if lock: d["lock"] = lock
    if locks: d["locks"] = locks
    if lasts is not None: d["lasts"] = lasts
    if back: d["back"] = back
    return d

SITUATIONS = [
    S("dead", "dead", "flag.fate_dead", T("身死", "dead")),
    S("jail", "absent", "flag.jailed", T("关在许都大牢里", "locked in the Xuchang jail")),
    S("beaten", "hurt", "flag.beaten", T("肩上挨了关羽一刀背，伤还没好", "your shoulder still hurts from the back of Guan Yu's blade"),
      lock=T("肩上的伤还没好，动不了手", "your shoulder hasn't healed; you can't fight"),
      locks={"choices": ["c3_terms.carry", "c6_slope.search", "c6_slope.search_pouch", "c8_cao.draw"]}, lasts=1,
      back=T("肩上的伤好了。抬手的时候，已经不疼了。", "Your shoulder has healed. It no longer hurts to raise your arm.")),
    S("wounded", "hurt", "flag.wounded", T("长坂中了一箭，伤还没好", "still healing from the arrow at Changban")),
    S("sidelined", "sidelined", "flag.sidelined", T("被冷落了，议事时没人问你的主意", "sidelined: no one asks your advice in council"),
      lock=T("你被冷落了，议事时没人问你的主意", "you've been sidelined; no one asks your advice"),
      locks={"tags": ["advice"]}, lasts=1,
      back=T("冷了一阵子。这天议事，主公忽然转过头来：『子衡怎么看？』满屋的人都看向你。", "A cold spell. Then one day in council your lord suddenly turns: 'What does Ziheng think?' Every eye in the room is on you.")),
]

import re
ADVICE = re.compile(r"^(献策|劝主公|请主公|预先劝主公)")   # 给主公出主意的选项：失势时没人听

def extend(N, VARS):
    for n in N:
        if n["kind"] in ("flash", "interrupt"): continue
        for c in n["choices"]:
            if ADVICE.match(c["label"]["zh"]): c.setdefault("tags", []).append("advice")
    VARS["flag.beaten"] = {"type": "flag", "init": False, "label": T("挨了关羽一刀背", "Struck by Guan Yu's blade"), "carry": False}
    for n in N:   # 关羽那一刀背是新伤，不是长坂的箭伤
        for c in n["choices"]:
            if n["id"] == "x_guan_rage1" and c["id"] == "stand":
                c["effects"] = [{"set": "flag.beaten", "to": True} if e.get("set") == "flag.wounded" else e for e in c["effects"]]
    # 失势时没人听你的，场面照着历史走，你在一边看着
    byid = {n["id"]: n for n in N}
    SL = F("flag.sidelined")
    byid["c2_xuchu"]["choices"].append(choice("watch", "expression", T("站在队伍后面，看主公自己怎么打发许褚。", "Stand at the back of the column and watch your lord deal with Xu Chu himself."),
        T("刘备自己迎上去：『将在外，君命有所不受。』许褚是个直人，竟无话可说，回去复命了。从头到尾，没有人回头看你一眼。",
          "Liu Bei rides out to meet him himself. 'A general in the field need not obey every order.' Xu Chu is a plain man and has no answer; he goes back to report. From start to finish, no one turns to look at you."),
        [], when=ALL(NF("flag.fast_departure"), SL)))
    byid["c6_slope"]["choices"].append(choice("watch", "expression", T("挤不进去。跟着百姓往南走。", "You can't get through. Go south with the refugees."),
        T("刘备没有扔下百姓。张飞在长坂桥上一声大喝，喝退了曹军；赵云怀抱阿斗冲了出来，糜夫人没能回来。乱军里，没有人想起问你一句。",
          "Liu Bei doesn't abandon the people. Zhang Fei's roar on the Changban bridge turns Cao's army back; Zhao Yun breaks out with A-Dou in his arms, and Lady Mi doesn't come back. In all that chaos, no one thinks to ask you anything."),
        [], when=SL))
    return SITUATIONS
