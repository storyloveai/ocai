#!/usr/bin/env python3
"""Generate illustrated cast portraits from art/portrait-jobs.jsonl through the OpenAI Images API.

Usage (the key comes from the environment, never from a file in the repo):
  OPENAI_API_KEY=... python3 tools/gen_portraits.py [--ids wenzhi,lusu] [--quality medium|high] [--force]

Two existing StoryDate covers are sent along as style references, so new portraits match the covers the
website already shows. Writes art/source/<id>.webp (full image, for later re-crops) and
art/portraits/<id>.webp (300x400, what the game embeds). Without --ids it only makes characters that have no
portrait yet. Requires: pip install requests pillow
"""
import argparse, base64, io, json, os, pathlib, sys
import requests
from PIL import Image

R = pathlib.Path(__file__).resolve().parents[1]
ART = R / "art"
REFS = [R.parent.parent / "ooc-replica/dist/assets/originals" / f for f in ("sg-004.webp", "sg-007.webp")]
LEAD = ("Use the attached images only as a reference for art style, rendering, colour and lighting. "
        "Do not copy their characters, faces, clothing or composition. Draw a new person: ")


def png(path):
    buf = io.BytesIO(); Image.open(path).convert("RGB").save(buf, "PNG"); return buf.getvalue()


def save(cid, raw):
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    (ART / "source").mkdir(exist_ok=True); (ART / "portraits").mkdir(exist_ok=True)
    full = im.copy(); full.thumbnail((768, 1152)); full.save(ART / "source" / f"{cid}.webp", quality=82)
    w, h = im.size; ch = min(h, round(w * 4 / 3))  # 3:4 from the top: the jobs ask for the face in the upper third
    im.crop((0, 0, w, ch)).resize((300, 400), Image.LANCZOS).save(ART / "portraits" / f"{cid}.webp", quality=80)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", default="")
    ap.add_argument("--quality", default="medium", choices=["low", "medium", "high"])
    ap.add_argument("--force", action="store_true", help="redo characters that already have a portrait")
    a = ap.parse_args()
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key: sys.exit("OPENAI_API_KEY is not set")
    model = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1").strip() or "gpt-image-1"
    jobs = [json.loads(l) for l in (ART / "portrait-jobs.jsonl").read_text().splitlines() if l.strip()]
    want = {x.strip() for x in a.ids.split(",") if x.strip()}
    if want - {j["character"] for j in jobs}: sys.exit(f"unknown ids: {sorted(want - {j['character'] for j in jobs})}")
    todo = [j for j in jobs if (j["character"] in want if want else True)
            and (a.force or want or not (ART / "portraits" / f"{j['character']}.webp").exists())]
    refs = [("image[]", (p.stem + ".png", png(p), "image/png")) for p in REFS]
    made = []
    for j in todo:
        prompt = LEAD + j["prompt"] + " " + j["negative_prompt"]
        r = requests.post("https://api.openai.com/v1/images/edits", headers={"Authorization": f"Bearer {key}"},
                          data={"model": model, "prompt": prompt, "size": "1024x1536", "quality": a.quality, "n": "1"},
                          files=refs, timeout=300)
        if not r.ok:
            err = (r.json().get("error") or {}) if r.headers.get("content-type", "").startswith("application/json") else {}
            print(f"{j['character']}: failed ({r.status_code} {err.get('code') or ''}) {err.get('message') or ''}"[:300]); continue
        save(j["character"], base64.b64decode(r.json()["data"][0]["b64_json"]))
        made.append(j["character"]); print(f"{j['character']}: ok")
    print("made:", ",".join(made) or "none")
    if todo and not made: sys.exit(1)


if __name__ == "__main__":
    main()
