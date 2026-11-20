"use client";
import {
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Button, Chip, Icon } from "@/app/ui";
import type { ChipView } from "./chips";

export type ComposerChip = ChipView & {
  id: number;
  /** Extra control inside the chip, e.g. the title chip's "Show the 12 tropes" button. */
  extra?: ReactNode;
};

export type ComposerProps = {
  chips: ComposerChip[];
  draft: string;
  onDraftChange: (value: string) => void;
  /** Commit text as chips. It may hold several items joined with +. */
  onAdd: (text: string) => void;
  onRemove: (id: number) => void;
  /** Run the search with every chip plus the text still in the field. */
  onSearch: () => void;
  onStop: () => void;
  busy: boolean;
  /** Claude is turning a described story into tropes. */
  reading?: boolean;
  /** "Add a trope or a title first." after Search with nothing. */
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  /** Shown at the right of the helper line ("Describe a vibe instead"). */
  helpAction?: ReactNode;
};

const HELP_ID = "composer-help";
const ERROR_ID = "composer-error";

/**
 * The composer (DESIGN.md 5.3): search icon, chips, a borderless field and the
 * Search button in one pill. Enter adds the text as a chip, or searches when
 * the field is empty. "a + b" splits into chips as you type or paste.
 * Backspace in an empty field moves to the last chip's remove button; a
 * second Backspace removes that chip.
 */
export function Composer({
  chips,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
  onSearch,
  onStop,
  busy,
  reading = false,
  error,
  inputRef,
  helpAction,
}: ComposerProps) {
  const removeRefs = useRef(new Map<number, HTMLButtonElement>());
  const focusInput = () => inputRef.current?.focus();

  const change = (value: string) => {
    // Typing "+" commits everything before it; the rest stays in the field.
    if (value.includes("+")) {
      const at = value.lastIndexOf("+");
      const done = value.slice(0, at);
      if (done.trim()) onAdd(done);
      onDraftChange(value.slice(at + 1).replace(/^\s+/, ""));
      return;
    }
    onDraftChange(value);
  };

  const paste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes("+")) return;
    // Pasting "a + b + c" makes three chips at once.
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    onAdd(draft.slice(0, start) + text + draft.slice(end));
    onDraftChange("");
  };

  const inputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (draft.trim()) {
        onAdd(draft);
        onDraftChange("");
      } else {
        onSearch();
      }
      return;
    }
    if (e.key === "Backspace" && draft === "" && chips.length > 0) {
      const el = e.currentTarget;
      if (el.selectionStart === 0 && el.selectionEnd === 0) {
        e.preventDefault();
        removeRefs.current.get(chips[chips.length - 1].id)?.focus();
      }
    }
  };

  // Backspace or Delete on a chip's remove button removes that chip.
  const groupKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Backspace" && e.key !== "Delete") return;
    for (const [id, btn] of removeRefs.current) {
      if (btn === e.target) {
        e.preventDefault();
        onRemove(id);
        focusInput();
        return;
      }
    }
  };

  return (
    <div>
      <div
        className="composer"
        role="group"
        data-busy={busy ? "true" : undefined}
        aria-label="Your tropes"
        data-error={error ? "true" : undefined}
        onKeyDown={groupKey}
        onClick={(e) => {
          // A click on the empty part of the field puts the cursor in it.
          if (e.target === e.currentTarget) focusInput();
        }}
      >
        <Icon name="search" size={24} className="composer-lead" />
        {chips.map((c) => (
          <Chip
            key={c.id}
            kind={c.kind}
            label={c.label}
            phrase={c.phrase}
            count={c.count}
            meta={c.meta}
            removeRef={(el: HTMLButtonElement | null) => {
              if (el) removeRefs.current.set(c.id, el);
              else removeRefs.current.delete(c.id);
            }}
            onRemove={() => {
              onRemove(c.id);
              focusInput();
            }}
          >
            {c.extra}
          </Chip>
        ))}
        <input
          ref={inputRef}
          className="composer-input"
          type="text"
          value={draft}
          onChange={(e) => change(e.target.value)}
          onKeyDown={inputKey}
          onPaste={paste}
          placeholder="Add a trope, a title like Firefly, or describe a story"
          aria-label="Add a trope or a title"
          aria-describedby={error ? `${ERROR_ID} ${HELP_ID}` : HELP_ID}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="enter"
        />
        <div className="composer-actions">
          <Button size="l" loading={busy || reading} loadingLabel={reading ? "Reading" : "Searching"} onClick={onSearch}>
            Search
          </Button>
          {busy && (
            <Button variant="tertiary" size="m" onClick={onStop}>
              Stop
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p className="field-error mt-2" id={ERROR_ID}>
          <Icon name="info" size={16} />
          {error}
        </p>
      )}
      <div className="comp-help">
        <span id={HELP_ID}>Press Enter to add. Join several with +, or describe a story in a sentence and salmon picks the tropes.</span>
        {helpAction}
      </div>
    </div>
  );
}
