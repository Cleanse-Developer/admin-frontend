// Period + comparison selection model for the dashboard.
// A `selection` = { window, comparison }.
//   window     : { mode: "preset"|"month"|"range"|"all", preset?, year?, month?, from?, to? }
//   comparison : { mode: "prev"|"previous_year"|"lifetime"|"none"|"custom", window? }
// buildRangeParams(selection) -> the query sent to every KPI call + the report.

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const PRESETS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
];

export const COMPARISON_MODES = [
  { value: "prev", label: "Previous period" },
  { value: "previous_year", label: "Previous year" },
  { value: "lifetime", label: "Lifetime" },
  { value: "custom", label: "Specific period" },
  { value: "none", label: "No comparison" },
];

export const DEFAULT_SELECTION = {
  window: { mode: "preset", preset: "month" },
  comparison: { mode: "prev" },
};

const DAY = 86400000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Resolve a window descriptor into a concrete half-open [from, to) interval.
function resolveWindow(win = {}, now = new Date()) {
  const { mode } = win;

  if (mode === "all") return { from: new Date(0), to: now };

  if (mode === "month") {
    const y = Number(win.year);
    const m = Number(win.month); // 0-11
    const from = new Date(y, m, 1);
    const to = new Date(y, m + 1, 1); // exclusive next-month start
    return { from, to };
  }

  if (mode === "range") {
    const from = win.from ? new Date(win.from) : startOfDay(now);
    // include the whole `to` day -> exclusive end = to + 1 day
    const toBase = win.to ? new Date(win.to) : now;
    const to = new Date(startOfDay(toBase).getTime() + DAY);
    return { from, to };
  }

  // presets
  const to = now;
  let from;
  switch (win.preset) {
    case "today":
      from = startOfDay(now);
      break;
    case "week":
      from = new Date(startOfDay(now).getTime() - 6 * DAY);
      break;
    case "quarter":
      from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case "year":
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case "month":
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }
  return { from, to };
}

function groupByFor(from, to) {
  const days = (to.getTime() - from.getTime()) / DAY;
  return days <= 31 ? "day" : days <= 180 ? "week" : "month";
}

export function buildRangeParams(selection = DEFAULT_SELECTION, now = new Date()) {
  const w = resolveWindow(selection.window, now);
  const params = {
    dateFrom: w.from.toISOString(),
    dateTo: w.to.toISOString(),
    groupBy: groupByFor(w.from, w.to),
    compareMode: selection.comparison?.mode || "prev",
  };
  if (params.compareMode === "custom") {
    const c = resolveWindow(selection.comparison.window || { mode: "month", year: now.getFullYear(), month: now.getMonth() }, now);
    params.compareFrom = c.from.toISOString();
    params.compareTo = c.to.toISOString();
  }
  return params;
}

const fmtDay = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function windowLabel(win = {}) {
  if (win.mode === "all") return "All time";
  if (win.mode === "month") return `${MONTHS[Number(win.month)] || "?"} ${win.year}`;
  if (win.mode === "range") {
    const now = new Date();
    const from = win.from ? fmtDay(win.from) : fmtDay(now);
    const to = win.to ? fmtDay(win.to) : fmtDay(now);
    return `${from} – ${to}`;
  }
  return PRESETS.find((p) => p.value === win.preset)?.label || "This Month";
}

export function comparisonLabel(selection = DEFAULT_SELECTION) {
  const c = selection.comparison || {};
  switch (c.mode) {
    case "none":
      return "";
    case "previous_year":
      return "vs previous year";
    case "lifetime":
      return "vs lifetime";
    case "custom":
      return `vs ${windowLabel(c.window || {})}`;
    case "prev":
    default:
      return "vs previous period";
  }
}
