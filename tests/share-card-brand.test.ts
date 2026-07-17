import { afterEach, describe, expect, it, vi } from "vitest";
import { createCampaignShareCard } from "../src/ui/CampaignShell";

interface ShareCardHarness {
  drawImage: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  image: HTMLImageElement;
}

function installShareCardHarness(imageLoads: boolean): ShareCardHarness {
  const drawImage = vi.fn();
  const fillText = vi.fn();
  const gradient = { addColorStop: vi.fn() };
  let source = "";
  let image: HTMLImageElement;
  const imageElement = {
    alt: "",
    decoding: "auto",
    complete: false,
    naturalWidth: imageLoads ? 1600 : 0,
    naturalHeight: imageLoads ? 924 : 0,
    onload: null,
    onerror: null,
    get src() {
      return source;
    },
    set src(value: string) {
      source = value;
      queueMicrotask(() => {
        if (imageLoads) {
          image.onload?.(new Event("load"));
        } else {
          image.onerror?.(new Event("error"));
        }
      });
    },
  };
  image = imageElement as unknown as HTMLImageElement;

  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(),
    toDataURL: vi.fn(() => "data:image/png;base64,AA=="),
  } as unknown as HTMLCanvasElement;
  const context = {
    canvas,
    createLinearGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    drawImage,
    fillText,
  } as unknown as CanvasRenderingContext2D;
  vi.mocked(canvas.getContext).mockReturnValue(context);

  vi.stubGlobal("window", {
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
  });
  vi.stubGlobal("document", {
    createElement: vi.fn((tagName: string) => tagName === "canvas" ? canvas : image),
  });

  return { drawImage, fillText, image };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("campaign result share card brand", () => {
  it("renders the real compact MZ lockup when the image is available", async () => {
    const harness = installShareCardHarness(true);

    const card = await createCampaignShareCard(
      { score: 1_234_567, orders: 42 },
      { canonicalUrl: "https://example.com/gra" },
    );

    expect(card.type).toBe("image/png");
    expect(harness.image.src).toBe("/assets/milion-runner/brand/mz-compact-lockup-v1.avif");
    expect(harness.drawImage).toHaveBeenCalledTimes(1);
    const [image, x, y, width, height] = harness.drawImage.mock.calls[0] ?? [];
    expect([image, x, y, width]).toEqual([harness.image, 596, 43, 430]);
    expect(height).toBeCloseTo(248.325);
  });

  it("falls back without drawing a fake AMSO wordmark", async () => {
    const harness = installShareCardHarness(false);

    await createCampaignShareCard(
      { score: 999_999, orders: 28 },
      { canonicalUrl: "https://example.com/gra" },
    );

    expect(harness.drawImage).not.toHaveBeenCalled();
    expect(harness.fillText.mock.calls.map(([text]) => text)).toContain("1 000 000");
    expect(harness.fillText.mock.calls.map(([text]) => text)).not.toContain("AMSO");
  });
});
