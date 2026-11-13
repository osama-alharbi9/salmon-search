"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "./Button";

export type ToastAction = {
  /** Short verb: "Undo", "View". */
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  /** Primary S button inside the toast. The toast closes after it runs. */
  action?: ToastAction;
  /** Milliseconds on screen. Default 5000, or 8000 with an action. */
  duration?: number;
};

type ToastState = {
  id: number;
  message: string;
  action?: ToastAction;
  duration: number;
  leaving: boolean;
};

export type ToastApi = {
  /**
   * Show a toast. One at a time: a new toast replaces the current one.
   * Copy is past tense, 2 to 4 words: "Search saved.", "Removed from saved."
   */
  toast: (message: string, options?: ToastOptions) => number;
  /** Close the current toast (or only the one with this id). */
  dismiss: (id?: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** Read the toast API. Must be inside <ToastProvider> (the root layout has it). */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>.");
  return ctx;
}

const EXIT_MS = 160;

/**
 * Holds the one toast and its polite live region (DESIGN.md 5.12): bottom
 * centre, 24 px above the edge (16 above the mobile tab bar), pauses while
 * hovered or focused.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastState | null>(null);
  const nextId = useRef(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remaining = useRef(0);
  const startedAt = useRef(0);
  const paused = useRef(false);
  /** Where focus was before it entered the toast, to go back to after its action. */
  const returnTo = useRef<HTMLElement | null>(null);
  const toastEl = useRef<HTMLDivElement>(null);

  const clearTimers = () => {
    if (timer.current) clearTimeout(timer.current);
    if (exitTimer.current) clearTimeout(exitTimer.current);
    timer.current = null;
    exitTimer.current = null;
  };

  const dismiss = useCallback((id?: number) => {
    setCurrent((c) => {
      if (!c || (id !== undefined && c.id !== id) || c.leaving) return c;
      return { ...c, leaving: true };
    });
  }, []);

  const toast = useCallback((message: string, options?: ToastOptions) => {
    clearTimers();
    const id = nextId.current++;
    const duration = options?.duration ?? (options?.action ? 8000 : 5000);
    setCurrent({ id, message, action: options?.action, duration, leaving: false });
    return id;
  }, []);

  // Run the countdown for the current toast; pause support via refs.
  const schedule = useCallback(
    (ms: number, id: number) => {
      if (timer.current) clearTimeout(timer.current);
      startedAt.current = Date.now();
      remaining.current = ms;
      timer.current = setTimeout(() => dismiss(id), ms);
    },
    [dismiss],
  );

  useEffect(() => {
    if (!current) return;
    if (current.leaving) {
      if (timer.current) clearTimeout(timer.current);
      exitTimer.current = setTimeout(() => {
        setCurrent((c) => (c && c.id === current.id ? null : c));
      }, EXIT_MS);
      return () => {
        if (exitTimer.current) clearTimeout(exitTimer.current);
      };
    }
    paused.current = false;
    schedule(current.duration, current.id);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [current, schedule]);

  const pause = () => {
    if (!current || current.leaving || paused.current) return;
    paused.current = true;
    if (timer.current) clearTimeout(timer.current);
    remaining.current = Math.max(1000, remaining.current - (Date.now() - startedAt.current));
  };
  const resume = (e?: { currentTarget: HTMLElement; relatedTarget: EventTarget | null }) => {
    if (!current || current.leaving || !paused.current) return;
    // stay paused while focus is still inside the toast
    if (e && e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    paused.current = false;
    schedule(remaining.current, current.id);
  };

  const api = useMemo<ToastApi>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
        {current && (
          <div
            key={current.id}
            className="toast"
            data-leaving={current.leaving || undefined}
            onMouseEnter={pause}
            onMouseLeave={() => resume()}
            ref={toastEl}
            onFocus={(e) => {
              const from = e.relatedTarget;
              if (from instanceof HTMLElement && !e.currentTarget.contains(from)) returnTo.current = from;
              pause();
            }}
            onBlur={(e) => resume(e)}
          >
            <span className="toast-msg">{current.message}</span>
            {current.action && (
              <Button
                variant="primary"
                size="s"
                className="toast-action"
                onClick={() => {
                  const run = current.action?.onClick;
                  dismiss(current.id);
                  run?.();
                  // The toast and its button are about to go: don't drop focus
                  // to <body>. The action may move focus itself (it wins).
                  const back = returnTo.current;
                  returnTo.current = null;
                  const el = toastEl.current;
                  if (back?.isConnected && el && el.contains(document.activeElement)) back.focus();
                }}
              >
                {current.action.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
