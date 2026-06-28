"use client";

import { useState, useEffect, useCallback } from "react";
import { ReloadIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import { adminShiprocketApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

export default function DeveloperOptionsPage() {
  const { showToast } = useToast();
  const [mode, setMode] = useState(null); // "live" | "test"
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminShiprocketApi.getMode();
      setMode(data.mode);
    } catch {
      showToast("Failed to load shipping mode", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const switchMode = async (next) => {
    if (next === mode) return;
    setSaving(next);
    try {
      const data = await adminShiprocketApi.setMode(next);
      setMode(data.mode);
      showToast(`Shipping switched to ${data.mode === "test" ? "Test" : "Live"} mode`, "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to switch mode", "error");
    } finally {
      setSaving("");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Developer Options</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Advanced controls. Changes apply instantly — no developer or deployment needed.
        </p>
      </div>

      {/* Shipping section */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5 max-w-3xl">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Shipping</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Choose whether shipping actions really happen, or are only pretended for practice.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <ReloadIcon className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {/* Toggle */}
            <div className="inline-flex rounded-lg border border-zinc-200 p-1">
              <ModeButton
                active={mode === "live"}
                busy={saving === "live"}
                onClick={() => switchMode("live")}
                label="Live"
              />
              <ModeButton
                active={mode === "test"}
                busy={saving === "test"}
                onClick={() => switchMode("test")}
                label="Test"
              />
            </div>
            <p className="text-xs text-zinc-500">
              Currently in{" "}
              <span className={`font-semibold ${mode === "live" ? "text-green-700" : "text-amber-700"}`}>
                {mode === "live" ? "Live" : "Test"}
              </span>{" "}
              mode.
            </p>

            {/* Explanations */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <ModeCard
                title="Live"
                tone="green"
                current={mode === "live"}
                bullets={[
                  "Real orders are created with the courier company.",
                  "Real tracking numbers and pickups are booked.",
                  "Your Shiprocket wallet is actually charged for shipping.",
                  "Couriers physically pick up, deliver, and (for COD) collect cash.",
                  "Order status updates automatically as the parcel moves.",
                  "Use this for real customer orders.",
                ]}
              />
              <ModeCard
                title="Test"
                tone="amber"
                current={mode === "test"}
                bullets={[
                  "Nothing is sent to the courier — everything is pretended.",
                  "Fake tracking numbers are shown so you can practice the flow.",
                  "Your wallet is never charged and no courier is booked.",
                  "No one will actually come to pick up or deliver anything.",
                  "Safe for training staff or trying buttons without consequences.",
                  "Switch back to Live before taking real orders.",
                ]}
              />
            </div>

            <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-3">
              <p className="text-xs text-amber-800">
                Tip: while in Test mode, real customer orders will <strong>not</strong> be shipped.
                Remember to return to Live mode.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ModeButton({ active, busy, onClick, label }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-md px-6 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {busy ? <ReloadIcon className="h-3.5 w-3.5 animate-spin" /> : null}
      {label}
    </button>
  );
}

function ModeCard({ title, tone, current, bullets }) {
  const ring = tone === "green" ? "border-green-200" : "border-amber-200";
  const dot = tone === "green" ? "text-green-600" : "text-amber-600";
  return (
    <div className={`rounded-lg border ${current ? ring : "border-zinc-200"} p-4`}>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {current && (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
            <CheckCircledIcon className="h-3 w-3" /> active
          </span>
        )}
      </div>
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-xs text-zinc-600">
            <span className={`mt-1 ${dot}`}>•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
