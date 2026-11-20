import { CoachDisplay } from "@/components/coach-display";
import { coachTestHarnessEnabled } from "@/lib/test-harness";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dance & Movement Coach",
  description:
    "Choose salsa, hip-hop, contemporary, or yoga and mobility practice against a local reference clip.",
};

export default function DanceCoachPage() {
  return <CoachDisplay mode="dance-coach" testHarness={coachTestHarnessEnabled()} />;
}
