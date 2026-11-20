# Move Canvas

Create a personal motion game from a sentence, calibrate comfortable gestures
with a phone camera, and use the phone as the controller for a browser display.

Move Canvas is being built as a functional consumer portfolio product. The
current Stage 02 slice includes:

- fresh prompt input and schema-validated game blueprints;
- Vercel AI Gateway structured generation when configured, with a visible
  deterministic fallback when the provider is absent or unavailable;
- an editable/reviewable blueprint handoff and local persistence;
- live camera permission handling and on-device MediaPipe pose landmarks;
- per-player calibration snapshots for four allow-listed gestures;
- private Supabase Realtime rooms with anonymous authentication, scoped RLS,
  high-entropy room codes, and a same-device fallback for local development;
- multiplayer phone controllers with editable player names, TV join QR,
  per-player and team scores, and a live leaderboard;
- semantic controller events only—raw video is neither stored nor transmitted;
- a complete timed collect-and-dodge round with score, lives, pause/resume,
  early completion, saved result, and replay;
- deterministic engine/session tests plus an isolated three-browser Playwright
  flow (two phone controllers and one display) and automated accessibility gate.

Real-phone camera verification and deployment are still active factory work.
This README does not claim they are complete.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Without Supabase credentials, pairing is limited
to browser contexts on the same device. With the two public Supabase variables,
phones and displays join the same private internet-backed room.

Copy `.env.example` to `.env.local` to configure AI Gateway and Supabase. Use a
Supabase publishable key only; never expose a secret or service-role key.

## Verify

```bash
npm run verify
```

This runs lint, strict TypeScript, Vitest, and the production build.
It also runs the controller/display Playwright flow and axe checks.

## Product and evidence contract

The frozen scope, stable requirements, originality decision, and truth rules
live in [project-package.md](project-package.md). The product must not claim
fitness/health outcomes, users, adoption, revenue, novelty, or measured latency
until the corresponding evidence exists.

