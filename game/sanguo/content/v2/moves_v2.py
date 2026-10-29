"""卷二的说话走向（决策记录 v2.15，卷一试点之后铺开）。写法见 content/moves.py。"""
from lib import *
from moves import mv, KILL_YOU, liu_break

NODE_MOVES = {
  "c1_nanjun": [
    mv("warn_cao", "zhouyu", T("提醒周瑜：曹仁是诈败，城里有埋伏", "warns Zhou Yu that Cao Ren's retreat is a feint and there's an ambush"),
       T("周瑜眯起眼看了你很久：『刘备的人，替我操心？』他没有道谢，却叫人把前锋撤回了三里。诸葛亮在一旁轻轻摇扇。", "Zhou Yu narrows his eyes at you for a long moment. 'Liu Bei's man, worrying on my behalf?' He doesn't thank you, but he has the vanguard pulled back three li. Beside him Zhuge Liang fans himself gently."),
       [setv("flag.warned_zhouyu"), rel("zhouyu", "trust", 1), rel("zhuge", "esteem", -1)],
       match=r"诈败|曹仁.{0,6}(诈|假|埋伏|计|骗)|小心曹仁|有埋伏|别进城|feint|ambush|it's a trap"),
    mv("expose_zhuge", "zhouyu", T("当着周瑜说破：诸葛亮要趁他苦战取南郡", "tells Zhou Yu outright that Zhuge Liang means to take Nanjun while he's busy fighting"),
       T("帐里一下子静了。周瑜看看你，又看看诸葛亮，忽然笑了：『孔明，你家的人倒比你实在。』诸葛亮的扇子停了一停，没有看你。", "The tent goes quiet. Zhou Yu looks at you, then at Zhuge Liang, and suddenly laughs. 'Kongming, your own people are more honest than you.' Zhuge Liang's fan pauses; he doesn't look at you."),
       [rel("zhouyu", "trust", 1), rel("zhuge", "trust", -2), add("renown.rash")],
       match=r"(孔明|诸葛|军师).{0,10}(要|想|打算).{0,6}(取|拿|抢|夺).{0,4}南郡|南郡.{0,8}(被|让).{0,6}(孔明|诸葛|刘备).{0,4}(取|拿|抢)|zhuge.{0,30}take nanjun"),
  ],
  "c2_changsha": [
    mv("plead_wy", "zhuge", T("替魏延求情：他献城有功，不该杀", "pleads for Wei Yan: he opened the gates, he shouldn't die"),
       T("诸葛亮看了你一眼：『此人脑后有反骨。』刘备在一旁开口：『子衡说得是，杀降不祥。』诸葛亮叹了口气，指着魏延：『看在主公和子衡的面上，饶你一命。』魏延磕头的时候，偷偷看了你一眼。", "Zhuge Liang glances at you. 'This man has a rebel's bone at the back of his skull.' Liu Bei speaks up beside him. 'Ziheng is right—killing a man who surrendered is ill-omened.' Zhuge Liang sighs and points at Wei Yan. 'For my lord's sake, and Ziheng's, your life is spared.' As Wei Yan knocks his head on the ground, he steals a look at you."),
       [setv("flag.pleaded_weiyan"), rel("zhuge", "trust", -1), add("renown.loyal")],
       match=r"魏延.{0,8}(不可杀|不能杀|别杀|饶|留|有功|无罪)|刀下留人|饶了?(他|魏延)|杀降不祥|spare (him|wei yan)|don't kill"),
  ],
  "c3_ganlu": [
    mv("tip_zy", "zhaoyun", T("悄悄告诉赵云：廊下帐幕后藏着刀斧手", "quietly tells Zhao Yun there are axemen hidden behind the curtains"),
       T("赵云按剑的手紧了紧，不动声色地往刘备身边挪了半步。他朝你点了点头。", "Zhao Yun's hand tightens on his sword hilt and, without a flicker, he shifts half a step closer to Liu Bei. He gives you a nod."),
       [rel("zhaoyun", "trust", 2), rel("liubei", "trust", 1)],
       match=r"刀斧手|伏兵|埋伏|帐(幕|后)|有人要害|小心|axemen|ambush|behind the curtain"),
  ],
  "c5_zhangsong": [
    mv("mock_zs", "zhangsong", T("当面嘲笑张松的相貌", "mocks Zhang Song's looks to his face"),
       T("张松的脸一下子涨红了。他拱了拱手，什么也没说。刘备连忙起身赔礼，可张松再看你的时候，眼里已经没有笑意了。", "Zhang Song flushes deep red. He cups his hands and says nothing. Liu Bei rises at once to apologise, but when Zhang Song looks at you again there's no warmth left in his eyes."),
       [rel("zhangsong", "esteem", -3), rel("zhangsong", "warmth", -2), rel("liubei", "trust", -1), add("renown.rash")],
       match=r"丑|矮|猥琐|相貌|长得|样子.{0,4}(难看|寒碜)|ugly|short|looks like", labels=["rude"]),
    mv("praise_zs", "zhangsong", T("真心夸张松过目不忘、熟知蜀中", "sincerely praises Zhang Song's memory and his knowledge of Shu"),
       T("张松愣了一下，像是很久没听人这样说过话。他从袖里摸出一卷图，又塞了回去：『先生这话，松记下了。』", "Zhang Song starts, as if he hasn't been spoken to like this in a long time. He draws a scroll halfway out of his sleeve, then tucks it back. 'I'll remember that, sir.'"),
       [rel("zhangsong", "warmth", 2), rel("zhangsong", "esteem", 1)],
       match=r"过目不忘|博闻|博学|才学|佩服|了不起|熟知|蜀中.{0,6}(山川|地理)|remarkable memory|brilliant|admire"),
  ],
  "c7_luofeng": [
    mv("warn_pt", "pangtong", T("劝庞统别走小路、别骑白马", "urges Pang Tong not to take the narrow road or ride the white horse"),
       T("庞统笑了：『子衡也信这些？』他拍了拍白马的脖子，还是翻身上了马。走出几步，他回头看了你一眼，那一眼里没有笑。", "Pang Tong laughs. 'You believe that sort of thing too, Ziheng?' He pats the white horse's neck and swings into the saddle all the same. A few steps on he looks back at you, and there's no laughter in that look."),
       [add("uncanny"), rel("pangtong", "trust", 1), rel("pangtong", "warmth", 1)],
       match=r"小路|落凤|别走|有埋伏|白马|换(马|路)|大路|narrow road|white horse|don't go"),
  ],
}

LIU_BREAK2, _liu = liu_break("x_liu_break2", "flag.v2_left")
CAMP_MOVES = [
    mv("zhouyu_threat", "zhouyu", T("当面威胁周瑜、说要杀他", "threatens Zhou Yu to his face / says they will kill him"),
       T("这话一出口，帐下的甲士都按住了刀。", "As the words leave your mouth, every guard in the tent grips his blade."),
       [rel("zhouyu", "trust", -1), add("renown.rash", 1)],
       match=KILL_YOU, labels=["threat"], goto="x_zhouyu_rage", resume=True),
    _liu,
]

def extend(N):
    byid = {n["id"]: n for n in N}
    for nid, ms in NODE_MOVES.items(): byid[nid]["moves"] = ms
    N.append(LIU_BREAK2)
    return CAMP_MOVES
