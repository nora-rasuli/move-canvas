# Stage 02 Build Report — Package 1.1 Rework Candidate

**Date:** 2026-11-19  
**Status:** Stage 03 rework findings repaired in automation; physical-device evidence remains; project stays in Stage 02

## Bounded rework against candidate `7374066`

The independent historical verdict in `validation-report-1.1.md` remains
unchanged. This candidate repairs only its three implementation findings:

1. Dance now uses one transported elapsed offset across display and phone.
   Start, pause, resume, end, and tracking-loss pause are identified and
   idempotently applied; the display seeks/plays/pauses reference media for
   controls originating on either peer. Resume anchors at the frozen elapsed
   offset instead of resetting comparison time.
2. Calibration is now an inspectable versioned record containing separate
   neutral and comfortable-range samples. It is keyed to the exact coach
   session in `sessionStorage`, never sent over the relay, and derives bounded
   Dance mismatch and Tennis reach/load/turn thresholds.
3. Tennis now has an assertive three-second countdown with keyboard-operable
   cancel/restart controls and reduced-motion-safe rendering.

The repair does not claim physical clock accuracy, real-camera calibration,
real-clip quality, or coaching effectiveness.

## Candidate story

Package 1.1 preserves the private multiplayer Motion Game and adds two bounded,
deterministic coaching modes:

- **Dance Coach:** the display accepts a local MP4/WebM reference of 10–90
  seconds, decodes it in-browser, rejects unreadable/multi-person/low-visibility
  input, samples MediaPipe landmarks at no more than 10 Hz, normalizes twelve
  body points, and sends only the compact normalized reference timeline to the
  paired phone. The phone compares its local live pose stream and sends only
  semantic timing/form/confidence events.
- **Tennis Coach:** the display selects handedness plus Shadow Serve or Shadow
  Forehand. The phone applies deterministic ordered-phase rules locally, keeps
  unclear/out-of-order attempts unscored, and emits at most two issues repeated
  in at least two of three qualified reps.
- **Motion Game:** its routes, private Supabase possession-code relay, named
  multiplayer scoring, pause/resume, result, replay, and existing tests remain.

Raw phone-camera media, raw user landmarks, raw audio, face identity, and local
reference-video bytes are absent from `SessionMessage`. A Dance reference
timeline contains normalized reference points only; coaching responses contain
semantic categories, confidence, rep counts, and aggregate results.

## Architecture and rule versions

| Area | Candidate decision |
|---|---|
| Modes | `motion-game`, `dance-coach`, `tennis-coach` |
| Dance rules | `dance-rules-1.1.0`; 100 ms sample interval; 0.55 minimum confidence; 250 ms early/late boundary; 1 MiB timeline ceiling |
| Tennis rules | `tennis-rules-1.1.0`; 0.55 minimum confidence; ordered authored phase templates only |
| Dance output | Reference-relative `on-time`, `early`, `late`, `form-mismatch`, or `low-confidence`; arms/torso/legs only; no more than two final cues |
| Tennis output | Shadow Serve: ready → trophy → reach proxy → follow-through. Shadow Forehand: ready → unit turn → load → contact-zone proxy → finish |
| Coaching AI | None. Coaching decisions and copy are deterministic. Existing schema-governed AI remains limited to Motion Game blueprints. |
| Persistence | Aggregate coach summary in local storage plus versioned calibration in session storage for the exact session; no media or raw landmark persistence |
| Transport | Existing private Supabase Broadcast relay with same-device development fallback; normalized Dance timeline display→phone, identified elapsed control state in both directions, semantic events phone→display; calibration never transmitted |

## Verification results

Final commands use the workspace Node runtime at
`/Users/nayerehrasuli/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin`.

| Command | Result |
|---|---|
| `npm run lint` | PASS; no ESLint findings |
| `npm run typecheck` | PASS; strict TypeScript completed with exit 0 |
| `npm run test` | PASS; 9 files / 27 tests |
| `npm run build` | PASS; production build generated 10 routes including `/coach`, `/coach/dance`, `/coach/tennis`, and `/coach/controller` |
| `npm run test:e2e` | PASS; 6 Chromium tests: 2 unchanged Motion Game tests plus mode selection, paired Dance fixture, Shadow Serve fixture, and Shadow Forehand fixture |
| `npm run verify` | PASS in the unrestricted local test environment; sandbox-only Playwright binding remains `EPERM` on `127.0.0.1:3000` and is an environment limitation |

