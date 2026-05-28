import { CubeIcon, PlusIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default function EmptyState({
  icon: Icon = CubeIcon,
  title = "No products found",
  subtitle = "Try adjusting your search or filters",
  actionLabel = "Add Product",
  actionHref = "/products/new",
} = {}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon className="mb-4 h-12 w-12 text-zinc-300" />
      <h3 className="mb-1 text-base font-medium text-zinc-700">
        {title}
      </h3>
      <p className="mb-6 text-sm text-zinc-500">
        {subtitle}
      </p>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        <PlusIcon className="h-4 w-4" />
        {actionLabel}
      </Link>
    </div>
  );
}
