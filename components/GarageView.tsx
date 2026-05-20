"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import VinInput from "@/components/VinInput";
import { AlertTriangle, Bell } from "lucide-react";
import type { Diagnostic } from "@/types/diagnostic";
import type { RepairEntry } from "@/types/repairs";
import { requestPushPermission } from "@/hooks/useOneSignal";

const LS_KEY = "torque_diagnosis_history";

interface HistoryItem {
  id: string;
  year: string;
  make: string;
  model: string;
  issue: string;
  diagnosis: Diagnostic;
  date: string;
  verdict: "STOP" | "CAUTION" | "OKAY";
}

interface Car {
  id: string;
  year: number;
  make: string;
  model: string;
  mods: string | null;
  has_tune: boolean;
  nickname: string | null;
  vin: string | null;
}

interface MaintenanceItem {
  service: string;
  status: "OVERDUE" | "DUE_SOON" | "OK";
  deltaLabel: string;
}

interface Props {
  onSelectCar: (car: { year: string; make: string; model: string; mods: string; hasTune: boolean }) => void;
  onRequestSignIn: () => void;
  onOpenDiagnosis: (item: { year: string; make: string; model: string; issue: string; diagnosis: Diagnostic }) => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 35 }, (_, i) => currentYear - i);

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  height: "44px",
  padding: "0 12px",
  fontSize: "16px",
  backgroundColor: "#101822",
  border: "1px solid #172134",
  borderRadius: "10px",
  color: "#dce8f5",
};

const STATUS_COLORS = {
  OVERDUE: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", dot: "#ef4444" },
  DUE_SOON: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", dot: "#f59e0b" },
  OK: { bg: "rgba(34,197,94,0.1)", text: "#22c55e", dot: "#22c55e" },
};

