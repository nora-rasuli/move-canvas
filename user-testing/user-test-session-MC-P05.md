# User Test Session — Move Canvas MC-P05

## Provenance

- **Evidence track:** Simulated persona inspection
- **Date/time/timezone:** 2026-11-20, America/Los_Angeles
- **Product URL/commit:** <https://move-canvas.vercel.app> / `ee81558`
- **Persona ID:** MC-P05 — tremor/reduced fine motor control, small phone at a distance
- **Observer:** Portfolio Factory — User Testing Lab

## Task observations

| Task | Result | Observation | Evidence |
|---|---|---|---|
| UT-02 | Pass | Main visible buttons on the small display route meet the 44 px height check. | `e2e/user-testing-lab.spec.ts` |
| UT-03 | Pass, simulated | Neutral and comfortable-range captures arm a five-second hands-free capture with visible and spoken countdown cues. | Controller implementation and calibration tests |
| UT-04–UT-05 | Pass, fixture only | Large labeled start, pause, resume, end, and sharing controls remain available. | Browser suite |

## Session boundary

No participant with tremor or alternative input tested the controls. Switch
access, touch error rate, and real distance-to-phone behavior remain evidence
gaps.
