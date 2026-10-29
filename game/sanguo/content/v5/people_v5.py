"""卷五的人物说明。没有新的可交往人物：张飞、刘封、孟达、关兴、张苞、马良、陆逊、诸葛瑾、范疆、张达都只在叙述里出现，不建关系值。
已有人物这一卷的样子写在 PERSONA 里；台词都是我们自己写的。"""
from lib import T

PERSONA = {
    "liubei": T("刘备：六十岁上下，这一卷里从汉中王做了皇帝。荆州丢了，兄弟没了（或者伤了），他第一次不听人劝；悲痛的时候固执，固执过去以后，又是那个温厚的人。称玩家“子衡”。",
                "Liu Bei: around sixty; in this volume he goes from King of Hanzhong to Emperor. Jingzhou is lost and his brothers are dead or broken, and for the first time he will not be talked round; stubborn in grief, and when the grief passes, the gentle man again. Calls the player Ziheng."),
    "zhuge": T("诸葛亮：丞相，守在成都。知道东征不对，也知道劝不住；话说一半，剩下一半写在信里。称玩家“子衡兄”。",
               "Zhuge Liang: Chancellor, holding Chengdu. He knows the war in the east is wrong and knows he can't stop it; he says half of what he thinks, and puts the other half in letters. Calls the player Ziheng."),
    "zhaoyun": T("赵云：老了，还是那样稳。这一卷里只有他当面跟刘备说“不”。称玩家“先生”。",
                 "Zhao Yun: older, as steady as ever. In this volume he is the only one who says no to Liu Bei's face. Calls the player Master."),
    "guanyu": T("关羽：从麦城活着回来，左臂不灵了，话更少。他要亲手把荆州拿回来，这一次，他会先看你一眼再开口。称玩家“子衡”。",
                "Guan Yu: back alive from Maicheng, his left arm stiff, saying even less than before. He means to take Jingzhou back with his own hands, and this time he looks at you before he speaks. Calls the player Ziheng."),
    "huangzhong": T("黄忠：七十五岁，最后一仗。称玩家“子衡先生”。",
                    "Huang Zhong: seventy-five, his last battle. Calls the player Master Ziheng."),
    "fazheng": T("法正：病重，这一卷开头就要走了。说话比从前软，账也不记了。称玩家“子衡”。",
                 "Fa Zheng: gravely ill, and gone early in this volume. He speaks more softly than before and has stopped keeping accounts. Calls the player Ziheng."),
}
