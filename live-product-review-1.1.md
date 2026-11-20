# Package 1.1 Stage 06 — Live Product Review

**Review date:** 2026-11-20, America/Los_Angeles  
**Production alias:** <https://move-canvas.vercel.app>  
**Production deployment:** `dpl_J4XHhVgS1f5qoDmVAQNqqragxGG1`  
**Production source:** `5f94a5e946c12434a05908179a0193ee2804e3b2`  
**Portfolio case study:** <https://nora-rasuli.github.io/work/move-canvas/>  
**Decision:** `REWORK`

## Independent review boundary

This was a fresh Stage 06 review of the deployed product as a user, separate
from the Stage 05 publisher. The production alias loaded successfully in a new
browser tab. The deployment and source identities above match the retained
Stage 05 publication record; the source commit is present in the local Git
object database.

The review used new text prompts, ordinary public navigation, the visible game
editor, malformed-input recovery, the mode pages, and production pairing
states. It did not grant camera permission, upload a reference clip, impersonate
a physical phone/TV pair, or convert automated fixtures into physical evidence.
No claim is made here about physical-device behavior, coaching quality or
effectiveness, latency, CAPTCHA, anonymous-user cleanup, membership ACLs,
manual assistive technology, or WCAG conformance.

## Fresh-user traces

### Trace A — fresh Motion Game input

1. Opened the production home page in a new browser tab.
2. Entered the fresh prompt: “A moonlit garden where I collect fireflies and
   dodge rolling pumpkins.”
3. Production returned an explicitly labeled offline blueprint named
   `Pumpkins Dash` with `Pumpkins Orbit`, but its description and mechanics
   were the stock space pattern: collect star parcels, dodge meteors, 60
   seconds, lively energy, and all four gestures.
4. Continued to `/calibrate`. The deployed route retained the accepted title,
   presented camera privacy and comfortable-range guidance, and kept capture
   and pairing disabled until camera setup. Camera permission was not granted.
5. Returned and entered a second fresh prompt: “A coral reef treasure hunt
   where I swim through bubbles and dodge jellyfish.”
6. Production returned `Jellyfish Dash` and a Moonlit Reef theme, but retained
   the same 60-second, lively, four-gesture game configuration. The text changed
   to pearls and jellyfish; the playable mechanics did not.

The product accepts fresh text and exposes an editable validated blueprint, but
the production fallback does not yet make the user's idea change the playable
behavior. Finding `MC-LIVE-P1-02` records the gate impact.

### Trace B — malformed input and recovery

Entering `run` and choosing **Build my game** produced the inline actionable
message “Add a little more detail—include a world, goal, or obstacle.” The form
remained editable. This production recovery path worked.

### Trace C — unpaired Tennis Coach

1. Opened `/coach/tennis` without opening its controller URL in any tab.
2. The page initially showed `Waiting for phone` and a disabled **Start
   practice** button.
3. As soon as the display's own private Supabase channel subscribed, the UI
   changed to `Phone connected`, changed its transport label to `Private
   possession-code relay`, and enabled **Start practice**. No phone/controller
   peer existed.
4. Activating **Start practice** began the three-second countdown and then
   entered the running state (`Move through the named phases`, advancing elapsed
   clock, Pause, and End session) with no controller, camera, framing, consent,
   or calibration.

This is a production golden-path failure, not merely a status-copy issue.
Finding `MC-LIVE-P1-01` records the bounded repair.

### Trace D — Dance Coach and public verification controls

The same display-only relay subscription changed Dance Coach from `Waiting for
phone` to `Phone connected` with no controller peer. The public production page
also exposed **Deterministic verification controls**. Loading the bundled
landmark fixture produced a 101-sample / 30 KiB timeline and enabled **Start
practice** without a phone. The control truthfully says the timeline is
synthetic, but it is still a developer verification route on the public user
surface. The controller source exposes corresponding fixture framing,
comparison, tracking-loss, and Tennis phase controls.

### Trace E — navigation, boundaries, and recovery

- The home, mode selection, Dance Coach, Tennis Coach, and calibration routes
  loaded with a coherent visual system and visible keyboard-semantic controls.
- Coaching copy clearly excludes medical, injury-prevention, biomechanics,
  ball/racket analysis, and professional instruction.
- Privacy copy consistently says raw camera and reference media stay in their
  originating browser.
- `/not-a-real-room` returned the product-specific recovery state, “That Move
  Canvas route is not available,” with a route back to mode selection.
- The published portfolio case study discloses that physical phone/camera/TV,
  coaching outcomes, manual assistive-technology testing, and measured latency
  were not established. Its stronger “three complete motion modes” wording
  should be treated as provisional until the P1 findings below are closed.

## Prioritized findings

### P0

No P0 finding was observed in the reviewed, non-camera scope.

### `MC-LIVE-P1-01` — relay subscription is presented as peer and camera readiness

