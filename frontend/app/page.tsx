import Link from "next/link";
import "./landing.css";

const EXAMPLE = "found family + heist + morally grey mentor";

const PROBLEMS = [
  { who: "STREAMING", does: "searches only its own library." },
  { who: "GPT", does: "invents titles that do not exist." },
  { who: "TVTROPES", does: "cannot search trope combinations." },
];

const STEPS = [
  {
    n: "1",
    head: "say the vibe",
    body: "Type the tropes you want, joined with +. Plain words are fine.",
  },
  {
    n: "2",
    head: "resolve and score",
    body: "salmon maps your words to real tropes and scores every work by how much of the combo it covers.",
  },
  {
    n: "3",
    head: "ranked results",
    body: "Full matches first. Near-misses are surfaced, not buried, so you see what almost fits.",
  },
];

const AUDIENCES = [
  {
    tag: "FANS",
    head: "find the hidden one",
    body: "You know the exact shape of the story you want. Name the tropes and pull works no genre filter would ever group together.",
  },
  {
    tag: "WRITERS",
    head: "benchmark originality",
    body: "See how crowded a trope combo already is, and which corners stay underexplored, before you commit a year to it.",
  },
];

const RESULTS = [
  {
    rank: "1",
    title: "Phantom Larceny",
    cover: "3/3",
    pct: 100,
    matched: ["Found Family", "The Caper", "Morally Grey Mentor"],
    near: [],
    missing: [],
  },
  {
    rank: "2",
    title: "Nine-Tenths of the Law",
    cover: "3/3",
    pct: 100,
    matched: ["Found Family", "Caper Crew"],
    near: ["Anti-Hero Mentor"],
    missing: [],
  },
  {
    rank: "3",
    title: "Velvet Syndicate",
    cover: "2/3",
    pct: 66,
    matched: ["The Caper", "Morally Grey Mentor"],
    near: ["True Companions"],
    missing: [],
  },
  {
    rank: "4",
    title: "Last Train From Aoba",
    cover: "2/3",
    pct: 66,
    matched: ["Found Family"],
    near: ["One Last Job"],
    missing: ["Morally Grey Mentor"],
  },
];

export default function Landing() {
  return (
    <div className="lwrap">
      <div className="win lwin">
        <div className="titlebar">
          <span className="close" />
          <span className="ttl">salmon · trope search</span>
        </div>

        {/* 1 · HERO */}
        <section className="lhero">
          <p className="chrome lkicker">TROPE-BASED MEDIA SEARCH</p>
          <h1 className="lhead">
            Find shows and films by how the story actually works, not by genre.
          </h1>
          <p className="lsub">
            You give it a combination of tropes. It ranks every work by how fully
            it matches.
          </p>

          <form className="lsearch" action="/app" method="get">
            <input
              className="field lsearchin"
              name="q"
              placeholder={EXAMPLE}
              defaultValue=""
              aria-label="tropes joined with plus"
            />
            <button className="btn" type="submit">
              Search
            </button>
          </form>
          <p className="chrome lhint">TROPES JOINED WITH + . NEAR-MISSES KEPT.</p>
        </section>

        {/* 2 · THE PROBLEM */}
        <section className="lsec">
          <p className="chrome lsechead">{"// THE PROBLEM"}</p>
          <div className="lgrid l3">
            {PROBLEMS.map((p) => (
              <div key={p.who} className="lcard">
                <p className="chrome lcardtag">{p.who}</p>
                <p className="lcardbody">{p.does}</p>
              </div>
            ))}
          </div>
          <p className="lsecfoot">salmon does the one thing none of them do.</p>
        </section>

        {/* 3 · HOW IT WORKS */}
        <section className="lsec">
          <p className="chrome lsechead">{"// HOW IT WORKS"}</p>
          <div className="lgrid l3">
            {STEPS.map((s) => (
              <div key={s.n} className="lcard">
                <p className="lstepn">{s.n}</p>
                <p className="chrome lcardtag">{s.head}</p>
                <p className="lcardbody">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4 · WHO IT'S FOR */}
        <section className="lsec">
          <p className="chrome lsechead">{"// WHO IT'S FOR"}</p>
          <div className="lgrid l2">
            {AUDIENCES.map((a) => (
              <div key={a.tag} className="lcard">
                <p className="chrome lcardtag">{a.tag}</p>
                <p className="lcardhead">{a.head}</p>
                <p className="lcardbody">{a.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5 · SAMPLE RESULTS */}
        <section className="lsec">
          <p className="chrome lsechead">{"// SAMPLE RESULTS"}</p>
          <div className="lquery chrome">
            QUERY: <span className="lquerytext">{EXAMPLE}</span>
          </div>
          <div className="reslist lres">
            {RESULTS.map((r) => (
              <div key={r.rank} className="res lresrow">
                <span className="rank">{r.rank}</span>
                <span className="ttl">{r.title}</span>
                <span className="ns">{r.cover}</span>
                <div className="lpills">
                  {r.matched.map((t) => (
                    <span key={t} className="trope sel lpill">
                      {t}
                    </span>
                  ))}
                  {r.near.map((t) => (
                    <span key={t} className="trope lpill lpill-near">
                      ~ {t}
                    </span>
                  ))}
                  {r.missing.map((t) => (
                    <span key={t} className="trope lpill lpill-miss">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="bar">
                  <i style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="chrome llegend">
            SOLID = MATCHED . ~ = NEAR . STRIKE = MISSING .
          </p>
        </section>

        {/* 6 · FOOTER */}
        <section className="lfoot">
          <p className="lfoottag">vibe, don&apos;t search.</p>
          <p className="chrome lfootnote">
            RUNS LOCALLY ON THE FULL TVTROPES CORPUS .
          </p>
          <p className="chrome lfootnote">
            TROPE DATA FROM TVTROPES.ORG . CC BY-NC-SA .
          </p>
          <Link href="/app" className="link lfootlink chrome">
            OPEN SALMON
          </Link>
        </section>

        <div className="statusbar">
          <span className="count">READY.</span>
          <span>SALMON · CUPERTINO &apos;84</span>
        </div>
      </div>
    </div>
  );
}
