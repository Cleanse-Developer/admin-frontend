"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

export default function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-200 py-2 pr-3 pl-9 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
      />
    </div>
  );
}
