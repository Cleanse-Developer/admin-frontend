"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toPng } from "html-to-image";
import {
  DownloadIcon,
  MixerHorizontalIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CubeIcon,
  PersonIcon,
  ArchiveIcon,
  BarChartIcon,
} from "@radix-ui/react-icons";
import { adminDashboardApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import { AreaChart, DonutGauge, Sparkline, BarList } from "./_components/charts";
import { normalizeSeries, normalizeProducts } from "./_components/data";
import { buildReportPdf } from "./_components/report-pdf";
import { buildReportXlsx } from "./_components/report-xlsx";
import PeriodPicker from "./_components/period-picker";
import {
  DEFAULT_SELECTION,
  buildRangeParams,
  windowLabel,
  comparisonLabel,
} from "./_components/period";

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */
const statusColors = {
  pending: "bg-zinc-100 text-zinc-700 border-zinc-200",
  confirmed: "bg-zinc-900 text-white border-zinc-900",
  processing: "bg-zinc-100 text-zinc-700 border-zinc-200",
  shipped: "bg-zinc-100 text-zinc-700 border-zinc-200",
  delivered: "bg-zinc-900 text-white border-zinc-900",
  cancelled: "bg-white text-zinc-500 border-zinc-300 line-through",
  returned: "bg-white text-zinc-500 border-zinc-300",
};

const STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

function inr(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}
function inrShort(amount) {
  const n = Number(amount || 0);
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}k`;
  return `₹${n}`;
}
function num(v) {
  return Number(v || 0).toLocaleString("en-IN");
}
function pct(v) {
  return v === null || v === undefined ? "—" : `${Number(v).toFixed(1)}%`;
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* pull deltaPct off a compare() object safely */
const delta = (c) => (c && Number.isFinite(c.deltaPct) ? c.deltaPct : null);
const val = (c, d = 0) => (c && c.value !== undefined ? c.value : d);

/* ------------------------------------------------------------------ */
/* small UI pieces                                                   */
/* ------------------------------------------------------------------ */
function TrendBadge({ value }) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
        up ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-white"
      }`}
    >
      {up ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function KpiCard({ label, value, sub, trend, spark, sparkColor, dark, icon }) {
  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-5 ${
        dark
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-900"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-xs sm:text-sm ${dark ? "text-zinc-300" : "text-zinc-500"}`}>
          {label}
        </p>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9 ${
            dark ? "bg-white/10 text-white" : "bg-zinc-900 text-white"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2 sm:mt-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight sm:text-2xl">
            {value}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 sm:mt-1.5">
            <TrendBadge value={trend} />
            {sub && (
              <span className={`text-xs ${dark ? "text-zinc-400" : "text-zinc-400"}`}>
                {sub}
              </span>
            )}
          </div>
        </div>
        {spark && spark.length > 1 && (
          <div className="hidden sm:block">
            <Sparkline
              data={spark}
              color={dark ? "#ffffff" : sparkColor || "#18181b"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/* small labelled stat tile (operations band, customer metrics) */
function MiniStat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-900">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );
}

/* one line of the P&L statement */
function PLRow({ label, value, strong, deduct, divider }) {
  return (
    <div
      className={`flex items-center justify-between py-2 text-sm ${
        divider ? "border-t border-zinc-200" : ""
      }`}
    >
      <span className={strong ? "font-semibold text-zinc-900" : "text-zinc-600"}>
        {label}
      </span>
      <span
        className={`tabular-nums ${
          strong ? "font-semibold text-zinc-900" : "text-zinc-700"
        }`}
      >
        {deduct && value > 0 ? "−" : ""}
        {inr(Math.abs(value))}
      </span>
    </div>
  );
}

function Menu({ trigger, children, align = "end" }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          className="z-50 min-w-[180px] overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg"
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuItem({ children, onSelect, active }) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 outline-none data-[highlighted]:bg-zinc-100"
    >
      <span className="capitalize">{children}</span>
      {active && <CheckIcon className="h-4 w-4 text-zinc-900" />}
    </DropdownMenu.Item>
  );
}

/* ------------------------------------------------------------------ */
/* page                                                              */
/* ------------------------------------------------------------------ */
export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selection, setSelection] = useState(DEFAULT_SELECTION);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [kpi, setKpi] = useState({}); // { summary, trend, profit, payments, refunds, locations, discounts, customers, ops }
  const [series, setSeries] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [exporting, setExporting] = useState(false);

  const { showToast } = useToast();
  const salesChartRef = useRef(null);
  const growthChartRef = useRef(null);

  /* period-independent widgets: recent orders, low stock, top sellers */
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, products] = await Promise.all([
        adminDashboardApi.overview(),
        adminDashboardApi.productReport().catch(() => []),
      ]);
      setOverview(ov);
      setTopProducts(normalizeProducts(products));
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* period-based KPIs — refetched on period change. Each endpoint is
     independent: one failing leaves the rest intact. */
  const fetchKpis = useCallback(async (sel) => {
    setKpisLoading(true);
    const params = buildRangeParams(sel);
    const seriesHint = params.groupBy === "month" ? "year" : "month";
    const calls = {
      summary: adminDashboardApi.kpiSummary(params),
      trend: adminDashboardApi.kpiSalesTrend(params),
      profit: adminDashboardApi.kpiProfit(params),
      payments: adminDashboardApi.kpiPayments(params),
      refunds: adminDashboardApi.kpiRefunds(params),
      locations: adminDashboardApi.kpiLocations(params),
      discounts: adminDashboardApi.kpiDiscounts(params),
      customers: adminDashboardApi.kpiCustomers(params),
      ops: adminDashboardApi.kpiOrdersOps(params),
    };
    const keys = Object.keys(calls);
    const settled = await Promise.allSettled(keys.map((k) => calls[k]));
    const next = {};
    keys.forEach((k, i) => {
      next[k] = settled[i].status === "fulfilled" ? settled[i].value : null;
    });
    setKpi(next);
    setSeries(normalizeSeries(next.trend?.current || [], seriesHint));
    setKpisLoading(false);
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchKpis(selection);
  }, [selection, fetchKpis]);

  const {
    totalCustomers = 0,
    ordersToday = 0,
    revenueToday = 0,
    recentOrders = [],
    lowStockProducts = [],
  } = overview || {};

  const summary = kpi.summary || {};
  const profit = kpi.profit?.current || null;
  const profitMemo = kpi.profit?.memo || null;

  /* derived */
  const revSpark = useMemo(() => series.map((s) => s.revenue), [series]);
  const ordSpark = useMemo(() => series.map((s) => s.orders), [series]);
  const periodRevenue = val(summary.totalSales);
  const periodOrders = val(summary.orders);
  const salesGrowth = delta(summary.totalSales) ?? 0;

  const topByRevenue = useMemo(
    () =>
      [...topProducts]
        .sort((a, b) => (b.sold || b.revenue) - (a.sold || a.revenue))
        .slice(0, 5),
    [topProducts],
  );

  const filteredOrders = useMemo(
    () =>
      recentOrders.filter(
        (o) => statusFilter === "all" || o.status === statusFilter,
      ),
    [recentOrders, statusFilter],
  );

  /* payment / location / discount bar data */
  const paymentBars = useMemo(
    () =>
      (kpi.payments?.mix || []).map((m) => ({
        label: m.method?.toUpperCase() || "—",
        value: m.revenue || 0,
      })),
    [kpi.payments],
  );
  const locationBars = useMemo(
    () =>
      (kpi.locations?.byState || []).map((s) => ({
        label: s.state,
        value: s.revenue || 0,
      })),
    [kpi.locations],
  );
  const discountBreakdown = kpi.discounts?.breakdown || {};
  const discountBars = useMemo(
    () =>
      Object.entries(discountBreakdown)
        .map(([k, v]) => ({ label: k, value: v || 0 }))
        .filter((b) => b.value > 0)
        .sort((a, b) => b.value - a.value),
    [discountBreakdown],
  );

  /* exports */
  const periodLabel = windowLabel(selection.window);
  const cmpLabel = comparisonLabel(selection);

  async function captureChart(ref) {
    if (!ref.current) return null;
    try {
      const dataUrl = await toPng(ref.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      return { dataUrl, w: ref.current.offsetWidth, h: ref.current.offsetHeight };
    } catch {
      return null;
    }
  }

  async function handleExportReportPdf() {
    if (exporting) return;
    setExporting(true);
    showToast("Generating report…", "info");
    try {
      const bundle = await adminDashboardApi.report(buildRangeParams(selection));
      const [salesTrend, growth] = await Promise.all([
        captureChart(salesChartRef),
        captureChart(growthChartRef),
      ]);
      buildReportPdf({
        bundle,
        narrative: bundle.narrative,
        periodLabel,
        comparisonLabel: cmpLabel,
        charts: { salesTrend, growth },
      });
      showToast("Report downloaded", "success");
    } catch {
      showToast("Failed to generate report", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportXlsx() {
    if (exporting) return;
    setExporting(true);
    try {
      const bundle = await adminDashboardApi.report(buildRangeParams(selection));
      await buildReportXlsx({ bundle, periodLabel, comparisonLabel: cmpLabel });
      showToast("Spreadsheet downloaded", "success");
    } catch {
      showToast("Failed to export data", "error");
    } finally {
      setExporting(false);
    }
  }

  /* ------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }
  if (!overview) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <p className="text-sm text-zinc-400">Failed to load dashboard data.</p>
        <button
          onClick={fetchOverview}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const ops = kpi.ops || {};
  const customers = kpi.customers || {};
  const refunds = kpi.refunds || {};
  const payments = kpi.payments || {};
  const discounts = kpi.discounts || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Sales Overview</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Your beauty store performance at a glance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PeriodPicker value={selection} onChange={setSelection} />

          <Menu
            trigger={
              <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-300">
                <MixerHorizontalIcon className="h-4 w-4 text-zinc-400" />
                {statusFilter === "all" ? "Filter" : `Status: ${statusFilter}`}
              </button>
            }
          >
            {STATUS_OPTIONS.map((s) => (
              <MenuItem
                key={s}
                active={s === statusFilter}
                onSelect={() => setStatusFilter(s)}
              >
                {s === "all" ? "All statuses" : s}
              </MenuItem>
            ))}
          </Menu>

          <Menu
            trigger={
              <button
                disabled={exporting}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {exporting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <DownloadIcon className="h-4 w-4" />
                )}
                {exporting ? "Exporting…" : "Export"}
              </button>
            }
          >
            <MenuItem onSelect={handleExportReportPdf}>Export Report (PDF)</MenuItem>
            <MenuItem onSelect={handleExportXlsx}>Export Data (XLSX)</MenuItem>
          </Menu>
        </div>
      </div>

      {/* KPI cards — period-based with real vs-previous trends */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          dark
          label={`Total Sales · ${periodLabel}`}
          value={inr(periodRevenue)}
          sub={cmpLabel || "no comparison"}
          trend={delta(summary.totalSales)}
          spark={revSpark}
          icon={<span className="text-sm font-semibold">₹</span>}
        />
        <KpiCard
          label={`Net Profit · ${periodLabel}`}
          value={inr(val(summary.netProfit))}
          sub={`${pct(val(summary.netProfitMargin))} margin`}
          trend={delta(summary.netProfit)}
          icon={<BarChartIcon className="h-4 w-4" />}
        />
        <KpiCard
          label={`Orders · ${periodLabel}`}
          value={num(periodOrders)}
          sub={cmpLabel || "no comparison"}
          trend={delta(summary.orders)}
          spark={ordSpark}
          icon={<ArchiveIcon className="h-4 w-4" />}
        />
        <KpiCard
          label="Avg. Order Value"
          value={inr(val(summary.aov))}
          sub={`GMV ${inrShort(val(summary.gmv))}`}
          trend={delta(summary.aov)}
          icon={<CubeIcon className="h-4 w-4" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Sales Over Time"
          action={
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-zinc-900" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-zinc-400" /> Orders
              </span>
              <span className="hidden rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 sm:inline">
                {periodLabel}
              </span>
            </div>
          }
        >
          {kpisLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            </div>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap items-end gap-x-8 gap-y-2">
                <div>
                  <p className="text-xs text-zinc-500">Revenue · {periodLabel}</p>
                  <p className="text-xl font-semibold text-zinc-900">
                    {inr(periodRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Orders · {periodLabel}</p>
                  <p className="text-xl font-semibold text-zinc-900">
                    {num(periodOrders)}
                  </p>
                </div>
              </div>
              <div ref={salesChartRef}>
                <AreaChart
                  data={series}
                  height={300}
                  formatRevenue={inrShort}
                  formatOrders={num}
                />
              </div>
            </>
          )}
        </Card>

        <Card title="Sales Growth">
          <div ref={growthChartRef} className="flex flex-col items-center">
            <div className="flex justify-center py-2">
              <DonutGauge percent={salesGrowth} />
            </div>
            <p className="mt-1 text-center text-xs text-zinc-500">
              {periodLabel} revenue {cmpLabel || "(no comparison)"}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-50 p-3">
              <p className="text-xs text-zinc-500">Orders Today</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {num(ordersToday)}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-3">
              <p className="text-xs text-zinc-500">Revenue Today</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {inrShort(revenueToday)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* P&L + Payments + Refunds */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Profit & Loss" action={<span className="text-xs text-zinc-400">{periodLabel}</span>}>
          {profit ? (
            <div>
              <PLRow label="Revenue" value={profit.revenue} />
              <PLRow label="Cost of goods" value={profit.cogs} deduct />
              <PLRow label="Gross profit" value={profit.grossProfit} strong divider />
              <PLRow label="Packaging" value={profit.costs.packaging} deduct />
              <PLRow label="Shipping" value={profit.costs.shipping} deduct />
              <PLRow label="Warehouse" value={profit.costs.warehouse} deduct />
              <PLRow label="Gateway fees" value={profit.costs.gatewayFees} deduct />
              <PLRow label="Refunds" value={profit.costs.refunds} deduct />
              <PLRow label="Net profit" value={profit.netProfit} strong divider />
              <div className="mt-2 flex items-center justify-between rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white">
                <span>Net margin</span>
                <span className="font-semibold tabular-nums">
                  {pct(profit.netProfitMargin)}
                </span>
              </div>
              {profitMemo && (
                <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">
                  GMV {inrShort(profitMemo.grossMerchandiseValue)} · discounts given{" "}
                  {inrShort(profitMemo.discountsGiven)}. Costs use admin cost config;
                  set product cost prices for accurate COGS.
                </p>
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-400">
              Profit data unavailable.
            </p>
          )}
        </Card>

        <Card title="Payments">
          <BarList items={paymentBars} formatValue={inrShort} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="COD share" value={pct(payments.codSharePct)} />
            <MiniStat
              label="Payment failures"
              value={pct(payments.paymentFailure?.ratePct)}
              hint={
                payments.paymentFailure
                  ? `${payments.paymentFailure.failed}/${payments.paymentFailure.total} sessions`
                  : undefined
              }
            />
          </div>
        </Card>

        <Card title="Refunds & Returns">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Refunded orders" value={num(refunds.refundCount)} />
            <MiniStat label="Refund amount" value={inrShort(refunds.refundAmountTotal)} />
            <MiniStat label="Refund rate" value={pct(refunds.refundRate)} />
            <MiniStat
              label="Returns pending"
              value={num(refunds.pendingReturnRequests)}
            />
          </div>
          {refunds.byStatus?.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-xs">
              {refunds.byStatus.map((s) => (
                <li
                  key={s.status}
                  className="flex items-center justify-between text-zinc-500"
                >
                  <span className="capitalize">{s.status}</span>
                  <span className="text-zinc-700">
                    {s.count} · {inrShort(s.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Locations + Discounts + Customers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Sales by Location">
          <BarList items={locationBars} formatValue={inrShort} />
        </Card>

        <Card title="Discounts">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs text-zinc-500">Total given · {periodLabel}</p>
              <p className="text-xl font-semibold text-zinc-900">
                {inr(discounts.totalDiscountGiven)}
              </p>
            </div>
            <span className="text-xs text-zinc-400">
              {pct(discounts.discountAsPctOfGmv)} of GMV
            </span>
          </div>
          <BarList items={discountBars} formatValue={inrShort} />
          {discounts.topCoupons?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-zinc-400">Top coupons</p>
              <ul className="space-y-1.5 text-sm">
                {discounts.topCoupons.slice(0, 4).map((c) => (
                  <li
                    key={c.code}
                    className="flex items-center justify-between text-zinc-600"
                  >
                    <span className="font-medium text-zinc-900">{c.code}</span>
                    <span className="text-xs text-zinc-400">
                      {num(c.usageCount)} uses
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card title="Customers & Growth">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat
              label="New customers"
              value={num(val(customers.newCustomers))}
              hint={`${pct(delta(customers.newCustomers))} vs prev`}
            />
            <MiniStat label="Repeat rate" value={pct(customers.repeatPurchaseRate)} />
            <MiniStat label="Referral signups" value={num(customers.referralSignups)} />
            <MiniStat label="Referral payout" value={inrShort(customers.referralPayout)} />
            <MiniStat
              label="Reviews to approve"
              value={num(customers.pendingReviewApprovals)}
            />
            <MiniStat
              label="Loyalty liability"
              value={num(customers.loyaltyLiability)}
              hint="points outstanding"
            />
          </div>
          <p className="mt-3 text-[11px] text-zinc-400">
            {num(totalCustomers)} total customers
          </p>
        </Card>
      </div>

      {/* Operations band */}
      <Card title="Operations" action={<span className="text-xs text-zinc-400">live</span>}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          <MiniStat label="Pending" value={num(ops.pendingOrders)} />
          <MiniStat label="Active" value={num(ops.activeOrders)} />
          <MiniStat label="Awaiting pickup" value={num(ops.awaitingPickup)} />
          <MiniStat label="In transit" value={num(ops.inTransit)} />
          <MiniStat label="RTO" value={num(ops.rtoCount)} />
          <MiniStat label="Returns" value={num(ops.returnsPending)} />
          <MiniStat label="COD to confirm" value={num(ops.codAwaitingConfirmation)} />
          <MiniStat
            label="Avg fulfillment"
            value={ops.avgFulfillmentHours ? `${ops.avgFulfillmentHours}h` : "—"}
          />
        </div>
      </Card>

      {/* Recent orders + Top products */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Recent Orders"
          action={<span className="text-xs text-zinc-400">{filteredOrders.length} shown</span>}
        >
          <div className="-mx-5 max-h-[420px] overflow-auto px-5">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-zinc-100 text-left">
                  <th className="whitespace-nowrap py-2.5 pr-3 font-medium text-zinc-400">Order #</th>
                  <th className="py-2.5 pr-3 font-medium text-zinc-400">Customer</th>
                  <th className="whitespace-nowrap py-2.5 pr-3 font-medium text-zinc-400">Total</th>
                  <th className="py-2.5 pr-3 font-medium text-zinc-400">Status</th>
                  <th className="whitespace-nowrap py-2.5 font-medium text-zinc-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-zinc-400">
                      No orders match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-zinc-50 transition-colors hover:bg-zinc-50/60"
                    >
                      <td className="whitespace-nowrap py-3 pr-3 font-medium text-zinc-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="text-zinc-700">{order.user?.fullName || "—"}</div>
                        <div className="text-xs text-zinc-400">{order.user?.email || ""}</div>
                      </td>
                      <td className="whitespace-nowrap py-3 pr-3 font-medium text-zinc-900">
                        {inr(order.pricing?.total)}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                            statusColors[order.status] ||
                            "bg-zinc-50 text-zinc-700 border-zinc-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3 text-zinc-500">
                        {order.createdAt ? fmtDate(order.createdAt) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Top Selling Products">
          {topByRevenue.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              No product data available.
            </p>
          ) : (
            <ul className="space-y-3">
              {topByRevenue.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{p.name}</p>
                    <p className="text-xs text-zinc-400">
                      {p.sold ? `${num(p.sold)} sold` : ""}
                      {p.sold && p.revenue ? " · " : ""}
                      {p.revenue ? inrShort(p.revenue) : ""}
                    </p>
                  </div>
                  {Number.isFinite(p.stock) && (
                    <span className="shrink-0 text-xs text-zinc-400">
                      {num(p.stock)} left
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Low stock */}
      <Card
        title="Low Stock Products"
        action={<span className="text-xs text-zinc-400">{lowStockProducts.length} items</span>}
      >
        {lowStockProducts.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            All products are well stocked.
          </p>
        ) : (
          <div className="max-h-[320px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-zinc-100 text-left">
                  <th className="py-2.5 pr-3 font-medium text-zinc-400">Product</th>
                  <th className="py-2.5 font-medium text-zinc-400">Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => {
                  const stock = product.totalStock ?? 0;
                  return (
                    <tr
                      key={product._id}
                      className="border-b border-zinc-50 hover:bg-zinc-50/60"
                    >
                      <td className="py-3 pr-3 font-medium text-zinc-900">
                        {product.name}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            stock < 5
                              ? "bg-zinc-900 text-white"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {stock} in stock
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
