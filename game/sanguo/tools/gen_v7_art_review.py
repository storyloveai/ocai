#!/usr/bin/env python3
"""Export user-requested candidate sizes and a separate art review page; never adopt or sync."""
import argparse
import hashlib
import html
import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
CANDIDATES = ROOT / 'game/sanguo/art/candidates'
REVIEW = CANDIDATES / 'v7-review'
PUBLIC = ROOT / 'ooc-replica/dist/assets/art-v7'
RAW = 'https://raw.githubusercontent.com/storyloveai/ocai/'
LABELS = {'portrait': '第1批 · 新人物头像', 'scene': '第2批 · 卷七场景', 'ending': '第3批 · 留任结局'}
GATES = {'awaiting_adopted_portraits': '等三张新头像由 Claude 采用，再加入采用的头像参考',
         'queued_until_batch2_complete': '按用户要求，排在第2批之后',
         'awaiting_adopted_jiangwei_and_batch2': '等姜维头像采用，并按顺序完成第2批'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def export_crop(path, receipt, target):
    width, height = receipt['actual_dimensions']
    tw, th = target
    box = receipt.get('review_crop_box')
    if box is None:
        if width / height > tw / th:
            cw, ch = round(height * tw / th), height
        else:
            cw, ch = width, round(width * th / tw)
        x = (width - cw) // 2
        y = 0 if tw < th else (height - ch) // 2
        box = [x, y, cw, ch]
    x, y, cw, ch = box
    assert 0 <= x < width and 0 <= y < height and x + cw <= width and y + ch <= height
    assert abs(cw / ch - tw / th) < 0.01
    dest = path.with_name(path.stem + f'-{tw}x{th}.png')
    digest = sha(path)
    if not dest.exists() or receipt.get('crop_export', {}).get('box') != box:
        subprocess.run(['magick', str(path), '-crop', f'{cw}x{ch}+{x}+{y}', '+repage',
                        '-filter', 'Lanczos', '-resize', f'{tw}x{th}!', str(dest)], check=True)
    assert sha(path) == digest
    with Image.open(dest) as im:
        assert list(im.size) == target
        im.verify()
    return {'path': dest.relative_to(ROOT).as_posix(), 'dimensions': target, 'box': box,
            'sha256': sha(dest), 'original_sha256': digest, 'tool': 'ImageMagick magick',
            'operation': 'geometric crop and Lanczos resize only; original unchanged',
            'authorization': 'User explicitly requested both original and cropped exports in this chat.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--asset-ref', default='codex/art-v7-endings')
    args = parser.parse_args()
    assert shutil.which('magick'), 'ImageMagick is required for requested fixed-size derivative exports'
    plan = json.loads((REVIEW / 'plan.json').read_text())
    items, seen = [], set()
    for item in plan['items']:
        current = dict(item)
        current['candidates'] = []
        for letter in item['letters']:
            path = CANDIDATES / item['id'] / f'{letter}.png'
            sidecar = path.with_suffix('.json')
            if not path.exists() or not sidecar.exists():
                continue
            receipt = json.loads(sidecar.read_text())
            if receipt.get('codex_visual_check') != 'pass':
                continue
            assert receipt['authored_job'] == item['authored_job'], (item['id'], 'author brief changed')
            assert sha(path) == receipt['original_sha256'], (item['id'], 'original bytes changed')
            assert receipt['original_sha256'] not in seen, (item['id'], 'duplicate original')
            seen.add(receipt['original_sha256'])
            if item['gate']:
                assert receipt.get('adoption_confirmation'), (item['id'], 'adoption gate not cleared')
            if item['group'] == 'scene':
                required = item['authored_job']['ref_paths']
                actual = receipt['reference_inputs_in_order']
                assert [r['path'] for r in actual][-len(required):] == required
                assert [r['sha256'] for r in actual][-len(required):] == [r['sha256'] for r in item['references']]
            with Image.open(path) as im:
                assert list(im.size) == receipt['actual_dimensions']
                im.verify()
            receipt['crop_export'] = export_crop(path, receipt, item['target_dimensions'])
            sidecar.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
            relative = path.relative_to(ROOT).as_posix()
            current['candidates'].append({**receipt, 'path': relative, 'url': RAW + args.asset_ref + '/' + relative,
                                           'crop_url': RAW + args.asset_ref + '/' + receipt['crop_export']['path'],
                                           'receipt_url': RAW + args.asset_ref + '/' + sidecar.relative_to(ROOT).as_posix()})
        current['status'] = 'awaiting_claude_review' if len(current['candidates']) == 2 else ('partial' if current['candidates'] else (item['gate'] or 'pending'))
        items.append(current)
    manifest = {'issue': 68, 'branch': plan['branch'], 'asset_ref': args.asset_ref, 'items': items,
                'planned_items': len(items), 'planned_candidates': len(items) * 2,
                'completed_items': sum(len(i['candidates']) == 2 for i in items),
                'original_candidates': sum(len(i['candidates']) for i in items),
                'adoption_confirmations': plan['portrait_adoption_confirmations'],
                'crop_exports_authorized': True, 'art_adopted_by_codex': False}
    PUBLIC.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    (REVIEW / 'manifest.json').write_text(serialized)
    (PUBLIC / 'manifest.json').write_text(serialized)
    render_page(manifest)
    lines = ['# 卷七及留任结局 · 候选评审', '', f'已交 {manifest["completed_items"]}/{len(items)} 项、{manifest["original_candidates"]} 张原图，每项目标两张。', '',
             '工具：ChatGPT 自带 image_gen.imagegen，底层模型名称和 seed 未公开。没有调用按张付费的 OpenAI 图片 API。每张 PNG 原图保持工具返回的原始字节，JSON 保存完整清单原文、实际提示词、参考图及哈希。', '',
             '用户已明确要求同时交原图和裁切版。300×400 头像和 1200×480 横幅为 ImageMagick 几何裁切/缩放导出，未重绘、未添加文字水印；裁切坐标、工具和哈希均记录在 JSON 中。未放入正式 portraits/scenes/ending，未改清单或剧情，未运行 build.py / game:sync。', '',
             '三张头像必须由 Claude 采用后，才画带 after 的六个场景，并加入已采用头像。第3批按顺序排在第2批之后，其中 v7_city 也等姜维头像采用。不要把未采用的候选擅自当作新人物参考。', '',
             '评审页：`/assets/art-v7/index.html`。PR 保持 Preview，不合并。', '',
             '## 第1批头像对比：请 Claude 每人选 A 或 B', '',
             '| 角色 | A · 300×400 | B · 300×400 |', '|---|---|---|']
    for item in items:
        if item['group'] != 'portrait':
            continue
        links = []
        for c in item['candidates']:
            links.append(f'<a href="{c["url"]}"><img src="{c["crop_url"]}" width="150" height="200" alt="{item["id"]} {c["candidate"].upper()}"></a>')
        lines.append(f'| {item["id"]} | ' + ' | '.join(links + ['待生成'] * (2 - len(links))) + ' |')
    lines.extend(['', '## 三批进度', '', '| 项目 | 进度 | 等待条件 |', '|---|---|---|'])
    for item in items:
        lines.append(f'| {item["id"]} | {len(item["candidates"])}/2 | {GATES.get(item["gate"], "Claude 审图")} |')
    lines.extend(['', '## 卷七场景 A/B 对照', '', '缩略图链接到未裁原图；精确尺寸导出和生成记录见评审页。', '',
                  '| 场景 | A · 1200×480 | B · 1200×480 |', '|---|---|---|'])
    for item in items:
        if item['group'] != 'scene' or not item['candidates']:
            continue
        links = []
        for c in item['candidates']:
            links.append(f'<a href="{c["url"]}"><img src="{c["crop_url"]}" width="240" height="96" alt="{item["id"]} {c["candidate"].upper()}"></a><br>{c["description"]}')
        lines.append(f'| {item["id"]} | ' + ' | '.join(links + ['待生成'] * (2 - len(links))) + ' |')
    lines.extend(['', '## 发布状态', '',
                  '分支已推送 GitHub。当前运行环境访问 api.github.com 被代理拒绝（HTTP 403），issue 认领留言与新 PR 尚未提交；这不代表已创建 PR 或已有可访问的 Vercel 部署。PR 草稿见同目录 PR-body.md。', '',
                  'Claude 请先在 #68 记录姜维、司马懿、魏延各采用 A 还是 B，并提供正式采用路径或采用提交。六个 after 场景放行后，再按顺序进入留任结局批次。'])
    (REVIEW / 'README.md').write_text('\n'.join(lines) + '\n')
    print(json.dumps({k: manifest[k] for k in ('planned_items', 'completed_items', 'original_candidates')}, ensure_ascii=False))


def render_page(m):
    e = html.escape
    parts = ['''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>三国 · 卷七与留任结局候选</title><style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#111;color:#eee}body{margin:0}main{max-width:1400px;margin:auto;padding:28px 20px}h1{font-size:clamp(24px,4vw,38px)}p,li{color:#bbb;line-height:1.7}a{color:#e3bd75;overflow-wrap:anywhere}article{margin:28px 0;padding:24px;background:#1b1b1b;border-radius:14px;scroll-margin-top:20px}h2,figcaption{overflow-wrap:anywhere}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0;min-width:0}figure img{display:block;width:100%;height:auto;border-radius:8px}.avatar img{max-width:300px}.tiny{width:48px!important;height:64px!important;border-radius:4px}.original img{max-width:100%}figcaption{padding:12px 0;line-height:1.7}details{margin:16px 0}summary{cursor:pointer;color:#e3bd75}pre{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7;font-size:12px}.badge{color:#dfb564}.pending{background:#141414;border-radius:8px;padding:24px;color:#aaa}.filters{display:flex;flex-wrap:wrap;gap:20px;margin:24px 0}select{max-width:100%;padding:8px;background:#222;color:white;border:1px solid #666;border-radius:6px}label{display:flex;align-items:center;gap:8px}@media(max-width:700px){main{padding:20px 12px}article{padding:16px}.grid{grid-template-columns:1fr}}
</style><main><header><small>STORYDATE · ISSUE #68 · 候选原图与裁切版</small>''',
             f'<h1>{m["completed_items"]}/29 项已备好两张候选</h1><p>已交 {m["original_candidates"]} 张原图和相应尺寸导出。先审三张新头像，再放行六个依赖新头像的卷七场景；留任结局按第3批顺序推进。这里的候选尚未采用到正式游戏。</p>',
             '<p>点击裁切图查看精确尺寸版本，展开“原图”检查完整构图。原图字节保留；裁切版只做用户要求的几何裁切和缩放。工具为 ChatGPT 自带出图，底层模型名称未公开；未调用按张付费图片 API。</p>',
             '<p><a href="manifest.json">完整记录</a> · <a href="https://github.com/storyloveai/ocai/issues/68">Issue #68</a> · <a href="https://github.com/storyloveai/ocai/tree/codex/art-v7-endings/game/sanguo/art/candidates">GitHub 原图目录</a></p>',
             '<div class="filters"><label>批次 <select id="group"><option value="all">全部三批</option><option value="portrait">第1批 · 头像</option><option value="scene">第2批 · 卷七场景</option><option value="ending">第3批 · 留任结局</option></select></label><label>进度 <select id="status"><option value="all">全部</option><option value="ready">已有候选</option><option value="gated">等待采用或前一批</option></select></label><span id="count" aria-live="polite"></span></div></header>']
    for item in m['items']:
        candidates = item['candidates']
        parts.append(f'<article id="{item["id"]}" data-group="{item["group"]}" data-ready="{bool(candidates).__str__().lower()}" data-gated="{bool(item["gate"]).__str__().lower()}"><span class="badge">{LABELS[item["group"]]} · {len(candidates)}/2</span><h2>{e(item["id"])}</h2>')
        parts.append('<p>' + e(item['authored_job'].get('composition', item['authored_job'].get('prompt', ''))) + '</p><div class="grid">')
        for letter in item['letters']:
            c = next((x for x in candidates if x['candidate'] == letter), None)
            if c is None:
                parts.append('<div class="pending">' + letter.upper() + ' · ' + e(GATES.get(item['gate'], '待生成')) + '</div>')
                continue
            tw, th = item['target_dimensions']
            parts.append(f'<figure class="{"avatar" if item["group"] == "portrait" else "scene"}"><a href="{e(c["crop_url"])}" target="_blank" rel="noopener"><img loading="lazy" src="{e(c["crop_url"])}" alt="{e(item["id"])} 候选 {letter.upper()} {tw}×{th}"></a><figcaption><strong>{letter.upper()}</strong> · {e(c["description"])}<br><a href="{e(c["crop_url"])}">{tw}×{th} 裁切版</a> · <a href="{e(c["url"])}">未裁原图</a> · <a href="{e(c["receipt_url"])}">生成及裁切记录</a></figcaption>')
            if item['group'] == 'portrait':
                parts.append(f'<p>48px 缩略识别</p><img class="tiny" loading="lazy" src="{e(c["crop_url"])}" alt="{e(item["id"])} {letter.upper()} 48px 缩略图">')
            parts.append(f'<details class="original"><summary>展开原图 · {c["actual_dimensions"][0]}×{c["actual_dimensions"][1]}</summary><a href="{e(c["url"])}"><img loading="lazy" src="{e(c["url"])}" alt="未裁原图 {e(item["id"])} {letter.upper()}"></a></details></figure>')
        parts.append('</div><details><summary>作者清单原文 / 等待条件</summary><pre>' + e(json.dumps(item['authored_job'], ensure_ascii=False, indent=2)) + '</pre></details></article>')
    parts.append('''<script>const group=document.querySelector('#group'),status=document.querySelector('#status');function filter(){let n=0;for(const a of document.querySelectorAll('article')){a.hidden=(group.value!=='all'&&a.dataset.group!==group.value)||(status.value==='ready'&&a.dataset.ready!=='true')||(status.value==='gated'&&a.dataset.gated!=='true');if(!a.hidden)n++}document.querySelector('#count').textContent='显示 '+n+' 项'}group.addEventListener('change',filter);status.addEventListener('change',filter);filter();</script></main></html>''')
    (PUBLIC / 'index.html').write_text(''.join(parts))


if __name__ == '__main__':
    main()
