"""插画版缺图检查：列出插画版里会退回水墨的每一处画面（场景、高光、头像、结局图）。
用法：python3 tools/art_audit.py            # 打印缺口，并写出 art/missing.json（交给 Codex 补画的清单）
      python3 tools/art_audit.py --strict   # 有缺口就以非零退出（CI 用）
规则和 app/play.src.html 的 painting()/face()/cgFigure()/endingUrl() 一致：卷一的节点用 art.illus 或 art.scene 的同名图，
卷二以后只用 art.illus；人物用 portraits/<id>.webp；高光用 cg/<id>.webp；结局用 ending/<变体>.webp（本卷的 vN_<变体> 可选）。"""
import json, glob, os, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(R, "art")
have = lambda p: os.path.exists(os.path.join(A, p))
files = [os.path.join(R, "content/campaign.json")] + sorted(glob.glob(os.path.join(R, "content/v*/campaign_v*.json")))
missing = []
for vi, f in enumerate(files):
    c = json.load(open(f, encoding="utf-8")); vol = vi + 1
    for n in c["nodes"].values():
        a = n.get("art") or {}
        ok = (a.get("illus") and have(f"scenes/{a['illus']}.webp")) or (vi == 0 and a.get("scene") and have(f"scenes/{a['scene']}.webp"))
        if not ok: missing.append({"vol": vol, "kind": "scene", "node": n["id"], "title": n["title"]["zh"], "illus": a.get("illus"), "scene": a.get("scene")})
    for cid in c["chars"]:
        if not have(f"portraits/{cid}.webp"): missing.append({"vol": vol, "kind": "portrait", "id": cid})
    for cg in c.get("cg_captions", {}):
        if not have(f"cg/{cg}.webp"): missing.append({"vol": vol, "kind": "cg", "id": cg})
for v in ["two_boat", "home", "city", "lone"]:
    if not have(f"ending/{v}.webp"): missing.append({"kind": "ending", "id": v})
# fate pictures (art/fate-jobs.jsonl) are planned, not required: until one is drawn the scene picture stands
planned = []
fj = os.path.join(A, "fate-jobs.jsonl")
if os.path.exists(fj):
    for line in open(fj, encoding="utf-8"):
        j = json.loads(line)
        if not have(f"fate/{j['name']}.webp"): planned.append({"kind": "fate", "id": j["name"], "title": j.get("title")})
json.dump({"missing": missing, "planned": planned} if planned else missing, open(os.path.join(A, "missing.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for m in missing: print("缺图", json.dumps(m, ensure_ascii=False))
for m in planned: print("待画", json.dumps(m, ensure_ascii=False))
print(f"插画版缺图：{len(missing)} 处（{len(files)} 卷）" + (f"；待画的命运图 {len(planned)} 张（不影响检查）" if planned else ""))
if "--strict" in sys.argv and missing: sys.exit(1)
