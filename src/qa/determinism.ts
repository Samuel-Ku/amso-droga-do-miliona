export const NUMERIC_TOLERANCES = {
  positionPx: 0.0001,
  distancePx: 0.001,
  velocityPxPerSecond: 0.0001,
  timerSeconds: 0.000001
} as const;

export interface NumericDifference { path: string; expected: number; actual: number; delta: number; tolerance: number; passed: boolean; }
export interface DeterminismResult { exactDigest?: string; semanticMatch: boolean; maxEventStepDelta: number; numericDeltas: Record<string, NumericDifference>; discreteMismatches: readonly { path: string; expected: unknown; actual: unknown }[]; eventMismatches: readonly { eventId: string; expectedStep: number; actualStep: number }[]; }
export interface ExactDeterminismArtifact<T> { digest: string; canonicalState: T; }

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  const object = value as Record<string, unknown>;
  const keys = Object.keys(object).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(object[key])}`).join(",")}}`;
}
function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function exactDeterminismArtifact<T>(canonicalState: T): ExactDeterminismArtifact<T> {
  return { digest: fnv1a(stableSerialize(canonicalState)), canonicalState };
}

export function withinTolerance(expected: number, actual: number, tolerance: number): boolean {
  return Number.isFinite(expected) && Number.isFinite(actual) && Math.abs(expected - actual) <= tolerance;
}

function toleranceFor(path: string): number | null {
  const key = path.toLowerCase();
  if (key.includes("velocity")) return NUMERIC_TOLERANCES.velocityPxPerSecond;
  if (key.includes("distance")) return NUMERIC_TOLERANCES.distancePx;
  if (key.includes("seconds") || key.includes("timer") || key.includes("remaining")) return NUMERIC_TOLERANCES.timerSeconds;
  if (key.endsWith("x") || key.endsWith("y") || key.includes("position")) return NUMERIC_TOLERANCES.positionPx;
  return null;
}

export interface CanonicalScenarioEvent { type: string; slotId?: number; generation?: number; worldIndex?: number; stepIndex: number; }

function eventIdentity(event: CanonicalScenarioEvent): string {
  return `${event.type}:${event.slotId ?? "-"}:${event.generation ?? "-"}:${event.worldIndex ?? "-"}`;
}

export function compareSemanticState(
  expected: unknown,
  actual: unknown,
  expectedEvents: readonly CanonicalScenarioEvent[] = [],
  actualEvents: readonly CanonicalScenarioEvent[] = []
): DeterminismResult {
  const numericDeltas: Record<string, NumericDifference> = {};
  const discreteMismatches: { path: string; expected: unknown; actual: unknown }[] = [];
  const visit = (left: unknown, right: unknown, path: string): void => {
    if (typeof left === "number" && typeof right === "number") {
      const tolerance = toleranceFor(path);
      if (tolerance !== null) {
        const delta = Math.abs(left - right);
        const passed = withinTolerance(left, right, tolerance);
        numericDeltas[path] = { path, expected: left, actual: right, delta, tolerance, passed };
        if (!passed) discreteMismatches.push({ path, expected: left, actual: right });
      } else if (!Object.is(left, right)) discreteMismatches.push({ path, expected: left, actual: right });
      return;
    }
    if (Array.isArray(left) && Array.isArray(right)) {
      if (left.length !== right.length) discreteMismatches.push({ path: `${path}.length`, expected: left.length, actual: right.length });
      const count = Math.min(left.length, right.length);
      for (let index = 0; index < count; index += 1) visit(left[index], right[index], `${path}[${index}]`);
      return;
    }
    if (left !== null && right !== null && typeof left === "object" && typeof right === "object") {
      const leftObject = left as Record<string, unknown>;
      const rightObject = right as Record<string, unknown>;
      const keys = new Set([...Object.keys(leftObject), ...Object.keys(rightObject)]);
      for (const key of keys) visit(leftObject[key], rightObject[key], path ? `${path}.${key}` : key);
      return;
    }
    if (!Object.is(left, right)) discreteMismatches.push({ path, expected: left, actual: right });
  };
  visit(expected, actual, "");
  const actualByIdentity = new Map<string, CanonicalScenarioEvent>();
  for (const event of actualEvents) actualByIdentity.set(eventIdentity(event), event);
  const eventMismatches: { eventId: string; expectedStep: number; actualStep: number }[] = [];
  let maxEventStepDelta = 0;
  for (const event of expectedEvents) {
    const id = eventIdentity(event);
    const match = actualByIdentity.get(id);
    const delta = match ? Math.abs(event.stepIndex - match.stepIndex) : Number.POSITIVE_INFINITY;
    if (Number.isFinite(delta)) maxEventStepDelta = Math.max(maxEventStepDelta, delta);
    if (!match || delta > 1) eventMismatches.push({
      eventId: id,
      expectedStep: event.stepIndex,
      actualStep: match?.stepIndex ?? -1
    });
  }
  if (actualEvents.length !== expectedEvents.length && eventMismatches.length === 0) {
    eventMismatches.push({ eventId: "event-count", expectedStep: expectedEvents.length, actualStep: actualEvents.length });
  }
  return {
    semanticMatch: discreteMismatches.length === 0 && eventMismatches.length === 0,
    maxEventStepDelta,
    numericDeltas,
    discreteMismatches,
    eventMismatches
  };
}
