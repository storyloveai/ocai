#!/usr/bin/env python3
"""Package a built upstream WebGAL engine with the exported Xichuan spike."""
import argparse
import hashlib
import json
import pathlib
import shutil
import subprocess

HERE = pathlib.Path(__file__).resolve().parents[1]
REPO = HERE.parents[1]
ENGINE_COMMIT = '15173bc21339a65da34b78463fca8a304e4d503a'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--engine-root', type=pathlib.Path, required=True)
    parser.add_argument('--source-root', type=pathlib.Path, default=HERE)
    args = parser.parse_args()
    engine = args.engine_root.resolve()
    source = args.source_root.resolve()
    commit = subprocess.check_output(['git', '-C', str(engine), 'rev-parse', 'HEAD'], text=True).strip()
    if commit != ENGINE_COMMIT:
        parser.error(f'Expected WebGAL {ENGINE_COMMIT}, got {commit}')
    built = engine / 'packages/webgal/dist'
    if not (built / 'index.html').is_file():
        parser.error('Build WebGAL first: yarn install --frozen-lockfile && yarn parser:build && yarn webgal:build')
    game = HERE / 'webgal/game'
    subprocess.run(['python3', str(HERE / 'tools/webgal_export.py'), '--source-root', str(source), '--out', str(game)], check=True)
    dest = REPO / 'ooc-replica/dist/assets/xichuan-webgal'
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(built, dest)
    shutil.rmtree(dest / 'game')
    shutil.copytree(game, dest / 'game')
    # The engine loads these theme files at startup. Keep its default UI, not its demo story.
    shutil.copytree(built / 'game/template', dest / 'game/template', dirs_exist_ok=True)
    shutil.copy(built / 'game/userStyleSheet.css', dest / 'game/userStyleSheet.css')
    (dest / 'game/animation/animationTable.json').write_text('[]\n')
    shutil.copy(engine / 'LICENSE', dest / 'LICENSE-WebGAL.txt')
    manifest_path = dest / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    manifest.update(name='汐川的第七个春天 · WebGAL 小样', short_name='汐川小样', description='汐川序章与第一章 · WebGAL 引擎对比')
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    source_commit = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    provenance = {
        'engine': {'repository': 'https://github.com/OpenWebGAL/WebGAL', 'commit': commit, 'version': '4.6.6', 'license': 'MPL-2.0', 'sourceChanged': False},
        'input': {'repository': 'https://github.com/storyloveai/ocai', 'commit': source_commit, 'campaignSha256': hashlib.sha256((source / 'content/campaign.json').read_bytes()).hexdigest(), 'chapters': ['p', 'c1']},
    }
    (dest / 'SOURCE.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
    (dest / 'NOTICE.txt').write_text(
        'WebGAL 4.6.6 — OpenWebGAL contributors — MPL-2.0 (LICENSE-WebGAL.txt).\n'
        f'Unmodified engine source: https://github.com/OpenWebGAL/WebGAL/tree/{commit}\n'
        'Engine includes its upstream UI, fonts and dependencies. Their notices remain in the compiled distribution.\n'
        'The Xichuan story and art are separate StoryDate game content; the engine license does not grant rights to them.\n'
        'Build provenance: SOURCE.json. This spike does not include the optional Live2D SDK.\n')
    print(f'Packaged {sum(p.stat().st_size for p in dest.rglob("*") if p.is_file()) / 1024**2:.1f} MiB -> {dest}')


if __name__ == '__main__':
    main()
