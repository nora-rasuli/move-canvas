"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import type { GameBlueprint, Gesture } from "@/lib/blueprint";
import { connectSession, createRoomCode, type SessionConnection } from "@/lib/channel";

export function PairingRoom() {
  const code = useSyncExternalStore(subscribeToBrowserValue, readRoomCode, () => "");
  const origin = useSyncExternalStore(subscribeToOrigin, readOrigin, () => "");
  const gameJson = useSyncExternalStore(subscribeToBrowserValue, readGame, () => null);
  const game = useMemo(() => gameJson ? (JSON.parse(gameJson) as GameBlueprint) : null, [gameJson]);
  const [connected, setConnected] = useState(false);
  const [transportReady, setTransportReady] = useState(false);
  const [mode, setMode] = useState<"supabase" | "same-device">("same-device");
  const connectionRef = useRef<SessionConnection | null>(null);

  useEffect(() => {
    if (!code) return;
    let active = true;
    void connectSession(
      code,
      (message) => {
        if (message.type === "display-ready") {
          setConnected(true);
          if (game) void connectionRef.current?.send({ type: "blueprint", payload: game });
        }
      },
      setTransportReady,
    ).then((connection) => {
      if (!active) return void connection.close();
      connectionRef.current = connection;
      setMode(connection.mode);
      void connection.send({ type: "controller-ready" });
    });
    return () => {
      active = false;
      void connectionRef.current?.close();
    };
  }, [code, game]);

  const displayUrl = origin ? `${origin}/display/${code}` : "";
  const sendGesture = (gesture: Gesture) => {
    void sendGestureMessage(connectionRef.current, gesture);
  };

  if (!game) return <main className="setup-empty"><h1>Create and calibrate a game first.</h1><Link className="button button-primary" href="/#create">Create a game</Link></main>;

  return (
    <main className="pair-page" id="main">
      <header className="setup-header"><span className="brand"><span aria-hidden="true">M</span>Move Canvas</span><p>Set up · 2 of 2</p></header>
      <section className="pair-layout">
        <div className="pair-copy">
          <p className="eyebrow">PUT {game.title.toUpperCase()} ON THE BIG SCREEN</p>
          <h1>Pair your display.</h1>
          <p>Open this link on the TV browser. Keep this phone as the controller.</p>
          <div className="room-code"><span>Room code</span><strong>{code}</strong></div>
          {displayUrl ? <a className="button button-primary" href={displayUrl} target="_blank" rel="noreferrer">Open display on this device ↗</a> : null}
          <p className="transport-note">{mode === "supabase" ? "Cross-device relay ready" : "Local verification mode · cross-device relay needs the production connection"}</p>
        </div>
        <div className="qr-card">
          {displayUrl ? <QRCodeSVG value={displayUrl} size={220} bgColor="#f5f0e7" fgColor="#171524" level="M" /> : null}
          <p>{connected ? "Display connected" : transportReady ? "Waiting for the display…" : "Opening the room…"}</p>
          <span className={connected ? "connection-light connected" : "connection-light"} aria-hidden="true" />
        </div>
      </section>
      {connected ? (
        <section className="controller-pad" aria-labelledby="controller-title">
          <div><p className="eyebrow">CONNECTION PROOF</p><h2 id="controller-title">Send a move.</h2><p>The display receives semantic controls only—never video.</p></div>
          <div className="gesture-grid">
            {game.gestures.map((gesture) => <button type="button" key={gesture} onClick={() => sendGesture(gesture)}>{formatGesture(gesture)}</button>)}
          </div>
        </section>
      ) : null}
    </main>
  );
}

const formatGesture = (gesture: string) => gesture.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

const subscribeToBrowserValue = () => () => undefined;
const subscribeToOrigin = subscribeToBrowserValue;
const readOrigin = () => window.location.origin;
const readGame = () => localStorage.getItem("move-canvas:active-blueprint");
const readRoomCode = () => {
  const existing = sessionStorage.getItem("move-canvas:room-code");
  if (existing) return existing;
  const code = createRoomCode();
  sessionStorage.setItem("move-canvas:room-code", code);
  return code;
};
const sendGestureMessage = async (connection: SessionConnection | null, gesture: Gesture) => {
  await connection?.send({ type: "gesture", gesture, sentAt: performance.now() });
};
