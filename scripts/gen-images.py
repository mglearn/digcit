#!/usr/bin/env python3
"""gen-images.py — raster brand images for the Digital Citizenship Breakouts.

Draws the navy/gold padlock (matching assets/favicon.svg) directly with PIL,
supersampled for clean edges, and a 1200x630 social/OG card. Outputs to assets/:
  favicon-16.png favicon-32.png favicon-48.png  (PNG favicon fallbacks)
  favicon.ico                                   (multi-size 16/32/48)
  apple-touch-icon.png (180, square)            icon-192.png icon-512.png (PWA)
  og.png (1200x630 social preview)
Run: python3 scripts/gen-images.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), "..")
ASSETS = os.path.join(ROOT, "assets")
NAVY = (10, 46, 99, 255)
NAVY_D = (6, 31, 69, 255)
GOLD = (245, 184, 0, 255)
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def draw_lock(d, s, bg, fg, k, ox=0, oy=0, tile=True, corner=7):
    """Draw the padlock into draw context d. Coordinates in a 32-unit space
    scaled by k, offset by (ox,oy). bg=tile color, fg=padlock color."""
    def X(v):
        return ox + v * k
    if tile:
        d.rounded_rectangle([X(0), X(0), X(32), X(32)], radius=corner * k, fill=bg)
    w = 2.6 * k
    # shackle: top semicircle (center 16,12 r5) + two legs down to the body
    d.arc([X(11), X(7), X(21), X(17)], 180, 360, fill=fg, width=int(round(w)))
    for lx in (11, 21):
        d.rounded_rectangle([X(lx) - w / 2, X(11.7), X(lx) + w / 2, X(16.2)], radius=w / 2, fill=fg)
    # body
    d.rounded_rectangle([X(8.5), X(15), X(23.5), X(26.5)], radius=2.6 * k, fill=fg)
    # keyhole
    d.ellipse([X(16) - 1.9 * k, X(19.6) - 1.9 * k, X(16) + 1.9 * k, X(19.6) + 1.9 * k], fill=bg)
    d.rounded_rectangle([X(15.1), X(19.6), X(16.9), X(23.9)], radius=0.9 * k, fill=bg)


def icon(size, tile=True, corner=7, bg=NAVY, fg=GOLD):
    ss = max(1, min(8, 1024 // size))
    big = size * ss
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw_lock(ImageDraw.Draw(img), 32, bg, fg, big / 32.0, tile=tile, corner=corner)
    return img.resize((size, size), Image.LANCZOS)


def fit_font(path, text, max_w, start):
    """Largest font size <= start whose text width fits max_w."""
    for pt in range(start, 8, -2):
        f = ImageFont.truetype(path, pt)
        if f.getbbox(text)[2] <= max_w:
            return f
    return ImageFont.truetype(path, 10)


def make_og():
    W, H, S = 1200, 630, 2
    img = Image.new("RGBA", (W * S, H * S), NAVY)
    d = ImageDraw.Draw(img)
    # subtle gold glow top-right + navy vignette bottom-left
    glow = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W * S * 0.55, -H * S * 0.5, W * S * 1.4, H * S * 0.7], fill=(245, 184, 0, 26))
    gd.ellipse([-W * S * 0.3, H * S * 0.5, W * S * 0.5, H * S * 1.5], fill=(6, 31, 69, 120))
    img.alpha_composite(glow)
    d = ImageDraw.Draw(img)
    # left icon tile (navy, gold lock) with a thin gold ring
    tile = 300 * S
    tx, ty = 96 * S, 165 * S
    d.rounded_rectangle([tx - 3 * S, ty - 3 * S, tx + tile + 3 * S, ty + tile + 3 * S], radius=70 * S, outline=GOLD, width=3 * S)
    lock = icon(tile, tile=True, corner=66)
    img.alpha_composite(lock, (tx, ty))
    # text block — auto-fit every line to the available width so nothing clips
    x = 452 * S
    maxw = (W - 452 - 48) * S
    sub_txt = "Critical Thinking Online Breakouts"
    meta_txt = "Grades 3–8  ·  TEKS-aligned  ·  7 languages"
    f_title = fit_font(FONT_BOLD, "Digital Citizenship", maxw, 88 * S)
    th = f_title.getbbox("Digital Citizenship")[3]
    y = 150 * S
    d.text((x, y), "Digital Citizenship", font=f_title, fill=(255, 255, 255, 255))
    y += int(th * 1.16)
    d.text((x, y), "Breakouts", font=f_title, fill=GOLD)
    y += int(th * 1.5)
    f_sub = fit_font(FONT_REG, sub_txt, maxw, 40 * S)
    d.text((x, y), sub_txt, font=f_sub, fill=(176, 198, 235, 255))
    y += int(f_sub.getbbox(sub_txt)[3] * 1.6)
    f_meta = fit_font(FONT_BOLD, meta_txt, maxw, 33 * S)
    d.text((x, y), meta_txt, font=f_meta, fill=GOLD)
    # bottom accent bar
    d.rectangle([0, (H - 12) * S, W * S, H * S], fill=GOLD)
    return img.resize((W, H), Image.LANCZOS).convert("RGB")


def main():
    outputs = []
    for sz in (16, 32, 48):
        p = os.path.join(ASSETS, f"favicon-{sz}.png")
        icon(sz).save(p)
        outputs.append(p)
    # multi-size ico
    ico = os.path.join(ASSETS, "favicon.ico")
    icon(48).save(ico, sizes=[(16, 16), (32, 32), (48, 48)])
    outputs.append(ico)
    # apple touch: full-bleed square navy (iOS rounds it), no transparency
    at = icon(180, tile=True, corner=0).convert("RGB")
    p = os.path.join(ASSETS, "apple-touch-icon.png")
    at.save(p)
    outputs.append(p)
    for sz in (192, 512):
        p = os.path.join(ASSETS, f"icon-{sz}.png")
        icon(sz).save(p)
        outputs.append(p)
    og = os.path.join(ASSETS, "og.png")
    make_og().save(og)
    outputs.append(og)
    for p in outputs:
        print("wrote", os.path.relpath(p, ROOT))


if __name__ == "__main__":
    main()
