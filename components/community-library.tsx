"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addGameToSpace,
  listPublishedGames,
  setGameLiked,
  type PublishedGame,
} from "@/lib/community-games";
import { saveGame } from "@/lib/saved-games";
import { SAVED_GAMES_CHANGED } from "./saved-games";

export const COMMUNITY_GAMES_CHANGED = "move-canvas:community-games-changed";

export function CommunityLibrary() {
  const [games, setGames] = useState<PublishedGame[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus("loading");
      setGames(await listPublishedGames());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refresh(), 0);
    const handleChange = () => void refresh();
    window.addEventListener(COMMUNITY_GAMES_CHANGED, handleChange);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener(COMMUNITY_GAMES_CHANGED, handleChange);
    };
  }, [refresh]);

  async function addToSpace(game: PublishedGame) {
    setBusyId(game.id);
    setMessage("");
    try {
      await addGameToSpace(game.id);
      if (!saveGame(game.record)) throw new Error("Local browser storage is unavailable.");
      window.dispatchEvent(new Event(SAVED_GAMES_CHANGED));
      setMessage(`“${game.title}” was added to My Space.`);
    } catch {
      setMessage("That game could not be added. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleLike(game: PublishedGame) {
    const nextLiked = !game.likedByMe;
    setGames((current) =>
      current.map((item) =>
        item.id === game.id
          ? {
              ...item,
              likedByMe: nextLiked,
              likes_count: Math.max(0, item.likes_count + (nextLiked ? 1 : -1)),
            }
          : item,
      ),
    );
    try {
      await setGameLiked(game.id, nextLiked);
    } catch {
      setGames((current) => current.map((item) => (item.id === game.id ? game : item)));
      setMessage("Your like could not be saved. Try again.");
    }
  }

  return (
    <section className="community-library" id="library" aria-labelledby="community-title">
      <div className="library-heading">
        <p className="eyebrow">CREATED BY PLAYERS</p>
        <h2 id="community-title">Find your next living-room game.</h2>
        <p>Try a published game, add it to My Space, or show its creator some love.</p>
      </div>

      {status === "loading" ? <p className="library-state">Loading published games…</p> : null}
      {status === "error" ? (
        <div className="library-state" role="alert">
          <p>The public library is unavailable right now.</p>
          <button className="button button-ghost" type="button" onClick={() => void refresh()}>
            Try again
          </button>
        </div>
      ) : null}
      {status === "ready" && games.length === 0 ? (
        <p className="library-state">No games have been published yet. Yours could be first.</p>
      ) : null}
      {message ? (
        <p className="library-message" role="status">
          {message}
        </p>
      ) : null}
      {games.length ? (
        <div className="community-game-grid">
          {games.map((game) => (
            <article className="community-game-card" key={game.id}>
              <p className="eyebrow">{game.world}</p>
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              <div className="community-game-meta">
                <span>{game.record.blueprint.durationSeconds}s round</span>
                <span>{game.record.blueprint.gestures.length} moves</span>
              </div>
              <div className="community-game-actions">
                <button
                  className="button button-primary"
                  type="button"
                  disabled={busyId === game.id}
                  onClick={() => void addToSpace(game)}
                >
                  {busyId === game.id ? "Adding…" : "Add to My Space"}
                </button>
                <button
                  className={`like-button ${game.likedByMe ? "liked" : ""}`}
                  type="button"
                  aria-pressed={game.likedByMe}
                  aria-label={`${game.likedByMe ? "Unlike" : "Like"} ${game.title}, ${game.likes_count} likes`}
                  onClick={() => void toggleLike(game)}
                >
                  <span aria-hidden="true">♥</span> {game.likes_count}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
