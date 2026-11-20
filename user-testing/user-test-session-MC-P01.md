# User Test Session — Move Canvas MC-P01

## Provenance

- **Evidence track:** Simulated persona inspection
- **Date/time/timezone:** 2026-11-20, America/Los_Angeles
- **Product URL/commit:** <https://move-canvas.vercel.app> / `ee81558`
- **Persona ID:** MC-P01 — older adult, low technical confidence, older iPhone-sized viewport
- **Observer:** Portfolio Factory — User Testing Lab
- **Configuration:** Chromium, 390×844 and 640×800 zoom-equivalent viewport

## Task observations

| Task | Result | Observation | Evidence |
|---|---|---|---|
| UT-01 | Pass | Home page explains phone, TV, and three modes without horizontal overflow. | `e2e/user-testing-lab.spec.ts` |
| UT-02 | Pass, simulated | Display exposes QR/controller link, numbered steps, and connection status. | Production DOM inspection; paired fixture test |
| UT-03–UT-05 | Pass, fixture only | Hands-free controls, paired state, stop, and TV-sharing state are visible; no physical camera used. | `e2e/coach-modes.spec.ts` |
| UT-06 | Pass, mocked backend | Private save, Publish, Like, and Add to My Space remain behaviorally distinct. | `e2e/game-loop.spec.ts` |

## Session boundary

Supports small-viewport and low-confidence workflow inspection only. It is not
evidence from an older adult or a real older iPhone. Physical camera/TV use
remains MC-R01.
