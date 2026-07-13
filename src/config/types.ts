import type { RunnerConfig } from "../shared/types";

export type RunnerConfigErrorCode =
  | "invalid_type"
  | "missing_key"
  | "unknown_key"
  | "unsupported_schema"
  | "invalid_value"
  | "disallowed_path"
  | "no_valid_facts";

export interface RunnerConfigIssue {
  code: RunnerConfigErrorCode;
  path: string;
}

export type RunnerConfigValidationResult =
  | { success: true; data: RunnerConfig }
  | { success: false; issues: RunnerConfigIssue[] };

export interface RunnerConfigValidationOptions {
  /** Date used for inclusive validFrom/validTo checks. */
  now?: Date;
}

export type { RunnerConfig, RunnerFact } from "../shared/types";
