# User Test Session — Move Canvas MC-P02

## Provenance

- **Evidence track:** Simulated persona inspection
- **Date/time/timezone:** 2026-11-20, America/Los_Angeles
- **Product URL/commit:** <https://move-canvas.vercel.app> / `ee81558`
- **Persona ID:** MC-P02 — seated range, wheelchair configuration, limited floor space
- **Observer:** Portfolio Factory — User Testing Lab

## Task observations

| Task | Initial result | Correction | Retest |
|---|---|---|---|
| UT-03 | P1 | Removed standing-only instructions; neutral capture now permits a natural seated or standing position. | Pass at code/unit/production-copy boundary |
| UT-03 | P1 | Calibration now retains usable upper-body/hip samples when knees are obscured. | `captureCalibrationSample` test passes |
| UT-04 | P1 | Tennis uses shoulder turn as a seated load proxy when a knee is not visible. | `observeTennisPose` and phase tests pass |
| UT-05 | Pass, simulated | Live view remains optional and does not block phone-only practice. | Paired fixture and production copy |

## Session boundary

The corrected logic supports a simulated seated configuration. No wheelchair
user or real seated camera session was observed; ergonomics and lived
experience remain unvalidated.
