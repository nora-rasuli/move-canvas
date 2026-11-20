# Move Canvas Package 1.1 — Stage 04 Independent Audit

## Audit metadata

- **Stage 04 decision:** `PASS`
- **Release recommendation:** `Ready with disclosed limitations` for an authorized Stage 05 preview; not yet production- or portfolio-ready
- **Frozen brief:** `project-package.md`, Package 1.1
- **Stage 03 input candidate:** `c53ea713f7361bdc8706815324754051dbd9ad7f`
- **Unchanged Stage 03 report:** `validation-report-1.1-recheck-2.md`, SHA-256 `ff757c9b89c48dd9be76bbfbdb07c92f0348d538203b2f3d1e227b6877e39f10`
- **Stage 03 preservation commit:** `aaa2df3ad89930b720af0af203ac1dc9eb5ef6cc`
- **Exact immutable repaired release candidate:** `ca641036a50625d59cd58c4b9b477504915665fe`
- **Audit date:** 2026-11-20, America/Los_Angeles
- **Gate environment:** disposable source copy; Node.js 24.22.3; npm 10.8.2; Chromium through Playwright 1.65.1
- **Live deployment audited:** none; deployment, push, and portfolio work were explicitly out of scope and were not performed

The Stage 03 report was committed byte-for-byte before any audit repair. The repaired candidate was then committed before this report was created, so the release-candidate identity above is stable and does not depend on this report's later commit.

## Decision

`Ready with disclosed limitations`

**Reason:** The exact repaired candidate passes the complete local automated release gate: formatting, lint, strict types, 32 unit/schema tests, production build, 10 multi-context Chromium scenarios, and dependency audit. The audit closed every safe in-repository P0/P1 finding, including untrusted relay/storage parsing, the missing formatter and CI gate, incomplete Motion Game review/provenance controls, route recovery, metadata, storage failure handling, and safety copy. Stage 05 may create and verify a preview only after explicit authorization and owner-controlled service configuration; physical phone/camera/TV, real-media, assistive-technology, and measured-network evidence remain publication gates.

No P0 finding remains. No unresolved in-repository P1 finding remains.

## Executive scorecard

Scores describe the exact release candidate, not unperformed physical or public-launch work.

| Area | Score | Evidence | Blocking? |
|---|---:|---|---|
| Golden path and problem coherence | 3/3 | Fresh-input Motion Game, Dance Coach, and Tennis Coach routes have bounded outcomes and explicit limits. | No |
| Functional real-input path | 2/3 | Fresh prompt and local-media/camera paths exist; physical real-media execution remains open. | Physical gate |
| Scope fidelity | 3/3 | Three frozen modes and non-goals are preserved; no health, biomechanics, or ball/racket analysis was added. | No |
| UX and visual craft | 3/3 | Responsive authored interface, review/edit flow, recovery states, generated social card, and route metadata. | No |
| Responsive behavior | 2/3 | Automated 360 px and 1280 px coverage passes; physical rotation/device matrix remains open. | Physical gate |
| Accessibility | 2/3 | Keyboard, announcements, reduced motion, skip targets, and serious/critical axe checks pass; manual AT/contrast/TV-distance checks remain. | Manual gate |
| Engineering architecture | 3/3 | Strict typed state machines, schema boundaries, private semantic relay, local vision/media, and deterministic analysis. | No |
| Failure/recovery behavior | 3/3 | Storage, malformed state, provider fallback, route errors, pause/stop, and peer reload paths are covered. | No |
| Tests and CI | 3/3 | 32 unit/schema tests, 10 Playwright scenarios, full `verify`, and a least-privilege GitHub Actions workflow. | Remote CI pending push |
| Performance and observability | 1/3 | Payload limits and deterministic clocks are tested; physical p50/p95 latency, drift, and extraction timing are absent. | Measurement gate |
| AI evaluation and regression control | 1/3 | Structured schema and fallback are tested; a versioned representative quality/economics evaluation set is still absent. | Portfolio claim gate |
| AI failure handling and human control | 3/3 | Explicit deterministic fallback plus edit, regenerate, discard, review, and accept controls. | No |
| AI provenance, cost, and latency boundaries | 2/3 | Accepted records retain source/model/fallback/edit provenance; measured provider latency/cost ceilings remain unproven. | Claim gate |
| Repository/documentation | 2/3 | Setup, architecture, privacy, limits, gates, and preview checklist are accurate; public license/live URL are intentionally absent. | Public-release gate |
| Portfolio story and claim integrity | 2/3 | Safe claims and evidence boundaries are documented; physical evidence and a published case study are not complete. | Portfolio gate |
| Distinctive hiring signal | 3/3 | Multi-screen motion control, privacy boundaries, deterministic coaching, and recovery architecture are inspectable. | No |

