"use client";

import { useEffect, useRef, useState } from "react";
import type { GameBlueprint, Gesture } from "@/lib/blueprint";
import { connectSession, type SessionConnection } from "@/lib/channel";

export function GameDisplay({ code }: { code: string }) {
  const connectionRef = useRef<SessionConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const [game, setGame] = useState<GameBlueprint | null>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    let active = true;
    void connectSession(
      code,
      (message) => {
        if (message.type === "controller-ready") {
          setConnected(true);
          void connectionRef.current?.send({ type: "display-ready" });
        }
        if (message.type === "blueprint") {
          setConnected(true);
          setGame(message.payload as GameBlueprint);
        }
        if (message.type === "gesture") {
          setConnected(true);
          setGesture(message.gesture);
          setEventCount((count) => count + 1);
        }
      },
      (ready) => {
        if (ready) void connectionRef.current?.send({ type: "display-ready" });
      },
    ).then((connection) => {
      if (!active) return void connection.close();
      connectionRef.current = connection;
      void connection.send({ type: "display-ready" });
    });
    return () => {
      active = false;
      void connectionRef.current?.close();
    };
  }, [code]);

  return (
    <main className="display-page" style={game ? { "--display-accent": game.theme.palette[1], "--display-bg": game.theme.palette[0] } as React.CSSProperties : undefined}>
      <div className="display-status"><span className={connected ? "connection-light connected" : "connection-light"} />{connected ? "Controller connected" : "Waiting for controller"}<small>{code}</small></div>
      <section>
        <p className="eyebrow">{game?.theme.world.toUpperCase() ?? "MOVE CANVAS DISPLAY"}</p>
        <h1>{game?.title ?? "Open the room on your controller."}</h1>
        <div className="gesture-readout" aria-live="polite">
          <span>Last move</span>
          <strong>{gesture ? gesture.replace("_", " ") : "—"}</strong>
          <small>{eventCount} semantic events received</small>
        </div>
      </section>
    </main>
  );
}
