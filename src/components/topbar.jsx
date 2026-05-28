"use client";

import { HamburgerMenuIcon, ExitIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 lg:hidden"
        >
          <HamburgerMenuIcon className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-zinc-500">
          Cleanse Admin
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600">
          {user?.fullName || user?.email || "Admin"}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        >
          <ExitIcon className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
