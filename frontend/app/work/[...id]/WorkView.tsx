"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type WorkDetail } from "../../lib/api";

export default function WorkView({ id }: { id: string }) {
  const [w, setW] = useState<WorkDetail | null>(null);
  const [err, setErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    api
      .workById(id)
      .then(setW)
      .catch((e) => setErr(String(e)));
  }, [id]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "24px 16px" }}>
      <div className="win" style={{ width: "100%", maxWidth: 720 }}>
        <div className="titlebar">
          <Link href="/app" className="close" />
          <span className="ttl" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/salmon-logo-display-transparent.png" alt="" width={16} height={16}
                 style={{ imageRendering: "pixelated", display: "block" }} />
            salmon · work
          </span>
        </div>
        <div style={{ padding: 16 }}>
          <Link href="/app" className="link">← back to salmon</Link>
          <div style={{ marginTop: 12 }}>
            {err && `Failed to load. ${err}`}
            {!w && !err && <span className="caret" />}
            {w && !w.found && "Not found."}
            {w && w.found && (
              <>
                <div className="chrome" style={{ marginBottom: 12 }}>{w.namespace}</div>
                <h1 style={{ fontSize: 36, lineHeight: 1.05, margin: "0 0 4px", fontWeight: "normal" }}>
                  {w.title}
                </h1>
                <div className="chrome" style={{ opacity: 0.7, marginBottom: 16 }}>
                  {w.namespace} <span style={{ color: "var(--salmon)" }}>·</span> {w.n_tropes} tropes
                </div>
                <p style={{ fontSize: 19, lineHeight: 1.25, margin: "0 0 16px", opacity: w.intro ? 1 : 0.6 }}>
                  {w.intro || "No description in this dataset."}
                </p>

                <div className="chrome" style={{ borderTop: "1px solid var(--ink)", paddingTop: 12, marginTop: 16, marginBottom: 8, fontSize: 12 }}>
                  Tropes · click to find works that share them
                </div>
                <div>
                  {(w.tropes ?? []).map((t) => (
                    <span
                      key={t}
                      className="trope"
                      onClick={() => router.push(`/app?trope=${encodeURIComponent(t)}`)}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {w.url && (
                  <>
                    <div className="chrome" style={{ borderTop: "1px solid var(--ink)", paddingTop: 12, marginTop: 16, marginBottom: 8, fontSize: 12 }}>
                      Source
                    </div>
                    <a className="link" style={{ fontSize: 16 }} href={w.url} target="_blank" rel="noopener noreferrer">
                      {w.url}
                    </a>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
