#!/usr/bin/env python3
"""把一张图收进《灰烬王冠》：python3 game/ashen/tools/adopt.py <anime|real> <源图> <名字> [<源图> <名字> ...]
名字就是出图单里的 name，例如 bg/ferris、cg/cg_wheel、sprites/gran/normal。
背景和 CG 裁成 16:9、存 1920×1080 webp，另存手机用的 1280×720 到 art/m/<画风>/；立绘保留透明，缩到高 1536。"""
import sys, pathlib
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[1] / "art"
def fit(im, w, h):
    r = max(w / im.width, h / im.height); im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2; return im.crop((x, y, x + w, y + h))
def adopt(style, src, name):
    im = Image.open(src)
    if name.startswith("sprites/"):
        im = im.convert("RGBA"); r = 1536 / im.height; im = im.resize((round(im.width * r), 1536), Image.LANCZOS)
        out = R / style / f"{name}.webp"; out.parent.mkdir(parents=True, exist_ok=True); im.save(out, "WEBP", quality=88, method=6)
    else:
        im = fit(im.convert("RGB"), 1920, 1080)
        out = R / style / f"{name}.webp"; out.parent.mkdir(parents=True, exist_ok=True); im.save(out, "WEBP", quality=86, method=6)
        m = R / "m" / style / f"{name}.webp"; m.parent.mkdir(parents=True, exist_ok=True); im.resize((1280, 720), Image.LANCZOS).save(m, "WEBP", quality=82, method=6)
    print("adopted", style, name, "<-", src)
if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 3 or a[0] not in ("anime", "real") or len(a[1:]) % 2: sys.exit(__doc__)
    for i in range(1, len(a), 2): adopt(a[0], a[i], a[i + 1])
