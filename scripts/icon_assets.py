"""Generate one consistent Black Hole identity for web, PWA and Android."""
from __future__ import annotations
from pathlib import Path

def _foreground(size: int = 512):
    try:
        from PIL import Image, ImageDraw, ImageFilter
    except ImportError as exc:
        raise RuntimeError("Pillow is required to generate Focus Flow launcher icons") from exc
    s = lambda v: int(round(v * size / 512))
    w = lambda v: max(1, s(v))
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ring = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(ring)
    d.ellipse((s(34),s(184),s(478),s(328)),outline=(80,225,255,190),width=w(15))
    d.ellipse((s(46),s(192),s(466),s(320)),outline=(124,92,255,235),width=w(9))
    d.arc((s(38),s(180),s(474),s(330)),188,350,fill=(255,83,215,255),width=w(12))
    d.arc((s(38),s(180),s(474),s(330)),8,170,fill=(74,228,255,255),width=w(10))
    ring = ring.rotate(-17, resample=Image.Resampling.BICUBIC)
    layer.alpha_composite(ring.filter(ImageFilter.GaussianBlur(max(1, s(18)))))
    layer.alpha_composite(ring)
    d = ImageDraw.Draw(layer)
    d.ellipse((s(151),s(151),s(361),s(361)),fill=(7,8,20,255),outline=(190,158,255,245),width=w(7))
    d.ellipse((s(165),s(165),s(347),s(347)),fill=(1,2,9,255),outline=(87,218,255,145),width=w(3))
    d.ellipse((s(190),s(190),s(322),s(322)),fill=(0,0,0,255))
    d.ellipse((s(151),s(151),s(361),s(361)),outline=(241,204,255,185),width=w(2))
    for x,y,r,c in [(392,151,8,(255,105,220,255)),(118,340,5,(73,225,255,255)),(416,337,4,(174,151,255,255)),(92,126,3,(210,230,255,220)),(430,103,3,(210,230,255,220))]:
        d.ellipse((s(x-r),s(y-r),s(x+r),s(y+r)),fill=c)
    return layer

def _square_icon(size: int):
    from PIL import Image, ImageDraw, ImageFilter
    fg = _foreground(size)
    bg = Image.new("RGBA",(size,size),(7,10,24,255))
    halo = Image.new("RGBA",(size,size),(0,0,0,0))
    hd = ImageDraw.Draw(halo)
    pad = int(size*.12)
    hd.ellipse((pad,pad,size-pad,size-pad),fill=(69,45,140,70))
    bg.alpha_composite(halo.filter(ImageFilter.GaussianBlur(max(1,size//12))))
    bg.alpha_composite(fg)
    return bg.convert("RGB")

def write_web_icon_resources(public_dir: Path) -> None:
    from PIL import Image
    public_dir.mkdir(parents=True,exist_ok=True)
    base = _square_icon(512)
    for name,size in (("icon-192.png",192),("icon-512.png",512),("apple-touch-icon.png",180),("favicon-32.png",32)):
        base.resize((size,size),Image.Resampling.LANCZOS).save(public_dir/name,format="PNG",optimize=True)

def write_android_icon_resources(res_dir: Path) -> None:
    from PIL import Image
    adaptive=res_dir/"mipmap-anydpi-v26"; values=res_dir/"values"; foreground=res_dir/"drawable-nodpi"; drawable=res_dir/"drawable"
    for folder in (adaptive,values,foreground,drawable): folder.mkdir(parents=True,exist_ok=True)
    _foreground(512).save(foreground/"ic_launcher_foreground.png",format="PNG",optimize=True)
    xml='''<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
'''
    for name in ("ic_launcher.xml","ic_launcher_round.xml"):
        (adaptive/name).write_text(xml,encoding="utf-8")
    (drawable/"ic_stat_focus_flow.xml").write_text('''<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">\n    <path android:fillColor="#00000000" android:strokeColor="#FFFFFFFF" android:strokeWidth="1.8" android:pathData="M2,12a10,4 0,1 0,20 0a10,4 0,1 0,-20 0"/>\n    <path android:fillColor="#00000000" android:strokeColor="#FFFFFFFF" android:strokeWidth="1.8" android:pathData="M7,12a5,5 0,1 0,10 0a5,5 0,1 0,-10 0"/>\n    <path android:fillColor="#FFFFFFFF" android:pathData="M17,5l4,-2l-1,3l2,0l-4,3l1,-3z"/>\n</vector>\n''',encoding="utf-8")\n    (values/"ic_launcher_background.xml").write_text('<resources><color name="ic_launcher_background">#070A18</color></resources>\n',encoding="utf-8")
    for density,size in (("mdpi",48),("hdpi",72),("xhdpi",96),("xxhdpi",144),("xxxhdpi",192)):
        folder=res_dir/f"mipmap-{density}";folder.mkdir(parents=True,exist_ok=True)
        icon=_square_icon(size)
        icon.save(folder/"ic_launcher.png",format="PNG",optimize=True)
        icon.save(folder/"ic_launcher_round.png",format="PNG",optimize=True)
