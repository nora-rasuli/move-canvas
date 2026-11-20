# Package 1.1 Independent Validation Report

## Decision

**Overall verdict: REWORK**

**Candidate:** `7374066d6f99be7d7d3660362a849bd978b13d32`  
**Package:** `project-package.md`, version 1.1 frozen  
**Validation date:** 2026-11-19, America/Los_Angeles  
**Stage decision:** **Do not advance this candidate to Stage 04 automated audit.**

The candidate has a strong automated baseline: lint, TypeScript, all 21 unit
tests, production build, all six Playwright scenarios, and the aggregate
`verify` command pass independently. The three modes are present, the
deterministic dance and tennis rule tests pass, fixture evidence is honestly
labeled, and the inspected message boundary contains semantic coaching data
rather than raw media.

However, independent browser instrumentation found a real paired Dance Coach
control defect: pause stops the display video, but resume does not restart it,
ending from the phone does not stop it, and the phone restarts its elapsed
comparison clock from zero on resume. Source inspection also found that
"calibration" records no personal range and that Tennis Coach has no countdown.
These are implementation gaps against the frozen package, separate from the
still-missing physical-device and manual evidence. A new immutable candidate is
required after repair and revalidation.

## Scope and verdict vocabulary

This review checked the exact commit above, not the working tree after later
changes. It independently ran the declared checks, inspected the Package 1.1
implementation and schemas, viewed all committed evidence images, exercised a
paired browser flow with transport/media instrumentation, and probed the live
Supabase Realtime boundary. `validation-report.md` was treated as the preserved
Package 1.0 report and was not changed.

- **PASS:** the acceptance check is supported by independently reproduced
  evidence within the candidate's testable scope.
- **REWORK:** implementation or verification is materially incomplete, or an
  observed defect contradicts the requirement.
- **BLOCKED:** the frozen acceptance check depends on fresh physical-device,
  live-camera, real-video, or manual evidence that this environment cannot
  honestly substitute.

A BLOCKED verdict does not imply the implementation is broken. It means the
required claim is not yet evidenced. Conversely, the overall REWORK decision
does not come only from blocked physical evidence; it is driven by reproducible
local implementation defects.

## Independent automated reproduction

Environment: Node.js `24.22.3`; Next.js `16.4.6`; installed and current npm
package `ai@7.0.177`.

| Check | Result | Independently observed detail |
|---|---|---|
| Exact candidate | PASS | `git rev-parse HEAD` matched `7374066d6f99be7d7d3660362a849bd978b13d32`; the tree was clean before validation. |
| `npm run lint` | PASS | No lint errors. |
| `npm run typecheck` | PASS | No TypeScript errors. |
| `npm run test` | PASS | 7 files, 21 tests. |
| `npm run build` | PASS | Production build completed; 10 application routes were emitted. |
| `npm run test:e2e` | PASS | 6/6 Playwright scenarios in 19.3 s. Individual observed durations: mode selection 0.924 s; Dance fixture 2.0 s; Serve fixture 1.7 s; Forehand fixture 1.8 s; existing multiplayer round 15.3 s; game axe/keyboard 2.6 s. |
| `npm run verify` | PASS | Re-ran tests, build, and 6/6 Playwright scenarios; E2E portion completed in 19.0 s. |

The Playwright suite rewrites committed evidence screenshots and Next's
generated `next-env.d.ts`. Those test-generated changes were restored byte-for-
byte from the candidate after inspection; no implementation file was changed
during validation.

## Flow and evidence results

### Mode selection and fixture flows

- Motion Game, Dance Coach, and Tennis Coach are presented as three first-class
  modes with bounded, non-medical copy.
- The deterministic Dance fixture reaches paired live feedback and a result.
- Serve and Forehand fixtures reach ordered result states.
- The existing private multiplayer game E2E still passes.
- The five committed screenshots were visually inspected. They show the mode
  surface, 360 px Dance phone surface, Dance result, Serve result, and Forehand
  result. Fixture-specific copy and limitations are visible.
- The evidence README correctly states that fixtures prove layout, copy,
  semantic transport, and deterministic behavior—not real video extraction,
  camera accuracy, or coaching efficacy.

### Dance reference ingestion and deterministic analysis

