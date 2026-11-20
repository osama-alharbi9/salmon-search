"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/app/lib/api";
import { SEARCH_NAME_MAX as MAX_NAME } from "@/app/lib/query";
import { Button, Modal, TextField, useToast } from "@/app/ui";

/** A starting name: the items joined with " + ", cut to fit. */
export function defaultSearchName(items: string[]): string {
  const joined = items.join(" + ");
  return joined.length <= MAX_NAME ? joined : `${joined.slice(0, MAX_NAME - 1).trimEnd()}…`;
}

export type SaveSearchModalProps = {
  open: boolean;
  onClose: () => void;
  /** The raw items of the search on screen. */
  items: string[];
};

/** "Save search" form modal (DESIGN.md 5.10, a13). Mount it when opening so the name starts fresh. */
export function SaveSearchModal({ open, onClose, items }: SaveSearchModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(() => defaultSearchName(items));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const n = name.trim();
    if (!n) {
      setError("Enter a name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.saveSearch(n, items);
      onClose();
      toast("Search saved.", { action: { label: "View", onClick: () => router.push("/saved") } });
    } catch (e) {
      setError(errorMessage(e, "That didn't save. Try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="form"
      title="Save search"
      description="Name it so you can run it again from Saved."
      busy={saving}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      actions={
        <Button type="submit" size="l" block loading={saving} loadingLabel="Saving">
          Save search
        </Button>
      }
    >
      <TextField
        label="Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (error) setError(null);
        }}
        maxLength={MAX_NAME}
        counter
        error={error ?? undefined}
        help={`Searches for ${items.join(" + ")}`}
        autoComplete="off"
      />
    </Modal>
  );
}
