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
  onSelectCar: (car: { year: string; make: string; model: string; mods: string; hasTune: boolean }) => void;
  onRequestSignIn: () => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 35 }, (_, i) => currentYear - i);

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "44px",
  padding: "0 12px",
  fontSize: "16px",
  backgroundColor: "#0d0f12",
  border: "1px solid #1e2329",
  borderRadius: "10px",
  color: "#f1f5f9",
};

export default function GarageView({ onSelectCar, onRequestSignIn }: Props) {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ year: "", make: "", model: "", mods: "", has_tune: false, nickname: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
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

  if (!user) {
    return (
      <div className="view-enter" style={{ padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px" }}>Sign in to use My Garage</div>
        <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "28px", lineHeight: 1.6 }}>
          Save your cars and see your diagnosis history in one place.
        </div>
        <button
          onClick={onRequestSignIn}
          className="tap-target"
          style={{ height: "48px", padding: "0 28px", backgroundColor: "#3b82f6", color: "white", fontWeight: 600, fontSize: "15px", border: "none", borderRadius: "10px", cursor: "pointer" }}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="view-enter" style={{ padding: "16px 16px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9" }}>My Cars</span>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="tap-target"
          style={{ fontSize: "13px", fontWeight: 600, padding: "6px 14px", borderRadius: "8px", border: "1px solid #3b82f6", color: "#3b82f6", backgroundColor: "transparent", cursor: "pointer" }}
        >
          {showAddForm ? "Cancel" : "+ Add Car"}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={addCar}
          style={{ backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "12px", padding: "16px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <select value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} required style={{ ...inputStyle, color: form.year ? "#f1f5f9" : "#6b7280" }}>
            <option value="">Year</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <input type="text" value={form.make} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))} placeholder="Make" required style={inputStyle} />
            <input type="text" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="Model" required style={inputStyle} />
          </div>
          <input type="text" value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))} placeholder="Nickname (optional)" style={inputStyle} />
          <input type="text" value={form.mods} onChange={(e) => setForm((f) => ({ ...f, mods: e.target.value }))} placeholder="Mods (optional)" style={inputStyle} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "#9ca3af" }}>Running a tune?</span>
            <button type="button" onClick={() => setForm((f) => ({ ...f, has_tune: !f.has_tune }))} style={{ width: "40px", height: "22px", borderRadius: "11px", backgroundColor: form.has_tune ? "#3b82f6" : "#252b34", border: "none", position: "relative", cursor: "pointer" }}>
              <div style={{ position: "absolute", top: "3px", left: form.has_tune ? "19px" : "3px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "white", transition: "left 150ms ease" }} />
            </button>
          </div>
          <button type="submit" disabled={saving || !form.year || !form.make || !form.model} className="tap-target" style={{ height: "44px", backgroundColor: "#3b82f6", color: "white", fontWeight: 600, fontSize: "14px", border: "none", borderRadius: "10px", cursor: "pointer", opacity: saving || !form.year || !form.make || !form.model ? 0.5 : 1 }}>
            {saving ? "Saving…" : "Save Car"}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>Loading…</div>
      ) : cars.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🚗</div>
          <div style={{ fontSize: "15px", color: "#6b7280" }}>No cars saved yet.</div>
          <div style={{ fontSize: "13px", color: "#4b5563", marginTop: "4px" }}>Add one above to get started.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {cars.map((car) => (
            <div key={car.id} style={{ backgroundColor: "#13161b", border: "1px solid #1e2329", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#f1f5f9" }}>
                  {car.nickname || `${car.year} ${car.make} ${car.model}`}
                </div>
                {car.nickname && (
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "1px" }}>{car.year} {car.make} {car.model}</div>
                )}
                {car.mods && (
                  <div style={{ fontSize: "12px", color: "#4b5563", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {car.has_tune && "⚡ "}{car.mods}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button
                  onClick={() => onSelectCar({ year: String(car.year), make: car.make, model: car.model, mods: car.mods || "", hasTune: car.has_tune })}
                  className="tap-target"
                  style={{ fontSize: "13px", fontWeight: 600, padding: "7px 14px", borderRadius: "8px", border: "none", backgroundColor: "#3b82f6", color: "white", cursor: "pointer" }}
                >
                  Use
                </button>
                <button
                  onClick={() => deleteCar(car.id)}
                  disabled={deletingId === car.id}
                  className="tap-target"
                  style={{ fontSize: "13px", padding: "7px 10px", borderRadius: "8px", border: "1px solid #252b34", backgroundColor: "transparent", color: "#6b7280", cursor: "pointer", opacity: deletingId === car.id ? 0.4 : 1 }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
