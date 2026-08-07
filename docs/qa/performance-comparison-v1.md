# Performance comparison report

Comparable: true
Release gate: fail

| Run | p50 ms | p95 ms | p99 ms | max ms | >33 ms | >100 ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Before / audio enabled | 8.3 | 9.2 | 9.3 | 33.6 | 1 | 0 |
| After / audio enabled | 8.1 | 9.3 | 10.8 | 26.9 | 0 | 0 |
| After / audio disabled | 8.3 | 9.3 | 9.8 | 49.3 | 2 | 0 |

### Before / audio enabled

- Quality history: [{"level":"full","atMs":0,"reason":"force-full"}]
- Decode timings: 24 total, 0 active, 69 ms max
- First world transitions: order-process@26795ms, quality-service@50734ms
- quality-service window: 9.5 ms max, 0 active decode
- Cold start: 996 ms; critical readiness: 641 ms
- Artifact: 16.95 MB
- Memory: physical-device-process-memory-required

### After / audio enabled

- Quality history: [{"level":"full","atMs":0,"reason":"force-full"}]
- Decode timings: 28 total, 0 active, 82.7 ms max
- First world transitions: order-process@26772ms, quality-service@50717ms
- quality-service window: 11.3 ms max, 0 active decode
- Cold start: 1008 ms; critical readiness: 611 ms
- Artifact: 16.97 MB
- Memory: physical-device-process-memory-required

### After / audio disabled

- Quality history: [{"level":"full","atMs":0,"reason":"force-full"}]
- Decode timings: 28 total, 0 active, 60.7 ms max
- First world transitions: order-process@26361ms, quality-service@50299ms
- quality-service window: 9.3 ms max, 0 active decode
- Cold start: 855 ms; critical readiness: 350 ms
- Artifact: 16.97 MB
- Memory: physical-device-process-memory-required

Start comparisons allow 15% headless measurement tolerance; absolute budgets remain 3 s cold / 2 s critical.

Automated checks: {"smoothRunPassed":true,"audioIsolationPassed":true,"gameplayContractPassed":true,"visualContractPassed":null,"diagnosticsPassed":true,"offlineParityPassed":null,"artifactBudgetPassed":true,"artifactRegressionPassed":false,"startBudgetPassed":true,"startRegressionPassed":true}
Release reasons: automated-check-failed:artifactRegressionPassed, minimum-profile-device-unavailable, minimum-profile-report-unavailable, oneplus-report-unavailable, nokia-report-unavailable, iphone-safari-report-unavailable, visual-fixture-evidence-unavailable, offline-production-parity-evidence-unavailable, android-memory-evidence-unavailable
