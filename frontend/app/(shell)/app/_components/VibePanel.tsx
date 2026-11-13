"use client";
import { useRef, useState } from "react";
import { api, isAbortError } from "@/app/lib/api";
import { Banner, Button, Card, TextField } from "@/app/ui";

export type VibePanelProps = {
  id: string;
  /** Phrases already in the composer (lower-cased compare). */
  existing: readonly string[];
  /** Add new phrases as chips. */
  onPhrases: (phrases: string[]) => void;
};

const NOT_SET_UP = "The vibe field isn't set up on this server. Trope search works without it.";

/**
 * Vibe panel (DESIGN.md 5.3.1): describe a story, Claude suggests trope
 * phrases, and only the new ones arrive in the composer as chips. It never
 * searches by itself.
 */
export function VibePanel({ id, existing, onPhrases }: VibePanelProps) {
  const [text, setText] = useState("");
  const [reading, setReading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  const read = async () => {
    const v = text.trim();
    if (reading) return;
    if (!v) {
      setProblem(null);
      setNote("Describe a story first, in a sentence or two.");
      return;
    }
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setReading(true);
    setProblem(null);
    setNote(null);
    try {
      const r = await api.vibe(v, c.signal);
      if (r.error) {
        setProblem(/not set|api key|not configured/i.test(r.error) ? NOT_SET_UP : "salmon couldn't read that description. Try again, or add tropes yourself.");
        return;
      }
      if (!r.phrases.length) {
        setNote("No tropes came back for that description. Try a longer one.");
        return;
      }
      const have = new Set(existing.map((e) => e.toLowerCase()));
      const fresh = r.phrases.map((p) => p.trim()).filter((p) => p && !have.has(p.toLowerCase()));
      if (!fresh.length) {
        setNote("Those tropes are already in your search.");
        return;
      }
      onPhrases(fresh);
      setNote(`Added ${fresh.length === 1 ? "1 trope" : `${fresh.length} tropes`} to your search. Check them, then search.`);
    } catch (e) {
      if (isAbortError(e)) return;
      setProblem("salmon couldn't reach its server. Try again in a moment.");
    } finally {
      if (ctrl.current === c) setReading(false);
    }
  };

  return (
    <Card variant="medium" className="mt-4 rounded-m" id={id}>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          read();
        }}
      >
        <TextField
          multiline
          label="Describe the story you're in the mood for"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A crew that feels like family, on the run, a little sad but funny"
          maxLength={600}
        />
        {problem && <Banner variant="error">{problem}</Banner>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Button type="submit" variant="secondary" size="m" loading={reading} loadingLabel="Reading">
            Turn into tropes
          </Button>
          <p className="body-s muted" aria-live="polite">
            {note ?? "Claude suggests tropes from your description. You still choose what to search."}
          </p>
        </div>
      </form>
    </Card>
  );
}
