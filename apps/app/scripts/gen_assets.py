"""
Generate all native app icons and splash screens for iOS and Android
from the PWA logo (public/logo-512.png).

Run from apps/app/:
  python3 scripts/gen_assets.py
"""
from PIL import Image, ImageDraw
import os, shutil

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_SRC = os.path.join(BASE, "public", "logo-512.png")
IOS_ICON_DIR = os.path.join(BASE, "ios/App/App/Assets.xcassets/AppIcon.appiconset")
IOS_SPLASH_DIR = os.path.join(BASE, "ios/App/App/Assets.xcassets/Splash.imageset")
ANDROID_RES = os.path.join(BASE, "android/app/src/main/res")

BRAND_COLOR = (6, 74, 152)  # #064a98 — matches SplashScreen.backgroundColor

# ── iOS App Icon ──────────────────────────────────────────────────────────────
# iOS 17+ only needs one universal 1024×1024 icon (no alpha channel)
def gen_ios_icon():
    logo = Image.open(LOGO_SRC).convert("RGBA")

    # Create a white background (iOS rejects icons with alpha)
    bg = Image.new("RGB", (1024, 1024), (255, 255, 255))
    logo_resized = logo.resize((1024, 1024), Image.LANCZOS)

    # Paste with alpha mask
    bg.paste(logo_resized, (0, 0), logo_resized.split()[3])
    out = os.path.join(IOS_ICON_DIR, "AppIcon-512@2x.png")
    bg.save(out, "PNG")
    print(f"  iOS icon → {out}")

# ── iOS Splash Screens ────────────────────────────────────────────────────────
# Capacitor SplashScreen plugin uses Splash.imageset with a single 2732×2732
def gen_ios_splash():
    logo = Image.open(LOGO_SRC).convert("RGBA")

    sizes = [
        ("splash-2732x2732.png",   2732, 2732),
        ("splash-2732x2732-1.png", 2732, 2732),
        ("splash-2732x2732-2.png", 2732, 2732),
    ]
    for fname, w, h in sizes:
        img = Image.new("RGBA", (w, h), (*BRAND_COLOR, 255))
        logo_size = int(min(w, h) * 0.35)  # logo takes up 35% of shortest side
        logo_resized = logo.resize((logo_size, logo_size), Image.LANCZOS)
        x = (w - logo_size) // 2
        y = (h - logo_size) // 2
        img.paste(logo_resized, (x, y), logo_resized.split()[3])
        out = os.path.join(IOS_SPLASH_DIR, fname)
        img.save(out, "PNG")
        print(f"  iOS splash → {out}")

# ── Android Launcher Icons ────────────────────────────────────────────────────
ANDROID_ICON_SIZES = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}
ANDROID_FG_SIZES = {
    "mipmap-mdpi":    108,
    "mipmap-hdpi":    162,
    "mipmap-xhdpi":   216,
    "mipmap-xxhdpi":  324,
    "mipmap-xxxhdpi": 432,
}

def gen_android_icons():
    logo = Image.open(LOGO_SRC).convert("RGBA")

    for folder, size in ANDROID_ICON_SIZES.items():
        # ic_launcher — white bg, logo fills ~80% padded
        bg = Image.new("RGBA", (size, size), (255, 255, 255, 255))
        pad = int(size * 0.1)
        inner = size - pad * 2
        logo_r = logo.resize((inner, inner), Image.LANCZOS)
        bg.paste(logo_r, (pad, pad), logo_r.split()[3])
        bg.save(os.path.join(ANDROID_RES, folder, "ic_launcher.png"))

        # ic_launcher_round — same but circle clipped
        round_bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        mask = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)
        white_circle = Image.new("RGBA", (size, size), (255, 255, 255, 255))
        white_circle.putalpha(mask)
        round_bg.paste(white_circle, (0, 0), white_circle.split()[3])
        round_bg.paste(logo_r, (pad, pad), logo_r.split()[3])
        round_bg.save(os.path.join(ANDROID_RES, folder, "ic_launcher_round.png"))

        print(f"  Android icon {size}px → {folder}/")

    for folder, size in ANDROID_FG_SIZES.items():
        # ic_launcher_foreground — transparent bg for adaptive icon
        fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        pad = int(size * 0.15)
        inner = size - pad * 2
        logo_r = logo.resize((inner, inner), Image.LANCZOS)
        fg.paste(logo_r, (pad, pad), logo_r.split()[3])
        fg.save(os.path.join(ANDROID_RES, folder, "ic_launcher_foreground.png"))

# ── Android Splash Screens ────────────────────────────────────────────────────
ANDROID_SPLASH_PORTRAIT = {
    "drawable-port-hdpi":    (480, 800),
    "drawable-port-mdpi":    (320, 480),
    "drawable-port-xhdpi":   (720, 1280),
    "drawable-port-xxhdpi":  (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
}
ANDROID_SPLASH_LANDSCAPE = {
    "drawable-land-hdpi":    (800, 480),
    "drawable-land-mdpi":    (480, 320),
    "drawable-land-xhdpi":   (1280, 720),
    "drawable-land-xxhdpi":  (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
}

def gen_android_splashes():
    logo = Image.open(LOGO_SRC).convert("RGBA")

    all_sizes = {**ANDROID_SPLASH_PORTRAIT, **ANDROID_SPLASH_LANDSCAPE}
    for folder, (w, h) in all_sizes.items():
        img = Image.new("RGBA", (w, h), (*BRAND_COLOR, 255))
        logo_size = int(min(w, h) * 0.4)
        logo_r = logo.resize((logo_size, logo_size), Image.LANCZOS)
        x = (w - logo_size) // 2
        y = (h - logo_size) // 2
        img.paste(logo_r, (x, y), logo_r.split()[3])
        out = os.path.join(ANDROID_RES, folder, "splash.png")
        img.convert("RGB").save(out, "PNG")
        print(f"  Android splash {w}×{h} → {folder}/")

if __name__ == "__main__":
    print("Generating iOS icons...")
    gen_ios_icon()
    print("Generating iOS splash screens...")
    gen_ios_splash()
    print("Generating Android launcher icons...")
    gen_android_icons()
    print("Generating Android splash screens...")
    gen_android_splashes()
    print("\nDone! Rebuild in Xcode and Android Studio.")
