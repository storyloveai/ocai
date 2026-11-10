#!/usr/bin/env python3
"""《灰烬王冠》出图单：同一份清单出两版（动漫 anime / 写实 real），名字一样，放在 art/<画风>/ 下。
用法：python3 game/ashen/content/story.py && python3 game/ashen/art/make_jobs.py
生成 art/jobs-anime.jsonl 和 art/jobs-real.jsonl。每条的 name 就是落地路径（不带画风前缀和 .webp）。"""
import json, pathlib
R = pathlib.Path(__file__).resolve().parents[1]
camp = json.loads((R / "content/campaign.json").read_text("utf-8"))

STYLE = {
 "anime": {"zh": "动漫版：现代日式 galgame / 视觉小说插画，干净细线稿，赛璐璐上色带柔和渐变，夜景用冷暖对比强的灯光（遗器的光是偏月白的暖白），画面有战斗作品的锐利感；人物比例写实、成年人五官",
           "en": "Anime edition: modern Japanese visual-novel illustration, clean thin line art, cel shading with soft gradients, high-contrast night lighting with warm moonlit-white magic light, a sharp action-story mood; realistic proportions, clearly adult faces"},
 "real": {"zh": "写实版：电影剧照质感的写实数字绘画，真实光影和材质（湿石板、黄铜、雨雾），浅景深，色调偏冷，魔法光是柔和的暖白；人物是真实成年人的脸，不是照片中的真人、不像任何名人",
          "en": "Realistic edition: cinematic, film-still digital painting with real light and materials (wet cobbles, brass, rain haze), shallow depth of field, cool grade, magic light a soft warm white; characters have believable adult faces that are not real people and resemble no celebrity"},
}
COMMON_ACCEPT = ["画面里没有文字、标志、水印", "不写也不像任何已有作品、画师、公司的风格或角色", "所有人物都是成年人"]

LOOK = {
 "lamp": ("银白色软发垂到眉毛，眼睛像两簇烛火（暖白色），过分整洁的白衬衫、袖口挽到小臂，看上去十八九岁的成年青年，身形半透明、边缘有柔光", "a young adult man who looks about nineteen, soft silver-white hair falling to his brows, eyes like two warm-white candle flames, an immaculate white shirt with sleeves rolled to the forearm, faintly translucent with a soft glowing edge"),
 "gran": ("很高的 34 岁男人，络腮胡，黑色酒保背心露出粗壮手臂，两只拳头缠着白绷带，嘴里叼一支没点的烟", "a very tall 34-year-old man, full beard, black bartender's vest showing heavy arms, both fists wrapped in white tape, an unlit cigarette"),
 "sword": ("二十七八岁的女人，红头发乱糟糟扎在脑后，磨旧的皮夹克，膝盖破洞的牛仔裤，笑起来有一颗小虎牙，手里拎着只剩半截、断口参差的冷白色长剑", "a woman in her late twenties, messy red hair tied back, worn leather jacket, jeans torn at the knees, a sharp canine when she grins, holding a cold-white longsword snapped off halfway with a jagged break"),
 "evelyn": ("24 岁的女人，金色长卷发，红色长大衣，黑色皮手套，额角戴着黑色荆棘编成的细冠，冠刺扎出一道细细的血痕，神情冷而准", "a 24-year-old woman, long golden curls, a long red coat, black leather gloves, a slender crown of black thorns at her temple with a thin line of blood, cold and exacting"),
 "august": ("六十岁上下的男人，白发梳得一丝不苟，旧款三件套西装扣到最上面一颗，老花镜，拎黑色公文包", "a man of about sixty, white hair combed precisely, an old-fashioned three-piece suit buttoned to the top, reading glasses, a black briefcase"),
 "baiqiu": ("29 岁的女人，银灰色长发用木簪随手挽着，墨绿色改良旗袍式外套，手里一把空白折扇", "a 29-year-old woman, long silver-grey hair loosely pinned with a wooden hairpin, a dark-green coat cut like a modern qipao, holding a blank folding fan"),
}
LIN = ("林栖：23 岁的女人，短发，左耳一枚银环，旧风衣，手指上有机油，腰上挂一盏黄铜提灯", "Lin Qi: a 23-year-old woman, short hair, a single silver ring in her left ear, a worn trench coat, machine oil on her fingers, a brass lantern hanging at her hip")
FACE = {"normal": ("平常", "neutral"), "smile": ("笑", "smiling"), "serious": ("认真", "serious"), "angry": ("生气", "angry"), "sad": ("难过", "sad"), "surprised": ("吃惊", "surprised"), "battle": ("战斗中，神情锐利，衣角被风掀起", "mid-battle, sharp-eyed, clothes caught by wind")}

