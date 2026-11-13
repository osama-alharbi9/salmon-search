"use client";
// /signup form (DESIGN.md 9.4): email, password with the rule panel, optional
// name, Create account, or, Continue with Google.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { errorMessage, isApiError } from "../lib/api";
import { authHref } from "../lib/query";
import { useSession } from "../lib/session";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { RulePanel, TextField, type Rule } from "../ui/TextField";
import { useToast } from "../ui/Toast";
import {
  AuthHeader,
  EMAIL_MESSAGE,
  GoogleButton,
  looksLikeEmail,
  OrDivider,
  useSignedInRedirect,
} from "./parts";

const MIN_PASSWORD = 8;

type Field = "email" | "password" | "name";
type Errors = Partial<Record<Field, ReactNode>>;
type FocusRequest = { target: Field | "banner"; n: number };

export function SignupForm({ next, keepNext }: { next: string; keepNext: string | null }) {
  const { signup } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const rulesId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  /** True after a submit with a short password: the rule panel turns red until it passes. */
  const [tried, setTried] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState<FocusRequest | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  useSignedInRedirect(next, busy);

  useEffect(() => {
    if (!focus) return;
    const map = { banner: bannerRef, email: emailRef, password: passwordRef, name: nameRef } as const;
    map[focus.target].current?.focus();
  }, [focus]);

  const ask = (target: FocusRequest["target"]) => setFocus((f) => ({ target, n: (f?.n ?? 0) + 1 }));

  const longEnough = password.length >= MIN_PASSWORD;
  const ruleState: Rule["state"] = longEnough ? "pass" : tried ? "fail" : "neutral";
  const passwordInvalid = ruleState === "fail" || !!errors.password;
  const loginHref = authHref("login", keepNext);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;

    const found: Errors = {};
    if (!looksLikeEmail(email)) found.email = EMAIL_MESSAGE;
    const shortPassword = !longEnough;
    setTried(shortPassword);
    setErrors(found);
    setBanner(null);
    if (found.email || shortPassword) {
      ask(found.email ? "email" : "password");
      return;
    }

    setBusy(true);
    try {
      await signup(email.trim(), password, name);
      toast("Account created.");
      router.replace(next);
    } catch (err) {
      setBusy(false);
      if (isApiError(err) && err.status === 409) {
        setErrors({
          email: (
            <>
              There&apos;s already an account with this email.{" "}
              <Link href={loginHref} className="link">
                Log in instead
              </Link>
              .
            </>
          ),
        });
        ask("email");
        return;
      }
      if (isApiError(err) && (err.field === "email" || err.field === "password" || err.field === "name")) {
        if (err.field === "password") setTried(true);
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
        title="Create your salmon account"
        prompt="Already have an account?"
        linkLabel="Log in"
        linkHref={loginHref}
      >
        <p className="body mt-4 text-secondary">
          An account saves your searches, works and history. You don&apos;t need one to search.
        </p>
      </AuthHeader>

      {banner && (
        <Banner ref={bannerRef} variant="error" title={banner} focusable className="mt-8" />
      )}

      <form className="mt-8 grid gap-6" onSubmit={onSubmit} noValidate aria-label="Sign up">
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
          }}
          aria-invalid={passwordInvalid || undefined}
          aria-describedby={rulesId}
          error={errors.password}
          after={<RulePanel id={rulesId} rules={[{ label: "At least 8 characters", state: ruleState }]} />}
        />
        <TextField
          ref={nameRef}
          label="Name"
          optional
          name="name"
          autoComplete="name"
          maxLength={200}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((x) => ({ ...x, name: undefined }));
          }}
          help="salmon shows it instead of your email."
          error={errors.name}
        />
        <Button type="submit" size="l" block loading={busy} loadingLabel="Creating account" className="mt-2">
          Create account
        </Button>
      </form>

      <OrDivider />
      <GoogleButton />
    </>
  );
}
