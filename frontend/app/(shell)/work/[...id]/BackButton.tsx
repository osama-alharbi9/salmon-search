"use client";
import type { MouseEvent } from "react";
import { IconButton } from "@/app/ui";
import { openedFromResults } from "../../app/_components/memory";

/**
 * "Back to results" (DESIGN.md 9.3): goes back in history when this work was
 * opened from the result list, so the search comes back as it was; otherwise
 * it is a plain link to /app.
 */
export function BackButton() {
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (openedFromResults(window.location.pathname) && window.history.length > 1) {
      e.preventDefault();
      window.history.back();
    }
  };
  return <IconButton href="/app" icon="back" size="l" label="Back to results" onClick={click} />;
}
