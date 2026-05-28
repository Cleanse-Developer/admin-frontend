"use client";

import { useState, useEffect, useCallback } from "react";
import { adminReviewApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-yellow-500" : "text-zinc-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminReviewApi.list({
        page,
        limit: 20,
        status: statusFilter || undefined,
      });
      setReviews(data.reviews || []);
      setPagination(data.pagination || {});
    } catch {
      showToast("Failed to load reviews", "error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminReviewApi.stats();
      setStats(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleApprove = async (id) => {
    try {
      await adminReviewApi.approve(id);
      showToast("Review approved", "success");
      fetchReviews();
      fetchStats();
    } catch (err) {
      showToast(err?.response?.data?.message || "Approval failed", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    try {
      await adminReviewApi.delete(id);
      showToast("Review deleted", "success");
      fetchReviews();
      fetchStats();
    } catch (err) {
      showToast(err?.response?.data?.message || "Delete failed", "error");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Reviews</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Moderate customer reviews. Verified-purchase reviews are auto-approved.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Pending</p>
            <p className="text-xl font-semibold text-yellow-700 mt-1">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Approved</p>
            <p className="text-xl font-semibold text-green-700 mt-1">{stats.approved}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Total</p>
            <p className="text-xl font-semibold text-zinc-900 mt-1">{stats.total}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-2 border-b border-zinc-200 p-4">
          {["pending", "approved", ""].map((status) => (
            <button
              key={status || "all"}
              type="button"
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {status === "" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-400">Loading...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">No reviews found</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {reviews.map((r) => (
              <div key={r._id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <StarRow rating={r.rating} />
                      <span className="text-sm font-medium text-zinc-900">
                        {r.user?.fullName || "Anonymous"}
                      </span>
                      {r.isVerifiedPurchase && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                          Verified
                        </span>
                      )}
                      {r.isApproved ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                          Approved
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">
                      {r.product?.name || "Unknown product"} ·{" "}
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                    {r.title && (
                      <p className="text-sm font-semibold text-zinc-900 mb-1">{r.title}</p>
                    )}
                    <p className="text-sm text-zinc-700">{r.text}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!r.isApproved && (
                      <button
                        type="button"
                        onClick={() => handleApprove(r._id)}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(r._id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
