# Stage 02 Build Report — Checkpoint 3

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
- `PAIR-01`: an owned Supabase Free project now provides anonymous Auth and
  private Realtime Broadcast rooms. RLS permits authenticated broadcast traffic
  only on high-entropy `move-canvas:[12-character-code]` topics. The client uses
  only a publishable key and retains a same-device development fallback.
- `MULTI-01`: two isolated phone controllers join one display as named players;
  the display maintains player presence, per-player scores, team score, and a
  sorted final leaderboard. A retry-safe handshake prevents dropped initial
  broadcasts from leaving a controller stranded.
- `P-01`, `GAME-01`, `SAVE-01`: a complete timed round now starts from the
  controller, issues deterministic collect/dodge movement prompts, scores
  correct poses, times out missed poses, deducts lives, pauses/resumes, ends at
  the time/life boundary, returns and stores a result, and supports replay.
- `QA-01`: invalid prompt, camera denied/missing, out-of-frame/model-error,
  waiting, connected, and degraded-provider states are represented.

## Verification reproduced

- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run test`: 5 files / 13 tests pass
- `npm run build`: pass
- `npm run test:e2e`: 2 Playwright tests pass against the real private Supabase
  relay; the primary flow uses three isolated browser contexts (Nora, Sam, and
  the TV display), completes a shared round, verifies per-player/team scoring,
  pause/resume, saved result, keyboard start, and zero serious/critical axe
  violations
- Browser: fresh “neon jungle” idea → Parrots Dash → calibration entry; malformed
  short prompt; creator-to-setup scroll position; two-tab room/blueprint/gesture
  handshake. A fresh server recheck emitted ordinary `GET /pair 200` and
  `GET /calibrate 200` requests with no hydration exception after two storage
  boundary repairs.

## Known incomplete requirements

- `VISION-01`: landmark model needs real phone/light/body-framing evidence and
  must be reproduced driving the controller on a physical phone.
- `PAIR-01`: automated independent-context relay verification passes. A physical
  phone-to-TV trace remains required before Stage 03 can close the device claim.
- `A11Y-01`: automated axe and keyboard start pass; manual screen-reader,
  reduced-motion, and TV-distance checks remain.
- `EVAL-01`, `ECON-01`: frozen AI corpus and measured model/controller profiles
  remain.

## Next bounded build step

Run the exact camera-to-display flow on a physical phone and TV/browser, capture
the Stage 02 evidence, and hand the candidate to an independent Stage 03
validator.

