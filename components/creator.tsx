"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  blueprintResponseSchema,
  gameBlueprintSchema,
  type BlueprintEdit,
  type BlueprintResponse,
  type GameBlueprint,
  type Gesture,
  type StoredBlueprintRecord,
} from "@/lib/blueprint";
import { writeBrowserStorage } from "@/lib/browser-storage";
import { saveGame } from "@/lib/saved-games";
import { SAVED_GAMES_CHANGED } from "@/components/saved-games";
import { publishGame } from "@/lib/community-games";
import { COMMUNITY_GAMES_CHANGED } from "@/components/community-library";

const SUGGESTIONS = [
  "A space courier where I reach for stars and duck meteors",
  "An underwater treasure hunt with pearls and jellyfish",
  "A glowing forest where I collect fireflies before the storm",
];

export function Creator() {
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState(SUGGESTIONS[0]);
  const [result, setResult] = useState<BlueprintResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function generateBlueprint() {
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
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(readApiError(payload));
      }
      const parsed = blueprintResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error("The blueprint response was invalid. Try again.");
      setResult(parsed.data);
      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create the game. Try again.");
      setStatus("error");
    }
  }

  function createGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void generateBlueprint();
  }

  function discardBlueprint() {
    setResult(null);
    window.requestAnimationFrame(() => promptRef.current?.focus());
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
          ref={promptRef}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          maxLength={280}
          aria-describedby={error ? "prompt-error prompt-help" : "prompt-help"}
        />
        <div className="prompt-meta" id="prompt-help">
          <span>{prompt.length}/280</span>
          <span>Try a place + a goal + an obstacle</span>
        </div>
        {error ? (
          <p className="form-error" id="prompt-error" role="alert">
            {error}
          </p>
        ) : null}
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
        {result ? (
          <BlueprintPreview
            key={result.provenance.generatedAt}
            result={result}
            onDiscard={discardBlueprint}
            onRegenerate={() => void generateBlueprint()}
          />
        ) : null}
      </div>
    </section>
  );
}

