import { CalibrationStudio } from "@/components/calibration-studio";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Calibrate", robots: { index: false, follow: false } };

export default function CalibratePage() {
  return <CalibrationStudio />;
}
