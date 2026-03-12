#!/usr/bin/env python3
"""
Convert all images in public/images (and /plans sub-folder) to true optimized PNG.
- Converts .jpg / .jpeg -> .png  (removes original)
- Re-saves any .png that is actually a JPEG as a real PNG
- Skips broken/corrupt/tiny files (< 1KB)
- Resizes to max 1920px width (preserving aspect ratio) for web optimization
- Prints a detailed report of every action taken
"""

import os
import sys
from pathlib import Path
from PIL import Image

BASE = Path("/home/nirosh/Code/NilathraCollection/public/images")
DIRS = [BASE, BASE / "plans"]
MAX_WIDTH = 1920     # max width for web
MIN_SIZE = 500       # bytes — skip anything smaller (corrupt/placeholder)

converted = []
reencoded = []
skipped = []
errors = []

def is_jpeg_data(path: Path) -> bool:
    """Return True if the file's magic bytes are JPEG (FF D8 FF), regardless of extension."""
    try:
        with open(path, "rb") as f:
            header = f.read(3)
        return header == b"\xff\xd8\xff"
    except Exception:
        return False

def process_image(path: Path):
    # Skip PDF, tiny placeholders, non-image files
    if path.suffix.lower() == ".pdf":
        skipped.append((str(path), "PDF"))
        return
    if path.stat().st_size < MIN_SIZE:
        skipped.append((str(path), f"too small ({path.stat().st_size} bytes)"))
        return

    try:
        img = Image.open(path)
        original_format = img.format  # 'JPEG', 'PNG', etc.
        original_size = path.stat().st_size
        w, h = img.size

        # Determine the target .png path
        target = path.with_suffix(".png")

        # ── Case 1: true non-PNG extension (.jpg / .jpeg) ──
        if path.suffix.lower() in (".jpg", ".jpeg"):
            # Resize if needed
            if w > MAX_WIDTH:
                ratio = MAX_WIDTH / w
                img = img.resize((MAX_WIDTH, int(h * ratio)), Image.LANCZOS)
            # Convert to RGB (drops transparency issues on JPEG sources)
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")
            img.save(target, "PNG", optimize=True)
            new_size = target.stat().st_size
            # Remove original
            path.unlink()
            converted.append({
                "original": path.name,
                "new": target.name,
                "original_kb": round(original_size / 1024),
                "new_kb": round(new_size / 1024),
                "dims": f"{img.size[0]}x{img.size[1]}"
            })
            return

        # ── Case 2: .png extension but actually a JPEG ──
        if path.suffix.lower() == ".png" and is_jpeg_data(path):
            if w > MAX_WIDTH:
                ratio = MAX_WIDTH / w
                img = img.resize((MAX_WIDTH, int(h * ratio)), Image.LANCZOS)
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")
            # Write to a temp file then replace
            tmp = path.with_name(path.stem + "__tmp.png")
            img.save(tmp, "PNG", optimize=True)
            tmp.replace(path)
            new_size = path.stat().st_size
            reencoded.append({
                "file": path.name,
                "was": "JPEG data",
                "original_kb": round(original_size / 1024),
                "new_kb": round(new_size / 1024),
                "dims": f"{img.size[0]}x{img.size[1]}"
            })
            return

        # ── Case 3: true PNG — just resize if oversized ──
        if path.suffix.lower() == ".png" and w > MAX_WIDTH:
            ratio = MAX_WIDTH / w
            img = img.resize((MAX_WIDTH, int(h * ratio)), Image.LANCZOS)
            img.save(path, "PNG", optimize=True)
            new_size = path.stat().st_size
            reencoded.append({
                "file": path.name,
                "was": f"PNG (oversized {original_size//1024}KB {w}x{h})",
                "original_kb": round(original_size / 1024),
                "new_kb": round(new_size / 1024),
                "dims": f"{img.size[0]}x{img.size[1]}"
            })
            return

        skipped.append((str(path), f"already valid PNG {w}x{h}"))

    except Exception as e:
        errors.append((str(path), str(e)))

# ── Run ──
for d in DIRS:
    for f in sorted(d.iterdir()):
        if f.is_file():
            process_image(f)

# ── Report ──
print(f"\n{'='*70}")
print(f"  IMAGE CONVERSION REPORT")
print(f"{'='*70}")

print(f"\n✅ CONVERTED (.jpg/.jpeg → .png): {len(converted)}")
for r in converted:
    savings = r['original_kb'] - r['new_kb']
    print(f"   {r['original']} → {r['new']}  [{r['original_kb']}KB → {r['new_kb']}KB, {r['dims']}]")

print(f"\n🔄 RE-ENCODED (false PNG → true PNG): {len(reencoded)}")
for r in reencoded:
    print(f"   {r['file']}  (was {r['was']})  [{r['original_kb']}KB → {r['new_kb']}KB, {r['dims']}]")

print(f"\n⏭  SKIPPED: {len(skipped)}")
for s in skipped:
    print(f"   {Path(s[0]).name}: {s[1]}")

if errors:
    print(f"\n❌ ERRORS: {len(errors)}")
    for e in errors:
        print(f"   {Path(e[0]).name}: {e[1]}")

print(f"\n{'='*70}")
print(f"  DONE — {len(converted)} converted, {len(reencoded)} re-encoded, {len(skipped)} skipped, {len(errors)} errors")
print(f"{'='*70}\n")

# ── Print rename map for code reference updates ──
if converted:
    print("CODE REFERENCE RENAMES NEEDED:")
    for r in converted:
        old_ref = r['original'].replace('.jpg', '').replace('.jpeg', '') 
        print(f"  {r['original']}  →  {r['new']}")
