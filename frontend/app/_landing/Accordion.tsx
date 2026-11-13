"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "../ui";

// FAQ accordion (DESIGN.md 5.16): each question is a <button aria-expanded>
// inside a heading, controlling a labelled region. First item open. Several
// can be open at once. A link to #<item id> opens that item.

export type AccordionItem = {
  id: string;
  question: string;
  answer: ReactNode;
};

export function Accordion({ items, headingLevel = 3 }: { items: AccordionItem[]; headingLevel?: 2 | 3 | 4 }) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(items.slice(0, 1).map((i) => i.id)));
  const H = `h${headingLevel}` as "h2" | "h3" | "h4";

  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id || !items.some((i) => i.id === id)) return;
      setOpen((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [items]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="lp-acc">
      {items.map((item) => {
        const isOpen = open.has(item.id);
        const btnId = `${item.id}-q`;
        const panelId = `${item.id}-a`;
        return (
          <div className="lp-acc-item" id={item.id} key={item.id}>
            <H className="lp-acc-h">
              <button
                type="button"
                id={btnId}
                className="lp-acc-btn"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                <span>{item.question}</span>
                <Icon name="chevron-down" size={24} className="lp-acc-chev" />
              </button>
            </H>
            <div id={panelId} role="region" aria-labelledby={btnId} className="lp-acc-panel" hidden={!isOpen}>
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
