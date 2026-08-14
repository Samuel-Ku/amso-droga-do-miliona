# Active HUD backdrop experiment — 2026-08-13

## Decision

Do not ship the opaque-HUD experiment from runtime-optimization ticket 02.
The production CSS remains unchanged because the controlled comparison did not
produce valid, repeatable evidence that satisfies every qualification gate.

## Scope

The experiment was isolated from the concurrent mobile-layout work and applied
only these changes to the Vercel artifact based on `6222c75`:

- remove the obsolete `backdrop-filter: blur(12px)` declaration from the HUD
  context, statistics and pause-button rule;
- replace the computed `rgb(23 23 23 / 90%)` surface with opaque `#171717`.

Browser-level computed-style checks confirmed that Chromium, WebKit and Firefox
already resolved the active HUD's backdrop filter to `none` before the change.
The earlier blur declaration was overridden by the final campaign cascade and
was not active rendering work.

## Full-story evidence

All accepted gameplay traces used `full-story-reference-v1`, seed `1297748482`,
the same input trace, 1280×720 viewport, DPR 1, full quality and enabled audio.
They completed 46 authored waves, reached exactly 1,000,000 and produced the
approved digest `82afa27e9cf5071449966009bd54e5018cbfa6b8a397608fd3ae32f6f2c46bb9`.
Active decode, image-node allocation, repeated world decode and blank frames
remained zero.

| Engine | p95 before → after | max before → after | frames >33 ms | Verdict |
| --- | ---: | ---: | ---: | --- |
| Chromium | 9.2 → 9.3 ms | 25.5 → 25.7 ms | 0 → 0 | No measurable gain |
| WebKit run 1 | 18 → 18 ms | 83 → 63 ms | 21 → 5 | Rejected: collector A/B overhead |
| WebKit run 2 | 18 → 18 ms | 83 → 58 ms | 21 → 6 | Rejected: collector A/B overhead |

Both WebKit after runs recorded a 0 ms sampled-vs-control rAF interval delta,
but a quantized 1 ms collector execution delta. The strict qualification policy
therefore rejected them with `collector-ab-overhead-too-high`. The gate was not
relaxed to make the optimization pass.

Raw local evidence remains under
`.scratch/optymalizacja-renderingu-runtime/evidence/ticket-02/`.

## Follow-up

No production runtime complexity is retained from this experiment. The next
independent optimization should target an active cost that is present in the
computed render path, beginning with ticket 03 (opaque world panels), while
keeping the same before/after contract.
