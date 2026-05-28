"use client";

import { useState, useEffect } from "react";
import { Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import { adminProductApi, adminCategoryApi } from "@/lib/endpoints";

// --- Shared Input Components ---

export function FormField({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="font-normal text-zinc-400 ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, className = "", ...props }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors ${className}`}
      {...props}
    />
  );
}

export function NumberInput({ value, onChange, min = 0, placeholder, prefix, className = "", ...props }) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">{prefix}</span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-zinc-200 ${prefix ? "pl-7" : "px-3"} pr-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}

export function SelectInput({ value, onChange, options, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors bg-white ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-zinc-900" : "bg-zinc-200"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-sm text-zinc-700">{label}</span>
    </div>
  );
}

export function SectionCard({ title, description, children }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {description && <p className="text-xs text-zinc-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

export function RadioCards({ value, onChange, options }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-lg border p-3 text-left transition-colors ${
            value === opt.value
              ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
              : "border-zinc-200 hover:border-zinc-300"
          }`}
        >
          <div className="text-sm font-medium text-zinc-900">{opt.label}</div>
          {opt.description && (
            <div className="text-xs text-zinc-400 mt-0.5">{opt.description}</div>
          )}
        </button>
      ))}
    </div>
  );
}

// --- Product Picker ---

export function ProductPicker({ selectedIds, onChange, label = "Products" }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    adminProductApi
      .list({ limit: 100, search: searchTerm || undefined })
      .then((data) => setProducts(data?.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, searchTerm]);

  const selected = products.filter((p) => selectedIds.includes(p._id));
  const unselected = products.filter((p) => !selectedIds.includes(p._id));

  return (
    <FormField label={label}>
      {/* Selected tags */}
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {selectedIds.map((id) => {
          const prod = products.find((p) => p._id === id);
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700"
            >
              {prod?.name || id.slice(-6)}
              <button
                type="button"
                onClick={() => onChange(selectedIds.filter((i) => i !== id))}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <Cross1Icon className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors w-full text-left"
      >
        + Select products
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-zinc-200 bg-white shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b border-zinc-100">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {loading ? (
              <div className="p-3 text-center text-xs text-zinc-400">Loading...</div>
            ) : unselected.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-400">No products found</div>
            ) : (
              unselected.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    onChange([...selectedIds, p._id]);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2"
                >
                  <PlusIcon className="h-3 w-3 text-zinc-400" />
                  <span className="text-zinc-700">{p.name}</span>
                  <span className="ml-auto text-xs text-zinc-400">{"\u20B9"}{p.price}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </FormField>
  );
}

// --- Category Picker ---

export function CategoryPicker({ selectedIds, onChange, label = "Categories" }) {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    adminCategoryApi
      .list()
      .then((data) => setCategories(Array.isArray(data) ? data : data?.categories || []))
      .catch(() => {});
  }, [open]);

  const unselected = categories.filter((c) => !selectedIds.includes(c._id));

  return (
    <FormField label={label}>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {selectedIds.map((id) => {
          const cat = categories.find((c) => c._id === id);
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700"
            >
              {cat?.name || id.slice(-6)}
              <button
                type="button"
                onClick={() => onChange(selectedIds.filter((i) => i !== id))}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <Cross1Icon className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors w-full text-left"
      >
        + Select categories
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-zinc-200 bg-white shadow-lg max-h-48 overflow-y-auto">
          {unselected.length === 0 ? (
            <div className="p-3 text-center text-xs text-zinc-400">No categories available</div>
          ) : (
            unselected.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => onChange([...selectedIds, c._id])}
                className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2"
              >
                <PlusIcon className="h-3 w-3 text-zinc-400" />
                <span className="text-zinc-700">{c.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </FormField>
  );
}

// --- Volume Tiers Editor ---

export function VolumeTiersEditor({ tiers, onChange }) {
  const addTier = () => {
    const lastQty = tiers.length > 0 ? tiers[tiers.length - 1].minQuantity : 0;
    onChange([
      ...tiers,
      { minQuantity: lastQty + 1, discountType: "percentage", discountValue: 0 },
    ]);
  };

  const updateTier = (index, field, value) => {
    const updated = tiers.map((t, i) =>
      i === index ? { ...t, [field]: value } : t
    );
    onChange(updated);
  };

  const removeTier = (index) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="space-y-2">
        {tiers.map((tier, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <NumberInput
                value={tier.minQuantity}
                onChange={(v) => updateTier(i, "minQuantity", Number(v))}
                min={1}
                placeholder="Min qty"
              />
            </div>
            <div className="w-36">
              <SelectInput
                value={tier.discountType}
                onChange={(v) => updateTier(i, "discountType", v)}
                options={[
                  { value: "percentage", label: "Percentage" },
                  { value: "fixed_per_item", label: "Fixed/item" },
                ]}
              />
            </div>
            <div className="flex-1">
              <NumberInput
                value={tier.discountValue}
                onChange={(v) => updateTier(i, "discountValue", Number(v))}
                min={0}
                placeholder="Value"
                prefix={tier.discountType === "percentage" ? "%" : "\u20B9"}
              />
            </div>
            <button
              type="button"
              onClick={() => removeTier(i)}
              className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Cross1Icon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addTier}
        className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Add Tier
      </button>
    </div>
  );
}

// --- Fixed Price Bundle Products Editor ---

export function FixedPriceBundleEditor({ productIds, quantities, fixedPrice, onChange }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    adminProductApi
      .list({ limit: 100, search: searchTerm || undefined })
      .then((data) => setProducts(data?.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, searchTerm]);

  const addProduct = (id) => {
    onChange({
      productIds: [...productIds, id],
      quantities: [...quantities, 1],
      fixedPrice,
    });
  };

  const removeProduct = (index) => {
    onChange({
      productIds: productIds.filter((_, i) => i !== index),
      quantities: quantities.filter((_, i) => i !== index),
      fixedPrice,
    });
  };

  const updateQuantity = (index, qty) => {
    const newQtys = [...quantities];
    newQtys[index] = Number(qty) || 1;
    onChange({ productIds, quantities: newQtys, fixedPrice });
  };

  const unselected = products.filter((p) => !productIds.includes(p._id));

  return (
    <div className="space-y-3">
      {/* Selected products with quantities */}
      {productIds.map((id, i) => {
        const prod = products.find((p) => p._id === id);
        return (
          <div key={id} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-2">
            <span className="flex-1 text-sm text-zinc-700">{prod?.name || id.slice(-6)}</span>
            <span className="text-xs text-zinc-400">{"\u20B9"}{prod?.price || "?"}</span>
            <span className="text-xs text-zinc-400">x</span>
            <input
              type="number"
              value={quantities[i] || 1}
              onChange={(e) => updateQuantity(i, e.target.value)}
              min={1}
              className="w-16 rounded border border-zinc-200 px-2 py-1 text-sm text-center outline-none focus:border-zinc-400"
            />
            <button
              type="button"
              onClick={() => removeProduct(i)}
              className="text-zinc-400 hover:text-red-600"
            >
              <Cross1Icon className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors w-full text-left"
      >
        + Add product to bundle
      </button>
      {open && (
        <div className="rounded-lg border border-zinc-200 bg-white shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b border-zinc-100">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {loading ? (
              <div className="p-3 text-center text-xs text-zinc-400">Loading...</div>
            ) : (
              unselected.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => addProduct(p._id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2"
                >
                  <PlusIcon className="h-3 w-3 text-zinc-400" />
                  <span className="text-zinc-700">{p.name}</span>
                  <span className="ml-auto text-xs text-zinc-400">{"\u20B9"}{p.price}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <FormField label="Fixed Bundle Price" required>
        <NumberInput
          value={fixedPrice}
          onChange={(v) => onChange({ productIds, quantities, fixedPrice: Number(v) })}
          min={0}
          prefix={"\u20B9"}
          placeholder="e.g. 999"
        />
      </FormField>
    </div>
  );
}
