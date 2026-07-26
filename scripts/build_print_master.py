"""Build print-ready framed-art masters from a portrait source image."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageCms, ImageFilter
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


A3_TRIM_MM = (297, 420)
A3_BLEED_MM = (303, 426)
DPI = 300
A3_BLEED_PX = (3579, 5031)


def center_crop_to_ratio(image: Image.Image, target_ratio: float) -> Image.Image:
    source_ratio = image.width / image.height
    if abs(source_ratio - target_ratio) < 0.0001:
        return image
    if source_ratio > target_ratio:
        cropped_width = round(image.height * target_ratio)
        left = (image.width - cropped_width) // 2
        return image.crop((left, 0, left + cropped_width, image.height))
    cropped_height = round(image.width / target_ratio)
    top = (image.height - cropped_height) // 2
    return image.crop((0, top, image.width, top + cropped_height))


def build_masters(source: Path, output_dir: Path, basename: str) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as opened:
        image = opened.convert("RGB")

    cropped = center_crop_to_ratio(image, A3_BLEED_MM[0] / A3_BLEED_MM[1])
    master = cropped.resize(A3_BLEED_PX, Image.Resampling.LANCZOS)
    master = master.filter(ImageFilter.UnsharpMask(radius=0.8, percent=55, threshold=3))

    srgb_profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()

    png_path = output_dir / f"{basename}-a3-bleed3mm-300dpi.png"
    master.save(
        png_path,
        format="PNG",
        dpi=(DPI, DPI),
        icc_profile=srgb_profile,
        optimize=True,
    )

    jpg_path = output_dir / f"{basename}-a3-bleed3mm-300dpi-upload.jpg"
    master.save(
        jpg_path,
        format="JPEG",
        quality=96,
        subsampling=0,
        dpi=(DPI, DPI),
        icc_profile=srgb_profile,
        optimize=True,
    )

    pdf_path = output_dir / f"{basename}-a3-bleed3mm-print.pdf"
    page_width = A3_BLEED_MM[0] * mm
    page_height = A3_BLEED_MM[1] * mm
    pdf = canvas.Canvas(
        str(pdf_path),
        pagesize=(page_width, page_height),
        pageCompression=1,
        pdfVersion=(1, 4),
    )
    pdf.setTitle(f"{basename} A3 framed art print master")
    pdf.setAuthor("Pungsoo AI")
    pdf.setSubject("A3 trim with 3 mm bleed, sRGB, 300 DPI source")
    pdf.drawImage(
        str(jpg_path),
        0,
        0,
        width=page_width,
        height=page_height,
        preserveAspectRatio=False,
        mask=None,
    )
    pdf.showPage()
    pdf.save()

    return [png_path, jpg_path, pdf_path]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--basename", default="pungsoo-first-frame")
    args = parser.parse_args()

    if not args.source.is_file():
        raise FileNotFoundError(args.source)

    for artifact in build_masters(args.source, args.output_dir, args.basename):
        print(artifact)


if __name__ == "__main__":
    main()
