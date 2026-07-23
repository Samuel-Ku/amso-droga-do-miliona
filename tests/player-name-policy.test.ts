import { describe, expect, it } from "vitest";
import {
  PLAYER_NAME_POLICY_VERSION,
  normalizePlayerName,
  validatePlayerName
} from "../src/moderation/player-name-policy";
import {
  allowedPlayerNames,
  disallowedPlayerNames
} from "./fixtures/player-name-moderation";

describe("shared player-name moderation policy", () => {
  it("normalizes surrounding and repeated spaces without changing valid copy", () => {
    expect(normalizePlayerName("  Jan   Kowalski  ")).toBe("Jan Kowalski");
    expect(validatePlayerName("  Jan   Kowalski  ")).toMatchObject({
      valid: true,
      name: "Jan Kowalski",
      policyVersion: PLAYER_NAME_POLICY_VERSION
    });
  });

  it.each(allowedPlayerNames)("allows neutral name %s", (name) => {
    expect(validatePlayerName(name)).toMatchObject({ valid: true, name });
  });

  it.each(disallowedPlayerNames)("rejects moderated name %s", (name) => {
    expect(validatePlayerName(name)).toMatchObject({
      valid: false,
      policyVersion: PLAYER_NAME_POLICY_VERSION
    });
  });

  it("counts grapheme clusters and reports length separately", () => {
    expect(validatePlayerName("a".repeat(14))).toMatchObject({ valid: true });
    expect(validatePlayerName("a".repeat(15))).toMatchObject({
      valid: false,
      reason: "too_long"
    });
    expect(validatePlayerName("ą".repeat(15))).toMatchObject({
      valid: false,
      reason: "too_long"
    });
  });

  it("rejects empty, special-only, and unsupported formats neutrally", () => {
    for (const name of ["", "   ", "---", "___", "Jan!", "🙂"]) {
      expect(validatePlayerName(name)).toMatchObject({
        valid: false,
        reason: "disallowed"
      });
    }
  });
});
