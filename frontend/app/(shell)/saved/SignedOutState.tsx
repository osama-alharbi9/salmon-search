"use client";
import { useAuthHref } from "../../lib/session";
import { Button } from "../../ui/Button";
import { EmptyState } from "../../ui/EmptyState";
import type { IconName } from "../../ui/Icon";

/**
 * Signed-out state for /saved and /history (DESIGN.md 9.5, 9.6): primary M
 * "Log in" and tertiary M "Create account", both coming back to this page.
 */
export function SignedOutState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const login = useAuthHref("login");
  const signup = useAuthHref("signup");
  return (
    <EmptyState
      icon={icon}
      title={title}
      action={
        <>
          <Button href={login.href} onClick={login.onClick} size="m">
            Log in
          </Button>
          <Button href={signup.href} onClick={signup.onClick} variant="tertiary" size="m">
            Create account
          </Button>
        </>
      }
    >
      {body}
    </EmptyState>
  );
}
