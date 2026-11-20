"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  activateSavedGame,
  readSavedGames,
  removeSavedGame,
  type SavedGame,
} from "@/lib/saved-games";

export const SAVED_GAMES_CHANGED = "move-canvas:saved-games-changed";

export function SavedGames() {
  const router = useRouter();
  const [games, setGames] = useState<SavedGame[]>([]);

  useEffect(() => {
    const refresh = () => setGames(readSavedGames());
    refresh();
    window.addEventListener(SAVED_GAMES_CHANGED, refresh);
    return () => window.removeEventListener(SAVED_GAMES_CHANGED, refresh);
  }, []);

  function play(game: SavedGame) {
    if (activateSavedGame(game)) router.push("/calibrate");
  }

  function remove(game: SavedGame) {
    if (!window.confirm(`Remove “${game.record.blueprint.title}” from this browser?`)) return;
    if (removeSavedGame(game.id)) setGames(readSavedGames());
  }

  function exportGame(game: SavedGame) {
    const blob = new Blob([JSON.stringify(game, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${game.record.blueprint.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.move-canvas.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!games.length) return null;

  return (
    <section className="saved-games" aria-labelledby="saved-games-title">
      <div>
        <p className="eyebrow">MY SPACE</p>
        <h2 id="saved-games-title">Your games, ready when you are.</h2>
        <p>Games you create or collect stay in this browser. Export one for a portable backup.</p>
      </div>
      <div className="saved-game-grid">
        {games.map((game) => (
          <article key={game.id} className="saved-game-card">
            <p className="eyebrow">{game.record.blueprint.theme.world}</p>
            <h3>{game.record.blueprint.title}</h3>
            <p>{game.record.blueprint.oneLine}</p>
            <dl>
              <div>
                <dt>Round</dt>
                <dd>{game.record.blueprint.durationSeconds}s</dd>
              </div>
              <div>
                <dt>Moves</dt>
                <dd>{game.record.blueprint.gestures.length}</dd>
              </div>
            </dl>
            <div className="saved-game-actions">
              <button className="button button-primary" type="button" onClick={() => play(game)}>
                Play this game
              </button>
              <button
                className="button button-ghost"
                type="button"
                onClick={() => exportGame(game)}
              >
                Export
              </button>
              <button className="text-button" type="button" onClick={() => remove(game)}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
