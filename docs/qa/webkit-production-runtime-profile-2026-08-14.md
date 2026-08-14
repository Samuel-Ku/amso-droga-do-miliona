# WebKit production runtime profile — 2026-08-14

## Decision

Status: **no confirmed runtime candidate; release gate remains failed**.

The controlled full-story replay did not confirm Canvas effects, compositor/paint,
or GC as a production hot path that can be optimized safely. No speculative game
runtime change is proposed from this evidence.

## Controlled evidence

- Source commit: `46fe6f885537e4dcd780df39d07248a87777fce7`
- Source identity: `265d66fa121b2f6ffd8b680ee6ca9e7248bd630e4c3d23b4bc6abfd2137133ea`
- HTML SHA-256: `33bde9201d85b7f861d02da54d6a35e3d147be68e69932d251afb47442eaaffd`
- Production final URL: `https://game.amso.pl/?qa=performance&scenario=full-story-reference-v1&quality=force-full&motion=full&audio=enabled&dpr=1`
- Vercel request ID recorded in evidence: `arn1::d2dds-1786708330215-1ebd1b305477`
- Browser/device: Playwright WebKit `26.5`, `macbook-m1-pro-32gb`, 1280×720, DPR 1
- Scenario: `full-story-reference-v1`, seed `1297748482`, audio enabled,
  full motion, forced full quality
- Input trace digest: `afb10f39f87a994f6a9d0b5e6a01099d5d3364114d951b5e9cfc2d4e875f6814`
- Gameplay digest: `82afa27e9cf5071449966009bd54e5018cbfa6b8a397608fd3ae32f6f2c46bb9`

Local and production evidence used identical HTML, JS, CSS, source identity and
all seven world assets. Both replays completed 46/46 waves on the first attempt,
showed the complete story/countdown route and ended visibly at exactly 1,000,000.

## Results

| Metric | Local exact artifact | Production |
| --- | ---: | ---: |
| p50 | 17 ms | 16 ms |
| p95 | 20 ms | 20 ms |
| p99 | 29 ms | 29 ms |
| maximum | 68 ms | 111 ms |
| frames >33 ms | 89 | 101 |
| frames >100 ms | 0 | 1 |
| empty-rAF p95 (diagnostic only) | 18 ms | 18 ms |

The strict `p95 <= 18 ms` gate remains red. Production also exceeded the 100 ms
maximum once. The cadence residual is 2 ms in both environments, so the result
is not classified as cadence-limited.

Integrity was clean in both runs: zero active decode starts, repeated world
decode, hot-path image nodes, blank frames, browser failures or truncated
diagnostic histories. Collector A/B added 0 ms at p95.

Sampled Canvas work was small: 20 ms local and 33 ms production across 720
sampled active frames; shadowed paint time rounded to 0 ms. WebKit exposed no
Long Animation Frame, GC or heap observer data in these runs. Consequently the
strict policy returned `no-runtime-candidate / inconclusive` rather than ranking
an unsupported optimization.

Raw local, production and policy JSON live under
`.scratch/finalna-gotowosc-wydajnosciowa/evidence/ticket-01/`.

## Next step

Do not change production rendering from this ticket. Keep the release gate
failed. A new runtime optimization ticket requires additional evidence that
correlates a reproducible production cost with the same red segment and world in
both local and production replay.
