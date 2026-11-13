import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.release_manager import build_release_report, render_notes


class ReleaseManagerTests(unittest.TestCase):
    def test_report_reads_version_and_apk_size(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "package.json").write_text(
                json.dumps({"name": "focus-flow", "version": "5.0.0"}),
                encoding="utf-8",
            )
            apk = root / "app-debug.apk"
            apk.write_bytes(b"x" * 2048)
            with patch("scripts.release_manager.recent_commits", return_value=["feat: timer polish"]):
                report = build_release_report(root, apk)
            self.assertEqual(report["version"], "5.0.0")
            self.assertEqual(report["apk"]["size_bytes"], 2048)
            self.assertEqual(report["recent_changes"], ["feat: timer polish"])

    def test_report_handles_missing_apk(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "package.json").write_text('{"version":"1.2.3"}', encoding="utf-8")
            report = build_release_report(root, root / "missing.apk")
            self.assertIsNone(report["apk"])
            self.assertIn("Not supplied", render_notes(report))


if __name__ == "__main__":
    unittest.main()
