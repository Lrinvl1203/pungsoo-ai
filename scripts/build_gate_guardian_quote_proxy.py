"""Build a watertight proxy STL for vendor quote comparison.

The mesh intentionally simplifies the selected Gate Guardian concept into a
flat-backed, constant-thickness silhouette. It is suitable for comparing print
quotes, not for final production.
"""

from __future__ import annotations

import math
import struct
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "artifacts" / "3d-print-quotes"
STL_PATH = OUT_DIR / "gate-dragon-proxy-170x75x10mm.stl"
PREVIEW_PATH = OUT_DIR / "gate-dragon-proxy-front.png"

WIDTH_MM = 75
HEIGHT_MM = 170
THICKNESS_MM = 10.0


def build_mask() -> Image.Image:
    """Return a 1 px = 1 mm silhouette with two intentional openings."""
    image = Image.new("L", (WIDTH_MM, HEIGHT_MM), 0)
    draw = ImageDraw.Draw(image)

    # Continuous S-body route.
    route = [
        (50, 22),
        (35, 27),
        (25, 43),
        (26, 60),
        (41, 73),
        (51, 84),
        (50, 99),
        (37, 110),
        (27, 121),
        (28, 137),
        (39, 146),
    ]
    draw.line(route, fill=255, width=23, joint="curve")
    for point in route:
        draw.ellipse(
            (
                point[0] - 11,
                point[1] - 11,
                point[0] + 11,
                point[1] + 11,
            ),
            fill=255,
        )

    # Angular guardian head and fused crest.
    draw.polygon(
        [(31, 6), (66, 5), (58, 14), (70, 22), (55, 34), (35, 28), (25, 18)],
        fill=255,
    )
    draw.polygon([(34, 3), (47, 0), (42, 11)], fill=255)
    draw.polygon([(44, 1), (57, 3), (48, 13)], fill=255)

    # Coiled load-bearing tail with a circular negative-space opening.
    draw.ellipse((14, 121, 64, 169), fill=255)
    draw.ellipse((28, 134, 50, 156), fill=0)
    draw.polygon([(13, 150), (24, 136), (29, 169)], fill=255)

    # Suspension hole, positioned within a thick head area.
    draw.ellipse((40, 11, 48, 19), fill=0)

    # Remove corner-only voxel contacts that would create non-manifold STL edges.
    pixels = image.load()
    changed = True
    while changed:
        changed = False
        for y in range(HEIGHT_MM - 1):
            for x in range(WIDTH_MM - 1):
                a = pixels[x, y] > 0
                b = pixels[x + 1, y] > 0
                c = pixels[x, y + 1] > 0
                d = pixels[x + 1, y + 1] > 0
                if a and d and not b and not c:
                    pixels[x + 1, y] = 255
                    changed = True
                elif b and c and not a and not d:
                    pixels[x, y] = 255
                    changed = True

    return image


def normal(a, b, c):
    ux, uy, uz = (b[i] - a[i] for i in range(3))
    vx, vy, vz = (c[i] - a[i] for i in range(3))
    nx = uy * vz - uz * vy
    ny = uz * vx - ux * vz
    nz = ux * vy - uy * vx
    length = math.sqrt(nx * nx + ny * ny + nz * nz)
    if length == 0:
        return (0.0, 0.0, 0.0)
    return (nx / length, ny / length, nz / length)


def add_triangle(triangles, a, b, c):
    triangles.append((normal(a, b, c), a, b, c))


def mesh_from_mask(mask: Image.Image):
    pixels = mask.load()
    width, height = mask.size
    triangles = []
    filled = 0

    def is_filled(x, y):
        return 0 <= x < width and 0 <= y < height and pixels[x, y] > 0

    for y in range(height):
        for x in range(width):
            if not is_filled(x, y):
                continue
            filled += 1

            # Convert image coordinates to right-handed model coordinates.
            y0 = float(height - y - 1)
            y1 = y0 + 1.0
            x0 = float(x)
            x1 = x0 + 1.0
            z0 = 0.0
            z1 = THICKNESS_MM

            p000 = (x0, y0, z0)
            p100 = (x1, y0, z0)
            p110 = (x1, y1, z0)
            p010 = (x0, y1, z0)
            p001 = (x0, y0, z1)
            p101 = (x1, y0, z1)
            p111 = (x1, y1, z1)
            p011 = (x0, y1, z1)

            # Back and front faces.
            add_triangle(triangles, p000, p110, p100)
            add_triangle(triangles, p000, p010, p110)
            add_triangle(triangles, p001, p101, p111)
            add_triangle(triangles, p001, p111, p011)

            # Add only exposed side faces.
            if not is_filled(x - 1, y):
                add_triangle(triangles, p000, p001, p011)
                add_triangle(triangles, p000, p011, p010)
            if not is_filled(x + 1, y):
                add_triangle(triangles, p100, p110, p111)
                add_triangle(triangles, p100, p111, p101)
            if not is_filled(x, y + 1):
                add_triangle(triangles, p000, p100, p101)
                add_triangle(triangles, p000, p101, p001)
            if not is_filled(x, y - 1):
                add_triangle(triangles, p010, p011, p111)
                add_triangle(triangles, p010, p111, p110)

    return triangles, filled


def write_binary_stl(path: Path, triangles):
    with path.open("wb") as stream:
        header = b"Pungsoo Gate Guardian quote proxy".ljust(80, b"\0")
        stream.write(header)
        stream.write(struct.pack("<I", len(triangles)))
        for n, a, b, c in triangles:
            stream.write(struct.pack("<12fH", *(n + a + b + c), 0))


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    mask = build_mask()
    preview = Image.new("RGB", mask.size, "white")
    preview.paste((38, 38, 38), mask=mask)
    preview = preview.resize((WIDTH_MM * 6, HEIGHT_MM * 6), Image.Resampling.NEAREST)
    preview.save(PREVIEW_PATH)

    triangles, filled_pixels = mesh_from_mask(mask)
    write_binary_stl(STL_PATH, triangles)

    volume_cm3 = filled_pixels * THICKNESS_MM / 1000.0
    print(f"STL: {STL_PATH}")
    print(f"Preview: {PREVIEW_PATH}")
    print(f"Dimensions: {WIDTH_MM} x {HEIGHT_MM} x {THICKNESS_MM:.1f} mm")
    print(f"Solid volume proxy: {volume_cm3:.1f} cm^3")
    print(f"Triangles: {len(triangles):,}")


if __name__ == "__main__":
    main()
