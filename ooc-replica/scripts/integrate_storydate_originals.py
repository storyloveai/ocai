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
opening_sug = json.load(open(root/'content/storydate-originals/opening-suggestions.json'))
old_plays = {d['id']: d.get('plays','') for d in ref['catalog']}
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
        type='story', original=True, plays='', sortPlays=old_plays.get(slot,''), tag=g, replaces=slot, image=f"/assets/originals/{s['id']}.webp",
        description=s['summary'], description_zh=s['summary_zh'], character_brief=s['character_brief']))
sc = json.load(open(root/'dist/assets/scenarios.json'))
SLOTS = ['morning', 'afternoon', 'evening']
LEAD = {'morning': 'Morning light settles over the scene.', 'afternoon': 'The afternoon is quiet, and the day is still open.', 'evening': 'Evening falls, and the lamps come on one by one.'}
for e in entries:
    o = opening_sug[e['id']]
    by_time = {k: [o['t'][i], o['b'], o['c']] for i, k in enumerate(SLOTS)}
    sc['stories'][e['id']] = dict(title=e['title'],
        opening=f"> {e['title']}\n\n*{e['description']}*\n\n*{e['character_brief']}.*",
        openingByTime={k: f"> {e['title']} · {k.capitalize()}\n\n*{LEAD[k]}*\n\n*{e['description']}*\n\n*{e['character_brief']}.*" for k in SLOTS},
        suggestions=by_time['afternoon'], suggestionsByTime=by_time)
json.dump(sc, open(root/'dist/assets/scenarios.json','w'), ensure_ascii=False)

# ---- Three Kingdoms characters (copies for the Character page) ----
openings = json.load(open(root/'content/storydate-originals/character-openings.json'))
cands = [c['id'] for c in ref['characters'] if c['id'] not in {f['href'].split('/')[-1] for f in ref.get('characterFeatures', [])}]
cslots = sorted(random.Random(20261021).sample(cands, len(tk)), key=cands.index)
chars = []
for slot, s in zip(cslots, tk):
    cid = 'sgc-' + s['id'][3:]
    name = s['title'].replace('The Tale of ', '')
    im = Image.open(src/f"{s['id']}.webp").convert('RGB').crop((0, 90, 1024, 1114)).resize((512, 512), Image.LANCZOS)
    im.save(out_dir/f"{cid}.webp", 'WEBP', quality=82, method=6)
    chars.append(dict(id=cid, title=name, title_zh=s['title_zh'].replace('传', ''), author='StoryDate Studio', genre='History', type='character',
        original=True, plays='', replaces=slot, image=f"/assets/originals/{cid}.webp", story_id=s['id'],
        description=f"{s['character_brief'].split(',')[0]} of the Three Kingdoms. {s['summary']}", description_zh=s['summary_zh'], character_brief=s['character_brief']))
    o = opening_sug[s['id']]
    by_time = {k: [o['t'][i], o['b'], o['c']] for i, k in enumerate(SLOTS)}
    sc['stories'][cid] = dict(title=name,
        opening=f"> {name}\n\n*{s['character_brief']}.*\n\n💬{name} | {openings[s['id']]['afternoon']}",
        openingByTime={k: f"> {name} · {k.capitalize()}\n\n*{LEAD[k]}*\n\n*{s['character_brief']}.*\n\n💬{name} | {openings[s['id']][k]}" for k in SLOTS},
        suggestions=by_time['afternoon'], suggestionsByTime=by_time)
(root/'dist/assets/storydate-originals.js').write_text('export const storydateOriginals='+json.dumps(entries, ensure_ascii=False)+';\nexport const storydateCharacters='+json.dumps(chars, ensure_ascii=False)+';\n')
json.dump(sc, open(root/'dist/assets/scenarios.json','w'), ensure_ascii=False)
print(len(entries), 'entries; replaced', len(set(slots)), 'old titles')
