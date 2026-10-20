"""Offline reactions for free chat in night talks (used when no AI is available, and as a safety fallback).
Each intent has escalating variants: the 1st time, the 2nd time, the 3rd time and after.
romance: whether this character can become a romantic partner in this book (a product decision, per character)."""
from lib import T

REACT = {
  "guanyu": {"romance": False, "react": {
    "love": [T("关羽手里的布停住了。他看了你很久，才说：『子衡，这话……兄弟之间，不必说出口。』", "Guan Yu's cloth stops on the blade. He looks at you a long time. 'Ziheng... between brothers, such things needn't be said.'"),
             T("『你喝多了。』他把酒囊从你手边拿开，语气却不重。", "'You've had too much to drink.' He moves the wine skin away from your hand, but not unkindly."),
             T("关羽站起身：『夜深了。明日还要赶路。』他走了几步，又回头：『你说的，我当作没听见。』", "Guan Yu rises. 'It's late. We march tomorrow.' A few steps on he turns back. 'I'll take it I didn't hear that.'")],
    "insult": [T("关羽的眉头一沉：『再说一遍。』刀没有出鞘，但你听得见风声。", "Guan Yu's brows drop. 'Say that again.' The blade stays sheathed, but you can hear the wind."),
               T("『大哥收留的人，我不与你计较。』他背过身去，不再看你。", "'You're my brother's guest, so I'll let it pass.' He turns his back and stops looking at you.")],
    "praise": [T("『过誉了。』他嘴上这么说，捋须的手却慢了下来。", "'You flatter me.' But the hand stroking his beard slows."),
               T("『夸人的话，说一遍就够了。』他难得笑了一下。", "'Praise is worth saying once.' For once he almost smiles.")],
    "ask": [T("关羽想了想：『这个，你该去问大哥。』", "Guan Yu thinks. 'That's a question for my brother.'"),
            T("『我只知道一件事：跟着大哥，不会错。』", "'I know one thing: following my brother is never wrong.'")],
    "small": [T("关羽嗯了一声，继续擦刀。", "Guan Yu grunts and goes on cleaning the blade."),
              T("『明日要赶早路，你也早些歇着。』", "'We start early tomorrow. Get some rest.'"),
              T("火光照着他半边脸。他没有接话，却也没有赶你走。", "The firelight catches half his face. He doesn't answer, but he doesn't send you away either.")]}},
  "liubei": {"romance": False, "react": {
    "love": [T("刘备一愣，随即笑了：『先生这话，备记下了。乱世之中，肯说这种话的人不多。』", "Liu Bei blinks, then laughs. 'I'll remember that, sir. Few people say such things in times like these.'"),
             T("『好了好了。』他拍拍你的肩，『你我之间，不必如此。』", "'All right, all right.' He pats your shoulder. 'There's no need for that between us.'"),
             T("刘备没有再笑，只是认真看着你：『子衡，有些话说多了，就轻了。』", "Liu Bei stops smiling and looks at you seriously. 'Ziheng, some words grow light if you say them too often.'")],
    "insult": [T("刘备的笑容收了起来：『先生累了，回去歇着吧。』", "Liu Bei's smile fades. 'You're tired, sir. Go and rest.'"),
               T("『备寄人篱下多年，这样的话听得多了。』他语气平静，你却觉得比骂人还难受。", "'I've lived under other men's roofs for years. I've heard worse.' His calm is harder to bear than anger.")],
    "praise": [T("『先生谬赞。备不过是不肯认命罢了。』", "'You praise me too much. I simply refuse to accept my fate.'"),
               T("刘备摆摆手，耳根却有些红。", "Liu Bei waves it off, though the tips of his ears redden.")],
    "ask": [T("刘备沉吟片刻：『这件事，我还没想好。先生怎么看？』", "Liu Bei considers. 'I haven't decided. What do you think?'"),
            T("『问得好。』他笑了，『可我答不上来。』", "'A good question.' He smiles. 'But I can't answer it.'")],
    "small": [T("刘备望着城下的灯火，嗯了一声。", "Liu Bei gazes at the lights below and murmurs agreement."),
              T("『难得有这样安静的夜。』他说。", "'It's rare to have a night this quiet,' he says."),
              T("他给你倒了一杯酒，什么也没说。", "He pours you a cup of wine and says nothing.")]}},
  "zhuge": {"romance": False, "react": {
    "love": [T("诸葛亮的扇子停在半空：『子衡兄……亮已有家室。』他说得很认真，眼里却有一点笑意。", "Zhuge Liang's fan stops mid-air. 'Ziheng... I am a married man.' He says it gravely, but his eyes are amused."),
             T("『这一句，亮就当是夸我的计策了。』他轻轻摇扇。", "'I'll take that as praise for my strategy.' He fans himself lightly."),
             T("诸葛亮叹了口气：『你若再说，亮只好告诉黄夫人了。』", "Zhuge Liang sighs. 'Say it again and I shall have to tell my wife.'")],
    "insult": [T("诸葛亮并不恼：『子衡兄说得对，亮确实年轻。』这句话比反驳更让你脸红。", "Zhuge Liang isn't offended. 'You're right, I am young.' It makes you blush more than any rebuttal could."),
               T("他看了你一眼，把灯拨亮了些：『心里有气，就说出来。说完了，我们再谈正事。』", "He glances at you and turns up the lamp. 'If you're angry, say so. Then we can talk business.'")],
    "praise": [T("『过奖。』他笑，『亮只是比别人多想了一步。』", "'You're too kind.' He smiles. 'I only think one step further than others.'"),
               T("诸葛亮摇扇不语，像是在掂量这句话里有几分真。", "Zhuge Liang fans himself in silence, as if weighing how much of that you meant.")],
    "ask": [T("『子衡兄以为呢？』他把问题又推了回来。", "'And what do you think?' He hands the question straight back."),
            T("诸葛亮笑了：『这个问题，三年后再问我。』", "Zhuge Liang smiles. 'Ask me that again in three years.'")],
    "small": [T("诸葛亮点点头，在灯下翻了一页书。", "Zhuge Liang nods and turns a page by the lamp."),
              T("『夜里风凉。』他把窗关上了一半。", "'The night air is cold.' He half closes the window."),
              T("他嗯了一声，像是在听，又像是在想别的事。", "He hums, as if listening—or thinking of something else.")]}},
  "caocao": {"romance": False, "react": {
    "love": [T("曹操大笑，笑得酒都洒了：『好！孤喜欢直爽的人。可惜孤不缺这样说话的人，缺的是会打仗的人。』", "Cao Cao roars with laughter and spills his wine. 'Good! I like plain speaking. But I've no shortage of people saying that. What I'm short of is people who can win battles.'"),
             T("『又来了。』曹操眯起眼，『你想要什么，直说。』", "'Again?' Cao narrows his eyes. 'Whatever you want, say it plainly.'"),
             T("曹操不笑了：『同一句话说三遍，要么是傻，要么是有所图。你是哪一种？』", "Cao stops laughing. 'Say the same thing three times and you're either a fool or after something. Which are you?'")],
    "insult": [T("曹操的手按在剑上，停了一停，又松开：『有胆。孤记住你了。』", "Cao's hand goes to his sword, pauses, and lets go. 'You've got nerve. I'll remember you.'"),
               T("『拖出去——』他说了半句，又笑起来，『罢了，今夜不杀人。』", "'Take him out—' he begins, then laughs. 'Never mind. No killing tonight.'")],
    "praise": [T("『这话孤听得多了。』曹操摆手，却又给你斟满了酒。", "'I've heard that plenty.' Cao waves it off, yet refills your cup."),
               T("『夸孤的人，多半有事相求。』他斜看你一眼。", "'Those who praise me usually want something.' He eyes you sideways.")],
    "ask": [T("曹操反问：『你猜？』", "Cao answers with a question. 'What do you think?'"),
            T("『这天下的事，孤也有不知道的。』他难得说了句实话。", "'Even I don't know everything under heaven,' he says—an unusually honest admission.")],
    "small": [T("曹操嗯了一声，又喝了一口酒。", "Cao grunts and drinks again."),
              T("『月明星稀……』他低声念了半句，没有念完。", "'The moon is bright, the stars are few…' he murmurs, and doesn't finish."),
              T("他望着廊外，好一会儿没说话。", "He looks out past the veranda and says nothing for a while.")]}},
  "wenzhi": {"romance": True, "react": {
    "love": [T("温芷手里的药杵停了。她没有回头，耳朵却红了：『……你知道自己在说什么吗？』", "Wen Zhi's pestle stops. She doesn't turn, but her ears go red. '...Do you know what you're saying?'"),
             T("『说一遍就够了。』她小声说，『说多了，我会当真的。』", "'Once is enough,' she says quietly. 'Say it more and I'll believe you.'"),
             T("她终于转过身，把药杵塞进你手里：『那就帮我把药捣完。说话不如做事。』", "She finally turns and puts the pestle in your hand. 'Then help me finish grinding these. Actions over words.'")],
    "insult": [T("温芷看了你一眼：『你今天心里不痛快。说吧，哪里疼？』", "Wen Zhi looks at you. 'Something's eating you today. Tell me—where does it hurt?'"),
               T("『这话我不爱听。』她收起药箱，『等你清醒了再来。』", "'I don't like hearing that.' She packs up her chest. 'Come back when you've come to your senses.'")],
    "praise": [T("『少来。』她嘴上这么说，嘴角却弯了。", "'Oh, stop.' But the corner of her mouth curves up."),
               T("『医者的手，夸不得。一夸就抖。』她笑着说。", "'Never praise a physician's hands—they'll start to shake,' she says, laughing.")],
    "ask": [T("温芷想了想：『你问这个做什么？』她还是认真答了。", "Wen Zhi thinks. 'Why do you ask?' But she answers seriously anyway."),
            T("『我也不知道。』她说，『不过你问了，我会想一想。』", "'I don't know,' she says. 'But since you asked, I'll think about it.'")],
    "small": [T("温芷嗯了一声，手里的活没停。", "Wen Zhi hums, her hands still busy."),
              T("『你还是老样子，』她说，『话少，眼睛不老实。』", "'You haven't changed,' she says. 'Few words, restless eyes.'"),
              T("江风吹过来，她把披风往你这边拉了拉。", "The river wind blows in. She pulls the edge of her cloak over toward you.")]}},
}

PATTERNS = {
  "love": r"爱你|喜欢你|爱上|嫁给我|娶你|心悦|想你|在一起|做我的|亲你|抱你|love you|i love|marry me|kiss you|be mine|in love|hold you",
  "insult": r"奸贼|国贼|老贼|篡|蠢|笨|废物|滚|闭嘴|可笑|懦夫|活该|无能|伪君子|stupid|idiot|fool|shut up|coward|pathetic|useless|get lost|hypocrite",
  "praise": r"佩服|厉害|雄才|无人能及|天下无双|英明|了不起|仰慕|英雄|敬佩|admire|amazing|impressive|great man|hero|brilliant",
  "ask": r"[?？]|吗$|呢$|什么|为什么|怎么|如何|\bhow\b|\bwhy\b|\bwhat\b|\bwho\b",
}
