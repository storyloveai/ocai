#!/usr/bin/env python3
"""Issue #57: only the three Batch 0 scenes; no automatic progression or provider fallback."""
import argparse
import hashlib
import html
import json
from pathlib import Path
import shutil
import sys
import zipfile
import gen_comfy as comfy

BATCH0 = ('scene-v3_clinic', 'scene-v3_dingjun', 'scene-g_cold')
REPO = Path(__file__).resolve().parents[3]
REVIEW = REPO / 'ooc-replica/dist/assets/art-batch0'
RECORDS = REPO / 'ooc-replica/.cache/art-batch0/records.json'
JOBS = REVIEW / 'inputs/edition-jobs-batch0.jsonl'
INPUT_ROOT = REVIEW / 'inputs/reference-root'
PROVENANCE = REVIEW / 'inputs/provenance.json'
LABELS = {'scene-v3_clinic': '温芷 · 街市医馆', 'scene-v3_dingjun': '法正与黄忠 · 定军', 'scene-g_cold': '刘备与诸葛亮 · 玩家背影'}



def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def selected_jobs():
    provenance = json.loads(PROVENANCE.read_text())
    if sha(JOBS) != provenance['snapshot_sha256']:
        raise ValueError('The pinned Claude job snapshot changed; do not edit authored prompts')
    if provenance.get('selected_ids') != list(BATCH0):
        raise ValueError('Pinned source IDs do not match Batch 0')
    for ref in provenance.get('references', []):
        relative = Path(ref['source'])
        path = (INPUT_ROOT / relative).resolve()
        if relative.is_absolute() or '..' in relative.parts or not path.is_relative_to(INPUT_ROOT.resolve()):
            raise ValueError('Invalid pinned reference path')
        if not path.is_file() or sha(path) != ref['sha256']:
            raise ValueError('A pinned Claude reference is missing or changed')
    rows = [json.loads(line) for line in JOBS.read_text().splitlines() if line.strip()]
    selected = [job for key in BATCH0 for job in rows if job.get('id') == key]
    if len(selected) != 3 or tuple(job['id'] for job in selected) != BATCH0:
        raise ValueError('Batch 0 requires exactly the three authored scene IDs')
    return selected


def core_args(args):
    result = comfy.parser().parse_args([])
    for name in ('unet', 'clip', 'vae', 'seed', 'steps', 'cfg', 'timeout', 'poll', 'use_proxy'):
        setattr(result, name, getattr(args, name))
    result.jobs = str(JOBS)
    result.ids = ','.join(BATCH0)
    result.output_root = str(REVIEW / 'candidates')
    result.reference_root = str(INPUT_ROOT)
    result.records = str(RECORDS)
    result.dry_run = args.dry_run
    result.force = False  # never overwrite/submit another candidate automatically
    return result


