"use client";

import { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { PlusIcon, TrashIcon, Cross1Icon } from "@radix-ui/react-icons";
import { adminSettingsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import Toggle from "@/components/toggle";

const DEFAULT_TIERS = [
  { threshold: 3500, type: "percent", percent: 15, label: "15% OFF" },
  { threshold: 2000, type: "percent", percent: 10, label: "10% OFF" },
  { threshold: 1200, type: "free_shipping", label: "Free Shipping" },
  { threshold: 500, type: "percent", percent: 5, label: "5% OFF" },
];

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

export default function TierDiscountSheet({ open, onOpenChange, onStatusChange }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [enabled, setEnabled] = useState(true);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSettingsApi.get();
      const cfg = data?.discount_tier_config;
      const list =
        cfg && Array.isArray(cfg.tiers) && cfg.tiers.length > 0
          ? cfg.tiers
          : DEFAULT_TIERS;
      setTiers(
        [...list].sort((a, b) => Number(b.threshold) - Number(a.threshold))
      );
      setEnabled(cfg ? cfg.enabled !== false : true);
    } catch {
      showToast("Failed to load tier discounts", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Reload each time the sheet opens so it reflects current saved config.
  useEffect(() => {
    if (open) fetchConfig();
  }, [open, fetchConfig]);

  const updateTier = (index, field, value) => {
    setTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    );
  };

  const addTier = () => {
    setTiers((prev) => [
      ...prev,
      { threshold: 0, type: "percent", percent: 0, label: "" },
    ]);
  };

  const removeTier = (index) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const cleanTiers = tiers.map((t) => ({
      threshold: Number(t.threshold),
      type: t.type === "free_shipping" ? "free_shipping" : "percent",
      percent: Number(t.percent),
      label: (t.label || "").trim(),
    }));
    for (const t of cleanTiers) {
      if (!(t.threshold > 0)) {
        showToast("Each tier needs a threshold greater than 0", "error");
        return;
      }
      if (!t.label) {
        showToast("Each tier needs a label", "error");
        return;
      }
      if (t.type === "percent" && !(t.percent > 0 && t.percent <= 100)) {
        showToast("Percent tiers need a discount between 1 and 100", "error");
        return;
      }
    }
    if (cleanTiers.filter((t) => t.type === "free_shipping").length > 1) {
      showToast("Only one Free Shipping tier is allowed", "error");
      return;
    }

    setSaving(true);
    try {
      const sortedTiers = [...cleanTiers].sort(
        (a, b) => b.threshold - a.threshold
      );
      await adminSettingsApi.update({
        discount_tier_config: {
          enabled: !!enabled,
          tiers: sortedTiers.map((t) =>
            t.type === "free_shipping"
              ? { threshold: t.threshold, type: "free_shipping", label: t.label }
              : {
                  threshold: t.threshold,
                  type: "percent",
                  percent: t.percent,
                  label: t.label,
                }
          ),
        },
      });
      setTiers(sortedTiers);
      onStatusChange?.(!!enabled);
      showToast("Tier discounts saved", "success");
      onOpenChange(false);
    } catch {
      showToast("Failed to save tier discounts", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                Cart Tier Discounts
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                    enabled
                      ? "bg-green-50 text-green-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      enabled ? "bg-green-500" : "bg-zinc-400"
                    }`}
                  />
                  {enabled ? "Active" : "Disabled"}
                </span>
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-sm text-zinc-500">
                {enabled
                  ? "Spend-based rewards shown as the cart progress bar. Use one Free Shipping tier to set the free-shipping threshold."
                  : "Disabled — no tier discounts apply and the cart progress bar is hidden."}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600">
              <Cross1Icon className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <p className="py-8 text-center text-sm text-zinc-400">Loading...</p>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <Toggle
                    checked={enabled}
                    onCheckedChange={setEnabled}
                    label="Enabled"
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={addTier}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Add Tier
                  </button>
                </div>

                {tiers.length === 0 ? (
                  <p className="text-sm text-zinc-400">
                    No discount tiers configured. Click &quot;Add Tier&quot; to
                    create one.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <div
                      className={`space-y-3 min-w-[560px] ${
                        enabled ? "" : "opacity-60"
                      }`}
                    >
                      {/* Column headers */}
                      <div className="grid grid-cols-[1fr_1.1fr_1fr_1.2fr_40px] gap-3">
                        <label className="text-xs font-medium text-zinc-500">
                          Threshold (&#8377;)
                        </label>
                        <label className="text-xs font-medium text-zinc-500">
                          Type
                        </label>
                        <label className="text-xs font-medium text-zinc-500">
                          Discount (%)
                        </label>
                        <label className="text-xs font-medium text-zinc-500">
                          Label
                        </label>
                        <span />
                      </div>

                      {tiers.map((tier, index) => {
                        const isFreeShipping = tier.type === "free_shipping";
                        return (
                          <div
                            key={index}
                            className="grid grid-cols-[1fr_1.1fr_1fr_1.2fr_40px] gap-3 items-center"
                          >
                            <input
                              type="number"
                              min="0"
                              value={tier.threshold}
                              onChange={(e) =>
                                updateTier(index, "threshold", e.target.value)
                              }
                              placeholder="e.g. 3500"
                              className={inputClass}
                            />
                            <select
                              value={isFreeShipping ? "free_shipping" : "percent"}
                              onChange={(e) =>
                                updateTier(index, "type", e.target.value)
                              }
                              className={inputClass}
                            >
                              <option value="percent">Percent off</option>
                              <option value="free_shipping">Free shipping</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={isFreeShipping ? "" : tier.percent ?? ""}
                              onChange={(e) =>
                                updateTier(index, "percent", e.target.value)
                              }
                              disabled={isFreeShipping}
                              placeholder={isFreeShipping ? "—" : "e.g. 15"}
                              className={`${inputClass} disabled:bg-zinc-50 disabled:text-zinc-300`}
                            />
                            <input
                              type="text"
                              value={tier.label}
                              onChange={(e) =>
                                updateTier(index, "label", e.target.value)
                              }
                              placeholder={
                                isFreeShipping ? "e.g. Free Shipping" : "e.g. 15% OFF"
                              }
                              className={inputClass}
                            />
                            <button
                              type="button"
                              onClick={() => removeTier(index)}
                              className="flex items-center justify-center rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Remove tier"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Tier Discounts"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
