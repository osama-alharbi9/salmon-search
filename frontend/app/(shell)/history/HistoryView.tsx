"use client";
// /history (DESIGN.md 9.6): searches grouped by local day, Run again, repeats
// collapsed into one row, Clear history behind a confirm.
import { useEffect, useRef, useState } from "react";
import { api, ApiError, errorMessage, type HistoryEntry } from "../../lib/api";
import { appHref, countLabel } from "../../lib/query";
import { useSession } from "../../lib/session";
import { Banner } from "../../ui/Banner";
import { Button } from "../../ui/Button";
import { EmptyState } from "../../ui/EmptyState";
import { List, ListRow } from "../../ui/ListRow";
import { ConfirmModal } from "../../ui/Modal";
import { Delayed, ListRowSkeleton } from "../../ui/Skeleton";
import { useToast } from "../../ui/Toast";
import { SignedOutState } from "../saved/SignedOutState";
import { dayKey, dayLabel, parseServerDate, timeLabel } from "./dates";

type HistoryState = {
  uid: number | null;
  status: "loading" | "ready" | "error";
  list: HistoryEntry[];
  error: ApiError | null;
};

type HistoryRow = { key: number; items: string[]; at: Date | null; times: number };
type HistoryGroup = { key: string; label: string; rows: HistoryRow[] };

const asApiError = (e: unknown) =>
  e instanceof ApiError ? e : new ApiError(0, "salmon couldn't load your history.");

const sameSearch = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x, i) => x.trim().toLowerCase() === b[i].trim().toLowerCase());

/**
 * Newest first, grouped by local day. Back-to-back runs of the same search
 * inside a day become one row that counts them ("2 times").
 */
function groupHistory(list: HistoryEntry[]): HistoryGroup[] {
  const groups: HistoryGroup[] = [];
  for (const h of list) {
    const at = parseServerDate(h.created_at);
    const key = at ? dayKey(at) : "unknown";
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, label: at ? dayLabel(at) : "Earlier", rows: [] };
      groups.push(group);
    }
    const last = group.rows[group.rows.length - 1];
    if (last && sameSearch(last.items, h.items)) last.times += 1;
    else group.rows.push({ key: h.id, items: h.items, at, times: 1 });
  }
  return groups;
}

export function HistoryView() {
  const { user, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const uid = user?.id ?? null;
  const uidRef = useRef(uid);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [state, setState] = useState<HistoryState>({ uid: null, status: "loading", list: [], error: null });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const mine = uid !== null && state.uid === uid;
  const status = mine ? state.status : "loading";
  const list = mine ? state.list : [];

  useEffect(() => {
    uidRef.current = uid;
    if (uid === null) return;
    let alive = true;
    api.history().then(
      (r) => alive && setState({ uid, status: "ready", list: r.history, error: null }),
      (e) => alive && setState({ uid, status: "error", list: [], error: asApiError(e) }),
    );
    return () => {
      alive = false;
    };
  }, [uid]);

  const reload = () => {
    const forUid = uidRef.current;
    if (forUid === null) return;
    setState({ uid: forUid, status: "loading", list: [], error: null });
    api.history().then(
      (r) => uidRef.current === forUid && setState({ uid: forUid, status: "ready", list: r.history, error: null }),
      (e) => uidRef.current === forUid && setState({ uid: forUid, status: "error", list: [], error: asApiError(e) }),
    );
  };

  const clearAll = async () => {
    try {
      await api.clearHistory();
      setState((s) => (s.uid === uidRef.current ? { ...s, list: [] } : s));
      setConfirmOpen(false);
      toast("History cleared.");
      // the Clear history button is gone; put focus on the page heading
      requestAnimationFrame(() => headingRef.current?.focus());
    } catch (e) {
      setConfirmOpen(false);
      toast(errorMessage(e, "History wasn't cleared. Try again."));
    }
  };

  const hasRows = !sessionLoading && !!user && status === "ready" && list.length > 0;

  let body;
  if (sessionLoading || (user && status === "loading")) {
    body = (
      <div className="mt-6" aria-busy="true">
        <Delayed>
          <ul className="list" aria-hidden="true">
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </ul>
        </Delayed>
      </div>
    );
  } else if (!user) {
    body = (
      <div className="mt-6">
        <SignedOutState
          icon="clock"
          title="Log in to keep a history"
          body="History needs an account. Searching doesn't."
        />
      </div>
    );
  } else if (status === "error") {
    body = (
      <Banner
        className="mt-6"
        variant="error"
        title="Your history didn't load"
        action={
          <Button variant="tertiary" size="s" onClick={reload}>
            Try again
          </Button>
        }
      >
        {state.error?.message}
      </Banner>
    );
  } else if (!list.length) {
    body = (
      <div className="mt-6">
        <EmptyState
          icon="clock"
          title="No searches yet"
          action={
            <Button href="/app" variant="secondary" size="m">
              Go to search
            </Button>
          }
        >
          Searches you run while logged in show up here.
        </EmptyState>
      </div>
    );
  } else {
    body = (
      <>
        <p className="body-s mt-2 text-secondary">Your last 100 searches, newest first.</p>
        <div className="mt-8 grid">
          {groupHistory(list).map((g) => (
            <List key={g.key} label={g.label} labelId={`history-${g.key}`}>
              {g.rows.map((r) => {
                const query = r.items.join(" + ");
                const time = r.at ? timeLabel(r.at) : null;
                const secondary = [time, r.times > 1 ? countLabel(r.times, "time") : null]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <ListRow
                    key={r.key}
                    disc="clock"
                    title={query}
                    secondary={secondary || undefined}
                    actions={
                      <Button href={appHref(r.items)} variant="secondary" size="s" aria-label={`Run again: ${query}`}>
                        Run again
                      </Button>
                    }
                  />
                );
              })}
            </List>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-2">
        <h1 className="h1 focus:outline-none" ref={headingRef} tabIndex={-1}>
          History
        </h1>
        {hasRows && (
          <Button variant="destructive" size="m" onClick={() => setConfirmOpen(true)}>
            Clear history
          </Button>
        )}
      </div>
      {body}
      <ConfirmModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={clearAll}
        title="Clear all history?"
        confirmLabel="Clear history"
        confirmLoadingLabel="Clearing"
      >
        This removes every search in your history. You can&apos;t undo it.
      </ConfirmModal>
    </>
  );
}