The coach Playwright flows use clearly labeled deterministic landmark/phase
fixtures. They prove UI, 360 px controller layout, private paired semantic
messaging, shared elapsed-offset behavior, display media play/pause/seek calls,
phone/display/tracking-loss controls, reload recovery, Tennis countdown
cancel/restart by keyboard, ordered rules, aggregate local save, bounded copy,
reduced-motion rendering, axe results, and result behavior. They are
intentionally not described as real-video, real-camera, or physical-device
evidence.

## Deterministic evaluation evidence

- A maximum 90-second Dance fixture produces 900 samples, never exceeds 10 Hz,
  and passes the ≤1 MiB serialized payload assertion.
- Dance fixtures detect seeded ≥250 ms early and late offsets, reject low
  confidence, and name an arms mismatch.
- Dance result aggregation returns no more than two reference-relative cues.
- Clock tests preserve elapsed time across pause/resume, freeze it while
  paused, and map start/pause/resume/stop to display media at the shared offset.
- Calibration tests bind records to an exact session and prove the captured
  comfortable range changes both Dance and Tennis deterministic thresholds.
- Serve and forehand fixtures classify every supported phase in order.
- Low-confidence and out-of-order tennis traces do not produce a scored rep.
- Tennis feedback requires an issue in at least two of three qualified reps and
  returns no more than two cues.
- The automated Dance UI fixture is 101 normalized samples / approximately
  30 KiB and is labeled as synthetic in both UI and evidence documentation.

## Accessibility and responsive evidence

- Mode selection, both Tennis display/controller paths, and the Dance phone
  controller have zero serious/critical axe findings in Chromium.
- Coach setup, file input, consent, handedness, drill choice, camera controls,
  calibration, pause/end, fixture controls, and results use native keyboard
  controls and live status regions.
- Dance and Tennis automation run with `prefers-reduced-motion: reduce`.
- Coach phone flows run at 360 × 780; display flows use the default 1280-class
  Playwright viewport.
- Generated fixture screenshots are under `evidence/package-1.1/` and explicitly
  disclaim real-device or coaching-accuracy proof.

Manual screen-reader, TV-distance, contrast, physical 360 px phone, and broader
browser/device checks remain Stage 03 evidence debt.

## Requirement status

| ID | Status | Candidate evidence / remaining debt |
|---|---|---|
| `P-01` | BLOCKED | Existing semantic round passes; fresh physical-camera create→play trace remains. |
| `FUNC-01` | BLOCKED | Fresh prompt code and live camera paths exist; physical live-input trace remains. |
| `GAME-01` | PASS | Engine/session tests and complete multiplayer Playwright round pass. |
| `PAIR-01` | REWORK | Private cross-context pairing passes; physical devices and reconnect trace remain. |
| `VISION-01` | BLOCKED | Local MediaPipe path exists; physical-phone recognition/network trace remains. |
| `CAL-01` | BLOCKED | Inspectable neutral/range records and threshold use pass deterministically; real comfortable-range capture remains. |
| `UX-01` | REWORK | Review/accept exists; full edit/regenerate/discard keyboard contract remains baseline debt. |
| `A11Y-01` | REWORK | Automated keyboard/axe pass; manual matrix remains. |
| `QA-01` | REWORK | Actionable states exist; physical permission/tracking/reconnect recovery evidence remains. |
| `AI-01` | PASS | Existing schema, allow-list, timeout, invalid-output rejection, and fallback remain green. |
| `EVAL-01` | REWORK | Existing ten-prompt model corpus and measured report remain baseline debt. |
| `HUMAN-01` | REWORK | Approval gate exists; complete edit/override persistence remains baseline debt. |
| `PROV-01` | REWORK | Existing generator provenance exists; full edit/calibration record remains baseline debt. |
| `PRIV-01` | PASS (bounded) | Transport/static and prior browser audit show semantic-only data; physical-camera trace remains under `VISION-01`. |
| `ECON-01` | REWORK | Fallback passes; measured AI and controller p50/p95 remain. |
| `SAVE-01` | PASS | Game result/replay and aggregate coach-summary local save pass. |
| `MODE-01` | PASS | All three modes are reachable with truthful descriptions and keyboard links. |
| `REG-01` | PASS (automation) | Existing 13 baseline tests and 2 game E2E scenarios remain in the expanded 21-test/6-E2E suite; physical regression trace remains. |
| `DANCE-01` | IMPLEMENTED / DEVICE DEBT | Real local MP4/WebM validation, decode, duration, extraction, multi-person and low-visibility rejection implemented; fresh real clip trace remains. |
| `DANCE-02` | PASS (fixtures) | Scale/orientation/visibility normalization, ≤10 Hz sampling, and payload ceiling tested. |
| `DANCE-03` | PASS (fixtures) | Paired semantic flow, shared elapsed offset, media seek/play/pause, and early/late/form rules tested; synchronized physical-camera run remains. |
| `DANCE-04` | PASS (fixtures) | Live cue and result UI limit output to two confidence-qualified observations. |
| `TENNIS-01` | PASS (fixtures) | Handedness plus both bounded shadow drills complete three paired semantic reps; physical drills remain. |
| `TENNIS-02` | PASS (fixtures) | All ordered phases classify; noisy/out-of-order/low-confidence evidence is unscored. |
| `TENNIS-03` | PASS (fixtures) | Repeated-issue threshold and two-cue ceiling tested. |
| `COACH-PAIR-01` | PASS (automation) | Display setup/reference/results and phone consent/camera/rules are separated; either peer can control the shared clock and reload recovery passes; physical recovery remains. |
| `COACH-PRIV-01` | PASS (code boundary) | No raw media/raw user-landmark message shape or persistence path exists; physical browser network audit remains. |
| `COACH-TRUTH-01` | PASS | Copy states estimated 2D/reference-relative/shadow limits and excludes prohibited claims. |
| `COACH-A11Y-01` | REWORK | Tennis countdown keyboard/cancel/restart, reduced-motion, axe, and 360 px automation pass; manual screen-reader/TV checks remain. |
| `COACH-QA-01` | REWORK | Unsupported/decode/visibility/camera/tracking states and deterministic reload recovery are actionable; physical backgrounding/disconnect recovery remains. |
| `COACH-EVAL-01` | PASS (fixtures) | Versioned Dance and Tennis deterministic traces meet frozen thresholds. |
| `COACH-PERF-01` | REWORK | 90-second payload and deterministic shared-offset continuity pass; extraction duration, physical clock drift, and network p50/p95 remain unmeasured. |

