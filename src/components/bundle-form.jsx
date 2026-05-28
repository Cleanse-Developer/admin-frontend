"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import {
  ChevronDownIcon,
  CheckIcon,
  Cross1Icon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

import { adminProductApi } from "@/lib/endpoints";
import { slugify } from "@/lib/slugify";
import { formatPrice } from "@/lib/format";
import { useToast } from "@/context/toast-context";
import { useDebounce } from "@/lib/use-debounce";

const DISCOUNT_TYPE_OPTIONS = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed Amount (Rs.)" },
];

const INITIAL_FORM = {
  name: "",
  slug: "",
  description: "",
  subtitle: "",
  discountType: "percentage",
  discountValue: "",
  minProducts: "3",
  isActive: true,
  priority: "0",
};

function initForm(d) {
  if (!d) return INITIAL_FORM;
  return {
    name: d.name || "",
    slug: d.slug || "",
    description: d.description || "",
    subtitle: d.subtitle || "",
    discountType: d.discountType || "percentage",
    discountValue: d.discountValue ?? "",
    minProducts: d.minProducts ?? "3",
    isActive: d.isActive ?? true,
    priority: d.priority ?? "0",
  };
}

function initSelectedProducts(d) {
  if (!d?.products?.length) return [];
  return d.products.map((p) => ({
    _id: p._id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    images: p.images,
  }));
}

