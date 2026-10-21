#!/usr/bin/env python3
"""Integrate StoryDate original covers + descriptions into the replica.

Usage: python3 scripts/integrate_storydate_originals.py <dir-with-webp-covers>
Reads content/storydate-originals/*.json, writes dist/assets/originals/*.webp,
dist/assets/storydate-originals.js and adds play openings to dist/assets/scenarios.json.
Deterministic (fixed seed). No plays/comments/real-person authors are invented.
"""
import json, random, sys, pathlib
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1])
stories = json.load(open(root/'content/storydate-originals/stories-draft.json'))
stories = stories if isinstance(stories, list) else stories['stories']
tk = json.load(open(root/'content/storydate-originals/three-kingdoms.json'))
for s in tk: s['genre'] = 'Three Kingdoms'
items = tk + stories
SITE_GENRE = {'Academy':'Fantasy','Adventure':'Fantasy','Dark Fantasy':'Horror','Romance':'Romance','Eastern Fantasy':'Oriental Fantasy','Three Kingdoms':'History'}
ref = json.load(open(root/'dist/assets/reference-pages.json'))
protect = {'69f414d90abbab6f6a2c8131','6ab3b736e2e641b7fbeb6312','6ab70e13499de207c7ca13c4','6aaad8746c080a5d3ff0402a','6ac749a7ab586f53935a023d','6ac749fc973e4d7b825f7520','6ab2217bfa760164cd6c2f12'}
protect |= {f['href'].split('/')[-1] for f in ref['features']}
old = [d['id'] for d in ref['catalog'] if d['id'] not in protect]
rng = random.Random(20261021)
slots = sorted(rng.sample(old, len(items)), key=old.index)  # which old titles get replaced
order = items[:]; rng.shuffle(order)                         # which new title lands in which slot
out_dir = root/'dist/assets/originals'; out_dir.mkdir(parents=True, exist_ok=True)
entries = []
for slot, s in zip(slots, order):
    im = Image.open(src/f"{s['id']}.webp").convert('RGB').resize((640, 960), Image.LANCZOS)
    im.save(out_dir/f"{s['id']}.webp", 'WEBP', quality=82, method=6)
    g = SITE_GENRE[s['genre']]
    entries.append(dict(id=s['id'], title=s['title'], title_zh=s['title_zh'], author='StoryDate Studio', genre=g,
        type='story', original=True, plays='', tag=g, replaces=slot, image=f"/assets/originals/{s['id']}.webp",
        description=s['summary'], description_zh=s['summary_zh'], character_brief=s['character_brief']))
(root/'dist/assets/storydate-originals.js').write_text('export const storydateOriginals='+json.dumps(entries, ensure_ascii=False)+';\n')
sc = json.load(open(root/'dist/assets/scenarios.json'))
for e in entries:
    sc['stories'][e['id']] = dict(title=e['title'],
        opening=f"> {e['title']}\n\n*{e['description']}*\n\n*{e['character_brief']}.*",
        suggestions=["I take a careful look around before doing anything.", "I introduce myself and ask what is going on.", "I decide to follow the first lead I find."])
json.dump(sc, open(root/'dist/assets/scenarios.json','w'), ensure_ascii=False)
print(len(entries), 'entries; replaced', len(set(slots)), 'old titles')
