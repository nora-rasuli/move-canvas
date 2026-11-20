# Weekly Project Package — Move Canvas

## Package identity

- **Project:** Move Canvas
- **Version:** 1.0 frozen
- **Target:** One-week functional public release
- **Opportunity:** OPP-2026-014
- **Portfolio gap:** Interactive B2C game, real-time computer vision, peer
  connection, AI structured generation, playful visual design
- **Primary signals:** React/TypeScript product engineering; AI governance;
  real-time browser systems; accessibility and verification

## Product in 30 seconds

A player types a motion-game idea, reviews the safe blueprint AI assembles from
verified mechanics, calibrates comfortable gestures with their phone, pairs a
TV/browser, and plays the generated game. Camera frames remain on the phone;
only semantic controller events reach the display. The saved blueprint and
score are the retained output.

## Requirement map

| ID | Requirement | Acceptance check | Evidence |
|---|---|---|---|
| P-01 | Create-to-play golden path | Fresh idea reaches completed real-camera round on paired display | E2E + video/screens |
| FUNC-01 | Fresh user-controlled input | Non-fixture prompt and live camera affect the playable result | Fresh-device trace |
| GAME-01 | Deterministic engine | Valid blueprint drives collect/dodge timing, collision, score, pause, finish | Unit + E2E |
| PAIR-01 | Cross-device pairing | Phone and display pair, exchange events, disconnect, and reconnect | Two-context E2E + devices |
| VISION-01 | On-device pose controller | Live camera recognizes allowed semantic moves; no frame upload | Network trace + manual |
| CAL-01 | Personal calibration | Thresholds derive from the current player's comfortable captured range | Unit + UI evidence |
| UX-01 | Blueprint review/editor | User can inspect, edit, validate, accept, regenerate, or discard | Keyboard E2E |
| A11Y-01 | Accessible setup and status | Keyboard flow, focus, labels, status announcements, contrast, reduced motion | axe + manual |
| QA-01 | Failure and recovery | Provider, camera, framing, pairing, and tracking failures are actionable | Tests + screenshots |
| AI-01 | Bounded AI generation | Output matches schema and allow-list; unsafe/invalid output is rejected | Eval corpus |
| EVAL-01 | Regression threshold | ≥9/10 valid safe outputs; 10/10 forbidden-move rejection; recorded model/config | Versioned report |
| HUMAN-01 | User authority | No blueprint runs before review; edits and override persist | E2E |
| PROV-01 | Provenance | Prompt, generator/model, config, validation, edits, calibration version retained | Inspectable record |
| PRIV-01 | Camera privacy | Raw frames stay local; signaling/game transport contains no image payload | Code + network audit |
| ECON-01 | Cost/latency | Generation target p95 <8 s and ≤$0.02; controller p95 <150 ms; fallback verified | Measured profile |
| SAVE-01 | Retained useful output | Blueprint and result save locally and can be replayed | Reload E2E |

## Frozen decisions

| Decision | Choice | Reopen only if |
|---|---|---|
| Scope | One collect-and-dodge game family, four gestures, solo play | Golden path cannot remain complete |
| Data | Fresh prompt, camera landmarks, semantic events; no uploaded video | Privacy requirement cannot be met |
| Architecture | Next.js, AI SDK, MediaPipe, WebRTC, minimal signaling | Spike proves a component infeasible |
| AI boundary | Schema blueprint only; no generated code or remote pose inference | Evaluation disproves useful variation |
| Safety | Allow-list + personal calibration + deterministic ceilings | Real-device tests expose unsafe behavior |
| Persistence | Local saved games/results, no auth | Cross-device continuation becomes mandatory |
| Visual direction | Expressive living-room game, not dashboard | TV-distance usability fails |

## Cut order

1. Cut cosmetic theme variants and result replay.
2. Cut QR and retain accessible code pairing.
3. Never cut the fresh prompt, real camera, paired display, calibration,
   deterministic validation, recovery, provenance, accessibility, critical
   tests, or deployable build.

## Publication gates

The product must complete with fresh input in a clean session; camera denial
and pairing loss must recover; raw video must not leave the device; CI and
critical device checks must pass; README and portfolio claims must match
measured evidence; no adoption or health claims are allowed.

