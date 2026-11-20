# Stage 02 Build Report — Checkpoint 1

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
- `QA-01`: invalid prompt, camera denied/missing, out-of-frame/model-error,
  waiting, connected, and degraded-provider states are represented.

## Verification reproduced

- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run test`: 3 files / 7 tests pass
- `npm run build`: pass
- Browser: fresh “neon jungle” idea → Parrots Dash → calibration entry; malformed
  short prompt; creator-to-setup scroll position; two-tab room/blueprint/gesture
  handshake.

## Known incomplete requirements

- `P-01`, `GAME-01`: no complete visual round yet.
- `VISION-01`: landmark model needs real phone/light/body-framing evidence and
  must drive the controller, not only calibration capture.
- `PAIR-01`: production cross-device relay is environment-dependent; private
  room authorization and reconnect remain.
- `A11Y-01`: automated axe and manual keyboard/TV-distance checks remain.
- `EVAL-01`, `ECON-01`: frozen AI corpus and measured model/controller profiles
  remain.
- `SAVE-01`: blueprint persists; completed result/replay does not yet.

## Next bounded build step

Connect calibrated live poses to semantic room events and feed those events
into a complete 60-second collect-and-dodge display runtime. Then add reconnect,
result persistence, and independent real-device verification.

