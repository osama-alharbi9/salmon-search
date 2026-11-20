import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass, ExternalLink, Icon, type IconName } from "./ui";
import { appHref } from "./lib/query";
import { Accordion, type AccordionItem } from "./_landing/Accordion";
import { ComparisonTable } from "./_landing/ComparisonTable";
import { DATA_NOTES_URL, EXAMPLE_ITEMS } from "./_landing/data";
import { Footer } from "./_landing/Footer";
import { HeroSearch } from "./_landing/HeroSearch";
import { HeroStage } from "./_landing/HeroStage";
import { MarketingNav } from "./_landing/MarketingNav";
import { ResultsBand } from "./_landing/ResultsBand";
import { FilterSplit, TitleSplit } from "./_landing/Splits";
import { StatsRow } from "./_landing/StatsRow";
import "./_landing/landing.css";

// The landing page (DESIGN.md 9.1). Copy is final copy from the landing copy
// doc. Every number is real: the loaded data, the README, or API output.

// The root layout's title template only applies to child segments, so the home
// page sets its whole title.
export const metadata: Metadata = {
  title: { absolute: "salmon, trope search for films, TV, anime, games and books" },
};

const STEPS = [
  {
    title: "Name a few tropes",
    body: "Type them in plain words. Each one is matched to a real trope, and its chip shows which.",
  },
  {
    title: "Check what each one matched",
    body: "Matching is loose, so read the chips. Swap out any that missed and try other wording.",
  },
  {
    title: "Read the list, fullest first",
    body: "Works with all your tropes come first. Works with some of them stay in, lower down.",
  },
];

const AUDIENCES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "film",
    title: "Fans",
    body: "You know the shape of the story you want. Name its tropes and get films, shows, anime, games and books in one ranked list.",
  },
  {
    icon: "edit",
    title: "Writers",
    body: "Before you start drafting, see which works already combine your tropes and how many have at least one of them.",
  },
];

const FAQ: AccordionItem[] = [
  {
    id: "faq-data",
    question: "Where does the data come from?",
    answer: (
      <>
        <p>
          From TVTropes and its contributors. salmon downloads a pinned revision of the RyokoExtra/TvTroper-Cleaned
          dump from Hugging Face and builds its index from it. The text is under a Creative Commons
          Attribution-NonCommercial-ShareAlike (CC BY-NC-SA) license, so salmon credits TVTropes and links each work
          back to its page. Anything built from the data has to stay non-commercial and use the same license.
        </p>
        <p>
          <ExternalLink href={DATA_NOTES_URL}>Read the data and licensing notes</ExternalLink>
        </p>
      </>
    ),
  },
  {
    id: "faq-ranking",
    question: "How does salmon rank the results?",
    answer: (
      <p>
        In three steps. First, each phrase is matched to one of 33,164 tropes using the multilingual-e5-small embedding
        model. A best match under 0.80 counts as unknown. Next, any title becomes up to 12 of its most distinctive
        tropes. Last, every work is scored by how many of the wanted tropes it lists, by exact name. Works with some of
        them stay in, below fuller ones, and ties go to the work with the longer trope list. Embeddings only decide
        which tropes you meant. They don&apos;t rank works.
      </p>
    ),
  },
  {
    id: "faq-account",
    question: "Do I need an account or an API key to search?",
    answer: (
      <p>
        No. Trope search needs no account and no keys. An account only saves your searches, the works you want to
        keep, and your search history.
      </p>
    ),
  },
  {
    id: "faq-claude",
    question: "What does salmon use Claude for?",
    answer: (
      <p>
        Only the optional vibe field. You describe a story in plain words and Claude Haiku suggests trope phrases,
        which you can keep or remove before you search. It needs an Anthropic API key on the server. Without one,
        everything else works the same, and Claude never ranks results.
      </p>
    ),
  },
  {
    id: "faq-titles",
    question: "Can I start from a title instead of tropes?",
    answer: (
      <p>
        Yes. A title of two or more words, such as the office, becomes that work&apos;s most distinctive tropes, and
        the work itself is left out of the results. One-word titles need like in front, as in like Firefly. You can mix
        a title with tropes and filters in the same search.
      </p>
    ),
  },
  {
    id: "faq-matching",
    question: "Why did my phrase turn into a different trope?",
    answer: (
      <p>
        Matching is loose. found family lands on Found Family via Work, a small trope, while true companions is the
        page name with far more works behind it. Each chip shows the trope your phrase matched and how many works use
        it, so check them and reword any that missed.
      </p>
    ),
  },
];

