import {storyContext} from './xichuan-state.js';

// A disclosed, local walkthrough of the real state bridge. No inference calls,
// invented game events, or writes to relationship/game state happen here.
export function xichuanDemoReply({raw, pins = [], language = 'zh'} = {}) {
  const zh = language === 'zh', flags = storyContext(raw)?.flags || {};
  let fact;
  if (flags['flag.broken_zhiyao']) fact = zh
    ? '我们之间的事还没有解决。我现在不想装作什么都没发生，也不想说亲近的话。'
    : 'Things between us are still unresolved. I cannot pretend nothing happened or speak as if we were close.';
  else if (flags['flag.z_broke_promise']) fact = zh
    ? '最后一场的约定，你没有做到。这件事我还记得，也需要一点时间。'
    : 'You missed our promise at the last show. I remember, and I need some time.';
  else if (flags['flag.z_promised']) fact = zh
    ? '你答应过，最后一场会站在我身边。这句话我记着。到时候，别让我一个人。'
    : 'You promised to stand beside me at the last show. I remember. Please do not leave me on my own then.';
  else if (flags['flag.joined_club']) fact = zh
    ? '你已经加入电影社了，我当然记得。潮声影院的事，我们可以一起做。'
    : 'Of course I remember that you joined the film club. We can work on the Tidesound Cinema together.';
  else fact = zh
    ? '我们还没一起走到入社那一步。先来潮声影院看看吧，电影社的事，我想当面和你说。'
    : 'We have not reached the point where you join the club yet. Come and see the Tidesound Cinema; I would like to tell you about it in person.';
  const memory = [...pins].reverse().find(p => p?.role === 'user' && typeof p.text === 'string');
  const excerpt = memory?.text.replace(/\s+/g, ' ').slice(0, 160);
  const remembered = excerpt ? (zh ? `你在聊天里说过：\n\n> ${excerpt}\n\n这句话也还在。` : `In our conversation, you said:\n\n> ${excerpt}\n\nI still have that line.`) : '';
  return [fact, remembered].filter(Boolean).join('\n\n');
}

export function xichuanDemoStarters(raw, language = 'zh') {
  const zh = language === 'zh', flags = storyContext(raw)?.flags || {};
  const first = flags['flag.joined_club']
    ? (zh ? '还记得我加入电影社的事吗？' : 'Do you remember me joining the film club?')
    : (zh ? '电影社的事，从哪里开始？' : 'Where do we start with the film club?');
  return [first, zh ? '我之前让你记住了什么？' : 'Which line did I ask you to remember?', zh ? '我想去看看潮声影院。' : 'I would like to see the Tidesound Cinema.'];
}
