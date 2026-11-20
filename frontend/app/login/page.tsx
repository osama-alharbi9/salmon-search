import type { Metadata } from "next";
import { LoginForm } from "../_auth/LoginForm";
import { readNext, type AuthSearchParams } from "../_auth/next";
import { FocusedBar } from "../ui/FocusedBar";

export const metadata: Metadata = { title: "Log in" };

/** /login (DESIGN.md 9.4): focused flow, no sidebar. ?next= is a same-origin path. */
export default async function LoginPage({ searchParams }: { searchParams: AuthSearchParams }) {
  const { next, keepNext } = await readNext(searchParams);
  return (
    <>
      <FocusedBar closeHref={next} />
      <main id="content" tabIndex={-1} className="focus:outline-none">
        <div className="focused-col">
          <LoginForm next={next} keepNext={keepNext} />
        </div>
      </main>
    </>
  );
}
