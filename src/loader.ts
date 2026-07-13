import { DataLayerTracker } from "./analytics/data-layer";
import {
  DEFAULT_RUNNER_MODULE_PATH,
  DEFAULT_RUNNER_STYLE_PATH,
  DEFAULT_RUNNER_TRIGGER_SELECTOR,
  RUNNER_CONFIG_TTL_MS
} from "./config/defaults";
import { parseRunnerConfig } from "./config/schema";
import type { RunnerConfig, RunnerOpenOptions, RunnerPublicApi } from "./shared/types";

const DEFAULT_CONFIG_PATH = "/assets/milion-runner/runner-config.json";
const MAX_CONFIG_BYTES = 32_768;
const CONFIG_TIMEOUT_MS = 5_000;
const ASSET_TIMEOUT_MS = 10_000;

type BrowserWindow = Window & typeof globalThis;

export type RunnerLoaderErrorCode =
  | "config_path_invalid"
  | "config_fetch_failed"
  | "config_response_invalid"
  | "config_too_large"
  | "config_json_invalid"
  | "config_validation_failed"
  | "style_load_failed"
  | "module_load_failed"
  | "runtime_contract_invalid"
  | "runtime_bootstrap_failed";

export interface ProductionLoaderController {
  destroy(): void;
}

export interface ProductionLoaderOptions {
  script?: HTMLScriptElement | null;
  configPath?: string;
  document?: Document;
  window?: BrowserWindow;
  fetch?: typeof fetch;
  now?: () => number;
}

interface RuntimeModule {
  bootstrapRunner?: (
    config: RunnerConfig,
    trigger?: HTMLElement
  ) => RunnerPublicApi | Promise<RunnerPublicApi>;
  init?: (config: RunnerConfig) => void | Promise<void>;
  open?: (options: RunnerOpenOptions) => void;
  close?: (reason?: string) => void;
  destroy?: () => void;
  default?: unknown;
}

class RunnerLoaderError extends Error {
  public readonly code: RunnerLoaderErrorCode;

  public constructor(code: RunnerLoaderErrorCode) {
    super(code);
    this.name = "RunnerLoaderError";
    this.code = code;
  }
}

function loaderErrorCode(error: unknown): RunnerLoaderErrorCode {
  return error instanceof RunnerLoaderError ? error.code : "runtime_bootstrap_failed";
}

