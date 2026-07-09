"use client";

// Shared UI tokens/components for the promoter admin, aligned with the app's
// design system (zinc-neutral, red for destructive — see coupons/special-coupons).

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50",
  ghost:
    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700",
  danger:
    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50",
};

export function IconButton({ title, onClick, danger = false, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded p-1.5 text-zinc-400 transition-colors ${
        danger
          ? "hover:bg-red-50 hover:text-red-600"
          : "hover:bg-zinc-100 hover:text-zinc-600"
      }`}
    >
      {children}
    </button>
  );
}

const STATUS = {
  active: ["bg-green-50 text-green-700", "bg-green-500"],
  paused: ["bg-amber-50 text-amber-700", "bg-amber-500"],
  archived: ["bg-zinc-100 text-zinc-500", "bg-zinc-400"],
};

export function PromoterBadge({ status }) {
  const [pill, dot] = STATUS[status] || STATUS.archived;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

const LEDGER = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-blue-50 text-blue-700",
  settled: "bg-green-50 text-green-700",
  reversed: "bg-red-50 text-red-600",
  finalized: "bg-green-50 text-green-700",
  paid: "bg-green-50 text-green-700",
  draft: "bg-amber-50 text-amber-700",
};

export function Chip({ value }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
        LEDGER[value] || "bg-zinc-100 text-zinc-500"
      }`}
    >
      {value}
    </span>
  );
}

export const table = {
  wrap: "rounded-xl border border-zinc-200 bg-white overflow-hidden",
  scroll: "overflow-x-auto",
  headRow: "border-b border-zinc-100 bg-zinc-50/50",
  th: "px-4 py-3 text-left font-medium text-zinc-500",
  thRight: "px-4 py-3 text-right font-medium text-zinc-500",
  row: "border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors",
  td: "px-4 py-3 text-zinc-600",
};

export function EmptyRow({ icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
      {icon}
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
