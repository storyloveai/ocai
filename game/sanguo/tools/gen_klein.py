#!/usr/bin/env python3
"""用团队部署的 FLUX 3 Image Klein 出候选图（决策记录 v2.30）。

只能在公司内网跑（Klein 网关只对内网开放）：
  - 自动：GitHub Actions「Klein 出图」在内网的 self-hosted runner 上跑本脚本，出完把候选图推回同一个分支；
  - 手动：在内网电脑上 `KLEIN_API_KEY=sk-xxx python3 game/sanguo/tools/gen_klein.py --batch art/klein-jobs/<批次>.jsonl`

任务文件每行一条（Claude 写，见 art/README.md「Klein 出图」）：
  {"id": "liubei-warm", "mode": "edit" | "t2i", "images": ["art/portraits/liubei.webp"], "prompt": "...",
   "seeds": [1, 2], "accept": ["..."], "out": "portraits/mood/liubei-warm.webp", "status": "pending"}
images 路径相对 game/sanguo/。候选图写到 art/candidates/<批次>/<id>-s<seed>.png，旁边生成 index.html 方便看；
出完的任务改成 "status": "generated"。挑图、裁剪、放进正式目录由 Claude 审图后做，本脚本不动正式图。
只用 Python 自带库；装了 Pillow 时，webp 参考图会先转成 PNG 再上传。"""
import argparse, base64, html, io, json, os, pathlib, sys, time, urllib.request, uuid

R = pathlib.Path(__file__).resolve().parents[1]
BASE = os.environ.get("KLEIN_BASE_URL", "https://ai-maas.zen5prod.com/ai-router/v1").rstrip("/")
MODEL = "flux-3-image-klein"


def as_png(path):
    data = path.read_bytes()
    if path.suffix.lower() == ".png": return data
    try:
        from PIL import Image
    except ImportError:
        return data  # the gateway may still take webp/jpg; install Pillow on the runner to be safe
    buf = io.BytesIO(); Image.open(path).convert("RGB").save(buf, "PNG"); return buf.getvalue()


def post(path, body, ctype, key):
    req = urllib.request.Request(BASE + path, data=body, method="POST", headers={"Authorization": "Bearer " + key, "Content-Type": ctype})
    with urllib.request.urlopen(req, timeout=900) as r:
        return json.loads(r.read())


def multipart(fields, files):
    b = uuid.uuid4().hex; out = []
    for k, v in fields.items():
        out.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for name, fn, data in files:
        out.append(f'--{b}\r\nContent-Disposition: form-data; name="{name}"; filename="{fn}"\r\nContent-Type: image/png\r\n\r\n'.encode() + data + b"\r\n")
    out.append(f"--{b}--\r\n".encode())
    return b"".join(out), f"multipart/form-data; boundary={b}"


def generate(job, seed, key):
    if job["mode"] == "t2i":
        r = post("/images/generations", json.dumps({"model": MODEL, "prompt": job["prompt"], "seed": seed}).encode(), "application/json", key)
    else:
        imgs = [R / p for p in job["images"]]
        field = "image" if len(imgs) == 1 else "image[]"
        body, ctype = multipart({"model": MODEL, "prompt": job["prompt"], "seed": seed}, [(field, p.stem + ".png", as_png(p)) for p in imgs])
        r = post("/images/edits", body, ctype, key)
    return base64.b64decode(r["data"][0]["b64_json"])


def page(batch, jobs, outdir):
    rows = []
    for j in jobs:
        refs = "".join(f'<img class="ref" src="{os.path.relpath(R / p, outdir)}">' for p in j.get("images", []))
        cands = "".join(f'<figure><img src="{j["id"]}-s{s}.png"><figcaption>seed {s}</figcaption></figure>' for s in j.get("seeds", [1]) if (outdir / f'{j["id"]}-s{s}.png').exists())
        acc = "".join(f"<li>{html.escape(a)}</li>" for a in j.get("accept", []))
        rows.append(f'<section><h2>{html.escape(j["id"])}</h2><div class="row"><div class="refs">{refs}</div>{cands}</div>'
                    f'<ul>{acc}</ul><details><summary>提示词</summary><p>{html.escape(j["prompt"])}</p></details></section>')
    (outdir / "index.html").write_text(f'''<!doctype html><meta charset="utf-8"><title>Klein · {html.escape(batch)}</title>
<style>body{{font:14px/1.5 system-ui,sans-serif;margin:24px;background:#f6f3ee;color:#222}}.row{{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start}}
figure{{margin:0}}figure img{{height:320px;border-radius:6px}}.ref{{height:150px;margin:2px;border-radius:4px;opacity:.85}}ul,details{{color:#555;font-size:12px}}</style>
<h1>Klein 候选图 · {html.escape(batch)}</h1><p>左边小图是参考图，右边是各个 seed 的候选。</p>{"".join(rows)}''', "utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--batch", required=True, help="任务文件，相对 game/sanguo/，例如 art/klein-jobs/moods-v1.jsonl")
    ap.add_argument("--ids", default="", help="只跑这些 id（逗号分隔）；空 = 所有 pending")
    ap.add_argument("--redo", action="store_true", help="已经 generated 的也重跑")
    a = ap.parse_args()
    key = os.environ.get("KLEIN_API_KEY") or sys.exit("没有 KLEIN_API_KEY")
    bf = R / a.batch
    jobs = [json.loads(l) for l in bf.read_text("utf-8").splitlines() if l.strip()]
    want = {x for x in a.ids.split(",") if x}
    outdir = R / "art/candidates" / bf.stem; outdir.mkdir(parents=True, exist_ok=True)
    failed = 0
    for j in jobs:
        if want and j["id"] not in want: continue
        if not want and j.get("status") == "generated" and not a.redo: continue
        ok = True
        for s in j.get("seeds", [1]):
            dst = outdir / f'{j["id"]}-s{s}.png'
            if dst.exists() and not a.redo: continue
            t0 = time.time()
            try:
                dst.write_bytes(generate(j, s, key)); print(f'{j["id"]} seed {s}: {round(time.time() - t0)} 秒', flush=True)
            except Exception as e:
                ok = False; failed += 1; print(f'{j["id"]} seed {s}: 失败 {type(e).__name__}: {e}', flush=True)
        if ok: j["status"] = "generated"
    bf.write_text("".join(json.dumps(j, ensure_ascii=False) + "\n" for j in jobs), "utf-8")
    page(bf.stem, jobs, outdir)
    print(f"完成：候选图在 {outdir.relative_to(R)}，打开 index.html 看。失败 {failed} 张。")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
