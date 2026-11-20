"use client";
import { useAuthHref, useSession } from "../../lib/session";
import { Button } from "../../ui/Button";
import { Logo } from "../../ui/Logo";
import { AccountMenu } from "./AccountMenu";

/**
 * App top bar (DESIGN.md 5.8): 80 px over the content column (64 below
 * 1024 px, with the wordmark on the left). Signed out: "Log in" and "Sign up"
 * (Sign up hides on small screens). Signed in: the account menu.
 */
export function TopBar() {
  const { user, loading } = useSession();
  const login = useAuthHref("login");
  const signup = useAuthHref("signup");
  return (
    <header className="topbar">
      <div className="topbar-logo">
        <Logo size="s" />
      </div>
      <div className="topbar-account">
        {loading ? null : user ? (
          <AccountMenu />
        ) : (
          <>
            <Button href={login.href} onClick={login.onClick} variant="tertiary" size="s">
              Log in
            </Button>
            <Button
              href={signup.href}
              onClick={signup.onClick}
              variant="primary"
              size="s"
              className="topbar-signup"
            >
              Sign up
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
