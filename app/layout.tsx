import type { Metadata } from "next";
import "./styles.css";

const deployedHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const metadataBase = new URL(
  process.env.SITE_URL?.trim() ||
    (deployedHost ? `https://${deployedHost}` : "http://localhost:3000"),
);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Move Canvas — Play, dance, and practice in motion",
    template: "%s · Move Canvas",
  },
  description:
    "Create a motion game or use private, deterministic 2D pose cues for dance-reference and shadow-tennis practice.",
  applicationName: "Move Canvas",
  category: "games",
  keywords: [
    "motion game",
    "dance practice",
    "shadow tennis",
    "on-device pose",
    "private camera controller",
  ],
  openGraph: {
    type: "website",
    siteName: "Move Canvas",
    title: "Move Canvas — Play, dance, and practice in motion",
    description:
      "Create a private phone-camera motion game or use bounded 2D dance and shadow-tennis practice cues.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Move Canvas — Play, dance, and practice in motion",
    description: "Private phone-camera motion games and bounded 2D practice cues.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
