#!/usr/bin/env python3
"""检查一本书的声音提示表（<书>/audio/cues.json）：引用的场景、CG、场景节点、台词、声音文件都得存在。
用法：python3 game/engine/tools/audio_check.py game/holmes
有错误（剧本里找不到、文件不存在）→ 退出码 1；配乐文件还没到、有背景没配声音 → 只提示，不算错。"""
import json, pathlib, sys

LIB = pathlib.Path(__file__).resolve().parents[1] / "audio/lib"

def main(book):
    book = pathlib.Path(book)
    cues = json.loads((book / "audio/cues.json").read_text("utf-8"))
    camp = json.loads((book / "content/campaign.json").read_text("utf-8"))
    errs, notes = [], []
    def snd(name, where):
        if not ((book / "audio/sfx" / f"{name}.mp3").is_file() or (LIB / f"{name}.mp3").is_file()):
            errs.append(f"{where}：声音「{name}」不存在（game/engine/audio/lib/ 和 audio/sfx/ 里都没有）")
    def bgm(name, where):
        if name not in cues.get("bgm", {}): errs.append(f"{where}：配乐「{name}」没有在 bgm 里登记")
    for k, b in cues.get("bgm", {}).items():
        if not (book / "audio" / b["file"]).is_file(): notes.append(f"配乐 {k}（{b.get('zh', '')}）还没到：{b['file']}")
    if cues.get("title_bgm"): bgm(cues["title_bgm"], "title_bgm")
    for group, table in (("scenes", camp["art"]["bg"]), ("cg", camp["art"]["cg"])):
        for k, c in cues.get(group, {}).items():
            if k not in table: errs.append(f"{group}.{k}：剧本里没有这个{'背景' if group == 'scenes' else 'CG'}")
            if c.get("bgm"): bgm(c["bgm"], f"{group}.{k}")
            for t in ("amb", "sfx"):
                if c.get(t): snd(c[t], f"{group}.{k}")
    for k in camp["art"]["bg"]:
        used = any(o.get("op") == "bg" and o.get("id") == k for n in camp["nodes"].values() for o in n.get("script", []))
        if used and k not in cues.get("scenes", {}): notes.append(f"背景 {k} 没有配声音")
    texts = {}
    for nid, n in camp["nodes"].items():
        ops = list(n.get("script", [])) + [o for c in n.get("choices", []) for o in c.get("script", [])]
        texts[nid] = [o["t"]["zh"] for o in ops if o.get("op") == "say"]
    for nid, c in cues.get("nodes", {}).items():
        if nid not in camp["nodes"]: errs.append(f"nodes.{nid}：剧本里没有这个场景")
        if c.get("bgm"): bgm(c["bgm"], f"nodes.{nid}")
        for t in ("amb", "sfx"):
            if c.get(t): snd(c[t], f"nodes.{nid}")
    for k, v in cues.get("events", {}).items():
        if not k.endswith("_vol"): snd(v, f"events.{k}")
    for i, c in enumerate(cues.get("lines", [])):
        where = f"lines[{i}]（{c['node']} · {c['match']}）"
        if c["node"] not in texts: errs.append(f"{where}：剧本里没有这个场景"); continue
        hits = sum(c["match"] in t for t in texts[c["node"]])
        if hits == 0: errs.append(f"{where}：这个场景里找不到这句台词（剧本改过？）")
        snd(c["sfx"], where)
    for n in notes: print("提示：", n)
    for e in errs: print("错误：", e)
    print(("FAIL" if errs else "PASS") + f": {book.name} 声音提示表，{len(errs)} 个错误，{len(notes)} 条提示")
    return 1 if errs else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "."))
