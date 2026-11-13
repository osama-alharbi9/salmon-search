"use client";
// /saved (DESIGN.md 9.5): Searches | Works, rows with Run and an overflow menu,
// rename modal, delete and remove with Undo toasts.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, ApiError, errorMessage, isApiError, type SavedSearch, type SavedWork } from "../../lib/api";
import { appHref, cleanTitle, mediaIcon, mediaLabel, SEARCH_NAME_MAX, workHref } from "../../lib/query";
import { useSavedWorks, useSession, type WorkRef } from "../../lib/session";
import { Banner } from "../../ui/Banner";
import { Button } from "../../ui/Button";
import { cx } from "../../ui/cx";
import { EmptyState } from "../../ui/EmptyState";
import { IconButton } from "../../ui/IconButton";
import { List, ListRow } from "../../ui/ListRow";
import { Modal } from "../../ui/Modal";
import { SegmentedControl, segmentPanelProps } from "../../ui/SegmentedControl";
import { Delayed, ListRowSkeleton } from "../../ui/Skeleton";
import { TextField } from "../../ui/TextField";
import { useToast } from "../../ui/Toast";
import { parseServerDate, shortDate } from "../history/dates";
import { RowMenu } from "./RowMenu";
import { SignedOutState } from "./SignedOutState";

export type SavedTab = "searches" | "works";


type SearchesState = {
  /** The user the list belongs to; another id means "not loaded yet". */
  uid: number | null;
  status: "loading" | "ready" | "error";
  list: SavedSearch[];
  error: ApiError | null;
};

const asApiError = (e: unknown) =>
  e instanceof ApiError ? e : new ApiError(0, "salmon couldn't load your saved searches.");

function insertAt<T>(list: T[], index: number, item: T): T[] {
  const i = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, i), item, ...list.slice(i)];
}

/** Three skeleton rows, shown only if loading takes longer than 150 ms. */
function LoadingRows() {
  return (
    <Delayed>
      <ul className="list" aria-hidden="true">
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
      </ul>
    </Delayed>
  );
}

