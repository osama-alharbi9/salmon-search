"use client";
import { useState } from "react";
import { errorMessage } from "../lib/api";
import { cleanTitle } from "../lib/query";
import { useAuthHref, useSavedWorks, useSession, type WorkRef } from "../lib/session";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { useToast } from "./Toast";

export type SaveWorkButtonProps = {
  work: WorkRef;
  /**
   * icon: 40 px round toggle (result cards, /saved rows).
   * button: secondary M "Save" / "Saved" with a bookmark (work page).
   */
  look?: "icon" | "button";
  /** Where log in returns to when signed out (path and query). Defaults to this page's path. */
  next?: string;
  /** Called after the server confirms, with the new state. Use it for an Undo toast. */
  onChange?: (saved: boolean, work: WorkRef) => void;
  className?: string;
};

/**
 * Save toggle for a work, in sync everywhere through useSavedWorks().
 * Signed out it is a link to /login?next=<this page>. A failed save rolls back
 * and shows a toast.
 */
export function SaveWorkButton({ work, look = "icon", next, onChange, className }: SaveWorkButtonProps) {
  const { user } = useSession();
  const saved = useSavedWorks();
  const { toast } = useToast();
  const login = useAuthHref("login", next);
  const [busy, setBusy] = useState(false);
  const title = cleanTitle(work.title, work.namespace);
  const isSaved = saved.isSaved(work.id);

  if (!user) {
    if (look === "button") {
      return (
        <Button
          href={login.href}
          onClick={login.onClick}
          variant="secondary"
          size="m"
          icon="bookmark"
          className={className}
        >
          Save
        </Button>
      );
    }
    return (
      <IconButton
        href={login.href}
        onClick={login.onClick}
        icon="bookmark"
        label={`Log in to save ${title}`}
        className={className}
      />
    );
  }

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const now = await saved.toggle(work);
      onChange?.(now, work);
    } catch (e) {
      toast(errorMessage(e, "That didn't save. Try again."));
    } finally {
      setBusy(false);
    }
  };

  if (look === "button") {
    return (
      <Button
        variant="secondary"
        size="m"
        icon={isSaved ? "bookmark-filled" : "bookmark"}
        aria-pressed={isSaved}
        onClick={run}
        className={className}
      >
        {isSaved ? "Saved" : "Save"}
      </Button>
    );
  }
  return (
    <IconButton
      icon="bookmark"
      pressed={isSaved}
      label={isSaved ? `Remove ${title} from saved` : `Save ${title}`}
      onClick={run}
      className={className}
    />
  );
}
