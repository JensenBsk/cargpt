"use client";

import { useState, useRef } from "react";
import type { Diagnostic, ChatMessage } from "@/types/diagnostic";
import DiagnosticReport from "@/components/DiagnosticReport";
import QuoteChecker from "@/components/QuoteChecker";
import AuthModal from "@/components/AuthModal";
import GarageView from "@/components/GarageView";
import BottomNav, { type AppTab } from "@/components/BottomNav";
import TorqueLogo from "@/components/TorqueLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { MapPin } from "lucide-react";

export default function Home() {
  const { user, available, signOut } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<AppTab>("diagnose");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [issue, setIssue] = useState("");
  const [modMode, setModMode] = useState(false);
  const [mods, setMods] = useState("");
  const [hasTune, setHasTune] = useState(false);
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnostic | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [quoteResetKey, setQuoteResetKey] = useState(0);
  const [quoteHasResult, setQuoteHasResult] = useState(false);

  const yearRef = useRef<HTMLDivElement>(null);
  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 36 }, (_, i) => currentYear - i);

  const showDiagnosisResult = activeTab === "diagnose" && diagnosis !== null;

  async function handleDiagnose(e: React.FormEvent) {
    e.preventDefault();

    if (!year || !make || !model || !issue.trim()) {
      setShowErrors(true);
      const firstEmpty = !year ? yearRef.current : !make ? makeRef.current : !model ? modelRef.current : null;
      firstEmpty?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setShowErrors(false);
    setLoading(true);
    setError("");
    setDiagnosis(null);
    setDiagnosisId(null);
    setChatHistory([]);

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year, make, model, issue,
          mods: modMode ? mods : "",
          hasTune: modMode ? hasTune : false,
          zip: zip.length === 5 ? zip : "",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setDiagnosis(data.diagnosis);
      setChatHistory([
        { role: "user", content: `Vehicle: ${year} ${make} ${model}${modMode && mods ? `\nMods: ${mods}${hasTune ? " (tuned)" : ""}` : ""}\n\nIssue: ${issue}` },
        { role: "assistant", content: JSON.stringify(data.diagnosis) },
      ]);

      if (available) {
        fetch("/api/diagnoses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year, make, model, issue, mods: modMode ? mods : "", hasTune: modMode ? hasTune : false, diagnosis: data.diagnosis }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.saved && d.id) {
              setDiagnosisId(d.id);
              toast("Diagnosis saved");
            }
          })
          .catch(() => {});
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleNewDiagnosis() {
    setDiagnosis(null);
    setDiagnosisId(null);
    setChatHistory([]);
    setIssue("");
    setError("");
  }

  function handleSelectCar(car: { year: string; make: string; model: string; mods: string; hasTune: boolean }) {
    setYear(car.year);
    setMake(car.make);
    setModel(car.model);
    if (car.mods) { setModMode(true); setMods(car.mods); setHasTune(car.hasTune); }
    setShowErrors(false);
    setActiveTab("diagnose");
    toast(`${car.year} ${car.make} ${car.model} loaded`);
  }

  function handleBackFromQuote() {
    setQuoteHasResult(false);
    setQuoteResetKey((k) => k + 1);
  }

  // ── Input form field styles ────────────────────────────────
  const fieldStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    height: "48px",
    padding: "0 14px",
    fontSize: "16px",
    backgroundColor: "#0d0f12",
    border: "1px solid #1e2329",
    borderRadius: "10px",
    color: "#f1f5f9",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    fontWeight: 600,
    color: "#4b5563",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "6px",
  };

  const allFilled = !!year && !!make && !!model && !!issue.trim();

  // ── Render diagnosis result (DiagnosticReport has its own header) ──
  if (showDiagnosisResult) {
    return (
      <>
        <DiagnosticReport
          diagnosis={diagnosis!}
          year={year}
          make={make}
          model={model}
          issue={issue}
          mods={modMode ? mods : ""}
          hasTune={modMode ? hasTune : false}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          onNewDiagnosis={handleNewDiagnosis}
          diagnosisId={diagnosisId}
          onToast={toast}
        />
        <BottomNav activeTab={activeTab} onChange={(tab) => { handleNewDiagnosis(); setActiveTab(tab); }} />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  return (
    <>
      {/* ── Sticky header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, height: "52px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0d0f12", borderBottom: "1px solid #1e2329" }}>
        {/* Back button when on quote result, logo otherwise */}
        {activeTab === "quote" && quoteHasResult ? (
          <button onClick={handleBackFromQuote} className="tap-target" style={{ fontSize: "14px", fontWeight: 500, color: "#9ca3af", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}>
            ← Back
          </button>
        ) : (
          <TorqueLogo markSize={28} wordmarkSize={20} glow="soft" />
        )}

        {/* Auth */}
        {available && (
          user ? (
            <button onClick={signOut} className="tap-target" style={{ fontSize: "12px", fontWeight: 500, padding: "5px 10px", borderRadius: "20px", border: "1px solid #252b34", color: "#6b7280", backgroundColor: "transparent", cursor: "pointer" }}>
              {user.email?.split("@")[0]} · out
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="tap-target" style={{ fontSize: "12px", fontWeight: 600, padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(59,130,246,0.5)", color: "#3b82f6", backgroundColor: "rgba(59,130,246,0.08)", cursor: "pointer" }}>
              Sign In
            </button>
          )
        )}
      </header>

      {/* ── Main content ── */}
      <main style={{ flex: 1, paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px) + 12px)" }}>

        {/* DIAGNOSE TAB */}
        {activeTab === "diagnose" && (
          <div className="view-enter" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 16px" }}>

            {/* Hero */}
            <div style={{ textAlign: "center", padding: "32px 0 28px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
                <TorqueLogo markSize={48} showWordmark={false} glow="strong" />
              </div>
              <div style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "28px", fontWeight: 700, letterSpacing: "0.15em", color: "white", lineHeight: 1 }}>
                TORQUE
              </div>
              <div style={{ fontSize: "13px", letterSpacing: "0.05em", color: "#6b7280", marginTop: "6px" }}>
                Your car. Decoded.
              </div>
            </div>

            {/* Form card */}
            <form
              id="diagnose-form"
              onSubmit={handleDiagnose}
              style={{ width: "100%", maxWidth: "480px", backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {/* Year */}
              <div ref={yearRef}>
                <label style={labelStyle}>Year</label>
                <select
                  value={year}
                  onChange={(e) => { setYear(e.target.value); if (showErrors) setShowErrors(false); }}
                  style={{ ...fieldStyle, color: year ? "#f1f5f9" : "#374151", borderColor: showErrors && !year ? "#ef4444" : "#1e2329" }}
                >
                  <option value="">Select year</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                {showErrors && !year && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>Please enter your car&apos;s year.</p>}
              </div>

              {/* Make */}
              <div ref={makeRef}>
                <label style={labelStyle}>Make</label>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => { setMake(e.target.value); if (showErrors) setShowErrors(false); }}
                  placeholder="Toyota"
                  autoComplete="off"
                  style={{ ...fieldStyle, borderColor: showErrors && !make ? "#ef4444" : "#1e2329" }}
                />
                {showErrors && !make && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>Please enter your car&apos;s make.</p>}
              </div>

              {/* Model */}
              <div ref={modelRef}>
                <label style={labelStyle}>Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => { setModel(e.target.value); if (showErrors) setShowErrors(false); }}
                  placeholder="Camry"
                  autoComplete="off"
                  style={{ ...fieldStyle, borderColor: showErrors && !model ? "#ef4444" : "#1e2329" }}
                />
                {showErrors && !model && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>Please enter your car&apos;s model.</p>}
              </div>

              {/* Section break */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "2px 0" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#1e2329" }} />
                <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "#374151" }}>WHAT&apos;S WRONG</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#1e2329" }} />
              </div>

              {/* Issue */}
              <div>
                <label style={labelStyle}>OBD Code or Symptom</label>
                <textarea
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="e.g. P0301 misfire on cylinder 1, rough idle at startup — or describe what you're hearing"
                  rows={3}
                  style={{ display: "block", width: "100%", minHeight: "100px", padding: "12px 14px", fontSize: "16px", backgroundColor: "#0d0f12", border: "1px solid #1e2329", borderRadius: "10px", color: "#f1f5f9", resize: "none", lineHeight: 1.5 }}
                />
              </div>

              {/* Modified Car toggle */}
              <div style={{ borderTop: "1px solid #1e2329", paddingTop: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: modMode ? "12px" : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "14px" }}>🔧</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9", lineHeight: 1.2 }}>Modified / Tuned</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.2 }}>Factor in mods and tune</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModMode(!modMode)}
                    className="tap-target"
                    style={{ width: "44px", height: "26px", borderRadius: "13px", backgroundColor: modMode ? "#3b82f6" : "#252b34", border: "none", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background-color 200ms" }}
                    aria-label="Toggle modified car mode"
                  >
                    <div style={{ position: "absolute", top: "3px", left: modMode ? "21px" : "3px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white", transition: "left 200ms ease", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                  </button>
                </div>

                {modMode && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>List your mods</label>
                      <textarea
                        value={mods}
                        onChange={(e) => setMods(e.target.value)}
                        placeholder="e.g. catless downpipe, Cobb Accessport tune, cold air intake"
                        rows={2}
                        style={{ display: "block", width: "100%", padding: "10px 14px", fontSize: "16px", backgroundColor: "#0d0f12", border: "1px solid #1e2329", borderRadius: "10px", color: "#f1f5f9", resize: "none", lineHeight: 1.5 }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "#f1f5f9" }}>Running a tune?</span>
                      <button
                        type="button"
                        onClick={() => setHasTune(!hasTune)}
                        className="tap-target"
                        style={{ width: "44px", height: "26px", borderRadius: "13px", backgroundColor: hasTune ? "#3b82f6" : "#252b34", border: "none", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background-color 200ms" }}
                      >
                        <div style={{ position: "absolute", top: "3px", left: hasTune ? "21px" : "3px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white", transition: "left 200ms ease", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ZIP code */}
              <div style={{ borderTop: "1px solid #1e2329", paddingTop: "14px" }}>
                <label style={labelStyle}>
                  <MapPin size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                  Your Area <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#374151" }}>— for local pricing</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="ZIP code (optional)"
                  style={{ ...fieldStyle, width: "160px" }}
                />
              </div>

              {error && (
                <div style={{ padding: "10px 14px", backgroundColor: "#1a0a0a", border: "1px solid #3a1515", borderRadius: "8px", color: "#ef4444", fontSize: "13px" }}>
                  {error}
                </div>
              )}
            </form>

            <p style={{ marginTop: "14px", fontSize: "12px", color: "#374151", letterSpacing: "0.02em" }}>
              🔒 Your data is never stored
            </p>
          </div>
        )}

        {/* QUOTE TAB */}
        {activeTab === "quote" && (
          <div className="view-enter">
            <QuoteChecker
              key={quoteResetKey}
              onResultChange={setQuoteHasResult}
              onToast={toast}
            />
          </div>
        )}

        {/* GARAGE TAB */}
        {activeTab === "garage" && (
          <GarageView
            onSelectCar={handleSelectCar}
            onRequestSignIn={() => setShowAuthModal(true)}
          />
        )}
      </main>

      {/* Fixed bottom diagnose button — only on diagnose tab */}
      {activeTab === "diagnose" && (
        <div style={{ position: "fixed", bottom: "calc(60px + env(safe-area-inset-bottom, 0px))", left: 0, right: 0, padding: "10px 16px", backgroundColor: "rgba(13,15,18,0.95)", backdropFilter: "blur(8px)", borderTop: "1px solid #1e2329", zIndex: 35 }}>
          <button
            type="submit"
            form="diagnose-form"
            disabled={loading}
            className={loading ? "btn-shimmer" : "tap-target"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "54px", backgroundColor: loading ? undefined : "#3b82f6", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "12px", cursor: loading ? "default" : "pointer", opacity: allFilled || loading ? 1 : 0.45, letterSpacing: "0.02em" }}
          >
            {loading ? "Diagnosing…" : "Diagnose"}
          </button>
        </div>
      )}

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
