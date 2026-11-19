import {line, makeNight} from './seven-nights-format.js';

export default makeNight({
  number:2, scene:'ep2_car',
  title:line("Night Two · The Ledger", "第二夜 · 暗账"),
  subtitle:line("Maison Vance Private Auction · 9:40 PM", "纪氏私人拍卖行 · 晚 9:40"),
  artDescriptions:[
    line("Espresso, cashmere and a key in the empty morning study.", "晨雨书房里的咖啡、羊绒衫和钥匙。"),
    line("Julian watches the mezzanine from the auction rail.", "纪沉从拍卖行栏杆旁望向楼座。"),
    line("His shoulder slips between you and the rival collector.", "纪沉侧身挡在你与仇家之间。"),
    line("Amber lights cross his face in the rain-streaked backseat.", "车窗雨痕与琥珀街灯映在他侧脸上。")
  ],
  location:line("8:12 AM · Empty Penthouse", "早 8:12 · 空荡顶层"),
  narration:line("You wake to an empty penthouse—warm espresso, a folded black cashmere sweater, and four words in ink: “Stay inside. —J.” Naturally, you don’t.", "醒来时顶层空无一人——温热的意式浓缩、叠好的黑羊绒衫，和一张字条：「留在屋里。——J.」但你偏偏推门走了出去。"),
  close:line("“I told you to stay behind my lock. Instead you walk straight into the one room full of men hunting you.”", "「我叫你待在门锁后面。你倒好，直接走进满屋子找你算账的人堆里。」"),
  wide:line("“Don’t move a muscle. When Vance’s name enters the room, nobody touches what’s standing beside me.”", "「别动。只要纪沉站在这里，这间屋里就没人敢碰我身边的人。」"),
  prompt:line("The rival collector reaches for your wrist in the dim gallery—before Julian steps smoothly between you. How do you play it?", "暗处那个仇家刚伸手要扣住你的手腕，纪沉已经不动声色挡在你身前。你怎么配合这一局？"),
  options:[
    {id:'claim_name', pattern:"under.*roof|vance.s (roof|name)|your name|sleeve|名下|衣袖|挽住|借势",
      player:line("Slip your hand into Julian’s sleeve. “Tell your boss I’m under Vance’s roof tonight.”", "顺手挽住纪沉的衣袖。「回去告诉你老板，今晚我在纪沉名下。」"),
      reaction:line("“Careful. Play that role too well and I won’t let you drop it after seven nights.”", "「小心点。这出戏演得太像，七夜之后我可未必肯放你退场。」"),
      tags:[line("Claimed His Name", "借势反击"), line("Rival Retreated", "仇家退场")],
      draft:line("Back in the gallery, you didn’t deny a word I said. How far are you willing to play this?", "刚才在拍卖行，我说我在你名下，你一个字都没否认。你打算陪我演到哪一步？")},
    {id:'expose_ledger', pattern:"ledger|stole|traitor|leverage|暗账|筹码|内鬼|偷",
      player:line("Step beside him instead of behind him. “He wants the missing ledger—and I know who actually stole it.”", "没有躲在他身后，而是与他并肩。「他要那本失踪的暗账——我知道真正偷走它的人是谁。」"),
      reaction:line("“Smart girl. You just turned a trap into my leverage. Get in the car—now.”", "「聪明。你刚把死局翻成了我的筹码。现在上车。」"),
      tags:[line("Stood Equal", "并肩而立"), line("Named the Traitor", "掌握筹码")],
      draft:line("The man who stole the ledger works inside your own house, Julian.", "偷走暗账的人，就在你纪氏内部。")},
    {id:'cold_warning', pattern:"leash|rescue|owe|answers|束缚|真相|救场|锁住",
      player:line("Meet Julian’s eyes coldly. “I didn’t ask you to rescue me. You owe me answers, not a leash.”", "冷眼直视纪沉。「我没求你来救场。你欠我的是真相，不是把我锁起来。」"),
      reaction:line("“If that were a leash, you wouldn’t be standing here. Come with me—and I’ll give you every answer you can handle.”", "「要是真想锁住你，你今晚根本出不了门。跟我上车——你想听的真相，我全给你。」"),
      tags:[line("Refused the Leash", "拒绝束缚"), line("Demanded Truth", "逼问真相")],
      draft:line("You promised answers in the car. Start with why they’re terrified of you.", "你在画廊答应给我真相。先说——他们为什么那么怕你？")},
  ],
  custom:{id:'custom',reaction:line("“Tell me the rest once the doors close.”", "「等车门关上，把剩下的告诉我。」"),
    tags:[line('Your Own Terms','自定条件')],draft:line('{playerText}','{playerText}')},
  ending:[
    line("Rain sheets across the tinted glass. Two blocks back, a dark sedan matches every turn through the midnight traffic.", "暴雨冲刷着深色车窗。两个街区外，一辆黑车死死咬着你们的尾灯。"),
    line("“Lock your door and sit closer. Tonight you see what’s buried under Maison Vance—and why I gave you my ring three years ago.”", "「落锁，坐近一点。今晚我带你去地下藏室——看看三年前我把印章留给你的真正原因。」")
  ],
  cta:line("Talk in the rain-soaked backseat", "留在暴雨车厢里和他聊")
});
