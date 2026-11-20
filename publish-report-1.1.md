# Package 1.1 Stage 05 Publish Report

**Result: PASS**

**Date:** 2026-11-20

**Production URL:** <https://move-canvas.vercel.app>

**Authorized scope:** Publish the previously verified Package 1.1 commit to Vercel Production, verify the complete live release, document public limitations, and publish the release evidence without replacing the verified deployment.

## Release identity

- GitHub repository: <https://github.com/nora-rasuli/move-canvas>
- Audited product commit: `ca641036a50625d59cd58c4b9b477504915665fe`
- Stage 04 audit commit: `cbfb075eb4f2576479438c20fee4b7e10960e3ca`
- Verified source commit: `5f94a5e946c12434a05908179a0193ee2804e3b2`
- Verified Preview deployment: `dpl_48BhzZG3BhwKu7UMmvnqVoiBZgFH`
- Production deployment: `dpl_J4XHhVgS1f5qoDmVAQNqqragxGG1`
- Production immutable URL: `https://move-canvas-bom4lc9fn-norarasuli-gmailcoms-projects.vercel.app`
- Production alias: <https://move-canvas.vercel.app>
- Team alias: `https://move-canvas-norarasuli-gmailcoms-projects.vercel.app` (Vercel Authentication remains enabled)
- Git metadata ref: `stage-05-preview`
- Git metadata SHA and deployment source SHA: `5f94a5e946c12434a05908179a0193ee2804e3b2`

Vercel promoted the verified Preview source by creating the Production deployment above from the same commit and rebuilding with Production-scoped variables. No different source commit was introduced.

## Source and CI evidence

- Passing GitHub Actions run: <https://github.com/nora-rasuli/move-canvas/actions/runs/44789022407>
- Passing job: <https://github.com/nora-rasuli/move-canvas/actions/runs/44789022407/job/136471431896>
- CI completed format, lint, type checks, 32 unit/integration tests, production build, dependency audit, and 10 Playwright scenarios.
- The repository remains public and its GitHub homepage points to <https://move-canvas.vercel.app>.

## Production environment boundary

Vercel Production contains exactly these two project variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Both are public browser-client configuration. Metadata inspection found no Production variable whose name contains service-role, secret, or private-key markers. The deployed Production artifact reports both public variable names and no other Supabase variable.

No AI provider key is configured. The live Blueprint API therefore truthfully returns the deterministic fallback with explicit `provider-not-configured` provenance.

## Supabase authorization preflight

The final public-key-only preflight produced:

| Check | Result |
| --- | --- |
| Public Auth settings endpoint | HTTP 200 |
| Anonymous sign-in provider | Enabled |
| Browser key shape | Modern publishable key |
| Unauthenticated valid private-room join | `CHANNEL_ERROR` |
| Authenticated malformed-topic join | `CHANNEL_ERROR` |
| Three authenticated valid-room subscriptions | `SUBSCRIBED` |
| Semantic private-room send | `ok` |
| Same-room deliveries | Exactly 1 |
| Different-room deliveries | 0 |

This behavior confirms that Realtime public access is not bypassing the private-channel policies and that the exact-room topic boundary remains enforced. The authorization model is possession of a high-entropy 12-character room code plus anonymous authentication; it is not claimed to be a user-membership ACL.

## Public abuse and retention limitations

Supabase's current [Anonymous Sign-Ins documentation](https://supabase.com/docs/guides/auth/auth-anonymous#abuse-prevention-and-rate-limits) states that anonymous sign-ins are limited to 30 requests per IP per hour. It also states that anonymous users are durable Auth records and automatic cleanup is unavailable. The documented example cleanup threshold is 30 days, but this release does not claim that a cleanup job is installed.

The following remain explicit operational limitations:

- No CAPTCHA or bot-protection setting was independently verified. Dashboard inspection was stopped because it would have required granting a new OAuth authorization.
- No automated anonymous-user retention/cleanup job was verified.
- The 30-per-IP/hour limit is a platform-documented boundary, not an application-level abuse-control guarantee.
- Possession-code authorization does not prevent a person who obtains a valid room code from joining that room.
- Rate-limit saturation and deliberate abuse were not load-tested.

