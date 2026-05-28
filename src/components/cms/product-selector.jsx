"use client";

import { useState, useEffect, useCallback } from "react";
import { Cross1Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { adminProductApi } from "@/lib/endpoints";

export default function ProductSelector({
  value = [],
  onChange,
  max = 2,
  label,
}) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminProductApi.list({
        limit: 50,
        q: search || undefined,
      });
      setProducts(data?.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(fetchProducts, 300);
      return () => clearTimeout(timer);
    }
  }, [open, fetchProducts]);

  function handleSelect(product) {
    if (value.length >= max) return;
    if (value.some((v) => v._id === product._id)) return;
    const selected = {
      _id: product._id,
      name: product.name,
      price: product.price,
      image: getPrimaryImage(product),
    };
    onChange([...value, selected]);
  }

  function handleRemove(id) {
    onChange(value.filter((v) => v._id !== id));
  }

  function getPrimaryImage(product) {
    const primary = product.images?.find((img) => img.isPrimary);
    return (primary || product.images?.[0])?.url || "";
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-zinc-500">{label}</label>
      )}

      {/* Selected products */}
      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((p) => (
            <div
              key={p._id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2"
            >
              {p.image && (
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-10 w-10 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {p.name}
                </p>
                <p className="text-xs text-zinc-500">
                  &#8377;{p.price}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(p._id)}
                className="rounded p-1 text-zinc-400 hover:text-red-500"
              >
                <Cross1Icon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button / dropdown */}
      {value.length < max && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
          >
            <span>+ Add product ({value.length}/{max})</span>
          </button>

          {open && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpen(false)}
              />
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg">
                {/* Search */}
                <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
                  <MagnifyingGlassIcon className="h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    autoFocus
                  />
                </div>

                {/* List */}
                <div className="max-h-48 overflow-y-auto p-1">
                  {loading ? (
                    <p className="px-3 py-4 text-center text-sm text-zinc-400">
                      Loading...
                    </p>
                  ) : products.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-zinc-400">
                      No products found
                    </p>
                  ) : (
                    products.map((product) => {
                      const isSelected = value.some(
                        (v) => v._id === product._id
                      );
                      return (
                        <button
                          key={product._id}
                          type="button"
                          disabled={isSelected}
                          onClick={() => {
                            handleSelect(product);
                            setOpen(false);
                            setSearch("");
                          }}
                          className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors ${
                            isSelected
                              ? "cursor-not-allowed opacity-40"
                              : "hover:bg-zinc-50"
                          }`}
                        >
                          <img
                            src={getPrimaryImage(product)}
                            alt={product.name}
                            className="h-8 w-8 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm text-zinc-900">
                              {product.name}
                            </p>
                          </div>
                          <span className="text-xs text-zinc-500">
                            &#8377;{product.price}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
