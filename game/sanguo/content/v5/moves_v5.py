"""卷五的说话走向（决策记录 v2.15 起，v2.16.3 铺到卷五）。写法见 content/moves.py。
大势不改：东征照样去，白帝城照样托孤；话改变的是人心。"""
from lib import *
from moves import mv, KILL_YOU

def _flag(label): return {"type": "flag", "init": False, "label": label, "carry": False}
FLAGS = {
    "flag.v5_blamed_fei": T("阆中的消息传来时，说张飞是自己害死自己", "Said Zhang Fei brought his death on himself when the news came from Langzhong"),
    "flag.v5_asked_sun": T("在陛下面前提起孙夫人", "Spoke of Lady Sun to His Majesty"),
}

NODE_MOVES = {
  "c4_news": [
    mv("blame_fei", "liubei", T("说张飞是自己害死自己的：醉后鞭打部下，早晚出事", "says Zhang Fei brought it on himself—flogging his men when drunk was bound to end like this"),
       T("陛下抬起头看你，眼睛红得吓人：『他是朕的兄弟！』这一声把帐外的人都惊动了。过了很久，他低下头，声音哑了：『……朕也劝过他。朕劝过他。』",
         "His Majesty looks up at you, his eyes a frightening red. 'He was my brother!' The shout brings people running outside the tent. After a long time he lowers his head, his voice gone hoarse. '…I warned him too. I warned him.'"),
       [setv("flag.v5_blamed_fei"), rel("liubei", "warmth", -2), rel("liubei", "esteem", 1), add("renown.rash")],
       match=r"(张飞|翼德|三将军).{0,10}(自(己|找|作)|活该|咎由|报应|早晚|迟早)|自作自受|咎由自取|怪不得别人|brought it on himself|had it coming", labels=["rude"]),
  ],
  "c5_jin": [
    mv("sun_lady", "liubei", T("提起孙夫人：她还在东吴，陛下想不想她回来", "brings up Lady Sun: she is still in Wu—does His Majesty want her back?"),
       T("陛下愣了一下。他没有回答，只是把诸葛瑾留下的那封书信又拿起来，翻到写着孙夫人的那一行，看了很久。『她走的时候，阿斗还抱着她的腿哭。』他把信放下：『这一仗打完再说。』",
         "His Majesty starts. He doesn't answer; he picks up the letter Zhuge Jin left, finds the line about Lady Sun, and looks at it for a long time. 'When she left, A-Dou clung to her legs and cried.' He sets the letter down. 'When this war is over, then.'"),
       [setv("flag.v5_asked_sun"), rel("liubei", "warmth", 1)],
       match=r"孙夫人|夫人.{0,6}(回来|还在|想不想|接回)|孙尚香|lady sun|your wife"),
  ],
  "c8_tuogu": [
    mv("urge_zhuge", "zhuge", T("当着陛下，劝丞相真的取而代之、自己做皇帝", "in front of His Majesty, urges the Chancellor to really take the throne himself"),
       [P(T("丞相听完，汗流遍体，手足失措，泣拜于地：『臣安敢不竭股肱之力，效忠贞之节，继之以死乎！』说完，叩头流血。",
            "The Chancellor breaks into a sweat all over; his hands and feet don't know where to go. Weeping, he prostrates himself. 'How would I dare do anything but give all my strength, keep faith to the end, and follow it with my death!' He knocks his head on the floor until it bleeds.")),
        P(T("陛下闭着眼睛，什么也没说。丞相起来以后，没有再看你一眼。", "His Majesty keeps his eyes closed and says nothing. When the Chancellor rises, he doesn't look at you again."))],
       [rel("zhuge", "trust", -2), rel("zhuge", "warmth", -1), add("renown.rash", 2)],
       match=r"(丞相|孔明|军师).{0,8}(自取|取而代之|当皇帝|做皇帝|称帝|自立)|(自取|取而代之|自立)(吧|罢|便是|就是)|take the throne|be emperor yourself"),
  ],
}

