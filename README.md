# Move Canvas

Move Canvas is a browser-based motion experience with three bounded modes:

- **Motion Game** turns a sentence into a schema-validated collect-and-dodge blueprint. The player reviews and edits the blueprint, calibrates comfortable movements, pairs a display, and plays with a phone camera.
- **Dance Coach** compares estimated 2D pose and timing with bundled licensed human-motion clips or a user-selected 10–90 second local reference clip.
- **Tennis Coach** combines reference-relative 2D comparison with coarse phase recognition for a ball-free, racket-free shadow serve or shadow forehand.

Dance and Tennis sessions end with a transparent 0–100 practice score and a
mode-specific personal best stored only in that browser. The score combines
movement match (35%), timing or phase sequence (25%), completed comparisons or
repetitions (25%), and tracking confidence (15%). It is a deterministic summary
of one 2D camera session—not a global ranking, expert grade, health assessment,
or comparison with other people.

Raw user landmarks, reference-video bytes, and audio stay in the browser where they originate. A coaching player may explicitly opt in to an encrypted peer-to-peer live camera view on the paired display; the stream is not uploaded or stored. Coaching output is deterministic practice feedback, not medical, injury-prevention, biomechanics, ball/racket, or professional-coaching analysis.

Players can keep a game privately in **My Space** or intentionally publish its reviewed blueprint to the shared game library. Published games can be liked and copied into another player's space. Camera media and coaching data are never part of a published game.

**Live production:** <https://move-canvas.vercel.app>

## Current release boundary

Package 1.3 plus the transparent scoring improvement is deployed from verified
commit `17dac88193136169a273f433e00782d0178bfd17`. The production gate covers all
declared routes, private-room authorization and isolation, deterministic
analysis and scoring, keyboard paths, reduced motion, serious/critical axe
checks, unit tests, production build, the live Blueprint API, and multi-context
Playwright flows.

The repository does **not** claim physical-device validation, measured performance, WCAG conformance, coaching effectiveness, or medical/biomechanical outcomes. A fresh physical phone/camera/TV matrix, real reference-media extraction profile, assistive-technology review, and network latency/privacy capture remain evidence debt. See [`project-package.md`](project-package.md), [`validation-report-1.1-recheck-2.md`](validation-report-1.1-recheck-2.md), and [`publish-report-1.1.md`](publish-report-1.1.md).

## Architecture

| Boundary               | Implementation                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App                    | Next.js App Router, React, strict TypeScript                                                                                                                   |
| Motion-game generation | Vercel AI Gateway structured output validated by Zod; explicit deterministic fallback when unavailable                                                         |
| Vision                 | MediaPipe Pose Landmarker loaded in the originating browser                                                                                                    |
| Runtime                | Deterministic game, dance-comparison, tennis-phase, calibration, and clock state machines                                                                      |
| Pairing                | Anonymous-authenticated private Supabase Realtime Broadcast rooms; same-device `BroadcastChannel` fallback for local verification                              |
| Persistence            | Browser-local My Space plus Supabase-backed published games, likes, and library membership; local results, coaching summaries, and scoped personal-best scores |
| Data sent to the peer  | Validated blueprint/game state, normalized reference timeline, semantic movement/phase/confidence events, and aggregate result                                 |

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
| `YOUTUBE_API_KEY`                      | Server-only YouTube Data API key for reference search                        |
| `SITE_URL`                             | Canonical origin for social metadata outside Vercel                          |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL for cross-device private rooms                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public browser key; never use a secret or service-role key                   |

Apply [`supabase/realtime-policies.sql`](supabase/realtime-policies.sql) and [`supabase/community-library.sql`](supabase/community-library.sql) only to the intended owner-controlled Supabase project. Before testing cross-device rooms and the shared library:

1. enable anonymous sign-ins;
2. disable Realtime **Allow public access** so every channel join is checked against `realtime.messages` RLS;
3. apply the two Broadcast policies and confirm no broader permissive policy remains; and
4. verify unauthenticated and malformed-topic joins fail, while an authenticated valid topic can send and receive only within that exact topic.
5. verify public games are readable, while publish/delete, likes, and My Space writes are restricted by `auth.uid()` row-level security.

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

Motion Games keep their event-based player and team scores. Dance and Tennis
use the four-part practice score above. Expanding **How this score works** on a
result explains the inputs and limitations; no hidden AI model or remote user
ranking is involved.

Bundled reference media is documented in [`REFERENCE-CREDITS.md`](REFERENCE-CREDITS.md).
YouTube search uses the official Data API and privacy-enhanced embed player. YouTube does not expose
player frames for browser pose extraction and its developer policy prohibits downloading or caching
the audiovisual content, so scored reference comparison is limited to bundled licensed clips and
user-owned uploads.

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
