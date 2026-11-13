#!/usr/bin/env python3
"""Create release metadata, concise notes, and optional APK size diagnostics."""
from __future__ import annotations

import argparse
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def git_value(root: Path, *args: str, fallback: str = "unknown") -> str:
    try:
        result = subprocess.run(
            ["git", *args], cwd=root, check=True, capture_output=True, text=True
        )
        return result.stdout.strip() or fallback
    except (OSError, subprocess.CalledProcessError):
        return fallback


def recent_commits(root: Path, limit: int = 12) -> list[str]:
    try:
        result = subprocess.run(
            ["git", "log", f"-{limit}", "--pretty=format:%s"],
            cwd=root, check=True, capture_output=True, text=True
        )
        return [line.strip() for line in result.stdout.splitlines() if line.strip()]
    except (OSError, subprocess.CalledProcessError):
        return []


def build_release_report(root: Path, apk: Path | None = None) -> dict:
    package = json.loads((root / "package.json").read_text(encoding="utf-8"))
    apk_info = None
    if apk is not None and apk.is_file():
        size = apk.stat().st_size
        apk_info = {
            "file": apk.name,
            "size_bytes": size,
            "size_mb": round(size / (1024 * 1024), 2),
        }
    return {
        "name": package.get("name", "focus-flow"),
        "version": package.get("version", "0.0.0"),
        "commit": os.environ.get("GITHUB_SHA") or git_value(root, "rev-parse", "HEAD"),
        "branch": os.environ.get("GITHUB_REF_NAME") or git_value(root, "branch", "--show-current"),
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "apk": apk_info,
        "recent_changes": recent_commits(root),
    }


def render_notes(report: dict) -> str:
    changes = report["recent_changes"] or ["No commit messages available."]
    apk = report["apk"]
    apk_line = (
        f"**APK size:** {apk['size_mb']} MB ({apk['size_bytes']:,} bytes)"
        if apk else "**APK size:** Not supplied"
    )
    return (
        f"# {report['name']} v{report['version']}\n\n"
        f"**Commit:** `{report['commit'][:12]}`  \n"
        f"**Branch:** {report['branch']}  \n"
        f"{apk_line}\n\n"
        "## Recent changes\n\n"
        + "\n".join(f"- {item}" for item in changes)
        + "\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--apk", type=Path)
    parser.add_argument("--output", type=Path, default=Path("release-report"))
    args = parser.parse_args()
    root = args.root.resolve()
    apk = args.apk.resolve() if args.apk else None
    report = build_release_report(root, apk)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "release-metadata.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    (args.output / "release-notes.md").write_text(
        render_notes(report), encoding="utf-8"
    )
    print(render_notes(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
