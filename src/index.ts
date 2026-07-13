import "./styles/campaign.css";
import { CampaignController } from "./CampaignController";
import type {
  RunnerConfig,
  RunnerOpenOptions,
  RunnerPublicApi
} from "./shared/types";

export interface CampaignMountApi {
  destroy(): void;
}

type CampaignNavigate = (path: string) => void;

let mountedCampaign: CampaignController | null = null;
let redirectApi: RunnerPublicApi | null = null;

function requireEnabledConfig(value: RunnerConfig): RunnerConfig {
  // Public runtime entry points receive the already validated value produced by
  // the loader. Re-parsing would reject the parser's own derived compatibility
  // fields (`facts`, `narrativeMode`, etc.) under the strict wire schema.
  if (value.schemaVersion !== 3 || !value.enabled) {
    throw new Error("runner_config_disabled_or_invalid");
  }
  return value;
}

function browserNavigate(path: string): void {
  window.location.assign(path);
}

/**
 * Mounts the canonical, page-level v3 experience. The campaign owns only the
 * supplied host, which keeps CMS integration explicit and testable.
 */
export function mountCampaign(
  configValue: RunnerConfig,
  host: HTMLElement
): CampaignMountApi {
  const config = requireEnabledConfig(configValue);
  mountedCampaign?.destroy();
  const controller = new CampaignController(host, config);
  mountedCampaign = controller;

  return {
    destroy(): void {
      controller.destroy();
      if (mountedCampaign === controller) mountedCampaign = null;
    }
  };
}

/**
 * Migration-only adapter for old shop triggers. It deliberately redirects to
 * the dedicated page instead of shipping a second, modal copy of the game.
 */
export function createCampaignRedirectApi(
  configValue: RunnerConfig,
  navigate: CampaignNavigate = browserNavigate
): RunnerPublicApi {
  const config = requireEnabledConfig(configValue);
  let active = true;
  return {
    open(): void {
      if (active) navigate(config.cta.path);
    },
    close(): void {
      // A redirect-only adapter has no modal state to close.
    },
    destroy(): void {
      active = false;
    }
  };
}

export function bootstrapRunner(
  configValue: RunnerConfig,
  _trigger?: HTMLElement
): RunnerPublicApi {
  redirectApi?.destroy();
  const api = createCampaignRedirectApi(configValue);
  redirectApi = api;
  window.AMSOMillionRunner = api;
  return api;
}

export function init(configValue: RunnerConfig): RunnerPublicApi {
  return bootstrapRunner(configValue);
}

export function open(options: RunnerOpenOptions): void {
  redirectApi?.open(options);
}

export function close(reason?: string): void {
  redirectApi?.close(reason);
}

export function destroy(): void {
  redirectApi?.destroy();
  redirectApi = null;
  mountedCampaign?.destroy();
  mountedCampaign = null;
  if (typeof window !== "undefined") delete window.AMSOMillionRunner;
}

export function installRunner(
  configValue: RunnerConfig,
  root: ParentNode = document
): RunnerPublicApi {
  const config = requireEnabledConfig(configValue);
  redirectApi?.destroy();
  const api = createCampaignRedirectApi(config);
  redirectApi = api;
  const selector = config.triggerSelector ?? "[data-amso-million-runner]";
  const triggers = Array.from(root.querySelectorAll<HTMLElement>(selector));

  const onTrigger = (event: MouseEvent): void => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    api.open({
      sourceLocation: event.currentTarget instanceof HTMLElement
        ? event.currentTarget.dataset.runnerSource ?? "unknown"
        : "unknown"
    });
  };

  for (const trigger of triggers) trigger.addEventListener("click", onTrigger);

  const installedApi: RunnerPublicApi = {
    open: (options) => api.open(options),
    close: (reason) => api.close(reason),
    destroy(): void {
      for (const trigger of triggers) trigger.removeEventListener("click", onTrigger);
      api.destroy();
      if (redirectApi === installedApi) redirectApi = null;
      if (typeof window !== "undefined" && window.AMSOMillionRunner === installedApi) {
        delete window.AMSOMillionRunner;
      }
    }
  };

  redirectApi = installedApi;
  window.AMSOMillionRunner = installedApi;
  return installedApi;
}

export type { RunnerConfig, RunnerOpenOptions, RunnerPublicApi };
