import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Move Canvas — Create a game. Move to play.",
  description:
    "Turn an idea into a personal motion game and use your phone as the camera controller.",
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
