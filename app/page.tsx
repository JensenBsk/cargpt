"use client";

import { useState, useRef, useEffect } from "react";
import type { Diagnostic, ChatMessage } from "@/types/diagnostic";
import DiagnosticReport from "@/components/DiagnosticReport";
import QuoteChecker from "@/components/QuoteChecker";
import AuthModal from "@/components/AuthModal";
import GarageView from "@/components/GarageView";
import BottomNav, { type AppTab } from "@/components/BottomNav";
import TorqueLogo from "@/components/TorqueLogo";
import VinInput from "@/components/VinInput";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { resizeImage } from "@/utils/resizeImage";
import { MapPin, Camera, Wrench } from "lucide-react";

const LS_KEY = "torque_diagnosis_history";

export interface HistoryItem {
  id: string;
  year: string;
  make: string;
  model: string;
  issue: string;
  diagnosis: Diagnostic;
  date: string;
  verdict: "STOP" | "CAUTION" | "OKAY";
}

function saveToLS(item: Omit<HistoryItem, "id" | "date">) {
  try {
    const existing: HistoryItem[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    const next: HistoryItem = { ...item, id: Date.now().toString(), date: new Date().toISOString() };
    const deduped = existing.filter(
      (h) => !(h.year === item.year && h.make === item.make && h.issue === item.issue)
    );
    localStorage.setItem(LS_KEY, JSON.stringify([next, ...deduped].slice(0, 10)));
  } catch { /* ignore */ }
}

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
  const [dashboardImage, setDashboardImage] = useState<string | null>(null);
  const [vinData, setVinData] = useState<{ year: string; make: string; model: string; engine?: string; fuelType?: string; drivetrain?: string } | null>(null);

  const yearRef = useRef<HTMLDivElement>(null);
  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 36 }, (_, i) => currentYear - i);
  const showDiagnosis = diagnosis !== null;
  const onDiagnoseWithResult = activeTab === "diagnose" && showDiagnosis;

  // When user signs in, migrate any locally-saved diagnoses to Supabase
  useEffect(() => {
    if (!user || !available) return;
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (!stored) return;
      const items: HistoryItem[] = JSON.parse(stored);
      items.forEach((item) => {
        fetch("/api/diagnoses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year: item.year, make: item.make, model: item.model, issue: item.issue, diagnosis: item.diagnosis }),
        }).catch(() => {});
      });
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
          dashboardImage: dashboardImage ?? undefined,
          vinData: vinData ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      const diag: Diagnostic = data.diagnosis;
      setDiagnosis(diag);
      setChatHistory([
        { role: "user", content: `Vehicle: ${year} ${make} ${model}${modMode && mods ? `\nMods: ${mods}${hasTune ? " (tuned)" : ""}` : ""}\n\nIssue: ${issue}` },
        { role: "assistant", content: JSON.stringify(diag) },
      ]);

      // Always save to localStorage so history works on all tabs
      saveToLS({ year, make, model, issue, diagnosis: diag, verdict: diag.driveSafety.verdict });

      if (available) {
        fetch("/api/diagnoses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year, make, model, issue, mods: modMode ? mods : "", hasTune: modMode ? hasTune : false, diagnosis: diag }),
        })
          .then((r) => r.json())
          .then((d) => { if (d.saved && d.id) setDiagnosisId(d.id); })
          .catch(() => {});
        toast("Saved to your garage ✓");
      } else {
        toast("Saved locally ✓");
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
    setDashboardImage(null);
  }

  function handleVinDecode(data: { year: string; make: string; model: string; engine?: string; fuelType?: string; drivetrain?: string }) {
    setYear(data.year);
    setMake(data.make);
    setModel(data.model);
    setVinData(data);
    setShowErrors(false);
  }

  async function handleDashboardPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    setDashboardImage(resized);
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

  function handleOpenHistoryDiagnosis(item: { year: string; make: string; model: string; issue: string; diagnosis: Diagnostic }) {
    setYear(item.year);
    setMake(item.make);
    setModel(item.model);
    setIssue(item.issue);
    setDiagnosis(item.diagnosis);
    setChatHistory([
      { role: "user", content: `Vehicle: ${item.year} ${item.make} ${item.model}\n\nIssue: ${item.issue}` },
      { role: "assistant", content: JSON.stringify(item.diagnosis) },
    ]);
    setDiagnosisId(null);
    setActiveTab("diagnose");
  }

  function handleBackFromQuote() {
    setQuoteHasResult(false);
    setQuoteResetKey((k) => k + 1);
  }

  const fieldStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    height: "48px",
    padding: "0 14px",
    fontSize: "16px",
    backgroundColor: "#060810",
    border: "1px solid #1e2329",
    borderRadius: "10px",
    color: "#dce8f5",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    fontWeight: 600,
    color: "#3a4d63",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "6px",
  };

  const allFilled = !!year && !!make && !!model && !!issue.trim();

  return (
    <>
      {/* Header — hidden when DiagnosticReport is active (it has its own sticky header) */}
      <header style={{
        display: onDiagnoseWithResult ? "none" : "flex",
        position: "sticky", top: 0, zIndex: 30,
        height: "52px", padding: "0 16px",
        alignItems: "center", justifyContent: "space-between",
        backgroundColor: "rgba(6,8,16,0.96)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #172134",
        width: "100%", boxSizing: "border-box",
      }}>
        {activeTab === "quote" && quoteHasResult ? (
          <button onClick={handleBackFromQuote} className="tap-target" style={{ fontSize: "14px", fontWeight: 500, color: "#7d8fa8", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "4px" }}>
            ← Back
          </button>
        ) : (
          <TorqueLogo markSize={28} wordmarkSize={20} glow="soft" />
        )}
        {available && (
          user ? (
            <button onClick={signOut} className="tap-target" style={{ fontSize: "12px", fontWeight: 500, padding: "5px 10px", borderRadius: "20px", border: "1px solid #252b34", color: "#4a5c72", backgroundColor: "transparent", cursor: "pointer" }}>
              {user.email?.split("@")[0]} · out
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="tap-target" style={{ fontSize: "12px", fontWeight: 600, padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(74,158,255,0.4)", color: "#4a9eff", backgroundColor: "rgba(74,158,255,0.1)", cursor: "pointer" }}>
              Sign In
            </button>
          )
        )}
      </header>

      <main style={{
        flex: 1,
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
        paddingBottom: onDiagnoseWithResult ? 0 : "calc(60px + env(safe-area-inset-bottom, 0px) + 12px)",
      }}>

        {/* ── DIAGNOSE TAB ── always mounted, hidden via display:none when inactive */}
        <div style={{ display: activeTab === "diagnose" ? "block" : "none" }}>
          {showDiagnosis ? (
            <DiagnosticReport
              diagnosis={diagnosis!}
              year={year}
              make={make}
              model={model}
              issue={issue}
              mods={modMode ? mods : ""}
              hasTune={modMode ? hasTune : false}
              zip={zip.length === 5 ? zip : ""}
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              onNewDiagnosis={handleNewDiagnosis}
              diagnosisId={diagnosisId}
              onToast={toast}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 16px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>

              {/* Hero */}
              <div style={{ textAlign: "center", padding: "36px 0 24px", position: "relative" }}>
                {/* Subtle radial glow behind logo */}
                <div style={{ position: "absolute", top: "30px", left: "50%", transform: "translateX(-50%)", width: "160px", height: "80px", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(74,158,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", position: "relative" }}>
                  <TorqueLogo markSize={52} showWordmark={false} glow="strong" />
                </div>
                <div style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "30px", fontWeight: 700, letterSpacing: "0.18em", color: "#dce8f5", lineHeight: 1 }}>
                  TORQUE
                </div>
                <div style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.12em", color: "#4a5c72", marginTop: "8px", textTransform: "uppercase" }}>
                  Your car. Decoded.
                </div>
              </div>

              {/* Form card */}
              <form
                id="diagnose-form"
                onSubmit={handleDiagnose}
                style={{ width: "100%", maxWidth: "480px", boxSizing: "border-box", backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}
              >
                {/* Year */}
                <div ref={yearRef}>
                  <label style={labelStyle}>Year</label>
                  <select
                    value={year}
                    onChange={(e) => { setYear(e.target.value); if (showErrors) setShowErrors(false); }}
                    style={{ ...fieldStyle, color: year ? "#dce8f5" : "#2a3a52", borderColor: showErrors && !year ? "#ef4444" : "#172134" }}
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
                    style={{ ...fieldStyle, borderColor: showErrors && !make ? "#ef4444" : "#172134" }}
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
                    style={{ ...fieldStyle, borderColor: showErrors && !model ? "#ef4444" : "#172134" }}
                  />
                  {showErrors && !model && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>Please enter your car&apos;s model.</p>}
                </div>

                {/* VIN lookup */}
                <VinInput onDecode={handleVinDecode} />

                {/* Section break */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "2px 0" }}>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "#172134" }} />
                  <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "#2a3a52" }}>WHAT&apos;S WRONG</span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "#172134" }} />
                </div>

                {/* Issue */}
                <div>
                  <label style={labelStyle}>OBD Code or Symptom</label>
                  <textarea
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="e.g. P0301 misfire on cylinder 1, rough idle at startup — or describe what you're hearing"
                    rows={3}
                    style={{ display: "block", width: "100%", boxSizing: "border-box", minHeight: "100px", padding: "12px 14px", fontSize: "16px", backgroundColor: "#060810", border: "1px solid #1e2329", borderRadius: "10px", color: "#dce8f5", resize: "none", lineHeight: 1.5 }}
                  />
                </div>

                {/* Dashboard warning lights photo */}
                <div>
                  <label style={labelStyle}>Dashboard Warning Lights <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#2a3a52" }}>— photo (optional)</span></label>
                  {dashboardImage ? (
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <img src={dashboardImage} alt="Dashboard" style={{ height: "80px", borderRadius: "8px", border: "1px solid #1e2329", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => setDashboardImage(null)}
                        style={{ position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#1c2a3e", border: "1px solid #1e2329", color: "#7d8fa8", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", height: "44px", padding: "0 14px", boxSizing: "border-box", backgroundColor: "#060810", border: "1px dashed #1c2a3e", borderRadius: "10px", cursor: "pointer", fontSize: "13px", color: "#4a5c72" }}>
                      <Camera size={15} color="#4a5c72" />
                      <span>Add photo</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleDashboardPhoto} style={{ display: "none" }} />
                    </label>
                  )}
                </div>

                {/* Modified / Tuned toggle */}
                <div style={{ borderTop: "1px solid #1e2329", paddingTop: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: modMode ? "12px" : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Wrench size={15} color="#4a9eff" />
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#dce8f5", lineHeight: 1.2 }}>Modified / Tuned</div>
                        <div style={{ fontSize: "12px", color: "#4a5c72", lineHeight: 1.2 }}>Factor in mods and tune</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModMode(!modMode)}
                      className="tap-target"
                      style={{ width: "44px", height: "26px", borderRadius: "13px", backgroundColor: modMode ? "#4a9eff" : "#1c2a3e", border: "none", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background-color 200ms" }}
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
                          style={{ display: "block", width: "100%", boxSizing: "border-box", padding: "10px 14px", fontSize: "16px", backgroundColor: "#060810", border: "1px solid #1e2329", borderRadius: "10px", color: "#dce8f5", resize: "none", lineHeight: 1.5 }}
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "14px", color: "#dce8f5" }}>Running a tune?</span>
                        <button
                          type="button"
                          onClick={() => setHasTune(!hasTune)}
                          className="tap-target"
                          style={{ width: "44px", height: "26px", borderRadius: "13px", backgroundColor: hasTune ? "#4a9eff" : "#1c2a3e", border: "none", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background-color 200ms" }}
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
                    Your Area <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#2a3a52" }}>— for local pricing</span>
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

              <p style={{ marginTop: "14px", fontSize: "12px", color: "#2a3a52", letterSpacing: "0.02em" }}>
                🔒 Your data is never stored
              </p>
            </div>
          )}
        </div>

        {/* ── QUOTE TAB ── always mounted */}
        <div style={{ display: activeTab === "quote" ? "block" : "none" }}>
          <QuoteChecker
            key={quoteResetKey}
            onResultChange={setQuoteHasResult}
            onToast={toast}
          />
        </div>

        {/* ── GARAGE TAB ── always mounted */}
        <div style={{ display: activeTab === "garage" ? "block" : "none" }}>
          <GarageView
            onSelectCar={handleSelectCar}
            onRequestSignIn={() => setShowAuthModal(true)}
            onOpenDiagnosis={handleOpenHistoryDiagnosis}
          />
        </div>

      </main>

      {/* Fixed diagnose button — only on diagnose tab without a result */}
      {activeTab === "diagnose" && !showDiagnosis && (
        <div style={{ position: "fixed", bottom: "calc(60px + env(safe-area-inset-bottom, 0px))", left: 0, right: 0, padding: "10px 16px", boxSizing: "border-box", backgroundColor: "rgba(6,8,16,0.96)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderTop: "1px solid #172134", zIndex: 35 }}>
          <button
            type="submit"
            form="diagnose-form"
            disabled={loading}
            className={loading ? "btn-shimmer" : "tap-target"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "54px", background: loading ? undefined : "linear-gradient(135deg, #4a9eff 0%, #2d6fd6 100%)", color: "white", fontWeight: 600, fontSize: "15px", letterSpacing: "0.04em", border: "none", borderRadius: "12px", cursor: loading ? "default" : "pointer", opacity: allFilled || loading ? 1 : 0.4, boxShadow: allFilled && !loading ? "0 4px 20px rgba(74,158,255,0.3)" : "none", transition: "box-shadow 200ms ease, opacity 200ms ease" }}
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
