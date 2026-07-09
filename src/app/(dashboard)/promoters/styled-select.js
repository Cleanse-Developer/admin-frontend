"use client";

import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon } from "@radix-ui/react-icons";

const base =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 flex items-center justify-between gap-2 data-[placeholder]:text-zinc-400";

// Themed dropdown (Radix) with a custom option list — replaces native <select>
// across the promoter admin. `fullWidth` (default) matches form inputs; set false
// for compact filter bars.
export default function StyledSelect({
  value,
  onChange,
  options,
  placeholder,
  fullWidth = true,
  className = "",
}) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className={`${base} ${fullWidth ? "w-full" : "w-auto"} ${className}`}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-[60] max-h-[280px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg min-w-[var(--radix-select-trigger-width)]"
        >
          <Select.Viewport className="p-1">
            {options.map((o) => (
              <Select.Item
                key={o.value}
                value={o.value}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none data-[highlighted]:bg-zinc-100 data-[state=checked]:font-medium data-[state=checked]:text-zinc-900"
              >
                <Select.ItemText>{o.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <CheckIcon className="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
