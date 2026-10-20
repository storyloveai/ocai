"""卷二的人物：沿用卷一的五人，新增周瑜、鲁肃、赵云、孙夫人、庞统、张松。
新人物统一用三根轴里的若干根：交情（warmth）、信任（trust）、看重（esteem）。见 docs/全书规划.md。
外貌依据原著描写；性格依据原著行事，台词都是我们自己写的。"""
from lib import T

NEW_CHARS = {
    "zhouyu": {"name": T("周瑜", "Zhou Yu"), "dims": {"esteem": [2, 0, 10], "trust": [1, 0, 10]}, "main": "esteem"},
    "lusu": {"name": T("鲁肃", "Lu Su"), "dims": {"trust": [3, 0, 10]}, "main": "trust"},
    "zhaoyun": {"name": T("赵云", "Zhao Yun"), "dims": {"trust": [3, 0, 10], "warmth": [2, 0, 10]}, "main": "trust"},
    "sunfuren": {"name": T("孙夫人", "Lady Sun"), "dims": {"warmth": [0, 0, 10], "trust": [1, 0, 10]}, "main": "warmth", "from_chapter": "c3"},
    "pangtong": {"name": T("庞统", "Pang Tong"), "dims": {"warmth": [1, 0, 10], "esteem": [1, 0, 10]}, "main": "esteem"},
    "zhangsong": {"name": T("张松", "Zhang Song"), "dims": {"esteem": [0, 0, 10]}, "main": "esteem", "from_chapter": "c5"},
}
NEW_DIMS = {"esteem": T("看重", "Esteem"), "warmth": T("交情", "Friendship")}

PERSONA = {
    "zhouyu": T("周瑜：东吴大都督，三十出头，赤壁的主帅；风流倜傥、精通音律，自负而好胜，最在意的是被诸葛亮压过一头。称玩家“子衡”。",
                "Zhou Yu: Grand Commander of Wu, early thirties, victor of Red Cliffs; elegant, musical, proud and competitive, stung above all by being outdone by Zhuge Liang. Calls the player Ziheng."),
    "lusu": T("鲁肃：东吴重臣，忠厚、稳重，一心维系孙刘联盟，常被夹在周瑜和诸葛亮中间；说话诚恳，偶尔叫苦。称玩家“子衡”。",
              "Lu Su: senior minister of Wu, honest and steady, devoted to keeping the Sun–Liu alliance alive, forever caught between Zhou Yu and Zhuge Liang; earnest, sometimes exasperated. Calls the player Ziheng."),
    "zhaoyun": T("赵云：刘备帐下大将，长坂坡单骑救主；沉稳、谨慎、守礼，话不多，做事一丝不苟。称玩家“子衡先生”。",
                 "Zhao Yun: Liu Bei's general who rode alone through Changban to save the heir; calm, careful, correct, says little and does everything properly. Calls the player Master Ziheng."),
    "sunfuren": T("孙夫人：孙权之妹，嫁给刘备；性情刚烈、好武，房中摆满兵器，侍婢都佩刀；骄傲，最恨被人当作棋子。成年人。称玩家“子衡”。",
                  "Lady Sun: Sun Quan's sister, married to Liu Bei; fierce and martial, her rooms full of weapons and her maids armed; proud, and hates being treated as a pawn. An adult. Calls the player Ziheng."),
    "pangtong": T("庞统：道号凤雏，与诸葛亮齐名；相貌古怪，放旷不羁，好酒，嘴上刻薄，心里比谁都急着建功。称玩家“子衡”。",
                  "Pang Tong, the Young Phoenix, as famous as Zhuge Liang; odd-looking, unconventional, fond of wine, sharp-tongued, and more eager than anyone to prove himself. Calls the player Ziheng."),
    "zhangsong": T("张松：益州别驾，相貌丑陋、身材矮小，却过目不忘、口才极好；自尊心极强，最记恨被人轻视。称玩家“子衡先生”。",
                   "Zhang Song: Lieutenant of Yi province; ugly and tiny, with a perfect memory and a quick tongue; fiercely proud, and never forgets a slight. Calls the player Master Ziheng."),
}

def _r(love, insult, praise, ask, small, threat, nonsense):
    return {"love": love, "insult": insult, "praise": praise, "ask": ask, "small": small, "threat": threat, "nonsense": nonsense}

