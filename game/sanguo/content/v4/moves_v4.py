"""卷四的说话走向（决策记录 v2.15）：当面威胁关羽、刘备会当场出事。写法见 content/moves.py。"""
from lib import *
from moves import mv, KILL_YOU, liu_break

LIU_BREAK4, _liu = liu_break("x_liu_break4", "flag.v4_left")
CAMP_MOVES = [
    mv("guan_threat", "guanyu", T("当面威胁关羽、说要杀他", "threatens Guan Yu to his face / says they will kill him"),
       T("话音未落，关羽的丹凤眼已经睁开了。", "Before the words have died away, Guan Yu's eyes have opened."),
       [rel("guanyu", "esteem", -1), add("renown.rash", 1)],
       match=KILL_YOU, labels=["threat"], goto="x_guan_rage4", resume=True),
    _liu,
]

def extend(N):
    N.append(LIU_BREAK4)
    return CAMP_MOVES
