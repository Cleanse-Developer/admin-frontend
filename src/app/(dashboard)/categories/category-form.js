"use client";

import { useState } from "react";
import { Cross1Icon } from "@radix-ui/react-icons";
import { adminCategoryApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

export default function CategoryForm({ category, onClose, onSuccess }) {
  const { showToast } = useToast();
  const isEdit = !!category;

  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
    image: category?.image || "",
    sortOrder: category?.sortOrder ?? 0,
    isActive: category?.isActive ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Category name is required");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      sortOrder: Number(form.sortOrder) || 0,
    };

    try {
      if (isEdit) {
        await adminCategoryApi.update(category._id, { ...payload, isActive: form.isActive });
        showToast("Category updated", "success");
      } else {
        await adminCategoryApi.create(payload);
        showToast("Category created", "success");
      }
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg mx-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 rounded-t-xl">
          <h2 className="text-base font-semibold text-zinc-900">
            {isEdit ? "Edit Category" : "New Category"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <Cross1Icon className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Face Care"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
            />
            <p className="mt-1 text-xs text-zinc-400">
              The URL slug is generated automatically from the name.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Brief description of the category"
              rows={2}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors resize-none"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Image URL <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              type="text"
              value={form.image}
              onChange={(e) => handleChange("image", e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Sort Order <span className="font-normal text-zinc-400">(lower shows first)</span>
            </label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => handleChange("sortOrder", e.target.value)}
              min="0"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleChange("isActive", !form.isActive)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form.isActive ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  form.isActive ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-zinc-700">Active</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEdit ? "Update Category" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
