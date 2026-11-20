# Project Brief — Move Canvas

## Pitch

Move Canvas turns a phone camera and browser-connected TV into a private motion
play system: create a safe editable game, practice against a selected dance
reference, or complete guided shadow tennis drills.

## User and job

- **Primary user:** Household player, parent, host, or individual practicing a
  short movement sequence
- **Situation:** They want active play or private visual practice using devices
  already in the room
- **Pain:** Fixed game catalogs do not match the desired theme or comfortable
  moves, while dance mirrors and generic sports videos do not compare the
  current user's timing/form under current camera conditions
- **Outcome:** Create and play a personal game, compare a dance run with a
  selected reference, or complete a guided shadow serve/forehand without a
  console, wearable, or uploaded camera video
- **Research basis:** Public product/technical research; no fictional adoption

`As a player, when I want a short active session, I need to choose play, dance
practice, or tennis practice and use my phone camera privately with clear TV
guidance so I can act now instead of assembling multiple apps or equipment.`

## Success criteria

A first-time evaluator can choose one of three modes and complete it on a real
paired phone and display. Motion Game retains the complete Package 1.0 loop.
Dance Coach accepts a new supported local reference clip, builds a local pose
timeline, compares a live camera run, and returns confidence-qualified timing/
form cues. Tennis Coach completes three valid reps of both a shadow serve and a
shadow forehand and returns repeated phase/timing cues. Each mode recovers or
stops safely on tracking, media, or connection loss.

Technical targets: semantic controller latency p95 below 150 ms on the test
network; valid blueprint output in at least 9/10 frozen prompts; zero raw image
uploads; keyboard-complete non-camera setup; zero serious/critical axe findings;
mobile 360 px and display 1280 px layouts; critical-path E2E coverage. Package
1.1 also requires no camera/reference-media/raw-landmark transmission; dance
fixture detection of seeded ≥250 ms timing offsets and named body-region
mismatches; ordered phase classification for frozen serve/forehand traces; and
real paired-device completion without claiming population-level accuracy. A
maximum-duration normalized reference timeline must stay at or below 1 MiB;
semantic coaching events target p95 below 200 ms on the recorded test network,
with extraction duration and device conditions disclosed rather than generalized.

## Motion Game golden path

1. Enter “A space courier where I reach for stars and duck meteors.”
2. AI returns a validated collect-and-dodge blueprint.
3. Review theme, duration, intensity, moves, and safety bounds; edit if desired.
4. Calibrate neutral, left reach, right reach, and duck using the phone camera.
5. Open/pair a display using a short code or QR.
6. Play a 60-second round; tracking loss pauses automatically.
7. Finish with score, movement accuracy, blueprint, and replay action.

## Dance Coach golden path

1. Choose Dance Coach on the TV/display and select a local 10–90 second MP4/
   WebM or same-origin curated clip.
2. The display extracts a single-person normalized pose timeline locally and
   explains any unsupported/low-visibility input instead of guessing.
3. Pair the phone, choose lead/mirror orientation, grant camera access, and
   calibrate whole-body framing and comfortable range.
4. Play the reference on the TV. The phone compares local user landmarks with
   the synchronized normalized timeline and sends semantic scores/cues only.
5. Finish with confidence-qualified timing/form feedback limited to two clear
   observations and an option to repeat or discard.

## Tennis Coach golden path

1. Choose handedness and Shadow Serve or Shadow Forehand on the TV/display.
2. Pair the phone, complete clear-space/framing checks, and calibrate.
3. Follow authored phase prompts while the phone identifies ordered pose phases
   locally; no ball or racket is required or analyzed.
4. Complete three confidence-qualified reps. Unclear or out-of-order attempts
   remain unscored.
5. Receive no more than two issues that repeated in at least two valid reps,
   then repeat, switch drill, or stop.

## MVP

Must have: the complete existing game path; first-class mode choice; local
dance-reference decoding and pose timeline; synchronized on-device dance
comparison; one authored shadow serve and one authored shadow forehand; local
phase classification; confidence gating; calibration; cross-device pairing;
semantic events; pause/reconnect; bounded results; responsive accessible UI;
privacy/evaluation evidence; tests and deployment.

