#!/usr/bin/env python3
"""Render the candidate-only review page. Never adopt, crop, build or sync art."""
import argparse
import hashlib
import html
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'game/sanguo/art/candidates'
PUBLIC = ROOT / 'ooc-replica/dist/assets/art-candidates'
RAW = 'https://raw.githubusercontent.com/storyloveai/ocai/'
PREVIEW = 'https://storydate-zhou-git-codex-art-candidates-zhou-zeyas-projects.vercel.app/assets/art-candidates/index.html'
LABELS = {'batch1': '卷二、三 · 第1批', 'batch2': '卷二、三 · 第2批', 'v4': '卷四', 'v5': '卷五', 'v6': '卷六'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--asset-ref', default='codex/art-candidates', help='Commit containing the new original PNGs')
    args = parser.parse_args()
    plan = json.loads((OUT / 'review-plan.json').read_text())
    items, hashes = [], set()
    for entry in plan['items']:
        item = dict(entry)
        item['references'] = [{**r, 'url': RAW + r['source_commit'] + '/' + r['path']} for r in entry['references']]
        originals = []
        for letter in entry['letters']:
            path = OUT / entry['id'] / (letter + '.png')
            receipt_path = path.with_suffix('.json')
            if not path.exists() or not receipt_path.exists():
                continue
            receipt = json.loads(receipt_path.read_text())
            assert receipt['authored_job'] == entry['authored_job'], (entry['id'], letter, 'authored brief changed')
            assert receipt['cropped'] is False
            expected = entry['authored_job']['ref_paths']
            actual = receipt['reference_inputs_in_order']
            assert [r['path'] for r in actual][-len(expected):] == expected, (entry['id'], 'reference order')
            assert [r['sha256'] for r in actual][-len(expected):] == [r['sha256'] for r in entry['references']]
            with Image.open(path) as im:
                dimensions = list(im.size)
                assert im.format == 'PNG'
                im.verify()
            digest = sha(path)
            assert digest == receipt['original_sha256'], (entry['id'], letter, 'original changed')
            assert digest not in hashes, (entry['id'], 'duplicate PNG')
            hashes.add(digest)
            asset_ref = entry.get('asset_ref', args.asset_ref)
            relative = path.relative_to(ROOT).as_posix()
            originals.append({**receipt, 'candidate': letter, 'path': relative, 'url': RAW + asset_ref + '/' + relative,
                              'sha256': digest, 'dimensions': dimensions, 'bytes': path.stat().st_size})
        item['candidates'] = originals
        item['status'] = 'adopted_by_claude' if entry['selected_by_claude'] else ('awaiting_claude_review' if len(originals) == 2 else 'pending')
        item['archived_candidates'] = [{'candidate': c, 'path': f'game/sanguo/art/candidates/{entry["id"]}/{c}.png',
                                       'url': RAW + '1066c33a077a6ae37ba94f8e69be69955f525f63' + f'/game/sanguo/art/candidates/{entry["id"]}/{c}.png',
                                       'reason': 'Claude rejected the forward-pointing arrow; retained as review history, not a current candidate.'}
                                      for c in entry.get('archived_candidates', [])]
        items.append(item)
    complete = sum(len(x['candidates']) == 2 for x in items)
    count = sum(len(x['candidates']) for x in items)
    new = [x for x in items if x['round'] == 2]
    new_count = sum(len(x['candidates']) for x in new)
    new_complete = sum(len(x['candidates']) == 2 for x in new)
    adopted = sum(x['status'] == 'adopted_by_claude' for x in items)
    manifest = {'issue': 56, 'branch': 'codex/art-candidates', 'candidate_asset_ref': args.asset_ref,
                'expected_scenes': len(items), 'target_candidates_per_scene': 2, 'scenes_with_two_candidates': complete,
                'actual_candidates': count, 'round2_expected_scenes': len(new), 'round2_complete_scenes': new_complete,
                'round2_candidates': new_count, 'already_adopted_scenes': adopted,
                'archived_rejected_originals': sum(len(x['archived_candidates']) for x in items),
                'cropped': False, 'preview': PREVIEW, 'items': items}
    PUBLIC.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    (OUT / 'manifest.json').write_text(serialized)
    (PUBLIC / 'manifest.json').write_text(serialized)
    render_html(manifest)
    lines = ['# 三国·谋士：场景原图候选', '', f'Issue #56 · PR #62。第二轮 {new_complete}/{len(new)} 场景，共 {new_count} 张新原图；第一轮 {adopted} 场景已由 Claude 通过 PR #65 采用。', '',
             f'预览：{PREVIEW}', '',
             '工具：ChatGPT 自带 image_gen.imagegen。底层模型名称和 seed 不由工具公开；未调用按张付费的 OpenAI 图片 API。所有 PNG 保留工具返回的原始字节，未裁图。每张旁的 JSON 保存清单原文、实际完整提示词、全部参考图及其哈希、尺寸和一句话说明。', '',
             '第二轮使用 Claude PR #65 的固定提交 67361b46d8c60ec131c5e967f385f00220ad75e1；该 PR 已合并到 main。review-plan.json 是候选评审用的原文快照，不是游戏作图清单。补充的人物一致性参考（刘备老年形象、孟获等）也在各张记录中单独列明。', '',
             '请 Claude 逐张审图，选择、裁成 1200×480、采用、同步网站由 Claude 处理；本分支只交候选，不改原作图清单、剧情或正式插画，不运行 build.py / game:sync。', '',
             '庞德第一轮 A/B 被 Claude 否决，保留为历史；当前只审修正回射方向的 C/D，不把 A/B 计入当前候选数。', '',
             '| 场景 | 状态 | 当前候选 |', '|---|---|---|']
    for item in items:
        status = 'Claude 已采用 ' + item['selected_by_claude'].upper() if item['selected_by_claude'] else str(len(item['candidates'])) + '/2，待 Claude 审图'
        links = ' / '.join(f'[{c["candidate"].upper()}]({item["id"]}/{c["candidate"]}.png)' for c in item['candidates']) or '待生成'
        lines.append(f'| {item["id"]} | {status} | {links} |')
    (OUT / 'README.md').write_text('\n'.join(lines) + '\n')
    print(json.dumps({k: manifest[k] for k in ('expected_scenes', 'scenes_with_two_candidates', 'round2_complete_scenes', 'round2_candidates', 'actual_candidates')}, ensure_ascii=False))


def render_html(m):
    e = html.escape
    parts = ['''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>三国·谋士 · 场景原图评审</title><style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#111;color:#eee}body{margin:0}main{max-width:1440px;margin:auto;padding:28px 20px}h1{font-size:clamp(24px,4vw,38px);margin-bottom:12px}p,li{line-height:1.7;color:#bbb}a{color:#e3bd75;overflow-wrap:anywhere}header{padding-bottom:24px}article{margin:28px 0;padding:24px;background:#1b1b1b;border-radius:14px;scroll-margin-top:20px}h2{font-size:22px;overflow-wrap:anywhere}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0;min-width:0}figure img{display:block;width:100%;height:auto;border-radius:8px;background:#101010}figcaption{padding:10px 0;line-height:1.6;overflow-wrap:anywhere}.pending{padding:40px 16px;background:#141414;color:#999;border-radius:8px}.refs{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}.refs img{height:140px;max-width:100%;object-fit:contain}.refs figure{max-width:360px}.refs figcaption{font-size:12px}details{margin-top:18px}summary{cursor:pointer;color:#e3bd75}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.7}label{display:inline-flex;gap:10px;align-items:center;flex-wrap:wrap}select{padding:8px;background:#222;color:#fff;border:1px solid #666;border-radius:6px;max-width:100%}.badge{color:#dfb564;font-size:14px}.links,.filters{display:flex;gap:20px;flex-wrap:wrap}.filters{margin:20px 0}.selected{outline:2px solid #caa765;outline-offset:5px}@media(max-width:700px){main{padding:20px 12px}article{padding:16px}.grid{grid-template-columns:1fr}}
</style><main><header><small>STORYDATE · ISSUE #56 · 原图评审</small>''']
    parts.extend([f'<h1>第二轮 · {m["round2_complete_scenes"]}/{m["round2_expected_scenes"]} 场景已备好候选</h1>',
                  f'<p>本轮新增 {m["round2_candidates"]} 张原图：卷四两处补画、卷五 17 场景、卷六 14 场景。第一轮 {m["already_adopted_scenes"]} 场景已由 Claude 采用，保留供对照。共 {m["scenes_with_two_candidates"]}/{m["expected_scenes"]} 场景、{m["actual_candidates"]} 张当前候选；另留庞德第一轮两张否决原图作历史。</p>',
                  '<p>候选未经裁切。点击图片看原始 PNG；正式采用、裁切和接入由 Claude 处理。工具：ChatGPT 自带 image_gen.imagegen，底层模型名称未公开；不调用按张付费的 OpenAI 图片 API。</p>',
                  '<nav class="links"><a href="manifest.json">完整清单与生成记录</a><a href="https://github.com/storyloveai/ocai/pull/62">PR #62</a><a href="https://github.com/storyloveai/ocai/issues/56">Issue #56</a><a href="https://github.com/storyloveai/ocai/tree/codex/art-candidates/game/sanguo/art/candidates">GitHub 原图目录</a></nav>',
                  '<div class="filters"><label>范围 <select id="status"><option value="round2">本轮新增 / 待审（33场景）</option><option value="adopted">Claude 已采用（29场景）</option><option value="all">全部（62场景）</option></select></label><label>卷 / 批次 <select id="group"><option value="all">全部卷</option>'])
    for group, label in LABELS.items():
        parts.append(f'<option value="{group}">{label}</option>')
    parts.append('</select></label><span id="visible-count" aria-live="polite"></span></div></header>')
    for item in m['items']:
        adopted = item['selected_by_claude']
        status = 'Claude 已采用 ' + adopted.upper() if adopted else '待 Claude 审图'
        parts.append(f'<article data-group="{item["group"]}" data-status="{"adopted" if adopted else "round2"}" id="{item["id"]}"' + (' hidden' if adopted else '') + f'><span class="badge">{LABELS[item["group"]]} · {len(item["candidates"])}/2 候选 · {status}</span><h2>{e(item["id"])}</h2><p>{e(item["authored_job"]["composition"])}</p><div class="grid">')
        for letter in item['letters']:
            candidate = next((c for c in item['candidates'] if c['candidate'] == letter), None)
            if not candidate:
                parts.append(f'<div class="pending">{letter.upper()} · 尚未生成</div>')
                continue
            url = e(candidate['url'])
            notes = '；'.join(candidate.get('review_notes', []))
            parts.append(f'<figure' + (' class="selected"' if adopted == letter else '') + f'><a href="{url}" target="_blank" rel="noopener"><img loading="lazy" src="{url}" alt="{e(item["id"])} 候选 {letter.upper()} 未裁原图"></a><figcaption><strong>{letter.upper()}</strong> · {e(candidate["description"])}<br>{candidate["dimensions"][0]} × {candidate["dimensions"][1]} · PNG 原图<br><a href="{e(candidate["url"].removesuffix(".png") + ".json")}" target="_blank" rel="noopener">生成记录与全部实际参考输入</a>' + (f'<p>待复核：{e(notes)}</p>' if notes else '') + '</figcaption></figure>')
        parts.append('</div>')
        if item['archived_candidates']:
            parts.append('<details><summary>第一轮 A/B：Claude 已否决（箭向前），保留历史</summary><p>当前只审上方 C/D。历史：' + ' / '.join(f'<a href="{e(c["url"])}">{c["candidate"].upper()} 原图</a>' for c in item['archived_candidates']) + '</p></details>')
        parts.append('<details><summary>清单指定的参考图（旧图，不计为候选）</summary><div class="refs">')
        for ref in item['references']:
            parts.append(f'<figure><a href="{e(ref["url"])}"><img loading="lazy" src="{e(ref["url"])}" alt="参考图 {e(ref["path"])}"></a><figcaption>{e(ref["path"])}</figcaption></figure>')
        parts.append('</div></details><details><summary>Claude 清单原文与验收点</summary><pre>' + e(json.dumps(item['authored_job'], ensure_ascii=False, indent=2)) + '</pre></details></article>')
    parts.append('''<script>const group=document.querySelector('#group'),status=document.querySelector('#status');function filter(){let count=0;for(const a of document.querySelectorAll('article')){a.hidden=(group.value!=='all'&&a.dataset.group!==group.value)||(status.value!=='all'&&a.dataset.status!==status.value);if(!a.hidden)count++}document.querySelector('#visible-count').textContent='显示 '+count+' 个场景'}group.addEventListener('change',filter);status.addEventListener('change',filter);filter();</script></main></html>''')
    (PUBLIC / 'index.html').write_text(''.join(parts))


if __name__ == '__main__':
    main()
