"use client";

import { useEffect, useState } from "react";
import { X, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ServerDiagnosis {
  id: string;
  year: number;
  make: string;
  model: string;
  issue: string;
  created_at: string;
  driveSafety?: { verdict?: "STOP" | "CAUTION" | "OKAY" };
}

interface LocalItem {
  id: string;
  year: string;
  make: string;
  model: string;
  issue: string;
  date: string;
  verdict: "STOP" | "CAUTION" | "OKAY";
}

interface Row {
  key: string;
  car: string;
  issue: string;
  date: string;
  verdict: "STOP" | "CAUTION" | "OKAY";
  local?: LocalItem;
}

const VERDICT_DOT: Record<string, string> = { STOP: "var(--red)", CAUTION: "var(--amber)", OKAY: "var(--green)" };

interface Props {
  onClose: () => void;
  /** Open a locally cached diagnosis in the report view (server rows have no full report cached). */
  onOpenLocal: (item: LocalItem & { diagnosis: unknown }) => void;
}

export default function HistorySheet({ onClose, onOpenLocal }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let local: (LocalItem & { diagnosis: unknown })[] = [];
    try {
      local = JSON.parse(localStorage.getItem("torque_diagnosis_history") || "[]");
    } catch { /* ignore */ }

    const localRows: Row[] = local.map((l) => ({
      key: `local-${l.id}`,
      car: `${l.year} ${l.make} ${l.model}`,
      issue: l.issue,
      date: l.date,
      verdict: l.verdict,
      local: l,
    }));

    if (!user) {
      setRows(localRows);
      return;
    }

    fetch("/api/diagnoses")
      .then((r) => r.json())
      .then((d) => {
        const server: Row[] = (d.diagnoses ?? []).map((s: ServerDiagnosis) => ({
          key: `srv-${s.id}`,
          car: `${s.year} ${s.make} ${s.model}`,
          issue: s.issue,
          date: s.created_at,
          verdict: s.driveSafety?.verdict ?? "OKAY",
        }));
        // Server list is the source of truth; add local-only items not synced yet
        const seen = new Set(server.map((r) => r.car + r.issue));
        const merged = [...server, ...localRows.filter((l) => !seen.has(l.car + l.issue))];
        merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRows(merged);
      })
      .catch(() => setRows(localRows));
  }, [user]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 80, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Diagnosis history"
        className="sheet-enter"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "480px", maxHeight: "80dvh", overflowY: "auto", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderTopLeftRadius: "20px", borderTopRightRadius: "20px", padding: "20px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={16} color="#4a9eff" aria-hidden="true" /> Diagnosis History
          </h2>
          <button
            onClick={onClose}
            aria-label="Close history"
            style={{ background: "none", border: "none", color: "#5d7290", cursor: "pointer", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {rows === null ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }} aria-hidden="true">
            <div className="skeleton" style={{ height: "58px" }} />
            <div className="skeleton" style={{ height: "58px" }} />
            <div className="skeleton" style={{ height: "58px" }} />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 16px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/carlos/carlos-waving.webp" alt="" style={{ height: "90px", width: "auto", margin: "0 auto 12px", display: "block" }} />
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-2)", lineHeight: 1.6 }}>
              No diagnoses yet. Run your first one and it&apos;ll show up here.
            </p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            {rows.map((row) => {
              const clickable = !!row.local;
              const inner = (
                <>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: VERDICT_DOT[row.verdict], flexShrink: 0 }} aria-hidden="true" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{row.car}</span>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.issue}</span>
                  </span>
                  <span style={{ fontSize: "11px", color: "#5d7290", flexShrink: 0 }}>
                    {new Date(row.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </>
              );
              return (
                <li key={row.key}>
                  {clickable ? (
                    <button
                      onClick={() => { onOpenLocal(row.local as LocalItem & { diagnosis: unknown }); onClose(); }}
                      style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", minHeight: "56px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", textAlign: "left", boxSizing: "border-box" }}
                    >
                      {inner}
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minHeight: "56px", backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 14px", boxSizing: "border-box" }}>
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
