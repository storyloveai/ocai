import {line, makeNight} from './seven-nights-format.js';

export default makeNight({
  number:3, scene:'ep3_balcony',
  title:line("Night Three · Velvet Alibi", "第三夜 · 秘密印章"),
  subtitle:line("Maison Vance Underground Vault · 1:05 AM", "纪氏地下私密藏室 · 凌晨 1:05"),
  artDescriptions:[
    line("A velvet case, silver seal and faded photograph on walnut.", "胡桃木桌上的绒盒、银印章与旧照。"),
    line("Julian offers you the corner of the old photograph.", "纪沉递来旧照的一角。"),
    line("Julian stands at the balcony door as the curtain rises.", "纪沉站在风扬起帘子的阳台门旁。"),
    line("A crimson flare above the boat approaching the balcony.", "阳台下，红色信号弹照亮驶近的快艇。")
  ],
  location:line("1:05 AM · Private Vault", "凌晨 1:05 · 地下藏室"),
  narration:line("Inside the velvet case lies the matching half of your silver signet—and a faded photograph from the night the port went dark three years ago.", "炭黑天鹅绒盒里躺着另一半银印章——还有一张三年前港口停电那一夜的泛黄旧照。"),
  close:line("“You thought it was a debt. It wasn’t. That ring was the only way I could keep their eyes off you without dragging you into my world.”", "「你以为那只是个人情。不是。那枚印章，是我当年唯一能保住你、又不把你拖进我世界里的办法。」"),
  wide:line("“Now they found you anyway. So tell me—do you hate me for hiding it, or do we burn their house down together?”", "「可现在他们还是找上了你。所以告诉我——你是恨我瞒着你，还是跟我一起掀了他们的桌子？」"),
  prompt:line("His composure finally cracks by a millimeter. Rain beats against the balcony doors inches away. What do you give him?", "他向来密不透风的冷静终于裂开一丝缝隙，窗外暴雨拍打着阳台玻璃门。你怎么回应？"),
  options:[
    {id:'burn_together', pattern:"together|no more secrets|who.s first|partner|联手|先动谁|印章|别瞒",
      player:line("Take the matching half of the seal from his palm. “No more secrets. Show me who’s first.”", "从他掌心拿过另一半印章。「以后不准再瞒我。说吧，先动谁？」"),
      reaction:line("“God help every man on that pier. Because I’m done holding back for anyone—except you.”", "「愿码头上那些人自求多福。因为从今晚起，我只对你一个人留手。」"),
      tags:[line("Partner in Crime", "联手反击"), line("Unmasked Julian", "卸下防备")],
      draft:line("If we do this together, you don’t get to lock me out when it gets dangerous.", "既然联手，到了真正危险的时候，不准再把我关在门外。")},
    {id:'close_distance', pattern:"distance|closer|three years|watching|靠近|三年|划清|距离",
      player:line("Step into his space until only rain separates you. “Three years of watching from the dark—and you still think you kept your distance?”", "往前逼近一步，近得只剩雨声。「在暗处看了我三年——你还觉得自己划清了界线？」"),
      reaction:line("“I tried. Every single night for three years. Look where that got me.”", "「我试过。整整三年的每一个晚上。你看我最后忍住了吗？」"),
      tags:[line("Crossed the Line", "跨越界线"), line("Three-Year Secret", "三年秘密")],
      draft:line("Stop pretending you’re made of stone, Julian. What happens after night seven?", "别再装得无坚不摧了，纪沉。第七夜之后，你打算怎么办？")},
    {id:'walk_away_test', pattern:"my choice|choose|walk away|whether i stay|seven nights end|留不留|我自己|走开|底牌",
      player:line("Set the photograph quietly back in the box. “When the seven nights end, I choose whether I stay—not your enemies, and not you.”", "把旧照平静放回绒盒。「七夜结束那天，留不留是我自己决定——不由你的仇家，也不由你。」"),
      reaction:line("“Then I have four nights left to make sure you don’t want to walk out that door.”", "「那我还有四个晚上，让你自己不想推开那扇门。」"),
      tags:[line("Held Her Agency", "握紧主动权"), line("Four Nights Left", "仅剩四夜")],
      draft:line("Four nights to change my mind. You’re very confident for a man surrounded by enemies.", "四晚就想让我改主意？你四面楚歌的时候，倒还是这么自信。")},
  ],
  custom:{id:'custom',reaction:line("“I’m listening. The next move is yours.”", "「我听着。下一步，由你决定。」"),
    tags:[line('Your Own Terms','自定条件')],draft:line('{playerText}','{playerText}')},
  ending:[
    line("3:02 AM. Across the storm-black harbor, a crimson flare ignites above the private pier—and a black speedboat cuts straight toward Maison Vance.", "凌晨 3:02。暴雨漆黑的海面上突然升起一道血红信号弹——一艘黑色快艇正全速劈开浪头逼近纪氏私港。"),
    line("“Looks like they couldn’t wait until morning. Stay by the fire—or stand on this balcony with me and watch the harbor burn.”", "「看来他们等不到天亮了。回壁炉边等我——或者站在这个阳台上，跟我一起看这场火。」")
  ],
  cta:line("Step onto the balcony with Julian (1v1)", "走上凌晨阳台和他私聊")
});
