"use client";
import { useCallback, useEffect, useState } from "react";
import { api, isAbortError, type WorkDetail } from "@/app/lib/api";
import { appHref, cleanTitle, countLabel, mediaLabel } from "@/app/lib/query";
import {
  Banner,
  Button,
  Card,
  CC_BY_NC_SA_URL,
  EmptyState,
  ExternalLink,
  SaveWorkButton,
} from "@/app/ui";
import { BackButton } from "./BackButton";
import { TropeList } from "./TropeList";
import { WorkSkeleton } from "./WorkSkeleton";

type Load =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; work: WorkDetail };

/** "NopeDoesNotExist" -> "Nope Does Not Exist", for "Search for it". */
function slugWords(id: string): string {
  const slug = id.split("/").pop() ?? id;
  return slug
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

export function WorkView({ id, initial }: { id: string; initial: WorkDetail | null }) {
  const [load, setLoad] = useState<Load>(initial ? { kind: "ready", work: initial } : { kind: "loading" });
  const [attempt, setAttempt] = useState(initial ? 0 : 1);

  // Fetch in the browser when the server could not (attempt > 0), and on Try again.
  useEffect(() => {
    if (attempt === 0) return;
    const c = new AbortController();
    api.workById(id, c.signal).then(
      (work) => setLoad({ kind: "ready", work }),
      (e) => {
        if (!isAbortError(e)) setLoad({ kind: "error" });
      },
    );
    return () => c.abort();
  }, [id, attempt]);

  const retry = useCallback(() => {
    setLoad({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  // The server sets the title; this covers a page loaded in the browser.
  const work = load.kind === "ready" ? load.work : null;
  useEffect(() => {
    if (!work || initial) return;
    document.title = work.found && work.title ? `${cleanTitle(work.title, work.namespace)} · salmon` : "Work not found · salmon";
  }, [work, initial]);

  if (load.kind === "loading") return <WorkSkeleton />;

  if (load.kind === "error") {
    return (
      <div className="pt-2">
        <BackButton />
        <h1 className="visually-hidden">Work</h1>
        <Banner
          className="mt-8"
          variant="error"
          title="This work didn't load. Try again in a moment."
          action={
            <Button variant="secondary" size="s" onClick={retry}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  const w = load.work;
  if (!w.found || !w.title) {
    return (
      <EmptyState
        className="mt-6"
        icon="search"
        titleAs="h1"
        title="We couldn't find that work"
        action={
          <>
            <Button href={appHref([`like ${slugWords(id)}`])} size="m">
              Search for it
            </Button>
            <Button href="/app" variant="tertiary" size="m">
              Back to search
            </Button>
          </>
        }
      >
        There&apos;s no work at {id} in this dataset. Check the link, or search for it by title.
      </EmptyState>
    );
  }

  const ns = w.namespace ?? null;
  const title = cleanTitle(w.title, ns);
  const tropes = w.tropes ?? [];
  const nTropes = w.n_tropes ?? tropes.length;

  return (
    <article className="pt-2">
      <BackButton />

      <header className="mt-8">
        <p className="label muted">{mediaLabel(ns)}</p>
        <h1 className="display-m mt-2 [overflow-wrap:anywhere]">{title}</h1>
        <p className="body muted num mt-3">{countLabel(nTropes, "trope")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={appHref([`like ${w.title}`])} size="m">
            Find works like this
          </Button>
          <SaveWorkButton look="button" work={{ id: w.id ?? id, title: w.title, namespace: ns }} />
          {w.url && (
            <Button href={w.url} external variant="tertiary" size="m">
              Open on TVTropes
            </Button>
          )}
        </div>
      </header>

      <Card as="section" variant="medium" className="mt-10 md:p-8" aria-labelledby="about-heading">
        <h2 id="about-heading" className="h3">
          About
        </h2>
        {w.intro ? (
          <p className="measure mt-3 whitespace-pre-line [overflow-wrap:anywhere]">{w.intro}</p>
        ) : (
          <p className="muted mt-3">No description in this dataset.</p>
        )}
      </Card>

      <section className="mt-12" aria-labelledby="tropes-heading">
        <h2 id="tropes-heading" className="h2 num">
          {countLabel(nTropes, "trope")}
        </h2>
        <TropeList tropes={tropes} />
      </section>

      <p className="body-s muted mt-12">
        Trope list and description from TVTropes, under{" "}
        <ExternalLink href={CC_BY_NC_SA_URL}>CC BY-NC-SA</ExternalLink>.{" "}
        {w.url && <ExternalLink href={w.url}>{title} on TVTropes</ExternalLink>}
      </p>
    </article>
  );
}
