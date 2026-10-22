"""卷三的新人物：法正、黄忠。关系仍用统一的三根轴：交情（warmth）、信任（trust）、看重（esteem）。
外貌依据原著描写；性格依据原著行事，台词都是我们自己写的。"""
from lib import T

NEW_CHARS = {
    "fazheng": {"name": T("法正", "Fa Zheng"), "dims": {"warmth": [1, 0, 10], "trust": [1, 0, 10], "esteem": [1, 0, 10]}, "main": "esteem"},
    "huangzhong": {"name": T("黄忠", "Huang Zhong"), "dims": {"warmth": [2, 0, 10], "trust": [2, 0, 10], "esteem": [1, 0, 10]}, "main": "esteem", "from_chapter": "c3"},
}

PERSONA = {
    "fazheng": T("法正：字孝直，刘备入川的内应，如今是刘备最倚重的谋主之一；料事极准，用兵奇险，恩怨分明，别人欠他的、他欠别人的，都记得清清楚楚。称玩家“子衡”。",
                 "Fa Zheng (Xiaozhi): Liu Bei's man inside Yi during the move west, now one of his most trusted planners; uncannily accurate, daring in war, and exact about debts—every kindness and every slight, given or received, he remembers. Calls the player Ziheng."),
    "huangzhong": T("黄忠：字汉升，年近七十的老将，长沙归降，开得二石之弓；最恨别人说他老，越激越勇，说话直、嗓门大、爱笑。称玩家“子衡先生”。",
                    "Huang Zhong (Hansheng): a general near seventy who came over at Changsha and draws a bow few young men can; hates being called old and fights harder the more he's goaded; blunt, loud, quick to laugh. Calls the player Master Ziheng."),
}

def _r(love, insult, praise, ask, small, threat, nonsense):
    return {"love": love, "insult": insult, "praise": praise, "ask": ask, "small": small, "threat": threat, "nonsense": nonsense}