Code inspection confirms that local MP4/WebM input is loaded with an object
URL, duration is constrained to 10–90 seconds, MediaPipe runs in video mode,
multiple people are rejected, and a normalized timeline is sampled at no more
than 10 Hz. The maximum payload test, low-confidence handling, 250 ms timing
threshold, early/late/form-mismatch rules, named body regions, and two-cue cap
all pass.

An unsupported `.txt` input produced the actionable UI state:

> Choose a local MP4 or WebM reference clip. Choose a different local clip and try again.

The committed E2E does not exercise a real MP4/WebM decode and MediaPipe
extraction. It injects a synthetic normalized timeline. Therefore real
reference ingestion remains a physical/browser evidence blocker rather than a
validated end-to-end claim.

### Tennis ordered rules

The deterministic classifiers and tracker encode the frozen ordered phases:

- Serve: ready → trophy → reach proxy → follow-through.
- Forehand: ready → unit turn → load → contact-zone proxy → finish.

Unit tests cover valid, noisy, and out-of-order traces, confidence gating, and
the repeated-issue rule (at least two of three qualified reps, no more than two
cues). The browser fixture uses a fixture-phase sender rather than the live
classifier. Live left/right camera evidence for both drills is still absent.

## Reproducible implementation findings

### 1. Dance pause/resume/stop loses synchronization

**Severity:** release-blocking for Package 1.1  
**Requirements affected:** DANCE-03, COACH-PAIR-01, COACH-QA-01,
COACH-PERF-01

Independent Chromium instrumentation paired the Dance display and phone,
loaded the deterministic reference, and counted calls to the display media
element:

| Step | `play()` count | `pause()` count |
|---|---:|---:|
| After Start | 1 | 0 |
| After Pause | 1 | 1 |
| After Resume | 1 | 1 |
| After phone End | 1 | 1 |

Resume changes UI state but never calls `video.play()`. A phone-originated End
does not pause the display reference. The display's incoming control handler
only toggles React state. On the phone, `resumeRun()` assigns a fresh
`performance.now()` start time, so the comparison offset restarts at zero
instead of resuming the shared reference position. No clock-sync protocol was
found. Tracking-loss pause has the same display-media issue because it travels
through this control path.

The code locations are `components/coach-display.tsx:95-99` and
`components/coach-display.tsx:149-161`, plus
`components/coach-controller.tsx:202-220`.

**Required repair:** maintain a shared elapsed/paused offset, synchronize the
reference clock across peers, make start/pause/resume/end idempotently control
the display media from either peer, and add paired tests for display- and
phone-originated pause, resume, end, tracking loss, and reconnect.

### 2. Calibration is a boolean confirmation, not personal calibration

**Severity:** release-blocking for frozen calibration claims  
**Requirements affected:** CAL-01, TENNIS-01, COACH-PAIR-01

`confirmCalibration()` checks only whether a full body is visible, then sets a
boolean and displays "neutral range captured." It records no samples, personal
range, derived threshold, calibration version, or comfortable-motion boundary.
This contradicts the frozen requirement that thresholds derive from the
current player's captured range and makes the copy stronger than the behavior.

The relevant implementation is `components/coach-controller.tsx:181-190`.

**Required repair:** either implement and persist an inspectable session-local
calibration record used by the movement thresholds, or narrow the frozen
requirement and UI copy through a new package decision. The current candidate
cannot claim personal calibration.

### 3. Tennis Coach has no countdown

**Severity:** direct frozen-flow omission  
**Requirement affected:** TENNIS-01

No countdown state, UI, or control logic exists in the coaching implementation.
The phone begins classification immediately when Start is pressed. The frozen
TENNIS-01 acceptance check explicitly requires a countdown for both supported
shadow drills.

**Required repair:** add an announced, keyboard-safe, reduced-motion-safe
countdown whose start/cancel/restart behavior is covered in the paired E2E.

### 4. Baseline Package 1.0 evidence debts remain visible

The game regression is green, but the blueprint review surface still does not
demonstrate the full edit, validate, regenerate, discard, persisted override,
provenance, external eval, and measured latency/cost contract. These remain
REWORK items rather than being upgraded by the coaching fixture suite.

## Physical and manual evidence not reproduced

These are kept separate from the defects above. They require honest evidence
from real devices or human inspection and should not be replaced with fixture
screens:

- A fresh non-fixture prompt through a completed paired real-camera Motion Game
  round, including disconnect/reconnect and saved replay.
