export interface DecodedImageAsset {
  readonly assetId: string;
  readonly source: string;
  readonly version: string;
  readonly image: HTMLImageElement;
}

export interface DecodedImageStoreOptions {
  readonly imageFactory?: () => HTMLImageElement;
  readonly maxAttempts?: number;
}

function defaultImageFactory(): HTMLImageElement { return new Image(); }

/** Session-level owner of the canonical image load/decode lifecycle. */
export class DecodedImageStore {
  private readonly pending = new Map<string, Promise<DecodedImageAsset>>();
  private readonly decoded = new Map<string, DecodedImageAsset>();
  private readonly imageFactory: () => HTMLImageElement;
  private readonly maxAttempts: number;
  private destroyed = false;

  public constructor(options: DecodedImageStoreOptions = {}) {
    this.imageFactory = options.imageFactory ?? defaultImageFactory;
    this.maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? 3));
  }

  public load(assetId: string, source: string, version = "1"): Promise<DecodedImageAsset> {
    if (this.destroyed) return Promise.reject(new Error("decoded_image_store_destroyed"));
    const key = `${assetId}\u0000${source}\u0000${version}`;
    const ready = this.decoded.get(key);
    if (ready) return Promise.resolve(ready);
    const existing = this.pending.get(key);
    if (existing) return existing;
    const promise = this.loadWithRetry(assetId, source, version).then((asset) => {
      if (!this.destroyed) this.decoded.set(key, asset);
      this.pending.delete(key);
      return asset;
    }, (error: unknown) => {
      this.pending.delete(key);
      throw error;
    });
    this.pending.set(key, promise);
    return promise;
  }

  public getDecoded(assetId: string, source: string, version = "1"): DecodedImageAsset | undefined {
    return this.decoded.get(`${assetId}\u0000${source}\u0000${version}`);
  }

  public destroy(): void {
    this.destroyed = true;
    for (const asset of this.decoded.values()) {
      asset.image.onload = null;
      asset.image.onerror = null;
    }
    this.pending.clear();
    this.decoded.clear();
  }

  private async loadWithRetry(assetId: string, source: string, version: string): Promise<DecodedImageAsset> {
    let lastError: unknown = new Error("image_decode_failed");
    const image = this.imageFactory();
    image.decoding = "async";
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      image.src = source;
      try {
        await image.decode();
        if (image.naturalWidth <= 0 && image.complete) throw new Error("image_has_no_pixels");
        return { assetId, source, version, image };
      } catch (error: unknown) {
        lastError = error;
        if (attempt < this.maxAttempts) await new Promise<void>((resolve) => setTimeout(resolve, attempt * 25));
      }
    }
    throw lastError;
  }
}
