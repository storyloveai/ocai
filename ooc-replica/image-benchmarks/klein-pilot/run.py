#!/usr/bin/env python3
"""Serial, opt-in image-service pilot. Default prepares a report without requests."""
import argparse
import base64
import hashlib
import getpass
import html
import json
import os
from pathlib import Path
import shutil
import struct
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parent
MAX_RESPONSE = 80 * 1024 * 1024


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # Never forward an Authorization header to another URL.


def sha(data):
    return hashlib.sha256(data).hexdigest()


def png_size(data):
    if len(data) < 33 or data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
        raise ValueError('Expected a PNG response')
    width, height = struct.unpack('>II', data[16:24])
    if not (1 <= width <= 16384 and 1 <= height <= 16384):
        raise ValueError('Unexpected PNG dimensions')
    return [width, height]


def multipart(case, model):
    boundary = 'klein-pilot-' + uuid.uuid4().hex
    parts = []
    fields = {'model': model, 'prompt': case['prompt'], 'seed': str(case['seed'])}
    for name, value in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    refs = case['reference_paths']
    for reference in refs:
        path = ROOT / reference
        field = 'image' if len(refs) == 1 else 'image[]'
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; filename="{path.name}"\r\nContent-Type: image/png\r\n\r\n'.encode() + path.read_bytes() + b'\r\n')
    parts.append(f'--{boundary}--\r\n'.encode())
    return b''.join(parts), 'multipart/form-data; boundary=' + boundary


