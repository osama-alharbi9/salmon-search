"use client";
import type { MouseEvent } from "react";
import { List, ListRow } from "@/app/ui";
import { appHref } from "@/app/lib/query";

/** README example queries with the results they really give (checked against the API). */
export const EXAMPLES: { items: string[]; result: string }[] = [
  {
    items: ["true companions", "the caper", "anti-hero"],
    result: "Firefly, Highlander and Quadrilateral Cowboy have all 3. 4,232 works have at least 1.",
  },
  {
    items: ["time travel", "stable time loop", "movies only"],
    result: "Film only. Interstellar and Star Trek: First Contact lead.",
  },
  {
    items: ["like Cowboy Bebop", "anime only"],
    result: "Cowboy Bebop becomes 12 tropes. Ghost in the Shell: Stand Alone Complex leads.",
  },
  {
    items: ["the office"],
    result: "A title of two or more words needs no like. Brooklyn Nine-Nine leads.",
  },
];

/**
 * "Try one of these" (DESIGN.md 9.2): list rows that link to /app?q=… . A
 * plain click runs the search in place; new-tab clicks follow the link.
 */
export function Examples({ onRun }: { onRun: (items: string[]) => void }) {
  const click = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    const ex = a && EXAMPLES.find((x) => appHref(x.items) === a.getAttribute("href"));
    if (!ex) return;
    e.preventDefault();
    onRun(ex.items);
  };

  return (
    // Capture phase, so the plain click never reaches the Next link.
    <div className="mt-12" onClickCapture={click}>
      <List label="Try one of these" labelId="examples-label">
        {EXAMPLES.map((ex) => (
          <ListRow
            key={ex.items.join("+")}
            disc="search"
            title={ex.items.join(" + ")}
            secondary={ex.result}
            href={appHref(ex.items)}
            chevron
          />
        ))}
      </List>
    </div>
  );
}
