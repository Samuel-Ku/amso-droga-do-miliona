#!/usr/bin/env python3
"""Build production courier run and crouch sprite sheets from approved videos."""

from __future__ import annotations

import argparse
import subprocess
import tempfile
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


FRAME_INDICES = (0, 5, 10, 16, 21, 26, 31, 37)
CROUCH_FRAME_INDICES = (36, 42, 48, 54, 60, 66, 72, 78)
CELL_SIZE = 512
SOURCE_GROUND_Y = 925
DESTINATION_GROUND_Y = 470
UNIFORM_SCALE = 0.45
CROUCH_UNIFORM_SCALE = 0.41

# The backpack moves and tilts slightly through the authored run cycle.  Keep
# the logo attached to the visible orange face instead of drawing one fixed
# screen-space mark over the courier at runtime.


@dataclass(frozen=True)
class BackpackMarkTransform:
    center_x: int
    center_y: int
    width: int
    angle_degrees: int


BACKPACK_MARK_TRANSFORMS = (
    BackpackMarkTransform(176, 210, 46, -15),
    BackpackMarkTransform(177, 211, 46, -14),
    BackpackMarkTransform(181, 207, 46, -13),
    BackpackMarkTransform(184, 205, 46, -12),
    BackpackMarkTransform(177, 207, 46, -14),
    BackpackMarkTransform(179, 208, 46, -14),
    BackpackMarkTransform(184, 204, 44, -12),
    BackpackMarkTransform(184, 205, 44, -12),
)

def extract_frames(
    video: Path,
    directory: Path,
    frame_indices: tuple[int, ...] = FRAME_INDICES,
) -> list[Path]:
    selection = "+".join(f"eq(n,{index})" for index in frame_indices)
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
    if len(frames) != len(frame_indices):
        raise RuntimeError(f"Expected {len(frame_indices)} frames, got {len(frames)}")
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


def place_run_on_cell(courier: Image.Image) -> Image.Image:
    scaled_size = tuple(round(dimension * UNIFORM_SCALE) for dimension in courier.size)
    scaled = courier.resize(scaled_size, Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
    offset_x = (CELL_SIZE - scaled.width) // 2
    offset_y = DESTINATION_GROUND_Y - round(SOURCE_GROUND_Y * UNIFORM_SCALE)
    cell.alpha_composite(scaled, (offset_x, offset_y))
    return cell


def place_crouch_on_cell(courier: Image.Image) -> Image.Image:
    bounds = courier.getchannel("A").getbbox()
    if bounds is None:
        raise RuntimeError("Crouch frame contains no courier pixels")
    cropped = courier.crop(bounds)
    scaled = cropped.resize(
        (
            round(cropped.width * CROUCH_UNIFORM_SCALE),
            round(cropped.height * CROUCH_UNIFORM_SCALE),
        ),
        Image.Resampling.LANCZOS,
    )
    cell = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
    cell.alpha_composite(
        scaled,
        ((CELL_SIZE - scaled.width) // 2, DESTINATION_GROUND_Y - scaled.height),
    )
    return cell


def brand_backpack(
    frame: Image.Image,
    mark: Image.Image,
    index: int,
    transforms: tuple[BackpackMarkTransform, ...] = BACKPACK_MARK_TRANSFORMS,
) -> Image.Image:
    placement = transforms[index]
    height = round(mark.height * placement.width / mark.width)
    transformed = mark.resize(
        (placement.width, height), Image.Resampling.LANCZOS
    ).rotate(
        placement.angle_degrees,
        resample=Image.Resampling.BICUBIC,
        expand=True,
    )
    branded = frame.copy()
    branded.alpha_composite(
        transformed,
        (
            round(placement.center_x - transformed.width / 2),
            round(placement.center_y - transformed.height / 2),
        ),
    )
    return branded


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


def build_motion(
    video: Path,
    output_dir: Path,
    *,
    frame_indices: tuple[int, ...],
    frames_directory: str,
    frame_prefix: str,
    sheet_stem: str,
    temporary_prefix: str,
    place_frame: Callable[[Image.Image], Image.Image],
    mark_transforms: tuple[BackpackMarkTransform, ...] | None,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    frames_dir = output_dir / frames_directory
    frames_dir.mkdir(parents=True, exist_ok=True)
    mark: Image.Image | None = None
    if mark_transforms is not None:
        mark_path = output_dir / "A.webp"
        if not mark_path.exists():
            raise RuntimeError(f"Missing approved backpack mark: {mark_path}")
        mark = Image.open(mark_path).convert("RGBA")

    with tempfile.TemporaryDirectory(prefix=temporary_prefix) as temp:
        sources = extract_frames(video, Path(temp), frame_indices)
        frames: list[Image.Image] = []
        for index, source_path in enumerate(sources):
            frame = place_frame(isolate_courier(Image.open(source_path)))
            if mark is not None and mark_transforms is not None:
                frame = brand_backpack(frame, mark, index, mark_transforms)
            validate_frame(frame, index)
            frame.save(frames_dir / f"{frame_prefix}-{index:02d}.png", optimize=True)
            frames.append(frame)

    sheet = Image.new("RGBA", (CELL_SIZE * len(frames), CELL_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * CELL_SIZE, 0))
    sheet.save(output_dir / f"{sheet_stem}.png", optimize=True)
    sheet.save(
        output_dir / f"{sheet_stem}.webp",
        "WEBP",
        lossless=False,
        quality=88,
        method=6,
    )


def build_run(video: Path, output_dir: Path) -> None:
    build_motion(
        video,
        output_dir,
        frame_indices=FRAME_INDICES,
        frames_directory="run-frames",
        frame_prefix="run",
        sheet_stem="courier-run-sheet",
        temporary_prefix="amso-run-",
        place_frame=place_run_on_cell,
        mark_transforms=BACKPACK_MARK_TRANSFORMS,
    )


def build_crouch(video: Path, output_dir: Path) -> None:
    build_motion(
        video,
        output_dir,
        frame_indices=CROUCH_FRAME_INDICES,
        frames_directory="crouch-frames",
        frame_prefix="crouch",
        sheet_stem="courier-crouch-sheet",
        temporary_prefix="amso-crouch-",
        place_frame=place_crouch_on_cell,
        # Keep the authored crouch frames unbranded. The mark needs manual
        # occlusion/perspective work so it reads as print on the backpack,
        # instead of floating above the courier's arm.
        mark_transforms=None,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("video", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--motion", choices=("run", "crouch"), default="run")
    args = parser.parse_args()
    builder = build_crouch if args.motion == "crouch" else build_run
    builder(args.video.resolve(), args.output_dir.resolve())


if __name__ == "__main__":
    main()