**Severity:** P1  
**Requirements:** `PAIR-01`, `CAL-01`, `QA-01`, `COACH-PAIR-01`, `TENNIS-01`
  
**Production impact:** A display-only session claims a phone is connected and
can start Tennis practice. Opening a real controller would still announce
`coach-controller-ready` on channel connection, before camera consent,
framing, and calibration, so the display path does not enforce the stated
camera-readiness boundary.

**Implementation cause:** `CoachDisplay` passes `setConnected` directly to
`connectSession`; a successful display-side channel subscription therefore
sets the same boolean used for `Phone connected` and `canStart`. The controller
also sends `coach-controller-ready` immediately after transport connection
rather than after camera and calibration readiness.

**Bounded repair:** Stage 02 must separate at least these states:

1. display relay subscribed;
2. controller peer present for the same mode/session;
3. controller camera consent and framing complete;
4. session-local calibration complete; and
5. Dance reference present when required.

Display status and start controls must require an explicit current
controller-ready state, must return to a waiting/recovery state on peer loss,
and must never begin an uncalibrated coaching clock. Add production-shaped
coverage for display-only, controller-connected-but-uncalibrated, fully ready,
peer disconnect, and reconnect states.

### `MC-LIVE-P1-02` — public fallback reduces fresh ideas to cosmetic presets

**Severity:** P1  
**Requirements:** `P-01`, `FUNC-01`, `EVAL-01`, Functional Product Gate  
**Production impact:** The public release has no AI provider configured, so
every user receives the deterministic fallback. Two unrelated fresh prompts
changed nouns and one of three theme buckets while retaining the same duration,
energy, gestures, spawn rate, hazard ratio, score rules, and movement
instructions. The garden prompt also ignored its requested garden/firefly
world and substituted the space template. This conflicts with `No fixed
catalog`, “Make the game you want to move in,” and the factory stop condition
against cosmetic-preset output.

**Bounded repair:** Keep the schema and allow-list, but make the no-provider
production path map fresh prompt intent to at least one meaningful bounded
play variable in addition to coherent theme/content—for example gesture
selection, intensity, duration, cadence, hazard balance, scoring, or authored
instruction pattern. Freeze a representative prompt corpus outside the three
examples and prove semantic grounding plus behaviorally distinct blueprints.
The alternative is to narrow the public promise to a theme customizer, but
that would reopen the frozen package rather than repair this candidate.

### `MC-LIVE-P2-01` — developer fixture controls are shipped in the public UX

**Severity:** P2  
**Requirements:** `FUNC-01`, evidence-integrity rules  
**Impact:** Actual users see test-only terminology and can load synthetic
timelines, install fixture calibration, emit fixture comparisons/phases, and
produce aggregate results without the real camera flow. The controls are
honestly labeled, so they are not being counted as real evidence, but they
weaken the public product and make fixture output too easy to confuse with a
real session.

**Bounded repair:** Remove verification controls and fixture imports from the
public production user surface. Preserve deterministic coverage in a
non-production test build, a test-only harness, or browser-level mocked
media/pose inputs that cannot appear in the public product.

### P3

No separate P3 finding is necessary beyond the copy and polish consequences
of the findings above.

## Claim boundary after review

Still supported in the reviewed scope:

- production routes load with a coherent authored UI;
- fresh text is accepted, validated, editable, discardable, and retained into
  calibration setup;
- malformed short input fails visibly and recoverably;
- deterministic fallback provenance is visibly disclosed as offline;
- safety, camera-locality, and coaching-limit copy is prominent; and
- missing routes recover into the product rather than a generic failure page.

Not supported until repair and fresh verification:

- that the coaching display waits for a real, calibrated phone;
- that all three modes are complete production flows;
- that a fresh idea changes the playable Motion Game rather than its cosmetic
  theme; or
- that the public product contains only user-facing production paths.

This review does not alter the existing disclosure that physical device,
camera, reference-media, manual assistive-technology, real-network latency,
abuse-control, anonymous-retention, and coaching-outcome evidence remains
unestablished.

## Exact next route

Route only `MC-LIVE-P1-01`, `MC-LIVE-P1-02`, and the adjacent
`MC-LIVE-P2-01` cleanup to **Stage 02 — Build** as a bounded production repair.
Do not reopen the three-mode package, privacy boundary, coaching scope, or
visual direction.

After the repair:

1. create an immutable candidate;
2. use a fresh Stage 03 verifier to reproduce both P1 failures as negative
   tests and then complete the affected pairing/readiness and fresh-input
   functional gates;
3. run a fresh Stage 04 release audit;
4. obtain the required authority for a new Stage 05 production mutation,
   deploy the exact audited candidate, and re-run the production suite; and
5. route the new deployment to another fresh Stage 06 live-product reviewer.

Do not advance this deployment to Stage 07 Evidence or Archive while either P1
finding remains open.
