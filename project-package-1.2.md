# Move Canvas — Package 1.2 Expansion

## Product outcome

Package 1.2 closes the Stage 06 production-readiness failures and expands Move
Canvas into a functional motion platform. A display cannot start without a
current phone peer, camera consent, whole-body framing, session calibration,
and an eligible reference. Motion Game prompts now change bounded mechanics as
well as visual language. Test fixtures remain available only in the E2E build.

The expansion adds:

- licensed built-in Dance and Tennis reference clips;
- local MediaPipe reference extraction for bundled clips and user-owned files;
- official YouTube search and privacy-enhanced playback as a synchronized visual
  reference, with no false claim that YouTube frames are available for scoring;
- browser-local My Space with replay and JSON export;
- intentional publishing to a shared game library;
- one-like-per-user toggles and Add to My Space; and
- explicit disconnect/reload readiness recovery.

## Functional requirements

| ID | Requirement | Acceptance evidence |
|---|---|---|
| READY-01 | Display start and resume require a current ready controller state | Display-only negative test; reload/recovery E2E |
| INPUT-01 | Distinct prompts affect bounded mechanics, not nouns alone | Unit corpus for gestures, duration, intensity, cadence, hazards, score |
| REF-01 | Bundled and uploaded references produce local normalized pose timelines | Unit extraction boundaries + paired fixture E2E; physical trace still required |
| YT-01 | Users can search and play YouTube references through official APIs | Route schema + UI flow; production requires server-only API key |
| YT-02 | YouTube is never represented as raw-frame pose input | Visible product boundary + no download/caching path |
| SPACE-01 | Accepted and collected games persist in My Space and can be replayed/exported | Browser E2E + schema validation |
| PUB-01 | A reviewed game can be intentionally published without media or private calibration | RLS-backed publish flow + E2E |
| PUB-02 | Public games can be liked once per identity and copied to My Space | Unique database key + E2E |
| PRIV-02 | Published records contain only validated blueprint/provenance data | Zod boundary + SQL/RLS review |
| A11Y-02 | New reference/library controls have no serious/critical automated violations | Axe E2E |

## Platform data model

- `published_games`: immutable reviewed blueprint record, owner, public copy,
  bounded metadata, server-maintained like count.
- `game_likes`: composite `(game_id, user_id)` primary key; users can insert or
  delete only their own row.
- `user_game_library`: composite `(user_id, game_id)` membership for My Space;
  the playable copy is also stored locally for immediate offline replay.
- Anonymous Supabase Auth supplies a durable browser identity. All writes are
  protected with RLS and publish frequency is capped in the database.

## Truth and privacy boundaries

- Scored pose comparison uses only bundled licensed media or a user-owned local
  upload. The official YouTube player does not expose frames for pose extraction
  and YouTube content is not downloaded, cached, or re-hosted.
- Camera frames, raw user landmarks, reference bytes, calibration records, and
  coaching output are never published.
- Built-in media credits and source licenses live in `REFERENCE-CREDITS.md`.
- Automated paired-browser verification is not a substitute for the outstanding
  physical phone/TV/camera matrix.

## Release gate

The 2026-11-20 integrated candidate passed Prettier, ESLint, strict TypeScript,
42 unit tests across 11 files, a clean Next.js production build, and 11
Playwright scenarios. The E2E suite covers multiplayer, paired coach recovery,
both Tennis drills, saved games, the public library, likes, My Space, keyboard
paths, and serious/critical axe findings.

Production remains blocked until the owner-controlled Supabase migration is
applied, a server-only YouTube API key is configured, an immutable commit is
audited, and that exact candidate is deployed and rechecked.
