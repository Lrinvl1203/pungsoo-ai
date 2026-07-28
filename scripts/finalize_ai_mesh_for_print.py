"""Scale an AI-reconstructed mesh to a real-world STL and make previews.

This keeps the reconstructed closed surface intact while normalizing the three
principal dimensions for the Gate Guardian wall-hanging prototype.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import trimesh
from PIL import Image, ImageDraw


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="Input OBJ/GLB/STL mesh")
    parser.add_argument("output", type=Path, help="Output STL path")
    parser.add_argument("--height-mm", type=float, default=170.0)
    parser.add_argument("--depth-mm", type=float, default=12.0)
    parser.add_argument("--preview-size", type=int, default=1200)
    return parser.parse_args()


def normalize_for_wall_hanging(
    mesh: trimesh.Trimesh, height_mm: float, depth_mm: float
) -> trimesh.Trimesh:
    mesh = mesh.copy()
    mesh.process(validate=True)

    # TripoSR's output orientation can vary. Infer height/width/depth from the
    # longest, middle, and shortest bounding-box axes.
    extents = mesh.extents
    depth_axis, width_axis, height_axis = np.argsort(extents)
    vertices = mesh.vertices[:, [width_axis, height_axis, depth_axis]].copy()

    xy_scale = height_mm / np.ptp(vertices[:, 1])
    vertices[:, :2] *= xy_scale
    vertices[:, 2] *= depth_mm / np.ptp(vertices[:, 2])

    # Center width; put the bottom and back on zero for predictable slicer use.
    vertices[:, 0] -= (vertices[:, 0].min() + vertices[:, 0].max()) / 2.0
    vertices[:, 1] -= vertices[:, 1].min()
    vertices[:, 2] -= vertices[:, 2].min()
    mesh.vertices = vertices
    mesh.remove_unreferenced_vertices()
    mesh.fix_normals()
    return mesh


def face_colors(mesh: trimesh.Trimesh) -> np.ndarray:
    if hasattr(mesh.visual, "vertex_colors") and len(mesh.visual.vertex_colors):
        colors = np.asarray(mesh.visual.vertex_colors)[mesh.faces, :3].mean(axis=1)
    else:
        colors = np.full((len(mesh.faces), 3), 105.0)

    normals = np.asarray(mesh.face_normals)
    light = np.clip(0.66 + 0.34 * np.abs(normals[:, 2]), 0.55, 1.0)
    return np.clip(colors * light[:, None], 0, 255).astype(np.uint8)


def render_projection(
    mesh: trimesh.Trimesh,
    path: Path,
    horizontal_axis: int,
    vertical_axis: int,
    depth_axis: int,
    size: int,
) -> None:
    margin = int(size * 0.06)
    canvas = Image.new("RGB", (size, size), (239, 235, 226))
    draw = ImageDraw.Draw(canvas)

    vertices = np.asarray(mesh.vertices)
    projected = vertices[:, [horizontal_axis, vertical_axis]]
    minimum = projected.min(axis=0)
    span = np.maximum(np.ptp(projected, axis=0), 1e-9)
    scale = min((size - 2 * margin) / span[0], (size - 2 * margin) / span[1])
    offset = np.array(
        [
            (size - span[0] * scale) / 2.0,
            (size - span[1] * scale) / 2.0,
        ]
    )
    points = (projected - minimum) * scale + offset
    points[:, 1] = size - points[:, 1]

    colors = face_colors(mesh)
    order = np.argsort(vertices[mesh.faces, depth_axis].mean(axis=1))
    for face_index in order:
        polygon = [tuple(points[index]) for index in mesh.faces[face_index]]
        color = tuple(int(value) for value in colors[face_index])
        draw.polygon(polygon, fill=color)

    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path)


def main() -> None:
    args = parse_args()
    loaded = trimesh.load(args.input, force="mesh", process=False)
    if not isinstance(loaded, trimesh.Trimesh):
        raise TypeError(f"Expected one mesh, got {type(loaded).__name__}")

    mesh = normalize_for_wall_hanging(loaded, args.height_mm, args.depth_mm)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(args.output)

    stem = args.output.with_suffix("")
    render_projection(
        mesh,
        stem.with_name(stem.name + "-front.png"),
        horizontal_axis=0,
        vertical_axis=1,
        depth_axis=2,
        size=args.preview_size,
    )
    render_projection(
        mesh,
        stem.with_name(stem.name + "-side.png"),
        horizontal_axis=2,
        vertical_axis=1,
        depth_axis=0,
        size=args.preview_size,
    )

    report = {
        "source": str(args.input),
        "stl": str(args.output),
        "dimensions_mm": [round(float(value), 3) for value in mesh.extents],
        "vertices": int(len(mesh.vertices)),
        "faces": int(len(mesh.faces)),
        "components": int(len(mesh.split(only_watertight=False))),
        "watertight": bool(mesh.is_watertight),
        "winding_consistent": bool(mesh.is_winding_consistent),
        "euler_number": int(mesh.euler_number),
        "volume_cm3": round(float(abs(mesh.volume)) / 1000.0, 3),
    }
    report_path = stem.with_name(stem.name + "-report.json")
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
