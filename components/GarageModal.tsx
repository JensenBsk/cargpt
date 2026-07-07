"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Car {
  id: string;
  year: number;
  make: string;
  model: string;
  mods: string | null;
  has_tune: boolean;
  nickname: string | null;
}

interface Props {
  onClose: () => void;
  onSelectCar: (car: { year: string; make: string; model: string; mods: string; hasTune: boolean }) => void;
  onRequestSignIn: () => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 35 }, (_, i) => currentYear - i);

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "44px",
  padding: "0 12px",
  fontSize: "16px",
  backgroundColor: "#0d0f12",
  border: "1px solid #252b34",
  borderRadius: "8px",
  color: "#f1f5f9",
};

export default function GarageModal({ onClose, onSelectCar, onRequestSignIn }: Props) {
  const { user } = useAuth();
  const isSignedIn = !!user;
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ year: "", make: "", model: "", mods: "", has_tune: false, nickname: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) { setLoading(false); return; }
    fetch("/api/garage")
      .then((r) => r.json())
      .then((d) => { setCars(d.cars || []); setLoading(false); })
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
        body: JSON.stringify({ year: form.year, make: form.make, model: form.model, mods: form.mods, hasTune: form.has_tune, nickname: form.nickname }),
      });
      const data = await res.json();
      if (data.car) {
        setCars((prev) => [data.car, ...prev]);
        setShowAddForm(false);
        setForm({ year: "", make: "", model: "", mods: "", has_tune: false, nickname: "" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteCar(id: string) {
    setDeletingId(id);
    await fetch("/api/garage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCars((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "560px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderTop: "1px solid #252b34", borderRadius: "16px 16px 0 0", padding: "20px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))", maxHeight: "85dvh", overflowY: "auto" }}
      >
        <div style={{ width: "32px", height: "4px", backgroundColor: "#252b34", borderRadius: "2px", margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9" }}>🚗 My Garage</div>
          {isSignedIn && (
            <button
              onClick={() => setShowAddForm((v) => !v)}
              style={{ fontSize: "13px", fontWeight: 600, padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--accent)", color: "var(--accent)", backgroundColor: "transparent", cursor: "pointer" }}
            >
              {showAddForm ? "Cancel" : "+ Add Car"}
            </button>
          )}
        </div>

        {!isSignedIn ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔒</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#f1f5f9", marginBottom: "6px" }}>Sign in to use My Garage</div>
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>Save your cars and see your diagnosis history</div>
            <button
              onClick={() => { onClose(); onRequestSignIn(); }}
              style={{ height: "44px", padding: "0 24px", backgroundColor: "var(--accent)", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              Sign In
            </button>
          </div>
        ) : (
          <>
            {showAddForm && (
              <form onSubmit={addCar} style={{ backgroundColor: "#0d0f12", border: "1px solid #252b34", borderRadius: "10px", padding: "14px", marginBottom: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#9ca3af", marginBottom: "2px" }}>New Car</div>
                <select value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} required style={{ ...fieldStyle, color: form.year ? "#f1f5f9" : "#6b7280" }}>
                  <option value="">Year</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input type="text" value={form.make} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))} placeholder="Make" required style={fieldStyle} />
                  <input type="text" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="Model" required style={fieldStyle} />
                </div>
                <input type="text" value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))} placeholder="Nickname (optional)" style={fieldStyle} />
                <input type="text" value={form.mods} onChange={(e) => setForm((f) => ({ ...f, mods: e.target.value }))} placeholder="Mods (optional)" style={fieldStyle} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#9ca3af" }}>Running a tune?</span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, has_tune: !f.has_tune }))}
                    style={{ width: "40px", height: "22px", borderRadius: "11px", backgroundColor: form.has_tune ? "var(--accent)" : "#1a1e25", border: `1px solid ${form.has_tune ? "var(--accent)" : "#252b34"}`, position: "relative", cursor: "pointer", flexShrink: 0 }}
                  >
                    <div style={{ position: "absolute", top: "2px", left: form.has_tune ? "18px" : "2px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "white", transition: "left 150ms ease" }} />
                  </button>
                </div>
                <button type="submit" disabled={saving || !form.year || !form.make || !form.model} style={{ height: "44px", backgroundColor: "var(--accent)", color: "white", fontWeight: 600, fontSize: "14px", border: "none", borderRadius: "8px", cursor: "pointer", opacity: saving || !form.year || !form.make || !form.model ? 0.55 : 1 }}>
                  {saving ? "Saving..." : "Save Car"}
                </button>
              </form>
            )}

            {loading ? (
              <div style={{ textAlign: "center", padding: "24px", color: "#6b7280", fontSize: "14px" }}>Loading...</div>
            ) : cars.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>🚗</div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>No cars saved yet. Add one above.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {cars.map((car) => (
                  <div key={car.id} style={{ backgroundColor: "#1a1e25", border: "1px solid #252b34", borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: "#f1f5f9", lineHeight: 1.2 }}>
                        {car.nickname ? car.nickname : `${car.year} ${car.make} ${car.model}`}
                      </div>
                      {car.nickname && (
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{car.year} {car.make} {car.model}</div>
                      )}
                      {car.mods && (
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {car.has_tune ? "⚡ " : ""}{car.mods}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          onSelectCar({ year: String(car.year), make: car.make, model: car.model, mods: car.mods || "", hasTune: car.has_tune });
                          onClose();
                        }}
                        style={{ fontSize: "13px", fontWeight: 600, padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: "var(--accent)", color: "white", cursor: "pointer" }}
                      >
                        Use
                      </button>
                      <button
                        onClick={() => deleteCar(car.id)}
                        disabled={deletingId === car.id}
                        style={{ fontSize: "13px", padding: "6px 10px", borderRadius: "6px", border: "1px solid #2a2f38", backgroundColor: "transparent", color: "#6b7280", cursor: "pointer", opacity: deletingId === car.id ? 0.5 : 1 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
