"use client";
import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { cx } from "../../ui/cx";
import { Icon, type IconName } from "../../ui/Icon";
import { IconButton } from "../../ui/IconButton";

export type RowMenuAction = {
  label: string;
  icon: IconName;
  danger?: boolean;
  onSelect: () => void;
};

/**
 * Overflow menu for a list row: a 32 px "More actions for {name}" button and a
 * menu under it (DESIGN.md 5.15). Arrow keys, Home and End move; Esc closes and
 * returns focus; Tab and outside clicks close. Choosing an item puts focus back
 * on the button first, so a modal opened from it returns focus there.
 * The parent owns `open` so it can lift the row above its neighbours.
 */
export function RowMenu({
  name,
  open,
  onOpenChange,
  actions,
}: {
  /** The row's name, for the button's accessible name. */
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: RowMenuAction[];
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  // on open: focus the first item; outside clicks close without moving focus
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onOpenChangeRef.current(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const close = () => {
    btnRef.current?.focus();
    onOpenChange(false);
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      list[(n + list.length) % list.length]?.focus();
    };
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") onOpenChange(false);
    else if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <IconButton
        ref={btnRef}
        icon="more"
        size="s"
        label={`More actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => onOpenChange(!open)}
        onKeyDown={(e) => {
          if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) {
            e.preventDefault();
            onOpenChange(true);
          }
        }}
      />
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={`Actions for ${name}`}
          className="menu right-0 top-full mt-2"
          onKeyDown={onMenuKey}
        >
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className={cx("menu-item", a.danger && "menu-item-danger")}
              onClick={() => {
                close();
                a.onSelect();
              }}
            >
              <Icon name={a.icon} size={20} />
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
