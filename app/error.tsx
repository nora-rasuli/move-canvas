"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Move Canvas route error", error.digest ?? error.name);
  }, [error]);

  return (
    <main className="setup-empty" id="main">
      <p className="eyebrow">RECOVERABLE ERROR</p>
      <h1>This room needs a fresh start.</h1>
      <p>
        No camera or reference media was uploaded. Retry this route, or return home and create a new
        room.
      </p>
      <div className="error-actions">
        <button className="button button-primary" type="button" onClick={reset}>
          Try again
        </button>
        <Link className="button button-ink" href="/">
          Return home
        </Link>
      </div>
    </main>
  );
}
