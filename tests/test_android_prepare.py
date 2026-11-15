import tempfile
import unittest
from pathlib import Path

from scripts.prepare_android import PERMISSIONS, prepare_manifest, update_android_version, write_icon_resources


class AndroidPrepareTests(unittest.TestCase):
    def test_manifest_permissions_and_timer_service_are_added_idempotently(self):
        with tempfile.TemporaryDirectory() as temp:
            manifest = Path(temp) / "AndroidManifest.xml"
            manifest.write_text('<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application></application></manifest>', encoding="utf-8")
            prepare_manifest(manifest)
            first = manifest.read_text(encoding="utf-8")
            prepare_manifest(manifest)
            second = manifest.read_text(encoding="utf-8")
            self.assertEqual(first, second)
            for permission in PERMISSIONS:
                name = permission.split('android:name="', 1)[1].split('"', 1)[0]
                self.assertEqual(second.count(f'android:name="{name}"'), 1)
            self.assertEqual(second.count('android:name=".FocusTimerService"'), 1)
            self.assertIn('android:foregroundServiceType="specialUse"', second)
            self.assertIn('android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE', second)

    def test_missing_individual_permissions_are_added_even_when_notifications_exist(self):
        with tempfile.TemporaryDirectory() as temp:
            manifest = Path(temp) / "AndroidManifest.xml"
            manifest.write_text('<manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="android.permission.POST_NOTIFICATIONS"/><application></application></manifest>', encoding="utf-8")
            prepare_manifest(manifest)
            content = manifest.read_text(encoding="utf-8")
            self.assertEqual(content.count('android.permission.POST_NOTIFICATIONS'), 1)
            self.assertIn('android.permission.FOREGROUND_SERVICE_SPECIAL_USE', content)


    def test_android_version_tracks_package_version(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            app = root / "app"
            app.mkdir()
            gradle = app / "build.gradle"
            gradle.write_text('defaultConfig {\\n versionCode 1\\n versionName "1.0"\\n}', encoding="utf-8")
            package = root / "package.json"
            package.write_text('{"version":"5.1.0"}', encoding="utf-8")
            update_android_version(app, package)
            content = gradle.read_text(encoding="utf-8")
            self.assertIn("versionCode 50100", content)
            self.assertIn('versionName "5.1.0"', content)

    def test_adaptive_launcher_resources_are_written(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "res"
            write_icon_resources(root)
            self.assertTrue((root / "mipmap-anydpi-v26/ic_launcher.xml").is_file())
            self.assertTrue((root / "mipmap-anydpi-v26/ic_launcher_round.xml").is_file())
            self.assertTrue((root / "drawable/ic_launcher_foreground.xml").is_file())


if __name__ == "__main__":
    unittest.main()
