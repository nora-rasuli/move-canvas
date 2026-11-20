# Weekly Project Package — Move Canvas

## Package identity

- **Project:** Move Canvas
- **Version:** 1.3 frozen
- **Target:** One-week functional public release
- **Opportunity:** OPP-2026-014
- **Portfolio gap:** Interactive B2C game, real-time computer vision, peer
  connection, AI structured generation, playful visual design
- **Primary signals:** React/TypeScript product engineering; AI governance;
  real-time browser systems; accessibility and verification

## Product in 30 seconds

Move Canvas has three first-class modes that share the same private phone-camera
controller and paired TV/browser display. In **Motion Game**, a player describes,
reviews, calibrates, and plays a bounded generated collect-and-dodge game. In
**Dance Coach**, the display analyzes a locally selected reference clip into a
pose timeline, while the phone compares the player's on-device pose and timing
against that timeline. Dance and movement practice is organized into salsa,
hip-hop, contemporary, and yoga/mobility focuses. In **Tennis Coach**, the
phone guides confidence-qualified forehand, backhand, serve, or volley shadow
practice. Raw landmarks and user-supplied reference video are never sent to a
server or peer. A player may separately opt in to an encrypted peer-to-peer
live camera view on the paired display; it is not uploaded or stored.

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
| PRIV-01 | Camera privacy | Raw landmarks stay local; signaling/game transport contains no image payload. Coaching video reaches the paired display only through an explicit, encrypted peer-to-peer live-view opt-in and is not stored. | Code + network audit |
| ECON-01 | Cost/latency | Generation target p95 <8 s and ≤$0.02; controller p95 <150 ms; fallback verified | Measured profile |
| SAVE-01 | Retained useful output | Blueprint and result save locally and can be replayed | Reload E2E |
| MODE-01 | First-class mode selection | Motion Game, Dance Coach, and Tennis Coach are reachable, described accurately, and preserve mode state through setup | Keyboard E2E + screens |
| REG-01 | Existing game preservation | The Package 1.0 create → review → calibrate → pair → play → save path and private multiplayer behavior remain passing | Existing unit + E2E + two-device trace |
| DANCE-01 | Local reference ingestion | A same-origin curated clip or locally selected MP4/WebM, 10–90 seconds, produces an in-browser reference pose timeline or an actionable unsupported-input state | Fixture + browser E2E + network audit |
| DANCE-02 | Reference normalization | Reference landmarks are normalized for scale, orientation, visibility, and selected lead side, then sampled at no more than 10 Hz; low-confidence frames are excluded | Unit fixtures + visual trace |
| DANCE-03 | Timed pose comparison | The phone compares the player's local pose stream with the synchronized reference timeline and distinguishes on-time, early, late, and form-mismatch states without uploading frames | Deterministic traces + paired-device E2E |
| DANCE-04 | Actionable dance result | During and after a run, the user receives at most two clear timing/form cues, named by body region and qualified by confidence | UI E2E + copy audit |
| TENNIS-01 | Guided shadow drills | The user can choose handedness and forehand, backhand, serve, or volley practice with framing, calibration, countdown, rep count, and pause/stop | Paired-device E2E + screens |
| TENNIS-02 | Deterministic phase analysis | Each supported drill advances through its declared coarse phase order only from visible, confidence-qualified pose evidence | Unit traces + live-device video/screens |
| TENNIS-03 | Repeated-issue feedback | Feedback is emitted only when an issue repeats in at least two of three confidence-qualified reps; low-confidence reps remain unscored | Unit + E2E |
| COACH-PAIR-01 | Phone and TV coaching roles | TV owns mode/reference/instruction/result presentation; phone owns camera, calibration, comparison/classification, confidence, and consent; either peer can pause or end safely | Two-context E2E + two-device trace |
| COACH-PRIV-01 | Coaching data boundary | Raw landmarks, user-selected reference-video bytes, and raw audio never leave their originating browser. Live camera video reaches only the paired display after explicit phone consent through WebRTC and is never stored. | Code inspection + network audit |
| COACH-LIVE-01 | Player self-view | The phone user can explicitly start or stop an encrypted peer-to-peer camera view on the paired TV; failure does not block practice | Two-context WebRTC E2E + physical devices |
| PRACTICE-01 | Clear practice choice | Dance/movement offers salsa, hip-hop, contemporary, and yoga/mobility; Tennis offers forehand, backhand, serve, and volley before reference selection | Keyboard E2E + copy audit |
| CAL-HANDS-01 | Hands-free calibration | One tap arms a five-second countdown; full-body neutral/range capture completes automatically with visible and spoken status | Browser E2E + physical device |
| COACH-TRUTH-01 | Truthful coaching claims | UI labels output as 2D pose-based practice cues, exposes confidence/limitations, and makes no medical, injury-prevention, professional-coaching, ball-flight, racket-face, or biomechanical-accuracy claim | Copy audit + screenshots |
| COACH-A11Y-01 | Accessible coaching setup | Mode choice, consent, handedness, calibration, drill controls, feedback, and results are keyboard reachable and announced; visual cues have text/audio-independent equivalents | axe + keyboard + manual |
| COACH-QA-01 | Coaching failure and recovery | Unsupported video, decode/pose failure, poor framing, low confidence, disconnect, backgrounding, and tracking loss pause or recover with an actionable state | Failure E2E + screenshots |
| COACH-EVAL-01 | Frozen coaching evaluation | Dance traces identify ≥250 ms early/late offsets and seeded body-region mismatches; tennis fixtures classify all supported ordered phases and reject noisy/out-of-order traces; recorded config and device evidence are retained | Versioned fixture report + device matrix |
| COACH-PERF-01 | Bounded coaching transport | A 90-second normalized reference timeline is ≤1 MiB; live semantic coaching events reach the display at p95 <200 ms on the recorded test network; extraction duration is measured and disclosed | Payload test + latency profile + device matrix |

