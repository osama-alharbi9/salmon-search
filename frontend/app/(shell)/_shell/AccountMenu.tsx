"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { errorMessage } from "../../lib/api";
import { initials, useSession } from "../../lib/session";
import { Icon } from "../../ui/Icon";
import { useToast } from "../../ui/Toast";

/**
 * Account button and menu (DESIGN.md 5.8): 40 px initials disc + name or email
 * + chevron. The menu shows name and email, Saved, History and Log out (no
 * confirm, then the toast "Logged out."). Esc, Tab and outside clicks close
 * it; focus returns to the button.
 */
export function AccountMenu() {
  const { user, displayName, logout } = useSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const items = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  };

  // focus the first item when the menu opens
  useEffect(() => {
    if (open) requestAnimationFrame(() => items()[0]?.focus());
  }, [open]);

  // outside click closes without stealing focus
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  if (!user) return null;

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      list[(i + 1) % list.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      list[(i - 1 + list.length) % list.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      list[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      list[list.length - 1]?.focus();
    }
  };

  const onLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
      setOpen(false);
      toast("Logged out.");
      // the menu is gone; put focus on the "Log in" link that replaces it
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(".topbar-account a, #content")?.focus(),
      );
    } catch (e) {
      close();
      toast(errorMessage(e, "That didn't log you out. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="acct" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="acct-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu for ${displayName}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="avatar" aria-hidden="true">
          {initials(user)}
        </span>
        <span className="acct-name">{displayName}</span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <div className="menu acct-menu">
          <div className="menu-head">
            {user.name && <div className="menu-head-name">{user.name}</div>}
            <div className={user.name ? "menu-head-email" : "menu-head-name"}>{user.email}</div>
          </div>
          <div ref={menuRef} id={menuId} role="menu" aria-label="Account" onKeyDown={onMenuKey}>
            <Link href="/saved" role="menuitem" className="menu-item" tabIndex={-1} onClick={() => close(false)}>
              <Icon name="bookmark" size={20} />
              Saved
            </Link>
            <Link href="/history" role="menuitem" className="menu-item" tabIndex={-1} onClick={() => close(false)}>
              <Icon name="clock" size={20} />
              History
            </Link>
            <hr className="menu-sep" />
            <button
              type="button"
              role="menuitem"
              className="menu-item"
              tabIndex={-1}
              aria-busy={busy || undefined}
              onClick={onLogout}
            >
              {busy ? "Logging out" : "Log out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
