# Package 1.1 Repair Recheck 1

## Decision

**Automated Stage 04 eligibility: REWORK**

**Candidate:** `7f56defa407f9a9725a25c7225f687e3fc3129ac`

**Parent candidate:** `7374066d6f99be7d7d3660362a849bd978b13d32`

**Package:** `project-package.md`, version 1.1 frozen

**Recheck date:** 2026-11-19, America/Los_Angeles

The repair substantially improves Package 1.1. The full declared verification
chain is green; shared elapsed offsets now survive ordinary start, pause,
resume, end, tracking-loss pause, and phone-controller reload; reference media
is sought, played, and paused at the transported offset; calibration is now a
versioned session-local neutral/range record that changes both Dance and Tennis
thresholds; and the Tennis countdown is announced, keyboard cancelable and
restartable, and reduced-motion safe.

Two independently reproduced state gaps keep this exact candidate from Stage
04 automated audit:

1. After an ordinary pause or tracking-loss pause, the display removes **End
   session** and the phone disables **End safely**. The user must resume before
   either peer can stop. That contradicts the frozen requirement that either
   peer can pause or end safely and is especially unsafe as a tracking-loss
   recovery path.
2. Reloading the display preserves the room code but loses the local reference
   timeline and resets the elapsed clock to 0.0 seconds. The phone still reports
   a connected display, while the display's Start action is disabled until the
   reference is reloaded. The repair's reload test covers phone-controller
   reload only; it does not establish synchronized recovery when the display
   reloads.

These are automated implementation findings, not merely missing physical
evidence. The physical/manual debts listed below remain unchanged and are not
the reason for the REWORK decision.

## Scope and independence

This recheck inspected the historical `validation-report-1.1.md` and the repair
notes in `build-report.md`, then independently checked the exact candidate. The
starting tree was clean and `git rev-parse HEAD` matched the candidate hash.
No implementation file was changed. Test-generated screenshots and
`next-env.d.ts` were restored from the exact candidate after each run.

The validated story is:

> A paired display and phone exchange an identified semantic coaching clock;
> the display applies that clock to Dance reference media; the phone retains
> private per-session calibration and applies it to local deterministic
> analysis; and either peer can operate the Tennis countdown without raw media
> or calibration crossing the private relay.

## Full verification reproduction

Environment: Node.js `24.22.3`; Next.js `16.4.6`; Supabase JS `2.119.2`.

| Check | Result | Independent evidence |
|---|---|---|
| Exact candidate | PASS | HEAD matched `7f56defa407f9a9725a25c7225f687e3fc3129ac`; clean starting tree. |
| `npm run lint` | PASS | Exit 0, no ESLint findings. |
| `npm run typecheck` | PASS | Exit 0, no TypeScript findings. |
| `npm run test` | PASS | 9 files, 27 tests, 204 ms. |
| `npm run build` | PASS | Production build completed; 10 application routes emitted. |
| `npm run test:e2e` through `npm run verify` | PASS | 6/6 Chromium scenarios, 21.4 s. |

Observed Playwright scenario durations:

| Scenario | Duration |
|---|---:|
| Three-mode selection and axe | 0.915 s |
| Paired Dance fixture | 4.2 s |
| Shadow Serve fixture and countdown | 8.9 s |
| Shadow Forehand fixture | 6.1 s |
| Original multiplayer game round | 15.1 s |
| Original game keyboard/axe regression | 2.5 s |

## Repair objective 1: Dance clock, media, and peer controls

### What now passes

The repair adds identified controls with action, origin, sent time, and elapsed
offset. Duplicate IDs are ignored. The same reducer is used on both peers, and
the display maps controls to media behavior:

- Start sets elapsed and media position to zero and plays.
- Pause freezes the transported elapsed offset, pauses media, and seeks to the
  same offset.
- Resume uses the frozen offset rather than resetting the phone comparison
  clock, seeks the display media, and plays.
- Stop pauses and seeks the display media at the final offset.
- A controller joining an already running, paused, or counting-down display
  receives a synthesized sync control.

Independent paired Chromium instrumentation reproduced both control origins:

| Step | Result |
|---|---|
| Display start | Media `play()` count advanced; phone comparison clock advanced. |
| Phone pause | Media `pause()` advanced; phone comparison stayed exactly 0.3 s across a 350 ms wait. |
| Display resume | Media played at 0.349 s and the phone comparison advanced beyond the frozen position. |
| Display pause | Both peers entered paused state. |
| Phone reload while paused | Same session calibration reappeared; paused sync recovered at 0.6 s; Resume was available. |
| Phone resume | Display media played again at the transported offset. |
| Simulated tracking loss | Display media paused through a control whose origin was `tracking-loss`. |
| Display end while running | Display media paused at 0.731 s and the aggregate result appeared. |
| Phone end while running | Display media paused at 0.055 s and the aggregate result appeared. |

