# Stage 01 Package Verification — Move Canvas 1.1

**Decision:** `PASS` — 2026-11-19

## Change boundary

Package 1.1 is an additive scope expansion. It preserves the frozen Package 1.0
Motion Game requirements and adds two bounded first-class modes: Dance Coach
and Tennis Coach. This verification approves the package contract for build; it
does not claim either coaching mode is implemented, accurate on a population,
or ready for publication.

## Reproduced checks

- The existing multiplayer motion-game loop remains a stable regression gate;
  no Package 1.0 requirement is deleted or weakened.
- Dance Coach has one bounded primary path: a same-origin curated clip or local
  10–90 second MP4/WebM, single-person local pose extraction, paired phone
  comparison, confidence-qualified cues, and an in-session result.
- Tennis Coach has two bounded shadow drills only: serve and forehand. It does
  not require or claim ball, racket, force, speed, spin, placement, or injury
  analysis.
- TV/display and phone responsibilities are explicit. Raw user-camera media
  stays on the phone; raw reference-video bytes stay on the display; only the
  normalized reference timeline and semantic coaching events cross the peer
  channel.
- Coach feedback decisions are deterministic in v1.1. Generative AI remains
  limited to the existing schema-governed Motion Game blueprint path.
- Stable requirement IDs cover mode routing, regression, dance ingestion and
  comparison, tennis drills and phase analysis, pairing, privacy, truth,
  accessibility, failure recovery, frozen evaluation, and bounded payload/
  semantic-event performance.
- Acceptance checks distinguish deterministic fixture correctness from limited
  real-device evidence and prohibit broad accuracy or coaching-effectiveness
  claims.
- The one-week schedule, explicit non-goals, and cut order preserve both coach
  golden paths, privacy, confidence handling, accessibility, and the existing
  game before polish.
- Publication requires fresh clip input, real phone-camera input, paired-display
  completion, privacy/network evidence, a device matrix, and a claim audit.

## Route

Freeze **Package 1.1** and return to **02 — Build**. Start by locking the
Package 1.0 regression baseline, then implement the shared coach session/data
contracts before mode UI. Stage 03 must independently reproduce one Dance
Coach run, both Tennis Coach drills, the existing multiplayer game, and the
privacy boundary on real paired devices.
