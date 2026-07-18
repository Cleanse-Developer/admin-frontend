"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon, ChevronDownIcon } from "@radix-ui/react-icons";
// One registry for the whole admin app; mirrors the storefront's icon set so
// the picker offers and previews exactly what the store renders.
import {
  TAB_HIGHLIGHT_ICON_LIST,
  renderTabHighlightIcon,
} from "@/lib/tab-highlight-icons";

function IconPreview({ iconId, size = 28 }) {
  const icon = renderTabHighlightIcon(iconId, { size });
  if (!icon) return <span className="text-xs text-zinc-400">?</span>;
  return (
    <span style={{ width: size, height: size, display: "inline-flex" }}>{icon}</span>
  );
}

// Icon picker popover
function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm hover:bg-zinc-50"
      >
        {value ? (
          <IconPreview iconId={value} size={20} />
        ) : (
          <span className="h-5 w-5 rounded border border-dashed border-zinc-300" />
        )}
        <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-[min(320px,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {TAB_HIGHLIGHT_ICON_LIST.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  title={icon.label}
                  onClick={() => {
                    onChange(icon.id);
                    setOpen(false);
                  }}
                  className={`flex flex-col items-center gap-0.5 rounded-md p-1.5 transition-colors ${
                    value === icon.id
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <IconPreview iconId={icon.id} size={24} />
                  <span className="text-[9px] leading-tight truncate w-full text-center">
                    {icon.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const TAB_KEYS = [
  { key: "ingredients", label: "Ingredients" },
  { key: "values", label: "Our Values" },
  { key: "howToUse", label: "How to Use" },
  { key: "shippingInfo", label: "Shipping & Returns" },
  { key: "policies", label: "Policies" },
];

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400";

export default function TabHighlightsEditor({ value, onChange }) {
  const highlights = value || {};
  const [activeTab, setActiveTab] = useState("ingredients");

  function updateTab(tabKey, items) {
    onChange({ ...highlights, [tabKey]: items });
  }

  function addItem(tabKey) {
    const current = highlights[tabKey] || [];
    updateTab(tabKey, [...current, { icon: "check", label: "" }]);
  }

  function removeItem(tabKey, index) {
    const current = highlights[tabKey] || [];
    updateTab(tabKey, current.filter((_, i) => i !== index));
  }

  function updateItem(tabKey, index, field, val) {
    const current = [...(highlights[tabKey] || [])];
    current[index] = { ...current[index], [field]: val };
    updateTab(tabKey, current);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="text-base font-semibold text-zinc-900">Tab Highlights</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Add icon + label pairs for each product detail tab (up to 6 per tab).
      </p>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-zinc-200 pb-px">
        {TAB_KEYS.map(({ key, label }) => {
          const count = (highlights[key] || []).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === key
                  ? "border-b-2 border-zinc-900 text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {label}
              {count > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-[10px] text-zinc-600">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {TAB_KEYS.map(({ key }) => {
          if (activeTab !== key) return null;
          const items = highlights[key] || [];
          return (
            <div key={key} className="flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <IconPicker
                    value={item.icon}
                    onChange={(iconId) => updateItem(key, i, "icon", iconId)}
                  />
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(key, i, "label", e.target.value)}
                    placeholder="Label text"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(key, i)}
                    className="shrink-0 rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {items.length < 6 && (
                <button
                  type="button"
                  onClick={() => addItem(key)}
                  className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add Highlight
                </button>
              )}

              {items.length === 0 && (
                <p className="text-xs text-zinc-400 italic">
                  No highlights yet. Add up to 6 icon + label pairs.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { IconPreview };
