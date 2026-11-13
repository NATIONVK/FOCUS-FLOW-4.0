#!/usr/bin/env python3
"""Prepare Capacitor's generated Android project for Focus Flow.

Build-time tooling only; the installed app remains lightweight JS/CSS with its
existing Java bridge. Safe to run repeatedly in CI.
"""
from __future__ import annotations

import argparse
import re
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
FOREGROUND_ICON = '''<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
  <path android:fillColor="#080b14" android:pathData="M0,0h108v108h-108z"/>
  <path android:strokeColor="#8b5cf6" android:strokeWidth="3" android:fillColor="#10132b" android:pathData="M54,12a34,34 0,1 0,0.1 0z"/>
  <path android:strokeColor="#22d3ee" android:strokeWidth="2" android:fillColor="#00000000" android:pathData="M54,16a30,30 0,1 0,0.1 0z"/>
  <path android:strokeColor="#ffffff" android:strokeWidth="4" android:strokeLineCap="round" android:pathData="M54,54L54,31 M54,54L70,42"/>
  <path android:fillColor="#d946ef" android:pathData="M58,54a4,4 0,1 1,-8 0a4,4 0,1 1,8 0"/>
  <path android:fillColor="#eef4ff" android:pathData="M23,78q15,-12 31,0q16,-12 31,0v13q-15,-10 -31,0q-16,-10 -31,0z"/>
  <path android:fillColor="#38f59a" android:pathData="M73,26l15,-8l-3,8l7,-1l-15,10l3,-8z"/>
</vector>
'''
ADAPTIVE_ICON = '''<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
'''


def prepare_manifest(path: Path) -> None:
    source = path.read_text(encoding="utf-8")
    if "<application" not in source or "</application>" not in source:
        raise ValueError(f"Android application element not found in {path}")
    if "android.permission.POST_NOTIFICATIONS" not in source:
        source = source.replace("<application", "\n".join(PERMISSIONS) + "\n    <application", 1)
    if "FocusTimerService" not in source:
        source = source.replace("</application>", SERVICE + "\n    </application>", 1)
    source = re.sub(r'\s+android:(?:roundIcon|icon)="[^"]*"', "", source)
    source = source.replace(
        "<application",
        '<application android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round"',
        1,
    )
    path.write_text(source, encoding="utf-8")


def write_icon_resources(res_dir: Path) -> None:
    adaptive_dir = res_dir / "mipmap-anydpi-v26"
    drawable_dir = res_dir / "drawable"
    values_dir = res_dir / "values"
    for directory in (adaptive_dir, drawable_dir, values_dir):
        directory.mkdir(parents=True, exist_ok=True)
    (drawable_dir / "ic_launcher_foreground.xml").write_text(FOREGROUND_ICON, encoding="utf-8")
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        (adaptive_dir / name).write_text(ADAPTIVE_ICON, encoding="utf-8")
    (values_dir / "ic_launcher_background.xml").write_text(
        '<resources><color name="ic_launcher_background">#080b14</color></resources>\n',
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, help="Generated AndroidManifest.xml")
    parser.add_argument("res_dir", type=Path, help="Generated app/src/main/res directory")
    args = parser.parse_args()
    prepare_manifest(args.manifest)
    write_icon_resources(args.res_dir)
    print("Android manifest, timer service, permissions and launcher icons prepared.")


if __name__ == "__main__":
    main()
