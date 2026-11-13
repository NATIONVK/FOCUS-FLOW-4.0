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
  <path android:fillColor="#050713" android:pathData="M0,0h108v108h-108z"/>
  <path android:strokeColor="#d946ef" android:strokeWidth="2.5" android:fillColor="#11102b" android:pathData="M54,8a46,46 0,1 0,0.1 0z"/>
  <path android:strokeColor="#22d3ee" android:strokeWidth="2" android:fillColor="#00000000" android:pathData="M54,13a41,41 0,1 0,0.1 0z"/>
  <path android:strokeColor="#8b5cf6" android:strokeWidth="5" android:fillColor="#00000000" android:pathData="M14,52c7,-19 22,-29 40,-29s33,10 40,29"/>
  <path android:strokeColor="#c4b5fd" android:strokeWidth="2" android:fillColor="#00000000" android:pathData="M22,54c9,-12 20,-18 32,-18s23,6 32,18"/>
  <path android:fillColor="#02030a" android:pathData="M39,48a15,15 0,1 0,30 0a15,15 0,1 0,-30 0"/>
  <path android:strokeColor="#ffffff" android:strokeWidth="3.5" android:strokeLineCap="round" android:pathData="M54,48L54,29 M54,48L68,39"/>
  <path android:fillColor="#d946ef" android:pathData="M58,48a4,4 0,1 1,-8 0a4,4 0,1 1,8 0"/>
  <path android:fillColor="#eef4ff" android:pathData="M22,72q16,-12 32,0q16,-12 32,0v17q-16,-10 -32,0q-16,-10 -32,0z"/>
  <path android:strokeColor="#9aaeff" android:strokeWidth="2" android:pathData="M54,72v17 M28,78q12,-6 22,0 M58,78q10,-6 22,0"/>
  <path android:fillColor="#38f59a" android:pathData="M72,20l17,-9l-4,10l9,-1l-18,13l4,-10z"/>
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
