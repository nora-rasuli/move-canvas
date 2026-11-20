import { CoachController } from "@/components/coach-controller";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Phone controller",
  robots: { index: false, follow: false },
};

export default function CoachControllerPage() {
  return <CoachController />;
}