REACT = {
  "zhouyu": _r(
    [T("周瑜挑了挑眉，笑了：『子衡这话，该对小乔说才是。』", "Zhou Yu raises an eyebrow and laughs. 'Save that for my wife, Ziheng.'"),
     T("『又来？』他按住琴弦，『你们刘家的人，说话都这么不着边际？』", "'Again?' He stills the strings. 'Do all of Liu Bei's people talk such nonsense?'")],
    [T("周瑜的手停在剑柄上：『你再说一句。』", "Zhou Yu's hand stops on his sword hilt. 'Say one more word.'"),
     T("『看在子敬的面上，我不与你计较。』他的脸色已经白了。", "'For Zijing's sake, I'll let that pass.' His face has gone pale.")],
    [T("『过奖。』他嘴上谦，眼里却亮了。", "'Too kind.' Modest words, bright eyes."),
     T("『这话，你在孔明面前也敢说？』他笑着问。", "'Would you dare say that in front of Kongming?' he asks, smiling.")],
    [T("周瑜反问：『你家军师怎么说？』", "Zhou Yu answers with a question. 'What does your strategist say?'"),
     T("『这是东吴的事。』他淡淡地说，『子衡不必操心。』", "'That's Wu's business,' he says coolly. 'No need to trouble yourself.'")],
    [T("周瑜随手拨了一下琴弦，没有说话。", "Zhou Yu idly plucks a string and says nothing."),
     T("『江上风大。』他说。", "'The wind is strong on the river,' he says."),
     T("他望着北岸，好一会儿才回过神来。", "He gazes at the north bank for a long moment before turning back.")],
    [T("周瑜霍地站起，剑已出鞘半尺：『在我的营里说这种话？』", "Zhou Yu is on his feet, his sword half a foot out of its sheath. 'You say that in my camp?'"),
     T("帐外的甲士已经掀开了帘子。", "The guards outside have already pulled back the tent flap.")],
    [T("『有意思。』周瑜看着你，『孔明身边的人，都这样说话？』", "'Interesting.' Zhou Yu studies you. 'Does everyone around Kongming talk like this?'"),
     T("他摇摇头，接着看他的地图。", "He shakes his head and goes back to his map.")]),
  "lusu": _r(
    [T("鲁肃愣住，随即连连摆手：『子衡，子衡，这话可不能乱说！』", "Lu Su freezes, then waves his hands. 'Ziheng, Ziheng, you can't go around saying that!'"),
     T("『你们刘家的人啊……』他叹了口气，倒也没生气。", "'You Liu people…' He sighs, but isn't angry.")],
    [T("鲁肃的脸红了：『肃一片好心，先生何必如此？』", "Lu Su flushes. 'I mean well, sir. Why talk to me like that?'"),
     T("他闷闷地喝了一口茶，不再说话。", "He takes a sullen sip of tea and stops talking.")],
    [T("『不敢当，不敢当。』鲁肃笑得很老实。", "'Not at all, not at all.' Lu Su's smile is plain and honest."),
     T("『先生要是在吴侯面前也这么说就好了。』", "'If only you'd say that in front of the Marquis.'")],
    [T("鲁肃想了想：『这件事，肃也做不得主。』", "Lu Su thinks it over. 'That isn't mine to decide.'"),
     T("『先生问到点子上了。』他苦笑，『肃也想知道。』", "'You've put your finger on it.' He smiles ruefully. 'I'd like to know too.'")],
    [T("鲁肃点点头，又叹了口气。", "Lu Su nods, then sighs again."),
     T("『荆州的事，难办啊。』他自言自语。", "'This Jingzhou business,' he mutters. 'It's hard.'"),
     T("他给你添了茶。", "He tops up your tea.")],
    [T("鲁肃脸色发白：『先生……这是要两家翻脸吗？』", "Lu Su goes pale. 'Sir… do you want our two houses at war?'"),
     T("他站起身，一句话也没说就走了。", "He stands and leaves without a word.")],
    [T("鲁肃眨了眨眼，似乎在想这是不是什么暗语。", "Lu Su blinks, apparently wondering whether it's some kind of code."),
     T("『先生累了。』他宽厚地说。", "'You're tired, sir,' he says kindly.")]),
  "zhaoyun": _r(
    [T("赵云的脸一下子红了，抱拳道：『先生说笑了。』", "Zhao Yun turns red and clasps his hands. 'You jest, sir.'"),
     T("『子衡先生，』他认真地说，『这种话，不该对子龙说。』", "'Master Ziheng,' he says gravely, 'that isn't something to say to me.'")],
    [T("赵云的眉头动了一下，没有回嘴。", "Zhao Yun's brows twitch, but he doesn't answer back."),
     T("『先生若对子龙不满，请直说是哪件事。』", "'If you have a complaint against me, sir, tell me what it is.'")],
    [T("『分内之事。』赵云说。", "'Only my duty,' says Zhao Yun."),
     T("他抱了抱拳，没有多说。", "He clasps his hands and says no more.")],
    [T("赵云想了想：『这要看主公的意思。』", "Zhao Yun considers. 'That depends on our lord.'"),
     T("『子龙只管打仗，这些事，先生比我懂。』", "'I only fight. You understand these things better than I do, sir.'")],
    [T("赵云在擦枪，嗯了一声。", "Zhao Yun is cleaning his spear. He grunts."),
     T("『明日卯时出发。』他提醒你。", "'We leave at dawn,' he reminds you."),
     T("他给马添了一把草料。", "He gives his horse another handful of feed.")],
    [T("赵云握住了枪杆，看着你，一动不动。", "Zhao Yun's hand closes on his spear. He looks at you and doesn't move."),
     T("『先生喝多了。子龙送你回去。』", "'You've had too much, sir. Let me see you back.'")],
    [T("赵云困惑地看着你。", "Zhao Yun looks at you, puzzled."),
     T("『先生说的，子龙听不懂。』", "'I don't follow you, sir.'")]),
  "sunfuren": _r(
    [T("孙夫人的刀尖抬了起来：『你知道我是谁的夫人？』", "Lady Sun's blade lifts. 'Do you know whose wife I am?'"),
     T("『再说一遍，』她冷冷地说，『我就让侍婢把你扔出去。』", "'Say it again,' she says coldly, 'and my maids will throw you out.'")],
    [T("孙夫人笑了，笑得很冷：『好大的胆子。』", "Lady Sun laughs, very coldly. 'You have nerve.'"),
     T("她拔出了腰间的短刀，放在案上。", "She draws the short blade at her waist and lays it on the table.")],
    [T("『少拿好话哄我。』她嘴上这么说，神色却缓了。", "'Don't flatter me.' But her face softens."),
     T("『你们荆州人，就这句话说得像样。』", "'That's the first decent thing anyone from Jingzhou has said.'")],
    [T("孙夫人反问：『你为什么想知道？』", "Lady Sun asks back. 'Why do you want to know?'"),
     T("『这是我的事。』她说。", "'That's my business,' she says.")],
    [T("孙夫人在擦一把弓，没理你。", "Lady Sun is polishing a bow and ignores you."),
     T("『江东的弓，比荆州的好。』她说。", "'Wu bows are better than Jingzhou bows,' she says."),
     T("侍婢们佩着刀，站在她身后。", "Her maids stand behind her, swords at their hips.")],
    [T("孙夫人一扬手，侍婢的刀已经出鞘：『在我面前说这种话？』", "Lady Sun raises a hand and her maids' swords are out. 'You dare, in front of me?'"),
     T("『滚出去。』", "'Get out.'")],
    [T("孙夫人皱眉：『你是来说书的？』", "Lady Sun frowns. 'Are you a storyteller now?'"),
     T("她挥了挥手，让侍婢送客。", "She waves for her maids to see you out.")]),
  "pangtong": _r(
    [T("庞统大笑，笑得酒都洒了：『好！这句我记下了，等我死了刻在碑上。』", "Pang Tong roars with laughter and spills his wine. 'Good! I'll have that carved on my tombstone.'"),
     T("『子衡，你醉了，还是我醉了？』", "'Ziheng, are you drunk, or am I?'")],
    [T("庞统眯起眼：『骂得好，再骂一句我听听。』", "Pang Tong narrows his eyes. 'Nicely said. Go on, give me another.'"),
     T("『我这张脸挨骂惯了。』他慢慢地说，『可我不惯被自己人骂。』", "'This face is used to insults,' he says slowly. 'But not from my own side.'")],
    [T("『夸我的人少，你算一个。』他给你满上。", "'Few people praise me. You're one.' He fills your cup."),
     T("庞统摸着下巴：『这话，你该当着孔明说。』", "Pang Tong strokes his chin. 'You should say that in front of Kongming.'")],
    [T("庞统反问：『你自己怎么看？』", "Pang Tong asks back. 'What do you think?'"),
     T("『问得好，』他说，『可惜我也不知道。』", "'Good question,' he says. 'Pity I don't know either.'")],
    [T("庞统往嘴里倒了一口酒。", "Pang Tong tips back a mouthful of wine."),
     T("『西川的酒，听说比荆州的好。』他说。", "'They say the wine in the west is better than Jingzhou's,' he says."),
     T("他望着灯花，不知在想什么。", "He watches the lamp, thinking about something.")],
    [T("庞统一点也不怕：『要动手就快些，我还要喝酒。』", "Pang Tong isn't the least afraid. 'If you're going to do it, be quick. I want my wine.'"),
     T("他把酒囊收了起来：『今夜到此为止。』", "He puts the wine skin away. 'That's enough for tonight.'")],
    [T("庞统哈哈一笑：『这话比我的长相还古怪。』", "Pang Tong laughs. 'That's even stranger than my face.'"),
     T("『你这是在打什么哑谜？』", "'What riddle is this?'")]),
  "zhangsong": _r(
    [T("张松瞪着你，过了好一会儿才说：『先生……这是在取笑松？』", "Zhang Song stares at you a long time. 'Sir… are you making fun of me?'"),
     T("『松长成这样，还没人对我说过这种话。』他冷笑。", "'Looking the way I do, no one's ever said that to me.' He sneers.")],
    [T("张松的脸一下子沉了：『曹操也这么看我。你们刘家，和曹家一样？』", "Zhang Song's face falls. 'Cao Cao looked at me like that too. Is Liu Bei's house no different?'"),
     T("他站起身，袖子一甩。", "He stands and flicks his sleeve.")],
    [T("『先生过誉。』张松的嘴角翘了起来。", "'You praise me too much, sir.' The corners of his mouth turn up."),
     T("『这话，比曹操那里的好听多了。』", "'Much nicer than what I heard at Cao Cao's court.'")],
    [T("张松想了想：『先生想知道西川的什么？』", "Zhang Song thinks. 'What do you want to know about the west, sir?'"),
     T("『这个，松一时说不清。』他打了个哈哈。", "'I couldn't say offhand.' He laughs it off.")],
    [T("张松打量着屋里的陈设，没有说话。", "Zhang Song looks over the furnishings and says nothing."),
     T("『荆州的茶不错。』他说。", "'The tea in Jingzhou is good,' he says."),
     T("他从袖子里摸了摸什么，又放了回去。", "He feels for something in his sleeve, then lets it be.")],
    [T("张松吓得往后一缩，随即又挺直了腰：『松虽矮小，不怕死。』", "Zhang Song flinches, then straightens. 'I may be small, but I'm not afraid to die.'"),
     T("『原来刘皇叔的人是这样待客的。』", "'So this is how Lord Liu's people treat a guest.'")],
    [T("张松眨眨眼：『先生是在考松？』", "Zhang Song blinks. 'Is this a test, sir?'"),
     T("他认真地想了半天，最后摇了摇头。", "He thinks hard about it, then shakes his head.")]),
}

