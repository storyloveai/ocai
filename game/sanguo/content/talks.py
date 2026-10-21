"""v1.2 additions: night talks (free conversation with rule-backed topics), crises (disfavor / exposure),
extra foresight options and relationship gates. Called from campaign.py before endings are built."""
from lib import *

def R(c, d, op, v): return V(f"rel.{c}.{d}", op, v)

def topic(id, label, reply, effects=(), when=None, req=None, hint=None, echo=(), foresight=False, intent=None):
    d = {"id": id, "label": label, "reply": reply if isinstance(reply, list) else [P(reply)], "effects": list(effects)}
    if when: d["when"] = when
    if req: d["req"] = req
    if hint: d["hint"] = hint
    if echo: d["echo"] = list(echo)
    if foresight: d["foresight"] = True
    if intent: d["intent"] = intent
    return d

def talk_node(id, chapter, title, intro, char, turns, topics, leave_out, when=None, mood=None, order=20):
    n = node(id, chapter, "main", title, "free", T("夜谈", "night talk"), intro,
             [choice("leave", "expression", T("起身告辞。", "Say goodnight and go."), leave_out)], when=when, order=order)
    n["talk"] = {"char": char, "turns": turns, "topics": topics}
    if mood: n["mood"] = mood
    return n

PERSONA = {
    "liubei": T("刘备：汉室宗亲，四十上下，仁厚、能忍，寄人篱下多年；说话温和，常自谦，偶尔流露出不甘。称玩家“子衡”或“先生”。",
                "Liu Bei: a distant imperial kinsman around forty, kind and patient after years of depending on others; speaks gently and modestly, with flashes of frustration. Calls the player Ziheng."),
    "caocao": T("曹操：丞相，雄才大略，多疑而爱才，好诗酒；说话直接、带笑、时而锋利，会反问。称玩家“子衡”。",
                "Cao Cao: the Chancellor, brilliant, suspicious yet fond of talent, loves poetry and wine; direct, amused, sometimes cutting, likes to answer with questions. Calls the player Ziheng."),
    "guanyu": T("关羽：寡言、重义、读《春秋》，对刘备忠诚到底，对外人戒备；句子短，语气庄重，不说笑。称玩家“子衡”。",
                "Guan Yu: taciturn, honor-bound, reads the Spring and Autumn Annals, utterly loyal to Liu Bei and guarded with others; short sentences, grave tone, no jokes. Calls the player Ziheng."),
    "zhuge": T("诸葛亮：二十七岁，刚出山，从容、机敏、谦和而难以看透；喜欢用反问试探人。称玩家“子衡兄”。",
               "Zhuge Liang: twenty-seven, newly joined; composed, quick, courteous and hard to read; tests people with questions. Calls the player Ziheng."),
    "wenzhi": T("温芷：原创人物，颍川医家之女，与玩家同乡，成年；冷静、务实、嘴上不饶人，心里很软；只关心病人，不问来人是哪一边的。称玩家“子衡”。",
                "Wen Zhi: an original character, a physician's daughter from the player's hometown, an adult; calm, practical, sharp-tongued and soft-hearted; cares about patients, not sides. Calls the player Ziheng."),
}