## Frozen decisions

| Decision | Choice | Reopen only if |
|---|---|---|
| Scope | Preserve Motion Game and provide focused dance/movement and four-skill shadow-tennis practice | Any first-class golden path cannot remain complete |
| Data | Fresh prompt, camera landmarks, semantic events; no uploaded video | Privacy requirement cannot be met |
| Architecture | Next.js, AI SDK for game blueprints only, MediaPipe on each originating device, deterministic coach analyzers, WebRTC data channel, minimal signaling | Spike proves a component infeasible |
| AI boundary | Schema blueprint only; no generated code or remote pose inference | Evaluation disproves useful variation |
| Coach boundary | No generative AI in v1.1 dance/tennis scoring or feedback decisions; deterministic pose/timing rules only | A later measured evaluation justifies reopening |
| Safety | Allow-list + personal calibration + deterministic ceilings; coaching stops on low confidence and never presents health or injury claims | Real-device tests expose unsafe behavior |
| Persistence | Local saved game/results and local coaching summaries; no raw media persistence and no auth | Cross-device continuation becomes mandatory |
| Device roles | Paired TV presents reference/instructions/results and an optional consented live player view; phone performs analysis and controls video consent | Real-device usability makes pairing infeasible |
| Visual direction | Expressive living-room game and calm, legible coaching surfaces; not a dashboard | TV-distance usability fails |

## Cut order

1. Cut coaching history, replay overlays, per-joint heatmaps, and saved derived
   reference timelines; retain an in-session result summary.
2. Cut optional curated dance clips, audio cue polish, and drill variation;
   retain one local dance-video path, one shadow serve, and one shadow forehand.
3. Cut QR convenience and retain accessible code pairing.
4. Do not add backhand, ball/racket tracking, arbitrary video URLs, cloud media,
   generative coaching, accounts, sharing, or health/biomechanics claims.
5. Never cut the existing game regression gate, either coaching golden path,
   local-only media boundary, confidence/unsupported states, paired display,
   calibration, deterministic evaluation, recovery, accessibility, critical
   tests, or deployable build.

## Mode flows and device contract

### Dance Coach

1. On the TV/display, choose Dance Coach and select a same-origin curated clip
   or a local MP4/WebM between 10 and 90 seconds.
2. The display decodes the clip and extracts a normalized pose timeline locally.
   Unsupported, low-visibility, multi-person, or decode-failed clips are rejected
   with a specific reason; arbitrary remote URLs are not accepted. The timeline
   is sampled at no more than 10 Hz and must remain within the 1 MiB transport
   ceiling for the maximum supported duration.
3. Pair the phone, grant camera permission, choose lead/mirror orientation, and
   complete whole-body framing plus neutral-range calibration.
4. The display sends only the compact normalized reference timeline and clock
   synchronization messages to the phone. The raw reference clip stays on the
   display.
5. During playback, the phone compares local user landmarks against the
   synchronized timeline, pauses on tracking loss, and sends only semantic
   timing/form/confidence events to the display.
6. The display presents restrained live cues and an in-session result with up
   to two actionable observations. The result is practice feedback, not a
   judgment of dance quality or professional instruction.

### Tennis Coach

