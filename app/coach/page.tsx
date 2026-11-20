import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose a mode",
  description:
    "Choose Motion Game, Dance Coach, or Tennis Coach with explicit privacy and practice limits.",
};

export default function CoachModesPage() {
  return (
    <main className="mode-page" id="main">
      <nav className="nav" aria-label="Primary navigation">
        <Link className="brand" href="/">
          <span aria-hidden="true">M</span>Move Canvas
        </Link>
        <Link className="nav-link" href="/">
          Home
        </Link>
      </nav>
      <section className="mode-intro" aria-labelledby="mode-title">
        <p className="eyebrow">CHOOSE THE ROOM</p>
        <h1 id="mode-title">Play, compare, or practice.</h1>
        <p>
          Three phone-camera experiences. Movement analysis stays on the phone; optional live video
          sharing with the paired display is always controlled by the player.
        </p>
      </section>
      <section className="mode-grid" aria-label="Move Canvas modes">
        <Link className="mode-card mode-game" href="/#create">
          <span>01</span>
          <h2>Motion Game</h2>
          <p>Create a bounded collect-and-dodge game, pair phones, and move together.</p>
          <strong>Make a game →</strong>
        </Link>
        <Link className="mode-card mode-dance" href="/coach/dance">
          <span>02</span>
          <h2>Dance Coach</h2>
          <p>Choose salsa, hip-hop, contemporary, or yoga and mobility reference practice.</p>
          <strong>Set up a reference →</strong>
        </Link>
        <Link className="mode-card mode-tennis" href="/coach/tennis">
          <span>03</span>
          <h2>Tennis Coach</h2>
          <p>
            Choose forehand, backhand, serve, or volley shadow practice without a ball or racket.
          </p>
          <strong>Choose a tennis skill →</strong>
        </Link>
      </section>
      <aside className="truth-banner">
        <strong>Practice cues, clearly bounded.</strong>
        <p>
          Coaching modes use deterministic 2D pose rules. They do not provide medical,
          injury-prevention, biomechanics, or professional-coaching analysis.
        </p>
      </aside>
    </main>
  );
}
