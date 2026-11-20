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
- room-code/QR display pairing with a same-device verification transport and an
  optional Supabase Realtime cross-device transport;
- semantic controller events only—raw video is neither stored nor transmitted;
- deterministic game engine primitives and seven passing unit tests.

The complete playable collect-and-dodge round, private production signaling,
device verification, and deployment are still active factory work. This README
does not claim they are complete.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The app remains useful without credentials, but
labels the blueprint as offline and limits pairing to browser contexts on the
same device.

Copy `.env.example` to `.env.local` to configure AI Gateway and Supabase. Use a
Supabase publishable key only; never expose a secret or service-role key.

## Verify

```bash
npm run verify
```

This runs lint, strict TypeScript, Vitest, and the production build.

## Product and evidence contract

The frozen scope, stable requirements, originality decision, and truth rules
live in [project-package.md](project-package.md). The product must not claim
fitness/health outcomes, users, adoption, revenue, novelty, or measured latency
until the corresponding evidence exists.