OPENERS = {
    "zhaoyun": {"warm": T("赵云起身让座：『先生来了。』", "Zhao Yun rises and offers you a seat. 'Sir.'"), "cold": T("赵云抬头看了你一眼，手里的枪没放下。", "Zhao Yun glances up and doesn't put down his spear."), "neutral": T("赵云点点头，往火堆里添了一根柴。", "Zhao Yun nods and adds a stick to the fire.")},
    "pangtong": {"warm": T("庞统举起酒囊：『来得正好，一个人喝没意思。』", "Pang Tong raises a wine skin. 'Just in time. Drinking alone is dull.'"), "cold": T("庞统没抬头：『有事说事。』", "Pang Tong doesn't look up. 'Say what you came to say.'"), "neutral": T("庞统朝对面的席位努了努嘴。", "Pang Tong jerks his chin at the seat opposite.")},
}

HEAT = {
    "zhouyu": {"rude": [1], "threat": [2], "nonsense": [0, 1], "romantic": [0, 1], "line": 2},
    "lusu": {"rude": [1], "threat": [2], "line": 4},
    "zhaoyun": {"rude": [1], "threat": [2], "romantic": [0, 1], "line": 3},
    "sunfuren": {"rude": [1], "threat": [2], "romantic": [1], "nonsense": [0, 1], "line": 2},
    "pangtong": {"rude": [0, 1], "threat": [1], "line": 4},
    "zhangsong": {"rude": [2], "threat": [2], "nonsense": [0, 1], "line": 2},
}

