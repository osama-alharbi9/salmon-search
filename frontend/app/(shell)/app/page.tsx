import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPage } from "./_components/SearchPage";

export const metadata: Metadata = { title: "Search" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function filled(v: string | string[] | undefined): boolean {
  return Array.isArray(v) ? v.some((x) => x.trim() !== "") : !!v && v.trim() !== "";
}

/**
 * /app search (DESIGN.md 9.2). The client page reads the raw ?q= itself (a
 * literal + must split, which the parsed searchParams can't tell apart from a
 * space). The server only says whether a search is coming, so the first paint
 * shows the searching state instead of the examples. Reading searchParams also
 * keeps the route dynamic, so the page's useSearchParams never suspends; the
 * boundary is there for safety.
 */
export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const seeded = filled(sp.q) || filled(sp.trope);
  return (
    <Suspense fallback={<h1 className="visually-hidden">Search</h1>}>
      <SearchPage seeded={seeded} />
    </Suspense>
  );
}
