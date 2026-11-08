// Run with `npm test` (node --test). Node 22.18+ strips the types, so this file
// imports query.ts directly with its extension.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appHref,
  authHref,
  classifyItem,
  cleanTitle,
  countLabel,
  dedupeItems,
  filterLabel,
  isFilterItem,
  mediaIcon,
  mediaLabel,
  MEDIUM_ALIASES,
  parseQueryParam,
  safeNext,
  splitItems,
  tropeHref,
  workHref,
} from "./query.ts";

const README = ["true companions", "the caper", "anti-hero"];

test("README link with literal + and raw spaces splits into three items", () => {
  assert.deepEqual(parseQueryParam("?q=true companions + the caper + anti-hero"), README);
});

test("README link as the browser sends it (%20 spaces, literal +)", () => {
  assert.deepEqual(
    parseQueryParam("?q=true%20companions%20+%20the%20caper%20+%20anti-hero"),
    README,
  );
});

test("form-submitted value: + is a space, %2B is the separator", () => {
  assert.deepEqual(parseQueryParam("?q=true+companions+%2B+the+caper+%2B+anti-hero"), README);
  assert.deepEqual(parseQueryParam("q=true+companions+%2B+the+caper"), [
    "true companions",
    "the caper",
  ]);
});

test("form-submitted single item stays one item", () => {
  assert.deepEqual(parseQueryParam("?q=true+companions"), ["true companions"]);
  assert.deepEqual(parseQueryParam("?q=heist"), ["heist"]);
});

test("appHref encodes + as %2B and round-trips through parseQueryParam", () => {
  const href = appHref(README);
  assert.equal(href, "/app?q=true%20companions%20%2B%20the%20caper%20%2B%20anti-hero");
  assert.deepEqual(parseQueryParam(href.slice(href.indexOf("?"))), README);

  const tricky = ["like Firefly", "movies only", "Rock & Roll", "50% chance"];
  const h2 = appHref(tricky);
  assert.deepEqual(parseQueryParam(h2.slice(h2.indexOf("?"))), tricky);
});

test("appHref with no items is plain /app", () => {
  assert.equal(appHref([]), "/app");
  assert.equal(appHref(["  ", ""]), "/app");
});

test("?trope= seeds one item, placed first, and combines with q", () => {
  assert.deepEqual(parseQueryParam("?trope=Breaking%20the%20Fourth%20Wall"), [
    "Breaking the Fourth Wall",
  ]);
  assert.deepEqual(parseQueryParam("?q=the%20caper&trope=Anti-Hero"), ["Anti-Hero", "the caper"]);
  assert.deepEqual(parseQueryParam(tropeHref("Rock + Roll").slice(4)), ["Rock + Roll"]);
});

test("empty or missing input gives no items", () => {
  assert.deepEqual(parseQueryParam(""), []);
  assert.deepEqual(parseQueryParam("?"), []);
  assert.deepEqual(parseQueryParam("?q="), []);
  assert.deepEqual(parseQueryParam("?q=%20%2B%20"), []);
  assert.deepEqual(parseQueryParam("?auth=ok"), []);
  assert.deepEqual(parseQueryParam("?q=+++"), []);
});

test("duplicates are dropped case-insensitively, keeping the first", () => {
  assert.deepEqual(parseQueryParam("?q=Heist%20+%20heist%20+%20the%20caper"), [
    "Heist",
    "the caper",
  ]);
  assert.deepEqual(dedupeItems(["A", "a", " b ", "B"]), ["A", "b"]);
});

test("malformed percent sequences do not throw", () => {
  assert.deepEqual(parseQueryParam("?q=100%25%20+%20bad%E0%A4"), ["100%", "bad%E0%A4"]);
});

test("splitItems trims and drops empties", () => {
  assert.deepEqual(splitItems(" a + b ++ c "), ["a", "b", "c"]);
});

