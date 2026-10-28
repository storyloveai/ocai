#!/usr/bin/env python3
"""Publish the separate volume-eight candidate review; never adopt or sync game art."""
import argparse
import hashlib
import html
import json
from pathlib import Path

from PIL import Image

from gen_v7_art_review import export_crop

ROOT = Path(__file__).resolve().parents[3]
CANDIDATES = ROOT / 'game/sanguo/art/candidates'
REVIEW = CANDIDATES / 'v8-review'
PUBLIC = ROOT / 'ooc-replica/dist/assets/art-v8'
RAW = 'https://raw.githubusercontent.com/storyloveai/ocai/'
GATES = {
    'awaiting_adopted_portrait_and_missing_references': '等新头像采用、补齐正式参考',
    'conflicting_wenzhi_age': '等 Claude 统一温芷年龄',
    'conflicting_successor_age': '等 Claude 统一尾声接班人年龄',
    'awaiting_user_authorized_style_fallback': '等用户许可临时画风参考',
    'ready_with_authorized_style_fallback': '临时画风参考已获许可，待生成',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--asset-ref', default='codex/art-v7-endings')
    args = parser.parse_args()
    plan = json.loads((REVIEW / 'plan.json').read_text())
    items, hashes = [], set()
    for item in plan['items']:
        current = dict(item)
        current['candidates'] = []
        for letter in item['letters']:
            path = CANDIDATES / item['id'] / f'{letter}.png'
            sidecar = path.with_suffix('.json')
            if not path.exists() or not sidecar.exists():
                continue
            c = json.loads(sidecar.read_text())
            if c.get('codex_visual_check') != 'pass':
                continue
            assert plan.get('fallback_authorization_confirmed') is True, 'User approval is required for missing-reference fallback'
            assert item['gate'] == 'ready_with_authorized_style_fallback', 'Do not pass adoption or contradictory-brief gates'
            assert c['authored_job'] == item['authored_job'], 'Do not change authored job'
            assert c['reference_inputs_in_order'] == item['proposed_references'], 'Actual references must match authorized plan'
            assert c['missing_authored_ref_paths'] == item['missing_authored_ref_paths']
            assert sha(path) == c['original_sha256'] and c['original_sha256'] not in hashes
            hashes.add(c['original_sha256'])
            with Image.open(path) as im:
                assert list(im.size) == c['actual_dimensions']
                im.verify()
            width, height = c['actual_dimensions']
            if abs(width / height - 2.5) < 0.02:
                c['review_crop_box'] = [0, 0, width, height]
            c['crop_export'] = export_crop(path, c, [1200, 480])
            sidecar.write_text(json.dumps(c, ensure_ascii=False, indent=2) + '\n')
            rel = path.relative_to(ROOT).as_posix()
            current['candidates'].append({**c, 'path': rel,
                                          'url': RAW + args.asset_ref + '/' + rel,
                                          'crop_url': RAW + args.asset_ref + '/' + c['crop_export']['path'],
                                          'receipt_url': RAW + args.asset_ref + '/' + sidecar.relative_to(ROOT).as_posix()})
        current['status'] = 'awaiting_claude_review' if len(current['candidates']) == 2 else item['gate']
        items.append(current)
    manifest = {'issue': 56, 'source_pr': 70, 'asset_ref': args.asset_ref,
                'source_v8_commit': plan['source_v8_commit'],
                'fallback_authorization': plan['fallback_authorization'],
                'items': items, 'planned_items': len(items),
                'completed_items': sum(len(i['candidates']) == 2 for i in items),
                'original_candidates': sum(len(i['candidates']) for i in items),
                'adopted_by_codex': False}
    PUBLIC.mkdir(parents=True, exist_ok=True)
    data = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    (REVIEW / 'manifest.json').write_text(data)
    (PUBLIC / 'manifest.json').write_text(data)
    render_page(manifest)
    lines = ['# 卷八《归晋》候选评审', '',
             f'已交 {manifest["completed_items"]}/21 项、{manifest["original_candidates"]} 张原图，每项目标 A/B 两张及相应 1200×480 导出。', '',
             '来源：Claude 的 PR #70，清单提交 `' + plan['source_v8_commit'] + '`。原始清单未改，完整 prompt / negative_prompt 原文保存在生成记录。', '',
             '参考处理：' + plan['fallback_authorization'], '',
             '模型：ChatGPT 自带 image_gen.imagegen，底层模型名称与 seed 未公开；没有调用按张付费图片 API。原图字节保留，ImageMagick 只做已获用户许可的几何裁切与缩放。最终采用请 Claude 审图。', '',
             '[卷七头像与场景评审](../v7-review/README.md) · [需要 Claude 处理的源清单问题](source-problems.md)', '',
             '## A/B 对比', '', '| id | A | B | 进度 |', '|---|---|---|---|']
    for item in items:
        cols = []
        for letter in ['a', 'b']:
            c = next((v for v in item['candidates'] if v['candidate'] == letter), None)
            cols.append(f'<a href="{c["url"]}"><img src="{c["crop_url"]}" width="240" height="96" alt="{item["id"]} {letter.upper()}"></a><br>{c["description"]}' if c else '—')
        status = '待 Claude 审图' if len(item['candidates']) == 2 else GATES[item['gate']]
        lines.append(f'| {item["id"]} | ' + ' | '.join(cols) + f' | {status} |')
    lines.extend(['', '评审页路径：`/assets/art-v8/index.html`。当前环境仍对 GitHub API 返回代理 403；分支可推送，但 issue 留言、新 PR 和 Vercel Preview 均不能假定已创建。未合并或上线。', ''])
    (REVIEW / 'README.md').write_text('\n'.join(lines))
    print(json.dumps({k: manifest[k] for k in ['planned_items', 'completed_items', 'original_candidates']}))


def render_page(m):
    e = html.escape
    parts = ['''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>三国·归晋候选评审</title><style>
body{margin:0;background:#111;color:#eee;font-family:system-ui,sans-serif}main{max-width:1400px;margin:auto;padding:28px 20px}p{color:#bbb;line-height:1.7}a{color:#e3bd75;overflow-wrap:anywhere}article{background:#1b1b1b;border-radius:14px;padding:24px;margin:28px 0}h2,figcaption{overflow-wrap:anywhere}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0;min-width:0}img{display:block;width:100%;height:auto;border-radius:8px}figcaption{padding:12px 0;line-height:1.7}details{margin:16px 0}summary{cursor:pointer;color:#e3bd75}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;line-height:1.7}.pending{padding:24px;background:#141414;border-radius:8px;color:#bbb}.filter{display:flex;flex-wrap:wrap;gap:20px;align-items:center}select{padding:10px;background:#222;color:#eee;border:1px solid #777;border-radius:6px}@media(max-width:700px){main{padding:20px 12px}article{padding:16px}.grid{grid-template-columns:1fr}}
</style><main>''', f'<h1>卷八《归晋》· {m["completed_items"]}/21 项备好两张候选</h1>',
             '<p>仅供 Claude 审图，尚未采用进游戏。每张保留未裁原图与 1200×480 导出。缺失参考的处理与生成记录均公开，作者清单没有改写。</p>',
             '<p>' + e(m['fallback_authorization']) + '</p>',
             '<p><a href="../art-v7/index.html">卷七头像与场景评审</a> · <a href="manifest.json">完整生成记录</a></p>',
             '<div class="filter"><label>进度 <select id="status"><option value="all">全部</option><option value="ready">已有候选</option><option value="waiting">等待条件</option></select></label><span id="count" aria-live="polite"></span></div>']
    for item in m['items']:
        parts.append(f'<article data-ready="{str(bool(item["candidates"])).lower()}" id="{item["id"]}"><h2>{e(item["id"])}</h2><p>{e(item["authored_job"]["composition"])}</p><div class="grid">')
        for letter in ['a', 'b']:
            c = next((v for v in item['candidates'] if v['candidate'] == letter), None)
            if c is None:
                parts.append('<div class="pending">' + letter.upper() + ' · ' + e(GATES[item['gate']]) + '</div>')
                continue
            parts.append(f'<figure><a href="{e(c["crop_url"])}"><img loading="lazy" src="{e(c["crop_url"])}" alt="{item["id"]} {letter.upper()} 1200×480"></a><figcaption><strong>{letter.upper()}</strong> · {e(c["description"])}<br><a href="{e(c["url"])}">未裁原图</a> · <a href="{e(c["receipt_url"])}">生成与参考记录</a></figcaption><details class="original"><summary>展开原图 · {c["actual_dimensions"][0]}×{c["actual_dimensions"][1]}</summary><img loading="lazy" src="{e(c["url"])}" alt="{item["id"]} {letter.upper()} 未裁原图"></details></figure>')
        parts.append('</div><details><summary>作者原始清单与缺失参考</summary><pre>' + e(json.dumps({'authored_job': item['authored_job'], 'missing_authored_ref_paths': item['missing_authored_ref_paths'], 'actual_or_proposed_references': item['proposed_references']}, ensure_ascii=False, indent=2)) + '</pre></details></article>')
    parts.append('''<script>const s=document.querySelector('#status');function filter(){let n=0;for(const a of document.querySelectorAll('article')){a.hidden=(s.value==='ready'&&a.dataset.ready!=='true')||(s.value==='waiting'&&a.dataset.ready==='true');if(!a.hidden)n++}document.querySelector('#count').textContent='显示 '+n+' 项'}s.addEventListener('change',filter);filter();</script></main></html>''')
    (PUBLIC / 'index.html').write_text(''.join(parts))


if __name__ == '__main__':
    main()
