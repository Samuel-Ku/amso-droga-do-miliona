export interface LongTaskSummary { support: "supported" | "unsupported"; count: number; totalDurationMs: number; maxDurationMs: number; retainedRecordCount: number; droppedRecordCount: number; }
export interface LongTaskDiagnostics { readonly summary: LongTaskSummary; stop(): void; }

export function startLongTaskDiagnostics(capacity = 64): LongTaskDiagnostics {
  const summary: LongTaskSummary = { support: "unsupported", count: 0, totalDurationMs: 0, maxDurationMs: 0, retainedRecordCount: 0, droppedRecordCount: 0 };
  if (typeof PerformanceObserver === "undefined" ||
      !PerformanceObserver.supportedEntryTypes?.includes("longtask")) return { summary, stop() {} };
  summary.support = "supported";
  const starts = new Float64Array(Math.max(1, capacity));
  const durations = new Float64Array(starts.length);
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      summary.count += 1;
      summary.totalDurationMs += entry.duration;
      summary.maxDurationMs = Math.max(summary.maxDurationMs, entry.duration);
      if (summary.retainedRecordCount < starts.length) {
        starts[summary.retainedRecordCount] = entry.startTime;
        durations[summary.retainedRecordCount] = entry.duration;
        summary.retainedRecordCount += 1;
      } else summary.droppedRecordCount += 1;
    }
  });
  observer.observe({ entryTypes: ["longtask"] });
  return { summary, stop: () => observer.disconnect() };
}
