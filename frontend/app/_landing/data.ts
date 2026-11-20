// Real data shown on the landing page. Every number here is API output from
// POST /api/vds_search on the loaded dataset (checked November 2026), or a
// figure from the README. Nothing is invented.
import type { ResultCardWork } from "../ui";

export const REPO_URL = "https://github.com/osama-alharbi9/salmon-search";
export const README_URL = `${REPO_URL}#readme`;
export const DATA_NOTES_URL = `${REPO_URL}#data-and-licensing`;
export const LICENSE_URL = `${REPO_URL}/blob/HEAD/LICENSE`;
export const DATASET_URL = "https://huggingface.co/datasets/RyokoExtra/TvTroper-Cleaned";
export const MODEL_URL = "https://huggingface.co/intfloat/multilingual-e5-small";

/** The example search used in the hero, the stage and the results band. */
export const EXAMPLE_ITEMS = ["true companions", "the caper", "anti-hero"];
export const EXAMPLE_QUERY = EXAMPLE_ITEMS.join(" + ");
export const EXAMPLE_TOTAL = 4232;

export const EXAMPLE_CHIPS = [
  { phrase: "true companions", trope: "True Companions", count: 1988 },
  { phrase: "the caper", trope: "The Caper", count: 260 },
  { phrase: "anti-hero", trope: "Anti-Hero", count: 2082 },
];

export type ExampleRow = {
  work: ResultCardWork;
  matched: string[];
  missing: string[];
};

const ALL3 = ["True Companions", "The Caper", "Anti-Hero"];
const TWO = ["True Companions", "Anti-Hero"];

/** Top 5 for true companions + the caper + anti-hero. */
export const EXAMPLE_ROWS: ExampleRow[] = [
  { work: { id: "Series/Firefly", title: "Firefly", namespace: "Series", n_tropes: 586 }, matched: ALL3, missing: [] },
  { work: { id: "Series/HighlanderTheSeries", title: "Highlander", namespace: "Series", n_tropes: 222 }, matched: ALL3, missing: [] },
  {
    work: { id: "VideoGame/QuadrilateralCowboy", title: "Quadrilateral Cowboy (Video Game)", namespace: "VideoGame", n_tropes: 58 },
    matched: ALL3,
    missing: [],
  },
  { work: { id: "Series/BlackadderTheThird", title: "Blackadder", namespace: "Series", n_tropes: 489 }, matched: TWO, missing: ["The Caper"] },
  { work: { id: "Series/Grimm", title: "Grimm", namespace: "Series", n_tropes: 469 }, matched: TWO, missing: ["The Caper"] },
];

/** like Cowboy Bebop + anime only: the 12 tropes the title became, and the leader. */
export const BEBOP_ITEMS = ["like Cowboy Bebop", "anime only"];
export const BEBOP_TROPES = [
  "Spontaneous Skeet Shooting",
  "Celebratory Body Tossing",
  "Ave Machina",
  "Those Three Guys",
  "Great Way to Go",
  "The Adventure Continues",
  "Infrared Xray Camera",
  "Lab Pet",
  "Credit Chip",
  "Half-Arc Season",
  "Childhood Home Rediscovery",
  "Samurai Cowboy",
];
const BEBOP_MATCHED = ["Ave Machina", "Infrared Xray Camera"];
export const BEBOP_LEADER: ExampleRow = {
  work: { id: "Anime/GhostInTheShellStandAloneComplex", title: "Ghost in the Shell: Stand Alone Complex", namespace: "Anime", n_tropes: 320 },
  matched: BEBOP_MATCHED,
  missing: BEBOP_TROPES.filter((t) => !BEBOP_MATCHED.includes(t)),
};

/** time travel + stable time loop + movies only. */
export const FILM_ITEMS = ["time travel", "stable time loop", "movies only"];
export const FILM_CHIPS = [
  { phrase: "time travel", trope: "Time Travel", count: 1107 },
  { phrase: "stable time loop", trope: "Stable Time Loop", count: 803 },
];
export const FILM_TOTAL = 118;
const TT = ["Time Travel", "Stable Time Loop"];
export const FILM_ROWS: ExampleRow[] = [
  { work: { id: "Film/Interstellar", title: "Interstellar", namespace: "Film", n_tropes: 226 }, matched: TT, missing: [] },
  { work: { id: "Film/StarTrekFirstContact", title: "Star Trek: First Contact", namespace: "Film", n_tropes: 223 }, matched: TT, missing: [] },
];
