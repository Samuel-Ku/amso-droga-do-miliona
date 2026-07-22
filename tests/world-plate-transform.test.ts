import { describe, expect, it } from "vitest";
import {
  WORLD_ARTWORK_CONTRACT,
  assertWorldArtworkContract,
  calculateWorldPlateTransform
} from "../src/visuals/world-plate-transform";
import { CAMPAIGN_WORLDS } from "../src/visuals/scene-manifest";

const EPSILON_DIGITS = 6;
const RESPONSIVE_VIEWPORTS = [
  [390, 844],
  [844, 390],
  [1024, 1024],
  [1440, 900],
  [2560, 1080]
] as const;

describe("canonical world plate transform", () => {
  it.each([
    {
      viewport: [390, 844],
      plate: [0, 318.912921, 390, 206.174157],
      artScale: 0.219101,
      worldScale: 0.40625,
      worldOffset: [0, 312.339888],
      groundY: 487.839888
    },
    {
      viewport: [844, 390],
      plate: [53.137088, 0, 737.725824, 390],
      artScale: 0.414453,
      worldScale: 0.768464,
      worldOffset: [53.137088, -12.433581],
      groundY: 319.543039
    },
    {
      viewport: [1024, 1024],
      plate: [0, 241.330337, 1024, 541.339326],
      artScale: 0.575281,
      worldScale: 1.066667,
      worldOffset: [0, 224.07191],
      groundY: 684.87191
    },
    {
      viewport: [1440, 900],
      plate: [0, 69.370787, 1440, 761.258427],
      artScale: 0.808989,
      worldScale: 1.5,
      worldOffset: [0, 45.101124],
      groundY: 693.101124
    },
    {
      viewport: [2560, 1080],
      plate: [258.533475, 0, 2042.93305, 1080],
      artScale: 1.147715,
      worldScale: 2.128055,
      worldOffset: [258.533475, -34.431456],
      groundY: 884.888417
    }
  ] as const)("contains and anchors the world at $viewport", ({
    viewport: [stageWidth, stageHeight],
    plate: [x, y, width, height],
    artScale,
    worldScale,
    worldOffset: [worldOffsetX, worldOffsetY],
    groundY
  }) => {
    const transform = calculateWorldPlateTransform(
      stageWidth,
      stageHeight,
      WORLD_ARTWORK_CONTRACT
    );

    expect(transform).not.toBeNull();
    expect(transform!.artScale).toBeCloseTo(artScale, EPSILON_DIGITS);
    expect(transform!.plateRect.x).toBeCloseTo(x, EPSILON_DIGITS);
    expect(transform!.plateRect.y).toBeCloseTo(y, EPSILON_DIGITS);
    expect(transform!.plateRect.width).toBeCloseTo(width, EPSILON_DIGITS);
    expect(transform!.plateRect.height).toBeCloseTo(height, EPSILON_DIGITS);
    expect(transform!.worldScale).toBeCloseTo(worldScale, EPSILON_DIGITS);
    expect(transform!.worldOffsetX).toBeCloseTo(worldOffsetX, EPSILON_DIGITS);
    expect(transform!.worldOffsetY).toBeCloseTo(worldOffsetY, EPSILON_DIGITS);
    expect(
      transform!.worldOffsetY + 432 * transform!.worldScale
    ).toBeCloseTo(groundY, EPSILON_DIGITS);
    expect(transform!.clipRect).toEqual(transform!.plateRect);
  });

  it.each(RESPONSIVE_VIEWPORTS)(
    "keeps CSS geometry identical at DPR 1 and 2 for %s × %s",
    (stageWidth, stageHeight) => {
      const geometryAtDpr = (dpr: 1 | 2) => ({
        backingStore: {
          width: Math.round(stageWidth * dpr),
          height: Math.round(stageHeight * dpr)
        },
        transform: calculateWorldPlateTransform(
          stageWidth,
          stageHeight,
          WORLD_ARTWORK_CONTRACT
        )
      });
      const geometryAtDpr1 = geometryAtDpr(1);
      const geometryAtDpr2 = geometryAtDpr(2);

      expect(geometryAtDpr2.backingStore).not.toEqual(
        geometryAtDpr1.backingStore
      );
      expect(geometryAtDpr2.transform).toEqual(geometryAtDpr1.transform);
    }
  );

  it.each([
    [Number.NaN, 540],
    [Number.POSITIVE_INFINITY, 540],
    [Number.NEGATIVE_INFINITY, 540],
    [960, Number.NaN],
    [960, Number.POSITIVE_INFINITY],
    [960, Number.NEGATIVE_INFINITY],
    [0, 540],
    [960, 0],
    [-1, 540],
    [960, -1]
  ])("rejects an invalid stage size %s × %s", (stageWidth, stageHeight) => {
    expect(calculateWorldPlateTransform(
      stageWidth,
      stageHeight,
      WORLD_ARTWORK_CONTRACT
    )).toBeNull();
  });

  it("enforces the explicit artwork contract for every campaign world", () => {
    expect(CAMPAIGN_WORLDS).toHaveLength(7);
    expect(CAMPAIGN_WORLDS.every(
      ({ artwork }) => artwork === WORLD_ARTWORK_CONTRACT
    )).toBe(true);
    expect(() => assertWorldArtworkContract(CAMPAIGN_WORLDS)).not.toThrow();

    const worldsWithWrongGround = CAMPAIGN_WORLDS.map((world, index) => index === 2
      ? { ...world, artwork: { ...world.artwork, artGroundY: 770 } }
      : world);

    expect(() => assertWorldArtworkContract(worldsWithWrongGround)).toThrow(
      "world_artwork_metadata_mismatch:/assets/milion-runner/worlds/" +
      "world-03-quality-service-v2.webp:artGroundY:expected=771:received=770"
    );
  });
});
