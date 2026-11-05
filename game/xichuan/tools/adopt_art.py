#!/usr/bin/env python3
"""把审过的候选图收进正式素材（生产线的固定一步）：原图 → art/<类>/<名>.webp（1920×1080），
手机用小图 → art/m/<类>/（1280×720），2.5D 深度图 → art/depth/<类>/（960×540，近白远黑）。
用法：python3 tools/adopt_art.py cg <候选图目录> cg_cats=1 cg_cot=2 ... [--model 深度模型.onnx]
  候选文件名按 Codex 的约定：<类>-<名>-<编号>.png。
  深度模型：Depth Anything V2 Small 的 ONNX（Apache-2.0），不进仓库；没给 --model 就只做原图和小图。"""
import pathlib, sys
from PIL import Image, ImageFilter

ART = pathlib.Path(__file__).resolve().parents[1] / "art"
SIZE, SMALL, DEPTH = (1920, 1080), (1280, 720), (960, 540)

def fit(im, size):
    """等比缩放后居中裁成 16:9"""
    w, h = im.size; s = max(size[0] / w, size[1] / h)
    im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    x, y = (im.width - size[0]) // 2, (im.height - size[1]) // 2
    return im.crop((x, y, x + size[0], y + size[1]))

def depth(im, sess):
    import numpy as np
    x = np.asarray(im.convert("RGB").resize((518, 518), Image.BICUBIC), np.float32) / 255
    x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
    d = sess.run(None, {sess.get_inputs()[0].name: x})[0].squeeze()
    d = (d - d.min()) / (d.max() - d.min() + 1e-6) * 255
    return Image.fromarray(d.astype("uint8")).resize(DEPTH, Image.BICUBIC).filter(ImageFilter.GaussianBlur(2)).convert("RGB")

def main():
    kind, src = sys.argv[1], pathlib.Path(sys.argv[2])
    model = sys.argv[sys.argv.index("--model") + 1] if "--model" in sys.argv else None
    picks = [a.split("=") for a in sys.argv[3:] if "=" in a]
    sess = None
    if model:
        import onnxruntime; sess = onnxruntime.InferenceSession(model)
    for d in (ART / kind, ART / "m" / kind, ART / "depth" / kind): d.mkdir(parents=True, exist_ok=True)
    for name, n in picks:
        im = fit(Image.open(src / f"{kind}-{name}-{n}.png").convert("RGB"), SIZE)
        im.save(ART / kind / f"{name}.webp", quality=88, method=6)
        im.resize(SMALL, Image.LANCZOS).save(ART / "m" / kind / f"{name}.webp", quality=82, method=6)
        if sess: depth(im, sess).save(ART / "depth" / kind / f"{name}.webp", quality=80, method=6)
        print("采用", kind, name, "#" + n, "· 深度图" if sess else "")

if __name__ == "__main__":
    main()