PORTRAIT_PROMPTS = {
    "zhouyu": T("东吴大都督，三十出头，面容俊秀，戴小冠，红色袍服；神情自负。表情：平静、微笑、冷淡、哀伤、吃惊、羞赧。", "Grand Commander of Wu, early thirties, handsome, small cap, red robes, proud bearing. Moods: neutral, warm, cold, sad, surprised, shy."),
    "lusu": T("东吴重臣，中年，短须，忠厚，赭色袍服。", "Senior minister of Wu, middle-aged, short beard, honest face, ochre robes."),
    "zhaoyun": T("身长八尺，浓眉大眼，阔面重颐（第7回）；银白盔甲，盔顶白缨。", "Eight feet tall, thick brows, large eyes, broad face and full jaw (ch. 7); silver-white armour, white plume."),
    "sunfuren": T("孙权之妹，成年女子，发髻插金簪红花，红色衣裳，神情刚烈。", "Sun Quan's sister, an adult woman, hair in a bun with a gold pin and red flowers, red clothes, fierce expression."),
    "pangtong": T("浓眉掀鼻，黑面短髯，形容古怪（第57回）；褐色头巾。", "Thick brows, upturned nose, dark face, short beard, odd-looking (ch. 57); brown head scarf."),
    "zhangsong": T("额镢头尖，鼻偃齿露，身短不满五尺（第60回）；尖顶小帽。", "Pointed head, flat nose, protruding teeth, under five feet tall (ch. 60); small pointed cap."),
}
