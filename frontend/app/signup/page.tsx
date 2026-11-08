import type { Metadata } from "next";
import { readNext, type AuthSearchParams } from "../_auth/next";
import { SignupForm } from "../_auth/SignupForm";
import { FocusedBar } from "../ui/FocusedBar";

export const metadata: Metadata = { title: "Sign up" };

/** /signup (DESIGN.md 9.4): focused flow, no sidebar. ?next= is a same-origin path. */
export default async function SignupPage({ searchParams }: { searchParams: AuthSearchParams }) {
  const { next, keepNext } = await readNext(searchParams);
  return (
    <>
      <FocusedBar closeHref={next} />
      <main id="content" tabIndex={-1} className="focus:outline-none">
        <div className="focused-col">
          <SignupForm next={next} keepNext={keepNext} />
        </div>
      </main>
    </>
  );
}
