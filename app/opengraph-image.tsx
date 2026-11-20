import { ImageResponse } from "next/og";

export const alt = "Move Canvas — a private motion game and bounded 2D practice experience";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#171524",
          color: "#f5f0e7",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: 30,
            fontWeight: 800,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "#c8ff54",
              color: "#171524",
            }}
          >
            M
          </div>
          Move Canvas
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
          <div
            style={{
              maxWidth: 1000,
              fontSize: 82,
              lineHeight: 0.98,
              fontWeight: 800,
              letterSpacing: "-4px",
            }}
          >
            Make a game. Compare a move. Practice in private.
          </div>
          <div style={{ fontSize: 28, color: "#d8d2e4" }}>
            Phone-camera motion experiences with raw media kept on the device where it originates.
          </div>
        </div>
        <div style={{ display: "flex", gap: "14px" }}>
          {[
            ["Motion Game", "#c8ff54"],
            ["Dance Coach", "#ff9dcc"],
            ["Tennis Coach", "#8a70ff"],
          ].map(([label, color]) => (
            <div
              key={label}
              style={{
                padding: "13px 20px",
                border: `2px solid ${color}`,
                borderRadius: 999,
                fontSize: 22,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
