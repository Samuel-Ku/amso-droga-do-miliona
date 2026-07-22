import type { WorldVisualLayer } from "./WorldVisualLayer";
import {
  WORLD_ARTWORK_CONTRACT,
  calculateWorldPlateTransform,
  type WorldArtworkMeta,
  type WorldPlateTransform
} from "./world-plate-transform";

const SIZE_EPSILON = 0.01;

export interface WorldGeometryViewport {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}

export interface WorldGeometryConsumer {
  applyGeometry(
    snapshot: Readonly<WorldPlateTransform>,
    viewport: Readonly<WorldGeometryViewport>
  ): boolean | void;
  suspendForInvalidGeometry?(): void;
}

export interface GeometryDiagnostics {
  readonly measurementsReceived: number;
  readonly validMeasurements: number;
  readonly transformRecalculations: number;
  readonly geometryApplications: number;
  readonly canvasResizes: number;
}

interface StageMeasurement {
  readonly width: number;
  readonly height: number;
}

function measurementsEqual(
  left: Readonly<StageMeasurement> | null,
  right: Readonly<StageMeasurement>
): boolean {
  return left !== null &&
    Math.abs(left.width - right.width) < SIZE_EPSILON &&
    Math.abs(left.height - right.height) < SIZE_EPSILON;
}

/** Owns the sole DOM-measurement lifecycle for world geometry. */
export class WorldGeometryCoordinator {
  private readonly observer: ResizeObserver;
  private readonly view: Window | null;
  private currentSnapshot: Readonly<WorldPlateTransform> | null = null;
  private currentMeasurement: Readonly<StageMeasurement> | null = null;
  private pendingMeasurement: Readonly<StageMeasurement> | null = null;
  private gameConsumer: WorldGeometryConsumer | null = null;
  private gameReadyCallback: (() => void) | null = null;
  private gameReadyNotified = false;
  private resizeFrame = 0;
  private destroyed = false;
  private layoutValid = false;
  private measurementsReceived = 0;
  private validMeasurements = 0;
  private transformRecalculations = 0;
  private geometryApplications = 0;
  private canvasResizes = 0;
  private appliedDpr: number | null = null;

  public constructor(
    stage: HTMLElement,
    private readonly visualLayer: WorldVisualLayer,
    private readonly metadata: Readonly<WorldArtworkMeta> = WORLD_ARTWORK_CONTRACT
  ) {
    this.view = stage.ownerDocument.defaultView;
    this.observer = new ResizeObserver(this.handleMeasurements);
    this.observer.observe(stage);
    this.view?.addEventListener("resize", this.handleViewportChange);
  }

  public get snapshot(): Readonly<WorldPlateTransform> | null {
    return this.currentSnapshot;
  }

  public get diagnostics(): Readonly<GeometryDiagnostics> {
    return Object.freeze({
      measurementsReceived: this.measurementsReceived,
      validMeasurements: this.validMeasurements,
      transformRecalculations: this.transformRecalculations,
      geometryApplications: this.geometryApplications,
      canvasResizes: this.canvasResizes
    });
  }

  public attachGame(game: WorldGeometryConsumer, onReady?: () => void): () => void {
    if (this.destroyed) throw new Error("world_geometry_coordinator_destroyed");
    this.gameConsumer = game;
    this.gameReadyCallback = onReady ?? null;
    this.gameReadyNotified = false;
    if (this.layoutValid && this.currentSnapshot !== null && this.currentMeasurement !== null) {
      this.applySnapshotToGame(game, this.currentSnapshot, this.currentMeasurement);
    } else {
      game.suspendForInvalidGeometry?.();
    }

    let attached = true;
    return () => {
      if (!attached) return;
      attached = false;
      if (this.gameConsumer === game) {
        this.gameConsumer = null;
        this.gameReadyCallback = null;
        this.gameReadyNotified = false;
      }
    };
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.observer.disconnect();
    this.view?.removeEventListener("resize", this.handleViewportChange);
    if (this.resizeFrame !== 0) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = 0;
    this.pendingMeasurement = null;
    this.currentMeasurement = null;
    this.currentSnapshot = null;
    this.gameConsumer = null;
    this.gameReadyCallback = null;
  }

  private readonly handleMeasurements: ResizeObserverCallback = (entries): void => {
    if (this.destroyed) return;
    const entry = entries.at(-1);
    if (entry === undefined) return;
    this.measurementsReceived += entries.length;
    this.pendingMeasurement = Object.freeze({
      width: entry.contentRect.width,
      height: entry.contentRect.height
    });
    if (this.resizeFrame !== 0) return;
    this.resizeFrame = requestAnimationFrame(this.applyPendingMeasurement);
  };

  /** A monitor/zoom DPR change can fire without changing the stage CSS rect. */
  private readonly handleViewportChange = (): void => {
    if (this.destroyed || this.resizeFrame !== 0) return;
    this.resizeFrame = requestAnimationFrame(this.applyPendingMeasurement);
  };

  private readonly applyPendingMeasurement = (): void => {
    this.resizeFrame = 0;
    if (this.destroyed) return;
    const measurement = this.pendingMeasurement;
    this.pendingMeasurement = null;
    if (measurement === null) {
      this.applyDprChangeIfNeeded();
      return;
    }

    const transform = calculateWorldPlateTransform(
      measurement.width,
      measurement.height,
      this.metadata
    );
    if (transform === null) {
      this.layoutValid = false;
      this.gameConsumer?.suspendForInvalidGeometry?.();
      return;
    }
    this.validMeasurements += 1;
    if (measurementsEqual(this.currentMeasurement, measurement)) {
      if (this.layoutValid) {
        this.applyDprChangeIfNeeded();
        return;
      }
      this.layoutValid = true;
      if (this.gameConsumer !== null && this.currentSnapshot !== null) {
        this.applySnapshotToGame(this.gameConsumer, this.currentSnapshot, measurement);
      }
      this.geometryApplications += 1;
      return;
    }

    this.transformRecalculations += 1;
    this.layoutValid = true;
    this.currentMeasurement = measurement;
    this.currentSnapshot = transform;
    this.visualLayer.applyGeometry(transform);
    if (this.gameConsumer !== null) {
      this.applySnapshotToGame(this.gameConsumer, transform, measurement);
    }
    this.geometryApplications += 1;
  };

  private applySnapshotToGame(
    game: WorldGeometryConsumer,
    snapshot: Readonly<WorldPlateTransform>,
    measurement: Readonly<StageMeasurement>
  ): void {
    const dpr = this.currentDpr();
    const viewport = Object.freeze({
      width: measurement.width,
      height: measurement.height,
      dpr
    });
    if (game.applyGeometry(snapshot, viewport) === true) this.canvasResizes += 1;
    this.appliedDpr = dpr;
    if (game === this.gameConsumer && !this.gameReadyNotified) {
      this.gameReadyNotified = true;
      this.gameReadyCallback?.();
    }
  }

  private applyDprChangeIfNeeded(): void {
    if (!this.layoutValid || this.gameConsumer === null || this.currentSnapshot === null ||
        this.currentMeasurement === null || this.appliedDpr === this.currentDpr()) return;
    this.applySnapshotToGame(
      this.gameConsumer,
      this.currentSnapshot,
      this.currentMeasurement
    );
    this.geometryApplications += 1;
  }

  private currentDpr(): number {
    return Math.max(1, this.view?.devicePixelRatio || globalThis.devicePixelRatio || 1);
  }
}
