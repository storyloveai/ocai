"""卷三的说话走向（决策记录 v2.15）。写法见 content/moves.py。"""
from lib import *
from moves import mv, KILL_YOU, liu_break

NODE_MOVES = {
  "c1_dandao": [
    mv("threat_lusu", "lusu", T("当面威胁鲁肃：敢动关将军，就别想活着离开", "threatens Lu Su to his face: lay a finger on General Guan and you won't leave alive"),
       T("鲁肃的笑僵在脸上，手里的酒洒了半杯。关羽抚着长髯，看了你一眼，嘴角像是动了一下。", "Lu Su's smile freezes and half his wine spills. Guan Yu strokes his long beard and glances at you; the corner of his mouth seems to move."),
       [rel("lusu", "trust", -2), rel("lusu", "warmth", -1), rel("guanyu", "esteem", 1), add("renown.rash")],
       match=KILL_YOU + r"|敢动.{0,6}(关|将军)|别想活着|走不出", labels=["threat"]),
  ],
  "c4_laozu": [
    mv("praise_hz", "guanyu", T("当着关羽夸黄忠斩夏侯渊确实了得", "praises Huang Zhong's victory over Xiahou Yuan in front of Guan Yu"),
       T("关羽放下的酒杯又端了起来，一口喝干：『子衡倒是会替老卒说话。』满座的人都不敢出声。", "Guan Yu picks the cup back up and drains it. 'Ziheng knows how to speak up for an old soldier.' No one at the table dares make a sound."),
       [setv("flag.praised_hz"), rel("guanyu", "warmth", -1), rel("guanyu", "esteem", 1)],
       match=r"黄(忠|将军|老将军).{0,8}(了得|厉害|英勇|老当益壮|勇|功劳)|老当益壮|huang zhong.{0,20}(impressive|brave|great)"),
    mv("fed_pride", "guanyu", T("附和关羽：黄忠一个老卒，不过碰巧", "agrees with Guan Yu that Huang Zhong is just an old soldier who got lucky"),
       T("关羽哈哈大笑，满座跟着笑起来。只有你知道，这笑声传到成都会是什么样子。", "Guan Yu roars with laughter and the whole table laughs with him. Only you know how that laughter will sound by the time it reaches Chengdu."),
       [setv("flag.fed_pride"), rel("guanyu", "warmth", 1)],
       match=r"(黄忠|老卒|老头|老将).{0,8}(碰巧|侥幸|运气|不过如此|算什么)|一个老卒|got lucky|just an old"),
  ],
  "c8_fire": [
    mv("spare", "guanyu", T("求关羽饶糜芳、傅士仁一命", "begs Guan Yu to spare Mi Fang and Fu Shiren"),
       T("关羽的刀停在半空。他看了你很久，把刀插回鞘里：『看在子衡的面上，各打四十，留在后方。』糜芳磕头的时候，没有看关羽，只看你。", "Guan Yu's blade stops in midair. He looks at you a long time, then sheathes it. 'For Ziheng's sake: forty strokes each, and they stay behind.' As Mi Fang knocks his head on the ground he doesn't look at Guan Yu—only at you."),
       [setv("flag.fire_spared"), rel("guanyu", "esteem", -1), add("renown.loyal")],
       match=r"(饶|留|放).{0,6}(糜芳|傅士仁|他们|一命)|从轻|不吉|刀下留人|spare (them|mi fang)"),
  ],
}

LIU_BREAK3, _liu = liu_break("x_liu_break3", "flag.v3_left")
CAMP_MOVES = [
    mv("guan_threat", "guanyu", T("当面威胁关羽、说要杀他", "threatens Guan Yu to his face / says they will kill him"),
       T("话音未落，关羽的丹凤眼已经睁开了。", "Before the words have died away, Guan Yu's eyes have opened."),
       [rel("guanyu", "esteem", -1), add("renown.rash", 1)],
       match=KILL_YOU, labels=["threat"], goto="x_guan_rage", resume=True),
    _liu,
]

def extend(N):
    byid = {n["id"]: n for n in N}
    for nid, ms in NODE_MOVES.items(): byid[nid]["moves"] = ms
    N.append(LIU_BREAK3)
    return CAMP_MOVES
