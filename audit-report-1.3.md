# Move Canvas Package 1.3 — Stage 04 Audit

**Decision:** PASS for staged Production deployment  
**Audited candidate:** `8984ce96dfeea8f574bfbf5de67658881a91061d`  
**Date:** 2026-11-20, America/Los_Angeles

## Product review

The calibration repair removes an impossible interaction: a player no longer
has to touch the phone and hold a distant full-body pose simultaneously. The
practice library makes the first choice understandable before media setup. The
TV self-view is optional and reversible rather than silently changing the
camera privacy model.

## Technical and privacy review

- Consent is granular: camera analysis consent and TV video sharing are
  separate controls.
- WebRTC encrypts media in transit with the browser's standard DTLS-SRTP stack.
- Supabase carries bounded signaling records only; it does not carry the media
  stream.
- The STUN service can observe connection metadata such as public IP addresses;
  the app does not claim network anonymity.
- No TURN relay is configured. Direct connection may fail on restrictive NAT or
  enterprise networks, but practice correctly continues without live video.
- No recording, upload, Blob, database, or local-storage path exists for the
  live stream.
- Closing sharing, disconnecting the phone, or unmounting the route closes the
  peer connection and removes the display stream.
- Backhand and volley remain bounded 2D shadow-practice classifications, not
  ball, racket, speed, force, biomechanics, or professional coaching analysis.

## Findings

No in-scope P0 or P1 implementation finding remains. Physical device/network
evidence and optional production-grade TURN selection remain follow-up gates
for making a universal-connectivity claim. The product must not claim that all
TV/network combinations work until that evidence exists.

## Route

Create a Production-scoped staged deployment without assigning the canonical
domain, verify routes, practice-selection UI, signaling schema, and browser
flows, then promote the same tested deployment.
