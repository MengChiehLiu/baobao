"""Draw the home-screen icons (a smiling char siu bun) with Pillow.

Writes public/icons/icon-192.png and public/icons/icon-512.png.
Colours come from the game's 12-colour palette.
"""

import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "icons")

CREAM = (255, 246, 229)
DOUGH = (247, 231, 206)
CARAMEL = (217, 160, 102)
SAKURA = (246, 184, 200)
BLUSH = (244, 154, 168)
OUTLINE = (107, 74, 58)


def draw(size):
    s = size * 4  # draw large, then downscale for smooth edges
    u = s / 100.0
    img = Image.new("RGB", (s, s), SAKURA)
    d = ImageDraw.Draw(img)

    def ell(cx, cy, w, h, fill=None, outline=None, width=0):
        box = [(cx - w / 2) * u, (cy - h / 2) * u, (cx + w / 2) * u, (cy + h / 2) * u]
        d.ellipse(box, fill=fill, outline=outline, width=int(width * u))

    # background circle so the maskable safe zone stays cute
    ell(50, 50, 92, 92, fill=CREAM)
    ell(50, 80, 60, 10, fill=(232, 205, 168))
    # body
    ell(50, 58, 72, 58, fill=DOUGH, outline=OUTLINE, width=3)
    # cracked top with filling
    ell(50, 35, 24, 10, fill=CARAMEL, outline=OUTLINE, width=2)
    # highlight
    ell(35, 47, 13, 7, fill=CREAM)
    # eyes
    ell(36, 58, 7, 7, fill=OUTLINE)
    ell(64, 58, 7, 7, fill=OUTLINE)
    # blush
    ell(27, 66, 11, 6, fill=BLUSH)
    ell(73, 66, 11, 6, fill=BLUSH)
    # mouth
    w = int(2.2 * u)
    d.arc([44 * u, 59 * u, 50 * u, 65 * u], 20, 160, fill=OUTLINE, width=w)
    d.arc([50 * u, 59 * u, 56 * u, 65 * u], 20, 160, fill=OUTLINE, width=w)
    return img.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for size in (192, 512):
        path = os.path.join(OUT_DIR, "icon-%d.png" % size)
        draw(size).save(path)
        print("wrote", path)


if __name__ == "__main__":
    main()