1. On the TV/display, choose Tennis Coach, handedness, and either Shadow Serve
   or Shadow Forehand. The display shows camera-placement and clear-space checks.
2. Pair the phone, grant camera permission, and complete full-body framing and
   comfortable-range calibration. No ball or racket is required or analyzed.
3. The TV demonstrates named phases with simple authored illustrations/text;
   the phone identifies confidence-qualified phase transitions locally.
4. The TV counts only ordered valid reps. Tracking loss, unsafe framing, or an
   out-of-order trace pauses or leaves the rep unscored rather than guessing.
5. After three valid reps, the deterministic rule set reports no more than two
   repeated phase/timing cues and suggests a repeat or stop.

## Data and privacy boundary

- Camera pixels, user-performance video, face identity, raw audio, and full raw
  landmark streams remain in the phone process and are neither persisted nor
  transmitted.
- A user-selected reference video remains in the display browser. The app does
  not upload, persist, re-host, fingerprint, or transfer the file to the phone.
- Only a normalized, time-indexed reference landmark timeline may travel from
  display to phone. Only semantic phase/timing/form categories, confidence,
  rep counts, and aggregate results may travel from phone to display.
- Signaling transports room/session metadata only. Debug logging must exclude
  media blobs, object URLs, raw landmarks, and personally identifying imagery.
- Locally saved coaching summaries contain mode, drill/clip label, timestamp,
  aggregate scores, and final cues only. Saving is explicit and can be skipped.

## Truthful claims

- MediaPipe supplies estimated 2D/normalized body landmarks; it does not prove
  anatomical joint angles, force, balance, injury risk, or expert technique.
- Dance comparison reports relative pose/timing similarity to the selected
  reference under current camera conditions; it does not grade artistry,
  musicality, identity, or mastery.
- Tennis analysis recognizes coarse shadow-movement phases from body pose. It
  cannot verify ball contact, racket path/face, spin, speed, placement, or
  competitive readiness.
- v1.1 coaching uses deterministic thresholds and authored copy. AI remains
  limited to the existing validated motion-game blueprint generator.

## One-week build boundary

| Day | Bounded output |
|---|---|
| 1 | Lock Package 1.0 regression baseline; add mode/session/reference/drill schemas and frozen landmark fixtures |
| 2 | Local dance-video decode, single-person pose extraction, normalization, and actionable rejection states |
| 3 | Clock sync, dance comparison, confidence gates, paired live/result UI |
| 4 | Serve and forehand authored phase templates, classifier, rep qualification, repeated-issue feedback |
| 5 | TV/phone coaching setup, pause/recovery, keyboard and reduced-motion paths |
| 6 | Unit/E2E/privacy/axe passes plus real phone and TV traces for both modes |
| 7 | Fixes, measured evaluation/device matrix, screenshots, claim audit, and Stage 03 handoff |

## Evidence plan

| Evidence | Required record |
|---|---|
| Regression | Existing game unit/E2E results plus a fresh private two-device game trace |
| Dance fixtures | Licensed/self-created or synthetic landmark fixtures with seeded early/late and body-region mismatches; thresholds/config/version recorded |
| Dance live trace | One supported local clip, one phone, one TV/display, whole-body calibration, completed comparison, low-confidence pause, final cues |
| Tennis fixtures | Mirrored left/right serve and forehand sequences, noisy/out-of-order traces, phase and rep decisions recorded |
| Tennis live trace | Three valid reps for each supported drill plus tracking-loss and low-confidence behavior on a real phone/display pair |
| Privacy | Browser network capture and code/log audit proving no media bytes, camera frames, raw landmarks, or reference-video blobs leave the origin |
| Performance | Maximum-duration timeline payload, reference extraction duration by device, clock-sync behavior, and p50/p95 semantic-event latency on the recorded test network |
| Accessibility | axe, full keyboard setup/control/result trace, visible focus, status announcements, reduced motion, 360 px phone and 1280 px display screens |
| Truth | Screenshot/copy inventory with every public claim mapped to measured evidence or labeled as a limitation |

## Publication gates

All three modes must complete with fresh input in a clean session. Dance must
use a newly selected supported clip; tennis must complete both supported shadow
drills; the motion-game Package 1.0 regression must stay green. Camera denial,
unsupported reference media, low confidence, tracking loss, and pairing loss
must recover or stop safely. Raw media and raw landmarks must not leave their
originating device. CI, privacy audit, accessibility checks, and critical
device traces must pass. README and portfolio claims must match measured
evidence; no adoption, health, injury-prevention, professional-coaching,
biomechanical-accuracy, ball-flight, or racket-analysis claims are allowed.

