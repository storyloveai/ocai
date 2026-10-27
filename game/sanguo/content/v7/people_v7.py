"""卷七的新人物：姜维、司马懿、魏延。关系仍用统一的三根轴：交情（warmth）、信任（trust）、看重（esteem）。
外貌依据原著描写（魏延见第53回）；性格依据原著行事，台词都是我们自己写的。"""
from lib import T

NEW_CHARS = {
    "jiangwei": {"name": T("姜维", "Jiang Wei"), "dims": {"warmth": [1, 0, 10], "trust": [1, 0, 10], "esteem": [1, 0, 10]}, "main": "trust", "from_chapter": "c2"},
    "simayi": {"name": T("司马懿", "Sima Yi"), "dims": {"warmth": [0, 0, 10], "trust": [0, 0, 10], "esteem": [1, 0, 10]}, "main": "esteem", "from_chapter": "c4"},
    "weiyan": {"name": T("魏延", "Wei Yan"), "dims": {"warmth": [1, 0, 10], "trust": [1, 0, 10], "esteem": [1, 0, 10]}, "main": "trust"},
}

PERSONA = {
    "jiangwei": T("姜维：字伯约，天水冀县人，二十七岁归蜀，孝顺母亲，文武双全；对丞相敬若父师，对你像对一位前辈，问的多、说的少，认准了的事不回头。称玩家“子衡先生”。",
                  "Jiang Wei (Boyue): from Ji in Tianshui, came over to Shu at twenty-seven; devoted to his mother, skilled with both brush and spear; he reveres the Chancellor as father and teacher, and treats you as an elder—asks much, says little, and never turns back once he's decided. Calls the player Master Ziheng."),
    "simayi": T("司马懿：字仲达，魏国大都督，五十上下；极能忍，宁可被人送女人衣裳也不出战；说话客气，句句是在试探。称玩家“子衡先生”。",
                "Sima Yi (Zhongda): grand commander of Wei, about fifty; endlessly patient—he'll accept a gift of women's clothes rather than come out to fight; courteous in speech, every sentence a probe. Calls the player Master Ziheng."),
    "weiyan": T("魏延：字文长，蜀中大将，勇猛，自负，看不起文官，尤其看不起长史杨仪；总想带一支兵走子午谷直取长安，丞相一直不许。称玩家“先生”。",
                "Wei Yan (Wenchang): a great general of Shu, brave and arrogant, scornful of civil officials—above all the chief clerk Yang Yi; he keeps asking for one column to go by Ziwu Valley straight at Chang'an, and the Chancellor keeps refusing. Calls the player Master."),
}

def _r(love, insult, praise, ask, small, threat, nonsense):
    return {"love": love, "insult": insult, "praise": praise, "ask": ask, "small": small, "threat": threat, "nonsense": nonsense}