export default function BundleForm({ initialData, onSubmit, isSubmitting }) {
  const { showToast } = useToast();
  const isEdit = !!initialData;

  const [form, setForm] = useState(() => initForm(initialData));
  const [selectedProducts, setSelectedProducts] = useState(() =>
    initSelectedProducts(initialData)
  );
  const [errors, setErrors] = useState({});
  const [slugManual, setSlugManual] = useState(!!initialData);

  // Product search state
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const debouncedProductSearch = useDebounce(productSearch, 300);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManual && form.name) {
      setForm((prev) => ({ ...prev, slug: slugify(form.name) }));
    }
  }, [form.name, slugManual]);

  // Search products
  useEffect(() => {
    if (!debouncedProductSearch.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setSearchLoading(true);
      try {
        const data = await adminProductApi.list({
          search: debouncedProductSearch,
          limit: 10,
          status: "active",
        });
        if (!cancelled) {
          setSearchResults(data.products || []);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedProductSearch]);

  const setField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return prev;
    });
  }, []);

  function addProduct(product) {
    if (selectedProducts.some((p) => p._id === product._id)) return;
    setSelectedProducts((prev) => [...prev, product]);
    setErrors((prev) => {
      if (prev.products) {
        const next = { ...prev };
        delete next.products;
        return next;
      }
      return prev;
    });
  }

  function removeProduct(productId) {
    setSelectedProducts((prev) => prev.filter((p) => p._id !== productId));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.slug.trim()) e.slug = "Slug is required";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug))
      e.slug = "Only lowercase letters, numbers, and hyphens";

    if (selectedProducts.length < 2) e.products = "At least 2 products are required";

    if (!form.discountType) e.discountType = "Discount type is required";
    if (form.discountValue === "" || form.discountValue === null)
      e.discountValue = "Discount value is required";
    else if (Number(form.discountValue) < 0) e.discountValue = "Must be 0 or more";
    else if (form.discountType === "percentage" && Number(form.discountValue) > 100)
      e.discountValue = "Percentage cannot exceed 100";

    if (form.minProducts === "" || Number(form.minProducts) < 2)
      e.minProducts = "Minimum 2";

    return e;
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      subtitle: form.subtitle.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minProducts: Number(form.minProducts),
      products: selectedProducts.map((p) => p._id),
      displayOnProducts: selectedProducts.map((p) => p._id),
      isActive: form.isActive,
      priority: Number(form.priority) || 0,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast("Please fix the highlighted errors", "error");
      return;
    }
    setErrors({});
    await onSubmit(buildPayload());
  }

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
      errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400"
        : "border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
    }`;

  const selectedIds = new Set(selectedProducts.map((p) => p._id));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basic Info */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Basic Information</h2>
        <div className="mt-4 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              maxLength={200}
              className={inputClass("name")}
              placeholder='e.g. "Build Your Ritual"'
            />
            {errors.name && <span className="text-xs text-red-600">{errors.name}</span>}
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              Slug <span className="text-red-500">*</span>
              {!slugManual && form.name && (
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                  Auto
                </span>
              )}
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true);
                setField("slug", e.target.value);
              }}
              className={inputClass("slug")}
              placeholder="build-your-ritual"
            />
            {errors.slug && <span className="text-xs text-red-600">{errors.slug}</span>}
          </div>

          {/* Subtitle */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center justify-between text-sm font-medium text-zinc-700">
              <span>Subtitle</span>
              <span className="text-xs font-normal text-zinc-400">
                {form.subtitle.length}/300
              </span>
            </label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setField("subtitle", e.target.value)}
              maxLength={300}
              className={inputClass("subtitle")}
              placeholder='e.g. "SELECT PRODUCTS AND SAVE 15% ON YOUR BUNDLE"'
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center justify-between text-sm font-medium text-zinc-700">
              <span>Description</span>
              <span className="text-xs font-normal text-zinc-400">
                {form.description.length}/1000
              </span>
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              maxLength={1000}
              className={inputClass("description")}
              placeholder="Bundle description..."
            />
          </div>
        </div>
      </div>

      {/* Discount Configuration */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Discount</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Discount Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <Select.Root
              value={form.discountType}
              onValueChange={(val) => setField("discountType", val)}
            >
              <Select.Trigger
                className={`inline-flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm outline-none ${
                  errors.discountType ? "border-red-300" : "border-zinc-200 focus:border-zinc-400"
                }`}
              >
                <Select.Value />
                <Select.Icon>
                  <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  className="z-50 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
                  position="popper"
                  sideOffset={4}
                >
                  <Select.Viewport className="p-1">
                    {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                      <Select.Item
                        key={opt.value}
                        value={opt.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100 data-[highlighted]:bg-zinc-100"
                      >
                        <Select.ItemIndicator>
                          <CheckIcon className="h-4 w-4" />
                        </Select.ItemIndicator>
                        <Select.ItemText>{opt.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            {errors.discountType && (
              <span className="text-xs text-red-600">{errors.discountType}</span>
            )}
          </div>

          {/* Discount Value */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              {form.discountType === "percentage" ? "Discount (%)" : "Discount (Rs.)"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max={form.discountType === "percentage" ? "100" : undefined}
              step="0.01"
              value={form.discountValue}
              onChange={(e) => setField("discountValue", e.target.value)}
              className={inputClass("discountValue")}
              placeholder={form.discountType === "percentage" ? "15" : "200"}
            />
            {errors.discountValue && (
              <span className="text-xs text-red-600">{errors.discountValue}</span>
            )}
          </div>

          {/* Min Products */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Min Products to Qualify <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="2"
              step="1"
              value={form.minProducts}
              onChange={(e) => setField("minProducts", e.target.value)}
              className={inputClass("minProducts")}
              placeholder="3"
            />
            {errors.minProducts && (
              <span className="text-xs text-red-600">{errors.minProducts}</span>
            )}
          </div>
        </div>
      </div>

      {/* Product Selection */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">
          Products <span className="text-red-500">*</span>
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Select the products that will be part of this bundle.
        </p>

        {/* Search */}
        <div className="relative mt-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
              placeholder="Search products to add..."
            />
          </div>

          {/* Search dropdown */}
          {showSearch && (productSearch.trim() || searchResults.length > 0) && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
              {searchLoading ? (
                <div className="px-4 py-3 text-sm text-zinc-400">Searching...</div>
              ) : searchResults.length === 0 && productSearch.trim() ? (
                <div className="px-4 py-3 text-sm text-zinc-400">No products found</div>
              ) : (
                searchResults.map((product) => {
                  const isSelected = selectedIds.has(product._id);
                  const primaryImage =
                    product.images?.find((img) => img.isPrimary) || product.images?.[0];
                  return (
                    <button
                      key={product._id}
                      type="button"
                      disabled={isSelected}
                      onClick={() => {
                        addProduct(product);
                        setProductSearch("");
                        setShowSearch(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? "cursor-not-allowed bg-zinc-50 text-zinc-400"
                          : "cursor-pointer hover:bg-zinc-50"
                      }`}
                    >
                      {primaryImage ? (
                        <img
                          src={primaryImage.url}
                          alt={product.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-400">
                          N/A
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium text-zinc-900">
                          {product.name}
                        </div>
                        <div className="text-xs text-zinc-400">{formatPrice(product.price)}</div>
                      </div>
                      {isSelected && (
                        <CheckIcon className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Click-away handler */}
        {showSearch && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowSearch(false)}
          />
        )}

        {/* Selected products */}
        {errors.products && (
          <span className="mt-2 block text-xs text-red-600">{errors.products}</span>
        )}

        {selectedProducts.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {selectedProducts.map((product) => {
              const primaryImage =
                product.images?.find((img) => img.isPrimary) || product.images?.[0];
              return (
                <div
                  key={product._id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"
                >
                  {primaryImage ? (
                    <img
                      src={primaryImage.url}
                      alt={product.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-200 text-xs text-zinc-400">
                      N/A
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-900">
                      {product.name}
                    </div>
                    <div className="text-xs text-zinc-500">{formatPrice(product.price)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(product._id)}
                    className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
                  >
                    <Cross1Icon className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            <div className="mt-1 text-xs text-zinc-400">
              {selectedProducts.length} product(s) selected
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Status</h2>
        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <Switch.Root
              checked={form.isActive}
              onCheckedChange={(val) => setField("isActive", val)}
              className="h-5 w-9 rounded-full bg-zinc-200 transition-colors data-[state=checked]:bg-zinc-900"
            >
              <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[18px]" />
            </Switch.Root>
            Active
          </label>
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-700">Priority</label>
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setField("priority", e.target.value)}
              className="w-20 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-4">
        <Link
          href="/bundles"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : isEdit
              ? "Save Changes"
              : "Create Bundle"}
        </button>
      </div>
    </form>
  );
}