BG = {
 "clocktower": "古老钟楼顶层，巨大的停摆齿轮，雨夜，栏杆外是整座港口城市的灯火", "shop_rain": "老城区的小修理铺“林记修复”，卷帘门拉下一半，满墙待修的旧座钟、八音盒、小提琴，窗外雨夜霓虹",
 "shop_day": "同一家修理铺的傍晚，柜台上摊着旧相册", "shop_night": "同一家修理铺的凌晨，只开着一盏台灯，柜台上一本硬皮笔记本",
 "oldhouse": "没人住的老宅客厅，白布盖着沙发，墙上一排空相框，手电筒的光", "basement": "石砌拱顶的地下工作间，四壁书架，长桌上有天平、坩埚、玻璃瓶，长桌尽头一盏黄铜提灯",
 "bar": "旧港区的小酒吧，自己钉的木吧台，墙上挂着一只生锈的铁船锚，夜里只有码头工人", "eiche_top": "填海新区最高的玻璃大厦顶层，落地窗外是整座城市的夜景",
 "park_gate": "废弃三十年的海滨游乐园大门，招牌掉了字，锈死的过山车，黄昏", "ferris": "废弃游乐园正中的巨大摩天轮，生锈，夜，海风，地面是铁格栅",
 "lighthouse": "北岸旧灯塔顶，玻璃罩，远处海湾和摩天轮的剪影，夜", "teahouse": "老城区三层木结构茶楼的三楼雅间，下午阳光，窗外港口",
 "harbor_street": "老城区陡坡石板路，凌晨，坡底停着两辆没有标志的黑车",
}
CGS = {
 "cg_photo": ("一张褪色的旧照片：港口栏杆前，缺门牙的小女孩举手去够海鸥，她身边是一块完整的空白（不是剪掉，就是空着）", "单人小女孩只出现在照片里（照片道具特写），不画任何成年人"),
 "cg_lamp_lit": ("地下室里，修好的黄铜提灯自己点燃，月白色的火苗；火光里浮现银发青年提灯，林栖握着灯，被光照亮", "提灯 + 林栖"),
 "cg_reconnect": ("林栖把断开的发光细线捏在一起，白色光纹沿手臂炸开；断剑冷白色的刃停在她手腕上方一寸", "林栖特写 + 断剑的刃"),
 "cg_cut": ("葛兰双手握半截断剑高举，冷白色剑光从上往下劈，背后巨大的摩天轮的所有连结同时松开，车厢开始下坠", "葛兰 + 断剑虚影 + 摩天轮"),
 "cg_wheel": ("修好的摩天轮在夜里自己转起来，比新的还新，所有车厢亮着；地上葛兰仰头看，林栖背影", "摩天轮为主"),
 "cg_register": ("修理铺柜台上的登记表特写，十二行，最后一行是空白；老监督官的手按着钢笔和铜印", "道具特写，表格上不要出现可读文字"),
 "cg_scales": ("茶楼雅间，巴掌大的黄铜天平，两只秤盘停在同一高度，裂纹在白光里愈合；对面白秋放下了扇子", "天平特写 + 白秋"),
 "title": ("标题画面：雨夜的钟楼，上空悬着一顶由灰烬聚成的灰色冠冕，钟楼下的坡道上一个提着灯的短发女人的背影", "林栖背影 + 灰烬王冠，留出上方写标题的空间"),
}

def done(style, name): return (R / "art" / style / f"{name}.webp").exists()

def jobs(style):
    s = STYLE[style]; out = []
    faces = {}
    def walk(ops):
        for o in ops:
            if o["op"] in ("show", "say") and o.get("who") not in (None, "me") and (o["op"] == "show" or o.get("face")):
                faces.setdefault(o["who"], {"normal"}).add(o.get("face", "normal"))
    for n in camp["nodes"].values():
        walk(n.get("script", []))
        for c in n["choices"]: walk(c.get("script", []))
    for who in LOOK:
        for face in ["normal"] + sorted(f for f in faces.get(who, set()) if f != "normal"):
            zh, en = LOOK[who]; fz, fe = FACE[face]
            out.append({"id": f"{style}-sprite-{who}-{face}", "style": style, "kind": "sprite", "name": f"sprites/{who}/{face}", "status": "pending",
                "refs": [] if face == "normal" else [f"{style}/sprites/{who}/normal"],
                "composition": f"立绘，{fz}" + ("：采用后作为这个人其余表情的参考" if face == "normal" else "：照标准立绘只改表情，脸、发型、衣服、姿势、构图都不变"),
                "accept": ["只有一个人，透明背景（PNG 带透明通道），膝上构图，1024×1536", s["zh"]] + COMMON_ACCEPT,
                "prompt": f"{s['en']}. Character sprite, knee-up, transparent background, {en}, expression: {fe}."})
    for bid, zh in BG.items():
        out.append({"id": f"{style}-bg-{bid}", "style": style, "kind": "bg", "name": f"bg/{bid}", "status": "pending",
            "composition": zh + "；不画人物", "accept": ["1920×1080，不画人物", s["zh"]] + COMMON_ACCEPT,
            "prompt": f"{s['en']}. Background, no people, 16:9. {zh}"})
    for cid, (zh, who) in CGS.items():
        out.append({"id": f"{style}-cg-{cid}", "style": style, "kind": "cg", "name": f"cg/{cid}", "status": "pending",
            "composition": zh, "cast": who, "refs": [],
            "accept": ["1920×1080", s["zh"], "人物外形和立绘一致（" + LIN[0] + "）"] + COMMON_ACCEPT,
            "prompt": f"{s['en']}. Event CG, 16:9. {zh}. Lin Qi looks like: {LIN[1]}."})
    # 剧本里有、上面没写构图的 CG（比如战斗分镜）：按名字补一条
    for cid, name in camp["art"]["cg"].items():
        if cid not in CGS:
            out.append({"id": f"{style}-cg-{cid}", "style": style, "kind": "cg", "name": f"cg/{cid}", "status": "pending",
                "composition": name["zh"], "accept": ["1920×1080", s["zh"]] + COMMON_ACCEPT, "prompt": f"{s['en']}. Event CG, 16:9. {name['en']}."})
    for j in out: j["status"] = "done" if done(style, j["name"]) else "pending"
    return out

if __name__ == "__main__":
    for style in STYLE:
        js = jobs(style)
        (R / f"art/jobs-{style}.jsonl").write_text("".join(json.dumps(j, ensure_ascii=False) + "\n" for j in js), "utf-8")
        print(style, len(js), "jobs,", sum(j["status"] == "done" for j in js), "done")
