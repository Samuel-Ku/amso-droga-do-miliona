export interface MovingPoolObject {
  x: number;
  y: number;
  previousX?: number;
  previousY?: number;
  motionRevision?: number;
}

export function assertSafeCounter(value: number): void {
  if (!Number.isSafeInteger(value)) throw new Error("pool_identity_counter_overflow");
}

/** Marks a discontinuity so the renderer snaps instead of drawing a ghost path. */
export function snapPoolPosition(object: MovingPoolObject, x: number, y: number): void {
  object.x = x;
  object.y = y;
  object.previousX = x;
  object.previousY = y;
  object.motionRevision = (object.motionRevision ?? 0) + 1;
  assertSafeCounter(object.motionRevision);
}