- A supported newly selected 10–90 second MP4/WebM through local extraction,
  phone comparison, low-confidence/tracking-loss pause, synchronized recovery,
  and final Dance cues on a real phone plus TV/display.
- Three valid reps each for left/right Serve and Forehand on a real phone plus
  display, including noisy/out-of-order, low-confidence, and tracking-loss
  behavior.
- A device matrix with extraction duration, clock-sync behavior, and measured
  p50/p95 semantic-event latency on the named network.
- Manual screen-reader, focus-order, status-announcement, contrast, TV-distance,
  backgrounding, camera-denial, and narrow/wide responsive checks.
- A published network capture from the physical flows demonstrating that raw
  camera frames, raw user landmarks, audio, and reference-video bytes never
  leave their originating browser.

## Message schema, privacy, and Supabase regression

### Static boundary

The inspected coaching union permits session metadata, a normalized reference
timeline, start/pause/resume/stop control, semantic Dance feedback, semantic
Tennis phase/count progress, and aggregate results. It defines no coaching
message for camera pixels, reference-video bytes, audio, face identity, or a
raw user-landmark stream. Schema bounds, confidence bounds, timeline sampling,
and the 1 MiB ceiling are enforced. A static secret scan found no service-role
key, private key, or committed secret pattern; the client uses a public
publishable Supabase key.

The paired browser probe observed two Supabase sockets, a compact Dance
reference message, semantic feedback, zero suspicious media/blob/raw-landmark
payloads, and zero reference-media upload requests. The largest observed
fixture message was 30,354 bytes. Reduced-motion styling computed to `0.00001s`.

### Live Realtime authorization probe

- An unauthenticated join to a valid-format private topic returned
  `CHANNEL_ERROR`.
- An authenticated join to a malformed topic returned `CHANNEL_ERROR`.
- An authenticated join to a valid-format topic subscribed successfully and a
  semantic send succeeded.
- The existing two-controller-plus-display regression E2E passed.

This supports the current possession-code boundary, but it also preserves the
Package 1.0 limitation: any authenticated client that knows a valid 12-character
code can join. No room membership, expiry, attempt throttling, or rate-limit
evidence was available. The available management connection could not inspect
this project's live policy catalog/security-advisor output, so the conclusion
is limited to source inspection and the behavioral probe.

