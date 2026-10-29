#!/usr/bin/env python3
"""Qwen-Image-Edit-2511 client. Reads authored jobs unchanged; never calls another image service.

Requires requests and Pillow only for actual generation. --dry-run needs standard Python only.
Official template: Comfy-Org/workflow_templates @ e7cd011d4ded3411c2f481200544f0be6fdc962e.
The API graph below follows its non-Lightning base-model path (40 steps, CFG 4, shift 3.1).
"""
import argparse
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import secrets
import sys
import time
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

R = Path(__file__).resolve().parents[1]
ART = R / 'art'
COVERS = R.parents[1] / 'ooc-replica/dist/assets/originals'
CHAR_COVERS = dict(liubei='sg-001', caocao='sg-002', guanyu='sg-003', zhuge='sg-004',
                   zhouyu='sg-005', zhangfei='sg-006', diaochan='sg-007', zhaoyun='sg-008')
DEFAULT_STYLE = [COVERS / f'{name}.webp' for name in ('sg-001', 'sg-004', 'sg-007', 'sg-008')]


def safe_id(value):
    if not isinstance(value, str) or not re.fullmatch(r'[A-Za-z0-9_-]+', value):
        raise ValueError('Job/character identifiers must contain only letters, digits, _ or -')
    return value


def job_id(job):
    return safe_id(job.get('character') if job.get('kind', 'portrait') == 'portrait' else job.get('id'))


def target(job):
    kind = job.get('kind', 'portrait')
    if kind == 'portrait':
        return ART / 'portraits' / f"{safe_id(job['character'])}.webp", (300, 400), 'top'
    dims = job.get('out')
    if not isinstance(dims, list) or len(dims) != 2 or any(type(n) is not int or not 1 <= n <= 8192 for n in dims):
        raise ValueError('Non-portrait jobs require two positive out dimensions, at most 8192')
    if kind == 'cover':
        return ART / 'cover.webp', tuple(dims), 'center'
    folder = {'scene': 'scenes', 'cg': 'cg', 'ending': 'ending'}.get(kind)
    if not folder:
        raise ValueError('Unsupported job kind')
    return ART / folder / f"{safe_id(job['name'])}.webp", tuple(dims), 'center'


def canvas_size(job):
    raw = job.get('size', f"{job.get('width', 1024)}x{job.get('height', 1536)}")
    match = re.fullmatch(r'(\d+)x(\d+)', str(raw))
    if not match or any(not 64 <= int(n) <= 4096 for n in match.groups()):
        raise ValueError('size must be WIDTHxHEIGHT, with dimensions 64–4096')
    return tuple(map(int, match.groups()))


def char_ref(cid):
    safe_id(cid)
    paths = [ART / 'source' / f'{cid}.comfy.{ext}' for ext in ('png', 'webp', 'jpg')]
    paths += [ART / 'source' / f'{cid}.webp', ART / 'portraits' / f'{cid}.webp']
    if cid in CHAR_COVERS:
        paths.append(COVERS / f'{CHAR_COVERS[cid]}.webp')
    return next((path for path in paths if path.is_file()), None)


