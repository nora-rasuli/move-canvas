import { CoachDisplay } from "@/components/coach-display";
import { coachTestHarnessEnabled } from "@/lib/test-harness";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tennis Coach",
  description:
    "Choose forehand, backhand, serve, or volley shadow practice with deterministic 2D pose cues and no ball or racket analysis.",
};

export default function TennisCoachPage() {
  return <CoachDisplay mode="tennis-coach" testHarness={coachTestHarnessEnabled()} />;
}
