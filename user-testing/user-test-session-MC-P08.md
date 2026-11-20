# User Test Session — Move Canvas MC-P08

## Provenance

- **Evidence track:** Simulated persona inspection
- **Date/time/timezone:** 2026-11-20, America/Los_Angeles
- **Product URL/commit:** <https://move-canvas.vercel.app> / `ee81558`
- **Persona ID:** MC-P08 — motion sensitivity, reduced motion, unreliable network
- **Observer:** Portfolio Factory — User Testing Lab

## Task observations

| Task | Result | Observation | Evidence |
|---|---|---|---|
| UT-01–UT-06 | Pass | Reduced-motion media preference collapses animation and transition durations to 0.01 ms. | `e2e/user-testing-lab.spec.ts` |
| UT-02–UT-04 | Pass, simulated | Phone/display reload and ready/paused/running re-handshake paths pass. | `e2e/coach-modes.spec.ts` |
| UT-05 | Bounded pass | Live TV view is optional; connection failure leaves phone practice available. | Controller implementation and error copy |

## Session boundary

No real slow Wi-Fi, cellular handoff, restrictive NAT, or TURN relay was tested.
Cross-network TV live view remains a physical/restrictive-network evidence gap.
