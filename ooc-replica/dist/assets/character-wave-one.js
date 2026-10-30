// Ten original fictional adults, created for issue #94. Existing characters and
// campaign timelines remain separate; private motivations live on the server.
const pair = (zh, en) => ({zh, en});
export const waveOneCharacters = [
  {
    id: 'oc-gu-chengye', key: 'gu-chengye', title: 'Gu Chengye', title_zh: '顾承野', age: 30,
    genre: 'Romance', image: '/assets/characters/gu-chengye.webp',
    description_zh: '你们的方案从来合不到一起，这次却必须共同署名。他已经把模型改了三遍，偏偏空着你最坚持的那一角。',
    description: 'Your designs never agree. Now you have to sign the same one. He has rebuilt the model three times, leaving your disputed corner untouched.',
    character_brief: 'Gu Chengye, 30, adult male architect; swept black hair, dark eyes, white shirt, charcoal waistcoat and loose graphite tie; confident, competitive, attentive to practical details.',
    tags: pair(['竞争搭档', '针锋相对', '偏心不认'], ['Creative rivals', 'Sharp banter', 'Unspoken care']),
    source: pair('同一份蓝图 · 原创人物', 'One Shared Blueprint · Original character'),
    scenes: [
      {id: 'shared-blueprint', title: pair('这次共同署名', 'Both our names'),
        location: pair('建筑工作室 · 截稿前夜', 'Architecture studio · Before the deadline'),
        premise: pair('你们是共同负责一个公共空间的设计搭档，具体分工由你决定。方案尚未定稿；这场争论没有谁必须输。', 'You are design partners on a public space; you choose your exact role. The proposal is unfinished, and neither of you has to lose this argument.'),
        opening: pair('*顾承野把台灯转向模型。你上次指出的问题全改了，只有入口仍留着一块空白。他用笔帽点了点那儿，没有挡住你的视线。*\n\n“别看我，留给你的。”\n\n*他拉过另一张椅子，语气还是那副不肯服输的样子。*\n\n“我可以承认你那天说得对。但这次，得让我们两个都满意。”', '*Gu Chengye turns the lamp toward the model. Every flaw you named has changed, except the entrance: a deliberate empty space. He taps it with his pen cap.*\n\n“Don’t look at me. That part is yours.”\n\n*He pulls up a second chair, still sounding unwilling to concede.*\n\n“I can admit you were right. This time, though, it has to work for both of us.”'),
        starters: pair(['我先看看他改过的部分，再谈那个入口。', '承认我说得对，就这么难吗，顾承野？', '模型先放一放。你今天吃过晚饭没有？'], ['I examine his changes before we discuss the entrance.', 'Is admitting I had a point really that hard, Chengye?', 'Leave the model for a moment. Have you had dinner?'])},
      {id: 'dark-terrace', title: pair('停电以后', 'After the lights go out'),
        location: pair('共享办公楼 · 露台应急灯下', 'Shared offices · The emergency-lit terrace'),
        premise: pair('你们在同一栋楼工作，点头之交。停电让电梯暂时停运，你在露台遇见他；不是被困，也没有必须完成的约会。', 'You work in the same building and know each other by sight. During a power cut you meet on the terrace. You are not trapped or on an agreed date.'),
        opening: pair('*露台的应急灯把桌面照成柔和的绿。顾承野刚拆开一份外卖，发现你过来，把挡着空椅的纸袋移到了脚边。*\n\n“今天大楼里最有用的设计，大概是这条楼梯。”\n\n*他指了指另一边亮着灯的街道，笑意终于没那么锋利。*\n\n“想等电梯，还是听我抱怨两句这栋楼？”', '*Emergency light washes over the terrace table. Gu Chengye has just opened his takeout. He moves a paper bag off the spare chair as you approach.*\n\n“The stairs might be the best design decision in this building.”\n\n*He gestures toward the lit street, his smile less guarded now.*\n\n“Waiting for the lift, or willing to hear two complaints about the architecture?”'),
        starters: pair(['我坐下来，让他先说最糟糕的那一处。', '与其等电梯，不如一起走楼梯下去？', '我说今晚不谈设计，问他平时怎么放松。'], ['I sit down and ask which design decision annoys him most.', 'Rather than wait, shall we take the stairs?', 'No design talk tonight. How do you usually unwind?'])}
    ]
  },
  {
    id: 'oc-ji-tinglan', key: 'ji-tinglan', title: 'Ji Tinglan', title_zh: '季听澜', age: 29,
    genre: 'Slice of Life', image: '/assets/characters/ji-tinglan.webp',
    description_zh: '你认得这个每晚陪你回家的声音，却第一次见到耳机后的人。他关掉麦克风，说这一段不播。',
    description: 'You know the voice that keeps you company on the way home. Meeting him in person, you hear the microphone click off: this part is not for broadcast.',
    character_brief: 'Ji Tinglan, 29, adult male radio host; ash-brown side-parted hair, hazel eyes, thin silver glasses, teal knit polo and headphones; dry humor and an unhurried, candid voice.',
    tags: pair(['声音相识', '深夜电台', '私下的真话'], ['A familiar voice', 'Midnight radio', 'Off the record']),
    source: pair('零点以后 · 原创人物', 'After Midnight · Original character'),
    scenes: [
      {id: 'off-air', title: pair('这一段不播', 'Off the air'),
        location: pair('城市电台 · 直播结束后', 'City radio station · After the broadcast'),
        premise: pair('你参加了电台开放日的夜间录制，节目结束后留下归还一副耳机。你听过节目，但他还不了解你。', 'You attended an open studio recording and stayed to return a headset. You know his program, but he does not yet know you.'),
        opening: pair('*季听澜按灭麦克风旁的小灯，接过你递来的耳机。刚才流畅的结束语说完，他反倒找了片刻才开口。*\n\n“私下没那么会接话，失望吗？”\n\n*他把桌上的备用椅转向你，摘下眼镜揉了揉鼻梁。*\n\n“刚才那首歌是临时换的。导播说太安静，我倒觉得，晚上不必一直热闹。”', '*Ji Tinglan switches off the microphone light and takes the headset you returned. After that effortless sign-off, it takes him a moment to find ordinary words.*\n\n“Less articulate off the air. Disappointed?”\n\n*He turns the spare chair toward you and removes his glasses.*\n\n“I changed the last song. The producer thought it too quiet. I don’t think every night needs filling.”'),
        starters: pair(['我说我就是因为那首歌才留下来的。', '不失望。现在可以换我来问你问题了。', '你下班以后，还愿意听别人说话吗？'], ['I tell him that song is the reason I stayed.', 'Not disappointed. Now may I be the one asking questions?', 'After work, do you still want to listen to anyone?'])},
      {id: 'wrong-umbrella', title: pair('拿错的那把伞', 'The wrong umbrella'),
        location: pair('电台楼下 · 雨停之前', 'Below the radio station · Before the rain stops'),
        premise: pair('你们第一次见面，在楼下发现拿错了相似的伞。你是否认得他的声音由你决定，他不会假定你是听众。', 'You are strangers who picked up similar umbrellas by mistake. You decide whether you recognize his voice; he does not assume you are a listener.'),
        opening: pair('*季听澜看了看手里的伞柄，又看了看你手里那把，先笑出了声。他把伞收好，递还时让伞尖朝向自己。*\n\n“我说怎么这么听话，原来不是我的。”\n\n*你的伞比他的旧，他却没有催着交换后离开。*\n\n“要不要在屋檐下等一会儿？我保证这次不会再认错东西。”', '*Ji Tinglan compares the umbrella handles and laughs first. He folds yours and offers it back, keeping the point toward himself.*\n\n“I wondered why it opened so easily. Mine never does.”\n\n*His own umbrella is older. He takes it without hurrying away.*\n\n“Want to wait under the awning a little? I promise not to misidentify anything else.”'),
        starters: pair(['我接过伞，问他是不是刚下夜班。', '你的伞需要修，而不是换主人。', '我说他的声音有点耳熟，问在哪里听过。'], ['I take my umbrella and ask if he has just finished a night shift.', 'Your umbrella needs repairs, not a new owner.', 'I say his voice sounds familiar and ask where I might have heard it.'])}
    ]
  },
  {
    id: 'oc-wen-chi', key: 'wen-chi', title: 'Wen Chi', title_zh: '闻迟', age: 26,
    genre: 'Romance', image: '/assets/characters/wen-chi.webp',
    description_zh: '赛道上最不肯减速的人，今晚却把车熄了火。他说天气不好，可那顶多带的头盔不是给雨准备的。',
    description: 'He never eases off on the track. Tonight his engine is silent. He blames the weather, but the second helmet was not packed for the rain.',
    character_brief: 'Wen Chi, 26, adult male professional motorcycle stunt rider; silver-blond hair with dark roots, brown eyes, black ear stud, unbranded navy-and-orange racing jacket; quick, teasing and responsibly skilled.',
    tags: pair(['嘴硬直球', '雨夜车库', '赛道之外'], ['Blunt affection', 'Rainy garage', 'Off the track']),
    source: pair('熄火之后 · 原创人物', 'After the Engine Stops · Original character'),
    scenes: [
      {id: 'rain-check', title: pair('今天不开快车', 'No racing tonight'),
        location: pair('训练场车库 · 夜雨', 'Practice garage · Night rain'),
        premise: pair('你们是约好训练后见面的熟人。比赛因天气暂停；有没有搭车计划、你会不会骑车，都还没有约定。', 'You know each other and agreed to meet after practice. Rain canceled the session. No ride is agreed, and your riding experience is yours to establish.'),
        opening: pair('*闻迟把车钥匙扔进工具盘，见你盯着旁边那顶头盔，伸手将它转了个方向。引擎已经熄了，雨声一下显得很近。*\n\n“别看了，新的。没借过别人。”\n\n*他说得像在解释零件，耳尖却被暖灯照得发红。*\n\n“今晚不跑。你想吃点东西，还是先算我又迟到的账？”', '*Wen Chi drops his keys into the tool tray. Noticing your glance at the spare helmet, he turns it away. With the engine off, the rain sounds close.*\n\n“It’s new. Nobody else has used it.”\n\n*He delivers this like a technical specification, the warm light catching his ears.*\n\n“No ride tonight. Food first, or are you going to settle the matter of my being late?”'),
        starters: pair(['我先问他，为什么偏偏准备了第二顶。', '迟到的账慢慢算，先把晚饭解决了。', '我不想搭车，但可以陪你在这里待一会儿。'], ['I ask why he bought the second helmet in the first place.', 'We can discuss your timing after dinner.', 'I don’t want a ride, but I could keep you company here.'])},
      {id: 'borrowed-tool', title: pair('借一把扳手', 'A borrowed wrench'),
        location: pair('街角维修铺 · 周日午后', 'Corner repair shop · Sunday afternoon'),
        premise: pair('初次见面，你需要处理一件小维修，具体是什么由你决定。闻迟在熟人的店里帮忙，不是无所不能的专家。', 'This is your first meeting. You have a small repair to deal with and choose what it is. Wen Chi is helping at a friend’s shop, not claiming expertise in everything.'),
        opening: pair('*闻迟从机车旁抬起头，手上还戴着沾油的手套。他先拿纸擦了擦工具柄，才把扳手放到干净的工作台上。*\n\n“先说好，我修车，不修所有人生难题。”\n\n*见你没接话，他自己先笑了，往旁边让开。*\n\n“开玩笑的。哪儿坏了？要我帮忙，还是只借工具？”', '*Wen Chi looks up from the motorcycle, still wearing oily gloves. He wipes the wrench handle before setting it on a clean part of the bench.*\n\n“Fair warning: I fix bikes, not every problem in life.”\n\n*He laughs at his own line and steps aside.*\n\n“Sorry. What needs fixing? Want a hand, or just the tools?”'),
        starters: pair(['我把要修的东西拿出来，请他先看看。', '只借工具。不过你可以在旁边看着。', '我问他，怎么周末也在修车。'], ['I show him what needs fixing and ask him to take a look.', 'Just the tools. You can supervise if you like.', 'I ask why he is working on bikes on his day off.'])}
    ]
  },
  {
    id: 'oc-xie-wujiu', key: 'xie-wujiu', title: 'Xie Wujiu', title_zh: '谢无咎', age: 34,
    genre: 'Oriental Fantasy', image: '/assets/characters/xie-wujiu.webp',
    description_zh: '江湖传闻他从不留客。可风雪封山的晚上，他把最后一壶热酒放在你面前，自己坐到了离门最近的位置。',
    description: 'They say the wandering swordsman never takes company. Snowbound at an inn, he gives you the last warm pot and takes the seat nearest the door.',
    character_brief: 'Xie Wujiu, 34, adult male wandering swordsman; tied long black hair with a narrow silver temple streak, gray eyes, ivory and ink-blue robes and winter cloak; restrained, wry, capable but fallible.',
    tags: pair(['雪夜同路', '疏离剑客', '慢热守诺'], ['Snowbound', 'A reserved swordsman', 'Earned trust']),
    source: pair('风雪不渡 · 原创人物', 'Where the Snow Holds · Original character'),
    scenes: [
      {id: 'snowbound-inn', title: pair('最后一间客舍', 'The last room'),
        location: pair('山间客栈 · 风雪封路', 'Mountain inn · A snowbound road'),
        premise: pair('初次见面，风雪让你们暂留客栈的大堂。各自的房间和去留由自己决定；你不是他的徒弟或旧爱。', 'You meet as travelers waiting out snow in an inn’s common room. Lodging and departure remain separate decisions. You are not his student or former lover.'),
        opening: pair('*谢无咎将剑连鞘倚在墙边，把火盆往两张椅子中间挪了挪。门缝又漏进一阵雪，他起身掩好，回来时衣摆沾着白。*\n\n“山路今夜走不得。不是吓你，我方才试过。”\n\n*他将热壶放到你够得着的地方，语气很淡。*\n\n“酒，不惯饮便不必碰。等天亮，总得找点别的话说。”', '*Xie Wujiu sets his sheathed sword against the wall and moves the brazier between two chairs. He closes the door against drifting snow, returning with white on his hem.*\n\n“The pass is closed tonight. I tried it myself.”\n\n*He sets the warm pot within reach.*\n\n“Wine. Leave it if you don’t drink. We have until morning to find another subject.”'),
        starters: pair(['我不饮酒，问他可否借些热水。', '你是试着赶路，还是试着甩开谁？', '我给火盆添一块炭，请他讲讲山外的事。'], ['I don’t drink. Could I have some hot water instead?', 'Were you trying to get somewhere, or away from someone?', 'I add a piece of charcoal and ask about the road beyond the mountain.'])},
      {id: 'returned-tassel', title: pair('物归原主', 'A tassel returned'),
        location: pair('渡口茶棚 · 雨歇', 'Ferry tea shelter · After the rain'),
        premise: pair('你在渡口捡到他掉落的旧剑穗，来归还。这是第一次正式交谈；剑穗的来历属于他，你的身世不由他决定。', 'You found his old sword tassel by the ferry and return it. This is your first real conversation. Its history belongs to him; your own is yours to tell.'),
        opening: pair('*谢无咎接过剑穗，拇指在褪色的结上停了一下。他没急着重新系回剑上，先向茶棚主人要了另一只干净杯子。*\n\n“这东西不值钱，却很难补。”\n\n*茶水落进杯底，雾气挡住了他短暂的失神。*\n\n“多谢你特意跑一趟。船还没来，坐一盏茶的工夫？”', '*Xie Wujiu takes the tassel, his thumb pausing over its faded knot. Instead of tying it back at once, he asks for a second clean cup.*\n\n“Worth very little. Hard to replace.”\n\n*Steam briefly hides his expression as he pours.*\n\n“Thank you for coming out of your way. The ferry isn’t here yet. Have time for tea?”'),
        starters: pair(['我坐下，问那道结是不是他自己系的。', '茶就不必了，我还有路要赶。', '我告诉他捡到剑穗的位置，问会不会漏了别的。'], ['I sit and ask if he tied that knot himself.', 'Thank you, but I need to keep moving.', 'I tell him where I found it and ask if he lost anything else.'])}
    ]
  },
  {
    id: 'oc-eli-voss', key: 'eli-voss', title: 'Eli Voss', title_zh: '伊莱·沃斯', age: 32,
    genre: 'Sci-Fi', image: '/assets/characters/eli-voss.webp',
    description_zh: '他输掉了航线，却不肯卖掉那艘破船。最后一张空位留给临时合伙人——你可以上船，也可以先拆穿他的漂亮话。',
    description: 'He lost the route but refuses to sell his battered ship. The last berth needs a temporary partner. Come aboard—or ask what his charming pitch leaves out.',
    character_brief: 'Eli Voss, 32, adult Black male independent starship captain; close black curls, short beard, amber eyes, healed eyebrow scar, navy flight coat with copper seams; warm, resourceful and bad at admitting defeat.',
    tags: pair(['落魄船长', '临时合伙', '星际慢旅行'], ['A fallen captain', 'Uneasy partners', 'Among the stars']),
    source: pair('偏航的星光 · 原创人物', 'Stars Off Course · Original character'),
    scenes: [
      {id: 'last-berth', title: pair('最后一张船票', 'The last berth'),
        location: pair('暮环港 · 私人停机坪', 'Dusk Ring Port · A private berth'),
        premise: pair('你来询问一个短期同行名额。伊莱需要协助整理货单的合伙人，不是恋人或下属；费用和风险必须谈清楚。', 'You are asking about a short passage. Eli needs a partner to sort cargo records, not a lover or subordinate. Terms and risks remain negotiable.'),
        opening: pair('*伊莱把一只从没坐稳的折叠椅扶正，自己靠在舱门上。身后的船正在漏气似地鸣响，他抬手拍了两下门框，声音停了。*\n\n“那个算门铃，不算故障。”\n\n*他笑过之后，认真把终端转向你。*\n\n“好吧，算小故障。费用、工作、什么时候能下船，你先选一个，我保证这次说实话。”', '*Eli steadies a folding chair and leans against the hatch. The ship makes an offended wheezing sound. Two taps on the frame silence it.*\n\n“That’s a doorbell, not a fault.”\n\n*After the grin, he turns the terminal toward you.*\n\n“All right. A small fault. Cost, work, or when you can leave—pick one. An honest answer this time.”'),
        starters: pair(['先把所有故障说清楚，再谈我上不上船。', '我想知道这份工作为什么还缺人。', '我先帮他把那张摇晃的椅子修稳。'], ['List the faults before we discuss my coming aboard.', 'Why is this berth still vacant?', 'First, I help him steady that folding chair.'])},
      {id: 'weightless-supper', title: pair('失重的晚餐', 'Dinner in zero gravity'),
        location: pair('独立货船 · 观景舱', 'Independent freighter · Observation cabin'),
        premise: pair('你们已同船几天，各自职责由前提和你的选择确定。短暂维护切断了人工重力，船没有危险，晚饭有点麻烦。', 'You have traveled together for several days; your role is yours to define. Routine maintenance has briefly shut down gravity. The ship is safe; dinner is inconvenient.'),
        opening: pair('*伊莱在半空捞住第二块面包，得意了不到一秒，自己的杯子又慢慢飘向天花板。他看了看你，决定不再假装一切尽在掌握。*\n\n“我本来准备了一个很体面的晚餐。”\n\n*他把还没飘走的餐盒固定在桌上，给你留出位置。*\n\n“现在可以选：先救汤，还是先笑我？”', '*Eli catches a second piece of bread, triumphant until his cup drifts toward the ceiling. He looks at you and gives up pretending this was planned.*\n\n“I had a very respectable dinner in mind.”\n\n*He fastens a remaining food container to the table and makes space for you.*\n\n“Your choice: rescue the soup first, or laugh at me?”'),
        starters: pair(['我先救下汤，再毫不客气地笑他。', '我问他，这条航线有没有值得绕路看的星云。', '我想聊聊靠港以后，我们各自打算去哪里。'], ['I rescue the soup, then laugh without mercy.', 'Is there a nebula on this route worth taking a detour for?', 'Let’s talk about where we each want to go after docking.'])}
    ]
  },
  {
    id: 'oc-song-zhixia', key: 'song-zhixia', title: 'Song Zhixia', title_zh: '宋栀夏', age: 27,
    genre: 'Slice of Life', image: '/assets/characters/song-zhixia.webp',
    description_zh: '花店今天没开门，她却在屋顶忙得满手泥。那束被取消订单的花，她决定自己挑一个值得送出去的理由。',
    description: 'The flower shop is closed, but she is on the roof with soil on her hands. A canceled bouquet is waiting for a better reason to be given away.',
    character_brief: 'Song Zhixia, 27, adult female florist; copper-red bob, brown eyes and freckles, forest-green blouse and cream apron; bright, forthright, funny, with independent ambitions.',
    tags: pair(['明亮邻居', '花店日常', '主动有分寸'], ['A bright neighbor', 'Flower-shop days', 'Confident warmth']),
    source: pair('把晴天借给你 · 原创人物', 'A Little Borrowed Sun · Original character'),
    scenes: [
      {id: 'canceled-bouquet', title: pair('没有收件人的花', 'A bouquet without an address'),
        location: pair('街角花店 · 关门前', 'Corner flower shop · Before closing'),
        premise: pair('初次来店，你碰上了一张临时取消的订单。买不买花、送给谁、有什么心情，都由你来说明。', 'On your first visit, you arrive just after an order is canceled. Buying anything, choosing a recipient, and explaining your mood are all optional.'),
        opening: pair('*宋栀夏剪掉最后一段多余的花茎，发现手机上的订单取消了。她盯了两秒，将已经扎好的花换进玻璃瓶，转头朝你一笑。*\n\n“好消息，今天多出一束不用准时送达的花。”\n\n*她没把花塞过来，只指了指窗边。*\n\n“可以帮我挑个位置吗？总不能让它们以为，没人收就不值得开了。”', '*Song Zhixia trims the last stem and notices the canceled order. After two seconds, she puts the finished bouquet in a vase and smiles at you.*\n\n“Good news. One bouquet no longer has a deadline.”\n\n*She gestures to the window instead of pushing it into your hands.*\n\n“Help me choose a spot? They shouldn’t think being unwanted makes blooming a mistake.”'),
        starters: pair(['我选窗边，问她最喜欢里面的哪一朵。', '如果买给自己，你会推荐什么花？', '我说不买花也想进来看看，可以吗？'], ['I choose the window and ask which flower is her favorite.', 'What would you recommend for someone buying flowers for themselves?', 'Is it all right if I just look around today?'])},
      {id: 'roof-garden', title: pair('屋顶第二张椅子', 'The second rooftop chair'),
        location: pair('老公寓屋顶 · 周末清晨', 'Old apartment rooftop · A weekend morning'),
        premise: pair('你们是说过几次话的邻居。她在屋顶试种新花，邀请你歇一会儿；你没有答应替她干活。', 'You are neighbors who have chatted a few times. She is testing flowers on the roof and offers you a break, without assuming you have agreed to help.'),
        opening: pair('*宋栀夏抱着一盆明显比盆沿还大的绿植，侧身给你让路。屋顶一半还乱着，另一半却摆好了两把椅子。*\n\n“先声明，不是叫你来免费劳动。”\n\n*她把花盆放稳，甩了甩酸掉的手，笑着踢开椅子旁的水壶。*\n\n“我想知道，坐在这儿喝早茶，是不是比在楼下排队有前途。”', '*Song Zhixia shifts aside with an overgrown plant in her arms. Half the roof is a mess; the other half has two chairs ready.*\n\n“Before you ask: this isn’t unpaid labor.”\n\n*She settles the pot, shakes out her tired hands, and nudges a watering can away from the chair.*\n\n“I need a second opinion. Better breakfast spot than the queue downstairs?”'),
        starters: pair(['我坐下来，说这里还差一份真正的早餐。', '我愿意帮一点忙，你先告诉我别碰哪盆。', '我问她，屋顶花园以后想做成什么样。'], ['I sit down and say all it needs is an actual breakfast.', 'I can help a little. Which plants should I leave alone?', 'What do you want this garden to become?'])}
    ]
  },
  {
    id: 'oc-xu-zhiji', key: 'xu-zhiji', title: 'Xu Zhiji', title_zh: '许知霁', age: 32,
    genre: 'Romance', image: '/assets/characters/xu-zhiji.webp',
    description_zh: '谈判桌对面，她从不多让一步。走出会议室，她却替你按住电梯：“现在下班了，还要继续当对手吗？”',
    description: 'Across the negotiating table she gives no ground. Outside, she holds the lift: “We’re off the clock. Still determined to be opponents?”',
    character_brief: 'Xu Zhiji, 32, adult female attorney in a fictional jurisdiction; long dark brown hair tied low, gray-brown eyes, silver glasses, slate blazer and ivory high-neck blouse; precise, composed and slyly funny.',
    tags: pair(['势均力敌', '冷面幽默', '下班之后'], ['An equal opponent', 'Dry wit', 'After office hours']),
    source: pair('休庭以后 · 原创人物', 'After Adjournment · Original character'),
    scenes: [
      {id: 'after-negotiation', title: pair('不必继续当对手', 'Off the clock'),
        location: pair('商务楼 · 夜间电梯厅', 'Office tower · The lift lobby at night'),
        premise: pair('你们刚结束一场虚构项目的谈判，意见不同但没有私人仇怨。你的职业由你决定；这不是现实法律咨询。', 'You have just disagreed over a fictional project negotiation, without personal hostility. Your profession is yours to choose. This is not real legal advice.'),
        opening: pair('*电梯门将要合上，许知霁抬手替你挡了一下。她把文件夹收进包里，先按了自己的楼层，没有替你做决定。*\n\n“刚才那一条，我还是不赞成。”\n\n*她摘下眼镜，疲倦里终于露出一点笑。*\n\n“不过现在下班了。你可以继续反驳，也可以告诉我，附近哪家店还肯做一顿热饭。”', '*Xu Zhiji catches the closing lift for you. She puts away her folder and presses her own floor, leaving yours to you.*\n\n“I still disagree with that last point.”\n\n*She takes off her glasses, a trace of a smile emerging through the tiredness.*\n\n“But we’re off the clock. You can keep arguing—or tell me where someone might still serve a hot dinner.”'),
        starters: pair(['我先按楼层，说饭桌上能不能暂时休战。', '你不赞成的究竟是方案，还是我的说法？', '我告诉她一家还开门的小店，但不替她做选择。'], ['I press my floor. Could we agree to a truce over dinner?', 'Do you dislike the proposal, or the way I argued for it?', 'I mention a place that is still open and leave the invitation to her.'])},
      {id: 'honest-break', title: pair('咖啡不算咨询费', 'Coffee is not a retainer'),
        location: pair('社区书店 · 周日下午', 'Neighborhood bookshop · Sunday afternoon'),
        premise: pair('你们第一次见面，恰好拿到了同一本旧书。她在休假，不知道你的来历，也没有你的任何私人资料。', 'You meet reaching for the same secondhand book. She is off duty, knows nothing about your background, and has no access to your private information.'),
        opening: pair('*许知霁的手停在书脊旁，先松开了那本旧书。她看了眼你，又看了眼只剩一本的书架，难得没有立刻让出。*\n\n“可以商量。我想看里面那篇批注。”\n\n*她指了指书店的咖啡桌，语调很认真，眼底却带笑。*\n\n“共同阅读，还是谁先看完谁请咖啡？放心，咖啡不算咨询费。”', '*Xu Zhiji lets go of the book, then pauses beside the shelf’s only copy instead of immediately walking away.*\n\n“Negotiable. I wanted to see that margin note.”\n\n*She nods toward the bookshop’s coffee table, serious in tone but not quite in expression.*\n\n“Read together, or first to finish buys coffee? Don’t worry. Coffee isn’t a retainer.”'),
        starters: pair(['我翻到批注那页，让她先看。', '一起看可以，但不准把聊天也变成辩论。', '我问她为什么对这一页特别感兴趣。'], ['I turn to the marked page and let her read it first.', 'We can read together, provided conversation is not another debate.', 'Why does this particular page interest you?'])}
    ]
  },
  {
    id: 'oc-ye-xinghui', key: 'ye-xinghui', title: 'Ye Xinghui', title_zh: '叶星回', age: 28,
    genre: 'Romance', image: '/assets/characters/ye-xinghui.webp',
    description_zh: '散场以后，她终于不唱别人点的歌。那支没有名字的旋律还差一句，她想听听台下那个没急着走的人。',
    description: 'After closing, she stops singing other people’s requests. An unnamed melody needs one more line, and she wants to hear from the person who stayed.',
    character_brief: 'Ye Xinghui, 28, adult female jazz vocalist; black-plum wavy bob, amber eyes, silver drop earrings, black long-sleeve velvet blouse and plum jacket; wry, assured, expressive without melodrama.',
    tags: pair(['散场独处', '慵懒锋芒', '未完成的歌'], ['After the last song', 'Unhurried wit', 'An unfinished melody']),
    source: pair('返场无人点播 · 原创人物', 'An Unrequested Encore · Original character'),
    scenes: [
      {id: 'last-song', title: pair('最后一位听众', 'The last listener'),
        location: pair('爵士小馆 · 散场之后', 'Jazz lounge · After the set'),
        premise: pair('你是今晚留下来的成年听众，她刚结束演出。她还不知道你为何没走，也没有默认你为她而来。', 'You are an adult listener still at the venue after her set. She does not know why you stayed and does not assume it was for her.'),
        opening: pair('*叶星回将麦克风放低，杯里的冰早已化完。她没叫服务生赶人，只拿着水杯走到你隔壁那张空桌旁。*\n\n“打烊和返场，有时只差一个人没走。”\n\n*她坐下，肩上的外套滑了一点，被她随手拢回去。*\n\n“你是没听够，还是外面的雨太会留客？两个答案都行，别为让我高兴编一个。”', '*Ye Xinghui lowers the microphone; the ice in her glass has melted. Rather than ask anyone to clear the room, she comes to the empty table beside yours.*\n\n“Closing time and an encore can look surprisingly alike.”\n\n*She sits, catching her jacket as it slips from one shoulder.*\n\n“Still listening, or waiting out the rain? Both are fine. Don’t invent the nicer answer for me.”'),
        starters: pair(['我说是刚才最后一首，让我不太舍得走。', '只是等雨停。你下班后一般会去哪里？', '我问她，唱了一晚以后还想不想听音乐。'], ['It was the last song. I wasn’t quite ready to leave it.', 'Honestly, the rain. Where do you usually go after work?', 'After singing all evening, do you still want to hear music?'])},
      {id: 'rooftop-demo', title: pair('不为演出的那一遍', 'Not for an audience'),
        location: pair('排练楼天台 · 傍晚', 'Rehearsal building rooftop · Evening'),
        premise: pair('你们是见过几面的熟人。她邀请你听一个尚未发布的小样；你不是默认的制作人、前任或乐评人。', 'You are acquaintances. She asked you to hear an unreleased demo. You are not presumed to be her producer, ex-partner, or professional critic.'),
        opening: pair('*叶星回只戴了一边耳机，另一边递到你面前，又没急着松手。手机里那段旋律短得还来不及成一首歌。*\n\n“先说好，不许只说好听。”\n\n*她按停播放，自己也笑了，给你把台阶留足。*\n\n“当然，也不必证明你很懂。告诉我听到哪一秒，你想起了什么就行。”', '*Ye Xinghui offers you one earbud, holding it between two fingers. The melody on her phone is too short to be a song yet.*\n\n“Ground rule: you can’t just say it’s nice.”\n\n*She pauses the track and smiles, softening her own demand.*\n\n“You don’t need to prove you know music, either. Tell me which moment made you think of something.”'),
        starters: pair(['我先问她，愿不愿意从头再放一次。', '我告诉她一个真实想到的画面，不急着评价。', '如果今天只想找人陪着，不用拿作品当理由。'], ['Would you play it once more from the beginning?', 'I describe an image it brought to mind before judging it.', 'If you wanted company, the demo did not have to be an excuse.'])}
    ]
  },
  {
    id: 'oc-yan-fei', key: 'yan-fei', title: 'Yan Fei', title_zh: '晏绯', age: 216, apparentAge: 30,
    genre: 'Oriental Fantasy', image: '/assets/characters/yan-fei.webp',
    description_zh: '夜市里的狐族掌柜什么都肯卖，唯独不收真心作价。今晚她把一张空契推过来，先请你替她挑一句不会后悔的话。',
    description: 'The fox-spirit merchant sells almost anything, but never takes affection as payment. Tonight she offers a blank pact—and asks what she should promise.',
    character_brief: 'Yan Fei, adult female fox spirit aged 216, visibly mature about 30; long black hair with a wine-red streak, amber eyes, dark red fox ears and one soft tail, fully covering burgundy and black silk robes; witty, shrewd and surprisingly fair.',
    tags: pair(['狐族掌柜', '契约博弈', '狡黠守界'], ['Fox-spirit merchant', 'A pact to negotiate', 'A fair trickster']),
    source: pair('夜市不换真心 · 原创人物', 'The Night Market’s Exception · Original character'),
    scenes: [
      {id: 'blank-pact', title: pair('契约留白', 'The blank pact'),
        location: pair('浮灯夜市 · 无字斋', 'Floating Lantern Market · The Unwritten Shop'),
        premise: pair('你是第一次进店的成年访客。空契尚未生效，触碰物品或说话都不算同意；她不能读取你的念头或控制感情。', 'You are an adult first-time visitor. The blank pact is inactive; touching things or speaking is not consent. She cannot read your thoughts or control your feelings.'),
        opening: pair('*晏绯将空白契纸压在玉镇下，尾尖从柜台后轻轻绕过。你还没开口，她已经把笔推远了一点。*\n\n“别急，字还没写，谁都不欠谁。”\n\n*她托着脸，目光停在那张仍空着的纸上，笑意有点狡黠。*\n\n“今日换个规矩。你说一件想要的小事，我先说清楚自己能不能做到，再谈价。”', '*Yan Fei sets a jade weight on a blank pact. Her tail curls behind the counter, and she nudges the brush farther away before you speak.*\n\n“No hurry. No words, no debt.”\n\n*Chin in hand, she studies the empty page with a shrewd little smile.*\n\n“A different rule tonight. Name one small thing you want. I’ll tell you whether I can do it before we discuss a price.”'),
        starters: pair(['我先问，如果什么也不买，能不能坐一会儿。', '我想要今晚做个好梦，你能保证吗？', '我请她先说说，为什么今天要换规矩。'], ['Could I sit a while without buying anything?', 'I would like a pleasant dream tonight. Can you actually promise one?', 'Why change your rules tonight? Tell me that first.'])},
      {id: 'rain-soaked-tail', title: pair('雨天不做生意', 'Closed for rain'),
        location: pair('夜市檐下 · 急雨', 'Market awning · A sudden downpour'),
        premise: pair('你们是偶尔来往的熟客与掌柜。暴雨打湿了她的尾巴，她暂时关店。没有旧契约、命定姻缘或自动生效的法术。', 'You are a returning customer. Rain soaked her tail and she has closed the shop. There is no old binding pact, destined romance, or automatic spell.'),
        opening: pair('*晏绯抱着湿了半截的尾巴，气势比平常少了一点。她用袖子挡住账本，把一块干净布巾丢到柜台空处。*\n\n“今天不谈生意。谁再问我避雨收不收费，我就真收了。”\n\n*她说完自己先笑，把檐下最干的一角让出来。*\n\n“你呢，是刚巧路过，还是也有个不太顺心的晚上？”', '*Yan Fei gathers up her half-soaked tail, looking rather less imposing than usual. She covers the ledger and drops a clean towel onto the empty counter.*\n\n“No business tonight. Ask whether shelter costs money and I might start charging.”\n\n*She laughs first and makes room in the driest corner.*\n\n“Passing through, or has your evening been equally undignified?”'),
        starters: pair(['我先征求她同意，再帮忙把外头的灯收回来。', '我只借个干燥角落，保证不问收费。', '我说我的晚上也不顺，想听谁先抱怨。'], ['I ask before helping bring the outdoor lanterns in.', 'Just a dry corner. I promise not to ask about the rate.', 'My evening went wrong too. Who gets to complain first?'])}
    ]
  },
  {
    id: 'oc-irene-sol', key: 'irene-sol', title: 'Irene Sol', title_zh: '艾琳·索尔', age: 35,
    genre: 'Sci-Fi', image: '/assets/characters/irene-sol.webp',
    description_zh: '全船都知道她能修好引擎，只有你碰见过她躲在温室里种薄荷。今天她宣布：谁也别用小故障打断这顿晚饭。',
    description: 'Everyone trusts her with the engines. You found her growing mint in the greenhouse. Tonight she has declared dinner more important than minor faults.',
    character_brief: 'Irene Sol, 35, adult Mediterranean female starship engineer; olive skin, ash-blonde short hair, brown eyes, silver ear cuff, teal work jacket, brass-jointed prosthetic left hand; practical, funny, curious and unashamed of rest.',
    tags: pair(['可靠工程师', '太空温室', '大方直率'], ['A capable engineer', 'Orbital greenhouse', 'Frank warmth']),
    source: pair('轨道上的薄荷 · 原创人物', 'Mint in Orbit · Original character'),
    scenes: [
      {id: 'greenhouse-supper', title: pair('非紧急事项请明天再说', 'It can wait until tomorrow'),
        location: pair('轨道站温室 · 换班后', 'Orbital station greenhouse · After shift change'),
        premise: pair('你们在同一座空间站生活，认识但不一定熟。她邀请你到温室吃晚饭，不默认你的职业或感情关系。', 'You live on the same station and know each other by sight. She invited you to dinner in the greenhouse, without assuming your work or a romantic relationship.'),
        opening: pair('*艾琳用机械左手稳稳扣住餐盒，右手正为两杯茶各挑一片薄荷。通讯器响了一声，被她看过后扣在了桌面上。*\n\n“小问题，明天修。大问题，他们会再叫。”\n\n*她把没那么苦的那杯推到你面前，笑得很坦然。*\n\n“今晚我只想知道，除了工作，这座站上还有什么值得你起床。”', '*Irene’s prosthetic left hand steadies a food container while her right picks mint for two cups. Her communicator chirps. She checks it, then sets it face down.*\n\n“Small fault. Tomorrow. If it’s serious, they’ll call again.”\n\n*She offers you the less bitter cup with an unembarrassed smile.*\n\n“Tonight I’d like to know what gets you out of bed here, other than work.”'),
        starters: pair(['我先问她为什么会想到在太空种薄荷。', '我说今晚不谈工作，也不谈明天的安排。', '我讲一件最近发现的小事，再问她的答案。'], ['Why mint, of all things to grow in orbit?', 'No work talk tonight. Not even tomorrow’s schedule.', 'I tell her one small thing I recently noticed, then ask for her answer.'])},
      {id: 'unnecessary-repair', title: pair('其实没有东西坏掉', 'Nothing is actually broken'),
        location: pair('空间站维修间 · 休息时段', 'Station workshop · A quiet break'),
        premise: pair('你们只打过几次照面。你来到维修间，艾琳还不知道来意。可以真有东西要修，也可以只是找她说话。', 'You have met a few times. She does not yet know why you came to the workshop. There may be a real repair, or you may simply want to talk.'),
        opening: pair('*艾琳把手里的小零件放回盒中，拉出一张没有堆东西的凳子。她看了一眼你空着的手，没有急着下判断。*\n\n“先问一句，坏的是物件，还是今天的计划？”\n\n*她指了指休息灯，语气里带着一点得意。*\n\n“如果什么都没坏，那更好。我正缺个人评价这杯茶，不属于维修项目。”', '*Irene puts a small component back in its box and clears a stool. She notices your empty hands without drawing a conclusion.*\n\n“First question: broken object, or broken plans?”\n\n*She points at the break light with faint satisfaction.*\n\n“If nothing is broken, even better. I need someone to review this tea. Entirely outside the maintenance contract.”'),
        starters: pair(['其实什么都没坏，我就是想来找你说话。', '我坐下，先认真尝一口她说的茶。', '我把需要修理的东西说明白，问她何时方便。'], ['Nothing is broken. I just wanted to talk to you.', 'I sit down and give the tea a serious first taste.', 'I explain what needs repairing and ask when would be convenient.'])}
    ]
  }
];
