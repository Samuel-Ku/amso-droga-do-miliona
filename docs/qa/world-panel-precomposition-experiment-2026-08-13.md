# Opaque Panel świata precomposition experiment — 2026-08-13

## Decision

Do not ship the opaque Panel świata experiment from runtime-optimization ticket
03. The seven production WebP files and the runtime opacity rules remain
unchanged because two WebKit after runs failed the mandatory collector A/B
integrity gate. The comparison threshold was not relaxed.

## Isolated change

The experiment used a clean Vercel artifact based on `e599c8d`, without the
concurrent mobile-layout work. Each existing 1780×941 Panel świata asset was replaced
in place by one RGB WebP. No second asset set, atlas, canvas copy or additional
image node was introduced.

For every source pixel the offline reference was calculated as:

`result = 0.6 × source-over(#faf7f0) + 0.4 × #faf7f0`

The files were encoded as WebP with Pillow 12.3.0, quality 95 and method 6.
They contained no alpha plane and reduced total stored bytes from 3,139,512 to
1,380,212. Full-image comparison against the mathematical reference produced
mean absolute channel error between 0.81 and 1.05 on the 0–255 RGB scale; the
largest single-channel error was 24. Geometry, crop and Panel świata order were
unchanged. Chromium, Firefox and WebKit decoded all seven outputs without
resource, console or page errors.

## Full-story evidence

All runs used `full-story-reference-v1`, seed `1297748482`, the same public
keyboard input trace, 1280×720 viewport, DPR 1, full quality and enabled audio.
They completed all 46 authored waves, reached exactly 1,000,000 and produced
the approved digest
`82afa27e9cf5071449966009bd54e5018cbfa6b8a397608fd3ae32f6f2c46bb9`.
Active decode, repeated Panel świata decode, hot-path image-node allocation and blank
frames remained zero.

| Engine | p95 before → after | max before → after | frames >33 ms | Verdict |
| --- | ---: | ---: | ---: | --- |
| Chromium | 9.2 → 9.7 ms | 25.5 → 17 ms | 0 → 0 | Comparable, p95 regressed |
| WebKit run 1 | 18 → 18 ms | 83 → 59 ms | 21 → 4 | Rejected: collector A/B overhead |
| WebKit run 2 | 18 → 18 ms | 83 → 61 ms | 21 → 6 | Rejected: collector A/B overhead |

Both WebKit runs recorded no sampled-vs-control rAF interval regression, but a
quantized 1 ms sampled collector execution delta against the approved 0.5 ms
limit. The reductions in maximum frame time and >33 ms outliers are promising,
but they are not valid acceptance evidence while the comparison itself fails.

Raw reports and the amplified visual-diff sheet remain under
`.scratch/optymalizacja-renderingu-runtime/evidence/ticket-03/`.

## Consequences

The production CSS and seven original Panel świata files were restored. Because the
candidate failed the required comparison before release qualification, it was
not promoted to the four-cycle memory gate; the existing Pamięć światów and
asset count therefore remain unchanged. Reconsider this hypothesis only with
a controlled measurement whose collector A/B gate passes, ideally accompanied
by physical Safari evidence.