The authorization model is consistent with Supabase's current guidance for
[Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
and [Broadcast](https://supabase.com/docs/guides/realtime/broadcast). The public
client variable treatment is consistent with [Vercel environment variable
guidance](https://vercel.com/docs/environment-variables).

## Accessibility and recovery audit

- Axe passes for mode selection, the 360 px Dance phone fixture, and the
  existing game controller/display flows.
- Native buttons, selects, inputs, labels, live status text, and a skip link are
  present. Reduced motion is implemented and the Dance fixture contexts run
  with reduced motion enabled.
- The Tennis pages do not receive an axe pass in the committed E2E, and coaching
  setup/control is clicked rather than traversed by keyboard assertions.
- No manual screen-reader, contrast, TV-distance, or device focus-order record
  is present.
- Unsupported file handling is actionable, but decode failure, backgrounding,
  pairing loss/reconnect, camera denial, and tracking-loss recovery are not all
  exercised end to end. Tracking-loss pause is also affected by Finding 1.

Accordingly the accessibility and recovery requirements remain REWORK rather
than PASS despite the useful automated baseline.

## Requirement-level verdicts

| ID | Verdict | Independent basis |
|---|---|---|
| P-01 | BLOCKED | No fresh paired real-camera golden-path record. |
| FUNC-01 | BLOCKED | No non-fixture prompt plus live-camera trace proving user-controlled output. |
| GAME-01 | PASS | Deterministic engine unit and paired E2E pass. |
| PAIR-01 | REWORK | Automated pairing passes; physical disconnect/reconnect evidence is absent. |
| VISION-01 | BLOCKED | Static boundary is sound, but allowed moves and frame privacy require live-camera/manual evidence. |
| CAL-01 | REWORK | Calibration is a visibility-gated boolean and does not derive personal thresholds. |
| UX-01 | REWORK | Full edit/validate/regenerate/discard keyboard path is not demonstrated. |
| A11Y-01 | REWORK | Partial axe/reduced-motion coverage passes; complete keyboard/manual evidence is absent. |
| QA-01 | REWORK | Failure coverage is incomplete and paired recovery has a real defect. |
| AI-01 | PASS | Schema/allow-list/rejection tests pass; installed AI SDK usage matches the current `generateText` structured-output pattern. |
| EVAL-01 | REWORK | No independently inspectable versioned 9/10, 10/10, model/config report. |
| HUMAN-01 | REWORK | Review exists, but persisted edit/override authority is not demonstrated. |
| PROV-01 | REWORK | The complete prompt/model/config/validation/edit/calibration record is not retained. |
| PRIV-01 | PASS | Static schema, browser network instrumentation, and Supabase behavioral probe found no raw image/media path. |
| ECON-01 | REWORK | No measured generation cost/p95, controller p95, and fallback profile. |
| SAVE-01 | PASS | Local blueprint/result save and reload regression passes. |
| MODE-01 | PASS | All three first-class modes are reachable and accurately bounded. |
| REG-01 | BLOCKED | Automated Package 1.0 regression passes; frozen evidence also requires a fresh private two-device trace. |
| DANCE-01 | BLOCKED | Unsupported input works, but no real supported clip completed decode/MediaPipe extraction in validation. |
| DANCE-02 | REWORK | Normalization, confidence, sampling, and payload rules exist; lead-side/orientation and visual trace are not fully evidenced. |
| DANCE-03 | REWORK | Early/late/form rules pass, but resume resets the phone clock and does not resume display media. |
| DANCE-04 | PASS | Live/result fixture copy is bounded to two named, confidence-qualified cues. |
| TENNIS-01 | REWORK | Handedness/drills/rep/pause/end exist; countdown is missing and calibration is not real. |
| TENNIS-02 | BLOCKED | Ordered classifiers pass unit traces; required live-device video/screens are absent. |
| TENNIS-03 | PASS | Repeated-issue and low-confidence rules pass unit and E2E fixtures. |
| COACH-PAIR-01 | REWORK | Roles are separated, but phone-originated resume/end do not safely control display playback. |
| COACH-PRIV-01 | PASS | Schemas and instrumented fixture transport contain normalized/semantic data only; no media upload observed. |
| COACH-TRUTH-01 | PASS | Copy consistently limits output to 2D practice cues and disclaims unsupported claims. |
| COACH-A11Y-01 | REWORK | Partial axe/text/reduced-motion evidence passes; complete keyboard, announcement, and manual traces do not. |
| COACH-QA-01 | REWORK | Unsupported input works, but paired pause/recovery is defective and several failure paths lack E2E evidence. |
| COACH-EVAL-01 | REWORK | Frozen fixtures pass, but no complete versioned fixture report plus device matrix is retained. |
| COACH-PERF-01 | REWORK | Timeline size is bounded; clock sync is absent and p50/p95 latency/extraction profiles are missing. |

**Totals:** 9 PASS, 17 REWORK, 6 BLOCKED (32 requirements).

## Safe claims from this candidate

The evidence supports these bounded statements:

- Move Canvas exposes three first-class browser modes with a shared private-code
  pairing concept.
- The game engine and existing automated multiplayer regression pass.
- Dance and tennis fixture rules are deterministic, confidence-gated, and
  capped to short feedback.
- The code is designed to extract a local Dance reference into a normalized
  timeline and to transmit normalized/semantic coaching data rather than raw
  media.
- The candidate passes its declared lint, type, unit, build, Playwright, and
  aggregate verification commands.

It is **not** yet safe to claim a production-ready synchronized Dance session,
personal calibration, complete Tennis drill flow, measured coaching latency,
or real-device coaching validation.

## Required route before Stage 04

1. Repair synchronized Dance control and add paired pause/resume/end/tracking-
   loss/reconnect tests that assert both media position and phone comparison
   offset.
2. Implement real session-local calibration used by thresholds, or formally
   revise the frozen requirement and copy; add the missing Tennis countdown.
3. Exercise a real supported reference clip and the live classifier paths; do
   not use fixture injection as their substitute.
4. Close the baseline editor/provenance/evaluation/performance gaps or explicitly
   re-freeze them before presenting the candidate as Package 1.1 complete.
5. Capture the required physical-device, accessibility, privacy, latency, and
   device-matrix evidence.
6. Produce a new immutable commit and rerun this independent gate. Only a new
   candidate with the implementation findings closed should be considered for
   Stage 04 automated audit.
