# Package 1.1 Repair Recheck 2

## Decision

**Automated Stage 04 eligibility: PASS**

**Candidate:** `c53ea713f7361bdc8706815324754051dbd9ad7f`

**Prior candidate:** `7f56defa407f9a9725a25c7225f687e3fc3129ac`

**Package:** `project-package.md`, version 1.1 frozen

**Recheck date:** 2026-11-20, America/Los_Angeles

The two automated blockers from `validation-report-1.1-recheck-1.md` are
closed in this exact candidate:

1. Either the phone or display can stop a Dance session after an ordinary
   pause or a tracking-loss pause. The stop is idempotent, keeps the final
   clock/media offset frozen, and produces the result state.
2. A reloaded display asks the surviving phone for the current session,
   normalized Dance timeline, and authoritative clock state. Ready, paused,
   and running recovery are coherent and actionable without resetting the
   clock. The local raw video is intentionally not transported or persisted;
   the display truthfully asks the user to reselect it if a video preview is
   wanted.

The full automated verification chain is green. Independent browser probes
also pass the two repaired state paths, phone reload, room isolation,
calibration storage, Tennis countdown, keyboard, reduced-motion, axe, privacy,
and live Supabase authorization checks. No automated implementation blocker
was found in the delegated scope.

This PASS means the candidate may proceed to the automated Stage 04 audit. It
does not mean the product is ready to publish: the physical-device, real-media,
real-camera, assistive-technology, and network measurement debts listed below
remain open and must stay visible in Stage 04.

## Scope and independence

This recheck read the complete Package 1.1 package, build report, original
validation report, and first repair recheck before inspecting the exact
candidate diff and independently reproducing its claims. The starting tree was
clean and `git rev-parse HEAD` matched the candidate hash.

No implementation file was modified. Test-generated screenshot changes and
the development rewrite of `next-env.d.ts` were restored to the exact
candidate. This report is the only retained validation artifact from the
recheck. Historical validation reports were not edited.

The validated story is:

> A paired display and phone exchange an identified semantic coaching clock;
> a surviving phone can restore the display's permitted normalized Dance
> timeline and clock after display reload; the phone retains private
> per-session calibration and applies it to local deterministic analysis; and
> either peer can safely stop a paused session without raw media or calibration
> crossing the private relay.

## Candidate diff inspection

The candidate adds one semantic `coach-display-ready` message, makes the
surviving phone replay the current session/timeline/clock to a reloaded
display, permits End from both running and paused states, and makes repeated
pause/start/resume/stop controls state-idempotent. It adds targeted unit and E2E
coverage for the repaired paths.

Diff from the prior candidate: 14 files, 561 insertions, 33 deletions. The
implementation-bearing changes are confined to:

- `components/coach-controller.tsx`
- `components/coach-display.tsx`
- `lib/channel.ts`
- `lib/coach-clock.ts`
- `lib/coach-clock.test.ts`
- `e2e/coach-modes.spec.ts`

The other changes are reports, factory records, and regenerated evidence
screenshots. Inspection found no hidden reset path, raw-media relay, calibration
relay, or broad session persistence added by the repair.

## Full automated gate

Verification used Node.js `24.22.3`, npm `10.8.2`, Next.js `16.4.6`, and
Supabase JS `2.119.2`.

| Check | Result | Independent evidence |
|---|---|---|
| Exact candidate | PASS | HEAD matched `c53ea713f7361bdc8706815324754051dbd9ad7f`; clean starting tree. |
| Formatting | PASS with configuration note | The project has no `format` script or formatter dependency. `git diff --check 7f56def..c53ea` passed and lint reported no formatting-related finding. |
| `npm run lint` | PASS | Exit 0, no ESLint findings. |
| `npm run typecheck` | PASS | Strict TypeScript check exited 0. |
| `npm run test` | PASS | 9 files, 28 tests, 194 ms. |
| `npm run build` | PASS | Production build completed and emitted 10 application routes. |
| `npm run test:e2e` through `npm run verify` | PASS | 8/8 Chromium scenarios, 31.7 s. |

The eight committed Playwright scenarios passed:

| Scenario | Duration |
|---|---:|
| Three-mode selection and axe | 0.983 s |
| Paired Dance fixture | 5.1 s |
| Paused Dance sessions end safely from either peer | 3.4 s |
| Display reload recovery in ready, paused, and running states | 5.5 s |
| Original multiplayer game round | 16.3 s |
| Original game keyboard/axe regression | 2.7 s |
| Shadow Serve fixture and countdown | 9.5 s |
| Shadow Forehand fixture | 5.8 s |

The absent formatter command is a repository gate-configuration gap, not a
candidate implementation failure. Stage 04 may choose to add an explicit
formatter gate, but this recheck did not modify project configuration.

