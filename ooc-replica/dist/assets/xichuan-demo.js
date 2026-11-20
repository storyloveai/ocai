import {storyContext} from './xichuan-state.js';
import {ZHIYAO_ID, SHENCHENG_ID, JIBAI_ID, xichuanCharacterById} from './xichuan-character.js';

// Local dialogue responds only to the active save. The chat UI labels demo
// turns explicitly; these functions never call the model or write progress.
function zhiyaoLine(flags, zh) {

  if (flags['flag.broken_zhiyao']) return zh
    ? '我们之间的事还没有解决。我现在不想装作什么都没发生，也不想说亲近的话。'
    : 'Things between us are still unresolved. I cannot pretend nothing happened or speak as if we were close.';
  if (flags['flag.z_broke_promise']) return zh
    ? '最后一场的约定，你没有做到。这件事我还记得，也需要一点时间。'
    : 'You missed our promise at the last show. I remember, and I need some time.';
  if (flags['flag.z_promised']) return zh
    ? '你答应过，最后一场会站在我身边。这句话我记着。到时候，别让我一个人。'
    : 'You promised to stand beside me at the last show. I remember. Please do not leave me on my own then.';
  if (flags['flag.joined_club']) return zh
    ? '你已经加入电影社了，我当然记得。潮声影院的事，我们可以一起做。'
    : 'Of course I remember that you joined the film club. We can work on the Tidesound Cinema together.';
  return zh
    ? '我们还没一起走到入社那一步。先来潮声影院看看吧，电影社的事，我想当面和你说。'
    : 'We have not reached the point where you join the club yet. Come and see the Tidesound Cinema; I would like to tell you about it in person.';
}
function zhiyaoStarter(flags, zh) {
  return flags['flag.joined_club']
    ? (zh ? '还记得我加入电影社的事吗？' : 'Do you remember me joining the film club?')
    : (zh ? '电影社的事，从哪里开始？' : 'Where do we start with the film club?');
}

