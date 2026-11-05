#!/usr/bin/env python3
"""《贝克街》出图任务：python3 game/holmes/art/make_jobs.py → jobs-batch1.jsonl（卷一试样的标准立绘 + 背景）
和汐川同一套流程：Codex 出候选 → Claude 按 accept 审 → 用户定标准立绘 → tools/adopt_art.py 收图。"""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent

STYLE = ("Art style: modern Japanese visual novel illustration — clean thin line art, soft cel shading with gentle gradients, "
         "expressive eyes with detailed highlights, finely layered hair, polished high-quality anime art; "
         "palette of Victorian London: muted fog greys, soot browns, deep greens, warm gaslight amber.")
NEG = ("No text, lettering, captions, logos, watermark, frame, signature. No likeness of any actor or any film, TV, game or manga "
       "version of Sherlock Holmes; no deerstalker cap, no curved calabash pipe, no Inverness cape. "
       "No celebrity likeness, sexual content, nudity, gore, minors, childlike proportions.")
SPRITE = ("Standing character sprite for a visual novel: one character only, knee-up framing, facing the viewer at a slight three-quarter angle, "
          "neutral relaxed pose with arms that will be reused for other expressions, centered, head near the top with a little margin, "
          "fully transparent background (PNG with alpha), no shadow on the ground, nothing cut off at the frame edge. "
          "Period costume of London in 1881, historically accurate. ")
BGP = ("Visual novel background art, 16:9, no people anywhere, nothing written anywhere (no signs, no lettering, no posters with words), "
       "painterly anime background with clean perspective and soft light, room left in the lower third for a dialogue box. London, 1881. ")
SP_ACC = ["只有一个人，透明背景（PNG 带透明通道），没有地面阴影", "成年人，长相和身材符合下面写的年龄",
          "膝上构图、正面略侧、双手自然，之后要在这张上换表情", "1881 年伦敦的服装，不像任何影视/游戏版本的福尔摩斯（不戴猎鹿帽、不叼弯烟斗）",
          "画风：现代日式 galgame 立绘，和《汐川》一致", "画面里没有任何文字或标志"]
BG_ACC = ["没有任何人物", "画面里没有文字、招牌字、标志", "16:9，下面三分之一留给对话框（不放关键内容）", "维多利亚时代伦敦的样子，日式动画背景画风"]

