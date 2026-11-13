// Proof numbers (DESIGN.md 9.1 #3, m12). Real figures from the loaded data and
// the README: works.json has 85,633 works in 16 namespaces, the trope index
// has 33,164 tropes, and a title expands to at most 12 tropes.

const STATS = [
  { n: "85,633", label: "works indexed" },
  { n: "33,164", label: "tropes you can combine" },
  { n: "16", label: "media types, from film to wrestling" },
  { n: "12", label: "tropes at most, pulled from a title you start with" },
];

export function StatsRow() {
  return (
    <section className="lp-band lp-grey" aria-labelledby="stats-title">
      <div className="mk-container">
        <h2 id="stats-title" className="visually-hidden">
          salmon in numbers
        </h2>
        <div className="lp-stat-rule" />
        <ul className="lp-stats">
          {STATS.map((s) => (
            <li className="lp-stat" key={s.n}>
              <span className="stat lp-stat-n">{s.n}</span>
              <span className="lp-stat-l">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
