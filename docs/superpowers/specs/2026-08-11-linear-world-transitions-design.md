# Linear world transitions without overlap

## Context

The current challenge-world transition adds a dynamic overlap that grows from `0%` to `9%` near a world boundary. The outgoing panel is shifted right by half of that overlap and the incoming panel is shifted left by the other half. On a 1780 px world image this creates roughly 160 px of double-painted content.

The overlap also changes the panels' motion phase. While normal world travel advances by five percentage points, the overlap ramp counteracts most of that movement. A production probe measured sections moving at roughly `0.10x` of normal speed even though browser frame intervals remained below the long-frame threshold. This is perceived as a microfreeze and explains why timing-only QA passed while the game looked uneven.

## Decision

Remove the transition overlap and gradient masks completely. World panels return to adjacent, strictly linear movement:

- outgoing panel: `x = -travel`;
- incoming panel: `x = 100 - travel`;
- no overlap offset;
- no seam-side attributes;
- no mask capability branch;
- no overlap-related custom properties or per-frame style updates.

The existing pair of decoded `<img>` world panels remains unchanged. The decoded-asset cache, staged-panel preparation, promotion, story-mode routing, challenge loop, gameplay simulation, and Vercel deployment boundary are not redesigned.

## Runtime behavior

`WorldVisualLayer` derives both panel transforms only from the shared visual distance. At a boundary, the outgoing panel reaches `-100%` exactly when the incoming panel reaches `0%`. Promotion reuses the prepared incoming panel without changing its rendered position by more than one device pixel.

Challenge mode keeps the same background route and loop order. Story mode keeps the previously agreed semantic world changes. Removing overlap must not change simulation step, input, hitboxes, spawn order, score, route, speed, difficulty, audio, or pause behavior.

Browsers that do not support CSS masks no longer need a special fallback because world presentation no longer uses masks. This also removes the mask-related compositor path from Chrome and Safari.

## Cleanup

Delete the overlap-specific production state and styling:

- overlap calculation and ramp constants;
- `--world-overlap` and `--world-seam-overlap` writes;
- `data-world-seam-side` assignment and pooled-panel cleanup;
- mask support detection and fallback state;
- seam mask selectors and `will-change: mask-image`.

Existing performance scripts may retain the term "world seam" as the name of the measured boundary scenario, but their acceptance policy must no longer require overlap or mask state.

## Verification

Automated tests must cover:

1. All seven ordered world pairs, including `7 → 1`, use the real preparation and promotion path.
2. At start, middle, and end of every transition, both panels follow the exact linear equations and cover the intended world plate without a white gap.
3. Visual velocity stays uniform across the transition. The measured panel displacement per unit of visual distance must remain within `0.95x–1.05x` of the baseline, with no `0.10x` slowdown region.
4. Promotion continuity stays within one rendered pixel (`1 / devicePixelRatio` CSS px).
5. Resize, orientation change, and fullscreen preserve adjacent coverage and linear phase.
6. Story transitions, reduced motion, pause/visibility, pooled-panel reuse, deterministic replay, and gameplay invariance remain green.
7. Chromium and WebKit browser qualification records no console/page/resource errors, no active-transition decode, no new image allocations, no blank exposed stage, and no frames over 33 ms in the transition windows.

After the test suite passes, deploy the exact Vercel artifact to `https://game.amso.pl/` and repeat live Chromium/WebKit performance qualification. A manual Chrome check must confirm that background motion remains visually uniform through every boundary and that no double-exposed band is visible.

## Acceptance criteria

- No visible double exposure or strong background overlay at world boundaries.
- No dynamic slowdown, pause, or acceleration caused by the transition effect.
- No mask or overlap state remains in production world-panel rendering.
- All seven transitions remain covered and promotion stays within one rendered pixel.
- No gameplay, story routing, asset decode, memory, or deployment regression.
- Production Vercel QA passes and the visual-motion probe reports a minimum velocity ratio of at least `0.95x`.