The relevant implementation is in `lib/coach-clock.ts`,
`components/coach-display.tsx:93-153`,
`components/coach-display.tsx:190-218`, and
`components/coach-controller.tsx:244-308`.

### Blocking finding A: no safe stop from paused/tracking-loss state

**Reproduction:** pause from the display or phone and wait until both peers show
the paused state. The display no longer renders **End session**. The phone's
**End safely** remains present but disabled. The same result occurs after the
tracking-loss control. Only Resume is actionable.

This is directly encoded in the UI conditions:

- `components/coach-display.tsx:297` renders End only while `running`.
- `components/coach-controller.tsx:376` disables End whenever `running` is
  false.

The committed Dance E2E misses the gap because it always resumes after
tracking loss before clicking End.

**Required repair:** permit stop from running, paused, and tracking-loss states
on both peers; keep it idempotent; assert the final frozen elapsed/media offset;
and add tests for ordinary-pause → stop and tracking-loss → stop from each peer.

### Blocking finding B: display reload is not synchronized recovery

Independent display-reload reproduction while paused produced:

| State | Before display reload | After display reload |
|---|---|---|
| Room | Same 12-character room | Same room preserved |
| Reference | 101 fixture samples / 30 KiB | “Choose a reference to begin local pose extraction.” |
| Elapsed | 0.3 s | 0.0 s |
| Start | Run had been active and paused | Disabled |
| Phone status | Connected | Still says connected |

Because the selected local media and derived timeline intentionally are not
persisted, the display may reasonably require reselection after reload. But the
current state is neither synchronized nor explicitly treated as an interrupted
session: the phone retains its old session/clock while the display silently
returns to a fresh clock. If the frozen reload requirement intends only phone
reload, the package and public claim must say so. Otherwise the implementation
needs an explicit display-reload interruption/resynchronization contract.

**Required repair:** on display reload, either recover the permitted derived
state for the same tab session or send an identified stop/reset that places both
peers in one actionable state and tells the user to reselect the local clip.
Add a display-reload E2E; do not imply that the current phone-only reload test
covers both roles.

## Repair objective 2: session-local calibration

**Automated repair result: PASS, with real-camera evidence debt.**

The implementation now separates neutral capture and comfortable-range
capture. A record contains:

- version `1.1`;
- exact coach session ID and creation time;
- distinct neutral and comfortable-range samples;
- arm reach, knee load, shoulder turn, pose spread, and confidence;
- source label (`camera` or clearly labeled `fixture`).

The record is stored under
`move-canvas:calibration:<exact-session-id>` in `sessionStorage`, parsed only
for the same session, displayed in an inspectable details panel, and recovered
on phone reload. The independent browser audit saw a matching key, both sample
objects, all five measured fields, and fixture source disclosure.

Threshold consumption is material rather than decorative:

- `compareDancePose` reads the calibrated mismatch distance.
- Serve reach, forehand load, and forehand turn classification read calibrated
  thresholds.
- Unit tests prove compact and broad records produce different bounded values,
  change a Serve classification, and change the same Dance pose from mismatch
  to accepted.

The message union in `lib/channel.ts` contains no calibration record or sample
shape. Across 29 observed application broadcast frames, the audit found zero
`calibration`, `neutral`, `comfortableRange`, or calibration-storage-key terms.

The fixture path constructs disclosed deterministic samples directly; it does
not prove real neutral/range capture quality, meaningful comfortable range, or
threshold suitability on a physical camera. Those remain physical evidence
debt under CAL-01 and TENNIS-01, not a failure of the bounded automated repair.

## Repair objective 3: Tennis countdown

**Automated repair result: PASS, with manual assistive-technology debt.**

The independent paired browser run reproduced:

- Start activated by keyboard Enter on the display.
- Both peers announced “Tennis practice starts in 3.”
- The live region used `role="status"`, `aria-live="assertive"`, and
  `aria-atomic="true"`.
- Cancel activated by keyboard Space on the phone.
- Waiting beyond the original 3.2-second deadline did not start practice.
- Restart activated by keyboard Enter on the phone and completed the countdown.
- Computed transition and animation durations were both `0.00001s` under
  `prefers-reduced-motion: reduce`.
- Display and phone axe checks in both Tennis fixture scenarios had no
  serious/critical violations.

The countdown control and timer cancellation exist on both peers. The committed
Serve scenario verifies cross-peer start, phone cancel, expiry cancellation,
phone restart, and eventual run start. Manual screen-reader announcement
quality remains evidence debt.

## Privacy and Supabase boundary recheck

### Browser transport audit

The paired fixture audit observed:

- 5 Supabase WebSocket connections across Dance, phone reload, and Tennis;
- 29 application broadcast frames;
- maximum observed application frame: 30,354 bytes;
- coaching messages for controller readiness, session, normalized Dance
  reference, controls, semantic Dance feedback, and aggregate result;
- zero calibration terms;
- zero camera-frame, raw-landmark, data/blob media, video MIME, or audio terms.