const VERDICT_DOT: Record<string, string> = {
  STOP: "#ef4444",
  CAUTION: "#f59e0b",
  OKAY: "#22c55e",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function GarageView({ onSelectCar, onRequestSignIn, onOpenDiagnosis }: Props) {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ year: "", make: "", model: "", vin: "", mods: "", has_tune: false, nickname: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recalls, setRecalls] = useState<Record<string, number>>({});
  const [expandedMaint, setExpandedMaint] = useState<string | null>(null);
  const [mileageInputs, setMileageInputs] = useState<Record<string, string>>({});
  const [maintLoading, setMaintLoading] = useState<Record<string, boolean>>({});
  const [maintResults, setMaintResults] = useState<Record<string, MaintenanceItem[]>>({});
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [repairs, setRepairs] = useState<RepairEntry[]>([]);
  const [showRepairSection, setShowRepairSection] = useState<string | null>(null);
  const [showAddRepair, setShowAddRepair] = useState<string | null>(null);
  const [repairForm, setRepairForm] = useState({ name: "", cost: "", who: "diy" as "diy" | "shop", shop: "" });
  const [reminderState, setReminderState] = useState<Record<string, "idle" | "loading" | "done" | "unavailable">>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setHistoryItems(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("torque_repairs");
      if (stored) setRepairs(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch("/api/garage")
      .then((r) => r.json())
      .then((d) => {
        const carList: Car[] = d.cars || [];
        setCars(carList);
        setLoading(false);
        carList.forEach((car) => {
          fetch(`/api/recalls?make=${encodeURIComponent(car.make)}&model=${encodeURIComponent(car.model)}&year=${car.year}`)
            .then((r) => r.json())
            .then((data) => {
              if (data.count > 0) setRecalls((prev) => ({ ...prev, [car.id]: data.count }));
            })
            .catch(() => {});
        });
      })
      .catch(() => setLoading(false));
  }, [user]);

  async function addCar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.year || !form.make || !form.model) return;
    setSaving(true);
    try {
      const res = await fetch("/api/garage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: form.year, make: form.make, model: form.model, vin: form.vin || null, mods: form.mods, hasTune: form.has_tune, nickname: form.nickname }),
      });
      const data = await res.json();
      if (data.car) {
        setCars((prev) => [data.car, ...prev]);
        setShowAddForm(false);
        setForm({ year: "", make: "", model: "", vin: "", mods: "", has_tune: false, nickname: "" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteCar(id: string) {
    setDeletingId(id);
    await fetch("/api/garage", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setCars((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  }

  async function generateMaintenance(car: Car) {
    const mileage = mileageInputs[car.id];
    if (!mileage) return;
    setMaintLoading((prev) => ({ ...prev, [car.id]: true }));
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: car.year, make: car.make, model: car.model, mileage: parseInt(mileage) }),
      });
      const data = await res.json();
      if (data.services) setMaintResults((prev) => ({ ...prev, [car.id]: data.services }));
    } finally {
      setMaintLoading((prev) => ({ ...prev, [car.id]: false }));
    }
  }

  const visibleHistory = historyItems.slice(0, user ? 10 : 5);

  if (!user) {
    return (
      <div className="view-enter" style={{ padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "#dce8f5", marginBottom: "8px" }}>Sign in to use My Garage</div>
        <div style={{ fontSize: "14px", color: "#7d8fa8", marginBottom: "28px", lineHeight: 1.6 }}>
          Save your cars and track repairs over time.<br />
          <span style={{ fontSize: "13px", color: "#4a5c72" }}>Your garage data is stored locally on your device until you sign in.</span>
        </div>
        <button onClick={onRequestSignIn} className="tap-target" style={{ height: "48px", padding: "0 28px", backgroundColor: "#4a9eff", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "10px", cursor: "pointer" }}>
          Sign In
        </button>

        {/* Show local history even when not signed in */}
        {visibleHistory.length > 0 && (
          <div style={{ marginTop: "40px", textAlign: "left" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#7d8fa8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Recent Diagnoses</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {visibleHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onOpenDiagnosis(item)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "10px", padding: "12px 14px", cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box" }}
                >
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: VERDICT_DOT[item.verdict] ?? "#7d8fa8", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#dce8f5" }}>{item.year} {item.make} {item.model}</div>
                    <div style={{ fontSize: "12px", color: "#7d8fa8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.issue}</div>
                  </div>
                  <div style={{ fontSize: "11px", color: "#4a5c72", flexShrink: 0 }}>{formatDate(item.date)}</div>
                </button>
              ))}
            </div>
            <p style={{ textAlign: "center", fontSize: "12px", color: "#4a5c72", marginTop: "12px" }}>
              <button onClick={onRequestSignIn} style={{ color: "#4a9eff", backgroundColor: "transparent", border: "none", cursor: "pointer", fontSize: "12px", padding: 0 }}>Sign in</button>
              {" to sync across devices"}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="view-enter" style={{ padding: "16px 16px 0", overflowX: "hidden", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#dce8f5" }}>My Cars</span>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="tap-target"
          style={{ fontSize: "13px", fontWeight: 600, padding: "6px 14px", borderRadius: "8px", border: "1px solid #3b82f6", color: "#4a9eff", backgroundColor: "transparent", cursor: "pointer" }}
        >
          {showAddForm ? "Cancel" : "+ Add Car"}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={addCar}
          style={{ backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "12px", padding: "16px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px", boxSizing: "border-box" }}
        >
          <select value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} required style={{ ...inputStyle, color: form.year ? "#dce8f5" : "#7d8fa8" }}>
            <option value="">Year</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <input type="text" value={form.make} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))} placeholder="Make" required style={inputStyle} />
            <input type="text" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="Model" required style={inputStyle} />
          </div>
          <VinInput
            onDecode={(vinData) => setForm((f) => ({
              ...f,
              vin: vinData.vin,
              year: vinData.year || f.year,
              make: vinData.make || f.make,
              model: vinData.model || f.model,
            }))}
          />
          <input type="text" value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))} placeholder="Nickname (optional)" style={inputStyle} />
          <input type="text" value={form.mods} onChange={(e) => setForm((f) => ({ ...f, mods: e.target.value }))} placeholder="Mods (optional)" style={inputStyle} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "#7d8fa8" }}>Running a tune?</span>
            <button type="button" onClick={() => setForm((f) => ({ ...f, has_tune: !f.has_tune }))} style={{ width: "40px", height: "22px", borderRadius: "11px", backgroundColor: form.has_tune ? "#4a9eff" : "#172134", border: "none", position: "relative", cursor: "pointer" }}>
              <div style={{ position: "absolute", top: "3px", left: form.has_tune ? "19px" : "3px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "white", transition: "left 150ms ease" }} />
            </button>
          </div>
          <button type="submit" disabled={saving || !form.year || !form.make || !form.model} className="tap-target" style={{ height: "44px", backgroundColor: "#4a9eff", color: "white", fontWeight: 600, fontSize: "14px", border: "none", borderRadius: "10px", cursor: "pointer", opacity: saving || !form.year || !form.make || !form.model ? 0.5 : 1 }}>
            {saving ? "Saving…" : "Save Car"}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#7d8fa8" }}>Loading…</div>
      ) : cars.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/carlos/carlos-waving.png"
            alt="Carlos waving"
            style={{ height: "140px", width: "auto", margin: "0 auto 20px", display: "block", filter: "drop-shadow(0 6px 20px rgba(59,130,246,0.25)) drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}
          />
          <h3 style={{ color: "white", fontSize: "18px", fontWeight: 600, margin: "0 0 8px" }}>No cars yet</h3>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 24px", lineHeight: 1.6 }}>
            Add your first car and Carlos will<br />remember it every time you&apos;re back.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {cars.map((car) => {
            const recallCount = recalls[car.id] ?? 0;
            const isMaintExpanded = expandedMaint === car.id;
            const services = maintResults[car.id];
            const isLoadingMaint = maintLoading[car.id];

            return (
              <div key={car.id} style={{ backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#dce8f5" }}>
                        {car.nickname || `${car.year} ${car.make} ${car.model}`}
                      </span>
                      {recallCount > 0 && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "20px", padding: "1px 7px", fontSize: "10px", fontWeight: 700, color: "#ef4444", flexShrink: 0 }}>
                          <AlertTriangle size={9} />
                          {recallCount} recall{recallCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {car.nickname && <div style={{ fontSize: "12px", color: "#7d8fa8", marginTop: "1px" }}>{car.year} {car.make} {car.model}</div>}
                    {car.mods && (
                      <div style={{ fontSize: "12px", color: "#4a5c72", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {car.has_tune && "⚡ "}{car.mods}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button onClick={() => onSelectCar({ year: String(car.year), make: car.make, model: car.model, mods: car.mods || "", hasTune: car.has_tune })} className="tap-target" style={{ fontSize: "13px", fontWeight: 600, padding: "7px 14px", borderRadius: "8px", border: "none", backgroundColor: "#4a9eff", color: "white", cursor: "pointer" }}>
                      Use
                    </button>
                    <button onClick={() => deleteCar(car.id)} disabled={deletingId === car.id} className="tap-target" style={{ fontSize: "13px", padding: "7px 10px", borderRadius: "8px", border: "1px solid #252b34", backgroundColor: "transparent", color: "#7d8fa8", cursor: "pointer", opacity: deletingId === car.id ? 0.4 : 1 }}>
                      ✕
                    </button>
                  </div>
                </div>

                {/* Repair history */}
                {(() => {
                  const carKey = `${car.year}_${car.make}_${car.model}`;
                  const carRepairs = repairs.filter(r => r.carKey === carKey).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  const isRepairOpen = showRepairSection === carKey;
                  return (
                    <div style={{ borderTop: "1px solid #1e2329" }}>
                      <button
                        onClick={() => setShowRepairSection(isRepairOpen ? null : carKey)}
                        style={{ width: "100%", padding: "10px 16px", fontSize: "12px", color: "#7d8fa8", backgroundColor: "transparent", border: "none", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between" }}
                      >
                        <span>Repair history ({carRepairs.length})</span>
                        <span style={{ color: "#4a9eff" }}>+ Add</span>
                      </button>
                      {isRepairOpen && (
                        <div style={{ padding: "0 16px 12px" }}>
                          {carRepairs.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
                              {carRepairs.map(rep => (
                                <div key={rep.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", backgroundColor: "#060810", borderRadius: "7px" }}>
                                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e", flexShrink: 0 }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "13px", color: "#dce8f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rep.repairName}</div>
                                    <div style={{ fontSize: "11px", color: "#4a5c72" }}>{rep.who === "shop" && rep.shopName ? rep.shopName : rep.who === "shop" ? "Shop" : "DIY"}{rep.cost ? ` · ${rep.cost}` : ""}</div>
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#4a5c72", flexShrink: 0 }}>{formatDate(rep.date)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {showAddRepair === carKey ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <input type="text" value={repairForm.name} onChange={e => setRepairForm(f => ({ ...f, name: e.target.value }))} placeholder="What was repaired?" style={{ ...inputStyle, height: "38px", fontSize: "14px" }} />
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                <input type="text" value={repairForm.cost} onChange={e => setRepairForm(f => ({ ...f, cost: e.target.value }))} placeholder="Cost (optional)" style={{ ...inputStyle, height: "38px", fontSize: "14px" }} />
                                <div style={{ display: "flex", gap: "4px" }}>
                                  {(["diy", "shop"] as const).map(w => (
                                    <button key={w} type="button" onClick={() => setRepairForm(f => ({ ...f, who: w }))} style={{ flex: 1, height: "38px", fontSize: "12px", fontWeight: 600, border: "none", borderRadius: "6px", cursor: "pointer", backgroundColor: repairForm.who === w ? "#4a9eff" : "#101822", color: repairForm.who === w ? "white" : "#7d8fa8", transition: "background-color 150ms" }}>
                                      {w.toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {repairForm.who === "shop" && <input type="text" value={repairForm.shop} onChange={e => setRepairForm(f => ({ ...f, shop: e.target.value }))} placeholder="Shop name (optional)" style={{ ...inputStyle, height: "38px", fontSize: "14px" }} />}
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!repairForm.name.trim()) return;
                                    const entry: RepairEntry = { id: Date.now().toString(), carKey, repairName: repairForm.name.trim(), date: new Date().toISOString(), cost: repairForm.cost || undefined, who: repairForm.who, shopName: repairForm.shop || undefined };
                                    const next = [entry, ...repairs];
                                    setRepairs(next);
                                    try { localStorage.setItem("torque_repairs", JSON.stringify(next)); } catch { /* ignore */ }
                                    setRepairForm({ name: "", cost: "", who: "diy", shop: "" });
                                    setShowAddRepair(null);
                                  }}
                                  disabled={!repairForm.name.trim()}
                                  style={{ flex: 1, height: "38px", backgroundColor: "#4a9eff", color: "white", fontWeight: 600, fontSize: "13px", border: "none", borderRadius: "8px", cursor: "pointer", opacity: repairForm.name.trim() ? 1 : 0.4 }}
                                >
                                  Save Repair
                                </button>
                                <button type="button" onClick={() => setShowAddRepair(null)} style={{ height: "38px", padding: "0 14px", backgroundColor: "transparent", border: "1px solid #172134", color: "#4a5c72", fontSize: "13px", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setShowAddRepair(carKey)} style={{ width: "100%", height: "34px", backgroundColor: "transparent", border: "1px dashed #172134", borderRadius: "8px", color: "#4a5c72", fontSize: "12px", cursor: "pointer" }}>
                              + Add repair manually
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Maintenance section */}
                <div style={{ borderTop: "1px solid #1e2329" }}>
                  {!isMaintExpanded ? (
                    <button onClick={() => setExpandedMaint(car.id)} style={{ width: "100%", padding: "10px 16px", fontSize: "12px", color: "#7d8fa8", backgroundColor: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                      Maintenance schedule →
                    </button>
                  ) : (
                    <div style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#7d8fa8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Maintenance Schedule</span>
                        <button onClick={() => setExpandedMaint(null)} style={{ fontSize: "11px", color: "#4a5c72", backgroundColor: "transparent", border: "none", cursor: "pointer" }}>↑ Close</button>
                      </div>
                      {!services ? (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={mileageInputs[car.id] || ""}
                            onChange={(e) => setMileageInputs((prev) => ({ ...prev, [car.id]: e.target.value.replace(/\D/g, "") }))}
                            placeholder="Current mileage"
                            style={{ flex: 1, height: "38px", padding: "0 10px", boxSizing: "border-box", fontSize: "15px", backgroundColor: "#101822", border: "1px solid #172134", borderRadius: "8px", color: "#dce8f5" }}
                          />
                          <button
                            onClick={() => generateMaintenance(car)}
                            disabled={!mileageInputs[car.id] || isLoadingMaint}
                            style={{ height: "38px", padding: "0 14px", fontSize: "13px", fontWeight: 600, backgroundColor: "#4a9eff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", opacity: !mileageInputs[car.id] || isLoadingMaint ? 0.5 : 1, whiteSpace: "nowrap" }}
                          >
                            {isLoadingMaint ? "…" : "Generate"}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {services.map((svc) => {
                            const colors = STATUS_COLORS[svc.status];
                            return (
                              <div key={svc.service} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", backgroundColor: "#101822", borderRadius: "8px", border: "1px solid #172134" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: colors.dot, flexShrink: 0 }} />
                                  <span style={{ fontSize: "13px", color: "#dce8f5" }}>{svc.service}</span>
                                </div>
                                <span style={{ fontSize: "11px", fontWeight: 600, backgroundColor: colors.bg, color: colors.text, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                                  {svc.deltaLabel}
                                </span>
                              </div>
                            );
                          })}
                          <button onClick={() => setMaintResults((prev) => { const n = { ...prev }; delete n[car.id]; return n; })} style={{ marginTop: "2px", fontSize: "11px", color: "#4a5c72", backgroundColor: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                            Update mileage →
                          </button>
                          {process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && services.some(s => s.status === "OVERDUE" || s.status === "DUE_SOON") && (
                            <button
                              type="button"
                              onClick={async () => {
                                const carId = car.id;
                                const state = reminderState[carId] ?? "idle";
                                if (state !== "idle") return;
                                setReminderState(prev => ({ ...prev, [carId]: "loading" }));
                                const granted = await requestPushPermission();
                                setReminderState(prev => ({ ...prev, [carId]: granted ? "done" : "unavailable" }));
                              }}
                              style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px", width: "100%", height: "36px", backgroundColor: reminderState[car.id] === "done" ? "rgba(34,197,94,0.1)" : "rgba(74,158,255,0.08)", border: `1px solid ${reminderState[car.id] === "done" ? "rgba(34,197,94,0.3)" : "rgba(74,158,255,0.2)"}`, borderRadius: "8px", cursor: reminderState[car.id] && reminderState[car.id] !== "idle" ? "default" : "pointer", padding: "0 12px", color: reminderState[car.id] === "done" ? "#22c55e" : "#4a9eff", fontSize: "12px", fontWeight: 600 }}
                            >
                              <Bell size={12} />
                              {reminderState[car.id] === "loading" ? "Enabling…" : reminderState[car.id] === "done" ? "Reminders on ✓" : reminderState[car.id] === "unavailable" ? "Notifications blocked" : "Get reminded when due"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Recent Diagnoses ── */}
      {visibleHistory.length > 0 && (
        <div style={{ marginTop: "28px", paddingBottom: "24px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#dce8f5", marginBottom: "12px" }}>Recent Diagnoses</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {visibleHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => onOpenDiagnosis(item)}
                style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#0b1019", border: "1px solid #1e2329", borderRadius: "10px", padding: "12px 14px", cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box" }}
              >
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: VERDICT_DOT[item.verdict] ?? "#7d8fa8", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#dce8f5" }}>{item.year} {item.make} {item.model}</div>
                  <div style={{ fontSize: "12px", color: "#7d8fa8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.issue}</div>
                </div>
                <div style={{ fontSize: "11px", color: "#4a5c72", flexShrink: 0 }}>{formatDate(item.date)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