export default function Landing() {
  return (
    <div className="lp-page">
      <header>
        <MarketingNav id="lp-nav" />
      </header>

      <main id="content" tabIndex={-1} className="lp-main">
        {/* 2. Hero */}
        <section className="lp-hero" aria-labelledby="hero-title">
          <div className="mk-container">
            <h1 id="hero-title" className="display-xl lp-hero-h">
              <span className="lp-ln">Name the tropes.</span> <span className="lp-ln">Find the story.</span>
            </h1>
            <p className="body-l muted lp-hero-sub">
              85,633 works. 33,164 tropes. 16 media types. Combine tropes and see which stories have the most of them.
            </p>
            <HeroSearch id="hero-q" />
            <div className="lp-hero-actions">
              <a className={buttonClass("tertiary", "l")} href="#examples">
                See examples
              </a>
            </div>
            <p className="body-s muted lp-hero-hint">
              Join tropes with +. Put like in front of a title to start from a work you know.
            </p>
          </div>
        </section>
        <HeroStage />

        {/* 3. Proof numbers */}
        <StatsRow />

        {/* 4. How it works */}
        <section className="lp-band lp-grey lp-band-follow" id="how" aria-labelledby="how-title">
          <div className="mk-container">
            <div className="lp-center">
              <h2 id="how-title" className="display-l">
                From tropes to a ranked list
              </h2>
              <Link className={buttonClass("primary", "l", "lp-how-btn")} href={appHref(EXAMPLE_ITEMS)}>
                Try a search
              </Link>
            </div>
            <ol className="lp-steps">
              {STEPS.map((s, i) => (
                <li className="lp-step" key={s.title}>
                  <span className="lp-step-n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className="h2 lp-step-title">
                    <span className="visually-hidden">Step {i + 1}: </span>
                    {s.title}
                  </h3>
                  <p className="body-m muted lp-step-body">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 5. Real results */}
        <ResultsBand />

        {/* 6, 7. Splits */}
        <TitleSplit />
        <FilterSplit />

        {/* 8. What a search gives you */}
        <section className="lp-band lp-grey" aria-labelledby="table-title">
          <div className="mk-container">
            <div className="lp-center">
              <h2 id="table-title" className="display-m">
                What a search gives you
              </h2>
              <p className="body-m muted lp-sub">No account to search. No keys to search. No made-up titles.</p>
            </div>
            <ComparisonTable />
          </div>
        </section>

        {/* 9. Who it's for */}
        <section className="lp-band" aria-labelledby="who-title">
          <div className="mk-container">
            <h2 id="who-title" className="display-m lp-center">
              Made for fans and writers
            </h2>
            <ul className="lp-who">
              {AUDIENCES.map((a) => (
                <li className="lp-who-card" key={a.title}>
                  <span className="lp-who-disc" aria-hidden="true">
                    <Icon name={a.icon} size={24} />
                  </span>
                  <h3 className="display-s lp-who-title">{a.title}</h3>
                  <p className="body-m muted lp-who-body">{a.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 10. FAQ */}
        <section className="lp-band lp-band-follow" id="faq" aria-labelledby="faq-title">
          <div className="mk-container">
            <h2 id="faq-title" className="display-m lp-center">
              The short answers
            </h2>
            <div className="lp-faq">
              <Accordion items={FAQ} />
            </div>
          </div>
        </section>

        {/* 11. Closing band */}
        <section className="lp-closing" aria-labelledby="closing-title">
          <div className="mk-container lp-center">
            <h2 id="closing-title" className="display-l lp-closing-h">
              Pick three tropes
            </h2>
            <p className="body-m lp-closing-line">Or start from a title you already love.</p>
            <Link className={buttonClass("inverse", "l", "lp-closing-btn")} href="/app">
              Open salmon
            </Link>
          </div>
        </section>
      </main>

      {/* 12. Footer */}
      <Footer />
    </div>
  );
}
