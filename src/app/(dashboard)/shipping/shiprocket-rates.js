"use client";

import { useState, useEffect, useCallback } from "react";
import { adminShippingApi, adminShiprocketApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

// ── shared bits ──────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400";
const labelCls = "block text-[11px] font-medium text-zinc-500 mb-1";

const rupee = (n) =>
  n === null || n === undefined || Number.isNaN(Number(n))
    ? "–"
    : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const COURIER_RULES = [
  {
    value: "ours",
    label: "The courier we ship with",
    hint: "Your default courier from the Shiprocket settings. If none is set, Shiprocket's recommended courier, otherwise the cheapest.",
  },
  { value: "cheapest", label: "Cheapest available", hint: "The lowest Shiprocket rate for that pincode." },
  { value: "fastest", label: "Fastest available", hint: "The courier with the shortest delivery time (usually the dearest)." },
];

const FREE_RULES = [
  { value: "static", label: "Keep the free-delivery amounts set on this page (global and per zone)" },
  { value: "custom", label: "Use one custom amount for every order" },
  { value: "off", label: "Never free: always charge the live rate" },
];

function Banner({ tone = "amber", children }) {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-700",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return <div className={`rounded-md border px-3 py-2 text-xs leading-relaxed ${tones[tone]}`}>{children}</div>;
}

// ── 1. Charge mode: static (admin rates) vs dynamic (live Shiprocket) ────────
function ChargeModeCard({ shiprocketTest }) {
  const { showToast } = useToast();
  const [saved, setSaved] = useState(null); // config as stored on the server
  const [draft, setDraft] = useState(null); // form state (strings for inputs)
  const [saving, setSaving] = useState(false);

  const toDraft = (c) => ({
    mode: c.mode,
    courierRule: c.courierRule,
    freeMode: c.freeThreshold?.mode || "static",
    freeAmount: c.freeThreshold?.amount ? String(c.freeThreshold.amount) : "",
    adjustment: c.adjustment ? String(c.adjustment) : "",
    cap: c.cap === null || c.cap === undefined ? "" : String(c.cap),
  });

  useEffect(() => {
    adminShippingApi
      .getChargeMode()
      .then((data) => {
        setSaved(data.config);
        setDraft(toDraft(data.config));
      })
      .catch(() => showToast("Failed to load the delivery charge mode", "error"));
  }, [showToast]);

  if (!draft) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-400">Loading charge mode…</div>
    );
  }

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const dynamic = draft.mode === "dynamic";
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(saved));

  const payload = () => ({
    mode: draft.mode,
    courierRule: draft.courierRule,
    freeThreshold: { mode: draft.freeMode, amount: draft.freeMode === "custom" ? Number(draft.freeAmount) : 0 },
    adjustment: draft.adjustment === "" ? 0 : Number(draft.adjustment),
    cap: draft.cap === "" ? null : Number(draft.cap),
  });

  const save = async () => {
    if (draft.freeMode === "custom" && !(Number(draft.freeAmount) > 0)) {
      showToast("Enter a free-delivery amount greater than 0", "error");
      return;
    }
    if (draft.adjustment !== "" && Number.isNaN(Number(draft.adjustment))) {
      showToast("The adjustment must be a number", "error");
      return;
    }
    if (draft.cap !== "" && !(Number(draft.cap) >= 0)) {
      showToast("The cap must be 0 or more (leave it empty for no cap)", "error");
      return;
    }
    setSaving(true);
    try {
      const data = await adminShippingApi.setChargeMode(payload());
      setSaved(data.config);
      setDraft(toDraft(data.config));
      showToast(
        data.config.mode === "dynamic" ? "Customers are now charged live Shiprocket rates" : "Customers are charged your static rates",
        "success"
      );
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const seg = (value, title, sub) => (
    <button
      type="button"
      onClick={() => set("mode", value)}
      className={`flex-1 rounded-md border px-3 py-2 text-left transition-colors ${
        draft.mode === value ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      <span className="block text-sm font-medium">{title}</span>
      <span className={`block text-[11px] ${draft.mode === value ? "text-zinc-300" : "text-zinc-500"}`}>{sub}</span>
    </button>
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Delivery charge mode</h2>
          <p className="mt-0.5 text-xs text-zinc-500">How customers are charged for delivery.</p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            saved.mode === "dynamic" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          Live now: {saved.mode === "dynamic" ? "Dynamic" : "Static"}
        </span>
      </div>

      <div className="flex gap-2">
        {seg("static", "Static", "Your fixed rates (global + zones)")}
        {seg("dynamic", "Dynamic (Shiprocket)", "Live courier rate for the pincode")}
      </div>

      {dynamic && (
        <div className="mt-3 space-y-3">
          <Banner tone="blue">
            Customers below the free-delivery amount pay the live Shiprocket rate for their pincode and payment type. Your static
            and zone rates are used only as a fallback when Shiprocket has no rate. Until a pincode is entered the cart shows
            &quot;calculated at checkout&quot;. Use the rates checker to see what customers would pay before you save.
          </Banner>
          {shiprocketTest && (
            <Banner tone="amber">
              Shiprocket is in <b>test mode</b>. Simulated rates are never charged, so customers will keep paying the static rates until
              Shiprocket is set to live (Developer options).
            </Banner>
          )}

          <div>
            <label className={labelCls}>Which courier&apos;s rate is charged</label>
            <select value={draft.courierRule} onChange={(e) => set("courierRule", e.target.value)} className={inputCls}>
              {COURIER_RULES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-zinc-500">{COURIER_RULES.find((r) => r.value === draft.courierRule)?.hint}</p>
          </div>

          <div>
            <label className={labelCls}>Free delivery</label>
            <select value={draft.freeMode} onChange={(e) => set("freeMode", e.target.value)} className={inputCls}>
              {FREE_RULES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {draft.freeMode === "custom" && (
              <div className="mt-2 w-40">
                <label className={labelCls}>Free for orders of at least (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={draft.freeAmount}
                  onChange={(e) => set("freeAmount", e.target.value)}
                  placeholder="1200"
                  className={inputCls}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="w-40">
              <label className={labelCls}>Adjustment (₹, + or −)</label>
              <input
                type="number"
                value={draft.adjustment}
                onChange={(e) => set("adjustment", e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div className="w-40">
              <label className={labelCls}>Never charge more than (₹)</label>
              <input
                type="number"
                min="0"
                value={draft.cap}
                onChange={(e) => set("cap", e.target.value)}
                placeholder="No cap"
                className={inputCls}
              />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500">
            The adjustment is added to the courier rate (use a negative number to absorb part of it); the cap limits the final charge.
            Rates are cached for 15 minutes so the price shown in the cart is the price charged.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        {dirty && <span className="text-[11px] text-amber-600">Unsaved changes</span>}
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── 2. Live Shiprocket rates checker ─────────────────────────────────────────
function RatesCard({ defaultPincode }) {
  const { showToast } = useToast();
  const [pincode, setPincode] = useState(defaultPincode || "");
  const [payment, setPayment] = useState("prepaid");
  const [orderValue, setOrderValue] = useState("500");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { serviceability, preview }

  useEffect(() => {
    if (defaultPincode && !pincode) setPincode(defaultPincode);
    // only prefill once a zone pincode becomes known
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPincode]);

  const fetchRates = async (e) => {
    e?.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      showToast("Enter a valid 6-digit pincode", "error");
      return;
    }
    setLoading(true);
    try {
      const data = await adminShiprocketApi.checkServiceability(
        pincode,
        payment === "cod" ? 1 : 0,
        weight === "" ? undefined : Number(weight),
        orderValue === "" ? 0 : Number(orderValue)
      );
      setResult(data);
    } catch (err) {
      setResult(null);
      showToast(err?.response?.data?.message || "Could not fetch Shiprocket rates", "error");
    } finally {
      setLoading(false);
    }
  };

  const sv = result?.serviceability;
  const pv = result?.preview;
  const couriers = [...(sv?.couriers || [])].sort((a, b) => Number(a.rate) - Number(b.rate));
  const quotedId = pv?.dynamic?.courier?.courierId;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-zinc-900">Shiprocket live rates</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          What Shiprocket charges you to ship to a pincode, and what a customer would pay under each mode.
        </p>
      </div>

      <form onSubmit={fetchRates} className="flex flex-wrap items-end gap-3">
        <div className="w-28">
          <label className={labelCls}>Pincode</label>
          <input
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            placeholder="400001"
            className={inputCls}
          />
        </div>
        <div className="w-32">
          <label className={labelCls}>Payment</label>
          <select value={payment} onChange={(e) => setPayment(e.target.value)} className={inputCls}>
            <option value="prepaid">Prepaid</option>
            <option value="cod">Cash on delivery</option>
          </select>
        </div>
        <div className="w-28">
          <label className={labelCls}>Order value (₹)</label>
          <input type="number" min="0" value={orderValue} onChange={(e) => setOrderValue(e.target.value)} className={inputCls} />
        </div>
        <div className="w-24">
          <label className={labelCls}>Weight (kg)</label>
          <input type="number" min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="auto" className={inputCls} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Fetching…" : "Fetch rates"}
        </button>
      </form>

      {pv && (
        <div className="mt-4 space-y-3">
          {pv.shiprocketSource === "test" && (
            <Banner tone="amber">Shiprocket is in <b>test mode</b>: these rates are simulated and are never charged to customers.</Banner>
          )}
          {pv.shiprocketSource === "fallback" && (
            <Banner tone="red">
              Shiprocket returned no rates for this pincode (not serviceable, or the API did not answer). Customers would pay the static rate.
            </Banner>
          )}
          {pv.isDefaultPickup && (
            <Banner tone="amber">
              The pickup pincode is the built-in default (<b>{pv.pickupPincode}</b>). Set your warehouse pincode in the Shiprocket settings,
              or these quotes (and customer charges) will be for the wrong origin.
            </Banner>
          )}

          <p className="text-[11px] text-zinc-500">
            From pickup pincode <b>{pv.pickupPincode}</b> · parcel {pv.weight} kg · {pv.cod ? "cash on delivery" : "prepaid"} · order value{" "}
            {rupee(pv.orderValue)}
          </p>

          {couriers.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-zinc-200">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Courier</th>
                    <th className="px-3 py-2 font-medium">Rate</th>
                    <th className="px-3 py-2 font-medium">Delivery</th>
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {couriers.map((c) => {
                    const quoted = quotedId !== undefined && String(c.courierId) === String(quotedId);
                    const recommended =
                      sv.recommendedCourierId !== undefined &&
                      sv.recommendedCourierId !== null &&
                      String(c.courierId) === String(sv.recommendedCourierId);
                    return (
                      <tr key={c.courierId} className={quoted ? "bg-emerald-50/60" : ""}>
                        <td className="px-3 py-2 text-zinc-900">{c.name}</td>
                        <td className="px-3 py-2 font-medium text-zinc-900">{rupee(c.rate)}</td>
                        <td className="px-3 py-2 text-zinc-600">{c.estimatedDays ? `${c.estimatedDays} days` : "–"}</td>
                        <td className="px-3 py-2 text-right">
                          <span className="inline-flex gap-1">
                            {recommended && (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Recommended</span>
                            )}
                            {quoted && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                                Quoted to customers
                              </span>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Static</p>
              <p className="mt-0.5 text-lg font-semibold text-zinc-900">{pv.static.charge === 0 ? "Free" : rupee(pv.static.charge)}</p>
              <p className="text-[11px] text-zinc-500">
                Rate {rupee(pv.static.rate)}, free from {rupee(pv.static.freeAbove)}
                {pv.static.zone ? ` · zone ${pv.static.zone}` : ""}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Dynamic</p>
              {pv.dynamic ? (
                <>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-900">{pv.dynamic.charge === 0 ? "Free" : rupee(pv.dynamic.charge)}</p>
                  <p className="text-[11px] text-zinc-500">
                    {pv.dynamic.courier.name} {rupee(pv.dynamic.courier.rate)}
                    {pv.dynamic.adjustedRate !== pv.dynamic.courier.rate ? ` → ${rupee(pv.dynamic.adjustedRate)} after adjustment/cap` : ""}
                    {pv.dynamic.freeAbove === null ? " · never free" : ` · free from ${rupee(pv.dynamic.freeAbove)}`}
                  </p>
                </>
              ) : (
                <p className="mt-0.5 text-sm text-zinc-400">No live rate available</p>
              )}
            </div>
          </div>

          <p className="text-xs text-zinc-600">
            Customers currently pay <b>{pv.customerPays === 0 ? "nothing (free delivery)" : rupee(pv.customerPays)}</b> for this order in{" "}
            <b>{pv.activeMode}</b> mode.
          </p>
        </div>
      )}
    </div>
  );
}

// ── exported section ─────────────────────────────────────────────────────────
export default function ShiprocketRates({ defaultPincode }) {
  const [shiprocketTest, setShiprocketTest] = useState(false);

  const loadMode = useCallback(() => {
    adminShiprocketApi
      .getMode()
      .then((d) => setShiprocketTest(d?.mode === "test"))
      .catch(() => {});
  }, []);
  useEffect(() => {
    loadMode();
  }, [loadMode]);

  return (
    <div className="mb-6 grid gap-4 xl:grid-cols-2">
      <ChargeModeCard shiprocketTest={shiprocketTest} />
      <RatesCard defaultPincode={defaultPincode} />
    </div>
  );
}
