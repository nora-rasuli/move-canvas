# Stage 02 Build Report — Checkpoint 2

**Date:** 2026-11-19  
**Status:** Active build; not a stage gate

## Working now

- `FUNC-01`: fresh text changes title/theme/game content; malformed input has an
  actionable inline error.
- `AI-01`, `HUMAN-01`, `PROV-01`: strict blueprint schema, structured AI route,
  explicit deterministic fallback, model/fallback provenance, and approval
  before camera setup.
- `GAME-01`: deterministic ready/play/pause/score/lives/finish reducer.
- `VISION-01`, `CAL-01`: real browser camera permission, dynamically loaded
  MediaPipe Pose Landmarker, visible-body test, allow-listed pose metrics, and
  local calibration samples. Real-device landmark loading still needs Stage 03
  reproduction.
- `PAIR-01` spike: a controller and display browser context share a high-entropy
  room, transfer the blueprint, and exchange semantic gesture events. The
  browser verifier observed `Reach Left` and event count `1` on the display.
- `P-01`, `GAME-01`, `SAVE-01`: a complete timed round now starts from the
  controller, issues deterministic collect/dodge movement prompts, scores
  correct poses, times out missed poses, deducts lives, pauses/resumes, ends at
  the time/life boundary, returns and stores a result, and supports replay.
- `QA-01`: invalid prompt, camera denied/missing, out-of-frame/model-error,
  waiting, connected, and degraded-provider states are represented.

## Verification reproduced

- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run test`: 4 files / 10 tests pass
- `npm run build`: pass
- `npm run test:e2e`: 2 Playwright tests pass; full two-tab result/replay flow
  plus keyboard start and zero serious/critical axe violations
- `npm run verify`: complete lint → strict types → 10 unit/session tests →
  production build → 2 Playwright tests passed in the unrestricted local test
  environment; the sandboxed rerun could not bind a port and was not treated as
  a product failure
- Browser: fresh “neon jungle” idea → Parrots Dash → calibration entry; malformed
  short prompt; creator-to-setup scroll position; two-tab room/blueprint/gesture
  handshake. A fresh server recheck emitted ordinary `GET /pair 200` and
  `GET /calibrate 200` requests with no hydration exception after two storage
  boundary repairs.

## Known incomplete requirements

- `VISION-01`: landmark model needs real phone/light/body-framing evidence and
  must be reproduced driving the controller on a physical phone.
- `PAIR-01`: same-device controller/display is verified; production
  cross-device relay remains account-dependent. Current free-tier comparison is
  in `infrastructure-options.md`; private authorization and reconnect remain.
- `A11Y-01`: automated axe and keyboard start pass; manual screen-reader,
  reduced-motion, and TV-distance checks remain.
- `EVAL-01`, `ECON-01`: frozen AI corpus and measured model/controller profiles
  remain.

## Next bounded build step

Select the verified owner account for a no-cost realtime project, configure
private cross-device rooms, then run the exact camera-to-display flow on a
physical phone and TV/browser before Stage 03.

