"""卷六的说话走向（v2.16.3）。写法见 content/moves.py。七擒七纵不改；话改变的是丞相怎么看你。"""
from lib import *
from moves import mv

def _flag(label): return {"type": "flag", "init": False, "label": label, "carry": False}
FLAGS = {"flag.v6_said_killall": T("说过南人杀光了就不会再反", "Said the southerners wouldn't rebel if they were all killed")}

NODE_MOVES = {
  "c2_masu": [
    mv("kill_all", "zhuge", T("说南人杀光了就不会再反", "says that if the southerners are all killed, they can't rebel again"),
       T("马谡笑出了声，又赶紧收住。丞相没有笑。他看了你很久：『子衡兄，南中有多少人，你知道吗？』他没等你回答，转身上了马。",
         "Ma Su laughs out loud, then quickly stops. The Chancellor doesn't laugh. He looks at you for a long time. 'Brother Ziheng, do you know how many people live in the south?' He doesn't wait for an answer; he turns and mounts his horse."),
       [setv("flag.v6_said_killall"), rel("zhuge", "warmth", -2), rel("zhuge", "esteem", -1), add("renown.rash")],
       match=r"杀光|杀尽|斩尽杀绝|赶尽杀绝|一个不留|鸡犬不留|屠(了|城|尽)|kill (them )?all|wipe them out", labels=["threat", "rude"]),
  ],
  "c3_mengyou": [
    mv("drug", "zhuge", T("出主意：在给孟优一行的酒里下药，把他们灌倒", "suggests drugging the wine served to Meng You's party"),
       T("丞相摇着扇子笑了：『子衡兄与亮，想到一处去了。』他叫人去取药，又补了一句：『只叫他们睡，不叫他们死。』",
         "The Chancellor smiles behind his fan. 'Brother Ziheng and I have had the same thought.' He sends for the drug, then adds: 'Only to make them sleep, not to kill them.'"),
       [rel("zhuge", "esteem", 1), add("renown.cunning")],
       match=r"(酒|饭|水).{0,8}(下药|下毒|放药|蒙汗)|(下药|蒙汗药|迷药)|灌(醉|倒)|drug (the|their) wine|get them drunk"),
  ],
}

READS = {
    "c2_zhuge": [P(T("丞相给你倒了一杯茶：『那天子衡兄说杀光，亮知道是气话。可这样的话，别让南人听见。』", "The Chancellor pours you a cup of tea. 'That day you said to kill them all, I know it was anger talking. But don't let the southerners hear words like that.'"), F("flag.v6_said_killall"))],
}

def extend(N, VARS):
    for k, lab in FLAGS.items(): VARS[k] = _flag(lab)
    byid = {n["id"]: n for n in N}
    for nid, ms in NODE_MOVES.items(): byid[nid]["moves"] = ms
    for nid, ps in READS.items(): byid[nid]["intro"] = list(byid[nid]["intro"]) + ps
    return []