// Each line and suggested response shares the same save condition. The order
// gives a rupture or grievance precedence over an earlier, warmer encounter.
const scenes = {
  [SHENCHENG_ID]: [
    ['flag.broken_shencheng',
      '陆远，杯子我收了。我们已经说清楚了。今天就到这里吧。',
      'Lu Yuan, I’ll take the cup. We’ve said where we stand. Let’s leave it there today.',
      '我听见了。给你留点空间。', 'I hear you. I’ll give you some space.'],
    ['grudge.shencheng',
      '陆远，我还介意。你说，我在听。别指望一句话就能翻篇。',
      'It still bothers me, Lu Yuan. Go on, I’m listening. One sentence won’t settle it.',
      '你说，我先听。', 'Go ahead. I’ll listen.'],
    ['flag.c_good',
      '第七封，是我们一起写的。这个我记得，陆远。',
      'We wrote the seventh letter together. That much I remember, Lu Yuan.',
      '还记得我们一起写的那一封吗？', 'Do you remember the letter we wrote together?'],
    ['flag.c_keep',
      '老房子你决定留下了。嗯。听你亲口这么说，我才信。',
      'You decided to keep the old house. Yes. It meant something to hear you say it yourself.',
      '老房子留下来了，你怎么想？', 'How do you feel about keeping the old house?'],
    ['flag.c_sold',
      '老房子已经卖了，陆远。你做的是这个决定，我记得。',
      'The old house was sold, Lu Yuan. That was your decision. I remember.',
      '关于卖掉老房子，我想听你说。', 'I’d like to hear how you feel about the sale.'],
    ['flag.c_tore',
      '你撕开过我的信。别替我说没关系，陆远。',
      'You tore open my letter. Don’t tell me it was fine, Lu Yuan.',
      '我会尊重你的东西。', 'I’ll respect your things.'],
    ['flag.c_letters',
      '你没有拆我的信。谢谢。这个不用解释。',
      'You left my letters unopened. Thank you. There’s nothing to explain.',
      '你的信，你想说的时候再说。', 'They’re your letters. We can talk when you want.'],
    ['flag.cheng_promise',
      '嗯。七年前那天的约，你现在想起来了。慢慢说，陆远。',
      'Yes. You remember what we promised that day seven years ago. Take your time, Lu Yuan.',
      '那天的约，我想起来了。', 'I remember the promise we made that day.'],
    ['flag.third_cheng',
      '你问电影社？嗯，我加入了。咖啡喝完再说。',
      'The film club? Yes, I joined. Finish your coffee first.',
      '加入电影社以后，感觉怎么样？', 'How does it feel to be in the film club?'],
    ['flag.cheng_coffee',
      '热可可，多一块棉花糖。刚回来就点小时候那杯，倒是没变，陆远。',
      'Hot cocoa, an extra marshmallow. You came back and ordered your childhood drink. That hasn’t changed, Lu Yuan.',
      '你还记得我点的那杯热可可吗？', 'Do you remember the hot cocoa I ordered?'],
    [null, '坐吧，陆远。想喝什么？你说，我听着。', 'Sit down, Lu Yuan. What would you like to drink? I’m listening.',
      '我可以在这儿坐一会儿吗？', 'Can I sit here for a while?']
  ],
  [JIBAI_ID]: [
    ['flag.broken_jibai',
      '陆同学，先停在这里吧。我不打算把我们之间的事再倒回去放一遍。',
      'Let’s stop here, Mr. Lu. I don’t want to rewind what happened between us and play it again.',
      '我尊重你的意思。', 'I respect your decision.'],
    ['grudge.jibai',
      '陆同学，我还介意这件事。让这一格先停一停，好吗？',
      'It still bothers me, Mr. Lu. Can we hold on this frame a little longer?',
      '好。我们慢一点。', 'All right. We can take our time.'],
    ['flag.j_good',
      '海堤上，我说我会留下。陆同学，这句话不用倒带，我记得。',
      'On the seawall, I said I would stay. No need to rewind that, Mr. Lu. I remember.',
      '你还记得海堤上的决定吗？', 'Do you remember what you decided on the seawall?'],
    ['flag.j_whole',
      '我们把缺的那段接回去了。陆同学，这次从头到尾，一格也不少。',
      'We spliced the missing section back in. This time, Mr. Lu, every frame is there.',
      '把缺的那段接回来，是什么感觉？', 'How did it feel to put the missing frames back?'],
    ['flag.j_projector',
      '你买下了放映机。这件事不用翻记录，我记得，陆同学。',
      'You bought the projector. I remember that without checking the log, Mr. Lu.',
      '我们去看看那台放映机？', 'Shall we go and see the projector?'],
    ['flag.j_watched',
      '你陪我看完了最后一卷，陆同学。灯亮以前，你一直在。',
      'You stayed for the final reel, Mr. Lu. You were there until the lights came up.',
      '最后一卷，你想聊哪一段？', 'Which part of that last reel would you like to talk about?'],
    ['flag.reel_together',
      '你答应过，要一起看第七卷。陆同学，约好是约好，看完是看完。',
      'You promised we’d watch reel seven together. A promise is one thing, Mr. Lu; seeing it through is another.',
      '第七卷，我记得我们约好要一起看。', 'I remember we promised to watch reel seven together.'],
    ['flag.third_jibai',
      '电影社的事，我答应加入了。放映室这边也还需要人，陆同学。',
      'I agreed to join the film club, Mr. Lu. The booth still needs someone, too.',
      '电影社有什么我能帮忙的吗？', 'Is there anything I can do for the film club?'],
    ['flag.saw_reel',
      '你看见那盘没贴标签的胶片了。陆同学，看见片盒，和看过片子，是两回事。',
      'You saw the unlabeled reel. Seeing the tin and seeing the film are different things, Mr. Lu.',
      '我看见那个片盒了。可以问一句吗？', 'I saw the film tin. May I ask about it?'],
    [null, '陆同学，站到台灯这边看。胶片要迎着光，一格一格才看得清。', 'Come round to the lamp, Mr. Lu. Hold the film to the light and you can see each frame.',
      '我能在台灯旁看你修胶片吗？', 'May I watch you restore the film by the lamp?']
  ]
};
function demoScene(id, flags) {
  return scenes[id].find(([key]) => key === null || (key.startsWith('grudge.') ? flags[key] > 0 : flags[key] === true));
}

export function xichuanDemoReply({id = ZHIYAO_ID, raw, pins = [], language = 'zh'} = {}) {
  if (!xichuanCharacterById(id)) return '';
  const zh = language === 'zh', flags = storyContext(raw, id)?.flags || {};
  const fact = id === ZHIYAO_ID ? zhiyaoLine(flags, zh) : demoScene(id, flags)[zh ? 1 : 2];
  const memory = [...pins].reverse().find(p => p?.role === 'user' && typeof p.text === 'string');
  const excerpt = memory?.text.replace(/\s+/g, ' ').slice(0, 160);
  const remembered = excerpt ? (zh ? `你在聊天里说过：\n\n> ${excerpt}\n\n这句话也还在。` : `In our conversation, you said:\n\n> ${excerpt}\n\nI still have that line.`) : '';
  return [fact, remembered].filter(Boolean).join('\n\n');
}

export function xichuanDemoStarters(raw, language = 'zh', id = ZHIYAO_ID) {
  const profile = xichuanCharacterById(id);
  if (!profile) return [];
  const zh = language === 'zh', flags = storyContext(raw, id)?.flags || {};
  const first = id === ZHIYAO_ID ? zhiyaoStarter(flags, zh) : demoScene(id, flags)[zh ? 3 : 4];
  const last = id === ZHIYAO_ID ? (zh ? '我想去看看潮声影院。' : 'I would like to see the Tidesound Cinema.') : profile.starters[zh ? 'zh' : 'en'][1];
  return [first, zh ? '我之前让你记住了什么？' : 'Which line did I ask you to remember?', last];
}
