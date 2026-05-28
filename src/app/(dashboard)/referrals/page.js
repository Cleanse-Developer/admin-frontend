"use client";

import { useState, useEffect, useCallback } from "react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { adminReferralApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

export default function AdminReferralsPage() {
  const { showToast } = useToast();
  const [referrals, setReferrals] = useState([]);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminReferralApi.list({
        page,
        limit: 20,
        search,
        status: statusFilter || undefined,
      });
      setReferrals(data.referrals || []);
      setPagination(data.pagination || {});
    } catch {
      showToast("Failed to load referrals", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminReferralApi.stats();
      setStats(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchReferrals();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleMarkRewarded = async (id) => {
    if (!confirm("Mark this referral as rewarded?")) return;
    try {
      await adminReferralApi.markRewarded(id);
      showToast("Referral marked as rewarded", "success");
      fetchReferrals();
      fetchStats();
    } catch (err) {
      showToast(err?.response?.data?.message || "Action failed", "error");
    }
  };

  const handleReverse = async (id) => {
    if (!confirm("Reverse this referral reward? This will undo the points/coupon.")) return;
    try {
      await adminReferralApi.reverse(id);
      showToast("Reward reversed", "success");
      fetchReferrals();
      fetchStats();
    } catch (err) {
      showToast(err?.response?.data?.message || "Action failed", "error");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Referrals</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Track referral relationships and reward distribution
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Total Referrals</p>
            <p className="text-xl font-semibold text-zinc-900 mt-1">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Rewarded</p>
            <p className="text-xl font-semibold text-green-700 mt-1">{stats.rewarded}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Pending</p>
            <p className="text-xl font-semibold text-yellow-700 mt-1">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Total Reward Value</p>
            <p className="text-xl font-semibold text-zinc-900 mt-1">
              &#8377;{stats.totalRewardValue}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by referrer or referee email/name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 pl-9 pr-3 py-2 text-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="rewarded">Rewarded</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-400">Loading...</div>
        ) : referrals.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">No referrals found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Referrer</th>
                  <th className="px-4 py-3 font-medium">Referee</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Reward</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {referrals.map((r) => (
                  <tr key={r._id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">
                        {r.referrer?.fullName || "—"}
                      </p>
                      <p className="text-xs text-zinc-500">{r.referrer?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">
                        {r.referee?.fullName || "—"}
                      </p>
                      <p className="text-xs text-zinc-500">{r.referee?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.referralCode}</td>
                    <td className="px-4 py-3">&#8377;{r.rewardAmount}</td>
                    <td className="px-4 py-3">
                      {r.isRewarded ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                          Rewarded
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                      {r.qualifyingOrder?.orderId && (
                        <p>{r.qualifyingOrder.orderId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.isRewarded ? (
                        <button
                          type="button"
                          onClick={() => handleReverse(r._id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Reverse
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkRewarded(r._id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Mark rewarded
                        </button>
                      )}
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
    </div>
  );
}