REACT = {
  "fazheng": _r(
    [T("法正看了你一眼：『子衡，这种话，留着说给该说的人。』", "Fa Zheng gives you a look. 'Ziheng, save that for someone it's meant for.'"),
     T("『我记性好，』他淡淡地说，『这句我也会记着。』", "'I have a good memory,' he says coolly. 'I'll remember this one too.'")],
    [T("法正没有生气，只是把你的话一个字一个字地重复了一遍。", "Fa Zheng doesn't get angry. He just repeats what you said, word for word."),
     T("『好。』他说，『孝直记下了。』", "'Fine,' he says. 'Xiaozhi has noted it.'")],
    [T("『过奖。』法正嘴上客气，眼里却很受用。", "'Too kind.' Polite words; he's pleased all the same."),
     T("『这话，主公面前说一遍更好。』他笑道。", "'Even better if you said it in front of our lord,' he says, smiling.")],
    [T("法正反问：『你想知道的，是事，还是我怎么看这件事？』", "Fa Zheng asks back. 'Do you want the facts, or what I make of them?'"),
     T("『这个，』他用指头敲了敲地图，『要看曹操那边先动哪一步。』", "'That,' he taps the map, 'depends on which piece Cao Cao moves first.'")],
    [T("法正在看地图，嗯了一声。", "Fa Zheng is studying the map. He grunts."),
     T("『汉中的山，比成都的冷。』他说。", "'The mountains at Hanzhong are colder than Chengdu's,' he says."),
     T("他把一面小旗插到地图上，又拔了出来。", "He sticks a little flag into the map, then pulls it out again.")],
    [T("法正抬起眼：『在军中说这种话，你知道是什么罪？』", "Fa Zheng looks up. 'You know what the penalty is for saying that in camp?'"),
     T("他没有叫人，只是把你的话写在了一片竹简上。", "He calls no one. He just writes your words down on a bamboo slip.")],
    [T("法正打量着你，像在算一笔账。", "Fa Zheng sizes you up, as if working out a sum."),
     T("『有意思。』他说完，又低头看地图了。", "'Interesting,' he says, and goes back to his map.")]),
  "huangzhong": _r(
    [T("黄忠哈哈大笑，胡子都抖了起来：『先生拿老夫寻开心！』", "Huang Zhong roars with laughter, his beard shaking. 'You're having fun with an old man, sir!'"),
     T("『这种话，』他摆摆手，『说给年轻人听去。』", "'Say that sort of thing,' he waves a hand, 'to the young ones.'")],
    [T("黄忠把弓往地上一顿：『你说谁老？』", "Huang Zhong plants his bow on the ground. 'Who are you calling old?'"),
     T("『老夫这口刀，还没卷刃！』他瞪着你。", "'This old blade hasn't lost its edge yet!' He glares at you.")],
    [T("黄忠笑得合不拢嘴：『先生有眼光！』", "Huang Zhong can't stop grinning. 'You've got an eye, sir!'"),
     T("『这话，你去跟关将军说一遍。』他得意地说。", "'Go say that to General Guan,' he says, pleased with himself.")],
    [T("黄忠挠挠头：『这个……你问军师去。老夫只管砍人。』", "Huang Zhong scratches his head. 'That… ask the strategist. I just do the cutting.'"),
     T("『打仗的事问我，』他拍着胸口，『别的，老夫不懂。』", "'Ask me about fighting,' he thumps his chest. 'The rest, I don't know.'")],
    [T("黄忠在磨刀，嘴里哼着长沙的小调。", "Huang Zhong is sharpening his blade, humming a Changsha tune."),
     T("『今晚的饭，硬了些。』他说。", "'Tonight's rice was a bit hard,' he says."),
     T("他拉了拉弓弦，听那一声响。", "He plucks his bowstring and listens to it sing.")],
    [T("黄忠的刀已经横了过来：『你再说一遍？』", "Huang Zhong's blade is already across his knees. 'Say that again?'"),
     T("『老夫杀过的人，比你见过的还多。』", "'I've killed more men than you've ever met.'")],
    [T("黄忠眯起眼看你：『先生喝多了吧？』", "Huang Zhong squints at you. 'Had a few too many, sir?'"),
     T("『听不懂，』他老实地说，『你说慢点。』", "'I don't follow,' he says honestly. 'Say it slower.'")]),
}

OPENERS = {
    "fazheng": {"warm": T("法正把地图推到一边：『来得正好，我正想找个人说说话。』", "Fa Zheng pushes the map aside. 'Good timing. I wanted someone to talk to.'"),
                "cold": T("法正没抬头：『有事？』", "Fa Zheng doesn't look up. 'Yes?'"),
                "neutral": T("法正朝对面的席位点了点头。", "Fa Zheng nods at the seat across from him.")},
    "huangzhong": {"warm": T("黄忠拍着身边的空地：『先生坐！喝一口长沙的酒！』", "Huang Zhong slaps the ground beside him. 'Sit, sir! Have some Changsha wine!'"),
                   "cold": T("黄忠擦着刀，只抬了抬眼皮。", "Huang Zhong keeps polishing his blade and barely lifts his eyes."),
                   "neutral": T("黄忠往火里添了一根柴：『坐。』", "Huang Zhong puts another branch on the fire. 'Sit.'")},
}

HEAT = {
    "fazheng": {"rude": [1], "threat": [2], "nonsense": [0, 1], "line": 3},
    "huangzhong": {"rude": [1], "threat": [1], "nonsense": [0, 0, 1], "line": 3},
}

PORTRAIT_PROMPTS = {
    "fazheng": T("四十岁上下的谋士，面容清瘦，目光锐利，留短须，黑色纶巾，深青色袍服；神情冷静，似笑非笑。", "A strategist around forty, lean face, sharp eyes, short beard, black silk cap, dark teal robes; calm, a half smile."),
    "huangzhong": T("年近七十的老将，白发白须，精神矍铄，身材魁梧，金色铠甲，背负大弓，手持大刀；笑容豪爽。", "A general nearly seventy, white hair and beard, vigorous and broad-shouldered, golden armour, a great bow on his back and a broadsword; a hearty grin."),
}
