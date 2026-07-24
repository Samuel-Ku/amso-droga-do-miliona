# Performance device qualification

Status: implementation and provisional QA may proceed. Final minimum-profile performance sign-off is incomplete until a physical 4 GB Android phone is named and available.

## Versioned world-transition workload

`performance-reference-v1` keeps the production simulation, collision, input,
spawn, and `ChallengeWorldDirector` paths. Its manifest explicitly sets the
visual world duration to 24 seconds so the fixed 60-second capture crosses two
real world boundaries. Normal Challenge mode retains its authored 45-second
cadence. The effective scenario cadence is included in `qaRunConfiguration`;
it is a coverage parameter, not a production setting or private-state mutation.

## References

- Primary available Android reference: OnePlus 8 Pro, exact SKU/RAM/Android/Chrome versions to be recorded per run. Force 60 Hz, fix FHD+ or QHD+, landscape, battery saver off, consistent charging state, cold thermal start, and record the CSS viewport. Results are `provisional-reference`, never `minimum-profile-passed`.
- Secondary Android tablet reference: Nokia T20 TA-1397 LTE. It is a stress/reference device, not a phone baseline.
- Safari reference: iPhone 12. Use Web Inspector/Instruments and require a memory plateau, released old instances, no detached DOM accumulation, and no unjustified repeated decode. Do not compare absolute Safari memory to Chromium.
- Minimum profile: a physical Android phone with exactly 4 GB RAM is not yet available. QA/project owner must record manufacturer, exact model/SKU, chipset, Android and Chrome versions, 60 Hz setup, power/thermal protocol, viewport, and repeated-run availability.

## Numeric Chromium profile

For each explicitly recorded Android Chromium profile, run the same scenario at least three times and use the median. Measure the tab/renderer process, not only JavaScript heap. Record cold stable start, critical-assets decoded, first seven-world cycle, and fourth cycle. The profile gates are at most 220 MB total and at most 10 MB growth from cycle one to cycle four. `performance.memory` is auxiliary and must be recorded as `unavailable` when absent.

Passing OnePlus 8 Pro does not close the 4 GB minimum-profile release gate.
