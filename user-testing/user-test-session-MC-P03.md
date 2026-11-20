# User Test Session — Move Canvas MC-P03

## Provenance

- **Evidence track:** Simulated persona inspection
- **Date/time/timezone:** 2026-11-20, America/Los_Angeles
- **Product URL/commit:** <https://move-canvas.vercel.app> / `ee81558`
- **Persona ID:** MC-P03 — low vision, 200% zoom-equivalent layout, keyboard
- **Observer:** Portfolio Factory — User Testing Lab

## Task observations

| Task | Result | Observation | Evidence |
|---|---|---|---|
| UT-01 | Pass | Primary modes remain visible at 640 CSS pixels with no horizontal page overflow. | `e2e/user-testing-lab.spec.ts` |
| UT-01 | Pass | Skip link receives first keyboard focus. | Playwright focus assertion |
| UT-02–UT-06 | Pass, automated scope | Audited routes have no serious/critical Axe violations; keyboard start and stop paths pass. | 16-scenario browser suite |

## Session boundary

No real magnifier, screen reader, high-contrast OS mode, or low-vision
participant was used. This supports only automated layout and keyboard claims.
