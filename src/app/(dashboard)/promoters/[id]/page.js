"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Pencil1Icon,
  PlusIcon,
  CopyIcon,
  TrashIcon,
  Cross1Icon,
  ArrowLeftIcon,
} from "@radix-ui/react-icons";
import { adminPromoterApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import PromoterForm from "../promoter-form";
import StyledSelect from "../styled-select";
import DateRangePicker from "../date-range-picker";
import { btn, IconButton, PromoterBadge, Chip, table, EmptyRow } from "../ui";

const TABS = ["Overview", "Codes & Links", "Commissions", "Settlements"];

const input =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none";

// Tracking origin = API origin without the trailing /api.
const TRACKING_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "");

export default function PromoterDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [tab, setTab] = useState("Overview");
  const [promoter, setPromoter] = useState(null);
  const [links, setLinks] = useState([]);
  const [codes, setCodes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const loadPromoter = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminPromoterApi.get(id);
      setPromoter(data.promoter);
      setLinks(data.links || []);
      setCodes(data.codes || []);
    } catch {
      showToast("Failed to load promoter", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  const loadAnalytics = useCallback(async () => {
    try {
      setAnalytics(await adminPromoterApi.analytics(id));
    } catch {
      /* silent */
    }
  }, [id]);

  useEffect(() => {
    loadPromoter();
    loadAnalytics();
  }, [loadPromoter, loadAnalytics]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-zinc-400">Loading...</div>;
  }
  if (!promoter) {
    return <div className="p-8 text-center text-sm text-zinc-400">Not found</div>;
  }

  return (
    <div>
      <Link
        href="/promoters"
        className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to promoters
      </Link>

      <div className="mt-3 mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900">{promoter.name}</h1>
            <PromoterBadge status={promoter.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span className="font-mono text-zinc-400">{promoter.code}</span>
            <span className="text-zinc-300">·</span>
            <span className="capitalize">{promoter.channel}</span>
            <span className="text-zinc-300">·</span>
            <span>
              {promoter.commission?.type === "percentage"
                ? `${promoter.commission?.rate || 0}% commission`
                : `₹${promoter.commission?.rate || 0} / order`}
            </span>
          </div>
        </div>
        <button type="button" onClick={() => setShowEdit(true)} className={btn.primary}>
          <Pencil1Icon className="h-4 w-4" /> Edit
        </button>
      </div>

      <div className="mb-6 inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <OverviewTab promoter={promoter} analytics={analytics} />
      )}
      {tab === "Codes & Links" && (
        <CodesLinksTab
          promoterId={id}
          promoter={promoter}
          links={links}
          codes={codes}
          reload={loadPromoter}
        />
      )}
      {tab === "Commissions" && <CommissionsTab promoterId={id} reload={loadPromoter} />}
      {tab === "Settlements" && <SettlementsTab promoterId={id} reload={loadPromoter} />}

      {showEdit && (
        <PromoterForm
          promoter={promoter}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false);
            loadPromoter();
            loadAnalytics();
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-lg font-semibold text-zinc-900 mt-1">{value}</p>
    </div>
  );
}

function OverviewTab({ promoter, analytics }) {
  const t = promoter.totals || {};
  const reach = analytics?.reach || {};
  const clicks = reach.clicks ?? t.totalClicks ?? 0;
  const conversions = reach.conversions ?? 0;
  const convRate = clicks > 0 ? Math.round((conversions / clicks) * 1000) / 10 : 0;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase text-zinc-500 mb-2">Commission</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Pending" value={`₹${t.totalPending || 0}`} />
          <Stat label="Approved" value={`₹${t.totalApproved || 0}`} />
          <Stat label="Settled" value={`₹${t.totalSettled || 0}`} />
          <Stat label="Lifetime Earned" value={`₹${t.totalEarned || 0}`} />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-zinc-500 mb-2">Reach &amp; orders</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Clicks" value={clicks} />
          <Stat label="Unique Visitors" value={reach.uniqueVisitors ?? t.totalVisitors ?? 0} />
          <Stat label="Conversions" value={conversions} />
          <Stat label="Conversion Rate" value={`${convRate}%`} />
          <Stat label="Attributed Orders" value={t.totalOrders || 0} />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-zinc-500 mb-2">Revenue driven</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Net Revenue" value={`₹${t.totalRevenue || 0}`} />
        </div>
      </div>
    </div>
  );
}

