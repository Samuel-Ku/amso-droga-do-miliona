import { GROUND_Y, WORLD_WIDTH } from "../game/constants";

export interface WorldArtworkMeta {
  readonly artWidth: number;
  readonly artHeight: number;
  readonly artGroundY: number;
}

export interface PlateRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface WorldPlateTransform {
  readonly artScale: number;
  readonly plateRect: Readonly<PlateRect>;
  readonly worldScale: number;
  readonly worldOffsetX: number;
  readonly worldOffsetY: number;
  readonly clipRect: Readonly<PlateRect>;
}

export const WORLD_ARTWORK_CONTRACT: Readonly<WorldArtworkMeta> = Object.freeze({
  artWidth: 1780,
  artHeight: 941,
  artGroundY: 771
});

type WorldArtworkContractEntry = Readonly<{
  assetPath: string;
  artwork?: Partial<WorldArtworkMeta>;
}>;

export function assertWorldArtworkContract(
  worlds: readonly WorldArtworkContractEntry[]
): void {
  const fields = ["artWidth", "artHeight", "artGroundY"] as const;
  for (const world of worlds) {
    for (const field of fields) {
      const expected = WORLD_ARTWORK_CONTRACT[field];
      const received = world.artwork?.[field];
      if (received !== expected) {
        throw new Error(
          `world_artwork_metadata_mismatch:${world.assetPath}:${field}:` +
          `expected=${expected}:received=${String(received)}`
        );
      }
    }
  }
}

export function calculateWorldPlateTransform(
  stageWidth: number,
  stageHeight: number,
  metadata: Readonly<WorldArtworkMeta>
): Readonly<WorldPlateTransform> | null {
  if (!Number.isFinite(stageWidth) || !Number.isFinite(stageHeight) ||
      stageWidth <= 0 || stageHeight <= 0) {
    return null;
  }
  const artScale = Math.min(
    stageWidth / metadata.artWidth,
    stageHeight / metadata.artHeight
  );
  const plateWidth = metadata.artWidth * artScale;
  const plateHeight = metadata.artHeight * artScale;
  const plateRect = Object.freeze({
    x: (stageWidth - plateWidth) / 2,
    y: (stageHeight - plateHeight) / 2,
    width: plateWidth,
    height: plateHeight
  });
  const worldScale = artScale * metadata.artWidth / WORLD_WIDTH;
  const renderGroundY = plateRect.y + metadata.artGroundY * artScale;

  return Object.freeze({
    artScale,
    plateRect,
    worldScale,
    worldOffsetX: plateRect.x,
    worldOffsetY: renderGroundY - GROUND_Y * worldScale,
    clipRect: plateRect
  });
}