## Prior blocker 1: safe stop after pause

**Result: CLOSED.**

The committed E2E covers all four required origin/state combinations. A
separate paired-browser probe repeated them while instrumenting the reference
media element and reading both peer clocks.

| Paused state | Stop origin | Result |
|---|---|---|
| Ordinary phone pause | Display | PASS — elapsed stayed at 0.3 s; display End was visible; phone End was enabled; stop added one media pause at 0.271 s. |
| Ordinary display pause | Phone | PASS — elapsed stayed at 0.4 s; controls remained usable; stop added one media pause at 0.353 s. |
| Tracking-loss pause | Display | PASS — elapsed stayed at 0.3 s; End remained actionable; stop added one media pause at 0.290 s. |
| Tracking-loss pause | Phone | PASS — elapsed stayed at 0.3 s; End remained actionable; stop added one media pause at 0.288 s. |

Each path reached the finished/result state. Repeated control handling is
state-idempotent in `applyCoachControl`, and the added unit test verifies
repeated pause/stop behavior. Post-flow axe checks found zero serious or
critical violations on either peer.

## Prior blocker 2: display reload recovery

**Result: CLOSED for the permitted normalized state and synchronized clock.**

On connection, the display sends `coach-display-ready`. A surviving phone
responds with the current `coach-session`, schema-validated normalized
`dance-reference`, and a phone-authored clock sync when the state is running,
paused, or counting down. The display validates the recovered records before
applying them.

| Recovery state | Independent result |
|---|---|
| Ready | 101 normalized samples / 30 KiB returned; Start was enabled; elapsed was 0.0 s; the display showed an explicit local-clip reselection notice. |
| Paused | Before reload: 0.4 s. After reload: 0.4 s with Resume and End visible. No reset and no disabled-control trap. |
| Running | Before reload: 0.7 s. After recovery: 1.4 s, then 1.7 s after a further 250 ms; Pause and End were visible. The recovered clock advanced instead of resetting. |
| Phone reload while paused | The phone recovered the 0.4 s paused state and displayed the session calibration record. |

This repair does not claim to recover the raw local video preview. That media
stays in its originating browser and is not sent over Realtime. The display's
notice accurately states that the normalized timeline was restored and that
the user may reselect the local clip to restore its preview.

## Calibration and Tennis regression

**Calibration automated result: PASS.**

The browser audit found a version `1.1` record under the exact session-scoped
`move-canvas:calibration:dance-coach-<room>` key. It contained separate neutral
and comfortable-range samples, matched the active session, showed the fixture
source disclosure, survived phone reload, and never appeared in transport.
The complete unit suite still proves that the recorded range changes Dance and
Tennis thresholds. Real-camera range quality remains physical evidence debt.

**Tennis countdown automated result: PASS.**

The independent probe verified:

- an assertive, atomic status live region on both peers;
- keyboard cancellation that remained canceled beyond the original 3.2-second
  deadline;
- keyboard restart with Enter;
- computed animation and transition durations of `0.00001s` under
  `prefers-reduced-motion: reduce`; and
- zero serious or critical axe findings on phone and display.

Both committed Shadow Serve and Shadow Forehand flows remained green. Real
left/right-handed physical repetitions remain evidence debt.

## Privacy, Supabase, and room isolation

### Static boundary

`SessionMessage` carries semantic controls, aggregate state, bounded normalized
Dance timelines, feedback, Tennis progress, and aggregate results. It has no
camera frame, raw landmark, calibration sample, raw reference byte, face
identity, or audio shape.

Only `.env.example` is tracked. The local environment exposes the public URL
and publishable-key names; no value was printed. Static inspection outside
historical reports found no service-role key, secret Supabase key, private key,
`cameraFrame`, or `rawLandmarks` reference. No media upload request was
observed.

### Browser transport audit

Across reconnections and reloads, the independent audit observed 10 Supabase
WebSockets and 60 application broadcast frames. The largest frame was 30,354
bytes. The observed semantic message counts were:

| Message type | Count |
|---|---:|
| `coach-controller-ready` | 4 |
| `coach-display-ready` | 6 |
| `coach-session` | 12 |
| `dance-reference` | 11 |
| `coach-control` | 22 |
| `coach-result` | 5 |

The captured frames contained zero calibration terms and zero forbidden
media/raw-landmark terms. The normalized 101-sample reference timeline is
permitted by the frozen boundary; its source video bytes are not transported.

### Realtime authorization behavior

The configured browser credential is a publishable key. The live private-topic
probe produced the expected behavior:

| Probe | Result |
|---|---|
| Unauthenticated join to a valid private room | `CHANNEL_ERROR` |
| Authenticated join to a malformed topic | `CHANNEL_ERROR` |
| Authenticated join to a valid room topic | `SUBSCRIBED` |
| Semantic broadcast on the valid room | `ok` |