# 威胁陛下：卷五的刘备是天子，门外没有张飞了
LIU_BREAK5 = node("x_liu_break5", "*", "flash", T("覆水", "Spilled Water"), "free", T("原创", "original"),
    T("陛下慢慢放下手里的东西，看着你，很久没有说话。门外的侍卫按住了刀，又看了看陛下，没有进来。陛下终于开口，声音很轻：『先生跟了朕这些年。这句话，朕想听你再说一遍——是气话，还是真话？』",
      "His Majesty slowly sets down what he's holding and looks at you for a long time without a word. The guards outside grip their swords, glance at him, and stay where they are. At last he speaks, very quietly. 'You've followed me all these years, sir. I want to hear you say it once more—was that anger talking, or the truth?'"),
    [choice("drunk", "expression", T("跪下：是气话，是失心疯。", "Kneel: it was anger talking—madness."),
            T("陛下让你起来：『那就当没说过。』可从那天起，议事的时候，他不再先问你。", "His Majesty tells you to rise. 'Then it was never said.' But from that day on, in council, he no longer asks you first."),
            [rel("liubei", "trust", -1), add("renown.rash"), setv("flag.sidelined")]),
     choice("explain", "dilemma", T("说：是真话——可我想杀的不是陛下，是那个为了一口气、要把蜀中拖进火里的人。", "Say: it was the truth—but what I want to kill isn't Your Majesty, it's the man who'll drag Shu into the fire for the sake of a grudge."),
            T("陛下愣住了。半晌，他笑了，眼眶却是红的：『先生这一刀，朕受了。可这一仗，朕还是要打。』", "His Majesty is stunned. After a long moment he laughs, though his eyes are red. 'I'll take that cut, sir. But I'm still fighting this war.'"),
            [rel("liubei", "esteem", 2), rel("liubei", "trust", -1), add("renown.rash")]),
     choice("true", "dilemma", T("说：是真话。", "Say: it was the truth."),
            T("陛下点点头，没有叫人。他让人给你备了一匹马、一袋盘缠：『先生走吧。朕不送了。』那天夜里，你出了营。", "His Majesty nods and calls no one. He has a horse and a purse of travel money made ready for you. 'Go, sir. I won't see you off.' That night you leave the camp."),
            [setv("flag.v5_left"), rel("liubei", "trust", -3)])])
LIU_BREAK5["choices"][2]["ends"] = True
LIU_BREAK5["cast"] = [{"id": "liubei"}]
LIU_BREAK5["art"] = {"scene": "hall", "layers": [], "illus": "g_cold"}

CAMP_MOVES = [
    mv("liu_threat", "liubei", T("当面威胁陛下（刘备）、说想杀他", "threatens His Majesty (Liu Bei) to his face / says they want to kill him"),
       T("这句话说出口，帐里的人都愣住了。", "When the words are out, everyone in the tent goes still."),
       [rel("liubei", "trust", -2), add("renown.rash", 2)],
       match=KILL_YOU, labels=["threat"], goto="x_liu_break5", resume=True),
]

READS = {   # 说过的话，后面有人记得
    "c6_liubei": [P(T("陛下看着溪水，忽然说：『阆中那天你说的话，朕记着。朕不怪你。朕只是想，三弟要是听见了……』他没有说完。", "His Majesty watches the stream and suddenly says, 'What you said the day the news came from Langzhong—I remember it. I don't blame you. I only think, if Third Brother had heard it…' He doesn't finish."), F("flag.v5_blamed_fei")),
                  P(T("他把脚从水里抬起来，又放回去：『你上回提起夫人。朕后来做了个梦，梦见她在江边……』他笑了笑，『不说了。』", "He lifts his feet from the water and puts them back. 'You mentioned my wife the other day. Afterwards I dreamed of her by the river…' He smiles. 'Never mind.'"), F("flag.v5_asked_sun"))],
}

def extend(N, VARS):
    for k, lab in FLAGS.items(): VARS[k] = _flag(lab)
    byid = {n["id"]: n for n in N}
    for nid, ms in NODE_MOVES.items(): byid[nid]["moves"] = ms
    for nid, ps in READS.items(): byid[nid]["intro"] = list(byid[nid]["intro"]) + ps
    N.append(LIU_BREAK5)
    return CAMP_MOVES