test("filter clauses are recognised like backend/app/vds.py", () => {
  assert.deepEqual(classifyItem("movies only"), {
    kind: "filter",
    text: "movies only",
    mode: "include",
    media: ["Film"],
  });
  assert.deepEqual(classifyItem("no fanfic"), {
    kind: "filter",
    text: "no fanfic",
    mode: "exclude",
    media: ["Fanfic"],
  });
  assert.deepEqual(classifyItem("anime only"), {
    kind: "filter",
    text: "anime only",
    mode: "include",
    media: ["Anime"],
  });
  // multi-word aliases win over their parts: "western animation" is not "web animation"
  const wa = classifyItem("just western animation");
  assert.equal(wa.kind, "filter");
  assert.deepEqual(wa.kind === "filter" && wa.media, ["WesternAnimation"]);
  // two media in one clause
  const two = classifyItem("without books or comics");
  assert.deepEqual(two.kind === "filter" && [two.mode, two.media], [
    "exclude",
    ["ComicBook", "Literature"],
  ]);
});

test("tropes that contain filter or medium words stay tropes", () => {
  // filter word but no medium alias
  assert.equal(classifyItem("Not So Different").kind, "trope");
  assert.equal(classifyItem("No Ending").kind, "trope");
  // medium word but no filter word
  assert.equal(classifyItem("Show Within a Show").kind, "trope");
  assert.equal(isFilterItem("Not So Different"), false);
  assert.equal(isFilterItem("tv shows only"), true);
});

test("like X and works like X are titles", () => {
  assert.deepEqual(classifyItem("like Firefly"), {
    kind: "title",
    text: "like Firefly",
    title: "Firefly",
  });
  assert.deepEqual(classifyItem("Works like Cowboy Bebop"), {
    kind: "title",
    text: "Works like Cowboy Bebop",
    title: "Cowboy Bebop",
  });
  assert.equal(classifyItem("likeable rogue").kind, "trope");
  assert.equal(classifyItem("true companions").kind, "trope");
});

test("the alias table matches the backend's 16 media types", () => {
  assert.equal(Object.keys(MEDIUM_ALIASES).length, 16);
  assert.ok(MEDIUM_ALIASES.Series.includes("tv"));
});

test("media labels follow DESIGN.md 5.6.1", () => {
  assert.equal(mediaLabel("Series"), "TV series");
  assert.equal(mediaLabel("Literature"), "Book");
  assert.equal(mediaLabel("VideoGame"), "Video game");
  assert.equal(mediaLabel("Fanfic"), "Fan fiction");
  assert.equal(mediaLabel("WebAnimation"), "Web animation");
  assert.equal(mediaLabel("SomeNewThing"), "Some new thing");
  assert.equal(mediaLabel(null), "Work");
  assert.equal(mediaIcon("Film"), "film");
  assert.equal(mediaIcon("Series"), "tv");
  assert.equal(mediaIcon("Anime"), "anime");
  assert.equal(mediaIcon("VideoGame"), "game");
  assert.equal(mediaIcon("Literature"), "book");
  assert.equal(mediaIcon("Wrestling"), "other");
});

test("filter labels", () => {
  assert.equal(filterLabel("include", ["Film"]), "Film only");
  assert.equal(filterLabel("include", ["Film"], "prefix"), "Only film");
  assert.equal(filterLabel("exclude", ["Fanfic"]), "No fan fiction");
  assert.equal(filterLabel("include", ["Series"]), "TV series only");
  assert.equal(filterLabel("include", ["Film", "Anime"]), "Film or anime only");
});

test("cleanTitle drops a bracket that repeats the medium", () => {
  assert.equal(cleanTitle("Quadrilateral Cowboy (Video Game)", "VideoGame"), "Quadrilateral Cowboy");
  assert.equal(cleanTitle("Dune (Literature)", "Literature"), "Dune");
  assert.equal(cleanTitle("Highlander (1986)", "Film"), "Highlander (1986)");
  assert.equal(cleanTitle("Firefly", "Series"), "Firefly");
});

test("links and counts", () => {
  assert.equal(workHref("Series/Firefly"), "/work/Series/Firefly");
  assert.equal(workHref("Film/Rock & Roll"), "/work/Film/Rock%20%26%20Roll");
  assert.equal(countLabel(1, "trope"), "1 trope");
  assert.equal(countLabel(4232, "work"), "4,232 works");
  assert.equal(safeNext("/saved?tab=works"), "/saved?tab=works");
  assert.equal(safeNext("https://evil.example"), "/app");
  assert.equal(safeNext("//evil.example"), "/app");
  assert.equal(safeNext("/\\evil.example"), "/app");
  assert.equal(safeNext(null, "/"), "/");
  assert.equal(authHref("login", "/app?q=a"), "/login?next=%2Fapp%3Fq%3Da");
  assert.equal(authHref("signup"), "/signup");
});