def sheet(paths, size, labels=None):
    from PIL import Image, ImageOps, ImageDraw
    if not paths:
        raise ValueError('At least one style image is required')
    board = Image.new('RGB', size, '#eeeeee')
    columns = min(2, len(paths)); rows = math.ceil(len(paths) / columns)
    cell = (size[0] // columns, size[1] // rows)
    draw = ImageDraw.Draw(board)
    for i, path in enumerate(paths):
        with Image.open(path) as source:
            image = ImageOps.contain(source.convert('RGB'), (cell[0], max(1, cell[1] - (20 if labels else 0))))
        x = (i % columns) * cell[0]; y = (i // columns) * cell[1]
        board.paste(image, (x + (cell[0] - image.width) // 2, y))
        if labels:
            draw.text((x + 4, y + cell[1] - 18), labels[i], fill='#111111')
    buf = io.BytesIO(); board.save(buf, 'PNG'); return buf.getvalue()


def reference_images(job, styles):
    refs = job.get('refs', [])
    paths = [char_ref(cid) for cid in refs]
    if any(path is None for path in paths):
        raise ValueError('Missing character references: ' + ', '.join(cid for cid, path in zip(refs, paths) if path is None))
    if not styles or any(not path.is_file() for path in styles):
        raise ValueError('Style references are missing; use --style or restore the existing style images')
    images = [sheet(styles, canvas_size(job))]
    # The official encoder has three image slots. Never silently discard extra characters.
    if len(paths) > 2:
        images.append(sheet(paths, (768, 1024), refs))
    else:
        images.extend(sheet([path], (768, 1024)) for path in paths)
    return images


def workflow(job, images, args, seed):
    if not isinstance(job.get('prompt'), str) or not job['prompt'].strip():
        raise ValueError('A non-empty authored prompt is required')
    width, height = canvas_size(job)
    if args.workflow_api:
        template = json.loads(Path(args.workflow_api).read_text())
        if not isinstance(template, dict) or not template or any(not isinstance(n, dict) or 'class_type' not in n for n in template.values()):
            raise ValueError('--workflow-api must be an API-format prompt, not the UI graph')
        values = dict(prompt=job['prompt'], negative_prompt=job.get('negative_prompt', ''), seed=seed,
                      width=width, height=height, unet=args.unet, clip=args.clip, vae=args.vae)
        values.update({f'image{i + 1}': name for i, name in enumerate(images)})
        def bind(value):
            if isinstance(value, dict): return {k: bind(v) for k, v in value.items()}
            if isinstance(value, list): return [bind(v) for v in value]
            if isinstance(value, str) and re.fullmatch(r'\{\{\w+\}\}', value):
                key = value[2:-2]
                if key not in values: raise ValueError(f'Missing workflow binding: {key}')
                return values[key]
            return value
        return bind(template)
    graph = {
        '1': {'class_type': 'UNETLoader', 'inputs': {'unet_name': args.unet, 'weight_dtype': 'default'}},
        '2': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': args.clip, 'type': 'qwen_image', 'device': 'default'}},
        '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': args.vae}},
        '4': {'class_type': 'ModelSamplingAuraFlow', 'inputs': {'model': ['1', 0], 'shift': 3.1}},
        '5': {'class_type': 'CFGNorm', 'inputs': {'model': ['4', 0], 'strength': 1.0}},
        '20': {'class_type': 'FluxKontextImageScale', 'inputs': {'image': ['10', 0]}},
        '21': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['20', 0], 'vae': ['3', 0]}},
        '30': {'class_type': 'KSampler', 'inputs': {'model': ['5', 0], 'positive': ['24', 0], 'negative': ['25', 0], 'latent_image': ['21', 0], 'seed': seed, 'steps': args.steps, 'cfg': args.cfg, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': 1.0}},
        '31': {'class_type': 'VAEDecode', 'inputs': {'samples': ['30', 0], 'vae': ['3', 0]}},
        '32': {'class_type': 'SaveImage', 'inputs': {'images': ['31', 0], 'filename_prefix': 'StoryDate/' + job_id(job)}},
    }
    for i, image in enumerate(images):
        graph[str(10 + i)] = {'class_type': 'LoadImage', 'inputs': {'image': image}}
    for node, prompt in [('22', job['prompt']), ('23', job.get('negative_prompt', ''))]:
        inputs = dict(clip=['2', 0], vae=['3', 0], prompt=prompt)
        inputs.update({f'image{i + 1}': [str(10 + i), 0] for i in range(len(images))})
        graph[node] = {'class_type': 'TextEncodeQwenImageEditPlus', 'inputs': inputs}
    for node, conditioning in [('24', '22'), ('25', '23')]:
        graph[node] = {'class_type': 'FluxKontextMultiReferenceLatentMethod', 'inputs': {'conditioning': [conditioning, 0], 'reference_latents_method': 'index_timestep_zero'}}
    return graph


class Client:
    def __init__(self, url, use_proxy=False, token=None, session=None):
        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https') or not parsed.netloc or parsed.username or parsed.password or parsed.query or parsed.fragment:
            raise ValueError('COMFYUI_API_URL must be an HTTP(S) base URL without embedded credentials')
        if session is None:
            import requests
            session = requests.Session()
        self.session = session; self.session.trust_env = use_proxy
        if token: self.session.headers['Authorization'] = 'Bearer ' + token
        self.url = url.rstrip('/')

    def call(self, method, path, **kwargs):
        response = self.session.request(method, self.url + path, timeout=(10, 120), allow_redirects=False, **kwargs)
        if not 200 <= response.status_code < 300:
            raise RuntimeError(f'ComfyUI {path.split("?")[0]} returned HTTP {response.status_code}')
        return response

    def check(self, graph):
        info = self.call('GET', '/object_info').json()
        for node in graph.values():
            kind = node['class_type']
            if kind not in info: raise ValueError('ComfyUI node is not installed: ' + kind)
            required = info[kind].get('input', {}).get('required', {})
            for name in ('unet_name', 'clip_name', 'vae_name'):
                choices = required.get(name)
                if name in node['inputs'] and choices and isinstance(choices[0], list) and node['inputs'][name] not in choices[0]:
                    raise ValueError('Required model is not installed: ' + node['inputs'][name])

    def upload(self, raw):
        data = self.call('POST', '/upload/image', files={'image': (uuid.uuid4().hex + '.png', raw, 'image/png')}, data={'type': 'input', 'overwrite': 'false'}).json()
        return '/'.join(part for part in (data.get('subfolder', ''), data['name']) if part)

    def submit(self, graph):
        data = self.call('POST', '/prompt', json={'prompt': graph, 'client_id': str(uuid.uuid4())}).json()
        if not isinstance(data.get('prompt_id'), str) or data.get('node_errors'):
            raise RuntimeError('ComfyUI rejected the workflow; inspect server node errors')
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,128}', data['prompt_id']):
            raise RuntimeError('ComfyUI returned an invalid prompt_id')
        return data['prompt_id']

    def wait(self, prompt_id, output_nodes, timeout, poll):
        deadline = time.monotonic() + timeout
        while True:
            item = self.call('GET', '/history/' + prompt_id).json().get(prompt_id)
            if item:
                state = item.get('status', {})
                if state.get('status_str') == 'error': raise RuntimeError('ComfyUI execution failed; inspect server history')
                for key in output_nodes:
                    images = item.get('outputs', {}).get(key, {}).get('images', [])
                    if images: return self.call('GET', '/view', params=images[0]).content
                if state.get('completed'): raise RuntimeError('ComfyUI completed without a SaveImage result')
            if time.monotonic() >= deadline: raise TimeoutError('Still queued/running; rerun to resume this prompt_id')
            time.sleep(poll)


def save_image(job, raw):
    from PIL import Image
    out, (width, height), anchor = target(job)
    with Image.open(io.BytesIO(raw)) as source:
        extension = {'PNG': 'png', 'JPEG': 'jpg', 'WEBP': 'webp'}.get(source.format)
        if not extension: raise ValueError('Unsupported ComfyUI output image format')
        image = source.convert('RGB')
    original = ART / 'source' / f'{job_id(job)}.comfy.{extension}'
    original.parent.mkdir(parents=True, exist_ok=True); original.write_bytes(raw)
    w, h = image.size
    crop_w, crop_h = (round(h * width / height), h) if w / h > width / height else (w, round(w * height / width))
    x = (w - crop_w) // 2; y = 0 if anchor == 'top' else (h - crop_h) // 2
    out.parent.mkdir(parents=True, exist_ok=True)
    image.crop((x, y, x + crop_w, y + crop_h)).resize((width, height), Image.Resampling.LANCZOS).save(out, quality=80)
    return str(original), str(out)


def write_records(path, records):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)


