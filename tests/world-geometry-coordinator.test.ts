// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { WorldGeometryCoordinator } from "../src/visuals/WorldGeometryCoordinator";
import { WorldVisualLayer } from "../src/visuals/WorldVisualLayer";

interface ResizeHarness {
  readonly notify: (width: number, height: number) => void;
  readonly flushFrame: () => void;
  readonly disconnect: ReturnType<typeof vi.fn>;
}

function installResizeHarness(): ResizeHarness {
  let callback: ResizeObserverCallback | null = null;
  let frame: FrameRequestCallback | null = null;
  const disconnect = vi.fn();

  vi.stubGlobal("ResizeObserver", class {
    public constructor(next: ResizeObserverCallback) {
      callback = next;
    }

    public observe(): void {}
    public disconnect(): void { disconnect(); }
    public unobserve(): void {}
  });
  vi.stubGlobal("requestAnimationFrame", (next: FrameRequestCallback) => {
    frame = next;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());

  return {
    notify(width, height) {
      const entry = { contentRect: { width, height } } as ResizeObserverEntry;
      callback?.([entry], {} as ResizeObserver);
    },
    flushFrame() {
      const next = frame;
      frame = null;
      next?.(0);
    },
    disconnect
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("world geometry coordinator", () => {
  it("resizes only the backing store when DPR changes at the same CSS size", () => {
    const harness = installResizeHarness();
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 1
    });
    const stage = document.createElement("section");
    const layer = new WorldVisualLayer(document.createElement("div"));
    const coordinator = new WorldGeometryCoordinator(stage, layer);
    const snapshots: unknown[] = [];
    const dprs: number[] = [];
    coordinator.attachGame({
      applyGeometry(snapshot, viewport) {
        snapshots.push(snapshot);
        dprs.push(viewport.dpr);
        return true;
      }
    });
    harness.notify(1440, 900);
    harness.flushFrame();
    const snapshot = coordinator.snapshot;

    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 2
    });
    window.dispatchEvent(new Event("resize"));
    harness.flushFrame();
    window.dispatchEvent(new Event("resize"));
    harness.flushFrame();

    expect(snapshots).toEqual([snapshot, snapshot]);
    expect(dprs).toEqual([1, 2]);
    expect(coordinator.snapshot).toBe(snapshot);
    expect(coordinator.diagnostics.transformRecalculations).toBe(1);
    expect(coordinator.diagnostics.geometryApplications).toBe(2);
    expect(coordinator.diagnostics.canvasResizes).toBe(2);
    coordinator.destroy();
  });

  it("applies only the latest measured canonical plate in one frame", () => {
    const harness = installResizeHarness();
    const stage = document.createElement("section");
    const host = document.createElement("div");
    stage.append(host);
    const layer = new WorldVisualLayer(host);
    const coordinator = new WorldGeometryCoordinator(stage, layer);

    harness.notify(390, 844);
    harness.notify(1440, 900);
    expect(host.querySelector<HTMLElement>("[data-world-plate]")?.style.width).toBe("");

    harness.flushFrame();
    const plate = host.querySelector<HTMLElement>("[data-world-plate]");
    expect(plate).not.toBeNull();
    expect(plate!.style.left).toBe("0px");
    expect(Number.parseFloat(plate!.style.top)).toBeCloseTo(69.370786, 5);
    expect(plate!.style.width).toBe("1440px");
    expect(Number.parseFloat(plate!.style.height)).toBeCloseTo(761.258426, 5);
    expect(coordinator.snapshot?.plateRect.x).toBe(0);
    expect(coordinator.snapshot?.plateRect.y).toBeCloseTo(69.370786, 5);
    expect(coordinator.snapshot?.plateRect.width).toBe(1440);
    expect(coordinator.snapshot?.plateRect.height).toBeCloseTo(761.258426, 5);
    const route = plate!.querySelector<SVGElement>(".amso-world-visual__route")!;
    expect(Number.parseFloat(route.style.top)).toBeCloseTo(-24.269663, 5);
    expect(route.style.width).toBe("1440px");
    expect(route.style.height).toBe("810px");
    expect(coordinator.diagnostics).toEqual({
      measurementsReceived: 2,
      validMeasurements: 1,
      transformRecalculations: 1,
      geometryApplications: 1,
      canvasResizes: 0
    });
  });

  it("keeps one plate snapshot through loading, loaded and fallback", () => {
    const harness = installResizeHarness();
    const stage = document.createElement("section");
    const host = document.createElement("div");
    stage.append(host);
    const layer = new WorldVisualLayer(host);
    const coordinator = new WorldGeometryCoordinator(stage, layer);

    harness.notify(844, 390);
    harness.flushFrame();
    const snapshot = coordinator.snapshot;
    const plate = host.querySelector<HTMLElement>("[data-world-plate]")!;
    const appliedRect = () => [plate.style.left, plate.style.top, plate.style.width, plate.style.height];
    const loadingRect = appliedRect();

    host.dataset.assetState = "loaded";
    expect(coordinator.snapshot).toBe(snapshot);
    expect(appliedRect()).toEqual(loadingRect);
    host.dataset.assetState = "fallback";
    expect(coordinator.snapshot).toBe(snapshot);
    expect(appliedRect()).toEqual(loadingRect);
  });

  it("deduplicates equal measurements and preserves the last plate for invalid layout", () => {
    const harness = installResizeHarness();
    const stage = document.createElement("section");
    const host = document.createElement("div");
    stage.append(host);
    const layer = new WorldVisualLayer(host);
    const coordinator = new WorldGeometryCoordinator(stage, layer);

    harness.notify(1024, 1024);
    harness.flushFrame();
    const snapshot = coordinator.snapshot;
    harness.notify(1024.005, 1024.005);
    harness.flushFrame();
    harness.notify(0, 0);
    harness.flushFrame();

    expect(coordinator.snapshot).toBe(snapshot);
    expect(coordinator.diagnostics.transformRecalculations).toBe(1);
    expect(coordinator.diagnostics.geometryApplications).toBe(1);
  });

  it("attaches temporary games immediately without letting an old detach remove a new game", () => {
    const harness = installResizeHarness();
    const stage = document.createElement("section");
    const host = document.createElement("div");
    stage.append(host);
    const layer = new WorldVisualLayer(host);
    const coordinator = new WorldGeometryCoordinator(stage, layer);
    const firstSnapshots: unknown[] = [];
    const secondSnapshots: unknown[] = [];
    const firstSuspend = vi.fn();
    const secondSuspend = vi.fn();
    const firstReady = vi.fn();
    const secondReady = vi.fn();

    const detachFirst = coordinator.attachGame({
      applyGeometry(snapshot) { firstSnapshots.push(snapshot); return true; },
      suspendForInvalidGeometry: firstSuspend
    }, firstReady);
    expect(firstSuspend).toHaveBeenCalledOnce();
    expect(firstReady).not.toHaveBeenCalled();
    harness.notify(844, 390);
    harness.flushFrame();
    expect(firstSnapshots).toEqual([coordinator.snapshot]);
    expect(firstReady).toHaveBeenCalledOnce();

    const detachSecond = coordinator.attachGame({
      applyGeometry(snapshot) { secondSnapshots.push(snapshot); return true; },
      suspendForInvalidGeometry: secondSuspend
    }, secondReady);
    expect(secondSnapshots).toEqual([coordinator.snapshot]);
    expect(secondReady).toHaveBeenCalledOnce();
    detachFirst();
    detachFirst();
    harness.notify(1024, 1024);
    harness.flushFrame();

    expect(firstSnapshots).toHaveLength(1);
    expect(secondSnapshots).toHaveLength(2);
    expect(secondSnapshots.at(-1)).toBe(coordinator.snapshot);
    expect(secondReady).toHaveBeenCalledOnce();
    harness.notify(0, 0);
    harness.flushFrame();
    expect(secondSuspend).toHaveBeenCalledOnce();
    expect(coordinator.diagnostics.canvasResizes).toBe(3);
    detachSecond();
    detachSecond();
  });

  it("disconnects observation and cancels pending geometry on destroy", () => {
    const harness = installResizeHarness();
    const stage = document.createElement("section");
    const layer = new WorldVisualLayer(document.createElement("div"));
    const coordinator = new WorldGeometryCoordinator(stage, layer);

    harness.notify(390, 844);
    coordinator.destroy();
    harness.flushFrame();

    expect(harness.disconnect).toHaveBeenCalledOnce();
    expect(coordinator.snapshot).toBeNull();
    expect(() => coordinator.attachGame({ applyGeometry() {} })).toThrow(
      "world_geometry_coordinator_destroyed"
    );
  });

  it("resumes the last snapshot without recalculating after 0 × 0 returns valid", () => {
    const harness = installResizeHarness();
    const stage = document.createElement("section");
    const layer = new WorldVisualLayer(document.createElement("div"));
    const coordinator = new WorldGeometryCoordinator(stage, layer);
    const applied: unknown[] = [];
    const suspend = vi.fn();
    coordinator.attachGame({
      applyGeometry(snapshot) { applied.push(snapshot); return false; },
      suspendForInvalidGeometry: suspend
    });

    harness.notify(1440, 900);
    harness.flushFrame();
    const snapshot = coordinator.snapshot;
    harness.notify(0, 0);
    harness.flushFrame();
    harness.notify(1440, 900);
    harness.flushFrame();

    expect(suspend).toHaveBeenCalledTimes(2);
    expect(applied).toEqual([snapshot, snapshot]);
    expect(coordinator.diagnostics.transformRecalculations).toBe(1);
    expect(coordinator.diagnostics.geometryApplications).toBe(2);
  });

  it("does not touch canonical geometry during a 60-second parallax run", () => {
    const harness = installResizeHarness();
    const stage = document.createElement("section");
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    const coordinator = new WorldGeometryCoordinator(stage, layer);
    harness.notify(1440, 900);
    harness.flushFrame();
    const before = coordinator.diagnostics;

    for (let frame = 0; frame < 60 * 60; frame += 1) {
      layer.setParallaxDistance(frame * 4.8, true);
    }

    const after = coordinator.diagnostics;
    expect(after.transformRecalculations - before.transformRecalculations).toBe(0);
    expect(after.geometryApplications - before.geometryApplications).toBe(0);
    expect(after.canvasResizes - before.canvasResizes).toBe(0);
  });

  it("preserves the active parallax transition through orientation and fullscreen sizes", () => {
    const harness = installResizeHarness();
    const stage = document.createElement("section");
    const host = document.createElement("div");
    const layer = new WorldVisualLayer(host);
    const coordinator = new WorldGeometryCoordinator(stage, layer);
    const snapshots: unknown[] = [];
    coordinator.attachGame({
      applyGeometry(snapshot) { snapshots.push(snapshot); return false; }
    });
    harness.notify(844, 390);
    harness.flushFrame();
    layer.setParallaxDistance(360, true);
    const panelTransforms = [...host.querySelectorAll<HTMLElement>("[data-world-panel]")]
      .map(({ style }) => style.transform);

    harness.notify(390, 844);
    harness.flushFrame();
    harness.notify(1440, 900);
    harness.flushFrame();

    expect([...host.querySelectorAll<HTMLElement>("[data-world-panel]")]
      .map(({ style }) => style.transform)).toEqual(panelTransforms);
    expect(snapshots).toHaveLength(3);
  });
});
