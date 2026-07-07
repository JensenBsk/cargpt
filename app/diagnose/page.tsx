"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import type { Diagnostic, ChatMessage } from "@/types/diagnostic";
import DiagnosticReport from "@/components/DiagnosticReport";
import QuoteChecker from "@/components/QuoteChecker";
import GarageView from "@/components/GarageView";
import BottomNav, { type AppTab } from "@/components/BottomNav";
import TorqueLogo from "@/components/TorqueLogo";
import VinInput from "@/components/VinInput";
import ErrorCard, { type ErrorType } from "@/components/ErrorCard";
import OnboardingCarousel from "@/components/OnboardingCarousel";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import ObdScanner, { type ObdResult } from "@/components/ObdScanner";
import HistorySheet from "@/components/HistorySheet";
import { useToast } from "@/contexts/ToastContext";
import { resizeImage } from "@/utils/resizeImage";
import { hapticSuccess } from "@/lib/native";
import { MapPin, Camera, Wrench, Lock, WifiOff, Bluetooth, Car, AlertTriangle } from "lucide-react";

const LS_KEY = "torque_diagnosis_history";

function getLoadingMessages(make: string, model: string, issue: string): string[] {
  const carName = make || "your car";
  const hasCode = /\bP[0-9]{4}\b/i.test(issue);
  const hasNoise = /knock|rattle|squeal|click|grind|whine|hiss/i.test(issue);
  const msgs: string[] = [];
  if (hasCode) msgs.push(`Decoding that OBD-II code on the ${carName}…`);
  if (hasNoise) msgs.push(`Analyzing that sound description…`);
  msgs.push(
    `Checking common issues for the ${carName}…`,
    "Cross-referencing with real repair records…",
    "Ranking causes by likelihood…",
    "Calculating parts and labor costs…",
    "Preparing your step-by-step guide…",
    "Almost done — wrapping up your diagnosis…"
  );
  return msgs;
}

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

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export default function Home() {
  const { user, available, signOut } = useAuth();
  const isSignedIn = !!user;
  const [showAuthModal, setShowAuthModal] = useState(false);
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
  const [quoteResetKey, setQuoteResetKey] = useState(0);
  const [quoteHasResult, setQuoteHasResult] = useState(false);
  const [dashboardImage, setDashboardImage] = useState<string | null>(null);
  const [engineBayImage, setEngineBayImage] = useState<string | null>(null);
  const [vinData, setVinData] = useState<{ year: string; make: string; model: string; engine?: string; fuelType?: string; drivetrain?: string } | null>(null);
  const isOnline = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [savedCars, setSavedCars] = useState<{ year: string; make: string; model: string }[]>([]);
  const [recallData, setRecallData] = useState<{ key: string; count: number; items: { campaignNumber: string; subject: string; component: string }[] } | null>(null);
  const [recallsOpen, setRecallsOpen] = useState(false);
  const recallCacheRef = useRef<Record<string, { count: number; items: { campaignNumber: string; subject: string; component: string }[] }>>({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showObdScanner, setShowObdScanner] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState("");
  const recognitionRef = useRef<{ stop(): void; abort(): void } | null>(null);

  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadingMsgsRef = useRef<string[]>([]);

  const yearRef = useRef<HTMLDivElement>(null);
  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 36 }, (_, i) => currentYear - i);
  const showDiagnosis = diagnosis !== null;
  const onDiagnoseWithResult = activeTab === "diagnose" && showDiagnosis;

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx(i => Math.min(i + 1, loadingMsgsRef.current.length - 1));
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    try {
      // One-time client-only read; localStorage emits no events to subscribe to.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem("torque_onboarded")) setShowOnboarding(true);
      const items: HistoryItem[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const seen = new Set<string>();
      const cars: { year: string; make: string; model: string }[] = [];
      for (const it of items) {
        const key = `${it.year}|${it.make.toLowerCase()}|${it.model.toLowerCase()}`;
        if (it.year && it.make && it.model && !seen.has(key)) {
          seen.add(key);
          cars.push({ year: it.year, make: it.make, model: it.model });
        }
        if (cars.length >= 3) break;
      }
       
      setSavedCars(cars);
    } catch { /* ignore */ }
  }, []);

  // Recall lookup (free NHTSA data) once the vehicle is fully identified.
  // State carries the car key it belongs to, so stale results simply don't
  // render while the user is switching cars — no synchronous clearing needed.
  const recallKey = year && make.trim() && model.trim()
    ? `${year}|${make.trim().toLowerCase()}|${model.trim().toLowerCase()}`
    : null;
  const recalls = recallData && recallData.key === recallKey ? recallData : null;

  useEffect(() => {
    if (!recallKey || !year) return;
    const t = setTimeout(() => {
      const cached = recallCacheRef.current[recallKey];
      if (cached) { setRecallData({ key: recallKey, ...cached }); return; }
      fetch(`/api/recalls?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make.trim())}&model=${encodeURIComponent(model.trim())}`)
        .then((r) => r.json())
        .then((d) => {
          const val = { count: d.count ?? 0, items: (d.recalls ?? []).slice(0, 3) };
          recallCacheRef.current[recallKey] = val;
          setRecallData({ key: recallKey, ...val });
        })
        .catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recallKey]);

  useEffect(() => {
    if (!isSignedIn || !available) return;
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
  }, [user?.id, isSignedIn]);

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
    loadingMsgsRef.current = getLoadingMessages(make, model, issue);
    setLoadingMsgIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setDiagnosis(null);
    setDiagnosisId(null);
    setChatHistory([]);

    try {
      const diagBody = JSON.stringify({
        year, make, model, issue,
        mods: modMode ? mods : "",
        hasTune: modMode ? hasTune : false,
        zip: zip.length === 5 ? zip : "",
        dashboardImage: dashboardImage ?? undefined,
        engineBayImage: engineBayImage ?? undefined,
        audioTranscript: audioTranscript || undefined,
        vinData: vinData ?? undefined,
      });

      const doFetch = () => fetch("/api/diagnose", { method: "POST", headers: { "Content-Type": "application/json" }, body: diagBody });

      let res = await doFetch();

      // Retry once on transient server errors (not rate-limit or payment errors)
      if (!res.ok && res.status !== 429 && res.status !== 402) {
        await new Promise(r => setTimeout(r, 1200));
        res = await doFetch();
      }

      if (!res.ok) {
        if (res.status === 429) { setErrorType("rate_limit"); return; }
        if (res.status === 402) { setErrorType("free_limit"); return; }
        console.error("Diagnosis failed after retry:", { year, make, model, issue });
        setErrorType("diagnosis");
        return;
      }

      const data = await res.json();
      if (data.error) {
        console.error("Diagnosis API returned error:", data.error, { year, make, model, issue });
        setErrorType("diagnosis");
        return;
      }

      const diag: Diagnostic = data.diagnosis;
      setDiagnosis(diag);
      hapticSuccess();
      setChatHistory([
        { role: "user", content: `Vehicle: ${year} ${make} ${model}${modMode && mods ? `\nMods: ${mods}${hasTune ? " (tuned)" : ""}` : ""}\n\nIssue: ${issue}` },
        { role: "assistant", content: JSON.stringify(diag) },
      ]);

      saveToLS({ year, make, model, issue, diagnosis: diag, verdict: diag.driveSafety.verdict });

      if (available && isSignedIn) {
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
  }

  function handleVinDecode(data: { year: string; make: string; model: string; engine?: string; fuelType?: string; drivetrain?: string }) {
    setYear(data.year);
    setMake(data.make);
    setModel(data.model);
    setVinData(data);
    setShowErrors(false);
  }

  async function handleObdResult(result: ObdResult) {
    setShowObdScanner(false);

    // Build an issue description from everything the scanner read
    const parts: string[] = [];
    if (result.codes.length > 0) {
      parts.push(
        "OBD2 scan found these codes:\n" +
          result.codes.map((c) => `${c.code} — ${c.description}`).join("\n")
      );
    }
    if (result.freezeFrame?.rpm !== undefined || result.freezeFrame?.dtc) {
      const ff = result.freezeFrame;
      const bits = [
        ff.rpm !== undefined ? `${Math.round(ff.rpm)} RPM` : null,
        ff.coolantTempC !== undefined ? `coolant ${Math.round((ff.coolantTempC * 9) / 5 + 32)}°F` : null,
        ff.speedKmh !== undefined ? `${Math.round(ff.speedKmh * 0.621)} mph` : null,
        ff.engineLoadPct !== undefined ? `${Math.round(ff.engineLoadPct)}% load` : null,
      ].filter(Boolean);
      if (bits.length) parts.push(`Freeze frame when the fault hit: ${bits.join(", ")}.`);
    }
    const ld = result.liveData;
    const sensorBits = [
      ld.coolantTempC !== undefined ? `coolant ${Math.round((ld.coolantTempC * 9) / 5 + 32)}°F` : null,
      ld.shortFuelTrimPct !== undefined ? `short fuel trim ${ld.shortFuelTrimPct > 0 ? "+" : ""}${ld.shortFuelTrimPct}%` : null,
      ld.longFuelTrimPct !== undefined ? `long fuel trim ${ld.longFuelTrimPct > 0 ? "+" : ""}${ld.longFuelTrimPct}%` : null,
      ld.mafGs !== undefined ? `MAF ${ld.mafGs} g/s at idle` : null,
    ].filter(Boolean);
    if (sensorBits.length) parts.push(`Live sensor readings: ${sensorBits.join(", ")}.`);

    if (parts.length) {
      setIssue((prev) => (prev.trim() ? prev.trimEnd() + "\n\n" : "") + parts.join("\n\n"));
    }

    // Auto-fill the vehicle from the VIN the car reported
    if (result.vin && (!year || !make || !model)) {
      try {
        const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${result.vin}?format=json`);
        const data = await res.json();
        const get = (v: string) => data.Results?.find((r: { Variable: string; Value: string | null }) => r.Variable === v)?.Value ?? "";
        const vinYear = get("Model Year");
        const vinMake = get("Make");
        const vinModel = get("Model");
        if (vinYear && vinMake && vinModel) {
          handleVinDecode({
            year: vinYear,
            make: vinMake.charAt(0) + vinMake.slice(1).toLowerCase(),
            model: vinModel,
            engine: get("Displacement (L)") ? `${get("Displacement (L)")}L ${get("Engine Configuration")}` : undefined,
            fuelType: get("Fuel Type - Primary") || undefined,
            drivetrain: get("Drive Type") || undefined,
          });
          toast("Vehicle filled in from your car's VIN");
        }
      } catch {
        /* VIN decode is best-effort */
      }
    }
    hapticSuccess();
    if (result.codes.length) toast(`${result.codes.length} code${result.codes.length > 1 ? "s" : ""} added to your diagnosis`);
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
      onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null;
      start(): void; stop(): void; abort(): void;
    };
    type WindowWithSR = Window & { SpeechRecognition?: new () => SpeechRecognitionType; webkitSpeechRecognition?: new () => SpeechRecognitionType };
    const SR = (window as WindowWithSR).SpeechRecognition || (window as WindowWithSR).webkitSpeechRecognition;
    if (!SR) { toast("Voice input requires Chrome or Safari"); return; }
    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (e) => {
      for (let i = 0; i < (e.results as ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>).length; i++) {
        const r = (e.results as ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>)[i];
        if (r.isFinal) {
          const text = r[0].transcript.trim();
          setIssue(prev => prev ? prev.trimEnd() + " " + text : text);
          setAudioTranscript(t => t + " " + text);
        }
      }
    };
    recog.onerror = (e) => { if (e.error !== "no-speech") stopRecording(); };
    recog.onend = () => {
      // restart automatically while still in recording state
      if (recognitionRef.current) { try { recog.start(); } catch { stopRecording(); } }
    };
    recog.start();
    recognitionRef.current = recog;
    setIsRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
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
    backgroundColor: "#0a0d14",
    border: "1px solid #1e2433",
    borderRadius: "10px",
    color: "#f8fafc",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "#8b95a8",
    letterSpacing: 0,
    textTransform: "none" as const,
    marginBottom: "8px",
  };

  // Canonical CTA blue — matches --accent so this button never drifts navy
  const buttonBg = errorType ? "#f59e0b" : "#4a9eff";
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setShowHistory(true)}
            className="tap-target"
            aria-label="Diagnosis history"
            style={{ fontSize: "12px", fontWeight: 500, padding: "5px 10px", borderRadius: "20px", border: "1px solid #1c2a3e", color: "#7d8fa8", backgroundColor: "transparent", cursor: "pointer" }}
          >
            History
          </button>
        {isSignedIn ? (
            <button onClick={() => signOut()} className="tap-target" style={{ fontSize: "12px", fontWeight: 500, padding: "5px 10px", borderRadius: "20px", border: "1px solid #1c2a3e", color: "#7d8fa8", backgroundColor: "transparent", cursor: "pointer" }}>
              Sign out
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="tap-target" style={{ fontSize: "12px", fontWeight: 600, padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(74,158,255,0.35)", color: "#4a9eff", backgroundColor: "rgba(74,158,255,0.1)", cursor: "pointer" }}>
              Sign In
            </button>
          )
        }
        </div>
      </header>

      <main id="main-content" style={{
        flex: 1,
        overflowX: "hidden",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        paddingBottom: onDiagnoseWithResult ? 0 : "calc(154px + env(safe-area-inset-bottom, 0px))",
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

              {/* Hero — compact so the form is the first thing on screen */}
              {!loading && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 4px 16px", width: "100%", maxWidth: "480px", boxSizing: "border-box" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/carlos/carlos-hero.webp"
                    alt="Carlos"
                    style={{ height: "56px", width: "auto", display: "block", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))" }}
                  />
                  <div>
                    <h1 style={{ color: "white", fontSize: "20px", fontWeight: 700, margin: "0 0 2px" }}>
                      What&apos;s going on?
                    </h1>
                    <p style={{ color: "#8b95a8", fontSize: "13px", margin: 0 }}>
                      Tell Carlos — he&apos;ll figure it out.
                    </p>
                  </div>
                </div>
              )}

              {/* Carlos thinking — loading state with result skeleton */}
              {loading && (
                <div aria-live="polite" style={{ width: "100%", maxWidth: "480px", boxSizing: "border-box", margin: "0 0 16px" }}>
                  <div style={{ textAlign: "center", padding: "28px 24px", borderRadius: "16px", background: "#13161b", border: "1px solid #1e2329", marginBottom: "12px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/carlos/carlos-thinking.webp"
                      alt=""
                      className="carlos-pulse"
                      style={{ height: "100px", width: "auto", margin: "0 auto 16px", display: "block", filter: "drop-shadow(0 4px 16px rgba(59,130,246,0.3)) drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}
                    />
                    <p style={{ color: "white", fontSize: "15px", fontWeight: 600, margin: "0 0 4px", minHeight: "22px" }}>
                      {loadingMsgsRef.current[loadingMsgIdx] || `Carlos is on it…`}
                    </p>
                    <p style={{ color: "#7d8fa8", fontSize: "13px", margin: 0 }}>Carlos checks real repair data — usually 20–40 seconds</p>
                  </div>
                  {/* Skeleton of the incoming report so users see the shape of what's coming */}
                  <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div className="skeleton" style={{ height: "64px" }} />
                    <div className="skeleton" style={{ height: "96px" }} />
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className="skeleton" style={{ height: "56px", flex: 1 }} />
                      <div className="skeleton" style={{ height: "56px", flex: 1 }} />
                      <div className="skeleton" style={{ height: "56px", flex: 1 }} />
                    </div>
                    <div className="skeleton" style={{ height: "80px" }} />
                  </div>
                </div>
              )}

              <form
                id="diagnose-form"
                onSubmit={handleDiagnose}
                style={{ width: "100%", maxWidth: "480px", boxSizing: "border-box", display: loading ? "none" : "flex", flexDirection: "column", gap: "20px" }}
              >
                {/* Your cars — one-tap refill from history */}
                {savedCars.length > 0 && !(year && make && model) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const, margin: "-6px 0 -8px" }}>
                    <span style={{ fontSize: "12px", color: "#4a5c72" }}>Your cars:</span>
                    {savedCars.map((c) => (
                      <button
                        key={`${c.year}${c.make}${c.model}`}
                        type="button"
                        onClick={() => { setYear(c.year); setMake(c.make); setModel(c.model); setShowErrors(false); }}
                        className="tap-target"
                        style={{ fontSize: "12px", fontWeight: 600, padding: "6px 12px", borderRadius: "20px", border: "1px solid rgba(74,158,255,0.3)", color: "#4a9eff", backgroundColor: "rgba(74,158,255,0.07)", cursor: "pointer" }}
                      >
                        {c.year} {c.make} {c.model}
                      </button>
                    ))}
                  </div>
                )}

                {/* Vehicle card */}
                <div style={{ background: "#13161f", border: "1px solid #1e2433", borderRadius: "16px", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <Car size={17} color="#4a9eff" aria-hidden="true" />
                    <span style={{ color: "#f8fafc", fontSize: "15px", fontWeight: 600 }}>What car are we working on?</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div ref={yearRef}>
                      <label htmlFor="vehicle-year" className="sr-only">Model year</label>
                      <select
                        id="vehicle-year"
                        value={year}
                        onChange={(e) => { setYear(e.target.value); if (showErrors) setShowErrors(false); }}
                        aria-invalid={showErrors && !year}
                        aria-describedby={showErrors && !year ? "vehicle-error" : undefined}
                        style={{ ...fieldStyle, padding: "0 14px", color: year ? "#f8fafc" : "#4a5c72", borderColor: showErrors && !year ? "#ef4444" : "#1e2433" }}
                      >
                        <option value="">Year</option>
                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div ref={makeRef}>
                      <label htmlFor="vehicle-make" className="sr-only">Vehicle make</label>
                      <input
                        id="vehicle-make"
                        type="text"
                        value={make}
                        onChange={(e) => { const v = e.target.value; setMake(v ? v.charAt(0).toUpperCase() + v.slice(1) : v); if (showErrors) setShowErrors(false); }}
                        placeholder="Make (e.g. Ford)"
                        autoComplete="off"
                        autoCapitalize="words"
                        aria-invalid={showErrors && !make}
                        aria-describedby={showErrors && !make ? "vehicle-error" : undefined}
                        style={{ ...fieldStyle, borderColor: showErrors && !make ? "#ef4444" : "#1e2433" }}
                      />
                    </div>
                    <div ref={modelRef}>
                      <label htmlFor="vehicle-model" className="sr-only">Vehicle model</label>
                      <input
                        id="vehicle-model"
                        type="text"
                        value={model}
                        onChange={(e) => { setModel(e.target.value); if (showErrors) setShowErrors(false); }}
                        placeholder="Model (e.g. F-150)"
                        autoComplete="off"
                        aria-invalid={showErrors && !model}
                        aria-describedby={showErrors && !model ? "vehicle-error" : undefined}
                        style={{ ...fieldStyle, borderColor: showErrors && !model ? "#ef4444" : "#1e2433" }}
                      />
                    </div>
                  </div>
                  {showErrors && (!year || !make || !model) && (
                    <p id="vehicle-error" role="alert" style={{ margin: "8px 0 0", fontSize: "12px", color: "#ef4444" }}>
                      Enter your vehicle year, make, and model
                    </p>
                  )}
                  <div style={{ marginTop: "12px" }}>
                    <VinInput onDecode={handleVinDecode} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowObdScanner(true)}
                    className="tap-target"
                    style={{ marginTop: "10px", width: "100%", height: "46px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "rgba(74,158,255,0.06)", border: "1px dashed rgba(74,158,255,0.35)", borderRadius: "10px", color: "#4a9eff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                  >
                    <Bluetooth size={15} aria-hidden="true" />
                    Connect OBD2 Scanner
                  </button>

                  {/* Open recalls (NHTSA) for the identified vehicle */}
                  {recalls && recalls.count > 0 && (
                    <div style={{ marginTop: "12px", backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", overflow: "hidden" }}>
                      <button
                        type="button"
                        onClick={() => setRecallsOpen((v) => !v)}
                        className="tap-target"
                        aria-expanded={recallsOpen}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "11px 14px", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#f59e0b" }}>
                          <AlertTriangle size={14} aria-hidden="true" />
                          {recalls.count} open recall{recalls.count > 1 ? "s" : ""} on this car
                        </span>
                        <span style={{ fontSize: "12px", color: "#8a6d1f" }}>{recallsOpen ? "Hide" : "View"}</span>
                      </button>
                      {recallsOpen && (
                        <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          {recalls.items.map((r) => (
                            <div key={r.campaignNumber} style={{ fontSize: "12px", color: "#8b95a8", lineHeight: 1.5 }}>
                              <span style={{ color: "#dce8f5", fontWeight: 600 }}>{r.component ? r.component.split(":").pop() : "Recall"}:</span> {r.subject}
                            </div>
                          ))}
                          <div style={{ fontSize: "11px", color: "#4a5c72" }}>
                            Recall repairs are free at any dealer. Source: NHTSA{recalls.count > 3 ? ` — ${recalls.count - 3} more on nhtsa.gov` : ""}.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Issue card */}
                <div style={{ background: "#13161f", border: "1px solid #1e2433", borderRadius: "16px", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/carlos/carlos-thinking.webp" alt="" style={{ width: "28px", height: "28px", objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(59,130,246,0.2))" }} />
                    <span style={{ color: "#f8fafc", fontSize: "15px", fontWeight: 600 }}>What&apos;s going on with it?</span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <label htmlFor="issue-description" className="sr-only">Describe the problem with your car</label>
                    <textarea
                      id="issue-description"
                      value={issue}
                      onChange={(e) => setIssue(e.target.value)}
                      placeholder="P0301 misfire on cyl 1, rough idle at startup, knocking under load — describe what you see or hear"
                      rows={4}
                      style={{ display: "block", width: "100%", maxWidth: "100%", boxSizing: "border-box", minHeight: "130px", padding: "14px 48px 14px 16px", fontSize: "16px", backgroundColor: "#0a0d14", border: `1px solid ${isRecording ? "rgba(239,68,68,0.5)" : "#1e2433"}`, borderRadius: "12px", color: "#f8fafc", resize: "none", lineHeight: 1.6, fontFamily: "var(--font-ibm), sans-serif", transition: "border-color 200ms" }}
                    />
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      style={{ position: "absolute", bottom: "10px", right: "10px", width: "32px", height: "32px", borderRadius: "8px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: isRecording ? "rgba(239,68,68,0.15)" : "rgba(74,158,255,0.08)", transition: "background-color 200ms" }}
                      aria-label={isRecording ? "Stop recording" : "Start voice input"}
                    >
                      {isRecording ? (
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444" }} className="badge-pulse-stop" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isRecording ? "#ef4444" : "#4a5c72"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="19" x2="12" y2="23"/>
                          <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                      )}
                    </button>
                  </div>
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
                        role="switch"
                        aria-checked={modMode}
                        aria-label="Modified or tuned car"
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
                            role="switch"
                            aria-checked={hasTune}
                            aria-label="Running a tune"
                          >
                            <div style={{ position: "absolute", top: "2px", left: hasTune ? "20px" : "2px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white", transition: "left 200ms ease", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ZIP */}
                  <div style={{ borderTop: "1px solid #1c2a3e", paddingTop: "14px" }}>
                    <label htmlFor="area-zip" style={labelStyle}>
                      <MapPin size={9} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} aria-hidden="true" />
                      Area ZIP <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#5d7290" }}>— for local pricing</span>
                    </label>
                    <input
                      id="area-zip"
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

              {!loading && (
                <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Lock size={11} color="#4a5c72" />
                  <span style={{ fontSize: "12px", color: "#4a5c72" }}>
                    Free to use — your data is never sold.
                  </span>
                </div>
              )}
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
              color: "white", fontWeight: 700, fontSize: "15px", letterSpacing: "0.04em",
              border: "none", borderRadius: "12px",
              cursor: loading ? "default" : "pointer",
              boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
              transition: "background 200ms ease",
            }}
          >
            {buttonText}
          </button>
        </div>
      )}

      {/* Announce the finished diagnosis to screen readers */}
      <div aria-live="assertive" className="sr-only">
        {showDiagnosis ? "Your diagnosis is ready." : ""}
      </div>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      {showOnboarding && <OnboardingCarousel onDone={finishOnboarding} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showObdScanner && <ObdScanner onClose={() => setShowObdScanner(false)} onUseInDiagnosis={handleObdResult} />}
      {showHistory && (
        <HistorySheet
          onClose={() => setShowHistory(false)}
          onOpenLocal={(item) => handleOpenHistoryDiagnosis({ year: item.year, make: item.make, model: item.model, issue: item.issue, diagnosis: item.diagnosis as Diagnostic })}
        />
      )}
    </>
  );
}