def run(args, client_factory=Client):
    jobs_path = Path(args.jobs); jobs_path = jobs_path if jobs_path.is_absolute() else R / jobs_path
    jobs = [json.loads(line) for line in jobs_path.read_text().splitlines() if line.strip()]
    ids = [job_id(job) for job in jobs]
    if len(set(ids)) != len(ids): raise ValueError('Duplicate job IDs')
    wanted = {safe_id(value.strip()) for value in args.ids.split(',') if value.strip()}
    if wanted - set(ids): raise ValueError('Unknown IDs: ' + ', '.join(sorted(wanted - set(ids))))
    styles = [Path(path) if Path(path).is_absolute() else R / path for path in args.style] if args.style else DEFAULT_STYLE
    todo = [job for job in jobs if (not wanted or job_id(job) in wanted) and (args.force or not target(job)[0].exists())]
    if args.dry_run:
        print(json.dumps([{'id': job_id(job), 'output': str(target(job)[0]), 'crop': target(job)[1], 'refs': [{'id': cid, 'path': str(char_ref(cid)) if char_ref(cid) else None} for cid in job.get('refs', [])], 'style': [{'path': str(path), 'exists': path.is_file()} for path in styles], 'size': canvas_size(job)} for job in todo], ensure_ascii=False, indent=2)); return 0
    if not todo: print('No missing outputs selected.'); return 0
    if not args.url: raise ValueError('COMFYUI_API_URL is not set')
    record_path = Path(args.records); record_path = record_path if record_path.is_absolute() else R / record_path
    records = json.loads(record_path.read_text()) if record_path.exists() else []
    if not isinstance(records, list): raise ValueError('Generation records must be a JSON array')
    client = client_factory(args.url, args.use_proxy, os.environ.get('COMFYUI_API_TOKEN'))
    failures = 0
    for job in todo:
        key = job_id(job)
        settings = {'unet': args.unet, 'clip': args.clip, 'vae': args.vae, 'steps': args.steps, 'cfg': args.cfg, 'style': list(map(str, styles)), 'seed': args.seed, 'endpoint_hash': hashlib.sha256(args.url.encode()).hexdigest()}
        signature = hashlib.sha256(json.dumps({'job': job, 'settings': settings, 'workflow': Path(args.workflow_api).read_text() if args.workflow_api else None}, sort_keys=True).encode()).hexdigest()
        old = next((item for item in reversed(records) if item.get('id') == key and item.get('prompt_id')), None)
        record = {'id': key, 'fingerprint': signature, 'seed': args.seed if args.seed is not None else secrets.randbelow(2 ** 63), 'started_at': datetime.now(timezone.utc).isoformat(), 'status': 'preparing', 'models': settings}
        records.append(record)
        try:
            reference_count = 1 + (len(job.get('refs', [])) if len(job.get('refs', [])) <= 2 else 1)
            graph = workflow(job, [f'reference{i}.png' for i in range(reference_count)], args, record['seed'])
            outputs = [key for key, node in graph.items() if node['class_type'] == 'SaveImage']
            if not outputs: raise ValueError('Workflow must contain a SaveImage output')
            if old and not args.force:
                if old.get('fingerprint') != signature: raise ValueError('Pending task settings changed; use original settings to resume or --force to submit a new task')
                record.update(prompt_id=old['prompt_id'], seed=old['seed'], status='queued')
            else:
                client.check(graph)
                names = [client.upload(raw) for raw in reference_images(job, styles)]
                graph = workflow(job, names, args, record['seed'])
                record.update(prompt_id=client.submit(graph), status='queued')
            write_records(record_path, records)  # persist prompt_id before the first poll
            raw = client.wait(record['prompt_id'], outputs, args.timeout, args.poll)
            original, out = save_image(job, raw)
            record.update(status='completed', original=original, output=out)
            print(f'{key}: saved {out}', flush=True)
        except Exception as error:
            failures += 1; reason = str(error) if type(error) is ValueError else type(error).__name__
            record.update(status='timeout' if isinstance(error, TimeoutError) else 'failed', error=reason)
            # Store error types, never URLs, credentials, server tracebacks or authored prompt text.
            print(f'{key}: {reason}; see generation records / ComfyUI history', file=sys.stderr, flush=True)
        finally:
            write_records(record_path, records)
    return 1 if failures else 0


