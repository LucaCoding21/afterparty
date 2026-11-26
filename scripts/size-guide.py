#!/usr/bin/env python3
"""Size guide tool: builds tables, prepares diagrams and checks every guide.

All size guides must go through this script so they stay identical in format.
See "Size guides" in CLAUDE.md and section B of .claude/skills/launch-prep.

  python3 scripts/size-guide.py table <name> --sizes S,M,L,XL \
      --row "WIDTH=57,59,61,63" --row "LENGTH=65,67,69,71" ...
      Writes public/products/size-guides/<name>.svg in the house format.
      Values are in cm; write them exactly as on the designer's chart.

  python3 scripts/size-guide.py diagram "<chart image>" "<Product Name> Chart <year>"
      The chart image can be a rough screenshot of the designer's whole chart
      (dark edges, white page, drawing, size table). The tool finds the white
      page, cuts away the size table, drops stray specks and crops the drawing
      tight, then saves public/products/measurements/<name>.png and prints its
      shape bucket. Check the saved PNG once by eye: it should be the drawing
      and its labels only.

  python3 scripts/size-guide.py check
      Checks every SIZE_GUIDE_MAP entry: files exist, tables match the house
      format, diagrams are cropped tight. Run it before committing.

Needs Pillow and numpy (pip3 install pillow numpy) for `diagram` and `check`.
"""

import argparse
import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
TABLES = ROOT / 'public/products/size-guides'
DIAGRAMS = ROOT / 'public/products/measurements'
ROUTE = ROOT / 'app/routes/products.$handle.tsx'

# House table geometry. Do not change: every existing table uses it, and the
# approved size guide spacing in CLAUDE.md depends on it.
LINES = [0.5, 41, 92, 144, 195.5, 246.5, 297.5, 347.5]
BASELINES = [70, 121.5, 173.3, 224.5, 275.5, 326]
VIEWBOX_H = {1: 92, 2: 144, 3: 196, 4: 247, 5: 298, 6: 348}
COLUMNS = {1: [275], 3: [191, 296, 401], 4: [161, 241, 321, 401]}
# Tables made before this script existed that differ slightly from the house
# format. They are live and fine; the checker skips them. Never add to this.
LEGACY_TABLES = {'dragon-jersey.svg'}
FONT = 'font-family="\'Inter var\', \'Inter\', sans-serif"'

# Must match photoShapeClass() in app/routes/products.$handle.tsx.
def bucket(w, h):
    r = w / h
    return 'tall' if r < 0.75 else 'wide' if r > 1.2 else 'square'


def build_svg(sizes, rows):
    if len(sizes) not in COLUMNS:
        sys.exit(f'Unsupported size count {len(sizes)}: use 1 (ONE SIZE), 3 or 4.')
    if not 1 <= len(rows) <= 6:
        sys.exit('Tables take 1 to 6 measurement rows.')
    cols = COLUMNS[len(sizes)]
    out = [f'<svg viewBox="0 0 441 {VIEWBOX_H[len(rows)]}" fill="none" xmlns="http://www.w3.org/2000/svg">']
    lines = LINES[: len(rows) + 2]
    # The bottom line sits 1.5 units inside the table's edge. On the edge
    # (e.g. 297.5 in a 298 tall table) the browser trims it away at some
    # widths (1366 and 1440 on the Star jeans); 1 unit in was still too faint
    # at 1240 on the sweatpants. 1.5 matches the other lines at every width.
    lines[-1] = VIEWBOX_H[len(rows)] - 1.5
    for y in lines:
        out.append(f'  <line y1="{y:g}" x2="441" y2="{y:g}" stroke="#D8D8D8" stroke-opacity="0.4"/>')
    out.append(f'  <text x="14" y="26" fill="#111" {FONT} font-size="11">SIZE</text>')
    for x, s in zip(cols, sizes):
        out.append(f'  <text x="{x}" y="26" fill="#111" {FONT} font-size="11" text-anchor="middle">{s}</text>')
    for y, (label, values) in zip(BASELINES, rows):
        if len(values) != len(sizes):
            sys.exit(f'{label}: {len(values)} values for {len(sizes)} sizes.')
        out.append(f'  <text x="14" y="{y:g}" fill="#111" {FONT} font-size="12">{label}</text>')
        for x, v in zip(cols, values):
            out.append(f'  <text x="{x}" y="{y:g}" fill="#000" {FONT} font-size="12" text-anchor="middle">{v} cm</text>')
    out.append('</svg>')
    return '\n'.join(out) + '\n'