function safeOriginUrl(path: string, baseHref: string): URL | null {
  if (
    path.length === 0 ||
    path.length > 512 ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(path)
  ) {
    return null;
  }

  try {
    const base = new URL(baseHref);
    const url = new URL(path, base);
    if (
      url.origin !== base.origin ||
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username !== "" ||
      url.password !== "" ||
      url.hash !== ""
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function safeSameOriginHref(value: string, baseHref: string): URL | null {
  if (value.length === 0 || value.length > 1_024 || /[\u0000-\u001f\u007f]/u.test(value)) {
    return null;
  }

  try {
    const base = new URL(baseHref);
    const url = new URL(value, base);
    if (
      url.origin !== base.origin ||
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username !== "" ||
      url.password !== ""
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

async function withTimeout<Value>(
  promise: Promise<Value>,
  timeoutMs: number,
  windowReference: BrowserWindow,
  code: RunnerLoaderErrorCode
): Promise<Value> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = windowReference.setTimeout(() => reject(new RunnerLoaderError(code)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      windowReference.clearTimeout(timeoutId);
    }
  }
}

export async function fetchRunnerConfig(
  configUrl: URL,
  fetchImplementation: typeof fetch,
  now: Date = new Date()
): Promise<RunnerConfig> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), CONFIG_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetchImplementation(configUrl, {
      method: "GET",
      cache: "no-cache",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
  } catch {
    throw new RunnerLoaderError("config_fetch_failed");
  } finally {
    globalThis.clearTimeout(timeoutId);
  }

  if (!response.ok || response.type === "opaqueredirect") {
    throw new RunnerLoaderError("config_response_invalid");
  }

  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_CONFIG_BYTES) {
    throw new RunnerLoaderError("config_too_large");
  }

  const body = await response.text();
  if (body.length > MAX_CONFIG_BYTES) {
    throw new RunnerLoaderError("config_too_large");
  }

  let rawConfig: unknown;
  try {
    rawConfig = JSON.parse(body) as unknown;
  } catch {
    throw new RunnerLoaderError("config_json_invalid");
  }

  const config = parseRunnerConfig(rawConfig, { now });
  if (config === null) {
    throw new RunnerLoaderError("config_validation_failed");
  }

  return config;
}

export class RunnerConfigStore {
  private cached: { config: RunnerConfig; fetchedAt: number } | undefined;
  private inFlight: Promise<RunnerConfig> | undefined;

  public constructor(
    private readonly configUrl: URL,
    private readonly fetchImplementation: typeof fetch,
    private readonly now: () => number = Date.now,
    private readonly ttlMs: number = RUNNER_CONFIG_TTL_MS
  ) {}

  public peek(): RunnerConfig | null {
    return this.cached?.config ?? null;
  }

  public async get(): Promise<RunnerConfig> {
    const timestamp = this.now();
    const cacheAge = this.cached === undefined ? Number.POSITIVE_INFINITY : timestamp - this.cached.fetchedAt;
    if (this.cached !== undefined && cacheAge >= 0 && cacheAge <= this.ttlMs) {
      return this.cached.config;
    }

    if (this.inFlight !== undefined) {
      return this.inFlight;
    }

    this.inFlight = fetchRunnerConfig(
      this.configUrl,
      this.fetchImplementation,
      new Date(timestamp)
    ).then((config) => {
      this.cached = { config, fetchedAt: this.now() };
      return config;
    });

    try {
      return await this.inFlight;
    } finally {
      this.inFlight = undefined;
    }
  }
}

function isRunnerPublicApi(value: unknown): value is RunnerPublicApi {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RunnerPublicApi>;
  return (
    typeof candidate.open === "function" &&
    typeof candidate.close === "function" &&
    typeof candidate.destroy === "function"
  );
}

function importRuntime(moduleUrl: URL, windowReference: BrowserWindow): Promise<RuntimeModule> {
  const runtimeImport = (import(/* @vite-ignore */ moduleUrl.href) as Promise<RuntimeModule>).catch(
    () => {
      throw new RunnerLoaderError("module_load_failed");
    }
  );
  return withTimeout(runtimeImport, ASSET_TIMEOUT_MS, windowReference, "module_load_failed");
}

function loadStyle(
  styleUrl: URL,
  documentReference: Document,
  windowReference: BrowserWindow
): Promise<void> {
  const existing = Array.from(documentReference.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
    .find((link) => link.href === styleUrl.href);

  if (existing?.sheet !== null && existing?.sheet !== undefined) {
    return Promise.resolve();
  }

  const link = existing ?? documentReference.createElement("link");
  const created = existing === undefined;
  return new Promise<void>((resolve, reject) => {
    let timeoutId: number | undefined;
    const cleanup = (): void => {
      link.removeEventListener("load", onLoad);
      link.removeEventListener("error", onError);
      if (timeoutId !== undefined) {
        windowReference.clearTimeout(timeoutId);
      }
    };
    const onLoad = (): void => {
      cleanup();
      resolve();
    };
    const onError = (): void => {
      cleanup();
      if (created) {
        link.remove();
      }
      reject(new RunnerLoaderError("style_load_failed"));
    };

    link.addEventListener("load", onLoad, { once: true });
    link.addEventListener("error", onError, { once: true });
    timeoutId = windowReference.setTimeout(onError, ASSET_TIMEOUT_MS);

    if (created) {
      link.rel = "stylesheet";
      link.href = styleUrl.href;
      link.dataset.amsoMillionRunnerStyle = "";
      documentReference.head.append(link);
    }
  });
}

interface LoadingShell {
  remove(): void;
}

function createLoadingShell(
  documentReference: Document,
  trigger: HTMLElement,
  onCancel: () => void
): LoadingShell {
  const root = documentReference.createElement("div");
  root.className = "amso-runner-loading-shell";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Ładowanie gry Droga do Miliona");
  root.style.cssText =
    "position:fixed;inset:0;z-index:2147482001;display:grid;place-items:center;padding:24px;" +
    "background:#061426;color:#fff;font-family:system-ui,sans-serif;text-align:center";

  const card = documentReference.createElement("div");
  card.className = "amso-runner-loading-shell__card";
  card.style.cssText =
    "display:grid;gap:14px;min-width:min(340px,90vw);padding:30px;border:1px solid #ffffff26;" +
    "border-radius:20px;background:#0b2038;box-shadow:0 22px 70px #0008";

  const brand = documentReference.createElement("strong");
  brand.className = "amso-runner-loading-shell__brand";
  brand.textContent = "AMSO";
  brand.style.cssText = "color:#ff6b00;font-size:28px;letter-spacing:-1px";

  const status = documentReference.createElement("p");
  status.className = "amso-runner-loading-shell__status";
  status.setAttribute("role", "status");
  status.textContent = "Przygotowujemy trasę…";
  status.style.cssText = "margin:0;font-weight:750";

  const cancel = documentReference.createElement("button");
  cancel.className = "amso-runner-loading-shell__cancel";
  cancel.type = "button";
  cancel.textContent = "Anuluj";
  cancel.style.cssText =
    "min-height:44px;padding:0 18px;border:1px solid #ffffff4d;border-radius:10px;" +
    "background:transparent;color:#fff;font:inherit;font-weight:750;cursor:pointer";

  const handleCancel = (): void => {
    onCancel();
    root.remove();
    trigger.focus({ preventScroll: true });
  };
  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    }
  };

  cancel.addEventListener("click", handleCancel);
  root.addEventListener("keydown", handleKeydown);
  card.append(brand, status, cancel);
  root.append(card);
  (documentReference.body ?? documentReference.documentElement).append(root);
  cancel.focus({ preventScroll: true });

  return {
    remove(): void {
      cancel.removeEventListener("click", handleCancel);
      root.removeEventListener("keydown", handleKeydown);
      root.remove();
    }
  };
}

async function initializeRuntime(
  runtimeModule: RuntimeModule,
  config: RunnerConfig,
  trigger: HTMLElement,
  windowReference: BrowserWindow
): Promise<RunnerPublicApi> {
  if (typeof runtimeModule.bootstrapRunner === "function") {
    const api = await runtimeModule.bootstrapRunner(config, trigger);
    if (isRunnerPublicApi(api)) {
      return api;
    }
    throw new RunnerLoaderError("runtime_contract_invalid");
  }

  const defaultExport = runtimeModule.default;
  const initCandidate =
    typeof runtimeModule.init === "function"
      ? runtimeModule.init
      : defaultExport !== null &&
          typeof defaultExport === "object" &&
          "init" in defaultExport &&
          typeof defaultExport.init === "function"
        ? defaultExport.init.bind(defaultExport)
        : null;

  if (initCandidate !== null) {
    await initCandidate(config);
  }

  const candidate = isRunnerPublicApi(defaultExport)
    ? defaultExport
    : isRunnerPublicApi(runtimeModule)
      ? runtimeModule
      : isRunnerPublicApi(windowReference.AMSOMillionRunner)
        ? windowReference.AMSOMillionRunner
        : null;

  if (candidate === null) {
    throw new RunnerLoaderError("runtime_contract_invalid");
  }

  return candidate;
}

function triggerSource(trigger: HTMLElement): string {
  return trigger.dataset.runnerSource ?? "unknown";
}

function shouldHandleClick(event: MouseEvent): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function fallbackPath(
  trigger: HTMLElement,
  config: RunnerConfig,
  windowReference: BrowserWindow
): string {
  if (trigger instanceof windowReference.HTMLAnchorElement) {
    const href = trigger.getAttribute("href");
    if (href !== null) {
      const resolved = safeSameOriginHref(href, windowReference.location.href);
      if (resolved !== null) {
        return resolved.href;
      }
    }
  }

  return new URL(config.cta.path, windowReference.location.href).href;
}

function navigateToFallback(
  trigger: HTMLElement,
  config: RunnerConfig,
  windowReference: BrowserWindow
): void {
  windowReference.location.assign(fallbackPath(trigger, config, windowReference));
}

function observeTriggerVisibility(
  triggers: readonly HTMLElement[],
  config: RunnerConfig,
  windowReference: BrowserWindow,
  documentReference: Document
): () => void {
  if (typeof windowReference.IntersectionObserver !== "function") {
    return () => undefined;
  }

  const viewed = new WeakSet<HTMLElement>();
  const visible = new WeakSet<HTMLElement>();
  const timers = new Map<HTMLElement, number>();
  const tracker = new DataLayerTracker({ gameVersion: config.gameVersion, target: windowReference });
  let observer: IntersectionObserver;

  const cancelTimer = (trigger: HTMLElement): void => {
    const timer = timers.get(trigger);
    if (timer !== undefined) {
      windowReference.clearTimeout(timer);
      timers.delete(trigger);
    }
  };

  const scheduleViewed = (trigger: HTMLElement): void => {
    if (
      viewed.has(trigger) ||
      timers.has(trigger) ||
      !visible.has(trigger) ||
      documentReference.visibilityState === "hidden"
    ) {
      return;
    }

    const timer = windowReference.setTimeout(() => {
      timers.delete(trigger);
      if (
        !viewed.has(trigger) &&
        visible.has(trigger) &&
        documentReference.visibilityState !== "hidden"
      ) {
        viewed.add(trigger);
        observer.unobserve(trigger);
        tracker.triggerViewed(triggerSource(trigger));
      }
    }, 1_000);
    timers.set(trigger, timer);
  };

  observer = new windowReference.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!(entry.target instanceof windowReference.HTMLElement)) {
          continue;
        }

        const trigger = entry.target;
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        if (!isVisible) {
          visible.delete(trigger);
          cancelTimer(trigger);
          continue;
        }

        visible.add(trigger);
        scheduleViewed(trigger);
      }
    },
    { threshold: [0, 0.5] }
  );

  for (const trigger of triggers) {
    observer.observe(trigger);
  }

  const handleVisibilityChange = (): void => {
    if (documentReference.visibilityState === "hidden") {
      for (const trigger of triggers) {
        cancelTimer(trigger);
      }
      return;
    }

    for (const trigger of triggers) {
      scheduleViewed(trigger);
    }
  };
  documentReference.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    observer.disconnect();
    documentReference.removeEventListener("visibilitychange", handleVisibilityChange);
    for (const timer of timers.values()) {
      windowReference.clearTimeout(timer);
    }
    timers.clear();
  };
}

