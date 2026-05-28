"use client";

import { CaretUpIcon, CaretDownIcon } from "@radix-ui/react-icons";

export default function DataTable({
  columns,
  data,
  sortField,
  sortDir,
  onSort,
  isLoading,
  renderRow,
  selectedIds,
  onSelectAll,
  allSelected,
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left font-medium text-zinc-600 ${col.className || ""} ${col.sortable ? "cursor-pointer select-none hover:text-zinc-900" : ""}`}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => col.sortable && onSort?.(col.sortKey || col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.key === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onSelectAll}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                  ) : (
                    col.label
                  )}
                  {col.sortable && sortField === (col.sortKey || col.key) && (
                    sortDir === "asc" ? (
                      <CaretUpIcon className="h-4 w-4" />
                    ) : (
                      <CaretDownIcon className="h-4 w-4" />
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={isLoading ? "opacity-50" : ""}>
          {isLoading && data.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-100">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-zinc-200" />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
}