## Independently repeated checks

The final release gate ran in a disposable source copy, not the retained evidence worktree. Cross-context private-room scenarios used the existing owner-controlled Supabase environment without printing or copying local secret files.

| Check | Result | Evidence |
|---|---|---|
| Stage 03 report preservation | PASS | SHA-256 remained `ff757c9b89c48dd9be76bbfbdb07c92f0348d538203b2f3d1e227b6877e39f10`. |
| `npm run format:check` | PASS | Prettier 3.6.2 checked the complete supported tree. |
| `npm run lint` | PASS | ESLint exited 0. |
| `npm run typecheck` | PASS | Strict TypeScript exited 0. |
| `npm run test` | PASS | 9 Vitest files, 32 tests. |
| `npm run build` | PASS | Next.js production build emitted 13 routes/assets, including icon, Open Graph image, and robots metadata. |
| `npm run test:e2e` | PASS | 10/10 Chromium scenarios in 31.7 seconds. |
| `npm run verify` | PASS | Full formatter → lint → types → unit → build → E2E chain exited 0. |
| `npm audit` | PASS | 0 vulnerabilities. |
| `git diff --check` | PASS | No whitespace errors before the candidate commit. |
| Secret/tracked-env check | PASS | Only `.env.example` is tracked; static scan found no service-role key, private key, or committed environment value. |
| Retained evidence integrity | PASS | Final gate ran in a disposable copy; retained screenshots and `next-env.d.ts` were unchanged in the candidate commit. |

## Brief-to-build traceability

| Brief requirement | Status | Evidence | Boundary |
|---|---|---|---|
| GAME-01 Motion Game golden path | PASS (automation) | Fresh prompt, schema-valid blueprint, editable review, pairing, multiplayer round, result, replay. | Physical phone/display run remains. |
| PAIR-01 private pairing and recovery | PASS (automation) | Private topics, high-entropy codes, room isolation, reconnect/reload, invalid-message rejection. | Physical network/device reconnect remains. |
| CAL-01 personal calibration | PASS (automation) | Session-scoped schema-valid record, reload, threshold effect, no transport shape. | Real comfortable-range quality remains. |
| PRIV-01 privacy boundary | PASS (bounded) | No raw frame/landmark/reference byte/audio/face/calibration transport shape; only semantic/normalized messages. | Physical traffic capture remains. |
| REG-01 original game regression | PASS (automation) | Unit engine coverage and multi-context Playwright round pass. | Fresh physical two-device trace remains. |
| DANCE-03 Dance Coach | PASS (automation) | Normalized timeline, deterministic feedback, pause/resume/end, tracking-loss handling, display recovery. | Real clip/camera/orientation run remains. |
| TENNIS-01 Tennis Coach | PASS (automation) | Serve/forehand fixtures, countdown, ordered phases, confidence gate, keyboard cancellation. | Real bilateral repetitions remain. |
| COACH-PAIR-01 peer controls | PASS (automation) | Either peer can pause, resume, and end; reload restores permitted state without transporting raw media. | Physical peer matrix remains. |
| COACH-PRIV-01 coaching privacy | PASS (bounded) | Normalized reference timeline and semantic events only; calibration remains local/session-scoped. | Physical packet evidence remains. |
| COACH-A11Y-01 | PASS (automated subset) | Keyboard, announcements, skip target, reduced motion, serious/critical axe checks. | Manual AT/contrast/TV-distance remains. |
| COACH-QA-01 | PASS (automated subset) | Malformed records fail closed; storage, pause, tracking-loss, reload, and route failure paths recover truthfully. | Backgrounding/rotation/permission matrix remains. |
| COACH-PERF-01 | PASS (bounded automation) | Clock continuity and message ceilings are tested. | Declared-device timing and network percentiles remain. |

