#!/usr/bin/env python3
"""Package only reviewed pilot inputs; never sweep a directory for credentials."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent
files = ['README.md', 'run.py', 'cases.json', 'check_runner.py', 'cloud-attempt.json', 'baseline/gu-chengye.png', 'baseline/song-zhixia.png']
out = root.parent / 'klein-pilot.zip'
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / name, 'storydate-klein-pilot/' + name)
print(out)
