"use client";
// /login form (DESIGN.md 9.4): email, password, Log in, or, Continue with Google.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { errorMessage, isApiError } from "../lib/api";
import { authHref } from "../lib/query";
import { useSession } from "../lib/session";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";
import { useToast } from "../ui/Toast";
import {
  AuthHeader,
  EMAIL_MESSAGE,
  GoogleButton,
  looksLikeEmail,
  OrDivider,
  useSignedInRedirect,
} from "./parts";

type Field = "email" | "password";
type Errors = Partial<Record<Field, string>>;
/** What to focus after the errors render. `n` makes a repeat of the same target refocus. */
type FocusRequest = { target: Field | "banner"; n: number };

export function LoginForm({
  next,
  keepNext,
}: {
  /** Where to go after logging in (already validated, default /app). */
  next: string;
  /** The ?next= to carry over to the sign-up link, or null when none was given. */
  keepNext: string | null;
}) {
  const { login } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState<FocusRequest | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  useSignedInRedirect(next, busy);

  useEffect(() => {
    if (!focus) return;
    const el =
      focus.target === "banner" ? bannerRef.current : focus.target === "email" ? emailRef.current : passwordRef.current;
    el?.focus();
  }, [focus]);

  const ask = (target: FocusRequest["target"]) => setFocus((f) => ({ target, n: (f?.n ?? 0) + 1 }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;

    const found: Errors = {};
    if (!email.trim()) found.email = "Enter your email address.";
    else if (!looksLikeEmail(email)) found.email = EMAIL_MESSAGE;
    if (!password) found.password = "Enter your password.";
    setErrors(found);
    setBanner(null);
    if (found.email || found.password) {
      ask(found.email ? "email" : "password");
      return;
    }

    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      toast(`Logged in as ${u.name?.trim() || u.email}.`);
      router.replace(next);
      // stay busy: the page is about to change
    } catch (err) {
      setBusy(false);
      if (isApiError(err) && (err.field === "email" || err.field === "password")) {
        setErrors({ [err.field]: err.message });
        ask(err.field);
        return;
      }
      setBanner(errorMessage(err));
      ask("banner");
    }
  };

  return (
    <>
      <AuthHeader
        title="Log in to salmon"
        prompt="New to salmon?"
        linkLabel="Sign up"
        linkHref={authHref("signup", keepNext)}
      />

      {banner && (
        <Banner ref={bannerRef} variant="error" title={banner} focusable className="mt-8" />
      )}

      <form className="mt-8 grid gap-6" onSubmit={onSubmit} noValidate aria-label="Log in">
        <TextField
          ref={emailRef}
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
          }}
          error={errors.email}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
          }}
          error={errors.password}
        />
        <Button type="submit" size="l" block loading={busy} loadingLabel="Logging in" className="mt-2">
          Log in
        </Button>
      </form>

      <OrDivider />
      <GoogleButton />
    </>
  );
}
