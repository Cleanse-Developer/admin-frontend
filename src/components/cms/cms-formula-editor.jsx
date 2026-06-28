"use client";

import { useEffect, useRef, useState } from "react";

import CmsImageUpload from "./cms-image-upload";

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  width: 18,
  height: 18,
};

// Keep these glyphs in sync with the storefront FORMULA_ICONS map
// (frontend/src/app/page.js).
const ICON_GLYPHS = {
  users: (
    <svg {...svgProps}>
      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" />
      <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" />
    </svg>
  ),
  leaf: (
    <svg {...svgProps}>
      <path d="M12 2L12 6M12 6C9 6 6 9 6 13C6 17 9 22 12 22C15 22 18 17 18 13C18 9 15 6 12 6Z" />
      <path d="M12 6C12 6 10 8 10 11" />
      <path d="M12 6C12 6 14 8 14 11" />
    </svg>
  ),
  star: (
    <svg {...svgProps}>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  ),
  shield: (
    <svg {...svgProps}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  heart: (
    <svg {...svgProps}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  droplet: (
    <svg {...svgProps}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  sun: (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  flask: (
    <svg {...svgProps}>
      <path d="M9 2h6M10 2v6L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 8V2" />
      <path d="M7 15h10" />
    </svg>
  ),
  "check-circle": (
    <svg {...svgProps}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  award: (
    <svg {...svgProps}>
      <circle cx="12" cy="8" r="6" />
      <path d="M8.21 13.89L7 22l5-3 5 3-1.21-8.11" />
    </svg>
  ),
};

const ICON_OPTIONS = [
  { value: "users", label: "Users / People" },
  { value: "leaf", label: "Leaf / Natural" },
  { value: "star", label: "Star / Rating" },
  { value: "shield", label: "Shield / Trust" },
  { value: "heart", label: "Heart / Love" },
  { value: "droplet", label: "Droplet / Hydration" },
  { value: "sun", label: "Sun / Glow" },
  { value: "flask", label: "Flask / Science" },
  { value: "check-circle", label: "Checkmark / Verified" },
  { value: "award", label: "Award / Certified" },
];

function IconSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = ICON_OPTIONS.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <span className="text-zinc-600 shrink-0">
                {ICON_GLYPHS[selected.value]}
              </span>
              <span className="truncate">{selected.label}</span>
            </>
          ) : (
            <span className="text-zinc-400">Select icon...</span>
          )}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {ICON_OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span className="text-zinc-600 shrink-0">
                    {ICON_GLYPHS[opt.value]}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const POSITION_LABELS = {
  tl: "Top Left",
  tr: "Top Right",
  bl: "Bottom Left",
  br: "Bottom Right",
};

export default function CmsFormulaEditor({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const updateBox = (index, field, value) => {
    const boxes = [...(data.boxes || [])];
    boxes[index] = { ...boxes[index], [field]: value };
    update("boxes", boxes);
  };

  const boxes = data.boxes || [];

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Tagline
        </label>
        <textarea
          value={data.tagline || ""}
          onChange={(e) => update("tagline", e.target.value)}
          placeholder="We aren't merely selling bottles..."
          rows={3}
          className={inputClass}
        />
      </div>

      <CmsImageUpload
        label="Center Image"
        value={data.centerImage}
        onChange={(val) => update("centerImage", val)}
        aspectRatio={16 / 9}
      />

      <div>
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">
          Formula Boxes
        </h3>
        <div className="space-y-4">
          {boxes.map((box, i) => (
            <div
              key={box.position || i}
              className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4"
            >
              <p className="text-xs font-semibold text-zinc-600 mb-3">
                {POSITION_LABELS[box.position] || `Box ${i + 1}`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Icon
                  </label>
                  <IconSelect
                    value={box.icon || ""}
                    onChange={(val) => updateBox(i, "icon", val)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={box.title || ""}
                    onChange={(e) => updateBox(i, "title", e.target.value)}
                    placeholder="Proven by people like you"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Description
                </label>
                <textarea
                  value={box.description || ""}
                  onChange={(e) => updateBox(i, "description", e.target.value)}
                  placeholder="In real-world tests..."
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
