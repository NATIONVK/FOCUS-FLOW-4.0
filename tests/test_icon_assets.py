import tempfile
import unittest
from pathlib import Path

from PIL import Image

from scripts.icon_assets import write_web_icon_resources


class WebIconAssetTests(unittest.TestCase):
    def test_pwa_and_touch_icons_are_generated_at_declared_sizes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            write_web_icon_resources(root)
            for name, size in (
                ("icon-192.png", 192),
                ("icon-512.png", 512),
                ("apple-touch-icon.png", 180),
                ("favicon-32.png", 32),
            ):
                path = root / name
                self.assertTrue(path.is_file(), name)
                with Image.open(path) as image:
                    self.assertEqual(image.size, (size, size))
                    self.assertEqual(image.mode, "RGB")


if __name__ == "__main__":
    unittest.main()