def extend(N, VARS, ECHOES, CHARS):
    for k, p in PERSONA.items(): CHARS[k]["persona"] = p
    for f, lab in {
        "flag.guan_fear": T("听关羽说起他最怕的事", "Heard what Guan Yu fears"),
        "flag.heard_people": T("听刘备说起百姓", "Heard Liu Bei talk about his people"),
        "flag.zhuge_tested": T("用三分天下试探诸葛亮", "Tested Zhuge Liang with the three-way division"),
        "flag.warned_wind": T("提醒曹操提防东南风", "Warned Cao about a southeast wind"),
        "flag.cao_on_guan": T("听曹操说起关羽", "Heard Cao talk about Guan Yu"),
        "flag.confessed": T("江边对温芷说出心意", "Told Wen Zhi how you feel by the river"),
        "flag.exiled": T("卷一中途离开", "Left before the volume ended"),
        "flag.exposed": T("被当作妖人", "Branded a sorcerer"),
        "flag.sidelined": T("被冷落", "Sidelined"),
    }.items():
        VARS[f] = {"type": "flag", "init": False, "label": lab}
    ECHOES.update({
        "e_guan_fear": T("关羽对你说过他最怕负了大哥", "Guan Yu told you he fears failing his brother"),
        "e_people": T("刘备在古城楼上说起百姓", "Liu Bei talked about his people on the Gucheng wall"),
        "e_zhuge_test": T("你用三分天下试探过诸葛亮", "You tested Zhuge Liang with the three-way division"),
        "e_wind": T("你提醒过曹操提防东南风", "You warned Cao about a southeast wind"),
        "e_cao_guan": T("曹操对你说过他留不住关羽", "Cao told you he couldn't keep Guan Yu"),
    })

    # ---------------- night talks ----------------
    N.append(talk_node("c2_campfire", "c2", T("篝火·关羽", "By the Fire: Guan Yu"),
        T("出许都的第一夜，大军扎营。关羽一个人坐在火边擦刀，见你过来，往旁边让了让。",
          "The first night out of Xuchang, the army makes camp. Guan Yu sits alone by a fire, cleaning his blade. When he sees you he moves over to make room."),
        "guanyu", 2, [
            topic("peach", T("问他桃园结义的事。", "Ask him about the oath in the peach garden."),
                  T("『那年春天，三个人，一头黑牛，一匹白马。』他难得笑了，『大哥说，不求同年同月同日生。』", "'One spring. Three men, a black ox, a white horse.' He almost smiles. 'My brother said: we don't ask to be born on the same day.'"),
                  [rel("guanyu", "esteem", 1)]),
            topic("self", T("说说你自己：颍川、读书，为什么投刘备。", "Tell him about yourself: Yingchuan, your studies, why you joined Liu Bei."),
                  T("他听完，点点头：『为一个“仁”字投大哥的，你不是第一个。能留下来的，不多。』", "He listens, then nods. 'You're not the first to follow my brother for his kindness. Not many stay.'"),
                  [rel("guanyu", "esteem", 1)]),
            topic("fear", T("问他：将军也有怕的事吗？", "Ask him: is there anything you're afraid of?"),
                  T("火噼啪响了一声。『怕负了大哥。』他把刀收进鞘里，『别的，不怕。』", "The fire cracks. 'Failing my brother.' He sheathes the blade. 'Nothing else.'"),
                  [setv("flag.guan_fear"), rel("guanyu", "esteem", 1)], req=R("guanyu", "esteem", ">=", 2), hint=T("需要关羽的敬重 ≥ 2", "Needs Guan Yu's respect ≥ 2"), echo=["e_guan_fear"]),
            topic("warn", T("低声说：将来有一天，曹操会待你极厚，到时要记得今晚。", "Say quietly: one day Cao Cao will treat you very well. Remember tonight when he does."),
                  T("关羽皱眉看了你很久：『你这话，像是看见了什么。』他没有再问。", "Guan Yu frowns at you for a long time. 'You talk as if you've seen something.' He doesn't ask further."),
                  [add("uncanny"), rel("guanyu", "esteem", 1), setv("flag.warned_guan")], foresight=True, echo=["e_warn_gifts"]),
        ], T("关羽冲你点了点头。火还旺着。", "Guan Yu nods to you. The fire is still burning high."), when=LIU))

    N.append(talk_node("c4_gucheng", "c4", T("古城夜话·刘备", "Night at Gucheng: Liu Bei"),
        T("古城重聚的那一夜，刘备把你叫到城楼上。三兄弟终于又在一起了，他却没有喝醉。",
          "The night the brothers reunite at Gucheng, Liu Bei calls you up onto the wall. The three of them are together at last, yet he hasn't let himself get drunk."),
        "liubei", 2, [
            topic("bitter", T("问他：这些年一直寄人篱下，不觉得屈吗？", "Ask him: all these years under other men's roofs—doesn't it gall you?"),
                  T("『屈。』他望着城下的火把，『可人在，事就还能做。』", "'It galls me.' He looks down at the torches below. 'But while we're alive, there's still work to do.'"), [rel("liubei", "trust", 1)]),
            topic("people", T("问他：为什么百姓都愿意跟着你走？", "Ask him: why are the common people so willing to follow you?"),
                  T("『我也不知道。』他想了想，『大概是我从没扔下过他们。』", "'I don't know.' He thinks. 'Perhaps because I've never left them behind.'"),
                  [rel("liubei", "trust", 1), setv("flag.heard_people")], echo=["e_people"]),
            topic("south", T("告诉他：往南走，荆州有人在等你。", "Tell him: go south. Someone in Jingzhou is waiting for you."),
                  T("刘备回过头：『谁？』你说不出名字。他拍拍你的肩：『那就等他来找我。』", "Liu Bei turns. 'Who?' You can't give a name. He pats your shoulder. 'Then let him come and find me.'"),
                  [add("uncanny"), rel("liubei", "trust", 1)], foresight=True),
        ], T("刘备在城楼上又站了很久。你先下去了。", "Liu Bei stays on the wall a long time. You go down first."), when=ALL(LIU, NF("flag.with_guanyu"))))

    N.append(talk_node("c5_lamp", "c5", T("灯下·诸葛亮", "By Lamplight: Zhuge Liang"),
        T("诸葛亮出山后的第一个晚上，他提着一盏灯来敲你的门：『听说主公身边，子衡兄跟得最久。』",
          "On his first night in Liu Bei's service, Zhuge Liang knocks on your door with a lamp. 'I hear you've been with our lord longest, Ziheng.'"),
        "zhuge", 2, [
            topic("why", T("问他：为何肯出山？", "Ask him: why did you agree to come?"),
                  T("『三顾，不是三请。』他笑，『一个人肯在雪里站三回，值得赌一赌。』", "'Three visits, not three invitations.' He smiles. 'A man who will stand in the snow three times is worth a wager.'"), [rel("zhuge", "esteem", 1)]),
            topic("test", T("试探他：天下将三分，荆、益可图，对吗？", "Test him: the realm will split in three, and Jing and Yi provinces are there for the taking—right?"),
                  T("诸葛亮手里的扇子停了。『这话，我只在草庐里说过。』他看了你很久，『子衡兄，你从哪里听来的？』", "The fan in Zhuge Liang's hand stops. 'I've said that only in my cottage.' He studies you a long time. 'Where did you hear it, Ziheng?'"),
                  [add("uncanny"), rel("zhuge", "trust", -2), rel("zhuge", "esteem", 1), setv("flag.zhuge_tested")], foresight=True, echo=["e_zhuge_test"]),
            topic("share", T("把你看到的主公说给他听：仁厚，信人，唯独对自己太苛。", "Tell him the lord you know: kind, trusting of others, too hard on himself."),
                  T("他认真记下：『多谢。往后，我们是同僚了。』", "He takes it to heart. 'Thank you. From now on, we are colleagues.'"),
                  [rel("zhuge", "esteem", 1), rel("zhuge", "trust", 1)], req=R("zhuge", "esteem", ">=", 2), hint=T("需要诸葛亮的敬重 ≥ 2", "Needs Zhuge Liang's respect ≥ 2")),
            topic("rival", T("直说：你来之前，我是他最信的人。", "Say it plainly: before you came, I was the one he trusted most."),
                  T("『现在也是。』诸葛亮把灯留给了你，『我只是来帮他打仗的。』", "'You still are.' Zhuge Liang leaves the lamp with you. 'I'm only here to help him fight.'"),
                  [rel("zhuge", "trust", 1)], when=F("flag.aside_zhuge")),
        ], T("灯芯爆了一下。诸葛亮起身告辞。", "The lamp wick sputters. Zhuge Liang rises to take his leave."), when=LIU))

    N.append(talk_node("c5_feast", "c5", T("宴后·曹操", "After the Feast: Cao Cao"),
        T("宴罢，曹操留你在廊下说话。他喝了酒，话比平时多。", "After the feast, Cao Cao keeps you on the veranda to talk. He has been drinking and says more than usual."),
        "caocao", 2, [
            topic("why", T("问他：丞相当年为何留我？", "Ask him: why did you keep me, back then?"),
                  T("『因为你走得了，却没走。』曹操笑，『这样的人，用起来放心，也不放心。』", "'Because you could have left, and didn't.' Cao laughs. 'A man like that is easy to trust—and hard to.'"), [rel("caocao", "esteem", 1)]),
            topic("guan", T("问他：还在想关云长吗？", "Ask him: do you still think about Guan Yunchang?"),
                  T("『想。』他倒了一杯酒，『我留不住的人，记得最清楚。』", "'I do.' He pours a cup. 'The ones I couldn't keep are the ones I remember best.'"),
                  [rel("caocao", "esteem", 1), setv("flag.cao_on_guan")], echo=["e_cao_guan"]),
            topic("poem", T("请他念一首新作的诗。", "Ask him to recite a new poem."),
                  T("他低声吟了两句：『对酒当歌，人生几何。』又摆摆手，『还没写完。』", "He murmurs two lines: 'Facing wine, I sing: how long is a life?' Then waves it off. 'It isn't finished.'"), [rel("caocao", "esteem", 1)]),
            topic("wind", T("劝他：将来南征，切莫轻视东南风。", "Warn him: when you march south, don't dismiss a southeast wind."),
                  T("曹操眯起眼睛：『你也学那些术士？』他不再说话。", "Cao narrows his eyes. 'Now you're imitating the soothsayers?' He says no more."),
                  [add("uncanny"), rel("caocao", "esteem", -1), setv("flag.warned_wind")], foresight=True, echo=["e_wind"]),
        ], T("曹操挥挥手，让你回去歇着。", "Cao waves you off to rest."), when=CAO))

    N.append(talk_node("c8_river", "c8", T("江边·温芷", "By the River: Wen Zhi"),
        T("仗打完了。夜里，温芷在江边洗药杵。你走过去，她没有回头：『我就知道是你，脚步声都一样。』",
          "The fighting is over. At night Wen Zhi is washing a pestle at the river's edge. You walk over; she doesn't turn around. 'I knew it was you. Your footsteps haven't changed.'"),
        "wenzhi", 3, [
            topic("hands", T("看看她手上的伤。", "Look at the burns on her hands."),
                  T("她把手缩回袖子里：『医者的手，烧一回才知道疼。』过了一会儿，又伸出来给你看。", "She pulls her hands into her sleeves. 'A physician should get burned once, to learn what it feels like.' After a while she holds them out for you to see."),
                  [rel("wenzhi", "intimacy", 1)], when=F("flag.wenzhi_with_you")),
            topic("home", T("说起颍川：等打完仗，回去看那棵槐树。", "Talk about home: when the war's over, go back and see the old locust tree."),
                  T("『许都没有槐树，南边也没有。』她笑了，『那就种一棵。』", "'There are no locust trees in Xuchang, or in the south.' She smiles. 'Then we'll plant one.'"), [rel("wenzhi", "intimacy", 1)]),
            topic("future", T("问她：以后想做什么？", "Ask her: what do you want to do, afterwards?"),
                  T("『开一间药铺。不问来的人是哪一边的。』", "'Open an apothecary. And never ask which side the patients are on.'"), [rel("wenzhi", "trust", 1)]),
            topic("confess", T("把一直没说出口的话说出来。", "Say what you've never said."),
                  T("她终于回过头。江上还漂着烧黑的木头。『说了，就收不回去了。』『不收。』", "She finally turns. Charred timbers still drift on the river. 'Once you say it, you can't take it back.' 'I won't.'"),
                  [rel("wenzhi", "intimacy", 2), setv("flag.confessed"), setv("flag.wenzhi_together")], req=R("wenzhi", "intimacy", ">=", 4), hint=T("需要与温芷的亲近 ≥ 4", "Needs closeness with Wen Zhi ≥ 4"), when=NF("flag.wenzhi_together")),
        ], T("她把药杵擦干，收进药箱。『回去吧，江边冷。』", "She dries the pestle and puts it away. 'Go back. It's cold by the river.'"),
        when=ANY(F("flag.wenzhi_with_you"), ALL(CAO, ANY(F("flag.wenzhi_warned"), F("flag.wenzhi_together")))), mood="romance"))

    N.append(talk_node("c8_vigil", "c8", T("帐外·关羽", "Outside the Tent: Guan Yu"),
        T("回营那夜，关羽独自坐在帐外，刀横在膝上。", "The night you return to camp, Guan Yu sits alone outside his tent, the blade across his knees."),
        "guanyu", 2, [
            topic("regret", T("问他：放走曹操，后悔吗？", "Ask him: do you regret letting Cao go?"),
                  T("『不悔。』他看着刀，『可我欠大哥一条命。』", "'No.' He looks at the blade. 'But I owe my brother a life.'"), [rel("guanyu", "esteem", 1)]),
            topic("fear", T("提起那晚的篝火：你说过最怕负了大哥。", "Remind him of the campfire: you said you feared failing your brother."),
                  T("关羽沉默了很久：『今天，我负了吗？』你说没有。他点点头，像是信了。", "Guan Yu is silent a long time. 'Did I fail him today?' You say no. He nods, as if he believes you."),
                  [rel("guanyu", "warmth", 1), rel("guanyu", "esteem", 1)], when=F("flag.guan_fear")),
            topic("sit", T("什么也不说，陪他坐一会儿。", "Say nothing. Just sit with him for a while."),
                  T("风从江上吹过来。天快亮的时候，他说：『多谢。』", "The wind comes off the river. Near dawn he says, 'Thank you.'"), [rel("guanyu", "esteem", 1)]),
        ], T("你回帐时，他还坐在那里。", "When you go back to your tent, he is still sitting there."),
        when=ALL(LIU, NF("flag.wenzhi_with_you"))))

    N.append(talk_node("c8_north", "c8", T("北归·曹操", "The Road North: Cao Cao"),
        T("北归路上，曹操想起郭嘉，放声大哭：『若奉孝在，决不使吾有此大失也！』哭完了，他让你并马而行。",
          "On the road north, Cao Cao remembers Guo Jia and weeps aloud: 'Had Fengxiao lived, I would never have suffered such a loss!' When he is done, he has you ride beside him."),
        "caocao", 2, [
            topic("common", T("劝他：胜败乃兵家常事。", "Tell him: victory and defeat are a soldier's daily bread."),
                  T("『常事？』他冷笑，『八十万人，是常事？』可他的背挺直了些。", "'Daily bread?' He laughs coldly. 'Eight hundred thousand men?' But he sits a little straighter."), [rel("caocao", "esteem", 1)]),
            topic("pride", T("直说：这一仗，输在太骄。", "Say it straight: this battle was lost to pride."),
                  T("曹操盯着你：『你敢说，我就敢听。』他没有再哭。", "Cao stares at you. 'If you dare say it, I dare hear it.' He doesn't weep again."),
                  [rel("caocao", "esteem", 2)], req=R("caocao", "esteem", ">=", 3), hint=T("需要曹操的赏识 ≥ 3", "Needs Cao's regard ≥ 3")),
            topic("water", T("默默递上水囊。", "Hand him your water flask without a word."),
                  T("他喝了一口，没有说话。", "He drinks and says nothing."), [rel("caocao", "esteem", 1)]),
        ], T("前面就是南郡了。", "Nanjun lies ahead."), when=ALL(CAO, NF("flag.wenzhi_warned"), NF("flag.wenzhi_together"))))

    # ---------------- crises (interrupt a chapter when a meter crosses its line) ----------------
    def crisis(id, title, intro, choices, when, order):
        n = node(id, "*", "interrupt", title, "free", T("原创危机", "original crisis"), intro, choices, when=when, order=order)
        return n
    N.append(crisis("x_exposed", T("妖言", "Whispers"), [
        P(T("军中开始传：刘备帐下有个书生能未卜先知，是妖人。张飞拍着桌子要把你绑来问个清楚。刘备把你叫进内帐，诸葛亮也在。",
            "Word spreads through the camp: a scholar in Liu Bei's household can see the future—a sorcerer. Zhang Fei pounds the table and wants you tied up and questioned. Liu Bei calls you into his tent."), LIU),
        P(T("诸葛亮也在帐中。", "Zhuge Liang is there too."), ALL(LIU, R("zhuge", "esteem", ">=", 1))),
        P(T("许都开始传：丞相府有个能知未来的人。曹操最恨术士。他把你叫去，程昱也在。",
            "Word spreads through Xuchang: someone in the Chancellor's office can see the future. Cao Cao hates soothsayers. He summons you; Cheng Yu is there too."), CAO)],
        [choice("dream", "dilemma", T("说实话：你梦见过这一切。", "Tell the truth: you have dreamed all of this."),
                [P(T("刘备沉默良久，亲自送你出营：『先生的梦，我不敢留。』", "Liu Bei is silent a long time, then walks you out of the camp himself. 'I dare not keep a man with dreams like yours.'"), LIU),
                 P(T("曹操大笑。笑完了，他下令把你送出许都，永不许回。", "Cao Cao roars with laughter. When he's done, he has you escorted out of Xuchang, never to return."), CAO)],
                [setv("flag.exiled"), setv("flag.exposed")]),
         choice("reason_liu", "strategy", T("说是推算：天时、地利、人事，算得出来。", "Say it's calculation: weather, terrain and people—it can be reckoned."),
                T("诸葛亮替你圆了这个说法：『子衡兄的算法，亮也会。』流言慢慢散了。他私下对你说：『下次，先告诉我。』", "Zhuge Liang backs your story. 'I can reckon the same way.' The rumors die down. In private he tells you, 'Next time, tell me first.'"),
                [add("uncanny", -2), rel("zhuge", "trust", -2)], when=LIU, req=R("zhuge", "esteem", ">=", 3), hint=T("需要诸葛亮的敬重 ≥ 3，他才会替你说话", "Needs Zhuge Liang's respect ≥ 3 for him to speak for you")),
         choice("reason_cao", "strategy", T("请丞相当场出一道题，推算给他看。", "Ask the Chancellor to set you a problem on the spot, and reckon it for him."),
                T("你算对了。曹操没有再追问，只是从此每次议事都让你坐得离他近一些——好看着你。", "You get it right. Cao asks no more—but from then on, at every council, he seats you closer to him. The better to watch you."),
                [add("uncanny", -2), rel("caocao", "esteem", -1)], when=CAO, req=R("caocao", "esteem", ">=", 6), hint=T("需要曹操的赏识 ≥ 6", "Needs Cao's regard ≥ 6")),
         choice("deny", "dilemma", T("矢口否认，从此闭口不言。", "Deny everything, and keep your mouth shut from now on."),
                T("流言没有散，只是换了说法：那书生怕了。主公看你的眼神，多了一层东西。", "The rumors don't go away; they just change: the scholar got scared. Your lord looks at you differently now."),
                [add("uncanny", -1), rel("liubei", "trust", -2), rel("caocao", "esteem", -2)])],
        V("uncanny", ">=", 4), 1))
    for c in N[-1]["choices"]:
        if c["id"] == "dream": c["ends"] = True

    N.append(crisis("x_cold_liu", T("冷落", "Out of Favor"),
        T("你发现，议事的时候已经没有人等你开口了。刘备待你仍旧客气，只是不再问你。", "You notice that at council no one waits for you to speak any more. Liu Bei is as courteous as ever. He just doesn't ask you anything."),
        [choice("resign", "dilemma", T("请辞。", "Resign."), T("刘备没有挽留，送了你一匹马和一包盘缠：『子衡保重。』", "Liu Bei doesn't try to stop you. He gives you a horse and travel money. 'Take care, Ziheng.'"), [setv("flag.exiled")]),
         choice("clerk", "expression", T("留下来，做个抄写文书的小吏。", "Stay on as a copying clerk."), T("你的案头堆满了别人的文书。日子还长。", "Your desk fills with other men's paperwork. There's a long road ahead."), [setv("flag.sidelined"), rel("liubei", "trust", 1)]),
         choice("prove", "dilemma", T("请命去做一件没人愿意做的事。", "Volunteer for the job nobody wants."),
                T("你在泥地里走了三个月，替刘备把各郡的粮册重新理了一遍。回来那天，他亲自出城接你。", "You spend three months tramping through mud, putting the grain registers of every district in order. The day you return, Liu Bei rides out of the city to meet you himself."),
                [rel("liubei", "trust", 3), add("renown.loyal")], req=V("renown.loyal", ">=", 1), hint=T("需要一点忠义之名，主公才肯给你机会", "Needs some name for loyalty before he'll give you the chance"))],
        ALL(LIU, R("liubei", "trust", "<=", 1)), 2))
    N[-1]["choices"][0]["ends"] = True

    N.append(crisis("x_cold_cao", T("闲职", "A Quiet Post"),
        T("丞相府的人都知道：子衡失宠了。你的文书被退回来三次，每次都没有批语。", "Everyone in the Chancellor's office knows: Ziheng has lost favor. Your memoranda come back three times, each without a word written on them."),
        [choice("leave", "dilemma", T("自请外放。", "Ask to be posted to the provinces."), T("曹操批了，一个字：『可。』你去了一个在地图上要找很久的小县。", "Cao approves it with one word: 'Granted.' You go to a county so small it takes a while to find on the map."), [setv("flag.exiled")]),
         choice("wait", "expression", T("留在闲职上，等。", "Stay in the quiet post, and wait."), T("你学会了在廊下晒太阳。也学会了听别人议事时不插嘴。", "You learn to sit in the sun on the veranda, and to listen at councils without speaking."), [setv("flag.sidelined"), rel("caocao", "esteem", 1)]),
         choice("plan", "dilemma", T("连夜写一份平定荆州的方略，放到他案头。", "Write a plan for taking Jingzhou overnight and leave it on his desk."),
                T("第二天一早，曹操派人来叫你。方略上全是朱笔批注。", "Early next morning Cao sends for you. Your plan is covered in his red-ink notes."),
                [rel("caocao", "esteem", 3), add("renown.cunning")], req=V("renown.cunning", ">=", 2), hint=T("需要权谋之名 ≥ 2", "Needs name for cunning ≥ 2"))],
        ALL(CAO, R("caocao", "esteem", "<=", 1)), 3))
    N[-1]["choices"][0]["ends"] = True

    # ---------------- extra foresight options & relationship gates ----------------
    byid = {n["id"]: n for n in N}
    byid["c2_pretext"]["choices"].append(choice("regret", "strategy", T("直说：曹操很快会后悔，要走就趁今夜。", "Say it plainly: Cao will regret this soon. If we go, we go tonight."),
        T("刘备看了你一眼，没有问为什么。次日入朝请命截击袁术，当夜就出了城。", "Liu Bei looks at you and doesn't ask why. He volunteers at court the next day, and leaves that same night."),
        [setv("flag.fast_departure"), add("uncanny"), rel("liubei", "trust", 1)], foresight=True, echo=["e_fast"]))
    byid["c4_yuan"]["choices"].append(choice("foresee", "strategy", T("断言：袁绍必败，早走为上。", "Declare it: Yuan Shao is doomed. Leave while you can."),
        T("刘备借故南下。不到一年，袁绍在官渡大败。刘备想起你那句话，后背发凉。", "Liu Bei finds a reason to go south. Within the year Yuan Shao is crushed at Guandu. Liu Bei remembers what you said, and a chill runs down his back."),
        [rel("liubei", "trust", 2), add("uncanny"), add("renown.cunning")], foresight=True))
    byid["c5_cottage"]["choices"].append(choice("preempt", "dilemma", T("抢在诸葛亮开口之前，把三分天下的大势先说给主公听。", "Before Zhuge Liang can speak, lay out the three-way division of the realm for your lord yourself."),
        T("刘备听得出神。诸葛亮出来时，你已经说完了。他看了你一眼，把准备好的地图又卷了起来，只说：『子衡兄所言，正是亮之所想。』", "Liu Bei listens spellbound. By the time Zhuge Liang comes out, you've finished. He glances at you, rolls his prepared map back up, and says only, 'Ziheng has said exactly what I was thinking.'"),
        [rel("liubei", "trust", 2), rel("zhuge", "trust", -2), rel("zhuge", "esteem", 1), add("uncanny")], foresight=True, resolve=[("d_recommend", "reroute")]))
    byid["c6_slope"]["choices"].append(choice("guard_family", "strategy", T("预先劝主公：让赵云专护家眷，寸步不离。", "Warn your lord in advance: have Zhao Yun guard his family and never leave their side."),
        T("刘备依了你。乱军中家眷还是被冲散了，赵云单骑杀回去，把阿斗抱了出来；糜夫人离得近，被你扶上了马。", "Liu Bei takes your advice. The family is still scattered in the rout; Zhao Yun rides back alone and carries Adou out; Lady Mi was close by, and you get her onto your horse."),
        [setv("flag.mi_saved"), add("uncanny"), add("deviation"), rel("liubei", "trust", 1)], foresight=True, echo=["e_mi"], debt=["d_mi"], resolve=[("d_mi", "transform")]))
    for nid, cid, req, hint in [
        ("c6_slope", "search", R("liubei", "trust", ">=", 4), T("需要刘备的信任 ≥ 4，他才会把家眷托给你", "Needs Liu Bei's trust ≥ 4 to entrust his family to you")),
        ("c7_fire", "ambush", R("zhuge", "esteem", ">=", 1), T("需要诸葛亮的敬重 ≥ 1", "Needs Zhuge Liang's respect ≥ 1")),
        ("c8_huarong", "vouch", ANY(R("guanyu", "esteem", ">=", 3), R("liubei", "trust", ">=", 6)), T("需要关羽的敬重 ≥ 3，或刘备的信任 ≥ 6，你的担保才有分量", "Needs Guan Yu's respect ≥ 3 or Liu Bei's trust ≥ 6 for your word to carry weight")),
    ]:
        c = next(c for c in byid[nid]["choices"] if c["id"] == cid); c["req"] = req; c["hint"] = hint

    # new callbacks for talk echoes
    def addcb(nid, cbk): byid[nid].setdefault("callbacks", []).append(cbk)
    addcb("c3_terms", cb("e_guan_fear", T("你想起篝火边他说的话：最怕负了大哥。", "You remember what he said by the fire: what he fears is failing his brother."), F("flag.guan_fear")))
    addcb("c4_seal", cb("e_guan_fear", T("关羽说：『那晚说过的，最怕负了大哥。今天该走了。』", "Guan Yu says, 'I told you that night what I fear most. Today I have to go.'"), F("flag.guan_fear")))
    addcb("c6_slope", cb("e_people", T("你想起古城楼上他说的：我从没扔下过他们。", "You remember what he said on the Gucheng wall: I've never left them behind."), F("flag.heard_people")))
    addcb("c8_huarong", cb("e_zhuge_test", T("诸葛亮看了你一眼。自从那晚你说出三分天下，他一直是这样看你的。", "Zhuge Liang glances at you. He has looked at you this way ever since the night you spoke of the three-way division."), F("flag.zhuge_tested")))
    addcb("c7_chain", cb("e_wind", T("曹操瞥了你一眼：『东南风？』他笑了，没有再说。", "Cao glances at you. 'A southeast wind?' He laughs and says no more."), F("flag.warned_wind")))
    addcb("c8_cao", cb("e_cao_guan", T("曹操低声说：『我留不住的人，又来了。』", "Cao murmurs, 'The one I couldn't keep—here he is again.'"), F("flag.cao_on_guan")))
