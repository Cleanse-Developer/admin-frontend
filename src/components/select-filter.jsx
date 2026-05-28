"use client";

import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon } from "@radix-ui/react-icons";

export default function SelectFilter({ value, onValueChange, placeholder, options }) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400">
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="z-50 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 outline-none hover:bg-zinc-100 data-[highlighted]:bg-zinc-100"
              >
                <Select.ItemIndicator>
                  <CheckIcon className="h-4 w-4" />
                </Select.ItemIndicator>
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
