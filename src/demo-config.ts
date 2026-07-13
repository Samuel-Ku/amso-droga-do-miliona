import rawConfig from "../public/assets/milion-runner/runner-config.json";
import { parseRunnerConfig } from "./config/schema";
import type { RunnerConfig } from "./shared/types";

const parsed = parseRunnerConfig(rawConfig, { allowEmbeddedImageSources: true });
if (parsed === null) {
  throw new Error("The bundled Droga do Miliona v3 config is invalid.");
}

/** Local and production previews use the same externally validated v3 content. */
export const demoConfig: RunnerConfig = parsed;
