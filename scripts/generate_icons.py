#!/usr/bin/env python3
from pathlib import Path
from icon_assets import write_web_icon_resources
write_web_icon_resources(Path(__file__).resolve().parents[1] / "public")
print("Generated Focus Flow Black Hole web/PWA icons.")
