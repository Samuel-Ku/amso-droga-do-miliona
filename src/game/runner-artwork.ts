import type { OrderVisualType, PowerUpKind } from "../shared/types";
import type { ObstacleKind, ObstacleModel, RenderScene, RunnerModel } from "./types";
import { OVERHEAD, PHYSICS } from "./constants";
import { runnerStrideCyclesPerSecond } from "./courier-presentation";

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
export const COURIER_CROUCH_SPRITE_PATH =
  "/assets/milion-runner/courier/courier-crouch-sheet.webp";
export const COURIER_JUMP_SPRITE_PATH =
  "/assets/milion-runner/courier/courier-jump-sheet.webp";
export const OBSTACLE_ASSET_PATHS = {
  "box-stack": "/assets/milion-runner/obstacles/box-stack.webp",
  pallet: "/assets/milion-runner/obstacles/pallet.webp",
  trolley: "/assets/milion-runner/obstacles/trolley.webp",
  overhead: "/assets/milion-runner/obstacles/overhead.webp"
} as const satisfies Readonly<Record<ObstacleKind, string>>;
export const OVERHEAD_VARIANT_ASSET_PATHS = [
  OBSTACLE_ASSET_PATHS.overhead,
  "/assets/milion-runner/obstacles/overhead-door.webp",
  "/assets/milion-runner/obstacles/overhead-conveyor.webp"
] as const;
export const COURIER_SPRITE_FRAME_COUNT = 8;
export const COURIER_CROUCH_SPRITE_FRAME_COUNT = 8;
export const COURIER_JUMP_SPRITE_FRAME_COUNT = 8;

const COURIER_SPRITE_CELL_SIZE = 512;
const COURIER_SOURCE_GROUND_Y = 470;
const COURIER_RENDER_SIZE = 170;
const COURIER_CROUCH_RENDER_SCALE = 0.9;
const COURIER_CROUCH_FPS = 16;
const COURIER_CROUCH_REFERENCE_ANCHOR_X = 250;
const COURIER_CROUCH_FRAME_ANCHOR_X = [250, 310, 310, 310, 310, 310, 310, 310] as const;
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
  scene: Pick<RenderScene, "elapsedSeconds" | "milestoneCelebration" | "speed">
): number {
  if (!runner.grounded) {
    if (runner.velocityY < -40) return 3;
    if (runner.velocityY > 40) return 7;
    return 4;
  }
  const cyclesPerSecond = runnerStrideCyclesPerSecond(scene.speed);
  return Math.floor(scene.elapsedSeconds * cyclesPerSecond) % COURIER_SPRITE_FRAME_COUNT;
}

export function courierCrouchSpriteFrame(runner: Readonly<RunnerModel>): number {
  if (!runner.crouching) return 0;
  return Math.min(
    COURIER_CROUCH_SPRITE_FRAME_COUNT - 1,
    Math.floor(runner.crouchElapsedSeconds * COURIER_CROUCH_FPS)
  );
}

export function courierJumpSpriteFrame(runner: Readonly<RunnerModel>): number {
  const velocity = Number.isFinite(runner.velocityY) ? runner.velocityY : 0;
  const jumpSpeed = Math.abs(PHYSICS.jumpVelocity);
  const progress = Math.max(0, Math.min(1, (velocity + jumpSpeed) / (jumpSpeed * 2)));
  return Math.min(
    COURIER_JUMP_SPRITE_FRAME_COUNT - 1,
    Math.floor(progress * COURIER_JUMP_SPRITE_FRAME_COUNT)
  );
}

