# Move Canvas

Move Canvas is a browser-based motion experience with three bounded modes:

- **Motion Game** turns a sentence into a schema-validated collect-and-dodge blueprint. The player reviews and edits the blueprint, calibrates comfortable movements, pairs a display, and plays with a phone camera.
- **Dance Coach** compares estimated 2D pose and timing with a user-selected 10–90 second local reference clip.
- **Tennis Coach** recognizes coarse phases in a ball-free, racket-free shadow serve or shadow forehand.

Raw phone-camera frames, raw user landmarks, reference-video bytes, audio, and face identity stay in the browser where they originate. Coaching output is deterministic practice feedback, not medical, injury-prevention, biomechanics, ball/racket, or professional-coaching analysis.

**Live production:** <https://move-canvas.vercel.app>

## Current release boundary

Package 1.1 is deployed from verified commit `5f94a5e946c12434a05908179a0193ee2804e3b2`. The production gate covers all declared routes, private-room authorization and isolation, deterministic analysis, keyboard paths, reduced motion, serious/critical axe checks, unit tests, production build, the live Blueprint API, and multi-context Playwright flows.

The repository does **not** claim physical-device validation, measured performance, WCAG conformance, coaching effectiveness, or medical/biomechanical outcomes. A fresh physical phone/camera/TV matrix, real reference-media extraction profile, assistive-technology review, and network latency/privacy capture remain evidence debt. See [`project-package.md`](project-package.md), [`validation-report-1.1-recheck-2.md`](validation-report-1.1-recheck-2.md), and [`publish-report-1.1.md`](publish-report-1.1.md).

## Architecture

| Boundary               | Implementation                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| App                    | Next.js App Router, React, strict TypeScript                                                                                      |
| Motion-game generation | Vercel AI Gateway structured output validated by Zod; explicit deterministic fallback when unavailable                            |
| Vision                 | MediaPipe Pose Landmarker loaded in the originating browser                                                                       |
| Runtime                | Deterministic game, dance-comparison, tennis-phase, calibration, and clock state machines                                         |
| Pairing                | Anonymous-authenticated private Supabase Realtime Broadcast rooms; same-device `BroadcastChannel` fallback for local verification |
| Persistence            | Local blueprint, provenance, result, and aggregate coaching summary; session-scoped calibration                                   |
| Data sent to the peer  | Validated blueprint/game state, normalized reference timeline, semantic movement/phase/confidence events, and aggregate result    |

All persisted blueprints, calibration profiles, player records, and inbound room messages are schema-validated before use. Possession of a high-entropy 12-character room code grants access to its short-lived private topic; the included RLS policy limits anonymous authenticated clients to correctly shaped Move Canvas Broadcast topics.

## Local setup

Requirements: Node.js 20.9 or newer and npm.

```bash
npm ci
npx playwright install chromium
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. No credentials are required for the deterministic blueprint fallback or same-device pairing.

Optional variables:

| Variable                               | Purpose                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `AI_GATEWAY_API_KEY`                   | Enables structured Motion Game blueprint generation                          |
| `AI_MODEL`                             | Gateway model identifier; defaults to the value documented in `.env.example` |
| `SITE_URL`                             | Canonical origin for social metadata outside Vercel                          |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL for cross-device private rooms                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public browser key; never use a secret or service-role key                   |

Apply [`supabase/realtime-policies.sql`](supabase/realtime-policies.sql) only to the intended owner-controlled Supabase project. Before testing cross-device rooms:

1. enable anonymous sign-ins;
2. disable Realtime **Allow public access** so every channel join is checked against `realtime.messages` RLS;
3. apply the two Broadcast policies and confirm no broader permissive policy remains; and
4. verify unauthenticated and malformed-topic joins fail, while an authenticated valid topic can send and receive only within that exact topic.

Anonymous users use the `authenticated` Postgres role and are durable Auth records. Supabase documents an IP-based limit of 30 anonymous sign-ins per hour and does not provide automatic anonymous-user cleanup. This release has no verified CAPTCHA/bot-control setting or automated retention job; those are documented public-abuse and operational limitations rather than hidden assurances.

## Routes

| Route               | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `/`                 | Motion Game creator, editable review, and product framing |
| `/calibrate`        | Local motion-game camera calibration                      |
| `/pair`             | Phone controller and display pairing                      |
| `/display/[code]`   | TV/browser Motion Game display                            |
| `/coach`            | Three-mode selection                                      |
| `/coach/dance`      | Local-reference Dance Coach display                       |
| `/coach/tennis`     | Shadow-practice Tennis Coach display                      |
| `/coach/controller` | Paired phone camera for coaching modes                    |

Controller, calibration, room, display, and API routes are excluded from search indexing. Public product routes include route metadata and a generated social card.

## Quality gates

```bash
npm run format       # write Prettier formatting
npm run format:check # verify formatting without writes
npm run lint
npm run typecheck
npm run test         # deterministic unit and schema-boundary tests
npm run build
npm run test:e2e     # multi-context Chromium flows and axe checks
npm run verify       # complete release-critical chain
npm audit
```

The GitHub Actions workflow installs Chromium and runs the same complete `verify` chain plus a high-severity dependency audit. Playwright can refresh retained evidence screenshots, so release verification should run in a disposable checkout and compare the retained source manifest before accepting changes.

## Release operations checklist

1. Keep only the public Supabase URL and publishable client key in browser-exposed Vercel variables; never add a service-role or secret key.
2. Verify anonymous Auth and private Realtime policies against the exact Supabase project.
   Confirm **Allow public access** is disabled and public-launch abuse controls are configured.
3. Run `npm ci`, `npm audit`, and `npm run verify` from a clean checkout before any new deployment.
4. Verify production headers, metadata, route recovery, Blueprint API behavior, private-room isolation, and deployment-scoped error/5xx logs.
5. Promote only an explicitly verified deployment and retain an exact rollback plan.
6. Complete the physical device, network, screen-reader, contrast, rotation/backgrounding, and TV-distance evidence matrix before making corresponding claims.
7. No repository license is inferred or added by this release.

Do not publish adoption, health, injury-prevention, professional-coaching, biomechanics, ball-flight, racket-analysis, coaching-effectiveness, or measured latency claims without corresponding independent evidence.
