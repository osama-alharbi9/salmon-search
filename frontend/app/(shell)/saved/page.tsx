import type { Metadata } from "next";
import { SavedView, type SavedTab } from "./SavedView";

export const metadata: Metadata = { title: "Saved" };

/** /saved (DESIGN.md 9.5). ?tab=works opens the Works tab. */
export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tab } = await searchParams;
  const initialTab: SavedTab = tab === "works" ? "works" : "searches";
  return <SavedView initialTab={initialTab} />;
}
