"use client";

import { useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400";

// Chip-list field: type + Enter/comma to add, click × to remove. Mirrors the
// skinType/concerns inputs already used in the form.
function ChipField({ label, hint, items, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const list = items || [];

  const add = () => {
    const t = input.replace(/,+$/, "").trim();
    if (!t || list.includes(t)) return setInput("");
    onChange([...list, t]);
    setInput("");
  };
  const remove = (v) => onChange(list.filter((x) => x !== v));

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
      {list.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {list.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="text-zinc-400 hover:text-red-500"
                aria-label={`Remove ${v}`}
              >
                <Cross2Icon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

// Editor for the storefront product-detail "listing content" (Product.listingContent).
// Controlled: { value, onChange } — mirrors TabHighlightsEditor.
export default function ListingContentEditor({ value, onChange }) {
  const lc = value || {};
  const set = (field, val) => onChange({ ...lc, [field]: val });

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="text-base font-semibold text-zinc-900">Listing Content</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Product-detail hero on the storefront: headline title, marketing blurb, and
        the chip rows. Leave a field empty to fall back to the product
        name/description.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Hero Title</label>
          <input
            type="text"
            value={lc.title || ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Cleanse Oil Control Face Wash for Oily & Acne-Prone Skin — 100ml"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Hero Description</label>
          <textarea
            rows={4}
            value={lc.description || ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Say goodbye to breakouts and oily skin with…"
            className={inputClass}
          />
        </div>

        <ChipField
          label="Tags"
          hint="Feature chips shown under the title (e.g. Oil Control, Acne Care)."
          items={lc.tags}
          onChange={(v) => set("tags", v)}
          placeholder="Type a tag, press Enter"
        />
        <ChipField
          label="Helps with"
          hint={'The "Helps with" row (e.g. Purifying, Oil Balancing).'}
          items={lc.helps}
          onChange={(v) => set("helps", v)}
          placeholder="Type, press Enter"
        />
        <ChipField
          label="Targets"
          hint={'The "Targets" row (e.g. Acne, Blackheads).'}
          items={lc.targets}
          onChange={(v) => set("targets", v)}
          placeholder="Type, press Enter"
        />
      </div>
    </div>
  );
}