def parser():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--jobs', default='art/edition-jobs-v23.jsonl'); ap.add_argument('--ids', default='')
    ap.add_argument('--dry-run', action='store_true'); ap.add_argument('--force', action='store_true')
    ap.add_argument('--url', default=os.environ.get('COMFYUI_API_URL')); ap.add_argument('--use-proxy', action='store_true')
    ap.add_argument('--style', action='append'); ap.add_argument('--records', default='art/comfy-records.json')
    ap.add_argument('--workflow-api'); ap.add_argument('--seed', type=int)
    ap.add_argument('--unet', default='qwen_image_edit_2511_bf16.safetensors')
    ap.add_argument('--clip', default='qwen_2.5_vl_7b_fp8_scaled.safetensors'); ap.add_argument('--vae', default='qwen_image_vae.safetensors')
    ap.add_argument('--steps', type=int, default=40); ap.add_argument('--cfg', type=float, default=4.0)
    ap.add_argument('--timeout', type=float, default=1800); ap.add_argument('--poll', type=float, default=2)
    return ap


if __name__ == '__main__':
    arguments = parser().parse_args()
    if arguments.steps < 1 or arguments.timeout <= 0 or arguments.poll <= 0:
        sys.exit('steps, timeout and poll must be positive')
    try: sys.exit(run(arguments))
    except (ValueError, OSError, json.JSONDecodeError) as exc: sys.exit(str(exc))
