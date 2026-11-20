# User Testing Report — Move Canvas Package 1.3

## Decision

- **Decision:** PASS — simulated track only
- **Evidence tracks:** Eight simulated persona inspections; zero real participants
- **Build/commit:** `ee81558`
- **Production deployment:** `dpl_GULYNHsGE3KfWyVaj5AxTMzGM2Ds`
- **Date:** 2026-11-20
- **Reason:** Three actionable barriers completed the correction and production-retest loop. All frozen simulated configurations now pass within their declared evidence boundaries.

## Evidence accounting

| Category | Simulated inspections | Real participants | What may be claimed |
|---|---:|---:|---|
| Sessions completed | 8 | 0 | Eight constraint-based inspections were executed. |
| Configurations | 8 | 0 | Small/zoomed layouts, seated fallback, visible cues, target size, clearer copy, privacy boundaries, and reduced motion were inspected. |
| Automated tests | 48 unit + 16 browser | 0 | The exact release passed the automated gate. |
| Physical phone/TV sessions | 0 | 0 | No real-device usability claim. |

**No real-participant evidence.** Simulated counts must never be described as
users, interviews, feedback from disabled people, adoption, or satisfaction.

## Findings and routing

| Finding | Severity | Affected configurations | Correction route | Production evidence | Status |
|---|---|---|---|---|---|
| MC-UT-P1-01: shipped Dance example rejected by pose extraction | P1 | MC-P01, MC-P04, MC-P06 and all Dance starts | 01 → 02 → 03 → 04 → 05 → production retest | Built-in clip returns 165 clear reference frames | Closed |
| MC-UT-P1-02: standing/knee assumptions excluded seated use | P1 | MC-P02 | 01 → 02 → 03 → 04 → 05 → production/code retest | Seated calibration and Tennis fallback tests; inclusive production copy | Closed, participant validation pending |
| MC-UT-P2-01: technical setup language obscured the task/privacy model | P2 | MC-P01, MC-P06, MC-P07 | Package copy correction → full gate → publish → retest | Plain-language display and phone DOM at `ee81558` | Closed |

## Task results

| Task | Coverage | Result | Evidence limit |
|---|---|---|---|
| UT-01 Understand and choose | MC-P01, P03, P06 | Pass | Agent/automated comprehension inspection only |
| UT-02 Pair | All configurations | Pass, simulated | No physical QR scan or TV browser |
| UT-03 Calibrate | P02, P04, P05 | Pass, code/fixture | No real camera, seated participant, or tremor input |
| UT-04 Practice and recover | All configurations | Pass, deterministic fixture | No physical movement-quality evidence |
| UT-05 Share and revoke | P04, P07, P08 | Bounded pass | Same-device WebRTC; no restrictive NAT/TURN test |
| UT-06 Save/publish/library | P01, P07 | Pass, mocked backend | No public test content created |

## Accessibility and inclusion boundary

- Automated: Axe serious/critical scan, keyboard focus/start/stop, 390 px and 640 px zoom-equivalent layouts, 44 px main-button check, reduced-motion computation.
- Manual production: semantic DOM, visible steps/status, privacy/TV-sharing copy, built-in Dance extraction.
- Real lived-experience evidence: none.
- Unsupported evidence: screen readers, switch access, real magnification, real Deaf/hard-of-hearing use, real mobility range, tremor input, cognitive accessibility, and restrictive networks.

## Next step

- **Owner:** Nora + Portfolio Factory — User Testing Lab
- **Action:** Run MC-R01 on Nora's physical phone and TV/laptop: QR pairing, seated/standing hands-free calibration, Show me on TV on/off, stop sharing, and network recovery.
- **Gate unlocked:** Real-device findings and a bounded participant-testing plan. Do not publish a user-validation claim before this gate.
