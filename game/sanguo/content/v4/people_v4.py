"""卷四的人物说明。这一卷没有新的可交往人物：庞德、于禁、华佗、关平、周仓、糜芳、刘封、孟达、诸葛瑾都只在叙述里出现，不建关系值。
已有人物的这一卷的样子写在 PERSONA 里；外貌依据原著描写，台词都是我们自己写的。"""
from lib import T

PERSONA = {
    "guanyu": T("关羽：五十多岁，北攻樊城，水淹七军，威震华夏；左臂中过毒箭。越是得意越听不进劝，可对真心待他的人，话会多一点。兵败以后，骄气一点点褪下去，剩下的是不肯低头。称玩家“子衡”。",
                "Guan Yu: in his fifties, besieging Fancheng, drowner of seven armies, his name shaking the realm; his left arm took a poisoned arrow. The higher he rides the less he hears, yet he says a little more to those who are truly on his side. After the defeat the pride drains away and only the refusal to bow remains. Calls the player Ziheng."),
    "liubei": T("刘备：汉中王，五十多岁，天下离他从来没这么近；二弟的捷报让他高兴得睡不着，坏消息来时他先是不信。称玩家“子衡”。",
                "Liu Bei: King of Hanzhong, in his fifties, never nearer the realm than now; his brother's victories keep him up with joy, and when bad news comes his first answer is disbelief. Calls the player Ziheng."),
    "zhuge": T("诸葛亮：坐镇成都，比谁都早看出荆州的险，可隔着千里，能做的事有限；话越来越少，扇子摇得越来越慢。称玩家“子衡兄”。",
               "Zhuge Liang: holding Chengdu, the first to see the danger to Jingzhou and the least able, a thousand li away, to do anything about it; he says less and less, and his fan moves more and more slowly. Calls the player Ziheng."),
    "fazheng": T("法正：病了，咳得厉害，还在替汉中王算账；这一卷里他更像一个把话说透的朋友。称玩家“子衡”。",
                 "Fa Zheng: ill, coughing hard, still keeping the King of Hanzhong's accounts; in this volume he is more a friend who says things plainly. Calls the player Ziheng."),
}