def parse_row(text):
    label, _, values = text.partition('=')
    vals = [v.strip().removesuffix('cm').strip() for v in values.split(',')]
    if not label or not all(re.fullmatch(r'\d+(\.\d+)?', v) for v in vals):
        sys.exit(f'Bad --row "{text}". Use "WIDTH=57,59,61,63" (cm, numbers only).')
    return label.strip().upper(), vals


def cmd_table(a):
    sizes = [s.strip().upper() for s in a.sizes.split(',')]
    path = TABLES / f'{a.name}.svg'
    path.write_text(build_svg(sizes, [parse_row(r) for r in a.row]))
    print(f'Wrote {path.relative_to(ROOT)}')


def _trim_specks(counts, gap=4, max_ink=60):
    """Index range of `counts` (ink pixels per row or column) with stray specks
    at either end dropped. A speck is a little ink (under max_ink pixels)
    separated from the drawing by at least `gap` blank lines. A designer's
    export can carry one in a corner; it is invisible but stretches the image
    box, which makes the gap around the drawing uneven on the page."""
    ink = [i for i, c in enumerate(counts) if c]
    if not ink:
        return None
    lo, hi = ink[0], ink[-1] + 1

    def trim(idx):
        # Walk inward over one end; drop the run before the first wide gap if it is tiny.
        total, last = 0, idx[0]
        for i in idx:
            if abs(i - last) > gap:
                return i if total < max_ink else None
            total += counts[i]; last = i
        return None

    new_lo = trim(ink)
    while new_lo is not None and new_lo > lo:
        lo = new_lo
        new_lo = trim([i for i in ink if i >= lo])
    new_hi = trim(ink[::-1])
    while new_hi is not None and new_hi + 1 < hi:
        hi = new_hi + 1
        new_hi = trim([i for i in ink[::-1] if i < hi])
    return lo, hi


def ink_bbox(im, threshold=250):
    from PIL import Image
    rgba = im.convert('RGBA')
    flat = Image.new('RGBA', rgba.size, (255, 255, 255, 255))
    flat.alpha_composite(rgba)
    mask = flat.convert('L').point(lambda v: 255 if v < threshold else 0)
    bb = mask.getbbox()
    if not bb:
        return flat, None
    w, h = mask.size
    px = mask.load()
    rows = [sum(1 for x in range(w) if px[x, y]) for y in range(h)]
    top, bottom = _trim_specks(rows)
    cols = [sum(1 for y in range(top, bottom) if px[x, y]) for x in range(w)]
    left, right = _trim_specks(cols)
    return flat, (left, top, right, bottom)


def _runs(flags):
    """(start, end) of each run of True values."""
    out, start = [], None
    for i, f in enumerate(list(flags) + [False]):
        if f and start is None:
            start = i
        elif not f and start is not None:
            out.append((start, i)); start = None
    return out


def _longest_run(mask_row):
    """Length of the longest unbroken run of True in a 1-D numpy bool array."""
    import numpy as np
    if not mask_row.any():
        return 0
    d = np.diff(np.concatenate(([0], mask_row.astype(np.int8), [0])))
    return int((np.flatnonzero(d == -1) - np.flatnonzero(d == 1)).max())


def isolate_drawing(flat):
    """From a screenshot of a whole designer chart, return the part that holds
    only the drawing: inside the white page, and above (or below) the size
    table. A file that is already just the drawing comes back unchanged."""
    import numpy as np
    a = np.asarray(flat.convert('L'), dtype=np.int16)
    h, w = a.shape

    # 1. The white page. Only rows/columns at the image's edges that are
    #    almost entirely non-white (an app window, the desktop) are dropped.
    #    A garment's dark hem or cuff always has white beside it, so a plain
    #    drawing file is never trimmed here.
    white = a > 235
    frame_rows = white.mean(axis=1) < 0.1
    frame_cols = white.mean(axis=0) < 0.1
    top = 0
    while top < h and frame_rows[top]: top += 1
    bottom = h
    while bottom > top and frame_rows[bottom - 1]: bottom -= 1
    left = 0
    while left < w and frame_cols[left]: left += 1
    right = w
    while right > left and frame_cols[right - 1]: right -= 1
    if bottom - top < 10 or right - left < 10:
        sys.exit('Could not find the white page in this image. Send the chart on a white background.')
    # Stay 3px clear of a page edge found inside the image (anti-aliasing).
    if top: top += 3
    if left: left += 3
    if bottom < h: bottom -= 3
    if right < w: right -= 3
    page = a[top:bottom, left:right]
    ph, pw = page.shape

    # 2. The size table: lines that run unbroken across most of the page (its
    #    grid and the edges of its black title bar). Drawings have no
    #    horizontal stroke that long; a hem or stripe is broken by the
    #    garment's outline or is much narrower.
    dark = page < 90
    long_rows = [y for y in range(ph) if _longest_run(dark[y]) > pw * 0.7]
    lines = _runs([y in set(long_rows) for y in range(ph)])
    if len(lines) < 3:
        return flat.crop((left, top, right, bottom)), 'no size table found, using the whole page'
    t_top, t_bottom = lines[0][0], lines[-1][1]
    ink = (page < 160).sum(axis=1)
    above, below = int(ink[:max(0, t_top - 4)].sum()), int(ink[t_bottom + 4:].sum())
    if above >= below:
        region, where = (left, top, right, top + max(1, t_top - 4)), 'above'
    else:
        region, where = (left, top + t_bottom + 4, right, bottom), 'below'
    return flat.crop(region), f'cut away the size table, kept the drawing {where} it'


