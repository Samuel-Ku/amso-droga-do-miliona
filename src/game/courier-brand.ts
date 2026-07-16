export const COURIER_MARK_ASSET_PATH = "/assets/milion-runner/courier-amso-a.webp";

export const COURIER_PALETTE = {
  capAndShirt: "#ff7a15",
  belt: "#3f8fce",
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

type CourierImageFactory = () => HTMLImageElement | null;

function createCourierImage(): HTMLImageElement | null {
  if (typeof Image !== "function") return null;
  return new Image();
}

/** Loads and places the supplied AMSO mark while preserving its source ratio. */
export class CourierBrandArtwork {
  private readonly image: HTMLImageElement | null;

  public constructor(imageFactory: CourierImageFactory = createCourierImage) {
    this.image = imageFactory();
    if (this.image !== null) this.image.src = COURIER_MARK_ASSET_PATH;
  }

  public drawMark(
    context: CanvasRenderingContext2D,
    bounds: CourierMarkBounds
  ): void {
    const image = this.image;
    if (image === null || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      return;
    }
    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const boundsRatio = bounds.width / bounds.height;
    const width = boundsRatio > sourceRatio ? bounds.height * sourceRatio : bounds.width;
    const height = boundsRatio > sourceRatio ? bounds.height : bounds.width / sourceRatio;
    const x = bounds.x + (bounds.width - width) / 2;
    const y = bounds.y + (bounds.height - height) / 2;
    context.drawImage(image, x, y, width, height);
  }
}

export const DEFAULT_COURIER_BRAND_ARTWORK = new CourierBrandArtwork();
