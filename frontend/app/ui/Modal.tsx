"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { cx } from "./cx";
import { IconButton } from "./IconButton";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ModalProps = {
  open: boolean;
  /** Called on Esc, scrim click and the close button (not while `busy`). */
  onClose: () => void;
  /** Dialog title (labels the dialog). */
  title: ReactNode;
  /** Optional line under the title (form modals), 16/24 secondary. */
  description?: ReactNode;
  /**
   * info: 540 wide, title and close on one row.
   * form: 540 wide, close on its own row, 28/36 title, full-width primary at the end.
   * confirm: 440 wide, no close button, buttons right aligned (stacked on mobile).
   */
  variant?: "info" | "form" | "confirm";
  /** Body content (fields for a form modal). */
  children?: ReactNode;
  /** Buttons row at the bottom (primary first in reading order for forms). */
  actions?: ReactNode;
  /** Element to focus on open. Default: the first field, else the first button. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** While true, Esc and scrim clicks do not close (e.g. while submitting). */
  busy?: boolean;
  /** Wrap the body in a <form> with this submit handler (form modals). */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  className?: string;
};

/**
 * Modal dialog (DESIGN.md 5.10): role="dialog", aria-modal, labelled by its
 * title, focus trapped, Esc and scrim close it, focus returns to the control
 * that opened it. Bottom sheet below 480 px.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  variant = "info",
  children,
  actions,
  initialFocusRef,
  busy = false,
  onSubmit,
  className,
}: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);

  useEffect(() => {
    onCloseRef.current = onClose;
    busyRef.current = busy;
  });

  // open: remember the opener, lock scroll, move focus in; close: restore focus
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const body = panel?.querySelector<HTMLElement>(".modal-body");
    const target =
      initialFocusRef?.current ??
      panel?.querySelector<HTMLElement>("input:not([disabled]), textarea:not([disabled]), select:not([disabled])") ??
      body?.querySelector<HTMLElement>(FOCUSABLE) ??
      panel?.querySelector<HTMLElement>(".modal-actions button:not([disabled])") ??
      panel;
    requestAnimationFrame(() => target?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!busyRef.current) {
          e.stopPropagation();
          onCloseRef.current();
        }
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (!items.length) {
        e.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      const back = restoreRef.current;
      if (back && document.contains(back)) back.focus();
    };
    // initialFocusRef is read once on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Modals open after a user action, so the server render never has one.
  if (!open || typeof document === "undefined") return null;

  const head =
    variant === "form" ? (
      <>
        <div className="modal-head">
          <IconButton icon="close" label="Close" onClick={() => !busy && onClose()} />
        </div>
        <h2 className="modal-title" id={titleId}>
          {title}
        </h2>
      </>
    ) : (
      <div className="modal-head">
        <h2 className="modal-title" id={titleId}>
          {title}
        </h2>
        {variant === "info" && (
          <IconButton icon="close" label="Close" onClick={() => !busy && onClose()} />
        )}
      </div>
    );

  const inner = (
    <>
      {head}
      {description && (
        <p className="modal-desc" id={descId}>
          {description}
        </p>
      )}
      {children && <div className="modal-body">{children}</div>}
      {actions && <div className="modal-actions">{actions}</div>}
    </>
  );

  return createPortal(
    <>
      <div className="modal-scrim" aria-hidden="true" />
      <div
        className="modal-root"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !busy) onClose();
        }}
      >
        <div
          ref={panelRef}
          className={cx("modal", `modal-${variant}`, className)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          aria-busy={busy || undefined}
          tabIndex={-1}
        >
          {onSubmit ? (
            <form onSubmit={onSubmit} noValidate>
              {inner}
            </form>
          ) : (
            inner
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}

export type ConfirmModalProps = {
  open: boolean;
  onCancel: () => void;
  /** Runs on confirm. While its promise is pending the button shows `confirmLoadingLabel`. */
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  children?: ReactNode;
  /** Verb for the action, e.g. "Clear history". */
  confirmLabel: string;
  /** -ing form shown while confirming, e.g. "Clearing". */
  confirmLoadingLabel?: string;
  cancelLabel?: string;
  /** Destructive solid (default) or primary. */
  destructive?: boolean;
};

/**
 * Confirm dialog (440 wide): tertiary "Cancel" then the action. Focus starts
 * on Cancel. Closes itself only through onCancel; call it after onConfirm
 * resolves if you want it gone (or set open to false).
 */
export function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  title,
  children,
  confirmLabel,
  confirmLoadingLabel,
  cancelLabel = "Cancel",
  destructive = true,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      variant="confirm"
      busy={busy}
      initialFocusRef={cancelRef}
      actions={
        <>
          <Button ref={cancelRef} variant="tertiary" size="m" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive-solid" : "primary"}
            size="m"
            loading={busy}
            loadingLabel={confirmLoadingLabel}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
