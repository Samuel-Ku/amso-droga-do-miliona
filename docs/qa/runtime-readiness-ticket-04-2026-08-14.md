# Runtime readiness — ticket 04 — 2026-08-14

## Decision

Status: **failed; do not mark the performance release gate ready**.

The exact production deployment completed the full-story reference and stayed
within the approved frame budgets in the 60-second and four-cycle workloads.
The release is still blocked by image decoding during active gameplay and by
repeated world decoding across subsequent cycles. Physical process-memory and
some real lifecycle/device evidence remain incomplete.

## Artifact and production provenance

- Production: `https://game.amso.pl/`
- Deployed source commit: `e972d9afd9fdf455f6255948d2fbbe0b99be8a14`
- Source identity: `4e0803c98289e3766b0644449188feff09d7ba1746efd9d0f4b4fc090f3e2681`
- HTML SHA-256: `c828e0465ad7df18610b5a37c5de5c001c2712fe376de5b124bf21ceb2dcda4b`
- Vercel request ID: `arn1::xvwdr-1786715708703-8b336d3f7d73`
- Full-story browser/device: Chromium `149.0.7827.55`, 1280×720, DPR 1,
  `macbook-m1-pro-32gb`
- 60-second, cold-start and four-cycle browser context: Chromium
  `151.0.7922.138`, 960×540, DPR 1; the headless capture does not attest a
  physical device class

The full-story, 60-second, cold-start and four-cycle captures match on HTML,
source, JS/CSS and all seven world asset hashes. Route-specific images are not
part of this stable artifact fingerprint because shorter scenarios do not load
the same optional gameplay assets.

## Results

### Full story

- Passed 46/46 waves on the first attempt.
- Finished visibly at exactly 1,000,000.
- p50 8.3 ms, p95 9.9 ms, p99 10.3 ms, maximum 10.4 ms.
- Zero active decode, repeated world decode, blank frames and browser errors.

### 60-second reference

- p50 8.3 ms, p95 9.9 ms, p99 10.3 ms, maximum 16.6 ms.
- Zero frames over 33 ms or 100 ms.
- Route, checkpoints, density coverage, digest and replay passed.
- Blocker: 6 decode starts were classified during active gameplay.

### Cold start

All four automatic profiles were comparable and passed startup, first-ten-
seconds, transition-window, sequential warming, audio-gesture, diagnostics,
DOM-growth and gameplay checks. Their p95 was 9.2–10.0 ms and maximum was
16.7–17.0 ms.

This gate remains incomplete because browser-process attribution, physical
process memory, approved visual fixtures, the minimum-profile device and a
physical iPhone Safari report are unavailable in the automated capture.

### Four world cycles

Every cycle completed all seven ordered destinations, including 7 -> 1.

| Cycle | p95 | p99 | max | >33 ms | auxiliary JS heap |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 9.2 ms | 9.3 ms | 16.4 ms | 0 | 6.97 MB |
| 2 | 9.2 ms | 9.3 ms | 16.0 ms | 0 | 7.62 MB |
| 3 | 9.2 ms | 9.3 ms | 10.5 ms | 0 | 8.42 MB |
| 4 | 9.1 ms | 9.3 ms | 9.5 ms | 0 | 8.37 MB |

Auxiliary JS-heap growth from cycle one to four was 1.40 MB. This is diagnostic
only and does not replace the required physical process-memory measurement.

Blockers:

- 63 decode starts were classified during active gameplay.
- 59 repeated source/role decode events were detected across the lifecycle.
- Headless visibility and fullscreen exit observations were incomplete.
- Physical process memory is unavailable.

Resize and orientation checks passed. No frame-distribution regression was
observed across later cycles.

## Evidence

Raw machine-readable evidence is stored under
`.scratch/finalna-gotowosc-wydajnosciowa/evidence/ticket-04/`, including:

- `production-full-story-reference.json`
- `production-runtime-readiness/sixty-second.json`
- `production-runtime-readiness/cold-start/qualification.json`
- `production-runtime-readiness/four-cycle-run.json`
- `production-runtime-readiness/four-cycle-qualification.json`
- `production-runtime-readiness/runtime-readiness.json`

## Next step

Open a focused runtime ticket for world decode lifecycle reuse. Do not relax the
active-decode contract. After that fix, redeploy and repeat this same aggregate
qualification, then complete physical Chrome memory and iPhone Safari lifecycle
checks before approving release readiness.
