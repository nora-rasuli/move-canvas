export default function Loading() {
  return (
    <main className="setup-empty" id="main" aria-busy="true">
      <p className="eyebrow">MOVE CANVAS</p>
      <h1>Opening the room…</h1>
      <p role="status">Loading the local setup and private connection.</p>
    </main>
  );
}
