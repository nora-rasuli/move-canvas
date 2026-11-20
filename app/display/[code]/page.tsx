import { GameDisplay } from "@/components/game-display";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game display",
  robots: { index: false, follow: false },
};

export default async function DisplayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <GameDisplay code={code} />;
}
