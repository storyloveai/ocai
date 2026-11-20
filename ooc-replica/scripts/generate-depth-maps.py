#!/usr/bin/env python3
"""Bake white-near, black-far WebP textures from local artwork on the CPU.

The five pilot textures use the official Apache-2.0 Depth Anything V2 Small
model, https://huggingface.co/depth-anything/Depth-Anything-V2-Small-hf
at revision 5426e4f0f36572d16453bbda7a8389317b1bef99. Place config.json,
preprocessor_config.json and model.safetensors from that revision together in
a local directory. The weights have SHA-256
3152477ce0d8d6978d76b995120de97cb5b928701fd0f817769f59e249a16b70.

From ooc-replica, in a Python 3.12 virtual environment::

    pip install torch==2.6.0 transformers==4.51.3 Pillow==13.0.0 numpy==2.3.5
    art=dist/assets/sanguo-art
    python scripts/generate-depth-maps.py --model-dir /path/to/model \
      --output-dir dist/assets/living-manga/depth \
      "$art/scenes/garden.webp" "$art/cg/thunder.webp" \
      "feast=$art/scenes/v2_cao_feast.webp" \
      "$art/scenes/lamp.webp" "$art/scenes/letter.webp"

Supply any episode's new images as paths. For a different output stem use
NAME=PATH. Model loading and image processing use local files only.
"""

import argparse
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory


def parse_input(argument):
    name, separator, filename = argument.partition("=")
    source = Path(filename if separator else argument)
    stem = name if separator else source.stem
    if not source.is_file():
        raise argparse.ArgumentTypeError(f"Artwork does not exist: {source}")
    if not stem or Path(stem).name != stem or stem in (".", ".."):
        raise argparse.ArgumentTypeError(f"Invalid output name: {stem}")
    return stem, source


def infer_depth(image, model, processor):
    import numpy as np
    import torch
    from PIL import Image

    # Preserve the full frame. Use approximately the model's 518-pixel short
    # edge, capping panoramas at 1,512 pixels on the long edge.
    width, height = image.size
    scale = min(518 / min(width, height), 1512 / max(width, height))
    size = {key: max(14, round(axis * scale / 14) * 14)
            for key, axis in (("width", width), ("height", height))}
    inputs = processor(images=image, size=size, keep_aspect_ratio=False,
                       return_tensors="pt")
    with torch.inference_mode():
        prediction = model(**inputs).predicted_depth
        depth = torch.nn.functional.interpolate(
            prediction.unsqueeze(1), size=(height, width), mode="bicubic",
            align_corners=False,
        )[0, 0].numpy()

    # Relative inverse depth already places the nearest objects at the top
    # of the range. Trim isolated numerical extrema before 8-bit quantization.
    if not np.isfinite(depth).all():
        raise ValueError("Model produced non-finite depth values")
    low, high = np.percentile(depth, [0.25, 99.75])
    normalized = np.clip((depth - low) / max(high - low, 1e-6), 0, 1)
    return Image.fromarray(np.rint(normalized * 255).astype(np.uint8))


def encode_webp(depth, byte_limit):
    import numpy as np
    from PIL import Image

    # Depth is data. A lossless RGB WebP keeps neutral channels equal and
    # avoids block ringing across occlusion boundaries. Select the finest
    # grayscale palette in budget. Even 64 levels change depth by at most
    # two steps on the 0–255 scale.
    samples = np.asarray(depth, dtype=np.float32)
    for levels in (256, 240, 224, 192, 160, 128, 112, 96, 80, 64):
        indices = np.rint(samples * ((levels - 1) / 255))
        gray = np.rint(indices * (255 / (levels - 1))).astype(np.uint8)
        buffer = BytesIO()
        Image.fromarray(gray).save(buffer, "WEBP", lossless=True, method=6, quality=100)
        if buffer.tell() <= byte_limit:
            return buffer.getvalue()
    raise ValueError(f"Depth needs more than {byte_limit} bytes; increase --max-bytes")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--model-dir", type=Path, required=True,
                        help="Directory containing the model and processor files")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--max-bytes", type=int, default=45_000,
                        help="Maximum encoded size per texture (default 45000)")
    parser.add_argument("images", nargs="+", type=parse_input, metavar="[NAME=]PATH")
    args = parser.parse_args()
    if args.max_bytes <= 0:
        parser.error("--max-bytes must be positive")
    if len({stem for stem, _ in args.images}) != len(args.images):
        parser.error("Give each input a unique output name")

    sources = {path.resolve() for _, path in args.images}
    jobs = [(source, args.output_dir / f"{stem}_depth.webp")
            for stem, source in args.images]
    if any(target.resolve() in sources for _, target in jobs):
        parser.error("Output paths must differ from input paths")

    import torch
    from PIL import Image, ImageOps
    from transformers import AutoModelForDepthEstimation, DPTImageProcessor

    model_path = args.model_dir.resolve(strict=True)
    model = AutoModelForDepthEstimation.from_pretrained(
        model_path, local_files_only=True, use_safetensors=True,
    ).eval()
    processor = DPTImageProcessor.from_pretrained(model_path, local_files_only=True)
    torch.set_num_threads(4)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=args.output_dir) as staging:
        for source, target in jobs:
            with Image.open(source) as image:
                rgb = ImageOps.exif_transpose(image).convert("RGB")
            encoded = encode_webp(infer_depth(rgb, model, processor), args.max_bytes)
            (Path(staging) / target.name).write_bytes(encoded)
            print(f"{source.name} -> {target.name} ({len(encoded):,} bytes)", flush=True)
        for _, target in jobs:
            (Path(staging) / target.name).replace(target)


if __name__ == "__main__":
    main()
