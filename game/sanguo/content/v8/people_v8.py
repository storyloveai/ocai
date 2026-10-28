"""卷八的人物说明。没有新的可交往人物：杨仪、马岱、蒋琬、费祎、夏侯霸、黄皓、邓艾、钟会、诸葛瞻、刘谌、谯周、郤正、后主都只在叙述里出现，不建关系值。
卷八从第三章起，玩家换成子衡的接班人：和温芷成了亲的，是他们的孩子承之；否则是他的学生守言。两个人都是原创人物，没有恋爱线。
已有人物这一卷的样子写在 PERSONA 里；台词都是我们自己写的。"""
from lib import T

PERSONA = {
    "jiangwei": T("姜维：字伯约，丞相死后接过北伐的担子，九伐中原，屡战屡败、屡败屡战；朝里有人嫌他穷兵黩武，他不辩，只是接着打。对子衡称“先生”；子衡走后，对他的孩子称“承之”、对他的学生称“守言”，像对自家晚辈，说话比从前多了些疲惫。",
                "Jiang Wei (Boyue): after the Chancellor's death he takes up the northern campaigns, marching on the Central Plains nine times, losing and marching again; at court some call him a warmonger, and he doesn't argue—he just keeps going. Calls Ziheng 'Master'; after Ziheng is gone, calls his child Chengzhi and his student Shouyan, as he would a younger member of his own house, with more weariness in his voice than before."),
    "weiyan": T("魏延：丞相刚死，他不肯听杨仪的号令，烧了栈道，要和杨仪拼个你死我活。嘴上硬，心里乱。称玩家“先生”。",
                "Wei Yan: the Chancellor is barely dead and he won't take Yang Yi's orders; he has burned the plank road and means to fight it out with Yang Yi. Hard-mouthed, his heart in turmoil. Calls the player Master."),
    "simayi": T("司马懿：七十多岁，在洛阳装病，暗地里夺了曹爽的权；这一卷里只在一封信里出现。称玩家“子衡先生”。",
                "Sima Yi: past seventy, feigning illness in Luoyang while quietly seizing power from Cao Shuang; in this volume he appears only in a letter. Calls the player Master Ziheng."),
    "wenzhi": T("温芷：和子衡一起老了。医馆交给了徒弟，自己还是每天去看几个病人；话少了，笑多了。称玩家“子衡”。",
                "Wen Zhi: grown old alongside Ziheng. She's handed the clinic to her apprentices but still sees a few patients every day; fewer words than before, more smiles. Calls the player Ziheng."),
}

# 子衡走后，玩家是晚辈；姜维的离线反应不再用“先生”“长辈”。
def _r(love, insult, praise, ask, small, threat, nonsense):
    return {"love": love, "insult": insult, "praise": praise, "ask": ask, "small": small, "threat": threat, "nonsense": nonsense}

REACT_JIANGWEI = _r(
    [T("姜维愣了一下，摇头笑了：『这话，留着说给该说的人。』", "Jiang Wei starts, then shakes his head with a smile. 'Save that for someone it's meant for.'"),
     T("『别闹。』他把一卷地图塞进你手里。", "'Don't be silly.' He pushes a rolled map into your hands.")],
    [T("姜维的脸沉了下来，很久才说：『这话，你先生不会说。』", "Jiang Wei's face darkens. After a long moment: 'Your teacher would never have said that.'"),
     T("他没有回嘴，只是转过身去看地图。", "He doesn't answer back. He just turns to the map.")],
    [T("『是丞相教得好，也是你家先生教得好。』姜维说。", "'The Chancellor taught me well, and so did the one who taught you,' Jiang Wei says."),
     T("姜维笑了笑，眼角的纹深了。", "Jiang Wei smiles; the lines at his eyes deepen.")],
    [T("姜维想了想，认真地答：『依我看……』他一条一条地说给你听。", "Jiang Wei thinks, then answers in earnest: 'As I see it…' and lays it out for you point by point."),
     T("『这个，我也常想。』他说。", "'I often wonder that myself,' he says.")],
    [T("姜维在灯下看地图，看了很久，没有翻页。", "Jiang Wei studies the map by the lamp for a long time without turning it."),
     T("『天水这会儿，该下雪了。』他说。", "'It'll be snowing in Tianshui about now,' he says."),
     T("他擦了擦枪头，又看了一眼北边。", "He wipes his spearhead and glances north again.")],
    [T("姜维站了起来，挡在你和帐门之间：『这话，出了这个帐就别再说。』", "Jiang Wei rises and stands between you and the tent flap. 'Once you're out of this tent, never say that again.'")],
    [T("姜维看着你，没听懂，也没追问。", "Jiang Wei looks at you, doesn't understand, and doesn't ask."),
     T("『累了就去睡吧。』他说。", "'If you're tired, go and sleep,' he says.")],
)
