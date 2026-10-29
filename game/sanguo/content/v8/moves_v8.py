"""卷八的说话走向（v2.16.3）。写法见 content/moves.py。
第三章起说话的是子衡的接班人，台词里只用“你”，不写名字。"""
from lib import *
from moves import mv, KILL_YOU

def _flag(label): return {"type": "flag", "init": False, "label": label, "carry": False}
FLAGS = {"flag.v8_urged_kill_hh": T("劝姜维当场杀了黄皓", "Urged Jiang Wei to kill Huang Hao on the spot")}

NODE_MOVES = {
  "c2_xiahouba": [
    mv("doubt_xhb", "jiangwei", T("说夏侯霸是诈降，信不得", "says Xiahou Ba's surrender is a ruse and he can't be trusted"),
       T("姜维摇头：『他父亲死在定军山，死在我们手里。他要是诈降，何必带着一家老小翻山过来？』他顿了顿，『先生，我当年也是降将。』",
         "Jiang Wei shakes his head. 'His father died at Mount Dingjun, at our hands. If this were a ruse, why bring his whole household over the mountains?' He pauses. 'Master, I was a surrendered general once too.'"),
       [rel("jiangwei", "warmth", -1), rel("jiangwei", "esteem", -1)],
       match=r"(夏侯霸|他).{0,8}(诈降|有诈|是假|信不得|不可信|奸细|细作)|诈降|fake surrender|can't be trusted|a spy"),
  ],
  "c4_huanghao": [
    mv("kill_hh", "jiangwei", T("劝姜维当场杀了黄皓", "urges Jiang Wei to kill Huang Hao on the spot"),
       T("姜维的手按在了剑上。黄皓的脸一下子白了，往陛下身后躲。姜维的手停了很久，慢慢松开：『杀了他，明天跪在这里的，就是我。』他朝陛下叩了个头，退了出去。",
         "Jiang Wei's hand goes to his sword. Huang Hao's face turns white and he shrinks behind His Majesty. Jiang Wei's hand stays there a long time, then slowly lets go. 'Kill him, and tomorrow the one kneeling here will be me.' He bows to His Majesty and withdraws."),
       [setv("flag.v8_urged_kill_hh"), rel("jiangwei", "trust", 1), add("renown.rash", 2)],
       match=r"杀了?(他|黄皓|这阉|阉(人|贼|狗))|斩(了)?黄皓|除掉黄皓|kill (him|huang hao)|cut him down"),
  ],
}

CAMP_MOVES = [
    mv("jw_threat", "jiangwei", T("当面威胁姜维、说要杀他", "threatens Jiang Wei to his face / says they will kill him"),
       T("姜维看了你很久，什么也没说，把枪靠回了架上。那天夜里，他的帐里没有再点灯。", "Jiang Wei looks at you for a long time, says nothing, and leans his spear back on the rack. That night no lamp is lit in his tent."),
       [rel("jiangwei", "trust", -2), rel("jiangwei", "warmth", -1), add("renown.rash", 2)],
       match=KILL_YOU, labels=["threat"]),
]

READS = {
    "c5_jiange": [P(T("姜维看着地图，忽然说：『那天在宫里，你叫我杀了黄皓。我有时候想，要是那天杀了……』他摇摇头，没说下去。", "Jiang Wei studies the map and suddenly says, 'That day in the palace, you told me to kill Huang Hao. Sometimes I wonder, if I had…' He shakes his head and doesn't go on."), F("flag.v8_urged_kill_hh"))],
}

def extend(N, VARS):
    for k, lab in FLAGS.items(): VARS[k] = _flag(lab)
    byid = {n["id"]: n for n in N}
    for nid, ms in NODE_MOVES.items(): byid[nid]["moves"] = ms
    for nid, ps in READS.items(): byid[nid]["intro"] = list(byid[nid]["intro"]) + ps
    return CAMP_MOVES
