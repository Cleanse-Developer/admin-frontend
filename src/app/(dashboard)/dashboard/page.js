"use client";

import { useState, useEffect, useCallback } from "react";
import { adminDashboardApi } from "@/lib/endpoints";

const statusColors = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  returned: "bg-zinc-50 text-zinc-700 border-zinc-200",
};

function StatCard({ label, value, accent = "border-l-zinc-900" }) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-5 border-l-4 ${accent}`}
    >
      <p className="text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </div>
  );
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminDashboardApi.overview();
      setData(result);
    } catch {
      // silently fail – loading state will clear
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-zinc-400">Failed to load dashboard data.</p>
      </div>
    );
  }

  const {
    totalOrders,
    totalRevenue,
    totalCustomers,
    averageOrderValue,
    ordersToday,
    revenueToday,
    recentOrders = [],
    lowStockProducts = [],
  } = data;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Overview of your store
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          accent="border-l-emerald-500"
        />
        <StatCard
          label="Total Orders"
          value={Number(totalOrders || 0).toLocaleString()}
          accent="border-l-blue-500"
        />
        <StatCard
          label="Total Customers"
          value={Number(totalCustomers || 0).toLocaleString()}
          accent="border-l-violet-500"
        />
        <StatCard
          label="Average Order Value"
          value={formatCurrency(averageOrderValue)}
          accent="border-l-amber-500"
        />
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Orders Today"
          value={Number(ordersToday || 0).toLocaleString()}
          accent="border-l-sky-500"
        />
        <StatCard
          label="Revenue Today"
          value={formatCurrency(revenueToday)}
          accent="border-l-teal-500"
        />
      </div>

      {/* Recent Orders */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-zinc-900 mb-3">
          Recent Orders
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">
                    Order #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-zinc-400"
                    >
                      No recent orders
                    </td>
                  </tr>
                ) : (
                  recentOrders.slice(0, 5).map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-blue-600">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        <div>{order.user?.fullName || "—"}</div>
                        <div className="text-xs text-zinc-400">
                          {order.user?.email || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-900 font-medium">
                        {formatCurrency(order.pricing?.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                            statusColors[order.status] ||
                            "bg-zinc-50 text-zinc-700 border-zinc-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low Stock Products */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-zinc-900 mb-3">
          Low Stock Products
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">
                    Product Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">
                    Stock Level
                  </th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-zinc-400"
                    >
                      No low stock products
                    </td>
                  </tr>
                ) : (
                  lowStockProducts.slice(0, 5).map((product) => {
                    const stock = product.totalStock ?? 0;
                    let stockClass = "text-zinc-900";
                    if (stock < 5) {
                      stockClass = "text-red-600 font-semibold";
                    } else if (stock < 10) {
                      stockClass = "text-amber-600 font-semibold";
                    }

                    return (
                      <tr
                        key={product._id}
                        className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-zinc-900">
                          {product.name}
                        </td>
                        <td className={`px-4 py-3 ${stockClass}`}>
                          {stock} in stock
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
