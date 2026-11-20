"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlueprintResponse } from "@/lib/blueprint";

const SUGGESTIONS = [
  "A space courier where I reach for stars and duck meteors",
  "An underwater treasure hunt with pearls and jellyfish",
  "A glowing forest where I collect fireflies before the storm",
];

export function Creator() {
  const [prompt, setPrompt] = useState(SUGGESTIONS[0]);
  const [result, setResult] = useState<BlueprintResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function createGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (prompt.trim().length < 12) {
      setError("Add a little more detail—include a world, goal, or obstacle.");
      return;
    }
    setStatus("loading");
    try {
      const response = await fetch("/api/blueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const payload = (await response.json()) as BlueprintResponse | { error: string };
      if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "Unable to create game");
      setResult(payload);
      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create the game. Try again.");
      setStatus("error");
    }
  }

  return (
    <section className="creator-shell" id="create" aria-labelledby="creator-title">
      <div className="creator-heading">
        <p className="eyebrow">START WITH A SENTENCE</p>
        <h2 id="creator-title">What should we play?</h2>
        <p>We arrange tested game mechanics—never generated code—and you approve every movement.</p>
      </div>

      <form className="prompt-card" onSubmit={createGame}>
        <label htmlFor="game-idea">Your game idea</label>
        <textarea
          id="game-idea"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          maxLength={280}
          aria-describedby={error ? "prompt-error prompt-help" : "prompt-help"}
        />
        <div className="prompt-meta" id="prompt-help">
          <span>{prompt.length}/280</span>
          <span>Try a place + a goal + an obstacle</span>
        </div>
        {error ? <p className="form-error" id="prompt-error" role="alert">{error}</p> : null}
        <div className="suggestions" aria-label="Example game ideas">
          {SUGGESTIONS.map((suggestion, index) => (
            <button type="button" key={suggestion} onClick={() => setPrompt(suggestion)}>
              {index + 1} · {suggestion.split(" ").slice(0, 5).join(" ")}…
            </button>
          ))}
        </div>
        <button className="button button-ink" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Building your blueprint…" : "Build my game"}
          <span aria-hidden="true">✦</span>
        </button>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {result ? <BlueprintPreview result={result} /> : null}
      </div>
    </section>
  );
}

function BlueprintPreview({ result }: { result: BlueprintResponse }) {
  const router = useRouter();
  const game = result.blueprint;
  return (
    <article className="blueprint" style={{ "--game-accent": game.theme.palette[1] } as React.CSSProperties}>
      <div className="blueprint-top">
        <div>
          <p className="eyebrow">YOUR PLAYABLE BLUEPRINT</p>
          <h3>{game.title}</h3>
          <p>{game.oneLine}</p>
        </div>
        <span className={`generator-tag ${result.provenance.generator === "ai" ? "tag-ai" : ""}`}>
          {result.provenance.generator === "ai" ? "AI arranged" : "Offline blueprint"}
        </span>
      </div>
      <dl className="blueprint-facts">
        <div><dt>World</dt><dd>{game.theme.world}</dd></div>
        <div><dt>Round</dt><dd>{game.durationSeconds} seconds</dd></div>
        <div><dt>Energy</dt><dd>{game.intensity}</dd></div>
        <div><dt>Moves</dt><dd>{game.gestures.length} calibrated</dd></div>
      </dl>
      <div className="move-list" aria-label="Game movements">
        {game.gestures.map((gesture) => <span key={gesture}>{formatGesture(gesture)}</span>)}
      </div>
      <div className="blueprint-actions">
        <button className="button button-primary" type="button" onClick={() => {
          localStorage.setItem("move-canvas:active-blueprint", JSON.stringify(game));
          router.push("/calibrate");
        }}>
          Save &amp; calibrate <span aria-hidden="true">→</span>
        </button>
        <p>Next: use your camera to set a comfortable range. No video is uploaded.</p>
      </div>
    </article>
  );
}

function formatGesture(value: string) {
  return value.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