Required states: permission, loading, invalid generation, edit validation,
unsupported reference, reference decode/pose failure, multiple/no visible
reference subject, camera unavailable, body not framed, low confidence,
unscored rep, paired, disconnected, paused, reconnecting, finished, saved, and
discarded.

Non-goals: arbitrary generated code; new game families; multiplayer coaching;
social feed; remote/streaming video URLs; cloud media storage; performance-video
recording; face/identity analysis; music-beat or artistry grading; backhand,
volley, ball, racket, spin, speed, placement, force, 3D biomechanics, medical,
health, injury-prevention, or professional-coaching claims; app-store receiver;
auth, billing, or a public marketplace.

## UX direction

Playful living-room product, not a SaaS dashboard: oversized type, strong game
color, tactile cards, minimal chrome, clear controller/display roles, readable
at TV distance, and deliberate motion. Reduced-motion replaces translation and
camera-like effects with opacity/state changes. Every critical status has text,
not color alone.

## Architecture

- **App:** Next.js + React + strict TypeScript
- **AI:** Vercel AI SDK structured output into a Zod `GameBlueprint`; bounded
  deterministic fallback when unavailable; no generative coaching decisions
- **Vision:** MediaPipe Pose Landmarker in the browser where each video
  originates; phone camera video and display reference video stay local
- **Transport:** WebRTC data channel; minimal signaling service only exchanges
  session descriptions/ICE; peers exchange normalized reference landmarks and
  semantic events, never raw media or raw user landmark streams
- **Runtime:** Deterministic game engine plus deterministic dance comparison and
  tennis phase/rep analyzers driven by confidence-qualified pose data
- **Persistence:** Local IndexedDB/localStorage for game artifacts and optional
  aggregate coaching summaries; no raw media or raw landmark persistence
- **Deployment:** Vercel; public release only after factory audit

## AI quality boundary

For Motion Game, AI selects tested mechanics, movement sequence, theme, pacing,
and language.
Schema validation, allow-listed gestures, difficulty ceilings, collision,
scoring, timing, calibration, and runtime state are deterministic. The user is
shown the exact blueprint and approves it before camera setup.

Dance and tennis scoring/feedback decisions are deterministic in Package 1.1.
The product reports 2D pose/timing similarity and coarse shadow-movement phases
under current visibility and camera placement. It does not infer anatomical
truth, coaching effectiveness, injury risk, ball/racket behavior, or expert
technique.

Evaluation covers ten diverse prompts, invalid/unsafe instructions, output
validity, theme adherence, meaningful variation, forbidden gestures, timeout,
provider failure, user edits, provenance, latency, and estimated cost.

## Package 1.1 one-week cut line

- **Day 1:** Lock game regression; coach schemas and fixtures
- **Day 2–3:** Local dance timeline, synchronization, comparison, feedback
- **Day 4:** Shadow serve/forehand phases, reps, repeated-issue feedback
- **Day 5:** Shared TV/phone UI, confidence states, pause/recovery
- **Day 6–7:** tests, privacy/accessibility/device evidence, fixes, claim audit
- **Cut first:** History, replay overlays, heatmaps, curated clip library
- **Cut second:** Audio polish, drill variants, QR convenience
- **Never cut:** existing game regression; one complete dance path; both stated
  tennis drills; local-only raw media; confidence and unsupported states;
  cross-device display; recovery; accessible core flow; tests and evidence

## Truth rules

Do not claim users, revenue, retention, health impact, injury prevention,
professional coaching, biomechanics, ball/racket analysis, pose accuracy on a
population, novelty, or latency until the corresponding claim is independently
measured and appropriate. Dance feedback is relative to the selected reference;
tennis feedback covers coarse shadow phases only. Explain that the product is
self-directed portfolio work without labeling it “hypothetical” inside the
experience. Public case-study research and measured engineering evidence remain
factual.

