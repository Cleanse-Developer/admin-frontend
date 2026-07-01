// Builds a true multi-sheet .xlsx of the report bundle with exceljs.

import ExcelJS from "exceljs";

const cval = (c, fallback = 0) => (c && typeof c === "object" && "value" in c ? c.value : fallback);
const cdelta = (c) =>
  c && typeof c === "object" && Number.isFinite(c.deltaPct) ? c.deltaPct / 100 : null;

function download(buffer, filename) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Add a sheet with a styled header row + rows. `widths` optional column widths.
function sheet(wb, name, columns, rows, widths) {
  const ws = wb.addWorksheet(name);
  ws.addRow(columns);
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF18181B" } };
    cell.alignment = { vertical: "middle" };
  });
  rows.forEach((r) => ws.addRow(r));
  ws.columns.forEach((col, i) => {
    col.width = (widths && widths[i]) || Math.max(14, columns[i] ? String(columns[i]).length + 2 : 14);
  });
  return ws;
}

export async function buildReportXlsx({ bundle = {}, periodLabel = "", comparisonLabel = "" }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Cleanse Admin";
  wb.created = new Date();

  const s = bundle.summary || {};
  sheet(
    wb,
    "Summary",
    ["Metric", "Value", comparisonLabel ? `${comparisonLabel} (%)` : "vs prev (%)"],
    [
      ["Period", periodLabel, comparisonLabel || ""],
      ["Total Sales", cval(s.totalSales), cdelta(s.totalSales)],
      ["Orders", cval(s.orders), cdelta(s.orders)],
      ["Net Profit", cval(s.netProfit), cdelta(s.netProfit)],
      ["Net Margin (%)", cval(s.netProfitMargin), cdelta(s.netProfitMargin)],
      ["Avg Order Value", cval(s.aov), cdelta(s.aov)],
      ["GMV", cval(s.gmv), cdelta(s.gmv)],
    ],
    [26, 18, 14]
  );

  const p = bundle.profit?.current;
  if (p) {
    sheet(
      wb,
      "P&L",
      ["Line", "Amount"],
      [
        ["Revenue", p.revenue],
        ["COGS", -p.cogs],
        ["Gross Profit", p.grossProfit],
        ["Packaging", -(p.costs?.packaging || 0)],
        ["Shipping", -(p.costs?.shipping || 0)],
        ["Warehouse", -(p.costs?.warehouse || 0)],
        ["Gateway Fees", -(p.costs?.gatewayFees || 0)],
        ["Refunds", -(p.costs?.refunds || 0)],
        ["Net Profit", p.netProfit],
        ["Net Margin (%)", p.netProfitMargin],
      ],
      [22, 18]
    );
  }

  const trend = bundle.salesTrend?.current || [];
  sheet(
    wb,
    "Sales Trend",
    ["Date", "Revenue", "Orders"],
    trend.map((t) => [t.date, t.revenue, t.orderCount]),
    [16, 16, 12]
  );

  const pay = bundle.payments;
  if (pay) {
    sheet(
      wb,
      "Payments",
      ["Method", "Orders", "Revenue", "Share (%)"],
      (pay.mix || []).map((m) => [m.method, m.count, m.revenue, m.sharePct]),
      [16, 12, 16, 12]
    );
  }

  const r = bundle.refunds;
  if (r) {
    sheet(
      wb,
      "Refunds",
      ["Metric", "Value"],
      [
        ["Refunded orders", r.refundCount],
        ["Refund amount", r.refundAmountTotal],
        ["Refund rate (%)", r.refundRate],
        ["Returns pending", r.pendingReturnRequests],
        ...(r.byStatus || []).map((b) => [`Status: ${b.status}`, `${b.count} (${b.amount})`]),
      ],
      [22, 18]
    );
  }

  const loc = bundle.locations;
  if (loc?.byState?.length) {
    sheet(
      wb,
      "Locations",
      ["State", "Revenue", "Orders"],
      loc.byState.map((x) => [x.state, x.revenue, x.orderCount]),
      [22, 16, 12]
    );
  }

  const disc = bundle.discounts;
  if (disc) {
    sheet(
      wb,
      "Discounts",
      ["Type", "Amount"],
      [
        ...Object.entries(disc.breakdown || {}).map(([k, v]) => [k, v]),
        ["Total given", disc.totalDiscountGiven],
        ["% of GMV", disc.discountAsPctOfGmv],
        ["AOV with discount", disc.aovWithDiscount],
        ["AOV without discount", disc.aovWithoutDiscount],
      ],
      [22, 16]
    );
  }

  const c = bundle.customers;
  if (c) {
    sheet(
      wb,
      "Customers",
      ["Metric", "Value"],
      [
        ["New customers", cval(c.newCustomers)],
        ["Repeat purchase rate (%)", c.repeatPurchaseRate],
        ["Referral signups", c.referralSignups],
        ["Referral payout", c.referralPayout],
        ["Reviews to approve", c.pendingReviewApprovals],
        ["Loyalty points outstanding", c.loyaltyLiability],
      ],
      [26, 16]
    );
    if (c.topCustomersBySpend?.length) {
      sheet(
        wb,
        "Top Customers",
        ["Name", "Email", "Spend", "Orders"],
        c.topCustomersBySpend.map((u) => [u.fullName, u.email, u.totalSpend, u.orderCount]),
        [22, 28, 14, 10]
      );
    }
  }

  const ops = bundle.ops;
  if (ops) {
    sheet(
      wb,
      "Operations",
      ["Metric", "Value"],
      [
        ["Pending orders", ops.pendingOrders],
        ["Active orders", ops.activeOrders],
        ["Awaiting pickup", ops.awaitingPickup],
        ["In transit", ops.inTransit],
        ["RTO", ops.rtoCount],
        ["Returns pending", ops.returnsPending],
        ["COD to confirm", ops.codAwaitingConfirmation],
        ["Avg fulfillment (h)", ops.avgFulfillmentHours ?? ""],
      ],
      [24, 14]
    );
  }

  const inv = bundle.inventory;
  if (inv) {
    sheet(
      wb,
      "Inventory",
      ["Product", "Stock"],
      [
        ["Out of stock (count)", inv.outOfStockCount],
        ["Inventory value", inv.inventoryValue],
        ...(inv.lowStockProducts || []).map((pr) => [pr.name, pr.totalStock]),
      ],
      [30, 12]
    );
  }

  const buffer = await wb.xlsx.writeBuffer();
  download(buffer, `cleanse-data-${(periodLabel || "report").toLowerCase().replace(/\s+/g, "-")}.xlsx`);
}
