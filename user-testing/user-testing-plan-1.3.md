# User Testing Plan — Move Canvas Package 1.3

## Identity and authority

- **Product:** <https://move-canvas.vercel.app>
- **Feature candidate:** `8984ce96dfeea8f574bfbf5de67658881a91061d`
- **Evidence track currently authorized:** Simulated persona inspection
- **Real participant authority:** Nora may test her own devices; no third-party
  recruitment, outreach, recording, incentive, or public quotation authorized
- **Room:** Portfolio Factory — User Testing Lab

## Research questions

1. Can a first-time player understand TV/phone roles and reach a ready practice
   state without facilitator rescue?
2. Does hands-free calibration work for distance, seated range, tremor, audio-
   unavailable, zoomed, and low-confidence framing conditions?
3. Can the player understand, start, stop, and revoke TV camera sharing?
4. Are Dance/movement and Tennis choices understandable without specialist
   vocabulary, and are results/limitations interpreted correctly?
5. Does the product recover from permission denial, tracking loss, peer reload,
   slow/disconnected network, and unsupported live view?

## Tasks

| Task ID | Starting state | Goal without UI hints | Success | Failure/recovery condition | Privacy/safety question |
|---|---|---|---|---|---|
| UT-01 | Fresh home page | Explain what Move Canvas does and choose the appropriate mode | Correct phone/TV mental model and mode choice | Ambiguous product explanation | What is public versus private? |
| UT-02 | Dance or Tennis setup | Pair a phone with the display | Correct room, phone visible, recovery available | Invalid code, reload, delayed connection | What does the room code authorize? |
| UT-03 | Paired phone, camera off | Enable camera and complete neutral/range calibration without touching the distant phone | Both samples complete with visible status; audio is optional | Permission denial, full body lost, seated/limited range | Where are landmarks and calibration stored? |
| UT-04 | Calibrated phone | Choose a practice focus/reference and complete a bounded session | Correct choice, start, pause, resume, stop, result comprehension | Tracking loss and reference failure | Is this professional or medical coaching? |
| UT-05 | Camera enabled, TV view off | Turn on Show me on TV, confirm live view, then revoke it | Explicit consent, visible live state, stream removed after off | WebRTC failure or disconnect does not block practice | Is video uploaded, recorded, or shared elsewhere? |
| UT-06 | Saved/published game area | Distinguish My Space, Publish, Like, and Add to My Space | Private save remains private until Publish; safe exit found | Empty/error state and duplicate like | What becomes public and who controls it? |

## Success and routing

- P0/P1 if a supported configuration cannot safely complete, stop, or understand
  a core privacy boundary.
- P2 for material confusion/friction with a recoverable core path.
- Simulated findings are hypotheses until independently reproduced and, where
  lived experience matters, tested with a real participant.
- Any correction routes through `01 → 02 → 03 → 04 → 05`, then returns here.

## First run

Run MC-P01 through MC-P08 against Production in fresh sessions. Retain one
session artifact per row and a combined `user-testing-report-1.3.md`.

## Next step

- **Owner:** Portfolio Factory — User Testing Lab
- **Action:** Execute the eight simulated configurations without inventing user
  statements, then route the highest-confidence P0/P1 finding or return bounded
  PASS.
- **Gate unlocked:** Physical Nora phone/TV test and consented participant plan.
