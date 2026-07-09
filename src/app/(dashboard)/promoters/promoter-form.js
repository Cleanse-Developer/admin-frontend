"use client";

import { useState } from "react";
import { Cross1Icon } from "@radix-ui/react-icons";
import { adminPromoterApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import StyledSelect from "./styled-select";

const input =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none";
const label = "block text-sm font-medium text-zinc-700 mb-1";

export default function PromoterForm({ promoter, onClose, onSuccess }) {
  const { showToast } = useToast();
  const isEdit = !!promoter;

  const [form, setForm] = useState({
    name: promoter?.name || "",
    code: promoter?.code || "",
    status: promoter?.status || "active",
    channel: promoter?.channel || "other",
    email: promoter?.contact?.email || "",
    phone: promoter?.contact?.phone || "",
    commissionType: promoter?.commission?.type || "percentage",
    commissionRate: promoter?.commission?.rate ?? "",
    commissionMinOrderValue: promoter?.commission?.minOrderValue ?? "",
    notes: promoter?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      status: form.status,
      channel: form.channel,
      contact: {
        email: form.email.trim(),
        phone: form.phone.trim(),
      },
      commission: {
        type: form.commissionType,
        rate: form.commissionRate ? Number(form.commissionRate) : 0,
        minOrderValue: form.commissionMinOrderValue
          ? Number(form.commissionMinOrderValue)
          : 0,
      },
      notes: form.notes.trim(),
    };

    try {
      if (isEdit) {
        await adminPromoterApi.update(promoter._id, payload);
        showToast("Promoter updated", "success");
      } else {
        await adminPromoterApi.create(payload);
        showToast("Promoter created", "success");
      }
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save promoter");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg mx-4">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 rounded-t-xl">
          <h2 className="text-base font-semibold text-zinc-900">
            {isEdit ? "Edit Promoter" : "New Promoter"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600"
          >
            <Cross1Icon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Riya Sharma"
                className={input}
              />
            </div>
            <div>
              <label className={label}>
                Handle / Code{" "}
                <span className="font-normal text-zinc-400">(auto if blank)</span>
              </label>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. RIYA"
                className={`${input} uppercase`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>Channel</label>
              <StyledSelect
                value={form.channel}
                onChange={(v) => set("channel", v)}
                options={[
                  { value: "instagram", label: "Instagram" },
                  { value: "youtube", label: "YouTube" },
                  { value: "tiktok", label: "TikTok" },
                  { value: "blog", label: "Blog" },
                  { value: "whatsapp", label: "WhatsApp" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>
            <div>
              <label className={label}>Status</label>
              <StyledSelect
                value={form.status}
                onChange={(v) => set("status", v)}
                options={[
                  { value: "active", label: "Active" },
                  { value: "paused", label: "Paused" },
                  { value: "archived", label: "Archived" },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={input}
              />
            </div>
          </div>

          {/* Commission */}
          <div className="rounded-lg border border-zinc-100 p-3 space-y-3">
            <p className="text-xs font-semibold uppercase text-zinc-500">Commission</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={label}>Type</label>
                <StyledSelect
                  value={form.commissionType}
                  onChange={(v) => set("commissionType", v)}
                  options={[
                    { value: "percentage", label: "Percentage" },
                    { value: "fixed_per_order", label: "Fixed / order" },
                  ]}
                />
              </div>
              <div>
                <label className={label}>
                  Rate {form.commissionType === "percentage" ? "(%)" : "(₹)"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.commissionRate}
                  onChange={(e) => set("commissionRate", e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Min Order (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.commissionMinOrderValue}
                  onChange={(e) => set("commissionMinOrderValue", e.target.value)}
                  className={input}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={label}>Internal notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className={`${input} resize-none`}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : isEdit ? "Update Promoter" : "Create Promoter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