export async function startProductionLoader(
  options: ProductionLoaderOptions = {}
): Promise<ProductionLoaderController | null> {
  const documentReference = options.document ?? (typeof document === "undefined" ? undefined : document);
  const windowReference = options.window ?? (typeof window === "undefined" ? undefined : window);
  const fetchImplementation = options.fetch ?? (typeof fetch === "undefined" ? undefined : fetch);

  if (documentReference === undefined || windowReference === undefined || fetchImplementation === undefined) {
    return null;
  }

  const script = options.script ??
    (typeof windowReference.HTMLScriptElement === "function" &&
    documentReference.currentScript instanceof windowReference.HTMLScriptElement
      ? documentReference.currentScript
      : documentReference.querySelector<HTMLScriptElement>("script[data-runner-config]"));
  const requestedConfigPath = options.configPath ?? script?.dataset.runnerConfig ?? DEFAULT_CONFIG_PATH;
  const configUrl = safeOriginUrl(requestedConfigPath, windowReference.location.href);
  if (configUrl === null) {
    return null;
  }

  const store = new RunnerConfigStore(configUrl, fetchImplementation, options.now);
  let initialConfig: RunnerConfig;
  try {
    initialConfig = await store.get();
  } catch {
    return null;
  }

  if (!initialConfig.enabled) {
    return null;
  }

  const selector = initialConfig.triggerSelector ?? DEFAULT_RUNNER_TRIGGER_SELECTOR;
  const triggers = Array.from(documentReference.querySelectorAll<HTMLElement>(selector));
  if (triggers.length === 0) {
    return null;
  }

  let runtimeKey = "";
  let runtimePromise: Promise<RunnerPublicApi> | null = null;
  let runtimeApi: RunnerPublicApi | null = null;
  let activationPending = false;
  let destroyed = false;
  let generation = 0;
  let activeLoadingShell: LoadingShell | null = null;

  const getRuntime = (
    config: RunnerConfig,
    trigger: HTMLElement,
    activationGeneration: number
  ): Promise<RunnerPublicApi> => {
    if (destroyed || activationGeneration !== generation) {
      return Promise.reject(new RunnerLoaderError("runtime_bootstrap_failed"));
    }

    const modulePath = config.modulePath ?? DEFAULT_RUNNER_MODULE_PATH;
    const stylePath = config.stylePath ?? DEFAULT_RUNNER_STYLE_PATH;
    const moduleUrl = safeOriginUrl(modulePath, windowReference.location.href);
    const styleUrl = safeOriginUrl(stylePath, windowReference.location.href);
    if (moduleUrl === null || styleUrl === null) {
      return Promise.reject(new RunnerLoaderError("runtime_contract_invalid"));
    }

    const nextKey = JSON.stringify({
      module: moduleUrl.href,
      style: styleUrl.href,
      version: config.gameVersion,
      claim: config.claim,
      cta: config.cta,
      facts: config.facts
    });
    if (runtimePromise !== null && runtimeKey === nextKey) {
      return runtimePromise;
    }

    if (runtimeApi !== null && runtimeKey !== nextKey) {
      runtimeApi.destroy();
      runtimeApi = null;
    }

    runtimeKey = nextKey;
    runtimePromise = Promise.all([
      loadStyle(styleUrl, documentReference, windowReference),
      importRuntime(moduleUrl, windowReference)
    ])
      .then(([, runtimeModule]) => {
        if (destroyed || activationGeneration !== generation) {
          throw new RunnerLoaderError("runtime_bootstrap_failed");
        }
        return initializeRuntime(runtimeModule, config, trigger, windowReference);
      })
      .then((api) => {
        if (destroyed || activationGeneration !== generation) {
          api.destroy();
          throw new RunnerLoaderError("runtime_bootstrap_failed");
        }
        runtimeApi = api;
        return api;
      })
      .catch((error: unknown) => {
        runtimePromise = null;
        throw error;
      });

    return runtimePromise;
  };

  const listenerEntries: Array<{ trigger: HTMLElement; listener: (event: MouseEvent) => void }> = [];
  for (const trigger of triggers) {
    const listener = (event: MouseEvent): void => {
      if (destroyed || !shouldHandleClick(event)) {
        return;
      }

      event.preventDefault();
      if (activationPending) {
        return;
      }

      activationPending = true;
      const activationGeneration = generation;
      const sourceLocation = triggerSource(trigger);
      const requestedAt = windowReference.performance.now();
      const cachedConfig = store.peek() ?? initialConfig;
      const tracker = new DataLayerTracker({
        gameVersion: cachedConfig.gameVersion,
        sourceLocation,
        target: windowReference
      });
      tracker.openRequested(sourceLocation);
      let cancelled = false;
      const loadingShell = createLoadingShell(documentReference, trigger, () => {
        cancelled = true;
      });
      activeLoadingShell = loadingShell;
      tracker.track("game_opened", {}, { sourceLocation });

      void (async () => {
        let config = cachedConfig;

        try {
          config = await store.get();
          if (destroyed || cancelled || activationGeneration !== generation) {
            return;
          }

          if (!config.enabled) {
            navigateToFallback(trigger, config, windowReference);
            return;
          }

          const api = await getRuntime(config, trigger, activationGeneration);
          if (destroyed || cancelled || activationGeneration !== generation) {
            api.destroy();
            return;
          }
          loadingShell.remove();
          api.open({
            sourceLocation,
            returnFocusTo: trigger,
            requestedAt,
            openedTracked: true
          });
        } catch (error: unknown) {
          if (destroyed || cancelled || activationGeneration !== generation) {
            return;
          }
          tracker.loadFailed(loaderErrorCode(error), sourceLocation);
          navigateToFallback(trigger, config, windowReference);
        } finally {
          loadingShell.remove();
          if (activeLoadingShell === loadingShell) {
            activeLoadingShell = null;
          }
          if (!destroyed && activationGeneration === generation) {
            activationPending = false;
          }
        }
      })();
    };

    trigger.addEventListener("click", listener);
    listenerEntries.push({ trigger, listener });
  }

  const stopVisibilityObserver = observeTriggerVisibility(
    triggers,
    initialConfig,
    windowReference,
    documentReference
  );

  return {
    destroy(): void {
      if (destroyed) {
        return;
      }
      destroyed = true;
      generation += 1;
      activationPending = false;
      activeLoadingShell?.remove();
      activeLoadingShell = null;
      stopVisibilityObserver();
      for (const { trigger, listener } of listenerEntries) {
        trigger.removeEventListener("click", listener);
      }
      runtimeApi?.destroy();
      runtimeApi = null;
      runtimePromise = null;
    }
  };
}

const autoDocument = typeof document === "undefined" ? null : document;
const autoScript =
  autoDocument !== null &&
  typeof HTMLScriptElement !== "undefined" &&
  autoDocument.currentScript instanceof HTMLScriptElement
    ? autoDocument.currentScript
    : null;

if (autoDocument !== null) {
  const start = (): void => {
    void startProductionLoader({ script: autoScript }).catch(() => undefined);
  };

  if (autoDocument.readyState === "loading") {
    autoDocument.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
