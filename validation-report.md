# Stage 03 Independent Validation Report — Package 1.0 Multiplayer Baseline

**Validated candidate:** `5ae016f8aabe089ebf91b039904f22fdcd37d48d`
**Validation date:** 2026-11-19 (America/Los_Angeles)
**Validator decision:** `PASS` as a bounded private-multiplayer baseline; `REWORK` for the frozen Package 1.0 release gate
**Factory route:** Return to Factory Runner; do not advance to Stage 04
**Scope state:** Superseded for final-release scope by the separately authored Package 1.1 (Dance Coach and Tennis Coach)

## Scope and independence

This report validates the exact committed Package 1.0 candidate above. It does
not accept `build-report.md` as proof. It reproduces the automated gates,
inspects the controller/display and Supabase boundaries, and performs separate
authorization and browser-traffic probes.

Package 1.1 authoring began concurrently during validation and left uncommitted
changes in package/factory documents. Those changes were excluded. No Package
1.1 implementation was validated, and this report is not evidence that the
expanded release scope passes.

The validated story is:

`validated blueprint → private authenticated room → two isolated named phone-controller contexts + one display context → per-player/team scoring → pause/resume → completed and saved result`

The required full Package 1.0 story remains:

`fresh prompt → inspect/edit/approve blueprint → physical-camera calibration → physical phone controller → separate display → semantic pose play → recovery → saved result/replay`

## Environment and candidate integrity

- Git candidate: `5ae016f8aabe089ebf91b039904f22fdcd37d48d`.
- Worktree was clean when validation opened.
- Validation runtime: Node `24.22.3`; npm `10.8.2`.
- Candidate stack: Next.js `16.4.6`, React `19.3.1`, Vitest `5.1.1`, Playwright `1.65.1`, Supabase JS `2.119.2`.
- `.env.local` was not printed and is ignored by Git. `.env.example` is the only tracked environment file.
- A first Vitest attempt under the shell's Node `18.20.8` stopped before project tests because that runtime lacks `node:util.styleText`. Rerunning under the workspace Node 24 runtime passed. This was an environment mismatch, not a candidate test failure.
- A restricted-sandbox `npm run verify` attempt reached the Playwright server and failed to bind `127.0.0.1:3000` with `EPERM`. The same exact command in the approved unrestricted local test environment passed. This was recorded as sandbox evidence, not a product failure.

## Reproduced verification gates

| Gate | Result | Independent evidence |
|---|---|---|
| `npm run lint` | PASS | ESLint completed with exit code 0 and no findings. |
| `npm run typecheck` | PASS | `tsc --noEmit` completed with exit code 0. |
| `npm run test` | PASS | 5 files, 13 tests passed under Node 24.22.3. |
| `npm run build` | PASS | Next.js production build compiled, typechecked, generated all six routes, and exited 0. |
| `npm run test:e2e` | PASS | 2 Chromium tests passed against the configured Supabase relay. |
| `npm run verify` | PASS | Full lint → types → 13 tests → production build → 2 Playwright tests passed in one chained run; total Playwright time 19.0 s. |

The primary Playwright flow used three isolated browser contexts. It verified:

- named controller players `Nora` and `Sam`;
- one display with `Players 2`;
- controller-triggered start;
- per-player score (`Sam 10`) and team score (`Team 10`, then `Team 21`);
- pause to `Hold still` and resume;
- round completion;
- controller-visible replay action;
- locally saved result with the expected game title;
- keyboard activation of Start;
- zero serious or critical axe violations on controller and display.

This E2E uses a stored blueprint and manual semantic test controls. It does not
exercise fresh generation, physical camera calibration, MediaPipe landmarks, or
a physical phone/TV pair.

## Supabase private-channel and RLS boundary

### Source inspection

