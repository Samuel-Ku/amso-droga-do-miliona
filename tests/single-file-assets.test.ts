import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const qaPreview = readFileSync(
  new URL("../droga-do-miliona-qa.html", import.meta.url),
  "utf8"
);

const campaignAvifPaths = [
  "/assets/milion-runner/brand/mz-main-lockup-v1.avif",
  "/assets/milion-runner/brand/mz-compact-lockup-v1.avif",
  "/assets/milion-runner/worlds/world-01-first-mile-v1.avif",
  "/assets/milion-runner/worlds/world-02-cable-route-v1.avif",
  "/assets/milion-runner/worlds/world-03-quality-service-v1.avif",
  "/assets/milion-runner/worlds/world-04-client-paths-v1.avif",
  "/assets/milion-runner/worlds/world-05-scale-logistics-v1.avif",
  "/assets/milion-runner/worlds/world-06-million-approach-v1.avif",
  "/assets/milion-runner/worlds/world-07-million-finale-v1.avif"
] as const;

describe("single-file QA artwork", () => {
  it("embeds every campaign AVIF instead of retaining public URLs", () => {
    for (const assetPath of campaignAvifPaths) {
      expect(qaPreview).not.toContain(assetPath);
    }

    const embeddedAvifs = new Set(
      qaPreview.match(/data:image\/avif;base64,[A-Za-z0-9+/=]+/g) ?? []
    );

    expect(embeddedAvifs.size).toBe(campaignAvifPaths.length);
  });
});
