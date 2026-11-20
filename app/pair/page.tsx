import { PairingRoom } from "@/components/pairing-room";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pair a display",
  robots: { index: false, follow: false },
};

export default function PairPage() {
  return <PairingRoom />;
}
