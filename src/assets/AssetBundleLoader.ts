import type {
  AssetBundleConfig,
  AssetBundleId,
  AssetResourceConfig
} from "../shared/types";

export interface AssetLoadProgress {
  readyCritical: number;
  totalCritical: number;
}

export interface OptionalAssetFailure {
  bundleId: AssetBundleId;
  resourceId: string;
}

export interface AssetBundleLoadResult {
  readyBundles: AssetBundleId[];
  failedOptional: OptionalAssetFailure[];
}

export interface AssetBundleLoaderOptions {
  loadResource?: (resource: AssetResourceConfig) => Promise<void>;
}

interface BundleResult {
  failedOptional: OptionalAssetFailure[];
}

const SAFE_ERROR_MESSAGE = "A critical campaign asset is unavailable.";

/** Error intentionally contains no resource URL or upstream failure text. */
export class AssetBundleLoadError extends Error {
  public readonly code = "critical_asset_failed" as const;

  public constructor(public readonly bundleId: AssetBundleId) {
    super(SAFE_ERROR_MESSAGE);
    this.name = "AssetBundleLoadError";
  }
}

function resourceKey(resource: AssetResourceConfig): string {
  return `${resource.type}:${resource.source}`;
}

async function fetchAsset(source: string): Promise<void> {
  if (typeof fetch !== "function") throw new Error("Asset fetch is unavailable.");
  const response = await fetch(source, {
    cache: "force-cache",
    credentials: "same-origin"
  });
  if (!response.ok) throw new Error("Asset request failed.");
  await response.blob();
}

/**
 * Production transport. Procedural resources are already part of the JS bundle;
 * image/audio entries opt into a same-origin byte preload and browser cache.
 */
export async function loadCampaignAsset(resource: AssetResourceConfig): Promise<void> {
  if (resource.type === "procedural") return;
  await fetchAsset(resource.source);
}

/**
 * Per-epoch readiness coordinator with promise deduplication and retryable
 * failures. It reports counts of critical resources, never a timer-based value.
 */
export class AssetBundleLoader {
  private readonly bundles = new Map<AssetBundleId, AssetBundleConfig>();
  private readonly loadResource: (resource: AssetResourceConfig) => Promise<void>;
  private readonly bundlePromises = new Map<AssetBundleId, Promise<BundleResult>>();
  private readonly bundleResults = new Map<AssetBundleId, BundleResult>();
  private readonly resourcePromises = new Map<string, Promise<void>>();
  private readonly readyResources = new Set<string>();

  public constructor(
    bundles: readonly AssetBundleConfig[],
    options: AssetBundleLoaderOptions = {}
  ) {
    for (const bundle of bundles) this.bundles.set(bundle.id, bundle);
    this.loadResource = options.loadResource ?? loadCampaignAsset;
  }

  public isBundleReady(bundleId: AssetBundleId): boolean {
    return this.bundleResults.has(bundleId);
  }

  public async ensureBundles(
    bundleIds: readonly AssetBundleId[],
    onProgress?: (progress: AssetLoadProgress) => void
  ): Promise<AssetBundleLoadResult> {
    const selected = [...new Set(bundleIds)].map((bundleId) => {
      const bundle = this.bundles.get(bundleId);
      if (bundle === undefined) throw new AssetBundleLoadError(bundleId);
      return bundle;
    });
    const criticalKeys = new Set(
      selected.flatMap(({ resources }) => resources
        .filter(({ critical }) => critical)
        .map(resourceKey))
    );
    const observedReady = new Set(
      [...criticalKeys].filter((key) => this.readyResources.has(key))
    );
    const report = (): void => {
      onProgress?.({
        readyCritical: observedReady.size,
        totalCritical: criticalKeys.size
      });
    };
    report();

    const results = await Promise.all(selected.map((bundle) =>
      this.ensureBundle(bundle, (resource) => {
        const key = resourceKey(resource);
        if (criticalKeys.has(key) && !observedReady.has(key)) {
          observedReady.add(key);
          report();
        }
      })
    ));
    for (const key of criticalKeys) observedReady.add(key);
    report();

    return {
      readyBundles: selected.map(({ id }) => id),
      failedOptional: results.flatMap(({ failedOptional }) => failedOptional)
    };
  }

  /** Starts background warming; callers decide when a critical warm failure becomes blocking. */
  public warmBundles(bundleIds: readonly AssetBundleId[]): Promise<AssetBundleLoadResult> {
    return this.ensureBundles(bundleIds);
  }

  private ensureBundle(
    bundle: AssetBundleConfig,
    onCriticalReady: (resource: AssetResourceConfig) => void
  ): Promise<BundleResult> {
    const ready = this.bundleResults.get(bundle.id);
    if (ready !== undefined) {
      for (const resource of bundle.resources) {
        if (resource.critical) onCriticalReady(resource);
      }
      return Promise.resolve(ready);
    }
    const pending = this.bundlePromises.get(bundle.id);
    if (pending !== undefined) {
      return pending.then((result) => {
        for (const resource of bundle.resources) {
          if (resource.critical) onCriticalReady(resource);
        }
        return result;
      });
    }

    const promise = Promise.all(bundle.resources.map(async (resource) => {
      try {
        await this.loadOnce(resource);
        if (resource.critical) onCriticalReady(resource);
        return null;
      } catch {
        if (resource.critical) throw new AssetBundleLoadError(bundle.id);
        return { bundleId: bundle.id, resourceId: resource.id };
      }
    })).then((failures): BundleResult => {
      const result = {
        failedOptional: failures.filter(
          (failure): failure is OptionalAssetFailure => failure !== null
        )
      };
      this.bundleResults.set(bundle.id, result);
      return result;
    }).catch((error: unknown) => {
      this.bundlePromises.delete(bundle.id);
      throw error;
    });
    this.bundlePromises.set(bundle.id, promise);
    return promise;
  }

  private loadOnce(resource: AssetResourceConfig): Promise<void> {
    const key = resourceKey(resource);
    if (this.readyResources.has(key)) return Promise.resolve();
    const pending = this.resourcePromises.get(key);
    if (pending !== undefined) return pending;

    const promise = Promise.resolve()
      .then(() => this.loadResource(resource))
      .then(() => {
        this.readyResources.add(key);
      })
      .catch((error: unknown) => {
        this.resourcePromises.delete(key);
        throw error;
      });
    this.resourcePromises.set(key, promise);
    return promise;
  }
}
