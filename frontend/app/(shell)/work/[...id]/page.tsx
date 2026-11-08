import type { Metadata } from "next";
import { cache } from "react";
import { api, type WorkDetail } from "@/app/lib/api";
import { cleanTitle } from "@/app/lib/query";
import { WorkView } from "./WorkView";

type Params = Promise<{ id: string[] }>;

/** decodeURIComponent that leaves a malformed segment as written. */
function decodeSegment(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** "Namespace/Slug" from the catch-all segments. */
async function workId(params: Params): Promise<string> {
  const { id } = await params;
  return id.map(decodeSegment).join("/");
}

/**
 * The work, fetched once per request for both the title and the page. Null
 * when the API could not be reached from the server; the page then loads it
 * in the browser instead.
 */
const loadWork = cache(async (id: string): Promise<WorkDetail | null> => {
  try {
    return await api.workById(id, AbortSignal.timeout(5000));
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = await workId(params);
  const w = await loadWork(id);
  if (!w) return { title: "Work" };
  if (!w.found || !w.title) return { title: "Work not found" };
  return { title: cleanTitle(w.title, w.namespace) };
}

/** /work/{Namespace}/{Slug} (DESIGN.md 9.3). */
export default async function WorkPage({ params }: { params: Params }) {
  const id = await workId(params);
  const w = await loadWork(id);
  return <WorkView key={id} id={id} initial={w} />;
}
