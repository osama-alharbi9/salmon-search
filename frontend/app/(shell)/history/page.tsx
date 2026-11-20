import type { Metadata } from "next";
import { HistoryView } from "./HistoryView";

export const metadata: Metadata = { title: "History" };

/** /history (DESIGN.md 9.6). */
export default function HistoryPage() {
  return <HistoryView />;
}