## Resolved findings

### [P1] AUD-FMT-01 — No explicit formatter or formatting gate

- **Initial evidence:** Stage 03 could only note the absence of a formatter script/dependency.
- **Resolution:** Pinned Prettier 3.6.2, added repository configuration/ignore files, normalized supported source, and placed `format:check` first in `verify`.
- **Acceptance:** `npm run format:check` and the complete disposable gate pass.

### [P1] AUD-CI-01 — No default-branch release gate

- **Initial evidence:** No CI workflow existed.
- **Resolution:** Added a read-only GitHub Actions workflow on pull requests and `main` pushes using Node 24, `npm ci`, Chromium installation, high-severity dependency audit, and the full verification chain.
- **Acceptance:** The local equivalent passes. Remote workflow execution is intentionally pending a future push and is not represented as green.

### [P1] AUD-BOUNDARY-01 — Relayed and persisted data were trusted before complete schema validation

- **Initial evidence:** Broadcast payloads and several local/session storage records were parsed or cast without a complete discriminated runtime boundary.
- **Resolution:** Added strict schemas for every session message, player/result data, blueprints/provenance/edits, calibration, coaching results, timelines, phases, and controls. Supabase and `BroadcastChannel` ingress now drop invalid payloads; stored records fail closed. Browser storage access is guarded against unavailable or throwing storage.
- **Acceptance:** Boundary tests reject malformed, oversized, and invalid-control payloads; E2E proves invalid stored records recover without crashing.

### [P1] AUD-HUMAN-01 — Motion Game review lacked the complete frozen human-control/provenance loop

- **Initial evidence:** The generated blueprint handoff did not provide the required edit, regenerate, discard, and inspectable accepted-record trail as one complete path.
- **Resolution:** Added editable title, description, round, energy, and movement controls; validation; explicit regenerate/discard; and accepted-record storage with source, model/fallback, generation time, edit ledger, and calibration version.
- **Acceptance:** A new Playwright scenario completes edit → validation → regenerate → discard → accept and inspects the saved provenance record.

### [P1] AUD-RECOVERY-01 — Global route and storage failure recovery was incomplete

- **Initial evidence:** No global error/loading/not-found states; some skip links lacked a real main target; direct browser storage operations could throw or silently misrepresent persistence.
- **Resolution:** Added global error/loading/404 routes, complete `main` targets, guarded storage helpers, and truthful persistence errors in creator, calibration, and coaching control flows.
- **Acceptance:** Route, 404, skip-target, malformed-storage, and full golden-path E2E checks pass.

### [P1] AUD-REPO-01 — Preview-facing repository and metadata contract was incomplete

- **Initial evidence:** Setup, architecture/privacy boundaries, environment behavior, preview checklist, canonical metadata, icon, social image, robots behavior, and response security headers were missing or incomplete.
- **Resolution:** Rewrote the README around the three bounded modes and exact claims; documented environment and Supabase prerequisites; added route metadata/noindex rules, generated social assets, icon, robots output, and security headers.
- **Acceptance:** Production build emits the assets; browser tests verify metadata, social image, robots, 404, and headers.

### [P1] AUD-SAFE-01 — Dance mode omitted an explicit comfort/clear-space check

- **Initial evidence:** The practice mode's bounded coaching language did not tell the user to check clear space and comfortable movement before beginning.
- **Resolution:** Added visible comfort-and-space guidance while preserving the explicit non-medical, non-injury-prevention boundary.
- **Acceptance:** The Dance Coach route exposes the guidance and the complete mode flow remains green.

## Security and privacy review

- The browser receives only a Supabase publishable key. No service-role/secret key is tracked or required.
- Channels use `private: true`; anonymous sign-in establishes the authenticated role before subscription.
- The RLS file limits send/receive to Broadcast messages on correctly shaped Move Canvas topics. Possession of the 12-character high-entropy code is intentionally the room authorization model; it is not described as user-membership ACL.
- Every inbound relay message is parsed by a strict discriminated union before product code sees it.
- The message contract has no raw camera frame, raw user landmark, reference-video byte, audio, face identity, or calibration-sample shape. A bounded normalized Dance reference timeline is intentionally permitted.
- Static scans found no committed environment value or forbidden raw-media transport identifier.
- Stage 03 independently observed unauthenticated and malformed-topic join failures, authenticated valid-topic success, semantic send success, and no cross-room delivery.

