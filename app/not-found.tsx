import Link from "next/link";

export default function NotFound() {
  return (
    <main className="setup-empty" id="main">
      <p className="eyebrow">ROOM NOT FOUND</p>
      <h1>That Move Canvas route is not available.</h1>
      <Link className="button button-primary" href="/coach">
        Choose a mode
      </Link>
    </main>
  );
}
