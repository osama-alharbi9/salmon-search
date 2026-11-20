"use client";
// Shared pieces of /login and /signup (DESIGN.md 9.4): the centred header, the
// "or" divider, Continue with Google, and the redirect for visitors who are
// already logged in.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, type ReactNode } from "react";
import { GOOGLE_LOGIN_URL } from "../lib/api";
import { useSession } from "../lib/session";
import { buttonClass } from "../ui/buttonClass";

/** Shown under the email field for an empty or malformed address (same words as the API's 422). */
export const EMAIL_MESSAGE = "Enter an email address like name@example.com.";

/** Loose shape check before we ask the server: something@something.something. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Centred h1 with the sub-line that links to the other form, keeping ?next=. */
export function AuthHeader({
  title,
  prompt,
  linkLabel,
  linkHref,
  children,
}: {
  title: string;
  /** "New to salmon?" */
  prompt: string;
  /** "Sign up" */
  linkLabel: string;
  linkHref: string;
  /** Optional extra line under the sub-line (the sign-up "why" line). */
  children?: ReactNode;
}) {
  return (
    <div className="text-center">
      <h1 className="h1">{title}</h1>
      <p className="body-s mt-3">
        {prompt}{" "}
        <Link href={linkHref} className="link">
          {linkLabel}
        </Link>
      </p>
      {children}
    </div>
  );
}

/** Hairline with "or" in the middle. */
export function OrDivider() {
  return (
    <div className="my-8 flex items-center gap-4 body-s text-secondary">
      <span className="h-px flex-1 bg-grey-200" aria-hidden="true" />
      <span>or</span>
      <span className="h-px flex-1 bg-grey-200" aria-hidden="true" />
    </div>
  );
}

/** Google's "G" mark, in colour, or in the label colour when the button is unavailable. */
function GoogleMark({ muted }: { muted?: boolean }) {
  const c = (colour: string) => (muted ? "currentColor" : colour);
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" focusable="false" className="flex-none">
      <path
        fill={c("#EA4335")}
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill={c("#4285F4")}
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill={c("#FBBC05")}
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill={c("#34A853")}
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * Tertiary L "Continue with Google". When the server has Google sign-in set
 * up it is a plain link (a full-page navigation) to the API's login route.
 * Otherwise it stays focusable but unavailable, with the reason under it, so
 * nobody lands on the API's raw error page.
 */
export function GoogleButton() {
  const { config, configLoaded } = useSession();
  const helpId = useId();
  const cls = buttonClass("tertiary", "l", "btn-block");

  if (config.google) {
    return (
      <a href={GOOGLE_LOGIN_URL} className={cls}>
        <GoogleMark />
        Continue with Google
      </a>
    );
  }
  return (
    <div className="grid gap-2">
      <button
        type="button"
        className={cls}
        aria-disabled="true"
        aria-describedby={configLoaded ? helpId : undefined}
        onClick={(e) => e.preventDefault()}
      >
        <GoogleMark muted />
        Continue with Google
      </button>
      {configLoaded && (
        <p id={helpId} className="help text-center">
          Google sign-in isn&apos;t set up on this server.
        </p>
      )}
    </div>
  );
}

/**
 * Someone who is already logged in skips the form and goes straight to `next`.
 * `skip` is true while this page's own submit is finishing (it navigates itself).
 */
export function useSignedInRedirect(next: string, skip: boolean) {
  const { user, loading } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user && !skip) router.replace(next);
  }, [loading, user, skip, next, router]);
}
