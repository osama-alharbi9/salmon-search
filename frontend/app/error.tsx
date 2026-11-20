"use client";
// Page crashed (DESIGN.md 9.7): focused bar, centred message, Try again and Go to search.
// Error boundaries must be client components; Next passes `retry` (re-fetch and
// re-render) and `reset` (re-render only).
import { useEffect, useRef } from "react";
import { Button } from "./ui/Button";
import { FocusedBar } from "./ui/FocusedBar";
import { Disc } from "./ui/ListRow";

export default function ErrorPage({
  error,
  retry,
  reset,
}: {
  error: unknown;
  retry?: () => void;
  reset?: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // for the developer console only; the page never shows the error itself
    console.error(error);
  }, [error]);

  // the page under the cursor just vanished: start reading from the message
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <>
      <FocusedBar />
      <main id="content" tabIndex={-1} className="focus:outline-none">
        <div className="focused-col grid justify-items-center text-center">
          <Disc icon="alert" size={64} className="text-deep" />
          <h1 ref={headingRef} tabIndex={-1} className="h1 mt-6 focus:outline-none">
            This page didn&apos;t load
          </h1>
          <p className="body-m mt-3 max-w-[400px] text-secondary">
            Something broke while loading it. Your saved searches and works are not affected.
          </p>
          <div className="mt-8 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <Button size="l" onClick={() => (retry ?? reset)?.()}>
              Try again
            </Button>
            <Button href="/app" variant="tertiary" size="l">
              Go to search
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
