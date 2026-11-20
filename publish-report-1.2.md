# Move Canvas Package 1.2 — Stage 05 Publish Report

**Result:** PASS  
**Date:** 2026-11-20  
**Production URL:** <https://move-canvas.vercel.app>

## Release identity

- GitHub: <https://github.com/nora-rasuli/move-canvas>
- Source commit: `8f057f5`
- GitHub Actions run:
  <https://github.com/nora-rasuli/move-canvas/actions/runs/44812412982>
- Vercel deployment: `dpl_FuCeBn1k9hGuLcVRbMBje6nLpRDr`
- Immutable deployment URL:
  <https://move-canvas-8b9o1nagr-norarasuli-gmailcoms-projects.vercel.app>
- Canonical alias: <https://move-canvas.vercel.app>

## External configuration

- Applied `supabase/community-library.sql` to project
  `wdrmamrfkjbaqftjnpie`.
- Verified all three community tables exist with row-level security enabled.
- Verified anonymous authentication plus publish, like, count, collect, and
  read-back behavior against the configured project.
- Enabled YouTube Data API v3 in project `move-canvas-nora-2026`.
- Stored `YOUTUBE_API_KEY` as an encrypted Vercel secret for Production and
  Preview. The surviving key is restricted to YouTube Data API v3 and is used
  only by the server route.

## Live verification

- `/`: HTTP 200 with the expected product title.
- `/api/youtube/search`: HTTP 200 with eight real search results.
- Bundled dance reference: HTTP 200 and expected byte size.
- Hydrated browser flow: community library loaded its real empty state,
  YouTube search rendered eight results, and no page error occurred.
- Production public library currently contains no seeded game. This is a valid
  empty state; no public content was invented on Nora's behalf.

## Decision

Package 1.2 is publicly deployed and production-functional. Stage 06 passes
for the tested public routes and backend flows. The next high-value manual
check is a physical phone/TV session; publishing an initial featured community
game requires an intentional representational choice by the owner.
