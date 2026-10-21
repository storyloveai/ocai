"""The whole book: volumes in order. A volume with a `file` is playable; the rest are listed as coming later.
Volume ids are the campaign ids inside each volume's JSON. See docs/全书规划.md for the plan behind this list."""
import json, pathlib
from lib import T

HERE = pathlib.Path(__file__).parent

BOOK = {
    "id": "sanguo_strategist",
    "title": T("三国·谋士", "Three Kingdoms: The Strategist"),
    "volumes": [
        {"id": "sanguo_strategist_v1", "file": "campaign.json",
         "title": T("许都至赤壁", "Xuchang to Red Cliffs"), "canon": T("第20–50回", "Ch. 20–50"), "years": T("建安四年至十三年", "199–208"),
         "blurb": T("你是刘备帐下的年轻门客。煮酒论英雄、千里走单骑、三顾茅庐、长坂坡、赤壁、华容道——你都在场。",
                    "A young retainer in Liu Bei's household. Heroes over plum wine, the thousand-li ride, the three visits, Changban, Red Cliffs, the Huarong road—you are there for all of it.")},
        {"id": "sanguo_strategist_v2", "file": "v2/campaign_v2.json",
         "title": T("荆州与西川", "Jingzhou and the West"), "canon": T("第51–65回", "Ch. 51–65"), "years": T("建安十三年至十九年", "208–214"),
         "blurb": T("赤壁之后，三家争荆州。周瑜、孙夫人、凤雏庞统、西川来客张松——刘备终于要有自己的地盘了，代价是什么，由你决定。",
                    "After Red Cliffs, three powers fight over Jingzhou. Zhou Yu, Lady Sun, the Young Phoenix, a visitor from the west—Liu Bei is about to have land of his own. What it costs is up to you.")},
        {"id": "sanguo_strategist_v3", "title": T("汉中", "Hanzhong"), "canon": T("第66–73回", "Ch. 66–73"), "years": T("建安二十年至二十四年", "215–219"),
         "blurb": T("定军山、汉中王。刘备离天下最近的那几年。", "Mount Dingjun and the King of Hanzhong: the years Liu Bei came closest.")},
        {"id": "sanguo_strategist_v4", "title": T("荆州之殇", "The Fall of Jingzhou"), "canon": T("第74–77回", "Ch. 74–77"), "years": T("建安二十四年", "219–220"),
         "blurb": T("水淹七军，然后是麦城。你和关羽之间的一切，都会在这里兑现。", "The flood at Fancheng, then Maicheng. Everything between you and Guan Yu comes due here.")},
        {"id": "sanguo_strategist_v5", "title": T("夷陵与白帝", "Yiling and Baidi"), "canon": T("第78–85回", "Ch. 78–85"), "years": T("黄初元年至章武三年", "220–223"),
         "blurb": T("为兄弟复仇的一战，和白帝城的托孤。", "A war for a brother's revenge, and the last charge at Baidi.")},
        {"id": "sanguo_strategist_v6", "title": T("南中", "The South"), "canon": T("第86–90回", "Ch. 86–90"), "years": T("建兴元年至三年", "223–225"),
         "blurb": T("七擒孟获：攻心为上。", "Seven captures of Meng Huo: winning hearts before cities.")},
        {"id": "sanguo_strategist_v7", "title": T("出师", "The Northern Campaigns"), "canon": T("第91–104回", "Ch. 91–104"), "years": T("建兴五年至十二年", "227–234"),
         "blurb": T("出师表、街亭、五丈原。子衡老了，诸葛亮也是。", "The memorial, Jieting, Wuzhang Plains. Ziheng has grown old. So has Zhuge Liang.")},
        {"id": "sanguo_strategist_v8", "title": T("归晋", "The Realm Made One"), "canon": T("第105–120回", "Ch. 105–120"), "years": T("建兴十二年至太康元年", "234–280"),
         "blurb": T("由你带出来的那个人，接着走完最后一段。", "The one you raised walks the last stretch.")},
    ],
}

def load():
    out = {"id": BOOK["id"], "title": BOOK["title"], "volumes": []}
    for v in BOOK["volumes"]:
        d = {k: v[k] for k in ("id", "title", "canon", "years", "blurb")}
        f = v.get("file")
        if f and (HERE / f).exists():
            camp = json.loads((HERE / f).read_text())
            assert camp["id"] == v["id"], (camp["id"], v["id"])
            d["camp"] = camp
        out["volumes"].append(d)
    return out
