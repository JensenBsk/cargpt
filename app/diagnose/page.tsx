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
import ErrorCard, { type ErrorType } from "@/components/ErrorCard";
import OnboardingCarousel from "@/components/OnboardingCarousel";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { resizeImage } from "@/utils/resizeImage";
import { MapPin, Camera, Wrench, Lock, WifiOff } from "lucide-react";

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
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnostic | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [quoteResetKey, setQuoteResetKey] = useState(0);
  const [quoteHasResult, setQuoteHasResult] = useState(false);
  const [dashboardImage, setDashboardImage] = useState<string | null>(null);
  const [engineBayImage, setEngineBayImage] = useState<string | null>(null);
  const [vinData, setVinData] = useState<{ year: string; make: string; model: string; engine?: string; fuelType?: string; drivetrain?: string } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioTranscript, setAudioTranscript] = useState("");
  const [audioDraft, setAudioDraft] = useState("");
  const [audioSaved, setAudioSaved] = useState(false);
  const recognitionRef = useRef<{ stop(): void; abort(): void } | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const yearRef = useRef<HTMLDivElement>(null);
  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 36 }, (_, i) => currentYear - i);
  const showDiagnosis = diagnosis !== null;
  const onDiagnoseWithResult = activeTab === "diagnose" && showDiagnosis;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem("torque_onboarded")) setShowOnboarding(true);
    } catch { /* ignore */ }
  }, []);

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
    setErrorType(null);
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
          engineBayImage: engineBayImage ?? undefined,
          audioTranscript: audioTranscript || undefined,
          vinData: vinData ?? undefined,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) { setErrorType("rate_limit"); return; }
        if (res.status === 402) { setErrorType("free_limit"); return; }
        setErrorType("diagnosis");
        return;
      }

      const data = await res.json();
      if (data.error) {
        setErrorType("diagnosis");
        return;
      }

      const diag: Diagnostic = data.diagnosis;
      setDiagnosis(diag);
      setChatHistory([
        { role: "user", content: `Vehicle: ${year} ${make} ${model}${modMode && mods ? `\nMods: ${mods}${hasTune ? " (tuned)" : ""}` : ""}\n\nIssue: ${issue}` },
        { role: "assistant", content: JSON.stringify(diag) },
      ]);

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
      setErrorType(!navigator.onLine ? "network" : "diagnosis");
    } finally {
      setLoading(false);
    }
  }

  function handleNewDiagnosis() {
    setDiagnosis(null);
    setDiagnosisId(null);
    setChatHistory([]);
    setIssue("");
    setErrorType(null);
    setDashboardImage(null);
    setEngineBayImage(null);
    setAudioTranscript("");
    setAudioDraft("");
    setAudioSaved(false);
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

  async function handleEnginePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    setEngineBayImage(resized);
  }

  function finishOnboarding() {
    try { localStorage.setItem("torque_onboarded", "1"); } catch { /* ignore */ }
    setShowOnboarding(false);
  }

  function startRecording() {
    type SpeechRecognitionType = {
      continuous: boolean; interimResults: boolean; maxAlternatives: number;
      onresult: ((e: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
      onerror: (() => void) | null; onend: (() => void) | null;
      start(): void; stop(): void; abort(): void;
    };
    type WindowWithSR = Window & { SpeechRecognition?: new () => SpeechRecognitionType; webkitSpeechRecognition?: new () => SpeechRecognitionType };
    const SR = (window as WindowWithSR).SpeechRecognition || (window as WindowWithSR).webkitSpeechRecognition;
    if (!SR) { toast("Voice recording requires Chrome or Safari"); return; }
    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.maxAlternatives = 1;
    let finalText = "";
    recog.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < (e.results as ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>).length; i++) {
        const r = (e.results as ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>)[i];
        if (r.isFinal) { finalText += r[0].transcript + " "; }
        else { interim = r[0].transcript; }
      }
      setAudioDraft(finalText + interim);
    };
    recog.onerror = () => stopRecording();
    recog.onend = () => stopRecording();
    recog.start();
    recognitionRef.current = recog;
    setIsRecording(true);
    setAudioDraft("");
    setAudioSaved(false);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(s => {
        if (s >= 29) { stopRecording(); return 30; }
        return s + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    setIsRecording(false);
  }

  function useRecording() {
    setAudioTranscript(audioDraft.trim());
    setAudioSaved(true);
  }

  function clearRecording() {
    setAudioTranscript("");
    setAudioDraft("");
    setAudioSaved(false);
    setIsRecording(false);
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
    maxWidth: "100%",
    height: "48px",
    padding: "0 14px",
    fontSize: "16px",
    backgroundColor: "#101822",
    border: "1px solid #172134",
    borderRadius: "10px",
    color: "#dce8f5",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-jetbrains), monospace",
    fontSize: "10px",
    fontWeight: 600,
    color: "#2d3f55",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    marginBottom: "8px",
  };

  const allFilled = !!year && !!make && !!model && !!issue.trim();
  const buttonBg = errorType ? "#f59e0b" : "linear-gradient(135deg, #4a9eff 0%, #2d6fd6 100%)";
  const capMake = make ? make.charAt(0).toUpperCase() + make.slice(1) : "";
  const buttonText = loading ? `Carlos is analyzing your ${capMake || "car"}…` : errorType ? "Try Again" : "Ask Carlos";

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          backgroundColor: "#1a0505", borderBottom: "1px solid #3a1515",
          padding: "8px 16px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}>
          <WifiOff size={13} color="#ef4444" />
          <span style={{ fontSize: "13px", color: "#fca5a5", fontWeight: 500 }}>
            No internet connection — reconnect to use Carlos
          </span>
        </div>
      )}

      {/* Header */}
      <header style={{
        display: onDiagnoseWithResult ? "none" : "flex",
        position: "sticky", top: !isOnline ? "33px" : 0, zIndex: 30,
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
            <button onClick={signOut} className="tap-target" style={{ fontSize: "12px", fontWeight: 500, padding: "5px 10px", borderRadius: "20px", border: "1px solid #1c2a3e", color: "#4a5c72", backgroundColor: "transparent", cursor: "pointer" }}>
              {user.email?.split("@")[0]} · out
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="tap-target" style={{ fontSize: "12px", fontWeight: 600, padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(74,158,255,0.35)", color: "#4a9eff", backgroundColor: "rgba(74,158,255,0.1)", cursor: "pointer" }}>
              Sign In
            </button>
          )
        )}
      </header>

      <main style={{
        flex: 1,
        overflowX: "hidden",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        paddingBottom: onDiagnoseWithResult ? 0 : "calc(60px + env(safe-area-inset-bottom, 0px) + 12px)",
      }}>

        {/* ── DIAGNOSE TAB ── */}
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
              hasAudio={!!audioTranscript}
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              onNewDiagnosis={handleNewDiagnosis}
              diagnosisId={diagnosisId}
              onToast={toast}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px 20px", width: "100%", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden" }}>

              {/* Hero */}
              <div style={{ textAlign: "center", padding: "36px 0 28px" }}>
                <h1 style={{ fontFamily: "var(--font-ibm), sans-serif", fontSize: "26px", fontWeight: 700, color: "#dce8f5", margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  What&apos;s wrong<br />with your car?
                </h1>
                <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", letterSpacing: "0.15em", color: "#2d3f55", margin: 0, textTransform: "uppercase" }}>
                  Tell Carlos — he&apos;ll figure it out.
                </p>
              </div>

              {/* Carlos thinking — loading state */}
              {loading && (
                <div style={{ textAlign: "center", padding: "32px 24px", borderRadius: "16px", background: "#13161b", border: "1px solid #1e2329", margin: "0 0 16px", width: "100%", maxWidth: "480px", boxSizing: "border-box" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/carlos/carlos-thinking.png"
                    alt="Carlos thinking"
                    className="carlos-think"
                    style={{ height: "100px", width: "auto", margin: "0 auto 16px", display: "block", filter: "drop-shadow(0 4px 16px rgba(59,130,246,0.3)) drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}
                  />
                  <p style={{ color: "white", fontSize: "15px", fontWeight: 600, margin: "0 0 4px" }}>Carlos is on it...</p>
                  <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Analyzing your {make || "car"} — usually takes 10 seconds</p>
                </div>
              )}

              <form
                id="diagnose-form"
                onSubmit={handleDiagnose}
                style={{ width: "100%", maxWidth: "480px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "20px" }}
              >
                {/* Vehicle row */}
                <div>
                  <label style={labelStyle}>Your Vehicle</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div ref={yearRef} style={{ flex: "0 0 88px", minWidth: 0 }}>
                      <select
                        value={year}
                        onChange={(e) => { setYear(e.target.value); if (showErrors) setShowErrors(false); }}
                        style={{ ...fieldStyle, padding: "0 8px", color: year ? "#dce8f5" : "#2d3f55", borderColor: showErrors && !year ? "#ef4444" : "#172134" }}
                      >
                        <option value="">Year</option>
                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div ref={makeRef} style={{ flex: 1, minWidth: 0 }}>
                      <input
                        type="text"
                        value={make}
                        onChange={(e) => { const v = e.target.value; setMake(v ? v.charAt(0).toUpperCase() + v.slice(1) : v); if (showErrors) setShowErrors(false); }}
                        placeholder="Make"
                        autoComplete="off"
                        autoCapitalize="words"
                        style={{ ...fieldStyle, borderColor: showErrors && !make ? "#ef4444" : "#172134" }}
                      />
                    </div>
                    <div ref={modelRef} style={{ flex: 1, minWidth: 0 }}>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => { setModel(e.target.value); if (showErrors) setShowErrors(false); }}
                        placeholder="Model"
                        autoComplete="off"
                        style={{ ...fieldStyle, borderColor: showErrors && !model ? "#ef4444" : "#172134" }}
                      />
                    </div>
                  </div>
                  {showErrors && (!year || !make || !model) && (
                    <p style={{ margin: "6px 0 0", fontFamily: "var(--font-jetbrains), monospace", fontSize: "11px", color: "#ef4444", letterSpacing: "0.02em" }}>
                      Enter your vehicle year, make, and model
                    </p>
                  )}
                </div>

                <VinInput onDecode={handleVinDecode} />

                {/* Issue */}
                <div>
                  <label style={labelStyle}>What&apos;s the issue?</label>
                  <textarea
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="P0301 misfire on cyl 1, rough idle at startup, knocking under load — describe what you see or hear"
                    rows={4}
                    style={{ display: "block", width: "100%", maxWidth: "100%", boxSizing: "border-box", minHeight: "130px", padding: "14px 16px", fontSize: "16px", backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "12px", color: "#dce8f5", resize: "none", lineHeight: 1.6, fontFamily: "var(--font-ibm), sans-serif" }}
                  />
                </div>

                {/* Secondary details card */}
                <div style={{ backgroundColor: "#0b1019", border: "1px solid #1c2a3e", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "16px", width: "100%", boxSizing: "border-box" }}>

                  {/* Dashboard photo */}
                  <div>
                    <label style={labelStyle}>Warning Lights Photo <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#2d3f55" }}>optional</span></label>
                    {dashboardImage ? (
                      <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={dashboardImage} alt="Dashboard" style={{ height: "80px", borderRadius: "8px", border: "1px solid #172134", objectFit: "cover", display: "block" }} />
                        <button type="button" onClick={() => setDashboardImage(null)} style={{ position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#162232", border: "1px solid #172134", color: "#7d8fa8", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>✕</button>
                      </div>
                    ) : (
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", height: "42px", padding: "0 14px", boxSizing: "border-box", backgroundColor: "#101822", border: "1px dashed #172134", borderRadius: "10px", cursor: "pointer", fontSize: "13px", color: "#4a5c72", width: "100%" }}>
                        <Camera size={14} color="#4a5c72" />
                        <span>Dashboard / warning lights</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleDashboardPhoto} style={{ display: "none" }} />
                      </label>
                    )}
                  </div>

                  {/* Engine bay photo */}
                  <div>
                    <label style={labelStyle}>Engine Bay Photo <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#2d3f55" }}>optional</span></label>
                    {engineBayImage ? (
                      <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={engineBayImage} alt="Engine bay" style={{ height: "80px", borderRadius: "8px", border: "1px solid #172134", objectFit: "cover", display: "block" }} />
                        <button type="button" onClick={() => setEngineBayImage(null)} style={{ position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#162232", border: "1px solid #172134", color: "#7d8fa8", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>✕</button>
                      </div>
                    ) : (
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", height: "42px", padding: "0 14px", boxSizing: "border-box", backgroundColor: "#101822", border: "1px dashed #172134", borderRadius: "10px", cursor: "pointer", fontSize: "13px", color: "#4a5c72", width: "100%" }}>
                        <Camera size={14} color="#4a5c72" />
                        <span>Engine bay photo</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleEnginePhoto} style={{ display: "none" }} />
                      </label>
                    )}
                  </div>

                  {/* Audio recording */}
                  <div style={{ borderTop: "1px solid #1c2a3e", paddingTop: "14px" }}>
                    <label style={labelStyle}>Record the sound <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#2d3f55" }}>optional</span></label>
                    <div style={{ fontSize: "11px", color: "#4a5c72", marginBottom: "8px" }}>Tap to record a knock, squeal, rattle or noise your car is making</div>
                    {audioSaved ? (
                      <div style={{ backgroundColor: "rgba(74,158,255,0.07)", border: "1px solid rgba(74,158,255,0.2)", borderRadius: "10px", padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#4a9eff", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>🎙️ Recording saved</span>
                          <button type="button" onClick={clearRecording} style={{ fontSize: "11px", color: "#4a5c72", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: 0 }}>Re-record</button>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#7d8fa8", lineHeight: 1.5, fontStyle: "italic" }}>&quot;{audioTranscript}&quot;</p>
                      </div>
                    ) : isRecording ? (
                      <div style={{ backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444", flexShrink: 0 }} className="badge-pulse-stop" />
                          <span style={{ fontSize: "13px", color: "#ef4444", fontWeight: 600 }}>Recording — {recordingSeconds}s / 30s</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "24px", marginBottom: "10px" }}>
                          {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="typing-dot" style={{ width: "3px", height: `${8 + (i % 7) * 2}px`, borderRadius: "2px", backgroundColor: "#ef4444", opacity: 0.7, margin: 0 }} />
                          ))}
                        </div>
                        {audioDraft && <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#7d8fa8", lineHeight: 1.4, fontStyle: "italic" }}>&quot;{audioDraft}&quot;</p>}
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button type="button" onClick={stopRecording} style={{ flex: 1, height: "38px", backgroundColor: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Stop</button>
                          {audioDraft.trim() && <button type="button" onClick={useRecording} style={{ flex: 1, height: "38px", backgroundColor: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.3)", borderRadius: "8px", color: "#4a9eff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Use this</button>}
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={startRecording} className="tap-target" style={{ display: "flex", alignItems: "center", gap: "8px", height: "42px", padding: "0 14px", boxSizing: "border-box", backgroundColor: "#101822", border: "1px dashed #172134", borderRadius: "10px", cursor: "pointer", fontSize: "13px", color: "#4a5c72", width: "100%" }}>
                        <span style={{ fontSize: "16px" }}>🎙️</span>
                        <span>Tap to record a sound</span>
                      </button>
                    )}
                  </div>

                  {/* Mods toggle */}
                  <div style={{ borderTop: "1px solid #1c2a3e", paddingTop: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: modMode ? "14px" : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "8px", backgroundColor: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Wrench size={13} color="#4a9eff" />
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#dce8f5", lineHeight: 1.3 }}>Modified / Tuned</div>
                          <div style={{ fontSize: "11px", color: "#4a5c72", lineHeight: 1.3 }}>Factor in mods and tune</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModMode(!modMode)}
                        className="tap-target"
                        style={{ width: "42px", height: "24px", borderRadius: "12px", backgroundColor: modMode ? "#4a9eff" : "#162232", border: "none", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background-color 200ms" }}
                        aria-label="Toggle modified car mode"
                      >
                        <div style={{ position: "absolute", top: "2px", left: modMode ? "20px" : "2px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white", transition: "left 200ms ease", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
                      </button>
                    </div>
                    {modMode && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                          <label style={labelStyle}>List your mods</label>
                          <textarea
                            value={mods}
                            onChange={(e) => setMods(e.target.value)}
                            placeholder="catless downpipe, Cobb Accessport tune, cold air intake"
                            rows={2}
                            style={{ display: "block", width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "10px 14px", fontSize: "15px", backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "10px", color: "#dce8f5", resize: "none", lineHeight: 1.5 }}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "13px", color: "#7d8fa8" }}>Running a tune?</span>
                          <button
                            type="button"
                            onClick={() => setHasTune(!hasTune)}
                            className="tap-target"
                            style={{ width: "42px", height: "24px", borderRadius: "12px", backgroundColor: hasTune ? "#4a9eff" : "#162232", border: "none", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background-color 200ms" }}
                          >
                            <div style={{ position: "absolute", top: "2px", left: hasTune ? "20px" : "2px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white", transition: "left 200ms ease", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ZIP */}
                  <div style={{ borderTop: "1px solid #1c2a3e", paddingTop: "14px" }}>
                    <label style={labelStyle}>
                      <MapPin size={9} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                      Area ZIP <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#2d3f55" }}>— for local pricing</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={zip}
                      onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      placeholder="ZIP code"
                      style={{ ...fieldStyle, width: "140px", maxWidth: "140px" }}
                    />
                  </div>
                </div>

                {errorType && (
                  <ErrorCard
                    type={errorType}
                    onRetry={() => { setErrorType(null); }}
                    onSecondary={() => setErrorType(null)}
                  />
                )}
              </form>

              <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Lock size={10} color="#2d3f55" />
                <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: "10px", color: "#2d3f55", letterSpacing: "0.08em" }}>
                  No subscription · No hidden fees · Your data is never sold
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── QUOTE TAB ── */}
        <div style={{ display: activeTab === "quote" ? "block" : "none" }}>
          <QuoteChecker
            key={quoteResetKey}
            onResultChange={setQuoteHasResult}
            onToast={toast}
          />
        </div>

        {/* ── GARAGE TAB ── */}
        <div style={{ display: activeTab === "garage" ? "block" : "none" }}>
          <GarageView
            onSelectCar={handleSelectCar}
            onRequestSignIn={() => setShowAuthModal(true)}
            onOpenDiagnosis={handleOpenHistoryDiagnosis}
          />
        </div>

      </main>

      {/* Fixed diagnose button */}
      {activeTab === "diagnose" && !showDiagnosis && (
        <div style={{ position: "fixed", bottom: "calc(60px + env(safe-area-inset-bottom, 0px))", left: 0, right: 0, padding: "10px 16px", boxSizing: "border-box", backgroundColor: "rgba(6,8,16,0.96)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderTop: "1px solid #172134", zIndex: 35 }}>
          <button
            type="submit"
            form="diagnose-form"
            disabled={loading}
            className={loading ? "btn-shimmer" : "tap-target"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", height: "54px",
              background: loading ? undefined : buttonBg,
              color: "white", fontWeight: 600, fontSize: "15px", letterSpacing: "0.04em",
              border: "none", borderRadius: "12px",
              cursor: loading ? "default" : "pointer",
              opacity: allFilled || loading || errorType ? 1 : 0.4,
              boxShadow: allFilled && !loading && !errorType ? "0 4px 20px rgba(74,158,255,0.3)" : "none",
              transition: "box-shadow 200ms ease, opacity 200ms ease, background 200ms ease",
            }}
          >
            {buttonText}
          </button>
        </div>
      )}

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showOnboarding && <OnboardingCarousel onDone={finishOnboarding} />}
    </>
  );
}
