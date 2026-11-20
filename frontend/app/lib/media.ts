"use client";
import { useEffect, useMemo, useState } from "react";
import { api, isAbortError, type WorkMedia } from "./api";
import { useSession } from "./session";

// TMDB posters for work ids, fetched once per id per tab. Nothing is fetched
// when the server has no TMDB key; the UI then shows no posters at all.

const known = new Map<string, WorkMedia | null>();

/** Posters for `ids`, filled in as they arrive. Missing keys mean "not known yet". */
export function useMedia(
  ids: readonly string[],
): Record<string, WorkMedia | null> {
  const { config } = useSession();
  const key = ids.join("\n");
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!config.tmdb) return;
    const todo = key ? key.split("\n").filter((id) => !known.has(id)) : [];
    if (!todo.length) return;
    const c = new AbortController();
    api
      .media(todo.slice(0, 50), c.signal)
      .then((r) => {
        for (const id of todo) known.set(id, r.media[id] ?? null);
        setTick((t) => t + 1);
      })
      .catch((e) => {
        if (!isAbortError(e)) for (const id of todo) known.set(id, null);
      });
    return () => c.abort();
  }, [key, config.tmdb]);

  return useMemo(() => {
    const out: Record<string, WorkMedia | null> = {};
    for (const id of key ? key.split("\n") : [])
      if (known.has(id)) out[id] = known.get(id) ?? null;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, known.size]);
}
