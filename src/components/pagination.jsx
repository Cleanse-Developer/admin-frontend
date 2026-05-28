"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

export default function Pagination({ page, pages, total, limit, onPageChange }) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
      <span className="text-sm text-zinc-500">
        Showing {start}-{end} of {total} products
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Prev
        </button>
        <span className="text-sm text-zinc-600">
          Page {page} of {pages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
