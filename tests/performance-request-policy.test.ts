import { describe, expect, it } from "vitest";
import {
  headersForPerformanceRequest,
  isExpectedPerformanceRequest
} from "../scripts/performance-request-policy.mjs";

describe("performance capture request policy", () => {
  const target = new URL("https://preview.example/campaign");

  it("sends the Vercel bypass only to the deployment origin", () => {
    expect(headersForPerformanceRequest(
      new URL("https://preview.example/assets/index.js"), target, { accept: "*/*" }, "secret"
    )).toMatchObject({ accept: "*/*", "x-vercel-protection-bypass": "secret" });
    expect(headersForPerformanceRequest(
      new URL("https://analytics.example/collect"), target,
      { accept: "*/*", "x-vercel-protection-bypass": "stale" }, "secret"
    )).toEqual({ accept: "*/*" });
  });

  it("rejects unexpected same-origin and cross-origin traffic", () => {
    expect(isExpectedPerformanceRequest(
      new URL("https://preview.example/assets/milion-runner/worlds/world-03-quality-service-v2.webp"),
      target
    )).toBe(true);
    expect(isExpectedPerformanceRequest(
      new URL("https://preview.example/api/analytics"), target
    )).toBe(false);
    expect(isExpectedPerformanceRequest(
      new URL("https://analytics.example/collect"), target
    )).toBe(false);
  });
});
