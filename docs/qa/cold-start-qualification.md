# Cold-start browser qualification

Run the four-profile qualification against one immutable production deployment:

```sh
npm run check:cold-start-qualification -- \
  --target https://deployment.example/campaign \
  --output-dir .scratch/cold-start-qualification
```

The command captures, in order:

1. cold process with audio enabled;
2. cold process with audio disabled;
3. warm process with audio enabled;
4. a full 60-second reference session with audio enabled.

Use `--dry-run` to inspect the exact capture plan without opening a browser. To
rebuild only the report from retained evidence, use `--runs-dir` with optional
`--json-out` and `--markdown-out` paths.

Every run must share the deployment target, scenario/config version, seed,
input trace, viewport, DPR, quality, motion, browser and profiler identity. The
report fails closed on mismatches, a frame-budget regression, a first-10-second
spike, active decode or a frame over 33 ms within ±500 ms of either first world
transition, diagnostics/DOM/memory trends, or gameplay/replay differences.

Headless JavaScript heap samples and Long Animation Frame rendering duration are
diagnostic proxies only. Unsupported browser-process attribution (including GC),
missing physical process-memory evidence, approved
visual fixtures, minimum-profile Android evidence, or iPhone Safari evidence
keeps the release gate `incomplete`; the desktop run cannot promote it to
`pass`.
