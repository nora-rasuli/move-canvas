# Move Canvas Package 1.3 — Stage 05 Publish Report

**Result:** PASS  
**Date:** 2026-11-20, America/Los_Angeles  
**Production:** <https://move-canvas.vercel.app>

## Release identity

- Feature candidate: `8984ce96dfeea8f574bfbf5de67658881a91061d`
- Deployment source: `e25c64b` (feature candidate plus validation/audit records)
- CI: <https://github.com/nora-rasuli/move-canvas/actions/runs/44819267946>
- Staged and promoted deployment: `dpl_6xC4NmGv7WpZeJxHJV4nPUt7zaM6`
- Immutable URL:
  <https://move-canvas-c6cov9smj-norarasuli-gmailcoms-projects.vercel.app>

## Release procedure

1. Verified the intended Vercel target was team
   `norarasuli-gmailcoms-projects`, project `move-canvas`, Production branch
   `main`.
2. Built from a clean `git archive` of the audited source; untracked local test
   artifacts were not uploaded.
3. Created a Production-scoped deployment with `--skip-domain`.
4. Confirmed the home, Dance, Tennis, and controller routes returned HTTP 200
   with the expected security headers.
5. Promoted that exact staged deployment to the canonical production alias.

## Public verification

- `/`, `/coach/dance`, `/coach/tennis`, and `/coach/controller`: HTTP 200.
- Hydrated browser found four Dance/movement choices and four Tennis choices.
- Hydrated controller rendered hands-free calibration controls and the explicit
  **Show my live camera on the paired TV** consent.
- No page error was observed in the production browser checks.
- Production YouTube search returned HTTP 200 with eight results.
- Production error-log query returned zero records for the 30-minute release
  window.

## Protection cleanup

Authenticated staged-route checks caused the CLI to create two persistent
automation-bypass credentials. Verification stopped immediately, both
credentials were revoked through the project API, temporary credential files
were deleted, and the final project configuration reports zero protection
bypass entries. Deployment Protection itself was not disabled.

## Decision and boundary

Package 1.3 is the public production release. Browser automation proves the
practice libraries and a real browser-to-browser WebRTC stream. It does not
prove Nora's specific physical TV, phone, Wi-Fi, audible prompt volume, or NAT
path. Those remain the next Stage 06 device checks; the portfolio must not
claim universal TV compatibility.
