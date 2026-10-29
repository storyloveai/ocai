"""卷七的说话走向（决策记录 v2.15）：当面威胁魏延，他当场拔刀。写法见 content/moves.py。"""
from lib import *
from moves import mv, KILL_YOU

CAMP_MOVES = [
    mv("weiyan_threat", "weiyan", T("当面威胁魏延、说要杀他", "threatens Wei Yan to his face / says they will kill him"),
       T("魏延的手已经按在了刀柄上。", "Wei Yan's hand is already on his hilt."),
       [rel("weiyan", "trust", -1), add("renown.rash", 1)],
       match=KILL_YOU, labels=["threat"], goto="x_weiyan_rage", resume=True),
]

def extend(N):
    return CAMP_MOVES
