import {
  PLAYER_NAME_BLOCKED_PHRASES,
  PLAYER_NAME_COMPACT_ALIASES,
  PLAYER_NAME_EXCEPTIONS,
  PLAYER_NAME_HOMOGLYPHS,
  PLAYER_NAME_POLICY_VERSION,
  PLAYER_NAME_RISK_PATTERNS,
  type PlayerNameModerationCategory
} from "./player-name-policy.config";

export { PLAYER_NAME_POLICY_VERSION } from "./player-name-policy.config";

export const PLAYER_NAME_MAX_GRAPHEMES = 14;
export const PLAYER_NAME_TOO_LONG_MESSAGE = "Nazwa może mieć maksymalnie 14 znaków.";
export const PLAYER_NAME_DISALLOWED_MESSAGE = "Ta nazwa jest niedozwolona.";

export type PlayerNameValidationResult =
  | {
      valid: true;
      name: string;
      policyVersion: string;
    }
  | {
      valid: false;
      reason: "too_long" | "disallowed";
      category?: PlayerNameModerationCategory;
      policyVersion: string;
    };

const allowedNamePattern = /^[\p{L}\p{N}_ -]+$/u;
const hasLetterOrNumberPattern = /[\p{L}\p{N}]/u;
const tokenPattern = /[\p{L}\p{N}]+/gu;
const separatorPattern = /[\s._-]+/gu;
const diacriticPattern = /\p{M}+/gu;
const repeatedCharacterPattern = /([\p{L}\p{N}])\1+/gu;

const segmenter = typeof Intl.Segmenter === "function"
  ? new Intl.Segmenter("pl", { granularity: "grapheme" })
  : null;

export function normalizePlayerName(raw: string): string {
  return raw.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

function graphemeCount(value: string): number {
  if (segmenter === null) return Array.from(value).length;
  return Array.from(segmenter.segment(value)).length;
}

function mapHomoglyphs(value: string): string {
  return Array.from(value, (character) => PLAYER_NAME_HOMOGLYPHS[character] ?? character).join("");
}

function removeDiacritics(value: string): string {
  return value.normalize("NFD").replace(diacriticPattern, "");
}

function mapLeetspeak(value: string, oneAs: "i" | "l"): string {
  return value.replace(/[013457]/g, (character) => {
    switch (character) {
      case "0": return "o";
      case "1": return oneAs;
      case "3": return "e";
      case "4": return "a";
      case "5": return "s";
      case "7": return "t";
      default: return character;
    }
  });
}

function reduceRepeatedCharacters(value: string): string {
  return value.replace(repeatedCharacterPattern, "$1");
}

interface ComparisonForm {
  spaced: string;
  compact: string;
  tokens: readonly string[];
}

function comparisonForms(value: string): readonly ComparisonForm[] {
  const base = removeDiacritics(mapHomoglyphs(value.toLocaleLowerCase("pl-PL")));
  const variants = new Set([
    base,
    mapLeetspeak(base, "i"),
    mapLeetspeak(base, "l"),
    reduceRepeatedCharacters(base),
    reduceRepeatedCharacters(mapLeetspeak(base, "i")),
    reduceRepeatedCharacters(mapLeetspeak(base, "l"))
  ]);

  return Array.from(variants, (variant) => {
    const tokens = variant.match(tokenPattern) ?? [];
    return {
      spaced: tokens.join(" "),
      compact: variant.replace(separatorPattern, ""),
      tokens
    };
  });
}

function phraseTokens(phrase: string): readonly string[] {
  const normalized = removeDiacritics(
    mapHomoglyphs(phrase.normalize("NFKC").toLocaleLowerCase("pl-PL"))
  );
  return normalized.match(tokenPattern) ?? [];
}

function containsTokenSequence(tokens: readonly string[], expected: readonly string[]): boolean {
  if (expected.length === 0 || tokens.length < expected.length) return false;
  for (let start = 0; start <= tokens.length - expected.length; start += 1) {
    if (expected.every((token, offset) => tokens[start + offset] === token)) return true;
  }
  return false;
}

function exactException(forms: readonly ComparisonForm[]): boolean {
  return PLAYER_NAME_EXCEPTIONS.some((exception) => {
    const expected = phraseTokens(exception).join(" ");
    return forms.some((form) => form.spaced === expected);
  });
}

function blockedCategory(forms: readonly ComparisonForm[]): PlayerNameModerationCategory | null {
  if (exactException(forms)) return null;

  for (const group of PLAYER_NAME_BLOCKED_PHRASES) {
    for (const phrase of group.phrases) {
      const expectedTokens = phraseTokens(phrase);
      const expectedCompact = expectedTokens.join("");
      if (forms.some((form) =>
        containsTokenSequence(form.tokens, expectedTokens) ||
        form.compact === expectedCompact
      )) {
        return group.category;
      }
    }
  }

  if (forms.some((form) => PLAYER_NAME_COMPACT_ALIASES.includes(form.compact))) {
    return "impersonation";
  }
  return null;
}

export function validatePlayerName(raw: string): PlayerNameValidationResult {
  const name = normalizePlayerName(raw);
  if (graphemeCount(name) > PLAYER_NAME_MAX_GRAPHEMES) {
    return {
      valid: false,
      reason: "too_long",
      category: "format",
      policyVersion: PLAYER_NAME_POLICY_VERSION
    };
  }

  for (const risk of PLAYER_NAME_RISK_PATTERNS) {
    if (risk.pattern.test(name)) {
      return {
        valid: false,
        reason: "disallowed",
        category: risk.category,
        policyVersion: PLAYER_NAME_POLICY_VERSION
      };
    }
  }

  if (name.length === 0 || !allowedNamePattern.test(name) ||
      !hasLetterOrNumberPattern.test(name)) {
    return {
      valid: false,
      reason: "disallowed",
      category: "format",
      policyVersion: PLAYER_NAME_POLICY_VERSION
    };
  }

  const category = blockedCategory(comparisonForms(name));
  if (category !== null) {
    return {
      valid: false,
      reason: "disallowed",
      category,
      policyVersion: PLAYER_NAME_POLICY_VERSION
    };
  }

  return {
    valid: true,
    name,
    policyVersion: PLAYER_NAME_POLICY_VERSION
  };
}
