#!/usr/bin/env python3
"""Prepare Capacitor's generated Android project for Focus Flow.

Build-time tooling only; the installed app remains lightweight JS/CSS with its
existing Java bridge. Safe to run repeatedly in CI.
"""
from __future__ import annotations

import argparse
import json
import re

try:
    from .icon_assets import write_android_icon_resources
except ImportError:
    from icon_assets import write_android_icon_resources
from pathlib import Path

PERMISSIONS = (
    '    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
    '    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
    '    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />',
    '    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
    '    <uses-permission android:name="android.permission.READ_MEDIA_VISUAL_USER_SELECTED" />',
    '    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
)
SERVICE = '''        <service android:name=".FocusTimerService" android:exported="false" android:foregroundServiceType="specialUse">
            <property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" android:value="Ongoing study focus timer with persistent notification" />
        </service>'''

def prepare_manifest(path: Path) -> None:
    source = path.read_text(encoding="utf-8")
    if "<application" not in source or "</application>" not in source:
        raise ValueError(f"Android application element not found in {path}")
    for permission in PERMISSIONS:
        match = re.search(r'android:name="([^"]+)"', permission)
        if match and f'android:name="{match.group(1)}"' not in source:
            source = source.replace("<application", permission + "\n    <application", 1)
    if "FocusTimerService" not in source:
        source = source.replace("</application>", SERVICE + "\n    </application>", 1)
    source = re.sub(r'\s+android:(?:roundIcon|icon)="[^"]*"', "", source)
    source = source.replace(
        "<application",
        '<application android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round"',
        1,
    )
    path.write_text(source, encoding="utf-8")



def update_android_version(app_dir: Path, package_file: Path) -> None:
    package = json.loads(package_file.read_text(encoding="utf-8"))
    version = str(package.get("version", ""))
    match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)", version)
    if not match:
        raise ValueError(f"Unsupported app version: {version!r}")
    major, minor, patch = map(int, match.groups())
    version_code = major * 10000 + minor * 100 + patch
    gradle = app_dir / "build.gradle"
    if not gradle.is_file():
        raise FileNotFoundError(f"Android app Gradle file not found: {gradle}")
    source = gradle.read_text(encoding="utf-8")
    source, code_count = re.subn(r"(?m)^(\s*versionCode\s+)\d+", rf"\g<1>{version_code}", source, count=1)
    source, name_count = re.subn(r'''(?m)^(\s*versionName\s+)["'][^"']+["']''', lambda m: m.group(1) + f'"{version}"', source, count=1)
    if code_count != 1 or name_count != 1:
        raise ValueError("Could not safely update Android versionCode/versionName in build.gradle")
    gradle.write_text(source, encoding="utf-8")


def write_icon_resources(res_dir: Path) -> None:
    """Write Black Hole adaptive icons and legacy density fallbacks."""
    write_android_icon_resources(res_dir)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, help="Generated AndroidManifest.xml")
    parser.add_argument("res_dir", type=Path, help="Generated app/src/main/res directory")
    args = parser.parse_args()
    prepare_manifest(args.manifest)
    write_icon_resources(args.res_dir)
    update_android_version(args.manifest.parent.parent.parent, Path(__file__).resolve().parents[1] / "package.json")
    print("Android manifest, timer service, permissions and launcher icons prepared.")


if __name__ == "__main__":
    main()
