import tempfile
import unittest
from pathlib import Path

from scripts.project_health import audit, render_markdown, source_inventory


class ProjectHealthTests(unittest.TestCase):
    def test_inventory_counts_source_lines_and_ignores_generated_folders(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "src").mkdir()
            (root / "src/app.js").write_text("one\ntwo\n", encoding="utf-8")
            (root / "src/tool.py").write_text("print('ok')\n", encoding="utf-8")
            (root / "node_modules").mkdir()
            (root / "node_modules/ignored.js").write_text("ignore\n", encoding="utf-8")
            result = source_inventory(root)
            self.assertEqual(result["files"], 2)
            self.assertEqual(result["total_lines"], 3)
            self.assertEqual(result["lines_by_language"][".py"], 1)

    def test_audit_reports_python_share_and_missing_files(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for relative in ("src/main.js", "src/store.js", "src/timer.js",
                            "src/analytics.js", "native/android/FocusTimerService.java",
                            "scripts/prepare_android.py"):
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("line\n", encoding="utf-8")
            report = audit(root)
            self.assertEqual(report["python_share_percent"], 20.0)
            self.assertEqual(report["status"], "healthy")
            self.assertEqual(report["missing_required_files"], [])
            self.assertIn("Python share", render_markdown(report))

    def test_audit_flags_missing_critical_file(self):
        with tempfile.TemporaryDirectory() as temp:
            report = audit(Path(temp))
            self.assertEqual(report["status"], "needs-attention")
            self.assertIn("src/main.js", report["missing_required_files"])


if __name__ == "__main__":
    unittest.main()
