"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useSession } from "../lib/session";
import { buttonClass, Icon, IconButton, Logo } from "../ui";
import { REPO_URL } from "./data";

// Marketing nav (DESIGN.md 5.8): logo, section links, Log in, "Open salmon".
// Below lg the links fold into a "Menu" button that opens a full-width sheet
// with 56 px rows. Esc, an outside click or picking a link closes it.

type Props = {
  /** "" on the landing page (links are #how), "/" elsewhere (links are /#how). */
  anchorBase?: "" | "/";
  id?: string;
};

export function MarketingNav({ anchorBase = "", id }: Props) {
  const { user, loading } = useSession();
  const [open, setOpen] = useState(false);
  const sheetId = useId();
  const menuBtn = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const anchors = [
    { href: `${anchorBase}#how`, label: "How it works" },
    { href: `${anchorBase}#examples`, label: "Examples" },
    { href: `${anchorBase}#faq`, label: "Questions" },
  ];
  const showLogin = loading || !user;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtn.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const mq = window.matchMedia("(min-width: 1024px)");
    const onWide = () => {
      if (mq.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    mq.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      mq.removeEventListener("change", onWide);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <nav className="lp-nav" aria-label="Main" id={id} ref={navRef}>
      <div className="lp-nav-inner mk-container">
        <Logo />
        <ul className="lp-nav-links">
          {anchors.map((a) => (
            <li key={a.label}>
              <a className="lp-nav-link" href={a.href}>
                {a.label}
              </a>
            </li>
          ))}
          <li>
            <a
              className="lp-nav-link"
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
              <Icon name="external" size={16} />
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
        <div className="lp-nav-right">
          {showLogin && (
            <Link className="lp-nav-link lp-nav-login" href="/login">
              Log in
            </Link>
          )}
          <Link className={buttonClass("primary", "s")} href="/app">
            Open salmon
          </Link>
          <IconButton
            ref={menuBtn}
            icon={open ? "close" : "menu"}
            label="Menu"
            className="lp-nav-menu"
            aria-expanded={open}
            aria-controls={sheetId}
            onClick={() => setOpen((o) => !o)}
          />
        </div>
      </div>
      <div id={sheetId} className="lp-sheet" hidden={!open}>
        <div className="mk-container">
          <ul>
            {anchors.map((a) => (
              <li key={a.label}>
                <a className="lp-sheet-row" href={a.href} onClick={close}>
                  {a.label}
                  <Icon name="chevron-right" size={20} />
                </a>
              </li>
            ))}
            <li>
              <a
                className="lp-sheet-row"
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
              >
                GitHub
                <span className="visually-hidden"> (opens in a new tab)</span>
                <Icon name="external" size={20} />
              </a>
            </li>
            {showLogin && (
              <li>
                <Link className="lp-sheet-row" href="/login" onClick={close}>
                  Log in
                  <Icon name="chevron-right" size={20} />
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
