# Factory Run — Move Canvas

| Date | Station | Decision | Next route | Evidence |
|---|---|---|---|---|
| 2026-11-19 | Opportunity Lab | Original fixed-game concept rejected; creator pivot advanced | Stage 00 | DISC-2026-008, OPP-2026-014 |
| 2026-11-19 | 00 Customer & Market Validation | PASS for prototype; payment/retention remain debt | Originality/name/preflight | Stage-00 record |
| 2026-11-19 | Originality | PASS — crowded but differentiated | Preflight | `originality-gate.md` |
| 2026-11-19 | Preflight | PASS with owned external actions | 01 Package | `release-preflight.md` |
| 2026-11-19 | 01 Package | Frozen package 1.0 ready | Independent package verification | Brief/package/handoff |
| 2026-11-19 | 01 Verification | PASS | 02 Build | `stage-01-verification.md` |
| 2026-11-19 | Factory rooms | SYNCHRONIZED | Continue Stage 02 | Dedicated sidebar section and rooms 00–05 registered in `factory/room-registry.md` |
| 2026-11-19 | 02 Build | IN PROGRESS | Verify private multiplayer relay | Named players, TV join QR, per-player scores, team score, and leaderboard implemented; Supabase private-channel policies applied |
| 2026-11-19 | 01 Package change | Frozen Package 1.1 adds Dance Coach and Tennis Coach while preserving Motion Game | Independent additive verification | `project-package.md`, `project-brief.md`, `implementation-handoff.md` |
| 2026-11-19 | 01 Verification 1.1 | PASS — bounded with strict privacy and truth boundaries | Resume 02 Build | `stage-01-verification-1.1.md`, `release-preflight.md` |
| 2026-11-19 | 02 Build 1.1 | AUTOMATED CANDIDATE PASS; physical evidence pending | Keep Stage 02; create immutable candidate and hand to fresh Stage 03 | 21 unit tests, production build, 6 Playwright tests, `build-report.md` |
| 2026-11-19 | 03 Independent validation 1.1 | REWORK on candidate `7374066` | Return bounded clock, calibration, and countdown findings to 02 Build | Preserved `validation-report-1.1.md` |
| 2026-11-19 | 02 Build 1.1 rework | REPAIR AUTOMATION PASS; physical evidence still pending | Create immutable repair candidate; fresh Stage 03 exact recheck | Shared elapsed/media controls, session calibration, Tennis countdown; 27 unit tests and 6 Playwright tests |
| 2026-11-19 | 03 Repair recheck 1 | REWORK on candidate `7f56def` | Return paused-stop and display-reload findings to 02 Build | Preserved `validation-report-1.1-recheck-1.md` |
| 2026-11-19 | 02 Build recheck 1 repair | FULL AUTOMATED PASS; physical evidence still pending | Create immutable candidate; route to fresh Stage 03 exact recheck | Idempotent paused Stop on both peers; ready/paused/running display re-handshake; 28 unit tests, production build, and 8 Playwright scenarios |
| 2026-11-20 | 03 Repair recheck 2 | PASS for automated Stage 04 eligibility; physical/manual debt retained | 04 Audit | `validation-report-1.1-recheck-2.md`; candidate `c53ea713f7361bdc8706815324754051dbd9ad7f` |
| 2026-11-20 | 04 Independent audit | PASS — ready with disclosed limitations | 05 Publish | `audit-report-1.1.md`; immutable audited candidate `ca641036a50625d59cd58c4b9b477504915665fe` |
| 2026-11-20 | 05 Publish | PASS — production, public repository, CI, routes/API/headers, private-room isolation, and 10/10 production Playwright scenarios verified | 06 Live Product Review | `publish-report-1.1.md`; deployment `dpl_J4XHhVgS1f5qoDmVAQNqqragxGG1`; source `5f94a5e946c12434a05908179a0193ee2804e3b2` |
| 2026-11-20 | 05 Portfolio presentation | PASS — public case study, GitHub profile feature, and repository pin verified | 06 Live Product Review | <https://nora-rasuli.github.io/work/move-canvas/> at portfolio commit `d04eb2e14989a2255c0cea509a465e27f867cb7a` |
| 2026-11-20 | 06 Live Product Review | REWORK — two P1 production failures and adjacent P2 fixture-surface cleanup | Return bounded package to 02 Build | `live-product-review-1.1.md`; `MC-LIVE-P1-01`, `MC-LIVE-P1-02`, `MC-LIVE-P2-01` |
| 2026-11-20 | 02 Build live repair 1 | IN PROGRESS | Create immutable repair candidate; route to fresh Stage 03 | Controller/camera/calibration readiness, behaviorally distinct fallback, production fixture removal |
| 2026-11-20 | 02 Build integrated handoff | SINGLE WORKER ACTIVE — duplicate factory-room worker stopped to avoid shared-checkout conflicts | Upstream worker integrates repair plus authorized reference/library expansion, runs full gate, and returns candidate | Built-in dance/tennis clips; official YouTube search/embed with no-frame-analysis boundary; reference-relative local/uploaded analysis; saved game library |
| 2026-11-20 | 02 Build Package 1.2 candidate | AUTOMATED PASS — external configuration pending | Apply database migration and YouTube secret, then immutable Stage 03 candidate | 42 unit tests, production build, 11 Playwright scenarios; publish/like/My Space and paired readiness recovery pass |
| 2026-11-20 | 03 Package 1.2 validation | PASS | 04 Audit | `validation-report-1.2.md`; candidate `8f057f5`; 42 tests, 11 browser scenarios, green CI |
| 2026-11-20 | 04 Package 1.2 audit | PASS — no in-scope P0/P1 findings | 05 Publish | `audit-report-1.2.md`; RLS, server-owned like counts, truthful YouTube boundary, accessibility and recovery reviewed |
| 2026-11-20 | 05 Package 1.2 publish | PASS — public production release | 06 Live Product Review | `publish-report-1.2.md`; deployment `dpl_FuCeBn1k9hGuLcVRbMBje6nLpRDr`; source `8f057f5` |
| 2026-11-20 | 06 Package 1.2 live review | PASS for tested public flows | Portfolio presentation and physical device evidence | Canonical URL 200; real library empty state; YouTube API returned 8 results; no browser errors |
| 2026-11-20 | 02 Build Package 1.3 | AUTOMATED CANDIDATE PASS | Immutable candidate and Stage 03 | Hands-free calibration, focused Dance/Tennis libraries, opt-in WebRTC TV self-view; 42 unit tests, production build, 12 browser scenarios |
| 2026-11-20 | 03 Package 1.3 validation | PASS | 04 Audit | `validation-report-1.3.md`; exact candidate `8984ce9`; green CI run `44819267946` |
| 2026-11-20 | 04 Package 1.3 audit | PASS for staged Production | 05 Publish | `audit-report-1.3.md`; explicit consent, bounded signaling, no media persistence, truthful STUN/TURN limits |
| 2026-11-20 | 05 Package 1.3 publish | PASS — exact staged deployment promoted | 06 Live Product Review | `publish-report-1.3.md`; deployment `dpl_6xC4NmGv7WpZeJxHJV4nPUt7zaM6`; canonical routes 200 |
| 2026-11-20 | 06 Package 1.3 automated live review | PASS for public browser/API scope | Physical TV/phone review | Four Dance/movement and four Tennis choices rendered; controller consent/hands-free controls rendered; YouTube returned 8; zero recent production errors |
| 2026-11-20 | 05 Package 1.3 portfolio presentation | PASS — case study synchronized and public | Physical TV/phone review | <https://nora-rasuli.github.io/work/move-canvas/> at portfolio commit `9b57459`; portfolio CI and Pages PASS |
| 2026-11-20 | User Testing Lab intake | READY — simulated track only | Run MC-P01–MC-P08, then physical Nora device session | `user-testing/persona-matrix-1.3.md`, `user-testing/user-testing-plan-1.3.md`; no real-participant evidence yet |
| 2026-11-20 | User Testing Lab simulated run | PASS — simulated track only after two P1 and one P2 correction loops | Physical MC-R01 phone/TV session | Eight session artifacts and `user-testing/user-testing-report-1.3.md`; production `ee81558` / `dpl_GULYNHsGE3KfWyVaj5AxTMzGM2Ds`; 48 unit and 16 browser tests; zero real participants |
| 2026-11-20 | 02 Build scoring improvement | AUTOMATED CANDIDATE PASS | Publish exact candidate, then physical score calibration | Transparent 0–100 Dance/Tennis score, disclosed four-part formula, browser-local scoped personal best; 51 unit and 16 browser tests |

## Active state

Package 1.3 plus User Testing corrections is public at commit `ee81558`. A
transparent coaching-score improvement has passed the complete automated gate
and is awaiting exact-candidate publication. Eight simulated configurations
passed after two P1 and one P2 correction loops. This is not real-user
evidence. The next route after publication is Nora's physical TV/phone review:
hands-free seated/standing calibration, visible/audible cues, live player view,
stop-sharing behavior, score fairness, and restrictive-network/TURN need.
Stage 07 remains closed until real post-launch observation exists.