function BlueprintPreview({
  result,
  onDiscard,
  onRegenerate,
}: {
  result: BlueprintResponse;
  onDiscard: () => void;
  onRegenerate: () => void;
}) {
  const router = useRouter();
  const [game, setGame] = useState(result.blueprint);
  const [editError, setEditError] = useState("");
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "published">("idle");
  const [publishMessage, setPublishMessage] = useState("");

  function update<K extends keyof GameBlueprint>(field: K, value: GameBlueprint[K]) {
    setGame((current) => ({ ...current, [field]: value }));
    setEditError("");
  }

  function toggleGesture(gesture: Gesture) {
    const gestures = game.gestures.includes(gesture)
      ? game.gestures.filter((candidate) => candidate !== gesture)
      : [...game.gestures, gesture];
    update("gestures", gestures);
  }

  function buildRecord() {
    const parsed = gameBlueprintSchema.safeParse(game);
    if (!parsed.success) {
      setEditError("Keep a title, a clear description, and at least two supported movements.");
      return null;
    }
    const edits = collectEdits(result.blueprint, parsed.data);
    return {
      version: "1.1",
      blueprint: parsed.data,
      provenance: result.provenance,
      edits,
      acceptedAt: new Date().toISOString(),
    } satisfies StoredBlueprintRecord;
  }

  function acceptBlueprint() {
    const record = buildRecord();
    if (!record) return;
    const blueprintSaved = writeBrowserStorage(
      "local",
      "move-canvas:active-blueprint",
      JSON.stringify(record.blueprint),
    );
    const recordSaved = writeBrowserStorage(
      "local",
      "move-canvas:active-blueprint-record",
      JSON.stringify(record),
    );
    if (!blueprintSaved || !recordSaved) {
      setEditError("Browser storage is unavailable. Allow local site data, then try again.");
      return;
    }
    const libraryEntry = saveGame(record);
    if (!libraryEntry) {
      setEditError("Browser storage is unavailable. Allow local site data, then try again.");
      return;
    }
    window.dispatchEvent(new Event(SAVED_GAMES_CHANGED));
    router.push("/calibrate");
  }

  async function publishBlueprint() {
    const record = buildRecord();
    if (!record) return;
    setPublishStatus("publishing");
    setPublishMessage("");
    try {
      await publishGame(record);
      if (!saveGame(record)) throw new Error("Browser storage is unavailable.");
      window.dispatchEvent(new Event(SAVED_GAMES_CHANGED));
      window.dispatchEvent(new Event(COMMUNITY_GAMES_CHANGED));
      setPublishStatus("published");
      setPublishMessage("Published to the player library and saved to My Space.");
    } catch {
      setPublishStatus("idle");
      setPublishMessage("Publishing failed. Check your connection and try again.");
    }
  }

  return (
    <article
      className="blueprint"
      style={{ "--game-accent": game.theme.palette[1] } as React.CSSProperties}
    >
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
      <fieldset className="blueprint-editor">
        <legend>Review and edit before camera setup</legend>
        <label>
          Game title
          <input
            value={game.title}
            maxLength={48}
            onChange={(event) => update("title", event.target.value)}
          />
        </label>
        <label>
          Game description
          <textarea
            value={game.oneLine}
            maxLength={120}
            onChange={(event) => update("oneLine", event.target.value)}
          />
        </label>
        <div className="blueprint-editor-row">
          <label>
            Round length
            <select
              value={game.durationSeconds}
              onChange={(event) => update("durationSeconds", Number(event.target.value))}
            >
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={90}>90 seconds</option>
            </select>
          </label>
          <label>
            Energy
            <select
              value={game.intensity}
              onChange={(event) =>
                update("intensity", event.target.value as GameBlueprint["intensity"])
              }
            >
              <option value="gentle">Gentle</option>
              <option value="lively">Lively</option>
            </select>
          </label>
        </div>
        <fieldset className="gesture-editor">
          <legend>Supported movements · choose at least two</legend>
          {(["reach_left", "reach_right", "duck", "freeze"] as const).map((gesture) => (
            <label key={gesture}>
              <input
                type="checkbox"
                checked={game.gestures.includes(gesture)}
                onChange={() => toggleGesture(gesture)}
              />
              {formatGesture(gesture)}
            </label>
          ))}
        </fieldset>
        {editError ? (
          <p className="form-error" role="alert">
            {editError}
          </p>
        ) : null}
      </fieldset>
      <dl className="blueprint-facts">
        <div>
          <dt>World</dt>
          <dd>{game.theme.world}</dd>
        </div>
        <div>
          <dt>Round</dt>
          <dd>{game.durationSeconds} seconds</dd>
        </div>
        <div>
          <dt>Energy</dt>
          <dd>{game.intensity}</dd>
        </div>
        <div>
          <dt>Moves</dt>
          <dd>{game.gestures.length} calibrated</dd>
        </div>
      </dl>
      <div className="move-list" aria-label="Game movements">
        {game.gestures.map((gesture) => (
          <span key={gesture}>{formatGesture(gesture)}</span>
        ))}
      </div>
      <div className="blueprint-actions">
        <button className="button button-primary" type="button" onClick={acceptBlueprint}>
          Save game &amp; calibrate <span aria-hidden="true">→</span>
        </button>
        <button
          className="button button-publish"
          type="button"
          disabled={publishStatus !== "idle"}
          onClick={() => void publishBlueprint()}
        >
          {publishStatus === "publishing"
            ? "Publishing…"
            : publishStatus === "published"
              ? "Published"
              : "Publish to library"}
        </button>
        <button className="button button-ghost" type="button" onClick={onRegenerate}>
          Regenerate from idea
        </button>
        <button className="button button-ghost" type="button" onClick={onDiscard}>
          Discard blueprint
        </button>
        <p>Save keeps it private. Publish shares the reviewed game blueprint—never camera video.</p>
        {publishMessage ? (
          <p
            className={publishStatus === "published" ? "publish-success" : "form-error"}
            role="status"
          >
            {publishMessage}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function readApiError(value: unknown) {
  if (value && typeof value === "object" && "error" in value && typeof value.error === "string") {
    return value.error;
  }
  return "Unable to create the game. Try again.";
}

function collectEdits(original: GameBlueprint, edited: GameBlueprint): BlueprintEdit[] {
  const editedAt = new Date().toISOString();
  const fields: Array<BlueprintEdit["field"]> = [
    "title",
    "oneLine",
    "durationSeconds",
    "intensity",
    "gestures",
  ];
  return fields.flatMap((field) => {
    const previous = serializeEditValue(original[field]);
    const next = serializeEditValue(edited[field]);
    return previous === next ? [] : [{ field, previous, next, editedAt }];
  });
}

function serializeEditValue(value: GameBlueprint[keyof GameBlueprint]) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function formatGesture(value: string) {
  return value
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