No POST/PUT/PATCH media upload path was found in the repaired flow. Static
inspection likewise found no `cameraFrame`, `rawLandmarks`, secret/service-role
key, or private-key pattern. `.env.local` is untracked and contains only the
Supabase URL and publishable client key names. The tracked `.env.example`
contains placeholders only.

### Realtime authorization behavior

The independent live probe reproduced:

| Probe | Result |
|---|---|
| Publishable browser key | PASS |
| Unauthenticated valid-format private topic | `CHANNEL_ERROR` |
| Authenticated malformed topic | `CHANNEL_ERROR` |
| Authenticated valid topic | `SUBSCRIBED` |
| Semantic broadcast | `ok` |

This remains consistent with current Supabase
[Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
and [Broadcast](https://supabase.com/docs/guides/realtime/broadcast) guidance:
private client channels require authenticated access and database policies.
The current possession-code limitation remains: an authenticated client that
knows a valid code can join; no membership, expiry, or attempt-throttling
evidence was added by this repair.

## Original Motion Game regression

**Automated result: PASS.**

The unchanged multiplayer E2E independently completed a two-controller shared
round through the private relay, advanced both player/team scores, paused and
resumed, reached ROUND COMPLETE, and retained the result in local storage. The
separate keyboard/axe scenario also passed. This recheck found no automated
regression from the coaching repair.

Fresh physical phone/display Motion Game evidence remains REG-01 debt and is
not replaced by the two-context fixture.

## Scoped requirement verdicts

| Requirement | Recheck verdict | Basis |
|---|---|---|
| GAME-01 | PASS | Deterministic and multiplayer automated regression remains green. |
| PAIR-01 | REWORK | Cross-context automation passes; display reload does not recover a coherent session, and physical reconnect remains debt. |
| CAL-01 | PASS (automation) / BLOCKED (physical) | Inspectable session record and threshold effects pass; real comfortable-range capture is unproven. |
| PRIV-01 | PASS (bounded automation) | No raw-media or calibration payload observed; physical-camera trace remains under VISION-01. |
| REG-01 | PASS (automation) / BLOCKED (physical) | Original game tests pass; fresh two-device trace remains. |
| DANCE-03 | REWORK | Ordinary offset/media continuity and phone reload pass; paused stop and display reload do not satisfy the full recovery contract. |
| TENNIS-01 | PASS (automation) / BLOCKED (physical) | Announced countdown and fixture flow pass; real calibrated drills remain unproven. |
| COACH-PAIR-01 | REWORK | Either peer can control while running, but neither can end safely once paused. |
| COACH-PRIV-01 | PASS (bounded automation) | Calibration stays session-local; normalized/semantic transport only was observed. |
| COACH-A11Y-01 | PASS (automated countdown subset) / REWORK (overall) | Keyboard, assertive status, reduced motion, and axe pass; manual screen-reader/TV matrix remains. |
| COACH-QA-01 | REWORK | Tracking-loss pause works, but safe stop is unavailable afterward and display reload splits peer state. |
| COACH-PERF-01 | REWORK | Offset continuity and payload ceiling pass; physical drift, extraction duration, and p50/p95 latency remain unmeasured. |

All unaffected Package 1.1 verdicts and baseline Package 1.0 debts remain as
recorded in `validation-report-1.1.md`; this bounded repair does not silently
upgrade them.

## Physical and manual evidence debt

The following remains explicitly outside this automated recheck:

- Fresh paired real-camera Motion Game completion and disconnect/reconnect.
- A newly selected supported MP4/WebM through real local extraction, calibrated
  phone comparison, tracking loss/recovery, and final Dance result.
- Three real calibrated Serve and Forehand reps on left/right configurations,
  including low-confidence and out-of-order attempts.
- Physical network capture demonstrating that camera frames, raw user
  landmarks, reference bytes, audio, and face identity stay at origin.
- Named-device extraction duration, clock drift, and semantic-event p50/p95;
  the frozen p95 target is below 200 ms.
- Manual screen-reader, focus order, contrast, physical reduced-motion,
  360 px phone, 1280 px display, TV-distance, backgrounding, and reconnect
  matrix.
- Baseline blueprint edit/regenerate/discard, provenance, AI evaluation, and
  generation cost/latency evidence carried from the historical report.

None of these debts should be converted into a fixture claim.

## Required route

1. Make stop available and functional from paused and tracking-loss states on
   both peers; add four paired assertions covering ordinary/tracking pause and
   both origins.
2. Define display reload explicitly. Either restore permitted session-local
   derived state or atomically stop/reset both peers with actionable reselection
   copy; add a display-reload E2E.
3. Produce a new immutable commit and rerun `npm run verify`, the semantic
   payload audit, both reload paths, and the original game regression.
4. If those automated findings close, the candidate can be marked PASS for
   Stage 04 automated eligibility while carrying the unchanged physical/manual
   debt forward as explicit non-release evidence.
