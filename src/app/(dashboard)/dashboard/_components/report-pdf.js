// Builds the analytics report PDF on the client with jsPDF + jspdf-autotable.
// Consumes the backend report bundle (KPI data + Gemini narrative) and the
// chart images captured from the live dashboard. Monochrome (zinc) style to
// match the dashboard.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const DARK = [24, 24, 27]; // zinc-900
const GREY = [113, 113, 122]; // zinc-500

const inr = (n) => `Rs.${Number(n || 0).toLocaleString("en-IN")}`;
const num = (n) => Number(n || 0).toLocaleString("en-IN");
const pct = (n) => (n === null || n === undefined ? "—" : `${Number(n).toFixed(1)}%`);
const cval = (c, fallback = 0) => (c && typeof c === "object" && "value" in c ? c.value : fallback);
const cdelta = (c) =>
  c && typeof c === "object" && Number.isFinite(c.deltaPct)
    ? `${c.deltaPct >= 0 ? "+" : ""}${c.deltaPct}%`
    : "—";

export function buildReportPdf({ bundle = {}, narrative = {}, periodLabel = "", comparisonLabel = "", charts = {} }) {
  const cmpCol = comparisonLabel || "vs prev";
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 40; // margin
  const contentW = pageW - M * 2;
  let y = M;

  const ensure = (need) => {
    if (y + need > pageH - M) {
      doc.addPage();
      y = M;
    }
  };
  const heading = (text) => {
    ensure(34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...DARK);
    doc.text(text, M, y);
    y += 18;
  };
  const paragraph = (text, { size = 10, color = DARK, gap = 12 } = {}) => {
    if (!text) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text), contentW);
    for (const line of lines) {
      ensure(size + 4);
      doc.text(line, M, y);
      y += size + 4;
    }
    y += gap;
  };
  const bullets = (items) => {
    (items || []).forEach((it) => paragraph(`•  ${it}`, { gap: 2 }));
    if (items && items.length) y += 8;
  };
  const table = (head, body) => {
    autoTable(doc, {
      head: [head],
      body,
      startY: y,
      margin: { left: M, right: M },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 5, textColor: DARK },
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [244, 244, 245] },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 16;
  };
  const sectionCommentary = (key) => {
    const sec = (narrative.sections || []).find((s) => s.key === key);
    if (sec && sec.commentary) paragraph(sec.commentary, { color: GREY });
  };
  const image = (img, caption) => {
    if (!img || !img.dataUrl) return;
    const w = contentW;
    const ratio = img.w && img.h ? img.h / img.w : 0.45;
    const h = Math.min(w * ratio, 320);
    ensure(h + 20);
    doc.addImage(img.dataUrl, "PNG", M, y, w, h);
    y += h + 6;
    if (caption) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...GREY);
      doc.text(caption, M, y);
      y += 14;
    }
  };

  /* ---- Cover ---- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...DARK);
  doc.text("Cleanse", M, y + 10);
  doc.setFontSize(15);
  doc.text("Sales & Performance Report", M, y + 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`Period: ${periodLabel || "—"}${comparisonLabel ? `  (${comparisonLabel})` : ""}`, M, y + 56);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, M, y + 70);
  if (narrative.aiGenerated === false) {
    doc.text("(AI narrative unavailable — data-only report)", M, y + 84);
  }
  y += 104;

  /* ---- Executive summary ---- */
  heading("Executive Summary");
  paragraph(narrative.executiveSummary || "No summary available.");

  /* ---- Headline KPIs ---- */
  const s = bundle.summary || {};
  heading("Key Metrics");
  table(
    ["Metric", "Value", cmpCol],
    [
      ["Total Sales", inr(cval(s.totalSales)), cdelta(s.totalSales)],
      ["Orders", num(cval(s.orders)), cdelta(s.orders)],
      ["Net Profit", inr(cval(s.netProfit)), cdelta(s.netProfit)],
      ["Net Margin", pct(cval(s.netProfitMargin)), cdelta(s.netProfitMargin)],
      ["Avg Order Value", inr(cval(s.aov)), cdelta(s.aov)],
      ["GMV (gross)", inr(cval(s.gmv)), cdelta(s.gmv)],
    ]
  );
  sectionCommentary("sales");

  /* ---- Charts ---- */
  if (charts.salesTrend || charts.growth) {
    heading("Trends");
    image(charts.salesTrend, "Sales over time (revenue & orders)");
    image(charts.growth, "Sales growth vs previous period");
  }

  /* ---- P&L ---- */
  const p = bundle.profit?.current;
  if (p) {
    heading("Profit & Loss");
    table(
      ["Line", "Amount"],
      [
        ["Revenue", inr(p.revenue)],
        ["Cost of goods (COGS)", `- ${inr(p.cogs)}`],
        ["Gross Profit", inr(p.grossProfit)],
        ["Packaging", `- ${inr(p.costs?.packaging)}`],
        ["Shipping", `- ${inr(p.costs?.shipping)}`],
        ["Warehouse", `- ${inr(p.costs?.warehouse)}`],
        ["Gateway fees", `- ${inr(p.costs?.gatewayFees)}`],
        ["Refunds", `- ${inr(p.costs?.refunds)}`],
        ["Net Profit", inr(p.netProfit)],
        ["Net Margin", pct(p.netProfitMargin)],
      ]
    );
    sectionCommentary("profit");
  }

  /* ---- Payments ---- */
  const pay = bundle.payments;
  if (pay) {
    heading("Payments");
    table(
      ["Method", "Orders", "Revenue", "Share"],
      (pay.mix || []).map((m) => [
        (m.method || "—").toUpperCase(),
        num(m.count),
        inr(m.revenue),
        pct(m.sharePct),
      ])
    );
    paragraph(
      `COD share: ${pct(pay.codSharePct)}  ·  Payment failure rate: ${pct(pay.paymentFailure?.ratePct)}`,
      { color: GREY }
    );
    sectionCommentary("payments");
  }

  /* ---- Refunds ---- */
  const r = bundle.refunds;
  if (r) {
    heading("Refunds & Returns");
    table(
      ["Metric", "Value"],
      [
        ["Refunded orders", num(r.refundCount)],
        ["Refund amount", inr(r.refundAmountTotal)],
        ["Refund rate", pct(r.refundRate)],
        ["Returns pending", num(r.pendingReturnRequests)],
      ]
    );
    sectionCommentary("refunds");
  }

  /* ---- Locations ---- */
  const loc = bundle.locations;
  if (loc && loc.byState?.length) {
    heading("Sales by Location");
    table(
      ["State", "Revenue", "Orders"],
      loc.byState.map((x) => [x.state, inr(x.revenue), num(x.orderCount)])
    );
    sectionCommentary("locations");
  }

  /* ---- Discounts ---- */
  const disc = bundle.discounts;
  if (disc) {
    heading("Discounts");
    table(
      ["Type", "Amount"],
      Object.entries(disc.breakdown || {}).map(([k, val]) => [
        k.charAt(0).toUpperCase() + k.slice(1),
        inr(val),
      ])
    );
    paragraph(
      `Total given: ${inr(disc.totalDiscountGiven)} (${pct(disc.discountAsPctOfGmv)} of GMV)  ·  ` +
        `AOV with discount: ${inr(disc.aovWithDiscount)} vs without: ${inr(disc.aovWithoutDiscount)}`,
      { color: GREY }
    );
    sectionCommentary("discounts");
  }

  /* ---- Customers ---- */
  const c = bundle.customers;
  if (c) {
    heading("Customers & Growth");
    table(
      ["Metric", "Value"],
      [
        ["New customers", `${num(cval(c.newCustomers))} (${cdelta(c.newCustomers)})`],
        ["Repeat purchase rate", pct(c.repeatPurchaseRate)],
        ["Referral signups", num(c.referralSignups)],
        ["Referral payout", inr(c.referralPayout)],
        ["Reviews to approve", num(c.pendingReviewApprovals)],
        ["Loyalty points outstanding", num(c.loyaltyLiability)],
      ]
    );
    sectionCommentary("customers");
  }

  /* ---- Operations ---- */
  const ops = bundle.ops;
  if (ops) {
    heading("Operations");
    table(
      ["Metric", "Value"],
      [
        ["Pending orders", num(ops.pendingOrders)],
        ["Active orders", num(ops.activeOrders)],
        ["Awaiting pickup", num(ops.awaitingPickup)],
        ["In transit", num(ops.inTransit)],
        ["RTO", num(ops.rtoCount)],
        ["Returns pending", num(ops.returnsPending)],
        ["COD to confirm", num(ops.codAwaitingConfirmation)],
        ["Avg fulfillment", ops.avgFulfillmentHours ? `${ops.avgFulfillmentHours} h` : "—"],
      ]
    );
    sectionCommentary("operations");
  }

  /* ---- Conclusions & recommendations ---- */
  if (narrative.conclusions?.length) {
    heading("Conclusions");
    bullets(narrative.conclusions);
  }
  if (narrative.recommendations?.length) {
    heading("Recommendations");
    bullets(narrative.recommendations);
  }

  /* ---- Footer page numbers ---- */
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(`Cleanse — ${periodLabel}`, M, pageH - 20);
    doc.text(`Page ${i} of ${pages}`, pageW - M, pageH - 20, { align: "right" });
  }

  doc.save(`cleanse-report-${(periodLabel || "report").toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
