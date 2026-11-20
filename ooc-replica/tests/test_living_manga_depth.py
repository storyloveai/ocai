"""Verify shipped pilot textures with Pillow. No model weights are required."""

from pathlib import Path
import unittest

from PIL import Image, ImageChops


ASSETS = Path(__file__).resolve().parents[1] / "dist" / "assets"
# Sample painted objects in order from nearest to farthest.
SCENES = {
    "garden": ("scenes/garden", [(0.59, 0.70), (0.31, 0.18)]),  # robe, skyline
    "thunder": ("cg/thunder", [(0.30, 0.57), (0.74, 0.30), (0.50, 0.16)]),  # Liu, Cao, sky
    "feast": ("scenes/v2_cao_feast", [(0.42, 0.65), (0.65, 0.23)]),  # guest, host
    "lamp": ("scenes/lamp", [(0.19, 0.50), (0.38, 0.30), (0.90, 0.21)]),  # screen, reader, courtyard
    "letter": ("scenes/letter", [(0.72, 0.57), (0.26, 0.75), (0.84, 0.40)]),  # candle, hand, lake
}


class PilotDepthTest(unittest.TestCase):
    def test_registered_grayscale_maps_and_depth_order(self):
        for scene, (source, points) in SCENES.items():
            with self.subTest(scene=scene):
                path = ASSETS / "living-manga" / "depth" / f"{scene}_depth.webp"
                self.assertTrue(20_000 <= path.stat().st_size <= 45_000)
                with Image.open(ASSETS / "sanguo-art" / f"{source}.webp") as art:
                    artwork_size = art.size
                with Image.open(path) as depth:
                    self.assertEqual(depth.format, "WEBP")
                    self.assertEqual(depth.size, artwork_size)
                    red, green, blue = depth.convert("RGB").split()
                for band in (green, blue):
                    self.assertIsNone(ImageChops.difference(red, band).getbbox())
                self.assertGreaterEqual(len(red.getcolors()), 64)
                samples = [red.getpixel((int(x * red.width), int(y * red.height)))
                           for x, y in points]
                for nearer, farther in zip(samples, samples[1:]):
                    self.assertGreater(nearer - farther, 20)


if __name__ == "__main__":
    unittest.main()
