"use client";

import { useEffect, useRef, useState } from "react";
import {
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";

/* Shared building blocks for the ritual/genesis CMS editors. Those three
   sections are all "flat fields + repeating lists", so the repeater chrome and
   the icon picker live here instead of being copy-pasted three more times.
   Older editors keep their own local copies; nothing here changes them. */

export const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

export function Field({ label, hint, children }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-zinc-500 mb-1">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-zinc-400 mt-1">{hint}</p>}
    </div>
  );
}

export function TextField({ label, hint, value, onChange, placeholder }) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </Field>
  );
}

export function TextArea({ label, hint, value, onChange, placeholder, rows = 3 }) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={inputClass}
      />
    </Field>
  );
}

export function SectionHeading({ children, action }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-zinc-900">{children}</h3>
      {action}
    </div>
  );
}

export function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
    >
      <PlusIcon className="h-4 w-4" />
      {children}
    </button>
  );
}

/* One item in a reorderable list. Pass onMove/onRemove to get the controls;
   omit them for fixed-length lists (the ritual modes, the banner cards). */
export function RepeaterItem({
  title,
  index,
  count,
  onMove,
  onRemove,
  children,
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-600">{title}</span>
        {(onMove || onRemove) && (
          <div className="flex items-center gap-1">
            {onMove && (
              <>
                <button
                  type="button"
                  onClick={() => onMove(index, index - 1)}
                  disabled={index === 0}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Move up"
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(index, index + 1)}
                  disabled={index === count - 1}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Move down"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Remove"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/* Editable list of plain strings — ritual step chips, tags, marquee-style copy. */
export function StringList({
  label,
  hint,
  value,
  onChange,
  placeholder,
  addLabel = "Add",
  multiline = false,
}) {
  const items = value || [];

  const set = (i, v) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  const add = () => onChange([...items, ""]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const move = (from, to) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <SectionHeading action={<AddButton onClick={add}>{addLabel}</AddButton>}>
        <span className="text-xs font-medium text-zinc-500">{label}</span>
      </SectionHeading>
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 py-4 text-center text-xs text-zinc-400">
          None yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-1.5">
              {multiline ? (
                <textarea
                  value={item || ""}
                  onChange={(e) => set(i, e.target.value)}
                  placeholder={placeholder}
                  rows={3}
                  className={inputClass}
                />
              ) : (
                <input
                  type="text"
                  value={item || ""}
                  onChange={(e) => set(i, e.target.value)}
                  placeholder={placeholder}
                  className={inputClass}
                />
              )}
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                className="mt-1.5 rounded p-1 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Move up"
              >
                <ChevronUpIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === items.length - 1}
                className="mt-1.5 rounded p-1 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Move down"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="mt-1.5 rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Remove"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const iconSvgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  width: 18,
  height: 18,
};

/* Generic icon picker. `glyphs` and `options` are passed in because each
   storefront section draws its own artwork — the preview here has to match the
   section's own icon map, not a shared library. */
export function IconSelect({ value, onChange, options, glyphs }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

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
                {glyphs[selected.value]}
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
          {options.map((opt) => {
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
                    {glyphs[opt.value]}
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
