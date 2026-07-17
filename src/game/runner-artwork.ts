import type { OrderVisualType, PowerUpKind } from "../shared/types";
import type { RenderScene, RunnerModel } from "./types";

export const ORDER_VISUAL_TYPES: readonly OrderVisualType[] =
  ["notebook", "telefon", "pc", "lcd", "parcel"] as const;

export const ORDER_ATLAS_PATH = "/assets/milion-runner/orders/order-atlas.webp";
export const POWER_UP_ATLAS_PATH = "/assets/milion-runner/powerups/powerup-atlas.webp";
export const COURIER_SPRITE_PATH = "/assets/milion-runner/courier/courier-sprite-sheet.webp";
export const COURIER_SPRITE_FRAME_COUNT = 14;

const COURIER_FRAME_WIDTH = 128;
const COURIER_FRAME_HEIGHT = 160;
const ATLAS_TILE_SIZE = 256;

export function courierSpriteFrame(
  runner: Readonly<RunnerModel>,
  scene: Pick<RenderScene, "elapsedSeconds" | "milestoneCelebration">
): number {
  const celebration = scene.milestoneCelebration;
  if (celebration !== null && celebration !== undefined && celebration.threshold >= 500) {
    return 11 + Math.min(2, Math.floor(celebration.progress * 3));
  }
  if (runner.crouching) return 9 + Math.floor(scene.elapsedSeconds * 4) % 2;
  if (!runner.grounded) {
    if (runner.velocityY < -40) return 6;
    if (runner.velocityY > 40) return 8;
    return 7;
  }
  return Math.floor(scene.elapsedSeconds * 7) % 6;
}

type ArtworkImageFactory = () => HTMLImageElement;

function browserImageFactory(): HTMLImageElement | null {
  const Constructor = globalThis.Image;
  return typeof Constructor === "function" ? new Constructor() : null;
}

function loadImage(path: string, factory?: ArtworkImageFactory): HTMLImageElement | null {
  const image = factory?.() ?? browserImageFactory();
  if (image === null) return null;
  image.decoding = "async";
  image.src = path;
  return image;
}

function drawable(image: HTMLImageElement | null): image is HTMLImageElement {
  return image !== null && image.complete && image.naturalWidth > 0;
}

/** Raster artwork used by canvas rendering; callers keep their vector fallback. */
export class RunnerArtwork {
  private readonly orders: HTMLImageElement | null;
  private readonly powerUps: HTMLImageElement | null;
  private readonly courier: HTMLImageElement | null;

  public constructor(factory?: ArtworkImageFactory) {
    this.orders = loadImage(ORDER_ATLAS_PATH, factory);
    this.powerUps = loadImage(POWER_UP_ATLAS_PATH, factory);
    this.courier = loadImage(COURIER_SPRITE_PATH, factory);
  }

  public drawOrder(
    context: CanvasRenderingContext2D,
    type: OrderVisualType,
    x: number,
    y: number,
    size: number
  ): boolean {
    if (!drawable(this.orders)) return false;
    const index = ORDER_VISUAL_TYPES.indexOf(type);
    if (index < 0) return false;
    context.drawImage(
      this.orders,
      index * ATLAS_TILE_SIZE,
      0,
      ATLAS_TILE_SIZE,
      ATLAS_TILE_SIZE,
      x,
      y,
      size,
      size
    );
    return true;
  }

  public drawPowerUp(
    context: CanvasRenderingContext2D,
    kind: PowerUpKind,
    x: number,
    y: number,
    size: number
  ): boolean {
    if (!drawable(this.powerUps)) return false;
    const index = kind === "gwarancja_48" ? 0 : 1;
    context.drawImage(
      this.powerUps,
      index * ATLAS_TILE_SIZE,
      0,
      ATLAS_TILE_SIZE,
      ATLAS_TILE_SIZE,
      x,
      y,
      size,
      size
    );
    return true;
  }

  public drawCourier(
    context: CanvasRenderingContext2D,
    runner: Readonly<RunnerModel>,
    scene: Readonly<RenderScene>
  ): boolean {
    if (!drawable(this.courier)) return false;
    const frame = courierSpriteFrame(runner, scene);
    const height = runner.crouching ? 86 : 108;
    const width = height * (COURIER_FRAME_WIDTH / COURIER_FRAME_HEIGHT);
    const feetY = runner.y + runner.height + 4;
    context.drawImage(
      this.courier,
      frame * COURIER_FRAME_WIDTH,
      0,
      COURIER_FRAME_WIDTH,
      COURIER_FRAME_HEIGHT,
      runner.x - 3,
      feetY - height,
      width,
      height
    );
    return true;
  }
}
