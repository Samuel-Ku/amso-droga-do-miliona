#!/usr/bin/env python3
"""Build the production courier run cycle from the approved source video."""

from __future__ import annotations

import argparse
import subprocess
import tempfile
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


FRAME_INDICES = (0, 5, 10, 16, 21, 26, 31, 37)
CELL_SIZE = 512
SOURCE_GROUND_Y = 925
DESTINATION_GROUND_Y = 470
UNIFORM_SCALE = 0.45


def extract_frames(video: Path, directory: Path) -> list[Path]:
    selection = "+".join(f"eq(n,{index})" for index in FRAME_INDICES)
    output = directory / "source-%02d.png"
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(video),
            "-vf",
            f"select='{selection}'",
            "-vsync",
            "vfr",
            str(output),
        ],
        check=True,
    )
    frames = sorted(directory.glob("source-*.png"))
    if len(frames) != len(FRAME_INDICES):
        raise RuntimeError(f"Expected {len(FRAME_INDICES)} frames, got {len(frames)}")
    return frames


def largest_component(mask: np.ndarray) -> np.ndarray:
    height, width = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    best: list[tuple[int, int]] = []
    for start_y, start_x in zip(*np.nonzero(mask & ~visited), strict=True):
        if visited[start_y, start_x]:
            continue
        queue = deque([(int(start_y), int(start_x))])
        visited[start_y, start_x] = True
        component: list[tuple[int, int]] = []
        while queue:
            y, x = queue.popleft()
            component.append((y, x))
            for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if (
                    0 <= next_y < height
                    and 0 <= next_x < width
                    and mask[next_y, next_x]
                    and not visited[next_y, next_x]
                ):
                    visited[next_y, next_x] = True
                    queue.append((next_y, next_x))
        if len(component) > len(best):
            best = component
    result = np.zeros_like(mask, dtype=bool)
    if best:
        ys, xs = zip(*best, strict=True)
        result[np.asarray(ys), np.asarray(xs)] = True
    return result


def fill_enclosed_holes(mask: np.ndarray) -> np.ndarray:
    height, width = mask.shape
    outside = np.zeros_like(mask, dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        for y in (0, height - 1):
            if not mask[y, x] and not outside[y, x]:
                outside[y, x] = True
                queue.append((y, x))
    for y in range(height):
        for x in (0, width - 1):
            if not mask[y, x] and not outside[y, x]:
                outside[y, x] = True
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if (
                0 <= next_y < height
                and 0 <= next_x < width
                and not mask[next_y, next_x]
                and not outside[next_y, next_x]
            ):
                outside[next_y, next_x] = True
                queue.append((next_y, next_x))
    return mask | (~mask & ~outside)


def isolate_courier(source: Image.Image) -> Image.Image:
    rgb = np.asarray(source.convert("RGB"), dtype=np.int16)
    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)
    luminance = rgb.mean(axis=2)
    chroma = maximum - minimum

    # The source has a neutral light-grey generated backdrop. Saturated pixels
    # and dark ink/clothes form a single courier component; watermark and floor
    # shadow are disconnected and therefore discarded.
    seed = (chroma >= 24) | (luminance <= 126)
    seed[:90, :] = False
    component = largest_component(seed)
    component = fill_enclosed_holes(component)

    matte = Image.fromarray(component.astype(np.uint8) * 255, mode="L")
    matte = matte.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.0))
    rgba = source.convert("RGBA")
    rgba.putalpha(matte)
    return rgba


def place_on_cell(courier: Image.Image) -> Image.Image:
    scaled_size = tuple(round(dimension * UNIFORM_SCALE) for dimension in courier.size)
    scaled = courier.resize(scaled_size, Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
    offset_x = (CELL_SIZE - scaled.width) // 2
    offset_y = DESTINATION_GROUND_Y - round(SOURCE_GROUND_Y * UNIFORM_SCALE)
    cell.alpha_composite(scaled, (offset_x, offset_y))
    return cell


def validate_frame(frame: Image.Image, index: int) -> None:
    alpha = np.asarray(frame.getchannel("A"))
    if alpha[0, 0] != 0 or alpha[-1, -1] != 0:
        raise RuntimeError(f"Frame {index} has opaque corners")
    coverage = np.count_nonzero(alpha > 16) / alpha.size
    if not 0.08 <= coverage <= 0.42:
        raise RuntimeError(f"Frame {index} has suspicious coverage {coverage:.3f}")
    bounds = frame.getchannel("A").getbbox()
    if bounds is None or bounds[1] < 20 or bounds[3] > 490:
        raise RuntimeError(f"Frame {index} is clipped or misaligned: {bounds}")


def build(video: Path, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    frames_dir = output_dir / "run-frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="amso-run-") as temp:
        sources = extract_frames(video, Path(temp))
        frames: list[Image.Image] = []
        for index, source_path in enumerate(sources):
            frame = place_on_cell(isolate_courier(Image.open(source_path)))
            validate_frame(frame, index)
            frame.save(frames_dir / f"run-{index:02d}.png", optimize=True)
            frames.append(frame)

    sheet = Image.new("RGBA", (CELL_SIZE * len(frames), CELL_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * CELL_SIZE, 0))
    sheet.save(output_dir / "courier-run-sheet.png", optimize=True)
    sheet.save(
        output_dir / "courier-run-sheet.webp",
        "WEBP",
        lossless=False,
        quality=88,
        method=6,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("video", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    build(args.video.resolve(), args.output_dir.resolve())


if __name__ == "__main__":
    main()
