"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Package,
  Boxes,
  Newspaper,
  BadgePercent,
  MessageSquareQuote,
  ShoppingCart,
  Undo2,
  Star,
} from "lucide-react";
import { adminDashboardApi } from "@/lib/endpoints";

// `badge` names a key from the kpiQuickActions payload; when > 0 it renders a
// count pill on the action and feeds the aggregate badge on the main FAB.
const ACTIONS = [
  { label: "Add Product", href: "/products/new", icon: Package },
  { label: "New Bundle", href: "/bundles/new", icon: Boxes },
  { label: "New Blog Post", href: "/blogs/new", icon: Newspaper },
  { label: "Special Coupon", href: "/special-coupons/new", icon: BadgePercent },
  { label: "Add Testimonial", href: "/testimonials/new", icon: MessageSquareQuote },
  { label: "Reviews to Approve", href: "/reviews", icon: Star, badge: "reviewsToApprove" },
  { label: "Returns to Action", href: "/orders", icon: Undo2, badge: "returnsToAction" },
  { label: "View Orders", href: "/orders", icon: ShoppingCart, badge: "pendingOrders" },
];

export default function QuickActions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    adminDashboardApi
      .kpiQuickActions()
      .then(setCounts)
      .catch(() => setCounts(null));
  }, []);

  const attention = counts
    ? (counts.pendingOrders || 0) +
      (counts.returnsToAction || 0) +
      (counts.reviewsToApprove || 0) +
      (counts.codToConfirm || 0)
    : 0;

  function handle(href) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {/* backdrop to catch outside clicks */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/10"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* action list */}
        <div
          className={`flex flex-col items-end gap-2.5 transition-all duration-200 ${
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          {ACTIONS.map((action, i) => {
            const Icon = action.icon;
            const count = action.badge && counts ? counts[action.badge] || 0 : 0;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => handle(action.href)}
                style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
                className="group flex items-center gap-2.5 transition-all"
              >
                <span className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm">
                  {action.label}
                </span>
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-md transition-colors group-hover:border-zinc-900 group-hover:bg-zinc-900 group-hover:text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                  {count > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* main FAB */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close quick actions" : "Open quick actions"}
          aria-expanded={open}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-all hover:bg-zinc-800 active:scale-95"
        >
          <Plus
            className={`h-6 w-6 transition-transform duration-300 ${
              open ? "rotate-[135deg]" : "rotate-0"
            }`}
            strokeWidth={2}
          />
          {!open && attention > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-zinc-900 ring-2 ring-zinc-900">
              {attention > 99 ? "99+" : attention}
            </span>
          )}
          <span className="sr-only">Quick actions</span>
        </button>
      </div>
    </>
  );
}
