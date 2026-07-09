"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cross1Icon,
} from "@radix-ui/react-icons";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const disp = (d) =>
  d ? `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}` : "";
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const sameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const within = (d, a, b) => {
  if (!a || !b) return false;
  const lo = a <= b ? a : b;
  const hi = a <= b ? b : a;
  return d >= lo && d <= hi;
};

function monthCells(view) {
  const y = view.getFullYear();
  const m = view.getMonth();
  const startDow = new Date(y, m, 1).getDay();
  const cells = [];
  for (let i = startDow; i > 0; i--) cells.push({ date: new Date(y, m, 1 - i), inMonth: false });
  const dim = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= dim; d++) cells.push({ date: new Date(y, m, d), inMonth: true });
  while (cells.length % 7) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }
  return cells;
}

function MonthGrid({ view, start, end, hover, onPick, onHover }) {
  const rangeEnd = end || hover;
  return (
    <div className="w-[224px]">
      <p className="mb-2 text-center text-sm font-medium text-zinc-900">
        {MONTHS[view.getMonth()]} {view.getFullYear()}
      </p>
      <div className="mb-1 grid grid-cols-7">
        {DOW.map((d) => (
          <span key={d} className="text-center text-[11px] font-medium text-zinc-400">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthCells(view).map((c, i) => {
          const isStart = sameDay(c.date, start);
          const isEnd = sameDay(c.date, end) || (!end && sameDay(c.date, hover) && start);
          const selected = isStart || isEnd;
          const between = c.inMonth && start && rangeEnd && within(c.date, start, rangeEnd) && !selected;
          return (
            <button
              key={i}
              type="button"
              disabled={!c.inMonth}
              onMouseEnter={() => c.inMonth && onHover(c.date)}
              onClick={() => c.inMonth && onPick(c.date)}
              className={`h-8 text-sm transition-colors ${between ? "bg-zinc-100" : ""} ${
                !c.inMonth
                  ? "cursor-default text-zinc-300"
                  : selected
                  ? "rounded-md bg-zinc-900 font-medium text-white"
                  : "rounded-md text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {c.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// value: { from, to } as yyyy-mm-dd strings. onChange({ from, to }).
export default function DateRangePicker({ value, onChange, placeholder = "Select date range" }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(startOfMonth(parse(value?.from) || new Date()));
  const [start, setStart] = useState(parse(value?.from));
  const [end, setEnd] = useState(parse(value?.to));
  const [hover, setHover] = useState(null);

  const onOpenChange = (o) => {
    if (o) {
      const f = parse(value?.from);
      setStart(f);
      setEnd(parse(value?.to));
      setHover(null);
      setView(startOfMonth(f || new Date()));
    }
    setOpen(o);
  };

  const pick = (d) => {
    if (!start || (start && end)) {
      setStart(d);
      setEnd(null);
    } else if (d < start) {
      setStart(d);
    } else {
      setEnd(d);
    }
  };

  const preset = (from, to) => {
    setStart(from);
    setEnd(to);
    setHover(null);
    setView(startOfMonth(from));
  };

  const apply = () => {
    if (start) onChange({ from: iso(start), to: iso(end || start) });
    setOpen(false);
  };
  const clear = () => {
    setStart(null);
    setEnd(null);
    setHover(null);
    onChange({ from: "", to: "" });
    setOpen(false);
  };

  const today = new Date();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysAgo = (n) => new Date(t.getFullYear(), t.getMonth(), t.getDate() - n);
  const PRESETS = [
    ["Today", () => preset(t, t)],
    ["Yesterday", () => preset(daysAgo(1), daysAgo(1))],
    ["Last 7 days", () => preset(daysAgo(6), t)],
    ["Last 30 days", () => preset(daysAgo(29), t)],
    ["This month", () => preset(new Date(t.getFullYear(), t.getMonth(), 1), t)],
    ["Last month", () =>
      preset(new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0))],
  ];

  const committedFrom = parse(value?.from);
  const label = committedFrom
    ? `${disp(committedFrom)} – ${disp(parse(value?.to) || committedFrom)}`
    : placeholder;

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-colors hover:border-zinc-300"
        >
          <CalendarIcon className="h-4 w-4 text-zinc-400" />
          <span className={committedFrom ? "text-zinc-900" : "text-zinc-400"}>{label}</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-[60] rounded-xl border border-zinc-200 bg-white shadow-lg"
        >
          <div className="flex">
            {/* Presets */}
            <div className="w-36 border-r border-zinc-100 p-2">
              {PRESETS.map(([label, fn]) => (
                <button
                  key={label}
                  type="button"
                  onClick={fn}
                  className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Calendars */}
            <div className="p-3">
              <div className="mb-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setView(addMonths(view, -1))}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView(addMonths(view, 1))}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-4" onMouseLeave={() => setHover(null)}>
                <MonthGrid
                  view={view}
                  start={start}
                  end={end}
                  hover={hover}
                  onPick={pick}
                  onHover={setHover}
                />
                <div className="hidden sm:block">
                  <MonthGrid
                    view={addMonths(view, 1)}
                    start={start}
                    end={end}
                    hover={hover}
                    onPick={pick}
                    onHover={setHover}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
                <span className="text-xs text-zinc-500">
                  {start ? `${disp(start)} – ${end ? disp(end) : "…"}` : "Pick a start date"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clear}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    <Cross1Icon className="h-3 w-3" /> Clear
                  </button>
                  <button
                    type="button"
                    onClick={apply}
                    disabled={!start}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
