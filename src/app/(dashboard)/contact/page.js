"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";
import { TrashIcon, ChevronDownIcon, Pencil1Icon } from "@radix-ui/react-icons";

import { adminContactApi } from "@/lib/endpoints";
import { useDebounce } from "@/lib/use-debounce";
import { useToast } from "@/context/toast-context";

import SearchInput from "@/components/search-input";
import SelectFilter from "@/components/select-filter";
import Pagination from "@/components/pagination";
import EmptyState from "@/components/empty-state";
import ConfirmDialog from "@/components/confirm-dialog";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "closed", label: "Closed" },
];

const STATUS_STYLES = {
  new: "bg-blue-50 text-blue-700",
  read: "bg-zinc-100 text-zinc-600",
  replied: "bg-green-50 text-green-700",
  closed: "bg-zinc-100 text-zinc-400",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContactSubmissionsPage() {
  const { showToast } = useToast();

  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [newCount, setNewCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchContacts = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = { page, limit: 20 };
        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter !== "all") params.status = statusFilter;

        const data = await adminContactApi.list(params);
        setContacts(data.contacts || []);
        setPagination(data.pagination);
        setNewCount(data.newCount || 0);
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to load submissions", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, statusFilter, showToast]
  );

  useEffect(() => {
    fetchContacts(1);
  }, [fetchContacts]);

  async function changeStatus(contact, status) {
    try {
      await adminContactApi.updateStatus(contact._id, status);
      setContacts((prev) =>
        prev.map((c) => (c._id === contact._id ? { ...c, status } : c))
      );
      if (contact.status === "new" && status !== "new") {
        setNewCount((n) => Math.max(0, n - 1));
      }
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminContactApi.delete(deleteTarget._id);
      showToast("Submission deleted", "success");
      setDeleteTarget(null);
      fetchContacts(pagination.page);
    } catch (err) {
      showToast("Failed to delete submission", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Contact Forms</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Messages submitted from the storefront contact page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {newCount > 0 && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
              {newCount} new
            </span>
          )}
          <Link
            href="/contact/content"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <Pencil1Icon className="h-4 w-4" />
            Edit Page Content
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, email or subject..."
          />
        </div>
        <SelectFilter
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="All Status"
          options={STATUS_OPTIONS}
        />
      </div>

      {/* Table */}
      {!isLoading && contacts.length === 0 ? (
        <EmptyState
          title="No submissions found"
          subtitle="Messages sent from the contact page will appear here."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="hidden px-4 py-3 md:table-cell">Received</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-zinc-100">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
                      </td>
                    </tr>
                  ))
                ) : (
                  contacts.map((c) => (
                    <Fragment key={c._id}>
                      <tr
                        className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50"
                        onClick={() => {
                          setExpanded(expanded === c._id ? null : c._id);
                          if (c.status === "new") changeStatus(c, "read");
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900">{c.name}</div>
                          <div className="text-xs text-zinc-400">{c.email}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{c.subject || "—"}</td>
                        <td className="hidden px-4 py-3 text-zinc-500 md:table-cell">
                          {formatDate(c.createdAt)}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={c.status}
                            onChange={(e) => changeStatus(c, e.target.value)}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium outline-none ${
                              STATUS_STYLES[c.status] || "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            <option value="new">New</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`mailto:${c.email}?subject=Re: ${encodeURIComponent(c.subject || "Your enquiry")}`}
                              className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                            >
                              Reply
                            </a>
                            <button
                              onClick={() => setDeleteTarget(c)}
                              className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                              aria-label="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                            <ChevronDownIcon
                              className={`h-4 w-4 text-zinc-300 transition-transform ${
                                expanded === c._id ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </td>
                      </tr>
                      {expanded === c._id && (
                        <tr className="border-b border-zinc-100 bg-zinc-50/60">
                          <td colSpan={5} className="px-4 py-4">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                              {c.message}
                            </p>
                            {c.phone && (
                              <p className="mt-2 text-xs text-zinc-500">Phone: {c.phone}</p>
                            )}
                            <p className="mt-2 text-xs text-zinc-400 md:hidden">
                              {formatDate(c.createdAt)}
                            </p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => fetchContacts(p)}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Submission"
        description={`Delete the message from "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