def build_review():
    REVIEW.mkdir(parents=True, exist_ok=True)
    snapshots = selected_jobs()
    records = json.loads(RECORDS.read_text()) if RECORDS.exists() else []
    items = []
    def reference(path, label):
        path = Path(path)
        if not path.is_file(): return {'label': label, 'missing': True}
        relative = path.relative_to(INPUT_ROOT)
        dest = path  # already an unchanged, pinned reference under the review input directory
        return {'label': label, 'source': str(relative), 'file': str(dest.relative_to(REVIEW)), 'sha256': sha(dest)}
    for job in snapshots:
        key = job['id']
        styles, cast = comfy.resolve_references(job, [], INPUT_ROOT)
        refs = [reference(path, cid + ' · Claude 指定角色参考') for cid, path in zip(job.get('refs', []), cast)]
        refs.extend(reference(path, 'Claude 指定场景 · 画风对照') for path in styles)
        record = next((r for r in reversed(records) if r.get('id') == key), {})
        item = {'id': key, 'label': LABELS[key], 'state': 'awaiting_company_run', 'authored_job_snapshot': job, 'target_dimensions': job['out'], 'references': refs}
        if record.get('status') == 'completed':
            candidate_paths = [Path(record[field]).resolve() for field in ('original', 'output')]
            if all(p.is_relative_to((REVIEW / 'candidates').resolve()) and p.is_file() for p in candidate_paths):
                from PIL import Image
                with Image.open(candidate_paths[1]) as image:
                    if list(image.size) != job['out']: raise ValueError('Crop does not match authored target dimensions')
                item.update(state='candidate_awaiting_claude_review', seed=record['seed'], prompt_id=record['prompt_id'], model_settings={name: record.get('models', {}).get(name) for name in ('unet', 'clip', 'vae', 'steps', 'cfg')})
                for field, path in zip(('original', 'crop'), candidate_paths):
                    item[field] = {'file': str(path.relative_to(REVIEW)), 'sha256': sha(path)}
        elif record:
            item.update(state=record.get('status', 'failed'), error=record.get('error', 'Unknown error type'))
        items.append(item)
    count = sum(item['state'] == 'candidate_awaiting_claude_review' for item in items)
    manifest = {'issue': 57, 'batch': 0, 'allowed_ids': list(BATCH0), 'expected_scenes': 3, 'candidates_per_scene': 1, 'generated_scenes': count, 'review_passed': False, 'next_batch_enabled': False, 'input_snapshot': str(JOBS.relative_to(REPO)), 'input_snapshot_sha256': sha(JOBS), 'source': json.loads(PROVENANCE.read_text()), 'provider': 'company ComfyUI only; never substitutes conversation image generation or OpenAI API', 'items': items}
    (REVIEW / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    write_page(manifest)
    source_readme = REPO / 'ooc-replica/docs/ART-BATCH0.md'
    if source_readme.exists(): shutil.copyfile(source_readme, REVIEW / 'RUNBOOK.md')
    archive_path = REVIEW / 'storydate-batch0-review.zip'
    if count:
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(REVIEW.rglob('*')):
                if path.is_file() and path != archive_path: archive.write(path, path.relative_to(REVIEW))
    return manifest


def write_page(manifest):
    esc = html.escape
    count = manifest['generated_scenes']
    cards = []
    for item in manifest['items']:
        generated = item['state'] == 'candidate_awaiting_claude_review'
        if generated:
            pictures = '<div class="outputs">' + ''.join(f'<figure><a href="{esc(item[field]["file"])}" target="_blank" rel="noopener"><img src="{esc(item[field]["file"])}" alt="{esc(item["label"] + label)}"></a><figcaption>{label}</figcaption></figure>' for field, label in [('original', 'ComfyUI 原图'), ('crop', '真实裁切图 · 1200×480')]) + '</div>'
        else:
            pictures = '<p class="pending">尚无本批新图；以下仅为已有参考，不能作为出图成功证明。</p>'
        references = ''.join(f'<figure><a href="{esc(ref["file"])}" target="_blank" rel="noopener"><img src="{esc(ref["file"])}" alt="{esc(ref["label"])}"></a><figcaption>{esc(ref["label"])}</figcaption></figure>' for ref in item['references'] if not ref.get('missing'))
        status = '待 Claude 评审' if generated else '等待公司本机执行'
        cards.append(f'<article><header><div><small>{esc(item["id"])}</small><h2>{esc(item["label"])}</h2></div><span>{status}</span></header>{pictures}<h3>Claude #58 指定参考 · 非本批新图</h3><div class="references">{references}</div></article>')
    download = '<a class="button" href="storydate-batch0-review.zip" download>下载本批候选包</a>' if count else '<p>候选包会在产生真实图片后提供。</p>'
    page = '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>三国第 0 批 · Issue #57</title><style>
*{box-sizing:border-box}body{margin:0;background:#121212;color:#f2eee6;font:15px/1.7 system-ui,"PingFang SC",sans-serif}main{max-width:1240px;margin:auto;padding:40px 24px}a{color:#d2b17b}h1{font-size:32px;font-weight:500;margin:0 0 12px}p,small,figcaption{color:#aaa}h2{font-size:22px;font-weight:500;margin:4px 0}h3{font-size:14px;font-weight:500;color:#bbb}small{font-size:12px}article{background:#1b1b1b;border:1px solid #ffffff18;border-radius:14px;margin:32px 0;padding:24px}header{display:flex;justify-content:space-between;align-items:center;gap:16px}header span{font-size:12px;color:#d2b17b;white-space:nowrap}.notice{padding:20px;border:1px solid #b898573d;border-radius:10px;background:#b898570c}.pending{padding:24px 0;color:#d2b17b}.references,.outputs{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}figure{margin:0;min-width:0}.references img{width:100%;height:220px;object-fit:contain;background:#101010;border-radius:8px}.outputs img{width:100%;height:auto;border-radius:8px}figcaption{font-size:12px;padding:8px 0}.button{display:inline-flex;align-items:center;min-height:44px;padding:10px 18px;background:#c5a46c;color:#171717;border-radius:8px;text-decoration:none}a:focus-visible{outline:2px solid #d2b17b;outline-offset:4px}.links{display:flex;flex-wrap:wrap;gap:24px}@media(max-width:600px){main{padding:24px 16px}article{padding:16px}h1{font-size:27px}header{align-items:start}h2{font-size:19px}.references,.outputs{grid-template-columns:1fr}}
</style></head><body><main>'''
    page += f'<small>STORYDATE · ISSUE #57 · BATCH 0</small><h1>第 0 批试样 · {count}/3 已生成</h1><div class="notice"><strong>仅限三张，下一批保持关闭。</strong><p>输入固定为 Claude PR #58 的三条快照，执行范围以用户指定的第 0 批为准。此页不自动出图，也不代表 Claude 已评审。生成后同页会显示原图和真实裁切图。</p><div class="links"><a href="RUNBOOK.md">本机执行命令</a><a href="manifest.json">本批清单与状态</a><a href="https://github.com/storyloveai/ocai/issues/57">Issue #57</a></div></div>'
    page += ''.join(cards) + download + '<p>原作图清单未改；候选图不会自动采用到正式游戏。评审通过前不执行下一批。</p></main></body></html>'
    (REVIEW / 'index.html').write_text(page)


def parser():
    base = comfy.parser().parse_args([])
    ap = argparse.ArgumentParser(description=__doc__)
    mode = ap.add_mutually_exclusive_group(); mode.add_argument('--prepare', action='store_true'); mode.add_argument('--dry-run', action='store_true')
    ap.add_argument('--seed', type=int, default=20261027)
    for name, kind in [('unet', str), ('clip', str), ('vae', str), ('steps', int), ('cfg', float), ('timeout', float), ('poll', float)]:
        ap.add_argument('--' + name, type=kind, default=getattr(base, name.replace('-', '_')))
    ap.add_argument('--use-proxy', action='store_true')
    return ap


def run(args, execute=None):
    before = sha(JOBS)
    selected_jobs()
    if args.steps < 1 or args.timeout <= 0 or args.poll <= 0 or not 0 <= args.seed < 2 ** 64:
        raise ValueError('Invalid execution parameters')
    if args.prepare:
        manifest = build_review(); print(f"Prepared Batch 0 review: {manifest['generated_scenes']}/3 real outputs."); return 0
    core = core_args(args)
    if args.dry_run: return (execute or comfy.run)(core)
    if not core.url:
        build_review(); print('COMFYUI_API_URL is not configured. No GPU task submitted. See ooc-replica/docs/ART-BATCH0.md.', file=sys.stderr); return 2
    result = 1
    try:
        result = (execute or comfy.run)(core)
    finally:
        if sha(JOBS) != before: raise RuntimeError('Authored job manifest changed during execution; inspect it before proceeding')
        manifest = build_review()
    return result if result else (0 if manifest['generated_scenes'] == 3 else 1)


if __name__ == '__main__':
    try: sys.exit(run(parser().parse_args()))
    except (ValueError, OSError, json.JSONDecodeError) as error: sys.exit(str(error))
