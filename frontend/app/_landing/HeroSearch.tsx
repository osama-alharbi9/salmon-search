import { buttonClass, Icon } from "../ui";
import { EXAMPLE_QUERY } from "./data";

// The hero search (DESIGN.md 9.1, 10): a plain GET form to /app with name="q",
// so it works without JavaScript. The browser sends spaces as + and a typed +
// as %2B, which /app's parseQueryParam splits back into items.
// md+: one 64 px pill with Search inside. Below md: a 56 px pill with a
// full-width Search button under it.

export function HeroSearch({ id, label = "Tropes to search for" }: { id: string; label?: string }) {
  return (
    <form className="lp-hero-form" action="/app" method="get" role="search" aria-label="Search salmon">
      <div className="lp-hero-field">
        <Icon name="search" size={24} />
        <label className="visually-hidden" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          className="lp-hero-input"
          name="q"
          type="text"
          autoComplete="off"
          enterKeyHint="search"
          placeholder={EXAMPLE_QUERY}
        />
      </div>
      <button type="submit" className={buttonClass("primary", "l", "lp-hero-submit")}>
        Search
      </button>
    </form>
  );
}