function CodesLinksTab({ promoterId, promoter, links, codes, reload }) {
  const { showToast } = useToast();
  const [showLink, setShowLink] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [attach, setAttach] = useState("");

  const copyLink = (slug) => {
    const url = `${TRACKING_BASE}/r/${slug}`;
    navigator.clipboard?.writeText(url);
    showToast("Link copied", "success");
  };

  const toggleLink = async (link) => {
    try {
      await adminPromoterApi.updateLink(promoterId, link._id, {
        isActive: !link.isActive,
      });
      reload();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed", "error");
    }
  };

  const doAttach = async () => {
    if (!attach.trim()) return;
    try {
      await adminPromoterApi.attachCode(promoterId, attach.trim().toUpperCase());
      showToast("Code attached", "success");
      setAttach("");
      reload();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to attach", "error");
    }
  };

  const unbind = async (code) => {
    if (!confirm(`Unbind code ${code}? The coupon itself is not deleted.`)) return;
    try {
      await adminPromoterApi.unbindCode(promoterId, code);
      showToast("Code unbound", "success");
      reload();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed", "error");
    }
  };

  return (
    <div className="space-y-8">
      {/* Links */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Tracking links</h3>
            <p className="text-xs text-zinc-400">Each link records its own reach.</p>
          </div>
          <button type="button" onClick={() => setShowLink((s) => !s)} className={btn.secondary}>
            {showLink ? <Cross1Icon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            {showLink ? "Cancel" : "Add link"}
          </button>
        </div>

        {showLink && (
          <LinkForm
            promoterId={promoterId}
            codes={codes}
            onDone={() => {
              setShowLink(false);
              reload();
            }}
          />
        )}

        <div className={table.wrap}>
          {links.length === 0 ? (
            <EmptyRow title="No links yet" hint="Create a tracking link to start measuring reach." />
          ) : (
            <div className={table.scroll}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={table.headRow}>
                    <th className={table.th}>Label</th>
                    <th className={table.th}>Link</th>
                    <th className={table.th}>Code</th>
                    <th className={table.th}>Clicks</th>
                    <th className={table.th}>Unique</th>
                    <th className={table.th}>Conv.</th>
                    <th className={table.thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((l) => (
                    <tr key={l._id} className={`${table.row} ${l.isActive ? "" : "opacity-60"}`}>
                      <td className="px-4 py-3 font-medium text-zinc-900">{l.label || "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => copyLink(l.slug)}
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-600 transition-colors hover:text-zinc-900"
                          title="Copy full URL"
                        >
                          /r/{l.slug}
                          <CopyIcon className="h-3.5 w-3.5 text-zinc-400" />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                        {l.boundCouponCode || "—"}
                      </td>
                      <td className={table.td}>{l.clickCount || 0}</td>
                      <td className={table.td}>{l.uniqueVisitorCount || 0}</td>
                      <td className={table.td}>{l.conversionCount || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => toggleLink(l)} className={btn.ghost}>
                          {l.isActive ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Codes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Coupon codes</h3>
            <p className="text-xs text-zinc-400">Codes this promoter shares — orders using them earn commission.</p>
          </div>
          <button type="button" onClick={() => setShowCode((s) => !s)} className={btn.secondary}>
            {showCode ? <Cross1Icon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            {showCode ? "Cancel" : "Create code"}
          </button>
        </div>

        {showCode && (
          <CodeForm
            promoterId={promoterId}
            onDone={() => {
              setShowCode(false);
              reload();
            }}
          />
        )}

        <div className="mb-3 flex gap-2">
          <input
            value={attach}
            onChange={(e) => setAttach(e.target.value.toUpperCase())}
            placeholder="Attach an existing code…"
            className={`${input} max-w-xs uppercase`}
          />
          <button type="button" onClick={doAttach} className={btn.secondary}>
            Attach
          </button>
        </div>

        <div className={table.wrap}>
          {codes.length === 0 ? (
            <EmptyRow title="No codes bound" hint="Create a new code or attach an existing coupon." />
          ) : (
            <div className={table.scroll}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={table.headRow}>
                    <th className={table.th}>Code</th>
                    <th className={table.th}>Type</th>
                    <th className={table.th}>Value</th>
                    <th className={table.th}>Uses</th>
                    <th className={table.th}>Valid Till</th>
                    <th className={table.thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c._id} className={table.row}>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-zinc-900">{c.code}</td>
                      <td className="px-4 py-3 capitalize text-zinc-600">
                        {c.kind === "special_coupon"
                          ? String(c.promotionType || "").replace(/_/g, " ")
                          : c.discountType === "free_shipping"
                          ? "Free shipping"
                          : c.discountType}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {c.kind === "special_coupon"
                          ? c.title || "—"
                          : c.discountType === "percentage"
                          ? `${c.discountValue}%`
                          : c.discountType === "fixed"
                          ? `₹${c.discountValue}`
                          : "—"}
                      </td>
                      <td className={table.td}>{c.usageCount || 0}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {c.validTill ? new Date(c.validTill).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <IconButton title="Unbind code" danger onClick={() => unbind(c.code)}>
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LinkForm({ promoterId, codes, onDone }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ label: "", destinationPath: "/", boundCouponCode: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      await adminPromoterApi.createLink(promoterId, {
        label: form.label.trim() || undefined,
        destinationPath: form.destinationPath.trim() || "/",
        boundCouponCode: form.boundCouponCode || undefined,
      });
      showToast("Link created", "success");
      onDone();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to create link", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-3 grid grid-cols-1 sm:grid-cols-4 gap-2 rounded-lg border border-zinc-100 p-3">
      <input
        value={form.label}
        onChange={(e) => set("label", e.target.value)}
        placeholder="Label (e.g. IG bio)"
        className={input}
      />
      <input
        value={form.destinationPath}
        onChange={(e) => set("destinationPath", e.target.value)}
        placeholder="Landing path (/)"
        className={input}
      />
      <StyledSelect
        value={form.boundCouponCode || "__none__"}
        onChange={(v) => set("boundCouponCode", v === "__none__" ? "" : v)}
        options={[
          { value: "__none__", label: "No auto-applied code" },
          ...codes.map((c) => ({ value: c.code, label: c.code })),
        ]}
      />
      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {saving ? "…" : "Create link"}
      </button>
    </div>
  );
}

function CodeForm({ promoterId, onDone }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderValue: "",
    maxDiscountAmount: "",
    validTill: "",
    perUserLimit: 1,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.code.trim() || !form.validTill) {
      showToast("Code and valid-till are required", "error");
      return;
    }
    setSaving(true);
    try {
      await adminPromoterApi.createCode(promoterId, {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || `Promoter code ${form.code.trim().toUpperCase()}`,
        discountType: form.discountType,
        discountValue:
          form.discountType === "free_shipping" ? 0 : Number(form.discountValue) || 0,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        maxDiscountAmount:
          form.discountType === "percentage" && form.maxDiscountAmount
            ? Number(form.maxDiscountAmount)
            : undefined,
        validTill: form.validTill,
        perUserLimit: Number(form.perUserLimit) || 1,
      });
      showToast("Code created", "success");
      onDone();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to create code", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg border border-zinc-100 p-3">
      <input
        value={form.code}
        onChange={(e) => set("code", e.target.value.toUpperCase())}
        placeholder="CODE"
        className={`${input} uppercase`}
      />
      <StyledSelect
        value={form.discountType}
        onChange={(v) => set("discountType", v)}
        options={[
          { value: "percentage", label: "Percentage" },
          { value: "fixed", label: "Fixed ₹" },
          { value: "free_shipping", label: "Free shipping" },
        ]}
      />
      {form.discountType !== "free_shipping" && (
        <input
          type="number"
          min="0"
          value={form.discountValue}
          onChange={(e) => set("discountValue", e.target.value)}
          placeholder={form.discountType === "percentage" ? "% off" : "₹ off"}
          className={input}
        />
      )}
      <input
        type="number"
        min="0"
        value={form.minOrderValue}
        onChange={(e) => set("minOrderValue", e.target.value)}
        placeholder="Min order ₹"
        className={input}
      />
      {form.discountType === "percentage" && (
        <input
          type="number"
          min="0"
          value={form.maxDiscountAmount}
          onChange={(e) => set("maxDiscountAmount", e.target.value)}
          placeholder="Max discount ₹"
          className={input}
        />
      )}
      <input
        type="date"
        value={form.validTill}
        onChange={(e) => set("validTill", e.target.value)}
        className={input}
      />
      <input
        type="number"
        min="1"
        value={form.perUserLimit}
        onChange={(e) => set("perUserLimit", e.target.value)}
        placeholder="Per-user limit"
        className={input}
      />
      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {saving ? "…" : "Create"}
      </button>
    </div>
  );
}

function CommissionsTab({ promoterId, reload }) {
  const { showToast } = useToast();
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminPromoterApi.commissions(promoterId, {
        page,
        limit: 20,
        status: status || undefined,
      });
      setEntries(data.entries || []);
      setPagination(data.pagination || {});
    } catch {
      showToast("Failed to load commissions", "error");
    } finally {
      setLoading(false);
    }
  }, [promoterId, page, status, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const reverse = async (entry) => {
    if (!confirm("Reverse this commission entry?")) return;
    try {
      await adminPromoterApi.reverseCommission(promoterId, entry._id);
      showToast("Commission reversed", "success");
      load();
      reload();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed", "error");
    }
  };

  return (
    <div>
      <div className="mb-3">
        <StyledSelect
          fullWidth={false}
          value={status || "__all__"}
          onChange={(v) => {
            setPage(1);
            setStatus(v === "__all__" ? "" : v);
          }}
          options={[
            { value: "__all__", label: "All statuses" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "settled", label: "Settled" },
            { value: "reversed", label: "Reversed" },
          ]}
        />
      </div>

      <div className={table.wrap}>
        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-400">Loading...</div>
        ) : entries.length === 0 ? (
          <EmptyRow title="No commission entries" hint="Attributed orders will appear here." />
        ) : (
          <div className={table.scroll}>
            <table className="w-full text-sm">
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>Date</th>
                  <th className={table.th}>Order</th>
                  <th className={table.th}>Via</th>
                  <th className={table.th}>Basis</th>
                  <th className={table.th}>Commission</th>
                  <th className={table.th}>Status</th>
                  <th className={table.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e._id} className={table.row}>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                      {e.order?.orderId || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-zinc-600">
                      {e.via}
                      {e.code ? ` · ${e.code}` : ""}
                    </td>
                    <td className={table.td}>&#8377;{e.basisAmount || 0}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">&#8377;{e.amount || 0}</td>
                    <td className="px-4 py-3">
                      <Chip value={e.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {["pending", "approved"].includes(e.status) && (
                        <button type="button" onClick={() => reverse(e)} className={btn.danger}>
                          Reverse
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

function SettlementsTab({ promoterId, reload }) {
  const { showToast } = useToast();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({ periodFrom: "", periodTo: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminPromoterApi.settlements(promoterId);
      setSettlements(data.settlements || []);
    } catch {
      showToast("Failed to load settlements", "error");
    } finally {
      setLoading(false);
    }
  }, [promoterId, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    try {
      await adminPromoterApi.createSettlement(promoterId, {
        periodFrom: period.periodFrom || undefined,
        periodTo: period.periodTo || undefined,
      });
      showToast("Draft settlement created", "success");
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to create settlement", "error");
    }
  };

  const finalize = async (s) => {
    const reference = prompt("Payment reference (UTR / UPI ref / note):", "");
    if (reference === null) return;
    try {
      await adminPromoterApi.finalizeSettlement(promoterId, s._id, { reference });
      showToast("Settlement finalized", "success");
      load();
      reload();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Period</label>
          <DateRangePicker
            value={{ from: period.periodFrom, to: period.periodTo }}
            onChange={({ from, to }) => setPeriod({ periodFrom: from, periodTo: to })}
            placeholder="All unsettled"
          />
        </div>
        <button type="button" onClick={create} className={btn.primary}>
          <PlusIcon className="h-4 w-4" /> Create draft
        </button>
        <p className="w-full text-xs text-zinc-400">
          Includes only <b className="font-medium text-zinc-500">approved</b>, unsettled commissions in the period.
        </p>
      </div>

      <div className={table.wrap}>
        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-400">Loading...</div>
        ) : settlements.length === 0 ? (
          <EmptyRow title="No settlements yet" hint="Create a draft to fold approved commissions into a payout record." />
        ) : (
          <div className={table.scroll}>
            <table className="w-full text-sm">
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>Settlement</th>
                  <th className={table.th}>Entries</th>
                  <th className={table.th}>Amount</th>
                  <th className={table.th}>Status</th>
                  <th className={table.th}>Reference</th>
                  <th className={table.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s._id} className={table.row}>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-zinc-900">{s.settlementId}</td>
                    <td className={table.td}>{s.entryCount}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">&#8377;{s.totalAmount}</td>
                    <td className="px-4 py-3">
                      <Chip value={s.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{s.reference || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {s.status === "draft" && (
                        <button type="button" onClick={() => finalize(s)} className={btn.ghost}>
                          Finalize
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