def cmd_diagram(a):
    from PIL import Image
    rgba = Image.open(a.source).convert('RGBA')
    flat = Image.new('RGBA', rgba.size, (255, 255, 255, 255))
    flat.alpha_composite(rgba)
    part, note = isolate_drawing(flat)
    print(f'Found the drawing: {note}.')
    flat, bb = ink_bbox(part)
    if not bb:
        sys.exit('No drawing found in the image.')
    out = flat.crop(bb).convert('RGB')
    w, h = out.size
    if h < 700:
        print(f'Warning: only {h}px tall. Ask for a larger export (at least ~800px) so it stays sharp on retina screens.')
    dest = DIAGRAMS / f'{a.name}.png'
    out.save(dest, optimize=True)
    print(f'Wrote {dest.relative_to(ROOT)} ({w}x{h}, shape: {bucket(w, h)})')
    print(f"sizePhoto: '/products/measurements/{a.name.replace(' ', '%20')}.png'")


def cmd_check(_):
    from PIL import Image
    src = ROUTE.read_text()
    block = src[src.index('const SIZE_GUIDE_MAP'): src.index('\n};', src.index('const SIZE_GUIDE_MAP'))]
    entries = re.findall(r"'([^']+)':\s*\{\s*sizeGuide:\s*'([^']+)',(?:\s*sizePhoto:\s*'([^']+)',)?", block)
    problems = 0
    for handle, table, photo in entries:
        t = ROOT / 'public' / unquote(table).lstrip('/')
        if not t.exists():
            print(f'{handle}: table missing: {table}'); problems += 1
        elif t.name in LEGACY_TABLES:
            pass
        else:
            svg = t.read_text()
            labels = re.findall(r'<text x="14" y="(?!26")[^"]+"[^>]*>([^<]+)</text>', svg)
            sizes = re.findall(r'<text x="(?!14")\d+" y="26"[^>]*>([^<]+)</text>', svg)
            rows = []
            for i, label in enumerate(labels):
                y = f'{BASELINES[i]:g}'
                rows.append((label, re.findall(rf'<text x="(?!14")\d+" y="{re.escape(y)}"[^>]*>([\d.]+) cm</text>', svg)))
            try:
                if build_svg(sizes, rows) != svg:
                    print(f'{handle}: {table} is not in the house format; rebuild it with `table`.'); problems += 1
            except SystemExit as e:
                print(f'{handle}: {table}: {e}'); problems += 1
        if photo:
            p = ROOT / 'public' / unquote(photo).lstrip('/')
            if not p.exists():
                print(f'{handle}: diagram missing: {photo}'); problems += 1
                continue
            im = Image.open(p)
            _, bb = ink_bbox(im, 200)
            w, h = im.size
            if bb and max(bb[0], bb[1], w - bb[2], h - bb[3]) > 4:
                print(f'{handle}: {p.name} has blank margin; re-run `diagram` on it.'); problems += 1
    print(f'{len(entries)} entries checked, {problems} problem(s).')
    sys.exit(1 if problems else 0)


p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
sub = p.add_subparsers(dest='cmd', required=True)
t = sub.add_parser('table'); t.add_argument('name'); t.add_argument('--sizes', required=True)
t.add_argument('--row', action='append', required=True); t.set_defaults(fn=cmd_table)
d = sub.add_parser('diagram'); d.add_argument('source'); d.add_argument('name'); d.set_defaults(fn=cmd_diagram)
sub.add_parser('check').set_defaults(fn=cmd_check)
args = p.parse_args()
args.fn(args)
