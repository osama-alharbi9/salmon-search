import { Icon } from "../ui";

// Comparison table (DESIGN.md 5.17, m08): a white card on a grey band, rows
// grouped Searching / Results / Access, and a solid salmon column of short,
// honest answers. A real <table>; below md it becomes stacked rows with the
// answer as a salmon pill under each label.

type Row = { label: string; sub: string; value: string };
type Group = { title: string; rows: Row[] };

const GROUPS: Group[] = [
  {
    title: "Searching",
    rows: [
      { label: "Combine tropes in one search", sub: "Plain words, joined with +", value: "Yes" },
      { label: "Start from a title", sub: "Two or more words, or like + title", value: "Up to 12 tropes" },
      { label: "Filter by medium", sub: "only, no, just, without", value: "16 media types" },
    ],
  },
  {
    title: "Results",
    rows: [
      { label: "Ranked by how many tropes match", sub: "Ties go to the longer trope list", value: "Fullest first" },
      { label: "Works that match some tropes", sub: "Shown with the missing tropes named", value: "Kept, lower down" },
      { label: "Results per search", sub: "No paging yet", value: "Top 25" },
    ],
  },
  {
    title: "Access",
    rows: [
      { label: "Search without an account", sub: "No sign-up, no API key", value: "Yes" },
      { label: "Save searches and works", sub: "Plus a history of your searches", value: "With an account" },
      { label: "Describe a vibe in plain words", sub: "Uses Claude, needs a key on the server", value: "Optional" },
    ],
  },
];

export function ComparisonTable() {
  return (
    <div className="lp-table-card">
      <table className="lp-table">
        <caption className="visually-hidden">What a search gives you</caption>
        <thead className="visually-hidden">
          <tr>
            <th scope="col">Feature</th>
            <th scope="col">salmon</th>
          </tr>
        </thead>
        {GROUPS.map((g) => (
          <tbody key={g.title} className="lp-tgroup">
            <tr className="lp-tgroup-row">
              <th scope="colgroup" className="lp-tgroup-h">
                {g.title}
              </th>
              <td className="lp-tval" aria-hidden="true" />
            </tr>
            {g.rows.map((r) => (
              <tr key={r.label} className="lp-trow">
                <th scope="row" className="lp-tlabel">
                  <span className="lp-tlabel-in">
                    <Icon name="check" size={24} />
                    <span>
                      <span className="lp-tlabel-main">{r.label}</span>
                      <span className="lp-tlabel-sub">{r.sub}</span>
                    </span>
                  </span>
                </th>
                <td className="lp-tval">
                  <span className="lp-tval-pill">{r.value}</span>
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