- The browser creates an anonymous authenticated session and uses only
  `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- The Realtime channel is created with `{ private: true }`.
- The committed SQL defines `SELECT` and `INSERT` policies on
  `realtime.messages`, targets `authenticated`, limits the extension to
  `broadcast`, and requires a topic matching
  `^move-canvas:[0-9A-Z]{12}$`.
- A tracked-source scan found no service-role key, Supabase secret-key pattern,
  private key, or provider-secret pattern. The local Supabase key has the
  `sb_publishable_` prefix. No secret value is present in a `NEXT_PUBLIC_`
  variable.

This matches Supabase's documented two-part private-channel pattern: RLS on
`realtime.messages` plus `private: true` in the client. The relevant current
documentation is [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
and [Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast).

### Independent behavioral probe

Using the configured publishable key:

| Probe | Observed result |
|---|---|
| Unauthenticated client joins a valid-format private topic | `CHANNEL_ERROR` |
| Anonymous-authenticated client joins malformed topic | `CHANNEL_ERROR` |
| Anonymous-authenticated client joins valid 12-character topic | `SUBSCRIBED` |
| Authenticated client sends semantic gesture broadcast | `ok` |

The connected Supabase management integration did not have permission to query
this project's live policy catalog or security advisors. The source and
behavioral evidence above validate the effective boundary, but the catalog and
advisor observability gap should be closed before release audit.

### Security model limitation

Authorization is possession-based, not room-membership-based. Any authenticated
client that knows a syntactically valid room code can join that room. The
client-generated 12-character code contains approximately 48 bits of random
input under the current encoding. This is a reasonable ephemeral pairing token,
but the candidate does not demonstrate server-enforced room expiry, ownership,
membership, or rate limiting. Public claims should say "private possession-code
rooms," not imply account-bound or invite-list authorization.

## Privacy and transport inspection

The transport `SessionMessage` union contains player metadata, blueprint/game
state, semantic gesture name, timing, result, and lifecycle messages. It has no
camera frame, image, video, blob, landmark-array, embedding, or identity payload.
The camera components process `MediaStream` and MediaPipe landmarks locally and
call the transport only through `sendGestureMessage(playerId, gesture, sentAt)`.

An independent headless-browser traffic audit observed:

- visible status `Cross-device relay ready`;
- two Supabase WebSocket connections;
- 23 sent WebSocket frames during pairing and one scored gesture;
- a semantic gesture frame;
- zero payload matches for image/video/blob/landmark/MediaStream content;
- zero media, multipart, or landmark-bearing upload requests.

Therefore `PRIV-01` passes for the inspected implementation and synthetic
semantic-control flow. A physical-camera network trace is still required to
close `VISION-01` and the full publication gate.

## Frozen Package 1.0 requirement verdicts

| ID | Verdict | Evidence and remaining work |
|---|---|---|
| `P-01` | BLOCKED | Multiplayer semantic round passes, but no fresh physical-camera round on a paired physical display was supplied or reproduced. |
| `FUNC-01` | BLOCKED | Fresh fallback text is unit-tested; the primary E2E injects a fixture and uses manual controls. Physical live-camera influence is unproven. |
| `GAME-01` | PASS | Deterministic engine/session unit tests and the complete scored Playwright round pass. |
| `PAIR-01` | REWORK | Private cross-context pairing and event exchange pass. Disconnect/reconnect recovery and physical phone-to-display evidence are missing. |
| `VISION-01` | BLOCKED | Local MediaPipe code path and semantic-only transport are supported by inspection, but real-device landmark recognition and a physical-camera network trace are missing. |
| `CAL-01` | BLOCKED | Personal landmark-snapshot logic and classifier unit tests exist; real-player capture and threshold behavior were not reproduced. |
| `UX-01` | REWORK | Blueprint inspection and acceptance exist, but the frozen inspect/edit/validate/accept/regenerate/discard editor contract is not implemented or keyboard-E2E tested. |
| `A11Y-01` | REWORK | Keyboard Start and zero serious/critical axe findings pass. Full keyboard setup, screen reader, contrast, reduced-motion, 360 px controller, and TV-distance manual checks remain. |
| `QA-01` | REWORK | Error states are represented in code. Provider, camera, framing, tracking, pairing-loss, reconnect, and reload recovery lack complete test/screenshot evidence. |
| `AI-01` | PASS | Strict Zod schema, gesture allow-list, structured output, timeout, explicit fallback, and invalid-gesture rejection are implemented and unit-tested. This does not substitute for `EVAL-01`. |
| `EVAL-01` | REWORK | No versioned ten-prompt corpus/report proves ≥9/10 safe validity and 10/10 forbidden-move rejection for the configured model. |
| `HUMAN-01` | REWORK | Camera setup follows explicit blueprint acceptance, but blueprint edit/override behavior and persistence are absent. |
| `PROV-01` | REWORK | API responses include prompt, generator/model, timestamp, validation and degraded reason, but a complete inspectable record retaining edits and calibration version through the saved game/result was not demonstrated. |
| `PRIV-01` | PASS | Static transport audit, tracked-secret scan, authorization probe, and browser traffic audit found semantic-only traffic and no camera/media upload. Physical-camera trace remains a `VISION-01` evidence gap. |
| `ECON-01` | REWORK | No measured AI p95/cost report or controller-latency p50/p95 profile was supplied. Fallback behavior is verified. |
| `SAVE-01` | PASS | Blueprint local save exists; the E2E verifies saved completed result and replay availability. A reload E2E is still desirable but does not overturn the bounded baseline result. |

Summary: **4 PASS, 8 REWORK, 4 BLOCKED**.

## Required corrections/evidence before a future release gate

1. Revalidate the expanded Package 1.1 from a new immutable, clean commit; do
   not reuse this Package 1.0 verdict for Dance Coach or Tennis Coach.
2. Run and capture a clean-session physical phone-camera → calibration → pose
   gesture → private internet room → physical TV/browser → completed result
   trace, including the network payload audit.
3. Add independent disconnect/reconnect and tracking-loss auto-pause/recovery
   evidence.
4. Implement and keyboard-test the frozen blueprint editor/override/discard
   authority contract, or formally revise that requirement in the new package.
5. Produce the versioned ten-prompt AI evaluation and measured AI
   latency/cost report.
6. Measure controller semantic-event latency with methodology and p50/p95;
   require p95 below 150 ms on the declared test network.
7. Persist and inspect the complete provenance record through saved result.
8. Complete the manual accessibility, responsive-device, and TV-distance
   matrix.
9. Obtain live policy-catalog and Supabase security-advisor evidence from an
   integration authorized for the configured project.

## Safe claims for this baseline

Supported:

- The exact candidate passes lint, strict TypeScript, 13 unit/session tests, a
  production build, and two private-relay Playwright tests.
- Two isolated named controller contexts and one display can complete a shared
  scored round through the configured Supabase Realtime relay.
- The inspected transport sends semantic control/game data and exposes only a
  publishable key; no camera/media payload appeared in the audited flow.

Not yet supported:

- Full Package 1.0 or Package 1.1 release readiness.
- A completed physical phone-camera-to-TV experience.
- Measured controller p95, AI p95/cost, or frozen-corpus success threshold.
- Complete reconnect, manual accessibility, or device-matrix compliance.
- Account-bound room privacy, adoption, health/fitness outcomes, revenue, or
  novelty claims.

## Final route

`Stage 03 bounded baseline PASS → superseded by Package 1.1 → return to Factory Runner → expanded Stage 02 build → new immutable handoff → fresh independent Stage 03 validation`

Stage 04 is not authorized by this report.
