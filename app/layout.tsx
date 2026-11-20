import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Move Canvas — Play, dance, and practice in motion.",
  description:
    "Create a motion game or use private, deterministic 2D pose cues for dance-reference and shadow-tennis practice.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