export function SavedView({ initialTab }: { initialTab: SavedTab }) {
  const { user, loading: sessionLoading } = useSession();
  const saved = useSavedWorks();
  const { toast } = useToast();
  const [tab, setTab] = useState<SavedTab>(initialTab);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── saved searches ──
  const uid = user?.id ?? null;
  const uidRef = useRef(uid);
  const [searches, setSearches] = useState<SearchesState>({ uid: null, status: "loading", list: [], error: null });
  const mine = uid !== null && searches.uid === uid;
  const searchStatus = mine ? searches.status : "loading";
  const searchList = mine ? searches.list : [];

  useEffect(() => {
    uidRef.current = uid;
    if (uid === null) return;
    let alive = true;
    api.savedSearches().then(
      (r) => alive && setSearches({ uid, status: "ready", list: r.saved, error: null }),
      (e) => alive && setSearches({ uid, status: "error", list: [], error: asApiError(e) }),
    );
    return () => {
      alive = false;
    };
  }, [uid]);

  const reloadSearches = () => {
    const forUid = uidRef.current;
    if (forUid === null) return;
    setSearches({ uid: forUid, status: "loading", list: [], error: null });
    api.savedSearches().then(
      (r) => uidRef.current === forUid && setSearches({ uid: forUid, status: "ready", list: r.saved, error: null }),
      (e) => uidRef.current === forUid && setSearches({ uid: forUid, status: "error", list: [], error: asApiError(e) }),
    );
  };

  /** Change the current user's list (ignored if the user changed meanwhile). */
  const editSearches = (f: (list: SavedSearch[]) => SavedSearch[]) =>
    setSearches((s) => (s.uid === uidRef.current ? { ...s, list: f(s.list) } : s));

  /**
   * After a row disappears, move focus to the same control on the row that took
   * its place; when the list is now empty, to the empty state's action.
   */
  const refocus = (index: number, selector: string) => {
    requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const rows = panel.querySelectorAll<HTMLElement>("li.row");
      const row = rows[Math.min(index, rows.length - 1)];
      const target = row
        ? row.querySelector<HTMLElement>(selector)
        : panel.querySelector<HTMLElement>("a[href], button:not([disabled])");
      (target ?? panel).focus();
    });
  };

  /** After Undo brings a work back, focus its row's save toggle. */
  const refocusWork = (workId: string) => {
    requestAnimationFrame(() => {
      const panel = panelRef.current;
      const link = panel?.querySelector<HTMLElement>(`a.row-link[href="${CSS.escape(workHref(workId))}"]`);
      link?.closest("li.row")?.querySelector<HTMLElement>("button[aria-pressed]")?.focus();
    });
  };

  const changeTab = (value: SavedTab) => {
    setTab(value);
    setMenuFor(null);
    window.history.replaceState(null, "", value === "works" ? "/saved?tab=works" : "/saved");
  };

  // ── delete with Undo ──
  const undoDelete = async (s: SavedSearch, index: number) => {
    try {
      const row = await api.saveSearch(s.name, s.items);
      editSearches((list) => insertAt(list, index, row));
      // focus the row that came back, not <body> (the toast and its button are gone)
      refocus(index, '[aria-haspopup="menu"]');
    } catch (e) {
      toast(errorMessage(e, "That search didn't come back. Try again."));
    }
  };

  const deleteSearch = async (s: SavedSearch) => {
    const index = searchList.findIndex((x) => x.id === s.id);
    editSearches((list) => list.filter((x) => x.id !== s.id));
    refocus(index, '[aria-haspopup="menu"]');
    try {
      await api.deleteSearch(s.id);
    } catch (e) {
      // already gone on the server: nothing to put back
      if (!(isApiError(e) && e.status === 404)) {
        editSearches((list) => insertAt(list, index, s));
        toast(errorMessage(e, "That search wasn't deleted. Try again."));
        return;
      }
    }
    toast("Search deleted.", { action: { label: "Undo", onClick: () => void undoDelete(s, index) } });
  };

  // ── rename ──
  const [renaming, setRenaming] = useState<SavedSearch | null>(null);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [renameBusy, setRenameBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const openRename = (s: SavedSearch) => {
    setRenaming(s);
    setNewName(s.name);
    setNameError(undefined);
  };

  const fail = (message: string) => {
    setNameError(message);
    nameRef.current?.focus();
  };

  const submitRename = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!renaming || renameBusy) return;
    const name = newName.trim();
    if (!name) return fail("Enter a name.");
    if (name.length > SEARCH_NAME_MAX) return fail(`Use ${SEARCH_NAME_MAX} characters or fewer.`);
    if (name === renaming.name) {
      setRenaming(null);
      return;
    }
    setRenameBusy(true);
    try {
      const row = await api.renameSearch(renaming.id, name);
      editSearches((list) => list.map((x) => (x.id === row.id ? row : x)));
      setRenaming(null);
      toast("Search renamed.");
    } catch (err) {
      if (isApiError(err) && err.status === 404) {
        editSearches((list) => list.filter((x) => x.id !== renaming.id));
        setRenaming(null);
        toast(err.message);
      } else {
        fail(errorMessage(err, "That name didn't save. Try again."));
      }
    } finally {
      setRenameBusy(false);
    }
  };

  // ── saved works ──
  const removeWork = (w: SavedWork, index: number) => {
    const work: WorkRef = { id: w.work_id, title: w.title, namespace: w.namespace };
    saved.remove(work).then(
      () =>
        toast("Removed from saved.", {
          action: {
            label: "Undo",
            onClick: () => {
              refocusWork(work.id);
              saved.save(work).catch((e) => toast(errorMessage(e, "That work wasn't saved again. Try again.")));
            },
          },
        }),
      (e) => toast(errorMessage(e, "That work is still saved. Try again.")),
    );
    refocus(index, "button[aria-pressed]");
  };

  // ── render ──
  let body;
  if (sessionLoading) {
    body = (
      <div className="mt-6" aria-busy="true">
        <LoadingRows />
      </div>
    );
  } else if (!user) {
    body = (
      <div className="mt-6">
        <SignedOutState
          icon="bookmark"
          title="Log in to see what you saved"
          body="Saving needs an account. Searching doesn't."
        />
      </div>
    );
  } else {
    let panel;
    let busy = false;
    if (tab === "searches") {
      if (searchStatus === "loading") {
        busy = true;
        panel = <LoadingRows />;
      } else if (searchStatus === "error") {
        panel = (
          <Banner
            variant="error"
            title="Your saved searches didn't load"
            action={
              <Button variant="tertiary" size="s" onClick={reloadSearches}>
                Try again
              </Button>
            }
          >
            {searches.error?.message}
          </Banner>
        );
      } else if (!searchList.length) {
        panel = (
          <EmptyState
            icon="search"
            title="No saved searches yet"
            action={
              <Button href="/app" variant="secondary" size="m">
                Go to search
              </Button>
            }
          >
            Run a search, then choose Save search to keep it here.
          </EmptyState>
        );
      } else {
        panel = (
          <List>
            {searchList.map((s) => (
              <ListRow
                key={s.id}
                // lift the open row's menu above the rows after it
                className={cx(menuFor === s.id && "[&_.row-actions]:z-30")}
                disc="bookmark"
                title={s.name}
                secondary={s.items.join(" + ")}
                actions={
                  <>
                    <Button href={appHref(s.items)} variant="secondary" size="s" aria-label={`Run ${s.name}`}>
                      Run
                    </Button>
                    <RowMenu
                      name={s.name}
                      open={menuFor === s.id}
                      onOpenChange={(o) => setMenuFor(o ? s.id : null)}
                      actions={[
                        { label: "Rename", icon: "edit", onSelect: () => openRename(s) },
                        { label: "Delete", icon: "trash", danger: true, onSelect: () => void deleteSearch(s) },
                      ]}
                    />
                  </>
                }
              />
            ))}
          </List>
        );
      }
    } else if (saved.error && !saved.loaded) {
      panel = (
        <Banner
          variant="error"
          title="Your saved works didn't load"
          action={
            <Button variant="tertiary" size="s" onClick={() => void saved.reload()}>
              Try again
            </Button>
          }
        >
          {saved.error.message}
        </Banner>
      );
    } else if (!saved.loaded && saved.loading) {
      busy = true;
      panel = <LoadingRows />;
    } else if (!saved.works.length) {
      panel = (
        <EmptyState
          icon="bookmark"
          title="No saved works yet"
          action={
            <Button href="/app" variant="secondary" size="m">
              Go to search
            </Button>
          }
        >
          Save a work from your results or its page and it shows up here.
        </EmptyState>
      );
    } else {
      panel = (
        <List>
          {saved.works.map((w, i) => {
            const ns = w.namespace ?? w.work_id.split("/")[0];
            const title = cleanTitle(w.title, ns);
            const when = parseServerDate(w.created_at);
            return (
              <ListRow
                key={w.work_id}
                disc={mediaIcon(ns)}
                title={title}
                href={workHref(w.work_id)}
                secondary={when ? `${mediaLabel(ns)} · saved ${shortDate(when)}` : mediaLabel(ns)}
                actions={
                  <IconButton
                    icon="bookmark"
                    pressed
                    label={`Remove ${title} from saved`}
                    onClick={() => removeWork(w, i)}
                  />
                }
              />
            );
          })}
        </List>
      );
    }

    body = (
      <>
        <SegmentedControl
          className="mt-6"
          label="Saved items"
          idPrefix="saved"
          value={tab}
          onChange={changeTab}
          options={[
            { value: "searches", label: "Searches", count: searchStatus === "ready" ? searchList.length : undefined },
            { value: "works", label: "Works", count: saved.loaded ? saved.works.length : undefined },
          ]}
        />
        <div
          ref={panelRef}
          {...segmentPanelProps("saved", tab)}
          aria-busy={busy || undefined}
          className="mt-6 rounded-m"
        >
          {panel}
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="h1 pt-2">Saved</h1>
      {body}
      <Modal
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        variant="form"
        title="Rename search"
        description={renaming ? renaming.items.join(" + ") : undefined}
        busy={renameBusy}
        onSubmit={submitRename}
        actions={
          <Button type="submit" size="l" block loading={renameBusy} loadingLabel="Saving">
            Save
          </Button>
        }
      >
        <TextField
          ref={nameRef}
          label="Name"
          name="name"
          autoComplete="off"
          maxLength={SEARCH_NAME_MAX}
          counter
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            if (nameError) setNameError(undefined);
          }}
          error={nameError}
        />
      </Modal>
    </>
  );
}