Current Supabase private-channel/Broadcast guidance remains consistent with the
implemented authenticated private-channel pattern. This is a bounded
behavioral check, not a substitute for exporting and reviewing production
Realtime policies.

### Direct room isolation

A semantic message sent to one valid room returned `ok`, reached the receiver
in that room exactly once, and reached a receiver in a different valid room
zero times.

## Original game and accessibility regression

The original multiplayer round and original keyboard/axe scenario both pass.
The separate coaching probe also found zero serious or critical axe findings
after the repaired stop flows and in Tennis. Mode selection, countdown start,
cancel/restart, pause, resume, and end were keyboard actionable in the tested
paths. These automated results preserve GAME-01 and the automated portion of
REG-01 without replacing physical two-device or manual screen-reader evidence.

## Scoped requirement verdicts

| Requirement | Recheck verdict | Evidence boundary |
|---|---|---|
| GAME-01 | PASS | Deterministic and multiplayer automated regressions are green. |
| PAIR-01 | PASS (automation) / physical debt open | Cross-context pairing, room isolation, phone reload, and display reload recovery pass; physical reconnect remains unrecorded. |
| CAL-01 | PASS (automation) / physical debt open | Inspectable session record, reload, privacy, and threshold effects pass; real comfortable-range capture is unproven. |
| PRIV-01 | PASS (bounded automation) | Schema, static scan, network instrumentation, and live authorization behavior show no raw-media path. |
| REG-01 | PASS (automation) / physical debt open | Original game tests pass; a fresh private two-device trace remains required. |
| DANCE-03 | PASS (automation) / physical debt open | Clock/media continuity, paused stop, phone reload, and display reload pass; real clip/camera behavior remains unmeasured. |
| TENNIS-01 | PASS (automation) / physical debt open | Announced keyboard-safe countdown and both fixture drills pass; real calibrated repetitions remain unproven. |
| COACH-PAIR-01 | PASS (automation) / physical debt open | Either peer can pause, resume, or safely end; display recovery restores timeline and clock. |
| COACH-PRIV-01 | PASS (bounded automation) | Only normalized/semantic transport was observed; calibration stayed session-local. |
| COACH-A11Y-01 | PASS (automated subset) / manual debt open | Keyboard, announcements, reduced motion, and axe pass in scope; screen reader, contrast, TV-distance, and device-matrix evidence remain. |
| COACH-QA-01 | PASS (automated repair scope) / physical debt open | Tracking-loss stop and peer reload recovery pass; backgrounding and physical failure paths remain to be recorded. |
| COACH-PERF-01 | PASS (automated repair scope) / measurement debt open | Payload ceiling and clock continuity pass; extraction duration, physical drift, and p50/p95 network latency remain unmeasured. |

No automated blocker remains in the delegated repair scope.

## Physical and manual evidence debt

These items are separate from the automated Stage 04 decision and remain open:

1. Record a fresh physical phone/display Motion Game run, including private
   pairing, disconnect, reconnect, and result recovery.
2. Complete Dance Coach with a real supported 10–90 second clip and physical
   camera. Retain decode/extraction timing, normalized trace, lead-side and
   orientation behavior, confidence handling, tracking loss, pause/resume/end,
   and display reload evidence.
3. Perform real neutral and comfortable-range calibration. Demonstrate that
   measured thresholds are personally meaningful and safely bounded.
4. Complete real Shadow Serve and Shadow Forehand repetitions for both
   handedness choices, including framing, countdown, ordered phases, pause,
   stop, repeated-issue feedback, and low-confidence rejection.
5. Capture a physical-network trace that confirms no camera frames, user
   performance video, local reference-video bytes, raw audio, calibration
   samples, or face identity leave their originating browser.
6. Measure and retain extraction duration, display/phone clock drift, and
   semantic event p50/p95 latency on the declared network and device matrix.
7. Complete manual screen-reader, contrast, TV-distance readability,
   backgrounding, rotation, permission-denial, and supported-browser/device
   checks.
8. Preserve the baseline Package 1.0 editor, provenance, evaluation, and
   economics debts carried forward by the frozen package.

These are release/publication evidence gates. They are not evidence that the
two repaired automated behaviors still fail.

## Stage route

The exact candidate `c53ea713f7361bdc8706815324754051dbd9ad7f` may proceed
to automated Stage 04. Stage 04 should consume this report together with the
unchanged historical validation reports, treat the two prior blockers as
closed, and keep every physical/manual debt above explicit. Publication or a
full release PASS still requires the corresponding physical and manual
evidence; this recheck grants no exception to those gates.