These limitations are disclosed rather than converted into security claims.

## Production route and API verification

Fresh unauthenticated requests returned:

| Route | Result |
| --- | --- |
| `/` | 200 HTML |
| `/coach` | 200 HTML |
| `/coach/dance` | 200 HTML |
| `/coach/tennis` | 200 HTML |
| `/coach/controller?mode=dance-coach&code=ABC123DEF456` | 200 HTML |
| `/pair` | 200 HTML with recovery state when local prerequisites are absent |
| `/calibrate` | 200 HTML with recovery state when local prerequisites are absent |
| `/display/ABC123DEF456` | 200 HTML |
| `/robots.txt` | 200 text |
| `/opengraph-image` | 200 PNG |
| `/icon.svg` | 200 SVG |
| `/missing-room-route` | 404 HTML with the product recovery UI |

Live Blueprint API evidence:

- Valid `POST /api/blueprints`: HTTP 200; schema-valid `Fireflies Dash`; `generator: deterministic-fallback`; `validation: passed`; `degradedReason: provider-not-configured`.
- Invalid short prompt: HTTP 400 with `Describe the game in 12–280 characters.`

Production `/coach` headers include:

- `permissions-policy: camera=(self), microphone=(), geolocation=()`
- `referrer-policy: strict-origin-when-cross-origin`
- `strict-transport-security: max-age=63072000; includeSubDomains; preload`
- `x-content-type-options: nosniff`

## Fresh-session Production browser verification

All 10 Playwright scenarios passed directly against <https://move-canvas.vercel.app> in 54.1 seconds:

1. Truthful Motion Game, Dance Coach, and Tennis Coach selection plus serious/critical axe checks.
2. Paired Dance fixture synchronization, tracking-loss recovery, result persistence, and mobile-width axe checks.
3. Safe paused-session completion from either peer.
4. Dance display restoration for ready, paused, and running states.
5. Shadow Serve countdown, keyboard control, accessibility, and three ordered reps.
6. Shadow Forehand accessibility and three ordered reps.
7. Blueprint regeneration, discard, validation, edit retention, and provenance.
8. Security headers, metadata, robots policy, missing-route recovery, and malformed persisted-data fail-closed behavior.
9. Private multi-client Supabase room: two controllers plus display, start/pause/resume, scoring, completion, and persisted result.
10. Keyboard start and serious/critical axe checks for controller and display.

The production-scoped Vercel runtime query returned zero error/fatal records. The production-scoped CDN query returned zero HTTP 5xx records after verification.

## Rollback readiness

The pre-release production state had zero aliases and both production-style domains returned HTTP 404. There was no earlier user-facing Production deployment eligible for instant rollback.

The fail-closed rollback target is therefore the known zero-alias state. If the release must be withdrawn, remove these exact aliases from `dpl_J4XHhVgS1f5qoDmVAQNqqragxGG1`:

- `move-canvas.vercel.app`
- `move-canvas-norarasuli-gmailcoms-projects.vercel.app`

After removal, verify both domains return HTTP 404 and the Vercel alias inventory is empty. The immutable deployment remains available for investigation without serving the production domains.

## Repository publication safety

`vercel.json` disables automatic Git deployments for `main`. This allows the release report and truthful README boundary to be pushed without replacing the verified Production deployment with an unverified build. Future Production changes must use an explicit verified-deployment workflow.

## Gate assessment

Stage 05 production publication passes:

- Production serves the exact verified source SHA.
- The Production artifact uses only the two approved public Supabase client variables.
- Private-channel rejection, valid authorization, message delivery, and cross-room isolation passed.
- All declared routes, recovery states, API paths, metadata/security headers, and 10 non-camera browser flows passed.
- Production runtime and HTTP 5xx queries are clean.
- Rollback to the prior zero-alias state is exact and documented.
- Repository claims remain bounded to reproduced evidence.

The release does **not** claim physical phone/camera/TV validation, real-world measured performance or latency, manual screen-reader/assistive-technology coverage, WCAG conformance, coaching effectiveness, injury prevention, medical analysis, biomechanics, ball flight, racket analysis, or independently measured AI quality/economics.