export function courierCrouchFrameOffsetX(frame: number): number {
  const anchor = COURIER_CROUCH_FRAME_ANCHOR_X[
    Math.max(0, Math.min(COURIER_CROUCH_SPRITE_FRAME_COUNT - 1, frame))
  ] ?? COURIER_CROUCH_REFERENCE_ANCHOR_X;
  return (COURIER_CROUCH_REFERENCE_ANCHOR_X - anchor) /
    COURIER_SPRITE_CELL_SIZE * COURIER_RENDER_SIZE;
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
  private readonly courierCrouch: HTMLImageElement | null;
  private readonly courierJump: HTMLImageElement | null;
  private readonly obstacles: Readonly<Record<ObstacleKind, HTMLImageElement | null>>;
  private readonly overheadVariants: readonly (HTMLImageElement | null)[];
  private readonly parcelFrames: readonly (HTMLImageElement | null)[];

  public constructor(factory?: ArtworkImageFactory) {
    this.orders = loadImage(ORDER_ATLAS_PATH, factory);
    this.powerUps = loadImage(POWER_UP_ATLAS_PATH, factory);
    this.courier = loadImage(COURIER_SPRITE_PATH, factory);
    this.courierCrouch = loadImage(COURIER_CROUCH_SPRITE_PATH, factory);
    this.courierJump = loadImage(COURIER_JUMP_SPRITE_PATH, factory);
    this.obstacles = {
      "box-stack": loadImage(OBSTACLE_ASSET_PATHS["box-stack"], factory),
      pallet: loadImage(OBSTACLE_ASSET_PATHS.pallet, factory),
      trolley: loadImage(OBSTACLE_ASSET_PATHS.trolley, factory),
      overhead: loadImage(OBSTACLE_ASSET_PATHS.overhead, factory)
    };
    this.overheadVariants = [
      this.obstacles.overhead,
      ...OVERHEAD_VARIANT_ASSET_PATHS.slice(1).map((path) => loadImage(path, factory))
    ];
    this.parcelFrames = PARCEL_CELEBRATION_FRAME_PATHS.map((path) => loadImage(path, factory));
  }

  public hasOverheadArtwork(visualVariant: number): boolean {
    const image = this.overheadVariants[
      Math.abs(Math.floor(visualVariant)) % this.overheadVariants.length
    ] ?? this.obstacles.overhead;
    return drawable(image);
  }

  public drawObstacle(
    context: CanvasRenderingContext2D,
    obstacle: Readonly<ObstacleModel>
  ): boolean {
    if (!obstacle.active) return true;
    const image = obstacle.kind === "overhead"
      ? this.overheadVariants[
        Math.abs(Math.floor(obstacle.visualVariant ?? 0)) % this.overheadVariants.length
      ] ?? this.obstacles.overhead
      : this.obstacles[obstacle.kind];
    if (!drawable(image)) return false;

    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    if (obstacle.kind === "overhead") {
      // Only the scanner housing needs to occupy the crouch line. Continue
      // its suspension rails to the ceiling so the obstacle never floats.
      const drawWidth = obstacle.width + 18;
      const drawHeight = drawWidth * image.naturalHeight / image.naturalWidth;
      const drawX = obstacle.x - (drawWidth - obstacle.width) / 2;
      const drawY = obstacle.y + obstacle.height - drawHeight - OVERHEAD.visualLift;
      const railInset = drawWidth * 0.095;
      context.strokeStyle = "#2d343b";
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(drawX + railInset, 0);
      context.lineTo(drawX + railInset, drawY + drawHeight * 0.28);
      context.moveTo(drawX + drawWidth - railInset, 0);
      context.lineTo(drawX + drawWidth - railInset, drawY + drawHeight * 0.28);
      context.stroke();
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      context.restore();
      return true;
    }

    const scale = Math.min(
      obstacle.width / image.naturalWidth,
      obstacle.height / image.naturalHeight
    );
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const drawX = obstacle.x + (obstacle.width - drawWidth) / 2;
    const drawY = obstacle.y + obstacle.height - drawHeight;
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    context.restore();
    return true;
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
    const useCrouchArtwork = runner.crouching && drawable(this.courierCrouch);
    const useJumpArtwork = !runner.grounded && drawable(this.courierJump);
    const artwork = useCrouchArtwork
      ? this.courierCrouch
      : useJumpArtwork
        ? this.courierJump
        : this.courier;
    if (!drawable(artwork)) return false;
    const frame = useCrouchArtwork
      ? scene.reducedMotion
        ? COURIER_CROUCH_SPRITE_FRAME_COUNT - 1
        : courierCrouchSpriteFrame(runner)
      : useJumpArtwork
        ? courierJumpSpriteFrame(runner)
        : scene.reducedMotion
          ? 0
          : courierSpriteFrame(runner, scene);
    const courierRenderSize = useCrouchArtwork
      ? COURIER_RENDER_SIZE * COURIER_CROUCH_RENDER_SCALE
      : COURIER_RENDER_SIZE;
    const feetY = runner.y + runner.height + 4;
    const x = runner.x + runner.width / 2 - courierRenderSize / 2 +
      (useCrouchArtwork ? courierCrouchFrameOffsetX(frame) : 0);
    const y = feetY - COURIER_SOURCE_GROUND_Y / COURIER_SPRITE_CELL_SIZE *
      courierRenderSize;
    context.drawImage(
      artwork,
      frame * COURIER_SPRITE_CELL_SIZE,
      0,
      COURIER_SPRITE_CELL_SIZE,
      COURIER_SPRITE_CELL_SIZE,
      x,
      y,
      courierRenderSize,
      courierRenderSize
    );
    return true;
  }
}
