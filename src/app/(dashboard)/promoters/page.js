"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, PlusIcon, CopyIcon } from "@radix-ui/react-icons";
import { adminPromoterApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import PromoterForm from "./promoter-form";
import { btn, PromoterBadge, table, EmptyRow } from "./ui";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
];

export default function AdminPromotersPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [promoters, setPromoters] = useState([]);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchPromoters = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminPromoterApi.list({
        page,
        limit: 20,
        search,
        status: statusFilter || undefined,
      });
      setPromoters(data.promoters || []);
      setPagination(data.pagination || {});
    } catch {
      showToast("Failed to load promoters", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      setStats(await adminPromoterApi.stats());
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchPromoters();
  }, [fetchPromoters]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchPromoters();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const onSaved = () => {
    setShowForm(false);
    fetchPromoters();
    fetchStats();
  };
  const copyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    showToast(`Copied ${code}`, "success");
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Promoters</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            External affiliates &amp; influencers — links, codes, commission &amp; settlements
          </p>
        </div>
        <button type="button" onClick={openCreate} className={btn.primary}>
          <PlusIcon className="h-4 w-4" /> Add Promoter
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Total Promoters</p>
            <p className="text-xl font-semibold text-zinc-900 mt-1">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Active</p>
            <p className="text-xl font-semibold text-green-700 mt-1">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Pending Commission</p>
            <p className="text-xl font-semibold text-amber-600 mt-1">
              &#8377;{stats.totalPending}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Settled</p>
            <p className="text-xl font-semibold text-zinc-900 mt-1">
              &#8377;{stats.totalSettled}
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, code, email, handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none"
          />
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5">
          {STATUS_TABS.map((tb) => (
            <button
              key={tb.value || "all"}
              type="button"
              onClick={() => setStatusFilter(tb.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === tb.value
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      <div className={table.wrap}>
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-400">Loading...</div>
        ) : promoters.length === 0 ? (
          <EmptyRow
            icon={<MagnifyingGlassIcon className="mb-2 h-8 w-8 text-zinc-300" />}
            title="No promoters found"
            hint="Add your first promoter to start tracking links, codes and commission."
          />
        ) : (
          <div className={table.scroll}>
            <table className="w-full text-sm">
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>Promoter</th>
                  <th className={table.th}>Code</th>
                  <th className={table.th}>Channel</th>
                  <th className={table.th}>Commission</th>
                  <th className={table.th}>Pending</th>
                  <th className={table.th}>Settled</th>
                  <th className={table.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {promoters.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => router.push(`/promoters/${p._id}`)}
                    className={`cursor-pointer ${table.row}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{p.name}</p>
                      <p className="text-xs text-zinc-500">{p.contact?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCode(p.code);
                        }}
                        title="Copy code"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-600 transition-colors hover:text-zinc-900"
                      >
                        {p.code}
                        <CopyIcon className="h-3.5 w-3.5 text-zinc-400" />
                      </button>
                    </td>
                    <td className="px-4 py-3 capitalize text-zinc-600">{p.channel}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {p.commission?.type === "percentage"
                        ? `${p.commission?.rate || 0}%`
                        : `₹${p.commission?.rate || 0}`}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">&#8377;{p.totals?.totalPending || 0}</td>
                    <td className={table.td}>&#8377;{p.totals?.totalSettled || 0}</td>
                    <td className="px-4 py-3">
                      <PromoterBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination?.pages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs text-zinc-600 disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-xs text-zinc-500">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs text-zinc-600 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <PromoterForm
          promoter={editing}
          onClose={() => setShowForm(false)}
          onSuccess={onSaved}
        />
      )}
    </div>
  );
}
