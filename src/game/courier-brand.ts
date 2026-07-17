export const COURIER_PALETTE = {
  capAndShirt: "#ff7a15",
  belt: "#f47100",
  trousers: "#171717",
  shoesAndMark: "#ffffff",
  scanner: "#44413d",
  scannerScreen: "#27b936"
} as const;

export interface CourierMarkBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Draws the approved AMSO A as vector geometry. Keeping the mark in the same
 * canvas plane as the courier avoids a second raster decode and jagged edges
 * when the character is scaled on high-DPR screens.
 */
export class CourierBrandArtwork {
  public drawMark(context: CanvasRenderingContext2D, bounds: CourierMarkBounds): void {
    const { x, y, width, height } = bounds;
    context.save();
    context.translate(x, y);
    context.scale(width, height);
    context.fillStyle = COURIER_PALETTE.shoesAndMark;
    context.lineJoin = "round";

    context.beginPath();
    context.moveTo(0.02, 0.96);
    context.lineTo(0.39, 0.05);
    context.quadraticCurveTo(0.44, -0.02, 0.5, 0.05);
    context.lineTo(0.94, 0.96);
    context.lineTo(0.69, 0.96);
    context.lineTo(0.47, 0.42);
    context.lineTo(0.26, 0.96);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(0.3, 0.67);
    context.lineTo(0.68, 0.67);
    context.lineTo(0.75, 0.82);
    context.lineTo(0.24, 0.82);
    context.closePath();
    context.fill();
    context.restore();
  }
}

export const DEFAULT_COURIER_BRAND_ARTWORK = new CourierBrandArtwork();
