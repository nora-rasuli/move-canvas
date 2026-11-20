# Release Preflight — Move Canvas

| Gate | Decision/evidence | Status |
|---|---|---|
| Name collision | Web/GitHub/npm checks found no exact same-name service | Passed for working name |
| Same-service check | Original fixed-game concept stopped; creator pivot compared with five close systems | Passed |
| Defensible differentiation | User-authored bounded blueprint + personal calibration + playable paired-display result | Passed, conditional |
| User/payer/trigger | Household player or host; party/family/movement-break trigger; payer hypothesis is the household | Passed at desk gate |
| Functional input | Fresh prompt, live camera calibration, and live pose events are mandatory | Passed by plan |
| Demand/category spend | Multiple active consumer motion-game products and paid hardware/subscriptions | Passed for category |
| Candidate willingness to pay | Price hypothesis only; no commitment evidence | Validation debt |
| AI role | Maps unconstrained intent into a strict editable blueprint; deterministic code governs play | Passed |
| Evaluation | Frozen prompt set, schema validity, movement-safety, diversity, latency, and fallback checks | Passed by plan |
| Human control | Review/edit/accept/regenerate; invalid output rejected; pause and camera-loss recovery | Passed by plan |
| AI provenance | Store prompt, blueprint, model/config, validation result, and user edits; never video | Passed by plan |
| Cost/latency | One bounded generation call; target p95 under 8 s and $0.02; deterministic fallback | Passed by plan |
| Repository/hosting | `nora-rasuli/move-canvas`, Vercel production after audit | Passed |
| Data/privacy | Raw camera frames remain local; transmit semantic events only | Mandatory |
| Free-tier alternatives | Supabase Free recommended; Firebase Spark, Ably Free, and Cloudflare Durable Objects Free compared in `infrastructure-options.md` | Passed; account choice open |
| Paid services | No paid service required for the planned launch; hosted dependencies must hard-stop or remain within verified free quota | Passed |
| Hardest uncertainty | Reliable cross-device pairing and low-latency pose events on real phones | Bounded spike first |

## Decision

**`Pass with owned external actions` — 2026-11-19.** Local packaging and build
may start. Public repository creation and production publication remain later
factory stages; credentials are not a reason to weaken the local functional
gate.

## Package 1.1 coaching expansion preflight

| Gate | Decision/evidence | Status |
|---|---|---|
| Existing product preservation | Package 1.0 game and private multiplayer requirements remain a mandatory regression gate | Passed by package |
| Dance input | Same-origin curated or local MP4/WebM only, 10–90 seconds; no arbitrary URL fetch, upload, re-hosting, or peer file relay | Passed by package |
| Dance claim | Relative 2D pose/timing similarity to the selected reference under current visibility; no artistry, identity, mastery, or expert-coaching claim | Mandatory claim boundary |
| Tennis scope | Shadow serve and shadow forehand only; no ball or racket required | Passed by package |
| Tennis claim | Coarse ordered body-pose phases and repeated timing/form cues only; no ball contact, racket face/path, spin, speed, placement, force, 3D biomechanics, medical, or injury claim | Mandatory claim boundary |
| Coaching AI role | Deterministic pose/timing rules and authored feedback; no generative model decides scores or coaching cues in v1.1 | Passed |
| Raw media privacy | Phone camera/performance media stays on phone; selected reference video stays on display; raw media and raw user landmark streams are neither persisted nor transmitted | Mandatory |
| Peer data | Display→phone normalized time-indexed reference landmarks; phone→display semantic phase/timing/form/confidence events and aggregates | Passed by package |
| Consent/control | Explicit camera permission, local-reference selection, pause/stop/discard, low-confidence no-score behavior, optional aggregate-only save | Passed by package |
| Reference rights | User is responsible for selecting media they may use locally; app does not publish, share, fingerprint, or retain the file | Publication copy required |
| Functional evidence | Fresh local clip plus live paired phone; three valid reps for each tennis drill; Package 1.0 game trace | Stage 03 gate |
| Accuracy evidence | Frozen deterministic traces plus limited named-device checks; no population-level accuracy claim | Stage 03 gate |

**Package 1.1 decision:** `Pass with strict privacy and claim boundaries` —
2026-11-19. The expansion is bounded for a one-week build only if history,
remote media, additional strokes, generative coaching, and biomechanical/health
claims remain out of scope. Publication remains blocked until Stage 03
reproduces all three modes and the network/privacy audit.

