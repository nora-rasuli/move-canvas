# Move Canvas Package 1.3 — Stage 02 Build Report

**Decision:** AUTOMATED CANDIDATE PASS  
**Date:** 2026-11-20, America/Los_Angeles

## User problems closed

1. Calibration no longer requires touching the phone while holding a full-body
   pose. One tap arms a five-second window; neutral and comfortable-range
   samples capture automatically once framing is valid. Visible status and
   speech cues confirm each step.
2. Dance and Tennis no longer present as undifferentiated modes. Dance and
   movement offers salsa, hip-hop, contemporary, and yoga/mobility. Tennis
   offers forehand, backhand, serve, and volley.
3. A player can explicitly choose **Show me on TV**. The camera stream travels
   directly to the paired display over WebRTC, is encrypted in transit, is not
   sent through Supabase, and is not stored. Turning the option off closes the
   peer connection. Practice remains usable if video connection fails.

## Verification

- Prettier: PASS
- ESLint: PASS with zero findings
- Strict TypeScript: PASS
- Unit/schema suite: 42 PASS
- Production build: PASS, 14 application routes
- Playwright: 12 PASS
- The browser suite establishes a real WebRTC media connection between phone
  and display contexts and observes the TV live-view state.
- Practice-library navigation, existing paired coaching, recovery, multiplayer,
  community library, accessibility, and established tennis fixtures remain
  passing.

## Remaining physical evidence

- Confirm the live view on Nora's actual TV/laptop and phone combination.
- Record whether the home network needs a TURN relay. The current implementation
  uses direct WebRTC plus a public STUN server; difficult NAT combinations may
  require a production TURN service later.
- Run neutral and comfortable-range capture from normal standing distance with
  phone audio on and off.

## Route

Create the immutable Package 1.3 candidate, run CI, then perform Stage 03/04
review before Production promotion.