REACT = {
  "jiangwei": _r(
    [T("姜维红了脸：『先生说笑了。』", "Jiang Wei flushes. 'You're joking, Master.'"), T("『伯约不敢当。』他低头行了一礼。", "'I don't deserve that,' he says, and bows his head.")],
    [T("姜维的手按上了枪杆，又松开了：『先生是长辈，伯约不还口。』", "Jiang Wei's hand goes to his spear, then lets go. 'You're my elder, Master. I won't answer back.'"), T("他沉默了很久，只说：『伯约记下了。』", "He's silent a long time, then says only, 'I'll remember that.'")],
    [T("『是丞相教得好。』姜维说，眼睛却亮了。", "'It's the Chancellor's teaching,' Jiang Wei says, but his eyes light up."), T("姜维笑了，笑得像个少年。", "Jiang Wei smiles, like the boy he was not long ago.")],
    [T("姜维想了想，认真地答：『伯约以为……』他一条一条地说给你听。", "Jiang Wei thinks, then answers in earnest: 'I'd say…' and lays it out for you point by point."), T("『这个，伯约也想问丞相。』", "'That's something I want to ask the Chancellor too.'")],
    [T("姜维在灯下抄兵书，一笔一画。", "Jiang Wei is copying a book of war by the lamp, stroke by stroke."), T("『天水这会儿，该下雪了。』他说。", "'It'll be snowing in Tianshui about now,' he says."), T("他擦了擦枪头，又看了一眼北边。", "He wipes his spearhead and glances north again.")],
    [T("姜维站了起来：『先生，这话不该在营里说。』", "Jiang Wei gets to his feet. 'Master, that shouldn't be said in camp.'"), T("他挡在你和帐门之间，一句话也没说。", "He stands between you and the tent flap without a word.")],
    [T("姜维愣了一下：『先生……是在考伯约？』", "Jiang Wei blinks. 'Master… are you testing me?'"), T("他认真地想了半天，还是摇了摇头。", "He thinks about it seriously for a long while, then shakes his head.")]),
  "simayi": _r(
    [T("司马懿笑了：『先生这话，懿只当没听见。』", "Sima Yi smiles. 'I'll pretend I didn't hear that, Master.'"), T("『诸葛孔明身边的人，也会说这种话？』", "'One of Zhuge Kongming's men, talking like that?'")],
    [T("司马懿一点也不恼：『骂得好。懿记住先生了。』", "Sima Yi isn't the least put out. 'Well cursed. I'll remember you, Master.'"), T("他慢慢地端起茶：『蜀中的人，火气都大。』", "He raises his tea slowly. 'Men from Shu all have such tempers.'")],
    [T("司马懿摆手：『不敢。懿不过是个守城的。』", "Sima Yi waves it off. 'Not at all. I'm only a man who holds walls.'"), T("『先生过誉。』他眼睛里一点笑意也没有。", "'Too kind, Master.' There's no smile at all in his eyes.")],
    [T("司马懿反问：『先生问这个，是替自己问，还是替孔明问？』", "Sima Yi answers with a question. 'Are you asking for yourself, Master, or for Kongming?'"), T("『这个嘛，』他慢慢地说，『要看天时。』", "'Well,' he says slowly, 'that depends on the season.'")],
    [T("司马懿在看一份军报，看完了，折好，收进袖子里。", "Sima Yi reads a dispatch, folds it neatly, and slips it into his sleeve."), T("『渭水这几天涨了。』他说。", "'The Wei has risen these past few days,' he says."), T("他回头看了一眼，又转了回来。", "He looks back over his shoulder, then turns forward again.")],
    [T("司马懿身后的卫士拔了刀。司马懿抬手：『收起来。先生是使者。』", "The guards behind Sima Yi draw their swords. He lifts a hand. 'Put them away. The Master is an envoy.'"), T("『先生在懿的营里说这话，胆子不小。』", "'You've some nerve, Master, saying that in my camp.'")],
    [T("司马懿眯起眼，打量你很久。", "Sima Yi narrows his eyes and studies you for a long time."), T("『有意思。』他说，『孔明身边，果然都是怪人。』", "'Interesting,' he says. 'Kongming does keep strange company.'")]),
  "weiyan": _r(
    [T("魏延哈哈大笑：『先生是读书读糊涂了！』", "Wei Yan roars with laughter. 'You've read yourself silly, Master!'"), T("『这话，你跟杨仪说去。』他说完，自己先笑了。", "'Say that to Yang Yi,' he says, and laughs first.")],
    [T("魏延一把揪住你的衣领，又松开了：『看在丞相面上。』", "Wei Yan grabs your collar, then lets go. 'For the Chancellor's sake.'"), T("『你们这些文官……』他啐了一口。", "'You civil officials…' He spits.")],
    [T("魏延很受用：『先生有眼光！比杨仪强。』", "Wei Yan laps it up. 'You've got an eye, Master! Better than Yang Yi.'"), T("『这话，丞相要是也这么想就好了。』", "'If only the Chancellor thought so too.'")],
    [T("魏延把地图拍在案上：『问我？子午谷，十天到长安！』", "Wei Yan slaps the map on the table. 'Ask me? Ziwu Valley—ten days to Chang'an!'"), T("『这种事，丞相不问我，你倒来问。』", "'The Chancellor never asks me about such things, and you do.'")],
    [T("魏延在擦刀，嘴里骂着杨仪。", "Wei Yan is polishing his blade, cursing Yang Yi under his breath."), T("『又是守。守到什么时候？』他说。", "'Hold, hold. Hold until when?' he says."), T("他把马鞭甩得啪啪响。", "He cracks his riding whip.")],
    [T("魏延的刀已经出鞘了：『你再说一遍？』", "Wei Yan's blade is already out. 'Say that again?'"), T("『魏某杀过的人，比你写过的字还多。』", "'I've killed more men than you've written characters.'")],
    [T("魏延瞪着你：『先生在说什么？』", "Wei Yan glares at you. 'What are you on about, Master?'"), T("『文官的话，绕得我头疼。』", "'Civil officials' talk gives me a headache.'")]),
}

