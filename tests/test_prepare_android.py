import tempfile
import unittest
from pathlib import Path

from scripts.prepare_android import prepare_manifest, write_icon_resources


class PrepareAndroidTests(unittest.TestCase):
    def test_manifest_adds_permissions_service_and_icons(self):
        with tempfile.TemporaryDirectory() as temp:
            manifest = Path(temp) / "AndroidManifest.xml"
            manifest.write_text('<manifest><application android:label="Focus"><activity /></application></manifest>', encoding="utf-8")
            prepare_manifest(manifest)
            result = manifest.read_text(encoding="utf-8")
            self.assertIn("android.permission.POST_NOTIFICATIONS", result)
            self.assertIn("android.permission.FOREGROUND_SERVICE_SPECIAL_USE", result)
            self.assertIn('android:name=".FocusTimerService"', result)
            self.assertIn('android:icon="@mipmap/ic_launcher"', result)
            self.assertIn('android:roundIcon="@mipmap/ic_launcher_round"', result)

    def test_manifest_update_is_idempotent(self):
        with tempfile.TemporaryDirectory() as temp:
            manifest = Path(temp) / "AndroidManifest.xml"
            manifest.write_text('<manifest><application></application></manifest>', encoding="utf-8")
            prepare_manifest(manifest)
            once = manifest.read_text(encoding="utf-8")
            prepare_manifest(manifest)
            twice = manifest.read_text(encoding="utf-8")
            self.assertEqual(once, twice)
            self.assertEqual(twice.count("POST_NOTIFICATIONS"), 1)
            self.assertEqual(twice.count("FocusTimerService"), 1)

    def test_launcher_resources_are_created(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "res"
            write_icon_resources(root)
            self.assertTrue((root / "drawable/ic_launcher_foreground.xml").is_file())
            self.assertTrue((root / "mipmap-anydpi-v26/ic_launcher.xml").is_file())
            self.assertTrue((root / "mipmap-anydpi-v26/ic_launcher_round.xml").is_file())
            self.assertTrue((root / "values/ic_launcher_background.xml").is_file())


if __name__ == "__main__":
    unittest.main()
