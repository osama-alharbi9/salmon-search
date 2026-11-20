"use client";
import type { ReactNode } from "react";
import { SessionProvider } from "../lib/session";
import { ToastProvider } from "./Toast";

/** Client providers for the whole app: toasts outside, session and saved works inside. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider>{children}</SessionProvider>
    </ToastProvider>
  );
}
