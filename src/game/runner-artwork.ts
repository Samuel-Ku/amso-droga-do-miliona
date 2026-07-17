import type { OrderVisualType, PowerUpKind } from "../shared/types";
import type { RenderScene, RunnerModel } from "./types";

export const ORDER_VISUAL_TYPES: readonly OrderVisualType[] =
  ["notebook", "telefon", "pc", "lcd", "parcel"] as const;

export const ORDER_ASSET_PATHS = {
  notebook: "/assets/milion-runner/orders/notebook.webp",
  telefon: "/assets/milion-runner/orders/telefon.webp",
  pc: "/assets/milion-runner/orders/pc.webp",
  lcd: "/assets/milion-runner/orders/lcd.webp",
  parcel: "/assets/milion-runner/orders/parcel-01.webp"
} as const satisfies Readonly<Record<OrderVisualType, string>>;

export const PARCEL_CELEBRATION_FRAME_PATHS = [
  "/assets/milion-runner/orders/parcel-01.webp",
  "/assets/milion-runner/orders/parcel-02.webp",
  "/assets/milion-runner/orders/parcel-03.webp",
  "/assets/milion-runner/orders/parcel-04.webp"
] as const;

export const ORDER_ATLAS_PATH = "/assets/milion-runner/orders/order-atlas.webp";
export const POWER_UP_ATLAS_PATH = "/assets/milion-runner/powerups/powerup-atlas.webp";
export const COURIER_SPRITE_PATH = "/assets/milion-runner/courier/courier-run-sheet.webp";
export const COURIER_BRAND_MARK_PATH = "/assets/milion-runner/courier/A.webp";
export const COURIER_SPRITE_FRAME_COUNT = 8;

const COURIER_SPRITE_CELL_SIZE = 512;
const COURIER_SOURCE_GROUND_Y = 470;
const COURIER_RENDER_SIZE = 170;
const COURIER_RUN_FPS = 12;
const ATLAS_TILE_SIZE = 256;

export function parcelAnimationFrame(
  elapsedSeconds: number,
  phase: number,
  reducedMotion: boolean
): number {
  if (reducedMotion) return 0;
  return Math.floor(Math.max(0, elapsedSeconds) * 5 + Math.max(0, phase)) %
    PARCEL_CELEBRATION_FRAME_PATHS.length;
}

export function courierSpriteFrame(
  runner: Readonly<RunnerModel>,
  scene: Pick<RenderScene, "elapsedSeconds" | "milestoneCelebration">
): number {
  if (runner.crouching) return 1;
  if (!runner.grounded) {
    if (runner.velocityY < -40) return 3;
    if (runner.velocityY > 40) return 7;
    return 4;
  }
  return Math.floor(scene.elapsedSeconds * COURIER_RUN_FPS) % COURIER_SPRITE_FRAME_COUNT;
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
  private readonly courierBrandMark: HTMLImageElement | null;
  private readonly parcelFrames: readonly (HTMLImageElement | null)[];

  public constructor(factory?: ArtworkImageFactory) {
    this.orders = loadImage(ORDER_ATLAS_PATH, factory);
    this.powerUps = loadImage(POWER_UP_ATLAS_PATH, factory);
    this.courier = loadImage(COURIER_SPRITE_PATH, factory);
    this.courierBrandMark = loadImage(COURIER_BRAND_MARK_PATH, factory);
    this.parcelFrames = PARCEL_CELEBRATION_FRAME_PATHS.map((path) => loadImage(path, factory));
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

  public drawParcelOrder(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    elapsedSeconds: number,
    phase: number,
    reducedMotion: boolean
  ): boolean {
    const frame = this.parcelFrames[
      parcelAnimationFrame(elapsedSeconds, phase, reducedMotion)
    ] ?? null;
    if (!drawable(frame)) return this.drawOrder(context, "parcel", x, y, size);
    context.drawImage(frame, x, y, size, size);
    return true;
  }

  public drawCourier(
    context: CanvasRenderingContext2D,
    runner: Readonly<RunnerModel>,
    scene: Readonly<RenderScene>
  ): boolean {
    if (!drawable(this.courier)) return false;
    const frame = scene.reducedMotion ? 0 : courierSpriteFrame(runner, scene);
    const feetY = runner.y + runner.height + 4;
    const x = runner.x + runner.width / 2 - COURIER_RENDER_SIZE / 2;
    const y = feetY - COURIER_SOURCE_GROUND_Y / COURIER_SPRITE_CELL_SIZE *
      COURIER_RENDER_SIZE;
    context.drawImage(
      this.courier,
      frame * COURIER_SPRITE_CELL_SIZE,
      0,
      COURIER_SPRITE_CELL_SIZE,
      COURIER_SPRITE_CELL_SIZE,
      x,
      y,
      COURIER_RENDER_SIZE,
      COURIER_RENDER_SIZE
    );
    if (drawable(this.courierBrandMark)) {
      context.drawImage(
        this.courierBrandMark,
        runner.x + runner.width / 2 - 7,
        feetY - 92,
        14,
        9
      );
    }
    return true;
  }

  public drawCourierBrandMark(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    if (!drawable(this.courierBrandMark)) return false;
    context.drawImage(this.courierBrandMark, x, y, width, height);
    return true;
  }
}
