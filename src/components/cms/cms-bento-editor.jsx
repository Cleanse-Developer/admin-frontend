"use client";

import { useEffect, useRef } from "react";
import CmsImageUpload from "./cms-image-upload";
import ProductSelector from "./product-selector";
import { adminProductApi } from "@/lib/endpoints";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

export default function CmsBentoEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });
  const hydratedRef = useRef(false);

  // Hydrate selectedProducts from featuredProductIds on initial load
  useEffect(() => {
    if (hydratedRef.current) return;
    const ids = data.featuredProductIds;
    if (!ids?.length || data.selectedProducts?.length) return;
    hydratedRef.current = true;

    Promise.all(ids.map((id) => adminProductApi.get(id).catch(() => null)))
      .then((results) => {
        const products = results
          .filter(Boolean)
          .map((p) => ({
            _id: p._id,
            name: p.name,
            price: p.price,
            image: (p.images?.find((img) => img.isPrimary) || p.images?.[0])?.url || "",
          }));
        if (products.length > 0) {
          onChange({ ...data, selectedProducts: products });
        }
      });
  }, [data.featuredProductIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateCard = (cardKey, field, value) => {
    const card = { ...(data[cardKey] || {}), [field]: value };
    update(cardKey, card);
  };

  const leftCard = data.leftCard || {};
  const ingredientsCard = data.ingredientsCard || {};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            Section Title
          </label>
          <input
            type="text"
            value={data.sectionTitle || ""}
            onChange={(e) => update("sectionTitle", e.target.value)}
            placeholder="Why your skin deserves the best?"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            Rating Text
          </label>
          <input
            type="text"
            value={data.ratingText || ""}
            onChange={(e) => update("ratingText", e.target.value)}
            placeholder="4+ Star Ratings"
            className={inputClass}
          />
        </div>
      </div>

      {/* Left Card (100% Ayurvedic) */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
        <p className="text-xs font-semibold text-zinc-600 mb-3">
          Left Card (Main Feature)
        </p>
        <CmsImageUpload
          label="Card Image"
          value={leftCard.image}
          onChange={(val) => updateCard("leftCard", "image", val)}
          aspectRatio={5 / 4}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Label
            </label>
            <input
              type="text"
              value={leftCard.label || ""}
              onChange={(e) => updateCard("leftCard", "label", e.target.value)}
              placeholder="100% AYURVEDIC"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Description
            </label>
            <input
              type="text"
              value={leftCard.description || ""}
              onChange={(e) =>
                updateCard("leftCard", "description", e.target.value)
              }
              placeholder="Lab tested products..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Ingredients Card */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
        <p className="text-xs font-semibold text-zinc-600 mb-3">
          Ingredients Card
        </p>
        <CmsImageUpload
          label="Card Image"
          value={ingredientsCard.image}
          onChange={(val) => updateCard("ingredientsCard", "image", val)}
          aspectRatio={12 / 5}
        />
        <div className="mt-3">
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Heading
          </label>
          <input
            type="text"
            value={ingredientsCard.heading || ""}
            onChange={(e) =>
              updateCard("ingredientsCard", "heading", e.target.value)
            }
            placeholder="5 AYURVEDIC INGREDIENTS"
            className={inputClass}
          />
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Description
          </label>
          <textarea
            value={ingredientsCard.description || ""}
            onChange={(e) =>
              updateCard("ingredientsCard", "description", e.target.value)
            }
            placeholder="Description text..."
            rows={2}
            className={inputClass}
          />
        </div>
      </div>

      {/* Featured Products */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
        <p className="text-xs font-semibold text-zinc-600 mb-3">
          Featured Products (Bottom Cards)
        </p>
        <p className="text-xs text-zinc-400 mb-3">
          Select up to 2 products to display in the bottom product cards of this
          section.
        </p>
        <ProductSelector
          value={data.selectedProducts || []}
          onChange={(products) => {
            onChange({
              ...data,
              selectedProducts: products,
              featuredProductIds: products.map((p) => p._id),
            });
          }}
          max={2}
        />
      </div>
    </div>
  );
}
