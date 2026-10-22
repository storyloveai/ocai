#!/usr/bin/env python3
"""Generate illustrated art for 三国·谋士 through the OpenAI Images API.

Usage (the key comes from the environment, never from a file in the repo):
  OPENAI_API_KEY=... python3 tools/gen_portraits.py [--jobs art/portrait-jobs.jsonl] [--ids wenzhi,lusu]
                                                    [--quality high] [--model gpt-image-2] [--force]

Job files (one JSON object per line):
  art/portrait-jobs.jsonl  cast portraits        → art/portraits/<id>.webp (300x400)
  art/edition-jobs.jsonl   illustrated edition   → art/scenes/<name>.webp (1200x480), art/cg/<name>.webp (1200x720),
                                                   art/ending/<name>.webp (1200x480), art/cover.webp (640x960)
Every job sends StoryDate covers as style references; a job's "refs" adds the portraits of the characters in it,
so faces stay consistent across scenes. Full-size results go to art/source/ for later re-crops.
Without --ids only jobs with no output yet are made. Requires: pip install requests pillow
"""
import argparse, base64, io, json, os, pathlib, sys
import requests
from PIL import Image

R = pathlib.Path(__file__).resolve().parents[1]
ART = R / "art"
COVERS = R.parent.parent / "ooc-replica/dist/assets/originals"
STYLE = [COVERS / f for f in ("sg-001.webp", "sg-004.webp", "sg-007.webp", "sg-008.webp")]
# a character's look: their generated portrait if there is one, otherwise the cover it was cut from
CHAR_REF = {"liubei": "sg-001", "caocao": "sg-002", "guanyu": "sg-003", "zhuge": "sg-004", "zhouyu": "sg-005", "zhaoyun": "sg-008"}
LEAD = ("The attached images come from one illustrated series. Match their art style exactly: anime / Chinese "
        "webtoon illustration, clean line art, cel shading with soft painted highlights, glossy detailed hair, large "
        "expressive eyes, saturated colour and strong rim light. Do not copy any text or layout from them. ")
CAST = "Some attached images show characters who appear here; keep their faces, hair and clothing consistent with those images. "
TAIL = (" Clothing is Eastern Han dynasty Chinese hanfu (cross-collar robes, wide sleeves), not Japanese kimono. "
        "Not photorealistic, not an oil painting, not semi-realistic.")


def png(path):
    buf = io.BytesIO(); im = Image.open(path).convert("RGB"); im.thumbnail((1024, 1536)); im.save(buf, "PNG"); return buf.getvalue()


def char_ref(cid):
    own = ART / "source" / f"{cid}.webp"
    return own if own.exists() else (COVERS / f"{CHAR_REF[cid]}.webp" if cid in CHAR_REF else None)


def target(j):
    kind = j.get("kind", "portrait")
    if kind == "portrait": return ART / "portraits" / f"{j['character']}.webp", (300, 400), "top"
    if kind == "cover": return ART / "cover.webp", tuple(j["out"]), "center"
    sub = {"scene": "scenes", "cg": "cg", "ending": "ending"}[kind]
    return ART / sub / f"{j['name']}.webp", tuple(j["out"]), "center"


def save(j, raw):
    out, (tw, th), anchor = target(j)
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    kind = j.get("kind", "portrait"); stem = j["character"] if kind == "portrait" else j["id"]
    (ART / "source").mkdir(exist_ok=True); out.parent.mkdir(parents=True, exist_ok=True)
    full = im.copy(); full.thumbnail((1152, 1152)); full.save(ART / "source" / f"{stem}.webp", quality=82)
    w, h = im.size
    if w / h > tw / th: cw, ch = round(h * tw / th), h
    else: cw, ch = w, round(w * th / tw)
    x = (w - cw) // 2; y = 0 if anchor == "top" else (h - ch) // 2
    im.crop((x, y, x + cw, y + ch)).resize((tw, th), Image.LANCZOS).save(out, quality=78 if kind != "portrait" else 80)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", default="art/portrait-jobs.jsonl")
    ap.add_argument("--ids", default="")
    ap.add_argument("--quality", default="high", choices=["low", "medium", "high"])
    ap.add_argument("--model", default=os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-2"))
    ap.add_argument("--force", action="store_true", help="redo jobs that already have output")
    a = ap.parse_args()
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key: sys.exit("OPENAI_API_KEY is not set")
    model = a.model.strip() or "gpt-image-2"
    jobs = [json.loads(l) for l in (R / a.jobs).read_text().splitlines() if l.strip()]
    for j in jobs: j.setdefault("kind", "portrait"); j.setdefault("key", j["character"] if j["kind"] == "portrait" else j["id"])
    want = {x.strip() for x in a.ids.split(",") if x.strip()}
    if want - {j["key"] for j in jobs}: sys.exit(f"unknown ids: {sorted(want - {j['key'] for j in jobs})}")
    todo = [j for j in jobs if (j["key"] in want if want else True) and (a.force or want or not target(j)[0].exists())]
    made = []
    for j in todo:
        cast = [p for p in (char_ref(c) for c in j.get("refs", [])) if p]
        files = [("image[]", (p.stem + ".png", png(p), "image/png")) for p in STYLE + cast]
        prompt = LEAD + (CAST if cast else "") + ("Draw a new person: " if j["kind"] == "portrait" else "Draw: ") + j["prompt"] + TAIL + " " + j["negative_prompt"]
        size = j.get("size", "1024x1536")
        r = requests.post("https://api.openai.com/v1/images/edits", headers={"Authorization": f"Bearer {key}"},
                          data={"model": model, "prompt": prompt, "size": size, "quality": a.quality, "n": "1"},
                          files=files, timeout=600)
        if not r.ok:
            err = (r.json().get("error") or {}) if r.headers.get("content-type", "").startswith("application/json") else {}
            print(f"{j['key']}: failed ({r.status_code} {err.get('code') or ''}) {err.get('message') or ''}"[:300]); continue
        save(j, base64.b64decode(r.json()["data"][0]["b64_json"]))
        made.append(j["key"]); print(f"{j['key']}: ok", flush=True)
    print("made:", ",".join(made) or "none")
    if todo and not made: sys.exit(1)


if __name__ == "__main__":
    main()