def render(out, spec, records):
    by_id = {r['id']: r for r in records}
    cards = []
    for case in spec['cases']:
        record = by_id.get(case['id'], {'status': 'not_run'})
        baseline = case['baseline']
        source = out / baseline['file']
        source.parent.mkdir(parents=True, exist_ok=True)
        if not source.exists():
            shutil.copyfile(ROOT / baseline['file'], source)
        first_label = '编辑输入原图' if case['task'] == 'edit' else '此前内置出图（历史基线）'
        picture = f'<img src="{html.escape(record["file"])}" alt="团队服务输出">' if record['status'] == 'generated' else '<div class="empty">尚未生成 · 没有可比较的 API 成图</div>'
        detail = {k: record[k] for k in ['status', 'dimensions', 'elapsedSeconds', 'requestedSeed', 'returnedSeed', 'error'] if k in record}
        cards.append(f'<section><h2>{html.escape(case["id"])}</h2><div class="pair"><figure><figcaption>{first_label}</figcaption><img src="{html.escape(baseline["file"])}" alt="原图"></figure><figure><figcaption>团队 Klein 服务输出</figcaption>{picture}</figure></div><pre>{html.escape(json.dumps(detail, ensure_ascii=False, indent=2))}</pre><details><summary>原始请求提示词</summary><p>{html.escape(case["prompt"])}</p></details></section>')
    (out / 'index.html').write_text('<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>StoryDate 出图小样对比</title><style>body{background:#141413;color:#f5f3ed;font:16px/1.7 system-ui;margin:24px auto;max-width:1100px;padding:0 18px}h1{font-size:28px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0;min-width:0}figcaption{color:#d8bd91}img{display:block;width:100%;max-height:650px;object-fit:contain;background:#20201e}.empty{min-height:380px;background:#20201e;display:grid;place-items:center;color:#aaa}section{margin:40px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}details p{overflow-wrap:anywhere;color:#ccc}@media(max-width:600px){.pair{grid-template-columns:1fr}.empty{min-height:150px}}</style><h1>StoryDate · 出图服务小样</h1><p>两项同原始提示词文生图＋一项参考图编辑。原图未裁切或修饰；网页仅等比显示。未成功生成的格子保持空白，不能用来评价质量。</p><p>网关会扩写提示词并忽略尺寸；这是服务管线与历史成图的比较，不是受控模型排名。编辑项是输入/输出保真检查，没有伪称另一套工具也执行了同一编辑。</p>' + ''.join(cards) + '</html>', encoding='utf-8')


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--run', action='store_true', help='Actually send generation/edit requests; no automatic retries')
    ap.add_argument('--base-url', default=os.environ.get('ZEN5_IMAGE_BASE_URL', ''))
    ap.add_argument('--only', choices=['gu-chengye', 'song-zhixia', 'gu-morning-edit'])
    ap.add_argument('--key-stdin', action='store_true', help='Read the service key from an un-echoed pipe, not argv')
    ap.add_argument('--timeout', type=int, default=600)
    ap.add_argument('--archive', action='store_true', help='Zip only the image results/report; no credentials are recorded')
    args = ap.parse_args()
    spec = json.loads((ROOT / 'cases.json').read_text())
    out = args.out.resolve()
    if out == ROOT or ROOT in out.parents:
        ap.error('Keep private run outputs outside the tracked benchmark directory')
    out.mkdir(parents=True, exist_ok=True)
    report = out / 'results.json'
    records = json.loads(report.read_text())['records'] if report.exists() else []
    render(out, spec, records)
    if not args.run:
        report.write_text(json.dumps({'modelAlias': spec['modelAlias'], 'limitations': spec['limitations'], 'records': records}, ensure_ascii=False, indent=2) + '\n')
        print('Prepared report only; zero requests. ' + str(out / 'index.html'))
        return 0
    url = urllib.parse.urlsplit(args.base_url)
    if url.scheme != 'https' or not url.hostname or url.username or url.password or url.query or url.fragment:
        ap.error('Supply the documented HTTPS Base URL without credentials, query or fragment')
    key = ((getpass.getpass('Service test key: ') if sys.stdin.isatty() else sys.stdin.readline()) if args.key_stdin else os.environ.get('ZEN5_API_KEY', '')).strip()
    if not key:
        ap.error('ZEN5_API_KEY is missing; no request sent')
    opener = urllib.request.build_opener(NoRedirect())
    failed = False
    for case in spec['cases']:
        if args.only and case['id'] != args.only:
            continue
        baseline = ROOT / case['baseline']['file']
        if sha(baseline.read_bytes()) != case['baseline']['sha256']:
            raise ValueError('Baseline checksum mismatch')
        identity = sha(json.dumps({'model': spec['modelAlias'], 'case': case}, sort_keys=True).encode())
        previous = next((r for r in records if r['id'] == case['id']), None)
        if previous and previous['status'] == 'generated':
            if previous['requestSha256'] != identity:
                raise ValueError('Existing output belongs to different inputs; choose a fresh output directory')
            image = out / previous['file']
            if not image.exists() or sha(image.read_bytes()) != previous['sha256']:
                raise ValueError('Existing output is missing or changed; choose a fresh output directory')
            print(case['id'] + ': existing verified result; no new request', flush=True)
            continue
        if case['task'] == 'edit':
            body, content_type = multipart(case, spec['modelAlias'])
            route = '/images/edits'
        else:
            body = json.dumps({'model': spec['modelAlias'], 'prompt': case['prompt'], 'seed': case['seed']}).encode()
            content_type = 'application/json'
            route = '/images/generations'
        record = {'id': case['id'], 'task': case['task'], 'status': 'failed', 'requestSha256': identity, 'requestedSeed': case['seed'], 'referenceSha256': [sha((ROOT / x).read_bytes()) for x in case['reference_paths']]}
        started = time.perf_counter()
        try:
            req = urllib.request.Request(args.base_url.rstrip('/') + route, method='POST', data=body, headers={'Authorization': 'Bearer ' + key, 'Content-Type': content_type, 'Accept': 'application/json'})
            with opener.open(req, timeout=args.timeout) as response:
                raw = response.read(MAX_RESPONSE + 1)
                if len(raw) > MAX_RESPONSE:
                    raise ValueError('Image response exceeds size limit')
                record['httpStatus'] = response.status
                response_data = json.loads(raw)
            items = response_data.get('data')
            if not isinstance(items, list) or len(items) != 1 or not isinstance(items[0].get('b64_json'), str):
                raise ValueError('Expected exactly one b64_json result')
            decoded = base64.b64decode(items[0]['b64_json'], validate=True)
            dimensions = png_size(decoded)
            filename = case['id'] + '.png'
            (out / filename).write_bytes(decoded)
            record.update(status='generated', file=filename, dimensions=dimensions, sha256=sha(decoded), bytes=len(decoded), returnedSeed=items[0].get('seed'), revisedPrompt=items[0].get('revised_prompt'), serviceCreated=response_data.get('created'))
        except urllib.error.HTTPError as e:
            record.update(httpStatus=e.code, error='HTTP ' + str(e.code) + '; request was not retried')
        except urllib.error.URLError as e:
            reason = str(e.reason)
            error = 'Proxy tunnel refused the connection' if 'Tunnel connection failed' in reason else 'DNS, TLS or network connection failed'
            record['error'] = error + '; request was not retried'
        except (ValueError, KeyError, TypeError, TimeoutError, OSError) as e:
            record['error'] = (type(e).__name__ + ': ' + str(e)).replace(key, '[redacted]')[:300]
        record['elapsedSeconds'] = round(time.perf_counter() - started, 3)
        records = [r for r in records if r['id'] != record['id']] + [record]
        report.write_text(json.dumps({'modelAlias': spec['modelAlias'], 'limitations': spec['limitations'], 'records': records}, ensure_ascii=False, indent=2) + '\n')
        render(out, spec, records)
        print(json.dumps({k: record[k] for k in ['id', 'status', 'dimensions', 'elapsedSeconds', 'error'] if k in record}), flush=True)
        if record['status'] != 'generated':
            failed = True
            break  # Stop the pilot after a failure; never queue more work blindly.
    if args.archive:
        archive = shutil.make_archive(str(out), 'zip', root_dir=out)
        print('Result archive: ' + archive, flush=True)
    return 2 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
