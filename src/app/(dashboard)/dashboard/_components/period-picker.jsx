"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CalendarIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import {
  MONTHS,
  PRESETS,
  COMPARISON_MODES,
  windowLabel,
  comparisonLabel,
} from "./period";

const YEARS = (() => {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2, y - 3, y - 4];
})();

const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const chip = (active) =>
  `rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
    active
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
  }`;

const fieldCls =
  "rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-400";

/* Edits a single window descriptor. allowPresets/allowAll toggle those tabs. */
function WindowEditor({ value = {}, onChange, allowPresets = true, allowAll = true }) {
  const now = new Date();
  const mode = value.mode || (allowPresets ? "preset" : "month");
  const set = (patch) => onChange({ ...value, ...patch });

  const tabs = [
    ...(allowPresets ? [["preset", "Presets"]] : []),
    ["month", "Month"],
    ["range", "Range"],
    ...(allowAll ? [["all", "All time"]] : []),
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map(([m, label]) => (
          <button key={m} type="button" className={chip(mode === m)} onClick={() => set({ mode: m })}>
            {label}
          </button>
        ))}
      </div>

      {mode === "preset" && (
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={chip(value.preset === p.value)}
              onClick={() => set({ mode: "preset", preset: p.value })}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {mode === "month" && (
        <div className="flex gap-2">
          <select
            className={fieldCls}
            value={value.month ?? now.getMonth()}
            onChange={(e) => set({ mode: "month", month: Number(e.target.value), year: value.year ?? now.getFullYear() })}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select
            className={fieldCls}
            value={value.year ?? now.getFullYear()}
            onChange={(e) => set({ mode: "month", year: Number(e.target.value), month: value.month ?? now.getMonth() })}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {mode === "range" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            className={fieldCls}
            value={toInput(value.from)}
            onChange={(e) => set({ mode: "range", from: e.target.value, to: value.to })}
          />
          <span className="text-xs text-zinc-400">to</span>
          <input
            type="date"
            className={fieldCls}
            value={toInput(value.to)}
            onChange={(e) => set({ mode: "range", to: e.target.value, from: value.from })}
          />
        </div>
      )}

      {mode === "all" && (
        <p className="text-xs text-zinc-400">Everything since the first order.</p>
      )}
    </div>
  );
}

export default function PeriodPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  // Re-seed the draft from the committed value whenever the popover opens.
  const onOpenChange = (o) => {
    if (o) setDraft(value);
    setOpen(o);
  };

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const cmpMode = draft.comparison?.mode || "prev";
  const setWindow = (w) => setDraft({ ...draft, window: w });
  const setCmp = (patch) => setDraft({ ...draft, comparison: { ...draft.comparison, ...patch } });

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-left text-sm font-medium text-zinc-700 hover:border-zinc-300">
          <CalendarIcon className="h-4 w-4 text-zinc-400" />
          <span className="flex flex-col leading-tight">
            <span>{windowLabel(value.window)}</span>
            {comparisonLabel(value) && (
              <span className="text-[11px] font-normal text-zinc-400">{comparisonLabel(value)}</span>
            )}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 w-[340px] rounded-xl border border-zinc-200 bg-white p-4 shadow-lg"
        >
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Window</p>
              <WindowEditor value={draft.window} onChange={setWindow} allowPresets allowAll />
            </div>

            <div className="border-t border-zinc-100 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Compare to</p>
              <select
                className={`${fieldCls} w-full`}
                value={cmpMode}
                onChange={(e) => setCmp({ mode: e.target.value })}
              >
                {COMPARISON_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              {cmpMode === "custom" && (
                <div className="mt-3">
                  <WindowEditor
                    value={draft.comparison?.window || { mode: "month", year: new Date().getFullYear(), month: new Date().getMonth() }}
                    onChange={(w) => setCmp({ window: w })}
                    allowPresets={false}
                    allowAll={false}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
              <Popover.Close asChild>
                <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:border-zinc-300">
                  Cancel
                </button>
              </Popover.Close>
              <button
                onClick={apply}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Apply
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
