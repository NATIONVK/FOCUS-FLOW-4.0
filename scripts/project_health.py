#!/usr/bin/env python3
"""Generate a lightweight, deterministic Focus Flow project health report."""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

SOURCE_SUFFIXES = {".js", ".mjs", ".cjs", ".css", ".html", ".java", ".py"}
IGNORED_PARTS = {".git", "node_modules", "dist", "build", ".venv", "__pycache__", "android"}
REQUIRED = (
    "src/main.js",
    "src/store.js",
    "src/timer.js",
    "src/analytics.js",
    "native/android/FocusTimerService.java",
    "scripts/prepare_android.py",
)


def source_inventory(root: Path) -> dict:
    totals = Counter()
    files = 0
    for path in root.rglob("*"):
        if not path.is_file() or any(part in IGNORED_PARTS for part in path.parts):
            continue
        if path.suffix.lower() not in SOURCE_SUFFIXES:
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except (UnicodeDecodeError, OSError):
            continue
        totals[path.suffix.lower()] += len(lines)
        files += 1
    return {"files": files, "lines_by_language": dict(sorted(totals.items())),
            "total_lines": sum(totals.values())}


def audit(root: Path) -> dict:
    inventory = source_inventory(root)
    python_lines = inventory["lines_by_language"].get(".py", 0)
    total = inventory["total_lines"]
    checks = {
        relative: (root / relative).is_file()
        for relative in REQUIRED
    }
    return {
        "project": "FOCUS FLOW",
        "source_files": inventory["files"],
        "total_source_lines": total,
        "lines_by_language": inventory["lines_by_language"],
        "python_source_lines": python_lines,
        "python_share_percent": round((python_lines / total * 100), 2) if total else 0,
        "required_files": checks,
        "missing_required_files": [name for name, exists in checks.items() if not exists],
        "status": "healthy" if all(checks.values()) and total else "needs-attention",
    }


def render_markdown(report: dict) -> str:
    rows = "\n".join(
        f"| {language} | {count} |"
        for language, count in report["lines_by_language"].items()
    )
    missing = report["missing_required_files"] or ["None"]
    return (
        "# Focus Flow — Project Health\n\n"
        f"**Status:** {report['status']}  \n"
        f"**Source files:** {report['source_files']}  \n"
        f"**Total source lines:** {report['total_source_lines']}  \n"
        f"**Python share:** {report['python_share_percent']}%\n\n"
        "| Language | Lines |\n|---|---:|\n"
        f"{rows}\n\n"
        "## Required project files\n\n"
        + "\n".join(f"- {'PASS' if exists else 'MISSING'} — {name}"
                     for name, exists in report["required_files"].items())
        + "\n\n## Missing files\n\n"
        + "\n".join(f"- {name}" for name in missing)
        + "\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--output", type=Path, default=Path("reports"))
    args = parser.parse_args()
    report = audit(args.root.resolve())
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "project-health.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    (args.output / "project-health.md").write_text(
        render_markdown(report), encoding="utf-8"
    )
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "healthy" else 1


if __name__ == "__main__":
    raise SystemExit(main())
