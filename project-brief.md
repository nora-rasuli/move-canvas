# Project Brief — Move Canvas

## Pitch

Move Canvas turns a personal idea into a safe, editable motion game that uses a
phone camera as the controller and a browser-connected TV as the display.

## User and job

- **Primary user:** Household player, parent, or host
- **Situation:** They want an active game that fits the people and room present
- **Pain:** Fixed catalogs do not match the desired theme or comfortable moves;
  editors take too long
- **Outcome:** Create and play a personal game in under five minutes without a
  console, wearable, or uploaded camera video
- **Research basis:** Public product/technical research; no fictional adoption

`As a host, when my family wants a short active game, I need to turn our idea
and comfortable movements into a playable TV challenge so we can play together
now rather than browse a fixed catalog.`

## Success criteria

A first-time evaluator can describe a game, inspect and edit the generated
blueprint, calibrate a real camera, pair a second browser, complete a round,
recover from tracking or connection loss, and retain the playable blueprint and
score.

Technical targets: semantic controller latency p95 below 150 ms on the test
network; valid blueprint output in at least 9/10 frozen prompts; zero raw image
uploads; keyboard-complete non-camera setup; zero serious/critical axe findings;
mobile 360 px and display 1280 px layouts; critical-path E2E coverage.

## Golden path

1. Enter “A space courier where I reach for stars and duck meteors.”
2. AI returns a validated collect-and-dodge blueprint.
3. Review theme, duration, intensity, moves, and safety bounds; edit if desired.
4. Calibrate neutral, left reach, right reach, and duck using the phone camera.
5. Open/pair a display using a short code or QR.
6. Play a 60-second round; tracking loss pauses automatically.
7. Finish with score, movement accuracy, blueprint, and replay action.

## MVP

Must have: real prompt input; schema-constrained generation; visible fallback;
blueprint editor; one collect/dodge engine; local MediaPipe pose detection;
calibration; cross-device pairing; semantic events; pause/reconnect; result;
local saved games; responsive accessible UI; tests and deployment.

Required states: permission, loading, invalid generation, edit validation,
camera unavailable, body not framed, paired, disconnected, paused, reconnecting,
finished, and saved.

Non-goals: arbitrary generated code; multiplayer competition; social feed;
health/fitness claims; raw-video transport; app-store receiver; dozens of game
families; auth, billing, or a public marketplace.

## UX direction

Playful living-room product, not a SaaS dashboard: oversized type, strong game
color, tactile cards, minimal chrome, clear controller/display roles, readable
at TV distance, and deliberate motion. Reduced-motion replaces translation and
camera-like effects with opacity/state changes. Every critical status has text,
not color alone.

## Architecture

- **App:** Next.js + React + strict TypeScript
- **AI:** Vercel AI SDK structured output into a Zod `GameBlueprint`; bounded
  deterministic fallback when unavailable
- **Vision:** MediaPipe Pose Landmarker in the phone browser; video stays local
- **Transport:** WebRTC data channel; minimal signaling service only exchanges
  session descriptions/ICE, never frames
- **Runtime:** Deterministic client engine driven by semantic moves
- **Persistence:** Local IndexedDB/localStorage for blueprints and results in
  the no-sign-up release
- **Deployment:** Vercel; public release only after factory audit

## AI quality boundary

AI selects tested mechanics, movement sequence, theme, pacing, and language.
Schema validation, allow-listed gestures, difficulty ceilings, collision,
scoring, timing, calibration, and runtime state are deterministic. The user is
shown the exact blueprint and approves it before camera setup.

Evaluation covers ten diverse prompts, invalid/unsafe instructions, output
validity, theme adherence, meaningful variation, forbidden gestures, timeout,
provider failure, user edits, provenance, latency, and estimated cost.

## One-week cut line

- **Day 1–2:** Blueprint schema/generation/editor and deterministic engine
- **Day 3:** Working real-camera calibration → same-device playable loop
- **Day 4:** Cross-device pairing, disconnect, and recovery
- **Day 5–7:** tests, accessibility, performance, audit fixes, evidence, deploy
- **Cut first:** Decorative themes and replay visualization
- **Cut second:** QR convenience; retain short-code pairing
- **Never cut:** fresh prompt, real camera control, cross-device display, safety
  validation, recovery, provenance, accessible core flow, tests, and deployment

## Truth rules

Do not claim users, revenue, retention, health impact, novelty, or latency until
measured. Explain that the product is self-directed portfolio work without
labeling it “hypothetical” inside the gameplay experience. Public case-study
research and measured engineering evidence remain factual.

