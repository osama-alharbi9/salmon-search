"""llm.py — the Claude (Haiku 4.5) tool-use loop that routes to the salmon engine.

The LLM is the interface/router only: it decides which engine function to call,
the engine does the actual retrieval over the trope data, and the LLM writes a
one-line intro. The ranked result list comes straight from the engine so the
model never reorders or fabricates it.
"""
from __future__ import annotations

import json
import os

import anthropic

from salmon import engine

MODEL = os.environ.get("SALMON_MODEL", "claude-haiku-4-5")  # cheap router

SYSTEM = """You are salmon, a trope-based recommendation engine for anime, \
films, series, games, manga and more, backed by a local TVTropes dataset.

The user describes what they want in natural language. Your job is to turn that \
into calls to the salmon engine and present the results conversationally.

Tools:
- recommend(title): given a work title, returns the works most similar by shared \
  tropes. This is your main tool. Use it whenever the user names or implies a \
  specific work ("like Cowboy Bebop", "more like Death Note").
- search_titles(query): look up which works match a title string. Use it to \
  disambiguate ("Death Note" matches several pages) or to confirm a title exists \
  before recommending.

Hard rules:
- EVERY work you list MUST come from a recommend() result in this conversation. \
  Never name a work the engine did not return. If you didn't get it from a tool \
  result, do not write it down.
- If recommend() resolves to the wrong work, check its `source` field. If the \
  source is wrong AND no better page exists, say the work isn't in the dataset \
  and stop — do not substitute titles from your own knowledge.
- The dataset is a TVTropes dump: some works are missing, or present only as a \
  different medium. State that plainly when it happens. Never paper over a gap \
  with invented recommendations.

Flow:
- User names a work -> recommend() on it. Trust the engine's `source`/`results`.
- User describes a vibe without a title -> pick a well-known work likely in the \
  dataset, recommend() on it, and say which one you used.

IMPORTANT — output format: The app renders the engine's ranked result list \
ITSELF, below your message. Do NOT list, number, or re-describe the results. Do \
NOT group them into categories. Do NOT use markdown. Write ONE short plain \
sentence intro, e.g. "closest matches to Cowboy Bebop, most similar first:". \
Terse, lowercase-leaning, no emoji, no exclamation marks. If recommend() found \
nothing, say so plainly in one or two lines and stop."""

TOOLS = [
    {
        "name": "recommend",
        "description": "Recommend works most similar to a given title, by shared "
                       "tropes. Cross-media. Returns the resolved source work and a "
                       "ranked list of similar works with their shared tropes.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "The work title to find similar works for."},
                "n": {"type": "integer", "description": "How many results (default 10)."},
                "namespaces": {
                    "type": "array", "items": {"type": "string"},
                    "description": "Optional: restrict results to these media, e.g. "
                                   "['Anime','Manga','Film','Series','VideoGame'].",
                },
            },
            "required": ["title"],
        },
    },
    {
        "name": "search_titles",
        "description": "Search the dataset for works whose title matches a query. "
                       "Use to disambiguate or confirm a title exists.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Title text to search for."},
            },
            "required": ["query"],
        },
    },
]

_client: anthropic.Anthropic | None = None


def client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        if not os.environ.get("ANTHROPIC_API_KEY"):
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set. Add it to backend/.env to use the "
                "vibe field and chat. Trope search works without it."
            )
        _client = anthropic.Anthropic()    # reads ANTHROPIC_API_KEY
    return _client


def run_tool(name: str, args: dict) -> dict:
    if name == "recommend":
        return engine.recommend(title=args["title"], n=int(args.get("n", 10)),
                                namespaces=args.get("namespaces"))
    if name == "search_titles":
        return {"matches": engine.search_titles(args["query"])}
    return {"error": f"unknown tool {name}"}


def why_lines(source: dict, results: list[dict], cl: anthropic.Anthropic) -> dict:
    """One short 'why it's similar' phrase per result (structured-output call)."""
    if not results:
        return {}
    items = [{"title": r["title"], "shared": (r.get("shared_tropes") or [])[:8]}
             for r in results]
    prompt = (
        f'Source work: "{source.get("title","?")}". For each candidate below, '
        f'write ONE short phrase (max ~12 words, lowercase, no period) saying why '
        f'it resembles the source, grounded in its shared tropes. Return JSON: '
        f'{{"reasons":[{{"title":..., "why":...}}]}} in the same order.\n'
        f'{json.dumps(items, ensure_ascii=False)}'
    )
    try:
        resp = cl.messages.create(
            model=MODEL, max_tokens=700,
            messages=[{"role": "user", "content": prompt}],
            output_config={"format": {"type": "json_schema", "schema": {
                "type": "object",
                "properties": {"reasons": {"type": "array", "items": {
                    "type": "object",
                    "properties": {"title": {"type": "string"}, "why": {"type": "string"}},
                    "required": ["title", "why"], "additionalProperties": False}}},
                "required": ["reasons"], "additionalProperties": False}}},
        )
        text = next(b.text for b in resp.content if b.type == "text")
        return {r["title"]: r["why"] for r in json.loads(text).get("reasons", [])}
    except Exception:
        return {}


def chat(history: list[dict], user_text: str) -> dict:
    """Run the tool-use loop; return {text, source, results}."""
    cl = client()
    messages = list(history) + [{"role": "user", "content": user_text}]
    last_reco: dict | None = None
    for _ in range(8):                      # hard cap on tool round-trips
        resp = cl.messages.create(model=MODEL, max_tokens=1200, system=SYSTEM,
                                  tools=TOOLS, messages=messages)
        if resp.stop_reason != "tool_use":
            text = "".join(b.text for b in resp.content if b.type == "text")
            out = {"text": text, "source": None, "results": []}
            if last_reco and last_reco.get("found"):
                source = last_reco.get("source")
                results = last_reco.get("results", [])
                whys = why_lines(source, results, cl)
                for r in results:
                    r["why"] = whys.get(r["title"], "")
                out["source"], out["results"] = source, results
            return out

        messages.append({"role": "assistant", "content": resp.content})
        tool_results = []
        for block in resp.content:
            if block.type == "tool_use":
                payload = run_tool(block.name, dict(block.input))
                if block.name == "recommend" and payload.get("found"):
                    last_reco = payload
                tool_results.append({"type": "tool_result", "tool_use_id": block.id,
                                     "content": json.dumps(payload)})
        messages.append({"role": "user", "content": tool_results})

    return {"text": "I couldn't finish that. Try rephrasing or naming a specific title.",
            "source": None, "results": []}
