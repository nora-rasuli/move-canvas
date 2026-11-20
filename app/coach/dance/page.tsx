import { CoachDisplay } from "@/components/coach-display";
import { coachTestHarnessEnabled } from "@/lib/test-harness";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dance Coach",
  description:
    "Compare estimated 2D pose and timing against a local reference clip without uploading the clip or camera frames.",
};

export default function DanceCoachPage() {
  return <CoachDisplay mode="dance-coach" testHarness={coachTestHarnessEnabled()} />;
}
