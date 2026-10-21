"""v2.2：人物的价值观。

选项上标“价值标签”，说明这个选择体现了什么：义、智、仁、勇、诚、利。
在场的人按自己的价值观自动反应：同一个选择，关羽会更敬你，曹操可能觉得你迂。
作者在选项里明写了某人的关系变化时，以作者写的为准，这个人不再自动反应。
每个人对一次选择的反应，每根轴最多 ±1；刚被你惹急的人（火气 ≥ 2）不会因此加分。
"""
from lib import PACK

TAGS = PACK("history-strategy")["values"]   # the value tags come from the genre pack (game/engine/packs)

# 人物 → {标签: [轴, 方向]}
VALUES = {
    "liubei": {"ren": ["trust", 1], "yi": ["trust", 1], "zhi": ["esteem", 1], "li": ["warmth", -1]},
    "caocao": {"zhi": ["esteem", 1], "yong": ["esteem", 1], "yi": ["esteem", 1], "ren": ["esteem", -1]},
    "guanyu": {"yi": ["esteem", 1], "yong": ["esteem", 1], "li": ["esteem", -1], "cheng": ["trust", 1]},
    "zhuge": {"zhi": ["esteem", 1], "cheng": ["trust", 1], "ren": ["warmth", 1], "li": ["trust", -1]},
    "wenzhi": {"ren": ["warmth", 1], "cheng": ["trust", 1], "li": ["trust", -1]},
    "zhouyu": {"zhi": ["esteem", 1], "yong": ["esteem", 1], "cheng": ["trust", 1], "li": ["trust", -1]},
    "lusu": {"cheng": ["trust", 1], "yi": ["trust", 1], "li": ["trust", -1]},
    "zhaoyun": {"yi": ["trust", 1], "yong": ["esteem", 1], "ren": ["warmth", 1], "li": ["esteem", -1]},
    "sunfuren": {"yong": ["esteem", 1], "cheng": ["trust", 1], "li": ["warmth", -1]},
    "pangtong": {"zhi": ["esteem", 1], "yong": ["warmth", 1]},
    "zhangsong": {"zhi": ["esteem", 1], "ren": ["warmth", 1]},
}

# (场景, 选项) → 价值标签
V1_TAGS = {
    ("c1_plum", "cover"): ["yi", "zhi"], ("c1_plum", "speak"): ["yong", "zhi"],
    ("c2_xuchu", "rule"): ["yi"], ("c2_xuchu", "talk"): ["zhi"],
    ("c4_horse", "accept_post"): ["li"], ("c4_horse", "decline"): ["yi"], ("c4_horse", "deflect"): ["zhi"],
    ("c4_seal", "follow"): ["yi", "yong"], ("c4_seal", "pass"): ["zhi"], ("c4_seal", "stay"): ["li"],
    ("c5_cottage", "wait"): ["ren", "cheng"], ("c5_cottage", "co_rec"): ["yi"], ("c5_cottage", "pangtong"): ["zhi"],
    ("c5_cottage", "aside"): ["li"], ("c5_cottage", "preempt"): ["zhi"],
    ("c6_slope", "abandon"): ["li"], ("c6_slope", "search"): ["ren", "yong"],
    ("c7_fire", "row"): ["ren", "yong"], ("c7_fire", "ambush"): ["zhi"],
    ("c7_chain", "second"): ["zhi", "cheng"], ("c7_chain", "agree"): ["li"], ("c7_chain", "wenzhi"): ["ren"],
    ("c8_huarong", "vouch"): ["yi", "yong"], ("c8_huarong", "go_with"): ["yi"], ("c8_huarong", "warn_wenzhi"): ["ren"],
    ("c8_cao", "plead"): ["ren", "yi"], ("c8_cao", "cao_pleads"): ["zhi"], ("c8_cao", "draw"): ["yong", "yi"],
    ("x_exposed", "dream"): ["cheng"], ("x_exposed", "reason_liu"): ["zhi"], ("x_exposed", "reason_cao"): ["zhi"],
    ("x_loose", "apologize"): ["cheng"], ("x_loose", "defend"): ["cheng", "yong"],
    ("x_plum_rage", "take"): ["yi", "yong"], ("x_plum_rage", "turn"): ["zhi"], ("x_plum_rage", "defy"): ["yong"],
    ("x_cao_rage", "defy"): ["yong"],
}
V2_TAGS = {
    ("x_north", "south"): ["yi"], ("x_north", "stay"): ["li"],
    ("c1_wound", "let"): ["ren"], ("c1_wound", "spy"): ["li"],
    ("c1_lusu", "liuqi"): ["zhi"], ("c1_lusu", "pledge"): ["cheng", "yi"], ("c1_lusu", "foresee"): ["cheng"],
    ("c1_nanjun", "take"): ["zhi", "li"], ("c1_nanjun", "yield"): ["yi", "cheng"], ("c1_nanjun", "warn"): ["cheng", "zhi"],
    ("c2_guiyang", "back"): ["yi"], ("c2_guiyang", "persuade"): ["li"],
    ("c2_changsha", "plead"): ["ren"], ("c2_changsha", "foresee"): ["zhi"],
    ("c3_ganlu", "kneel"): ["zhi"], ("c3_ganlu", "expose"): ["yong"],
    ("c3_flight", "lady"): ["zhi"], ("c3_flight", "rear"): ["yong", "yi"], ("c3_flight", "leave"): ["li"],
    ("c4_death", "visit"): ["ren"], ("c4_death", "save"): ["ren"],
    ("c4_mourn", "pt"): ["zhi"], ("c4_mourn", "guard"): ["yi", "yong"],
    ("c5_zhangsong", "host"): ["ren"], ("c5_zhangsong", "ask"): ["zhi", "cheng"], ("c5_zhangsong", "follow"): ["yi"],
    ("c6_river", "board"): ["yong", "yi"], ("c6_river", "talk"): ["cheng"],
    ("c7_luofeng", "stop"): ["yi"], ("c7_luofeng", "ride"): ["yong", "yi"],
    ("c8_chengdu", "stay"): ["zhi"], ("c8_chengdu", "jingzhou"): ["yi"], ("c8_chengdu", "none"): ["cheng"],
    ("x_zhouyu_rage", "stand"): ["yong"],
}

def apply(N, CHARS, tags):
    for c, v in VALUES.items():
        if c in CHARS: CHARS[c]["values"] = v
    byid = {n["id"]: n for n in N}
    for (nid, cid), ts in tags.items():
        ch = next(c for c in byid[nid]["choices"] if c["id"] == cid)
        ch["values"] = ts
