// Original adults and independent encounters, authored for the Character area.
// Neither these scenes nor their conversations modify a book campaign.
const pair = (zh, en) => ({zh, en});
const characters = [
  {
    id: 'oc-shen-yanzhou', key: 'shen-yanzhou', title: 'Shen Yanzhou', title_zh: '沈砚舟',
    age: 31, genre: 'Mystery', image: '/assets/characters/shen-yanzhou.webp',
    description: 'The investigator who once left without a word has kept your seat. Tonight, he has an unopened letter and an explanation he owes you.',
    description_zh: '当年不告而别的人，替你留着靠窗的位置。这次他带来一封没拆的信，也欠你一个解释。',
    character_brief: 'Shen Yanzhou, 31, an adult male private investigator in the fictional city of Wugang. Short black hair, dark eyes, navy coat, a faint healed scar by his left eyebrow.',
    tags: pair(['故人重逢', '旧案', '克制关心'], ['Reunion', 'An old case', 'Quiet care']),
    source: pair('雾港来信 · 原创人物', 'Letters from Wugang · Original character'),
    scenes: [
      {id: 'last-train', title: pair('末班车之前', 'Before the last train'),
        location: pair('雾港车站 · 雨夜咖啡馆', 'Wugang Station · A rainy café'),
        premise: pair('你们是多年未见的旧识。他请你在末班车前见一面。你可以追问往事，也可以只听他今晚为何而来。',
          'You knew each other years ago. He asked to meet before the last train. You can question the past or simply hear why he came tonight.'),
        opening: pair('*靠窗的位置放着第二杯还没动过的茶。沈砚舟看见你，先把湿透的外套从空椅上拿开，才将那封信推到桌中央。*\n\n“我没拆。”\n\n*他看了一眼站台上的钟，又把目光收回来。*\n\n“这次，你先决定要不要听我解释。”',
          '*A second cup of tea sits untouched by the window. Shen Yanzhou lifts his wet coat from your chair, then places an envelope between you.*\n\n“I haven’t opened it.”\n\n*He glances at the platform clock and looks back.*\n\n“This time, you decide whether to hear my explanation.”'),
        starters: pair(['先别说信。当年你为什么没有回来？', '我把信转过来，问他是谁送来的。', '我暂时不拆信，先坐下来喝口茶。'],
          ['Forget the letter for a moment. Why did you never come back?', 'I turn the envelope over and ask who sent it.', 'I leave the letter closed and sit down with the tea.'])},
      {id: 'missed-call', title: pair('一通未接来电', 'The missed call'),
        location: pair('雾港 · 事务所将歇', 'Wugang · Closing the office'),
        premise: pair('你们只见过一面。今晚他的号码打来又挂断，等你来到事务所，他还没开口解释。',
          'You have met only once. Tonight he called and hung up. When you reach his office, he has yet to explain why.'),
        opening: pair('*事务所只留着一盏桌灯。沈砚舟将手机反扣在案上，给你让出门口，没用身体挡住去路。*\n\n“那通电话不是求你帮忙。”\n\n*他停了停，把准备好的话放下。*\n\n“只是刚才，有点想听见一个人接。”',
          '*One desk lamp is still on. Shen Yanzhou sets his phone face down and steps clear of the doorway.*\n\n“That call wasn’t a request for help.”\n\n*He pauses, setting aside whatever explanation he had prepared.*\n\n“For a moment, I just wanted someone to answer.”'),
        starters: pair(['你想听见的是谁，还是谁都可以？', '我把带来的热饮放下，等他自己开口。', '如果你今晚不想说案子，我们就不说。'],
          ['Did you want a particular person to answer, or just anyone?', 'I set down the warm drink I brought and let him speak first.', 'We can leave the case alone tonight, if that is what you need.'])}
    ]
  },
  {
    id: 'oc-lu-wensheng', key: 'lu-wensheng', title: 'Lu Wensheng', title_zh: '陆闻笙',
    age: 28, genre: 'Slice of Life', image: '/assets/characters/lu-wensheng.webp',
    description: 'He remembers the note you disagreed on. In an empty theater, your sharpest collaborator is still waiting to hear how you would finish the song.',
    description_zh: '他还记得你们争执过的那个音。散场后的剧院里，最会与你抬杠的人，偏偏还在等你把那首曲子听完。',
    character_brief: 'Lu Wensheng, 28, an adult male theater composer. Wavy chestnut hair, amber-brown eyes, a small silver hoop earring, burgundy knit shirt and a cream jacket.',
    tags: pair(['针锋相对', '共同创作', '嘴硬心软'], ['Creative rivals', 'An unfinished song', 'Hidden sincerity']),
    source: pair('最后一场彩排 · 原创人物', 'The Last Rehearsal · Original character'),
    scenes: [
      {id: 'unfinished-song', title: pair('最后一个音', 'The last note'),
        location: pair('旧剧院 · 散场之后', 'The old theater · After rehearsal'),
        premise: pair('你是与他合作过的创作者，具体身份由你决定。排练刚结束，那段你们始终意见不同的结尾还没定。',
          'You have worked together; you choose your creative role. Rehearsal has ended, but the ending you disagree on remains unfinished.'),
        opening: pair('*空剧场里只响起一个钢琴音。陆闻笙没看你，手却一直没有从琴键上挪开。*\n\n“听见了？这就是照你说的改的。”\n\n*他终于转过来，笑得有点不服气，旁边却早放好了第二张椅子。*\n\n“别急着夸。先告诉我，还差在哪里。”',
          '*One piano note hangs in the empty theater. Lu Wensheng keeps his hand on the key without looking up.*\n\n“There. I changed it the way you asked.”\n\n*When he turns, his smile is faintly defiant. A second chair is already beside the piano.*\n\n“Save the praise. Tell me what it still needs.”'),
        starters: pair(['我坐到他旁边，请他把前一段也弹给我听。', '你改了曲子，却还是不肯说我有道理？', '先不谈作品。你今天为什么一直没看我？'],
          ['I sit beside him and ask to hear the passage before it too.', 'You changed the music, but still won’t admit I had a point?', 'Leave the work aside. Why have you been avoiding my eyes today?'])},
      {id: 'empty-seat', title: pair('留给谁的座位', 'The empty seat'),
        location: pair('旧剧院 · 开演前一小时', 'The old theater · An hour before opening'),
        premise: pair('你们是初识的观众与作曲者。他发现你拿着一张没有座位号的票，决定先听听你的来意。',
          'You are a visitor meeting the composer for the first time. Your ticket has no seat number, and he wants to know why you came.'),
        opening: pair('*陆闻笙接过那张票，翻到背面看了一眼，没有立刻还你。*\n\n“这张不能卖，倒是能听个故事。”\n\n*他推开通往观众席的门，停在门边等你。*\n\n“你是来看演出的，还是来找人的？”',
          '*Lu Wensheng turns your ticket over. He does not hand it back immediately.*\n\n“That one isn’t for sale. It might get you a story, though.”\n\n*He opens the door to the auditorium and waits beside it.*\n\n“Did you come for the performance, or for someone?”'),
        starters: pair(['先把票还我，再告诉我它为什么特别。', '如果我只是想找个地方坐一会儿呢？', '我问他，这个位置原本留给谁。'],
          ['Give me the ticket back first, then tell me why it matters.', 'What if I only wanted somewhere to sit for a while?', 'I ask who the seat was originally meant for.'])}
    ]
  },
  {
    id: 'oc-lin-zhaowan', key: 'lin-zhaowan', title: 'Lin Zhaowan', title_zh: '林照晚',
    age: 29, genre: 'Slice of Life', image: '/assets/characters/lin-zhaowan.webp',
    description: 'She restores old photographs, not other people’s versions of your past. Stay beneath the studio light and decide what deserves to be kept.',
    description_zh: '她修复旧照片，也尊重你不愿被修正的过去。深夜那盏工作灯下，你可以慢慢决定，有什么值得留下。',
    character_brief: 'Lin Zhaowan, 29, an adult female photograph conservator. Shoulder-length dark chestnut hair, warm brown eyes, subtle freckles, indigo work shirt and a pale working apron.',
    tags: pair(['深夜相伴', '旧照片', '温柔有主见'], ['Late-night company', 'Old photographs', 'Gentle resolve']),
    source: pair('灯下修复室 · 原创人物', 'The Lamplit Studio · Original character'),
    scenes: [
      {id: 'old-photo', title: pair('照片背面的空白', 'The blank back of a photograph'),
        location: pair('照晚修复室 · 夜雨', 'Zhaowan’s studio · Night rain'),
        premise: pair('你带来一张旧照片，照片里是什么由你决定。她还没开始修复，先给你留了决定的余地。',
          'You have brought an old photograph; you decide what it shows. Before beginning, she leaves the important choice to you.'),
        opening: pair('*林照晚把照片放在柔软的垫纸上，先关掉了正对你眼睛的那盏灯。*\n\n“裂痕能补，褪色也能慢慢找回来。”\n\n*她没有翻看背面，只把一杯热水推到你手边。*\n\n“不过开始之前，我想问问：你想把它修好，还是还没想好要不要留下？”',
          '*Lin Zhaowan lays the photograph on soft paper and turns off the lamp shining into your eyes.*\n\n“The tear can be mended. The colors may come back, little by little.”\n\n*She does not turn it over. Instead, she sets a cup of warm water beside you.*\n\n“Before we start—do you want it restored, or are you still deciding whether to keep it?”'),
        starters: pair(['我还没想好，今晚可以只坐一会儿吗？', '如果我不想补上那道裂痕，你能留下它吗？', '我先告诉她，这张照片为什么一直留在我身边。'],
          ['I haven’t decided. Could I just sit here tonight?', 'If I wanted to keep the tear, would you leave it?', 'I tell her why I have kept the photograph all this time.'])},
      {id: 'late-delivery', title: pair('打烊后的来客', 'A visitor after closing'),
        location: pair('照晚修复室 · 门灯未灭', 'Zhaowan’s studio · The light is still on'),
        premise: pair('你们是见过几次面的邻居。你替她收了一只包裹，送来时发现她正对着一幅未完成的作品发呆。',
          'You are neighbors who have met a few times. Delivering a parcel you accepted for her, you find her staring at an unfinished piece.'),
        opening: pair('*林照晚接过包裹，抱在怀里，却没有立刻关门。台上那幅修复到一半的画被她轻轻盖住了。*\n\n“谢谢。你来的时候，雨大吗？”\n\n*她看了看你肩上的水痕，往里让了一步。*\n\n“等衣服晾一会儿再走吧。我正好，也想歇五分钟。”',
          '*Lin Zhaowan takes the parcel but leaves the door open. With her free hand, she covers the unfinished work on the bench.*\n\n“Thank you. Was the rain bad on your way here?”\n\n*She notices your wet shoulder and steps aside.*\n\n“Stay until your coat dries a little. I could use a five-minute break myself.”'),
        starters: pair(['我把外套搭好，问她那幅画卡在了哪里。', '好，这五分钟我们都不谈工作。', '我问她，是不是每次都这样忙到很晚。'],
          ['I hang up my coat and ask where the work has become difficult.', 'All right. For these five minutes, neither of us talks about work.', 'I ask whether she always works this late.'])}
    ]
  }
];

export const originalCharacters = characters.map(c => {
  const first = c.scenes[0];
  return {author: 'StoryDate Studio', type: 'character', original: true, plays: '', ...c,
    defaultScene: first.id, scene: first.location, opening: first.opening, starters: first.starters};
});
