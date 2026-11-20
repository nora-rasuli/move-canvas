import { GameDisplay } from "@/components/game-display";

export default async function DisplayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <GameDisplay code={code} />;
}