Before a preview uses Supabase, the owner must confirm Realtime **Allow public access** is disabled so private-channel RLS is enforced. Before any public launch, the owner must also enable suitable bot protection/rate limits and adopt an anonymous-user retention/cleanup plan. Anonymous users are durable Auth records and use the authenticated Postgres role; the candidate documents this instead of silently changing the external project.

Current primary-source basis: Supabase [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization), [Realtime Settings](https://supabase.com/docs/guides/realtime/settings), [Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous), and the [Realtime schema lockdown changelog](https://supabase.com/changelog/realtime-schema-locked-down-against-modification). The implementation continues to use supported policies on `realtime.messages`; it does not attempt to modify the locked Realtime schema.

## Accessibility and responsive review

- Automated coverage includes keyboard mode selection, countdown cancellation/restart, pause/resume/end controls, skip links, assertive status updates, reduced-motion behavior, 360 px controller layouts, 1280 px display layouts, and serious/critical axe checks on covered states.
- Automated checks found zero serious or critical axe violations in the covered paths.
- This is not a WCAG-conformance claim. Screen-reader behavior, contrast, physical TV viewing distance, rotation, backgrounding, permission denial, and a supported browser/device matrix remain manual evidence debt.

## AI product audit

- [ ] A versioned representative evaluation set measures blueprint usefulness beyond format compliance.
- [ ] Task-level AI-quality thresholds and regression stop conditions are independently reproduced.
- [x] Provider-unavailable and malformed-output paths preserve an explicit deterministic fallback.
- [x] Users can review, correct, regenerate, discard, and explicitly accept the generated blueprint.
- [x] Accepted records retain prompt/source, model or fallback provenance, timestamp, edit ledger, and calibration version.
- [x] Provider failure does not remove user control or create an unlabelled authoritative output.
- [ ] Per-task model cost, latency, usage ceiling, and comparison basis are measured on the chosen preview configuration.
- [ ] Any public AI-quality claim is backed by the versioned evaluation set, date, model/configuration, and limitations.

The unchecked items are explicit baseline Package 1.0 evaluation/economics debt. They do not block a private Stage 05 preview, but they block unsupported AI-quality, cost, latency, or superiority claims.

## Claim verification

| Proposed claim | Status | Evidence/method | Approved wording |
|---|---|---|---|
| “Creates an editable motion-game blueprint from a fresh prompt.” | Verified | Fresh-input E2E, schema tests, editor/provenance scenario. | Use as written; disclose deterministic fallback when applicable. |
| “Keeps raw camera and reference media in the originating browser.” | Qualified | Static contracts, browser instrumentation, strict relay schema, Stage 03 live trace. | “Designed and independently checked not to relay raw frames, raw landmarks, reference-video bytes, audio, face identity, or calibration samples; physical-network capture remains pending.” |
| “Works across phone and display.” | Qualified | Multi-context Chromium and private-room tests. | “Verified in automated multi-context browser flows; physical device matrix pending.” |
| “Accessible.” | Unsupported as a broad claim | Keyboard/reduced-motion/axe subset only. | “Automated keyboard, reduced-motion, and serious/critical axe checks pass on covered flows; manual assistive-technology review is pending.” |
| “Fast” or a measured latency claim | Unsupported | No declared-device extraction, drift, or p50/p95 network measurements. | Do not publish until measured. |
| “Improves dance/tennis performance” | Unsupported/prohibited | No user outcome study; product is bounded deterministic practice feedback. | Do not publish. |
| Medical, injury-prevention, biomechanics, ball-flight, or racket-analysis capability | Contradicted by scope | Explicit frozen non-goals and implementation boundaries. | Do not publish. |
| User, adoption, revenue, novelty, or coaching-effectiveness metrics | Unsupported | No corresponding evidence. | Do not publish. |

## Repository and deployment audit

- [x] README explains value, modes, architecture, setup, privacy, verification, limitations, and preview procedure.
- [x] `.env.example` is safe and sufficient; only public browser credentials are named.
- [x] Full local gate and dependency audit pass from a disposable source copy.
- [x] Generated/vendor output is ignored and does not obscure authored source.
- [x] Social image, icon, metadata, robots behavior, and response security headers exist.
- [x] CI configuration mirrors the release-critical local gate.
- [ ] Remote default-branch CI is observed green; no push was authorized.
- [ ] Live preview URL and deployment verification exist; Stage 05 has not begun.
- [ ] A public repository license has been selected by the owner; no legal choice was inferred.
- [ ] GitHub description, topics, and public social preview are configured; repository hosting changes were out of scope.

## Physical and manual evidence debt

These are separate from the automated Stage 04 PASS and must remain visible in Stage 05 and any publication decision.

1. Record a fresh physical phone/display Motion Game run, including private pairing, disconnect, reconnect, and result recovery.
2. Complete Dance Coach with a real supported 10–90 second clip and physical camera. Retain decode/extraction timing, normalized trace, lead-side/orientation behavior, confidence handling, tracking loss, pause/resume/end, and display reload evidence.
3. Perform real neutral and comfortable-range calibration and show that the resulting thresholds are personally meaningful and safely bounded.
4. Complete real Shadow Serve and Shadow Forehand repetitions for both handedness choices, including framing, countdown, ordered phases, pause, stop, repeated-issue feedback, and low-confidence rejection.
5. Capture a physical-network trace confirming that camera frames, user performance video, local reference-video bytes, raw audio, calibration samples, and face identity do not leave their originating browser.
6. Measure extraction duration, display/phone clock drift, and semantic-event p50/p95 latency on a declared network and device matrix.
7. Complete manual screen-reader, contrast, TV-distance readability, backgrounding, rotation, permission-denial, and supported browser/device checks.
8. Close or continue to disclose the baseline Package 1.0 editor-evaluation/economics debt: representative AI evaluation, thresholds, model/configuration, cost, latency, and comparison basis. The editor/provenance control portion is closed in this candidate.

## Owner/external preview prerequisites

These are not repository defects and were not silently performed:

1. Explicitly authorize Stage 05 deployment and choose the owner-controlled preview target.
2. Verify the exact Supabase project has anonymous sign-in enabled, Realtime public access disabled, the included policies applied, and no broader permissive policy.
3. For any publicly reachable preview, configure appropriate CAPTCHA/bot protection, rate limits, monitoring, and anonymous-user cleanup/retention.
4. Run and observe remote CI after an authorized push.
5. Choose a license before making the repository public.

## Repair package

### Must fix before featuring publicly

1. Complete and retain the physical/manual evidence matrix above.
2. Reproduce the full gate and critical privacy/recovery flows against the authorized preview URL.
3. Close or qualify the AI evaluation, provider economics, and performance claims.
4. Observe remote CI green and make an explicit license/repository-publication decision.

### Important follow-up

1. Preserve preview response headers, external-service configuration evidence, and the exact deployed commit.
2. Turn the strongest physical evidence into a claim ledger before portfolio copy is written.

### Do not expand into

- New coaching modes, medical or injury-prevention guidance, 3D biomechanics, ball/racket analysis, social accounts, content libraries, or unrelated architecture refactors.

## Re-audit results

- **Commit rechecked:** `ca641036a50625d59cd58c4b9b477504915665fe`
- **Findings resolved:** AUD-FMT-01, AUD-CI-01, AUD-BOUNDARY-01, AUD-HUMAN-01, AUD-RECOVERY-01, AUD-REPO-01, AUD-SAFE-01
- **Findings remaining:** no in-repository P0/P1; physical/manual, owner-controlled service, remote CI, licensing, and public-claim gates remain disclosed
- **Final Stage 04 decision:** `PASS`
- **Next permitted route:** Stage 05 preview deployment and preview verification only; no production or portfolio publication is approved by this report

## Skill coverage update

- **Verified:** React/Next.js, strict TypeScript, deterministic state machines, schema validation, multi-context Playwright, private Supabase Realtime semantics, local pose-processing boundaries, failure recovery, accessibility automation, CI configuration, and human-controlled AI fallback/provenance.
- **Needs evidence:** physical device/camera/media execution, manual assistive technology, measured network/performance results, remote CI, deployment operations, and representative AI quality/economics evaluation.
- **Not demonstrated:** medical/health outcomes, injury prevention, professional coaching, biomechanics, ball/racket analysis, customer adoption, revenue, or measured user impact.
