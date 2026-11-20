# Implementation Handoff — Move Canvas Package 1.1

Build the frozen package in `project-package.md`. Treat stable requirement IDs
as the contract and route every variance through the factory verifier.

Package 1.1 is additive. Preserve every Package 1.0 Motion Game requirement and
the private multiplayer relay work already in progress. Dance Coach and Tennis
Coach are new first-class modes, not permission to replace, rename, or weaken
the existing game loop.

## Operating contract

1. Reproduce and lock the Package 1.0 game/multiplayer baseline before changing
   shared session, channel, pose, or display code. Every merge keeps `REG-01`
   green.
2. Build the smallest complete Dance Coach and Tennis Coach paired-device paths
   before history, visualization polish, additional clips, or drill variants.
3. AI returns data, never executable code. Validate against the frozen schema
   and movement allow-list before presentation or runtime use. Do not use a
   generative model to score, classify, or decide coaching feedback in v1.1.
4. Raw phone-camera frames, user performance video, face identity, audio, and
   raw user landmark streams stay in the phone process. A locally selected
   reference video stays in the display process. Never persist or transmit
   those media sources.
5. The display may send the phone only a normalized time-indexed reference
   landmark timeline; the phone may return only semantic phase/timing/form
   categories, confidence, rep counts, and aggregate results.
6. Provide a clearly labeled deterministic fallback; do not silently present
   fallback output as model output.
7. Reject unsupported/overlong/multi-person/low-visibility dance references and
   low-confidence or out-of-order tennis reps. Never manufacture a score when
   the evidence is insufficient.
8. Test permission denial, unsupported/decode-failed reference media, body not
   framed, tracking loss, peer disconnect, invalid blueprint, model timeout,
   reload, keyboard use, reduced motion, and narrow mobile/TV layouts.
9. Do not claim fitness outcomes, injury prevention, professional coaching,
   anatomical/biomechanical accuracy, dance artistry, ball/racket behavior,
   users, adoption, novelty, revenue, or unmeasured performance.

## First implementation sequence

1. Run the full current verification command and a real private two-device game
   trace. Record the baseline; do not reinterpret a failing game test as coach
   work.
2. Add stable schemas for `ExperienceMode`, `CoachSession`, normalized reference
   frames, clock sync, confidence, semantic coach events, tennis drill/phase,
   qualified rep, feedback cue, and aggregate coach result. Extend existing
   types where safe; do not fork transport semantics unnecessarily.
3. Add frozen synthetic/self-created landmark fixtures first: dance on-time,
   early, late, regional mismatch, low visibility; left/right serve and
   forehand ordered, noisy, and out-of-order traces.
4. Implement `DANCE-01`/`DANCE-02`: local display-side MP4/WebM decode, duration/
   format/single-person validation, pose extraction, normalization, and compact
   in-memory timeline sampled at no more than 10 Hz and capped at 1 MiB for the
   90-second maximum. Do not support arbitrary remote URLs or raw-file relay.
5. Implement clock synchronization and `DANCE-03`: send the compact timeline to
   the phone, compare local live landmarks with confidence gates, and emit only
   semantic timing/form events. Then implement the bounded `DANCE-04` result.
6. Implement `TENNIS-01`/`TENNIS-02`: authored shadow serve and shadow forehand
   instructions, handedness mirroring, deterministic phase transitions, and
   confidence-qualified ordered reps. Use “reach/contact-zone proxy,” never
   actual ball contact.
7. Implement `TENNIS-03`: after three valid reps, emit at most two issues that
   occurred in at least two reps. Keep unclear attempts unscored.
8. Implement shared mode selection, phone consent/calibration, TV instructions,
   pause/stop/reconnect, accessible status, results, and optional aggregate-only
   local save. Preserve the current game route and multiplayer behavior.
9. Run unit, type, lint, production build, full game E2E, coach E2E, axe,
   keyboard/reduced-motion, network/privacy, and real paired-device verification.
   Preserve evidence before any README, portfolio, or publication update.

## Exact build acceptance handoff

Build is ready for Stage 03 only when all of the following are true:

1. `REG-01` passes in automation and on a real private phone/display pair.
2. A newly selected supported local dance clip completes extraction,
   calibration, synchronized paired comparison, tracking-loss pause/recovery,
   and a confidence-qualified result. Frozen traces detect seeded timing offsets
   of at least 250 ms and named body-region mismatches.
3. Shadow Serve and Shadow Forehand each complete three confidence-qualified
   reps on a real paired device; frozen ordered fixtures classify all supported
   phases, while noisy/out-of-order/low-confidence traces do not produce a
   scored rep.
4. Browser network evidence contains no phone-camera frame, performance video,
   reference-video byte/blob, raw audio, raw user landmark stream, or face
   identity. Peer messages match the permitted normalized-reference and
   semantic-event schemas.
5. The maximum-duration normalized reference timeline is no larger than 1 MiB;
   semantic coaching-event latency is p95 below 200 ms on the recorded test
   network; reference extraction duration and clock-sync behavior are disclosed
   for each tested device without making an unsupported universal claim.
6. Mode setup, consent, calibration, pause/stop, recovery, feedback, and result
   are keyboard accessible; serious/critical axe findings are zero; reduced
   motion and 360 px phone/1280 px display layouts are documented.
7. Public copy uses only the truthful claim boundary in `project-package.md`.
   No coaching-effectiveness, health, biomechanics, professional, ball/racket,
   or population-accuracy claim appears.
8. The build report includes the exact commands/results, fixture/config version,
   device/browser matrix, network capture summary, screenshots, known limits,
   safe claims, and a requirement-status row for every Package 1.0 and 1.1 ID.

## Required completion output

Return a requirement-status table, exact verification commands/results,
architecture and privacy decisions, AI evaluation/provenance/cost evidence for
Motion Game, coaching fixture/config evidence, controller and clock-sync latency
measurements, network audit, device/browser matrix, accessibility and
performance results, screenshots, known limitations, safe public claims, and
the exact next factory route. Do not update public claims or route to publication
until an independent Stage 03 verifier reproduces the three fresh-input paths.

