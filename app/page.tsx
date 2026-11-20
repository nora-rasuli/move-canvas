import { Creator } from "@/components/creator";

export default function Home() {
  return (
    <main id="main">
      <nav className="nav" aria-label="Primary navigation">
        <a className="brand" href="#main" aria-label="Move Canvas home">
          <span aria-hidden="true">M</span>
          Move Canvas
        </a>
        <a className="nav-link" href="#how-it-works">How it works</a>
      </nav>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">YOUR IDEA · YOUR MOVES · BIG SCREEN</p>
          <h1 id="hero-title">Make the game<br />you want to move in.</h1>
          <p className="hero-deck">
            Describe a challenge. Choose movements that feel good. Move Canvas
            turns it into a game you control with your phone camera and play on a TV.
          </p>
          <a className="button button-primary" href="#create">Create a game <span aria-hidden="true">↘</span></a>
        </div>

        <div className="hero-art" aria-label="Illustration of a player reaching for a game target">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="player" aria-hidden="true">
            <span className="player-head" />
            <span className="player-body" />
            <span className="player-arm" />
          </div>
          <div className="target target-one" aria-hidden="true">✦</div>
          <div className="target target-two" aria-hidden="true">●</div>
          <p className="art-note">No controller.<br />No fixed catalog.</p>
        </div>
      </section>

      <Creator />

      <section className="how" id="how-it-works" aria-labelledby="how-title">
        <p className="eyebrow">FROM SENTENCE TO START LINE</p>
        <h2 id="how-title">Three minutes to your first round.</h2>
        <ol className="steps">
          <li><span>01</span><strong>Describe it</strong><p>Give the game a world, a goal, or an inside joke.</p></li>
          <li><span>02</span><strong>Make it yours</strong><p>Review every move and calibrate your comfortable range.</p></li>
          <li><span>03</span><strong>Put it on TV</strong><p>Pair a browser, prop up your phone, and move to play.</p></li>
        </ol>
      </section>

      <footer>
        <span className="brand brand-footer"><span aria-hidden="true">M</span>Move Canvas</span>
        <p>Camera frames stay on your phone. Only game controls reach the display.</p>
      </footer>
    </main>
  );
}