OPENERS = {
    "jiangwei": {"warm": T("姜维放下笔，站起来：『先生来了。坐。』", "Jiang Wei sets down his brush and stands. 'Master, you're here. Sit.'"),
                 "cold": T("姜维行了个礼，没有说话。", "Jiang Wei bows and says nothing."), "neutral": T("姜维给你让出了位子。", "Jiang Wei makes room for you.")},
    "simayi": {"warm": T("司马懿亲自给你倒茶：『先生远来辛苦。』", "Sima Yi pours you tea himself. 'You've come a long way, Master.'"),
               "cold": T("司马懿没有抬头：『使者请坐。』", "Sima Yi doesn't look up. 'Be seated, envoy.'"), "neutral": T("司马懿朝你点了点头。", "Sima Yi nods to you.")},
    "weiyan": {"warm": T("魏延拍着身边的凳子：『先生，坐！喝酒！』", "Wei Yan slaps the stool beside him. 'Sit, Master! Drink!'"),
               "cold": T("魏延看了你一眼：『丞相派你来的？』", "Wei Yan glances at you. 'The Chancellor send you?'"), "neutral": T("魏延哼了一声，算是打了招呼。", "Wei Yan grunts by way of greeting.")},
}

HEAT = {
    "jiangwei": {"rude": [0, 1], "threat": [1], "nonsense": [0], "line": 3},
    "simayi": {"rude": [0], "threat": [1], "nonsense": [0], "line": 4},
    "weiyan": {"rude": [2], "threat": [3], "nonsense": [1], "line": 3},
}

VALUES = {
    "jiangwei": {"yi": ["trust", 1], "zhi": ["esteem", 1], "ren": ["warmth", 1], "li": ["trust", -1]},
    "simayi": {"zhi": ["esteem", 1], "li": ["esteem", 1], "yong": ["esteem", -1]},
    "weiyan": {"yong": ["esteem", 1], "yi": ["trust", 1], "zhi": ["esteem", -1]},
}

PORTRAIT_PROMPTS = {
    "jiangwei": T("二十七岁上下的少年将军，相貌端正，眼神清亮，不留须，银蓝色盔甲罩青灰袍，文武兼备的书卷气。", "A young general of about 27, handsome and earnest, clear bright eyes, clean-shaven, silver-blue helmet and armour over a blue-grey robe; a scholar who also fights."),
    "simayi": T("五十岁上下，长脸，眼深而细，似回头张望，细长须，黑色高冠，深青色魏国朝服；隐忍、谨慎、难以看透。", "Around fifty, long narrow face, deep-set watchful eyes, thin long beard, tall black hat, dark navy Wei robes; patient, cautious, unreadable."),
    "weiyan": T("身长九尺，面如重枣，目若朗星，短黑须（不是长须），浓眉，钢盔、暗红铠甲；骄傲、勇猛、坐不住。要和关羽明显不同。", "Tall, face red as a ripe date, eyes bright as stars, short black beard (not long), thick brows, steel helmet, dark red armour; proud, fierce, restless. Clearly different from Guan Yu."),
}
