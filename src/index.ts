import "./styles/runner.css";
import { parseRunnerConfig } from "./config/schema";
import { RunnerController } from "./RunnerController";
import type {
  RunnerConfig,
  RunnerOpenOptions,
  RunnerPublicApi,
  RunnerSource
} from "./shared/types";

let singleton: RunnerController | null = null;
let singletonApi: RunnerPublicApi | null = null;
let installedApi: RunnerPublicApi | null = null;

function disposeActiveRunner(): void {
  if (installedApi !== null) {
    const api = installedApi;
    installedApi = null;
    api.destroy();
    return;
  }

  if (singletonApi !== null) {
    const api = singletonApi;
    singletonApi = null;
    api.destroy();
    return;
  }

  singleton?.destroy();
  singleton = null;
  delete window.AMSOMillionRunner;
}

function requireEnabledConfig(value: RunnerConfig): RunnerConfig {
  const config = parseRunnerConfig(value);
  if (config === null || !config.enabled) {
    throw new Error("runner_config_disabled_or_invalid");
  }
  return config;
}

export function bootstrapRunner(
  configValue: RunnerConfig,
  _trigger?: HTMLElement
): RunnerPublicApi {
  const config = requireEnabledConfig(configValue);
  disposeActiveRunner();
  const controller = new RunnerController(config);
  singleton = controller;

  const api: RunnerPublicApi = {
    open: (options) => controller.open(options),
    close: (reason) => controller.close(reason),
    destroy: () => {
      controller.destroy();
      if (singleton === controller) {
        singleton = null;
      }
      if (singletonApi === api) {
        singletonApi = null;
      }
      if (window.AMSOMillionRunner === api) {
        delete window.AMSOMillionRunner;
      }
    }
  };

  singletonApi = api;
  window.AMSOMillionRunner = api;
  return api;
}

export function init(configValue: RunnerConfig): RunnerPublicApi {
  return bootstrapRunner(configValue);
}

export function open(options: RunnerOpenOptions): void {
  singleton?.open(options);
}

export function close(reason?: string): void {
  singleton?.close(reason);
}

export function destroy(): void {
  disposeActiveRunner();
}

export function installRunner(
  configValue: RunnerConfig,
  root: ParentNode = document
): RunnerPublicApi {
  const config = requireEnabledConfig(configValue);
  disposeActiveRunner();
  const controller = new RunnerController(config);
  singleton = controller;
  const selector = config.triggerSelector ?? "[data-amso-million-runner]";
  const triggers = Array.from(root.querySelectorAll<HTMLElement>(selector));
  const viewed = new WeakSet<Element>();
  const visible = new WeakSet<Element>();
  const visibilityTimers = new Map<Element, number>();

  const sourceFor = (element: HTMLElement): RunnerSource =>
    element.dataset.runnerSource ?? "unknown";

  const observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const element = entry.target as HTMLElement;
              const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
              if (!isVisible) {
                visible.delete(element);
                const timer = visibilityTimers.get(element);
                if (timer !== undefined) {
                  window.clearTimeout(timer);
                  visibilityTimers.delete(element);
                }
                continue;
              }

              visible.add(element);
              if (!viewed.has(element) && !visibilityTimers.has(element)) {
                const timer = window.setTimeout(() => {
                  visibilityTimers.delete(element);
                  if (visible.has(element) && !viewed.has(element) && !document.hidden) {
                    viewed.add(element);
                    controller.trackTriggerViewed(sourceFor(element));
                    observer?.unobserve(element);
                  }
                }, 1_000);
                visibilityTimers.set(element, timer);
              }
            }
          },
          { threshold: [0.5] }
        )
      : null;

  const onTrigger = (event: Event): void => {
    const trigger = event.currentTarget;
    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    if (
      event instanceof MouseEvent &&
      (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    ) {
      return;
    }

    if (trigger instanceof HTMLAnchorElement) {
      event.preventDefault();
    }

    const sourceLocation = sourceFor(trigger);
    const requestedAt = performance.now();
    controller.trackOpenRequested(sourceLocation);
    controller.open({
      sourceLocation,
      returnFocusTo: trigger,
      requestedAt
    });
  };

  for (const trigger of triggers) {
    observer?.observe(trigger);
    trigger.addEventListener("click", onTrigger);
  }

  if (observer === null) {
    for (const trigger of triggers) {
      if (!viewed.has(trigger)) {
        viewed.add(trigger);
        controller.trackTriggerViewed(sourceFor(trigger));
      }
    }
  }

  const api: RunnerPublicApi = {
    open: (options) => controller.open(options),
    close: (reason) => controller.close(reason),
    destroy: () => {
      observer?.disconnect();
      for (const timer of visibilityTimers.values()) {
        window.clearTimeout(timer);
      }
      visibilityTimers.clear();
      for (const trigger of triggers) {
        trigger.removeEventListener("click", onTrigger);
      }
      controller.destroy();
      if (installedApi === api) {
        installedApi = null;
      }
      if (singleton === controller) {
        singleton = null;
      }
      if (window.AMSOMillionRunner === api) {
        delete window.AMSOMillionRunner;
      }
    }
  };

  installedApi = api;
  window.AMSOMillionRunner = api;
  return api;
}

export type { RunnerConfig, RunnerOpenOptions, RunnerPublicApi };
