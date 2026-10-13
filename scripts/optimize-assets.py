"""Optional asset maintenance: python -m pip install Pillow; python scripts/optimize-assets.py.
Original character art stays outside the deployment directory. Generated WebP is committed.
"""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1]
for source in (root / 'assets/source').glob('*.png'):
    with Image.open(source) as image:
        image.thumbnail((768, 1152), Image.Resampling.LANCZOS)
        image.convert('RGB').save(root / 'dist/assets' / (source.stem + '.webp'), 'WEBP', quality=82, method=6)