## Privacy and claim audit

Supported candidate claims:

- Three first-class modes exist while the original Motion Game remains.
- Local Dance references are decoded and pose-sampled in the display browser.
- Coaching decisions use deterministic confidence-qualified 2D rules.
- The peer protocol contains normalized reference data and semantic coaching
  events, not raw phone-camera media, raw user landmarks, or reference bytes.
- Automated fixture tests cover bounded timing/form and shadow-phase behavior.

Not yet supported:

- Real-device coaching accuracy, effectiveness, mastery, health, safety, injury
  prevention, biomechanics, ball/racket behavior, or professional instruction.
- A fresh real-clip Dance completion or physical Tennis completion.
- Physical network privacy, extraction-duration, clock-sync, or latency claims.
- Full Package 1.0 or 1.1 release readiness.

## Exact Stage 03 recheck scope and stop condition

Keep the project in **Stage 02**. Route the new immutable repair commit to a
fresh Stage 03 verifier. Stage 03 must first recheck the repaired surfaces:

1. Re-run `npm run verify` and inspect the paired Dance assertions for display
   media play/pause/current-time, shared elapsed/comparison offset continuity,
   phone-originated controls, tracking-loss pause, and reload recovery.
2. Inspect one neutral plus one comfortable-range capture, its session-only
   record/key, absence from `SessionMessage`, and actual Dance/Tennis threshold
   consumption.
3. Re-run Tennis keyboard countdown announcement, cancellation past the
   original timer, restart, reduced-motion, display/controller axe, ordered
   reps, and low-confidence/out-of-order unit coverage.

Stage 03 must then complete the unchanged physical evidence scope:

4. Reproduce the unchanged private multiplayer Motion Game on a physical phone
   and TV/display.
5. Select a new supported 10–90 second local clip, complete real display-side
   extraction and real phone-camera comparison, force tracking loss/recovery,
   and inspect the final bounded Dance cues.
6. Complete three confidence-qualified physical reps for Shadow Serve and
   Shadow Forehand, plus low-confidence/out-of-order rejection.
7. Capture the browser network trace proving no raw media, reference bytes, raw
   user landmarks, audio, or face identity leaves its originating browser.
8. Measure extraction duration, clock behavior, and coaching semantic-event
   p50/p95 on a named device/browser/network; require p95 <200 ms.
9. Complete the manual screen-reader, reduced-motion, 360 px phone, 1280 px
   display, TV-distance, disconnect/reconnect, and backgrounding matrix.

Do not deploy, publish, or advance to Stage 04 from this report.
