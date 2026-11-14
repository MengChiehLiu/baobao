"""Subset jf Open Huninn to only the characters the game uses.

Scans src/**/*.js, src/**/*.json and index.html for CJK characters and
full-width punctuation, adds printable ASCII, and writes
src/assets/fonts/baobao-rounded.woff2.

The OFL license reserves the names "open huninn" and "huninn", so the subset
(a Modified Version) is renamed to "BaobaoRounded".
"""

import glob
import os
import sys
import tempfile

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_FONT = os.path.join(ROOT, "tools", "fonts", "jf-openhuninn-2.1.ttf")
OUT_FONT = os.path.join(ROOT, "src", "assets", "fonts", "baobao-rounded.woff2")
NEW_NAME = "BaobaoRounded"


def wanted(ch):
    cp = ord(ch)
    return (
        0x2000 <= cp <= 0x206F  # general punctuation (…, ‧)
        or 0x2190 <= cp <= 0x21FF  # arrows
        or 0x00D7 == cp  # ×
        or 0x3000 <= cp <= 0x30FF  # CJK punctuation, kana
        or 0x3400 <= cp <= 0x9FFF  # CJK ideographs
        or 0xFF00 <= cp <= 0xFFEF  # full-width forms
    )


def collect_chars():
    files = glob.glob(os.path.join(ROOT, "src", "**", "*.js"), recursive=True)
    files += glob.glob(os.path.join(ROOT, "src", "**", "*.json"), recursive=True)
    files.append(os.path.join(ROOT, "index.html"))
    chars = set(chr(c) for c in range(0x20, 0x7F))
    for path in files:
        with open(path, encoding="utf-8") as f:
            chars.update(ch for ch in f.read() if wanted(ch))
    return chars


def rename(path):
    font = TTFont(path)
    for rec in font["name"].names:
        if rec.nameID in (1, 4, 16):
            rec.string = NEW_NAME
        elif rec.nameID == 6:
            rec.string = NEW_NAME + "-Regular"
        elif rec.nameID == 3:
            rec.string = NEW_NAME + ";subset"
    font.save(path)


def main():
    chars = collect_chars()
    os.makedirs(os.path.dirname(OUT_FONT), exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".txt", delete=False) as tf:
        tf.write("".join(sorted(chars)))
        text_file = tf.name
    try:
        subset.main([
            SRC_FONT,
            "--text-file=" + text_file,
            "--flavor=woff2",
            "--layout-features=*",
            "--output-file=" + OUT_FONT,
        ])
    finally:
        os.remove(text_file)
    rename(OUT_FONT)
    size_kb = os.path.getsize(OUT_FONT) / 1024
    print("chars: %d, output: %s (%.1f KB)" % (len(chars), OUT_FONT, size_kb))
    if size_kb > 300:
        print("warning: font is larger than 300 KB", file=sys.stderr)


if __name__ == "__main__":
    main()