SPRITES = {
  "holmes": ("夏洛克·福尔摩斯，27 岁", "Sherlock Holmes, 27, a consulting detective: very tall and excessively lean, which makes him look even taller; "
             "sharp piercing grey eyes, a thin hawk-like nose, a prominent square chin, dark hair neatly combed back, pale complexion; "
             "an air of alertness and quiet amusement. Wears a dark grey frock coat, waistcoat, white wing-collar shirt and a narrow dark tie. "
             "Expression: calm, faintly amused, observant."),
  "lestrade": ("雷斯垂德探长，苏格兰场，40 岁左右", "Inspector Lestrade of Scotland Yard, about 40: a small, lean man with a sallow face, sharp dark eyes and a "
               "quick, ferret-like alertness; dark hair, short sideburns. Wears a buttoned brown overcoat over a plain dark suit, holding a bowler hat. "
               "Expression: neutral, slightly self-important."),
  "gregson": ("葛莱森探长，苏格兰场，40 岁左右", "Inspector Tobias Gregson of Scotland Yard, about 40: tall, pale-faced, with flaxen fair hair and a neat fair moustache; "
              "energetic and pleased with himself. Wears a grey overcoat and a dark suit, gloves in one hand. Expression: neutral, confident."),
  "hudson": ("哈德森太太，房东，50 岁左右", "Mrs Hudson, about 50, landlady of 221B Baker Street: kind but brisk, greying brown hair pinned up under a small lace cap, "
             "a dark high-necked Victorian dress with a white apron. Expression: neutral, patient."),
  "hope": ("杰弗逊·霍普，马车夫，40 岁左右", "Jefferson Hope, about 40, a London cab driver: broad-shouldered and powerful, weather-beaten sunburned face, short dark beard, "
           "steady grey eyes with a look of grim calm; a coarse cabman's coat and a soft hat, a muffler. Expression: neutral, guarded, tired."),
  "irene": ("艾琳·艾德勒，女低音歌唱家，28 岁左右", "Irene Adler, about 28, a celebrated contralto singer living in London: an adult woman of striking beauty and quick intelligence, "
            "dark auburn hair arranged in an elegant 1880s updo, clear clever eyes, a composed knowing smile; an elegant dove-grey walking dress of the 1880s "
            "with a modest high collar and a small hat. Expression: calm, composed, faintly amused."),
  "wilson": ("杰贝兹·威尔逊，当铺老板，55 岁左右", "Jabez Wilson, about 55, a pawnbroker: stout and florid-faced, with a head of blazing fiery-red hair; slow and pompous, "
             "a baggy grey shepherd's-check suit, an unbuttoned frock coat, a brass watch chain. Expression: neutral, slightly bewildered."),
  "clay": ("约翰·克雷（化名文森特·斯波尔丁），30 岁左右", "John Clay, about 30, posing as a pawnbroker's assistant: smooth clean-shaven face, quick clever eyes, small neat build, "
           "a white splash of acid scar on his forehead; a shabby clerk's suit with rolled-up sleeves. Expression: neutral, too eager to please."),
}
BGS = {
  "baker_day": ("贝克街 221B 起居室 · 白天", "The sitting room of 221B Baker Street by day: two broad windows, two armchairs by the fireplace, a cluttered table with chemical apparatus, "
                "books and papers everywhere, a violin case on a chair, Persian slipper by the mantelpiece, warm but untidy."),
  "baker_night": ("贝克街 221B 起居室 · 夜晚", "The same sitting room of 221B Baker Street at night: lamp and fire light, rain on the windows, deep shadows, cozy and secretive."),
  "lab": ("圣巴托罗缪医院化学实验室", "A lofty hospital chemistry laboratory in 1881: long low tables lined with retorts, test tubes and little Bunsen lamps with flickering blue flames, tall windows."),
  "street_fog": ("伦敦街道 · 雾", "A London street on a foggy morning: dun-coloured fog over brick houses, gas lamps, wet cobbles, a hansom cab waiting, mud-coloured sky."),
  "lauriston_out": ("劳瑞斯顿花园 3 号 · 外", "An empty, ill-omened brick house set back from the street behind a small neglected garden with a clay path, three tiers of blank windows, a 'to let' card with no readable words, a low wall with railings, grey morning."),
  "lauriston_in": ("劳瑞斯顿花园 3 号 · 空屋内", "The front room of the empty house: dusty bare boards, peeling cheap wallpaper with blotches of mildew, a cold fireplace with a stump of red wax candle on the mantel, a single dirty window, no body and no blood."),
  "station": ("警察局 · 夜", "A Victorian London police station office at night: a wooden counter, gas lamp, notice boards with no readable words, a bench."),
  "utah": ("北美大平原 · 荒原（第二部）", "The great alkali plain of North America in 1847: an arid barren desert of salt flats and dusty chaparral, distant snow-capped peaks, a vast empty sky, no people."),
  "briony": ("布里翁尼府 · 圣约翰伍德", "Briony Lodge in St John's Wood: a bijou two-storey villa at dusk with a garden behind, long windows to the street, gas lamps lit, a quiet elegant street."),
  "saxe": ("萨克斯-科堡广场", "Saxe-Coburg Square: a poky little shabby-genteel square, four lines of dingy two-storied brick houses around a railed enclosure of weedy grass and faded laurel bushes, a pawnshop with three gilt balls (no readable words)."),
  "cellar": ("银行地下金库", "A bank cellar vault at night: massive stone walls, piled crates and heavy boxes, flagstone floor, a single dark lantern casting a narrow beam, total darkness around."),
}

jobs = []
for cid, (zh, desc) in SPRITES.items():
    jobs.append({"id": f"sprite-{cid}-normal", "kind": "sprite", "name": f"sprites/{cid}/normal", "batch": 1, "status": "pending", "refs": [], "ref_paths": [],
                 "composition": f"标准立绘（平常表情）：{zh}。采用后作为这个人其余表情的参考图", "accept": SP_ACC,
                 "prompt": f"{STYLE} {SPRITE}{desc}", "negative_prompt": NEG, "size": "1024x1536", "out": [1024, 1536], "candidates": 4})
for bid, (zh, desc) in BGS.items():
    jobs.append({"id": f"bg-{bid}", "kind": "bg", "name": f"bg/{bid}", "batch": 1, "status": "pending", "refs": [], "ref_paths": [],
                 "composition": zh, "accept": BG_ACC, "prompt": f"{STYLE} {BGP}{desc}", "negative_prompt": NEG,
                 "size": "1536x1024", "out": [1920, 1080], "candidates": 2})
(HERE / "jobs-batch1.jsonl").write_text("".join(json.dumps(j, ensure_ascii=False) + "\n" for j in jobs), "utf-8")
print(len(jobs), "jobs")
