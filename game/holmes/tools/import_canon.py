#!/usr/bin/env python3
"""把福尔摩斯原著 60 篇抽成纯文本底本：game/holmes/canon/<缩写>.txt
用法：python3 -I tools/import_canon.py <sh-canon 仓库的 docs 目录>
来源：https://github.com/fcbond/sh-canon（排版 CC BY 4.0；原著正文是公版）。只取正文文字，不带对方的排版和注释。"""
import html, json, pathlib, re, sys

SRC = pathlib.Path(sys.argv[1]).resolve()
OUT = pathlib.Path(__file__).resolve().parents[1] / "canon"
OUT.mkdir(exist_ok=True)

def text(s):
    s = re.sub(r"(?is)<(script|style|nav|header|footer)[^>]*>.*?</\1>", "", s)
    s = re.sub(r"(?is)<span class=\"(?:sidenote|marginnote)\".*?</span>", "", s)
    s = re.sub(r"(?i)<br\s*/?>|</p>|</h\d>|</li>", "\n", s)
    s = html.unescape(re.sub(r"<[^>]+>", "", s))
    lines = [re.sub(r"[ \t]+", " ", l).strip() for l in s.splitlines()]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip() + "\n"

index = {}
for p in sorted(SRC.glob("*.html")):
    if p.stem in ("index", "works"): continue
    raw = p.read_text("utf-8")
    title = html.unescape(re.sub(r"<[^>]+>", "", (re.search(r"(?is)<title>(.*?)</title>", raw) or [None, p.stem])[1])).strip()
    t = text(raw)
    (OUT / f"{p.stem}.txt").write_text(t, "utf-8")
    index[p.stem] = {"title": title, "words": len(t.split())}
(OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n", "utf-8")
(OUT / "SOURCE.md").write_text("原著正文：柯南·道尔，公版。抽取自 https://github.com/fcbond/sh-canon（Francis Bond 等整理，排版和注释 CC BY 4.0，这里只保留正文）。\n", "utf-8")
print(len(index), "篇，共", sum(v["words"] for v in index.values()), "词")
