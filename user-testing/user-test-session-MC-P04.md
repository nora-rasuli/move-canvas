# User Test Session — Move Canvas MC-P04

## Provenance

- **Evidence track:** Simulated persona inspection
- **Date/time/timezone:** 2026-11-20, America/Los_Angeles
- **Product URL/commit:** <https://move-canvas.vercel.app> / `ee81558`
- **Persona ID:** MC-P04 — audio unavailable / Deaf or hard-of-hearing constraint
- **Observer:** Portfolio Factory — User Testing Lab

## Task observations

| Task | Result | Observation | Evidence |
|---|---|---|---|
| UT-02 | Pass | Display presents numbered preparation, pairing, and practice steps in text. | Production DOM and MC-P04 test |
| UT-03 | Pass, simulated | Calibration state, countdown button text, camera state, and completion status are visible; speech is supplementary. | Controller code and browser suite |
| UT-04–UT-05 | Pass, fixture only | Pause, tracking loss, stop, and TV-sharing states have visible labels/status. | `e2e/coach-modes.spec.ts` |

## Session boundary

No Deaf or hard-of-hearing participant tested the cues. This confirms visible
equivalents in inspected states, not communication quality or lived usability.
