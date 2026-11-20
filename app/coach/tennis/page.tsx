import { CoachDisplay } from "@/components/coach-display";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tennis Coach",
  description:
    "Practice coarse shadow-serve and shadow-forehand phases with deterministic 2D pose cues and no ball or racket analysis.",
};

export default function TennisCoachPage() {
  return <CoachDisplay mode="tennis-coach" />;
}
