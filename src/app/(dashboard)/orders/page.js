"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArchiveIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ClockIcon,
  CheckIcon,
  Cross1Icon,
  ChatBubbleIcon,
  ReloadIcon,
  ExternalLinkIcon,
} from "@radix-ui/react-icons";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import * as Tabs from "@radix-ui/react-tabs";
import { adminOrderApi, adminShiprocketApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import { useDebounce } from "@/lib/use-debounce";
import DataTable from "@/components/data-table";
import SearchInput from "@/components/search-input";
import SelectFilter from "@/components/select-filter";
import Pagination from "@/components/pagination";

const ORDER_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rto_in_transit", label: "RTO In Transit" },
  { value: "rto_delivered", label: "RTO Delivered" },
  { value: "return_requested", label: "Return Requested" },
  { value: "return_approved", label: "Return Approved" },
  { value: "returned", label: "Returned" },
  { value: "refund_initiated", label: "Refund Initiated" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_STATUSES = [
  { value: "all", label: "All Payments" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

// Mirrors backend VALID_TRANSITIONS (admin/order.controller.js).
const VALID_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["in_transit", "rto_in_transit"],
  in_transit: ["out_for_delivery", "rto_in_transit"],
  out_for_delivery: ["delivered", "rto_in_transit"],
  delivered: ["return_requested"],
  rto_in_transit: ["rto_delivered"],
  rto_delivered: ["refund_initiated"],
  return_requested: ["return_approved", "delivered"],
  return_approved: ["returned"],
  returned: ["refund_initiated"],
  refund_initiated: ["refunded"],
  cancelled: ["refund_initiated"],
};

function statusColor(status) {
  switch (status) {
    case "delivered":
      return "bg-green-50 text-green-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    case "refunded":
    case "returned":
    case "refund_initiated":
      return "bg-zinc-100 text-zinc-600";
    case "rto_in_transit":
    case "rto_delivered":
      return "bg-orange-50 text-orange-700";
    case "return_requested":
    case "return_approved":
      return "bg-amber-50 text-amber-700";
    case "shipped":
    case "in_transit":
    case "out_for_delivery":
      return "bg-blue-50 text-blue-700";
    case "pending":
      return "bg-zinc-100 text-zinc-500";
    default:
      return "bg-zinc-50 text-zinc-600";
  }
}

function paymentColor(status) {
  switch (status) {
    case "paid":
      return "bg-green-50 text-green-700";
    case "failed":
      return "bg-red-50 text-red-700";
    case "refunded":
      return "bg-zinc-100 text-zinc-600";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function StatusBadge({ status }) {
  const label = status?.replace(/_/g, " ") || "unknown";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(status)}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "delivered"
            ? "bg-green-500"
            : status === "cancelled"
              ? "bg-red-500"
              : ["shipped", "in_transit", "out_for_delivery"].includes(status)
                ? "bg-blue-500"
                : ["return_requested", "return_approved"].includes(status)
                  ? "bg-amber-500"
                  : "bg-zinc-400"
        }`}
      />
      {label}
    </span>
  );
}

function PaymentBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${paymentColor(status)}`}
    >
      {status || "pending"}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COLUMNS = [
  { key: "orderId", label: "Order", sortable: true, sortKey: "orderId" },
  { key: "customer", label: "Customer" },
  { key: "items", label: "Items", className: "hidden sm:table-cell" },
  { key: "total", label: "Total", sortable: true, sortKey: "pricing.total" },
  { key: "payment", label: "Payment", className: "hidden md:table-cell" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date", sortable: true, sortKey: "createdAt" },
  { key: "actions", label: "", width: "40px" },
];

export default function OrdersPage() {
  const { showToast } = useToast();

  // List state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sort, setSort] = useState("-createdAt");

  const debouncedSearch = useDebounce(search, 300);

  // Detail dialog
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // Status update
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Notes
  const [noteText, setNoteText] = useState("");
  const [noteAdding, setNoteAdding] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (paymentFilter && paymentFilter !== "all") params.paymentStatus = paymentFilter;

      const data = await adminOrderApi.list(params);
      setOrders(data.orders || []);
      if (data.pagination) {
        setPagination((prev) => ({
          ...prev,
          page: data.pagination.page,
          pages: data.pagination.pages,
          total: data.pagination.total,
        }));
      }
    } catch {
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sort, debouncedSearch, statusFilter, paymentFilter, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, statusFilter, paymentFilter]);

  const handleSort = (field) => {
    setSort((prev) => (prev === field ? `-${field}` : prev === `-${field}` ? field : `-${field}`));
  };

  const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
  const sortDir = sort.startsWith("-") ? "desc" : "asc";

  // Open order detail
  const openDetail = async (order) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setNewStatus("");
    setStatusNote("");
    setNoteText("");
    try {
      const data = await adminOrderApi.get(order._id);
      setSelectedOrder(data.order || data);
    } catch {
      showToast("Failed to load order details", "error");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Update status
  const handleStatusUpdate = async () => {
    if (!newStatus || !selectedOrder) return;
    setStatusUpdating(true);
    try {
      const data = await adminOrderApi.updateStatus(selectedOrder._id, newStatus, statusNote || undefined);
      setSelectedOrder(data.order || data);
      setNewStatus("");
      setStatusNote("");
      showToast("Order status updated", "success");
      fetchOrders();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update status", "error");
    } finally {
      setStatusUpdating(false);
    }
  };

  // Add note
  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedOrder) return;
    setNoteAdding(true);
    try {
      const data = await adminOrderApi.addNote(selectedOrder._id, noteText.trim());
      setSelectedOrder(data.order || data);
      setNoteText("");
      showToast("Note added", "success");
    } catch {
      showToast("Failed to add note", "error");
    } finally {
      setNoteAdding(false);
    }
  };

  const availableTransitions = selectedOrder ? VALID_TRANSITIONS[selectedOrder.status] || [] : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Orders</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage and track all customer orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="w-full sm:w-72">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by order ID or name..."
          />
        </div>
        <SelectFilter
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="All Statuses"
          options={ORDER_STATUSES}
        />
        <SelectFilter
          value={paymentFilter}
          onValueChange={setPaymentFilter}
          placeholder="All Payments"
          options={PAYMENT_STATUSES}
        />
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          <ReloadIcon className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Table */}
      {!loading && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-zinc-200 bg-white">
          <ArchiveIcon className="mb-4 h-12 w-12 text-zinc-300" />
          <h3 className="mb-1 text-base font-medium text-zinc-700">No orders found</h3>
          <p className="text-sm text-zinc-500">
            {search || (statusFilter && statusFilter !== "all") || (paymentFilter && paymentFilter !== "all")
              ? "Try adjusting your search or filters"
              : "Orders will appear here when customers place them"}
          </p>
        </div>
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            data={orders}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            isLoading={loading}
            renderRow={(order) => (
              <tr
                key={order._id}
                className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 cursor-pointer"
                onClick={() => openDetail(order)}
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-zinc-900 text-xs tracking-wide">
                    {order.orderId}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-zinc-900 truncate max-w-[160px]">
                    {order.user?.fullName || order.shippingAddress?.fullName || "—"}
                  </p>
                  <p className="text-xs text-zinc-400 truncate max-w-[160px]">
                    {order.user?.email || order.contactEmail || ""}
                  </p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-sm text-zinc-600">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-zinc-900">
                    &#8377;{order.pricing?.total?.toLocaleString("en-IN") || "0"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <PaymentBadge status={order.payment?.status} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-zinc-400">
                    {formatDate(order.createdAt)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ChevronRightIcon className="h-4 w-4 text-zinc-300" />
                </td>
              </tr>
            )}
          />
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
          />
        </>
      )}

      {/* Order Detail Dialog */}
      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
          <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl focus:outline-none" aria-describedby={undefined}>
            <VisuallyHidden.Root>
              <Dialog.Title>Order Details</Dialog.Title>
            </VisuallyHidden.Root>
            {detailLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
              </div>
            ) : selectedOrder ? (
              <OrderDetail
                order={selectedOrder}
                onClose={() => setDetailOpen(false)}
                availableTransitions={availableTransitions}
                newStatus={newStatus}
                setNewStatus={setNewStatus}
                statusNote={statusNote}
                setStatusNote={setStatusNote}
                statusUpdating={statusUpdating}
                onStatusUpdate={handleStatusUpdate}
                noteText={noteText}
                setNoteText={setNoteText}
                noteAdding={noteAdding}
                onAddNote={handleAddNote}
                onUpdated={(o) => {
                  setSelectedOrder(o);
                  fetchOrders();
                }}
              />
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function OrderDetail({
  order,
  onClose,
  availableTransitions,
  newStatus,
  setNewStatus,
  statusNote,
  setStatusNote,
  statusUpdating,
  onStatusUpdate,
  noteText,
  setNoteText,
  noteAdding,
  onAddNote,
  onUpdated,
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Order {order.orderId}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <Dialog.Close asChild>
          <button className="rounded p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors">
            <Cross1Icon className="h-4 w-4" />
          </button>
        </Dialog.Close>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <Tabs.Root defaultValue="details" className="flex flex-col h-full">
          <Tabs.List className="flex border-b border-zinc-200 px-6">
            <Tabs.Trigger
              value="details"
              className="px-4 py-2.5 text-sm font-medium text-zinc-400 border-b-2 border-transparent transition-colors data-[state=active]:text-zinc-900 data-[state=active]:border-zinc-900"
            >
              Details
            </Tabs.Trigger>
            <Tabs.Trigger
              value="shipment"
              className="px-4 py-2.5 text-sm font-medium text-zinc-400 border-b-2 border-transparent transition-colors data-[state=active]:text-zinc-900 data-[state=active]:border-zinc-900"
            >
              Shipment
            </Tabs.Trigger>
            <Tabs.Trigger
              value="notes"
              className="px-4 py-2.5 text-sm font-medium text-zinc-400 border-b-2 border-transparent transition-colors data-[state=active]:text-zinc-900 data-[state=active]:border-zinc-900"
            >
              Notes ({order.adminNotes?.length || 0})
            </Tabs.Trigger>
          </Tabs.List>

          {/* Details Tab */}
          <Tabs.Content value="details" className="flex-1 p-6 space-y-6">
            {/* Status + Payment row */}
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              <PaymentBadge status={order.payment?.status} />
              {order.payment?.method && (
                <span className="text-xs text-zinc-400 uppercase tracking-wide">
                  {order.payment.method}
                </span>
              )}
            </div>

            {/* Status Update */}
            {availableTransitions.length > 0 && (
              <div className="rounded-lg border border-zinc-200 p-4 space-y-3">
                <p className="text-sm font-medium text-zinc-700">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {availableTransitions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewStatus(s)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        newStatus === s
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
                {newStatus && (
                  <>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Optional note..."
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
                    />
                    <button
                      onClick={onStatusUpdate}
                      disabled={statusUpdating}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {statusUpdating ? (
                        <ReloadIcon className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircledIcon className="h-3.5 w-3.5" />
                      )}
                      Update to {newStatus.replace(/_/g, " ")}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Return request actions */}
            {order.status === "return_requested" && (
              <ReturnRequestActions order={order} onUpdated={onUpdated} />
            )}

            {/* Customer Info */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Customer</h3>
              <div className="rounded-lg border border-zinc-200 p-4 space-y-1">
                <p className="text-sm font-medium text-zinc-900">
                  {order.user?.fullName || order.shippingAddress?.fullName || "Guest"}
                </p>
                <p className="text-sm text-zinc-500">
                  {order.user?.email || order.contactEmail || "—"}
                </p>
                <p className="text-sm text-zinc-500">
                  {order.user?.phone
                    ? `${order.user.countryCode || "+91"} ${order.user.phone}`
                    : (order.contactPhone || "—")}
                </p>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Shipping Address</h3>
              <div className="rounded-lg border border-zinc-200 p-4 space-y-0.5">
                <p className="text-sm text-zinc-900">{order.shippingAddress?.fullName}</p>
                <p className="text-sm text-zinc-500">{order.shippingAddress?.address1}</p>
                {order.shippingAddress?.address2 && (
                  <p className="text-sm text-zinc-500">{order.shippingAddress.address2}</p>
                )}
                <p className="text-sm text-zinc-500">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
                </p>
                {order.shippingAddress?.phone && (
                  <p className="text-sm text-zinc-400 mt-1">
                    {order.shippingAddress.countryCode || "+91"} {order.shippingAddress.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Items ({order.items?.length || 0})
              </h3>
              <div className="rounded-lg border border-zinc-200 divide-y divide-zinc-100">
                {(order.items || []).map((item, idx) => {
                  const product = item.product;
                  const primaryImg = product?.images?.find((i) => i.isPrimary)?.url || product?.images?.[0]?.url;
                  const img = item.image || primaryImg || "/images/placeholder.jpg";
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3">
                      <img
                        src={img}
                        alt={item.name}
                        className="h-12 w-12 rounded-lg object-cover bg-zinc-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
                        <p className="text-xs text-zinc-400">
                          Qty: {item.quantity}
                          {item.selectedSize ? ` / Size: ${item.selectedSize}` : ""}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-zinc-900 shrink-0">
                        &#8377;{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Pricing</h3>
              <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="text-zinc-700">&#8377;{order.pricing?.subtotal?.toLocaleString("en-IN") || "0"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Shipping</span>
                  <span className="text-zinc-700">&#8377;{order.pricing?.shipping?.toLocaleString("en-IN") || "0"}</span>
                </div>
                {order.pricing?.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Discount</span>
                    <span className="text-green-600">-&#8377;{order.pricing.discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-zinc-100">
                  <span className="text-zinc-900">Total</span>
                  <span className="text-zinc-900">&#8377;{order.pricing?.total?.toLocaleString("en-IN") || "0"}</span>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            {(order.shipping?.awbNumber || order.shipping?.courierName) && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Shipping Info</h3>
                <div className="rounded-lg border border-zinc-200 p-4 space-y-1">
                  {order.shipping.courierName && (
                    <p className="text-sm text-zinc-700">Courier: {order.shipping.courierName}</p>
                  )}
                  {order.shipping.awbNumber && (
                    <p className="text-sm text-zinc-700">AWB: {order.shipping.awbNumber}</p>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Timeline</h3>
              <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
                <TimelineRow label="Ordered" date={order.createdAt} />
                <TimelineRow label="Confirmed" date={order.confirmedAt} />
                <TimelineRow label="Shipped" date={order.shippedAt} />
                <TimelineRow label="Delivered" date={order.deliveredAt} />
                {order.cancelledAt && <TimelineRow label="Cancelled" date={order.cancelledAt} />}
              </div>
            </div>
          </Tabs.Content>

          {/* Shipment Tab */}
          <Tabs.Content value="shipment" className="flex-1 p-6">
            <ShipmentTab order={order} onUpdated={onUpdated} />
          </Tabs.Content>

          {/* Notes Tab */}
          <Tabs.Content value="notes" className="flex-1 p-6 space-y-4">
            {/* Add note */}
            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 resize-none"
              />
              <button
                onClick={onAddNote}
                disabled={!noteText.trim() || noteAdding}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                {noteAdding ? (
                  <ReloadIcon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ChatBubbleIcon className="h-3.5 w-3.5" />
                )}
                Add Note
              </button>
            </div>

            {/* Notes list */}
            <div className="space-y-3">
              {(order.adminNotes || []).length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">No notes yet</p>
              ) : (
                [...(order.adminNotes || [])].reverse().map((note, idx) => (
                  <div key={idx} className="rounded-lg border border-zinc-200 p-3 space-y-1">
                    <p className="text-sm text-zinc-700">{note.note}</p>
                    <p className="text-xs text-zinc-400">
                      {note.addedBy?.fullName || "Admin"} &middot; {formatDateTime(note.addedAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}

function TimelineRow({ label, date }) {
  if (!date) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-xs text-zinc-400">{formatDateTime(date)}</span>
    </div>
  );
}

function ReturnRequestActions({ order, onUpdated }) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const act = async (action) => {
    setBusy(true);
    try {
      const data = await adminOrderApi.approveReturn(order._id, action);
      onUpdated(data.order || data);
      showToast(`Return ${action}d`, "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-2">
      <p className="text-sm font-medium text-amber-800">Return requested</p>
      {order.returnRequest?.reason && (
        <p className="text-xs text-amber-700">Reason: {order.returnRequest.reason}</p>
      )}
      <p className="text-xs text-zinc-500">
        Approving creates a Shiprocket reverse-pickup automatically.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => act("approve")}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          <CheckIcon className="h-3.5 w-3.5" /> Approve
        </button>
        <button
          onClick={() => act("reject")}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
        >
          <Cross1Icon className="h-3.5 w-3.5" /> Reject
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-zinc-400 shrink-0">{label}</span>
      <span className={`text-xs text-zinc-700 text-right break-all ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

function ShipmentTab({ order, onUpdated }) {
  const { showToast } = useToast();
  const s = order.shipping || {};
  const [busy, setBusy] = useState(""); // which action is running
  const [couriers, setCouriers] = useState(null);
  const [courierId, setCourierId] = useState("");
  const [tracking, setTracking] = useState(null);
  const [ndrComment, setNdrComment] = useState("");

  // Wrap an adminShiprocketApi call: set busy, run, update order, toast.
  const run = async (key, fn, successMsg) => {
    setBusy(key);
    try {
      const data = await fn();
      if (data?.order) onUpdated(data.order);
      if (successMsg) showToast(successMsg, "success");
      return data;
    } catch (err) {
      showToast(err?.response?.data?.message || "Operation failed", "error");
      return null;
    } finally {
      setBusy("");
    }
  };

  const openUrl = (url) => {
    if (url) window.open(url, "_blank", "noopener");
    else showToast("No document URL returned", "error");
  };

  const checkCouriers = async () => {
    const data = await run("serviceability", () => adminShiprocketApi.serviceability(order._id));
    if (data?.serviceability) setCouriers(data.serviceability.couriers || []);
  };

  const doTrack = async () => {
    const data = await run("track", () => adminShiprocketApi.track(order._id));
    if (data?.tracking) setTracking(data.tracking);
  };

  const created = !!s.shiprocketOrderId;
  const hasShipment = !!s.shipmentId;
  const hasAwb = !!s.awbNumber;

  const Btn = ({ k, onClick, children, disabled, variant = "secondary" }) => (
    <button
      onClick={onClick}
      disabled={!!busy || disabled}
      className={
        variant === "primary"
          ? "inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          : variant === "danger"
            ? "inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            : "inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
      }
    >
      {busy === k ? <ReloadIcon className="h-3.5 w-3.5 animate-spin" /> : children}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Shiprocket</h3>
          <div className="flex gap-1.5">
            {s.isRTO && (
              <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700">RTO</span>
            )}
            {s.ndrAttempts > 0 && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                NDR ×{s.ndrAttempts}
              </span>
            )}
          </div>
        </div>
        <InfoRow label="Order ID" value={s.shiprocketOrderId} mono />
        <InfoRow label="Shipment ID" value={s.shipmentId} mono />
        <InfoRow label="AWB" value={s.awbNumber} mono />
        <InfoRow label="Courier" value={s.courierName} />
        <InfoRow label="Tracking status" value={s.lastTrackingStatus ? `${s.lastTrackingStatus}${s.lastTrackingStatusId ? ` (${s.lastTrackingStatusId})` : ""}` : null} />
        <InfoRow label="Pickup" value={s.pickupScheduledDate ? formatDateTime(s.pickupScheduledDate) : null} />
        <InfoRow label="ETA" value={s.estimatedDelivery ? formatDate(s.estimatedDelivery) : null} />
        <InfoRow label="Last update" value={s.lastWebhookAt ? formatDateTime(s.lastWebhookAt) : null} />
        {s.trackingUrl && (
          <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <ExternalLinkIcon className="h-3 w-3" /> Public tracking
          </a>
        )}
      </div>

      {/* Create / sync */}
      {!created && (
        <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
          <p className="text-sm text-zinc-600">No Shiprocket order yet.</p>
          <Btn k="sync" variant="primary" onClick={() => run("sync", () => adminShiprocketApi.sync(order._id), "Shiprocket order created")}>
            <ReloadIcon className="h-3.5 w-3.5" /> Create Shiprocket order
          </Btn>
        </div>
      )}

      {/* AWB / courier */}
      {created && !hasAwb && (
        <div className="rounded-lg border border-zinc-200 p-4 space-y-3">
          <p className="text-sm font-medium text-zinc-700">Assign AWB</p>
          <div className="flex flex-wrap items-center gap-2">
            <Btn k="serviceability" onClick={checkCouriers}>Check couriers</Btn>
            {couriers && (
              <select
                value={courierId}
                onChange={(e) => setCourierId(e.target.value)}
                className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs outline-none focus:border-zinc-400"
              >
                <option value="">Auto (recommended)</option>
                {couriers.map((c) => (
                  <option key={c.courierId} value={c.courierId}>
                    {c.name} — ₹{c.rate} / {c.estimatedDays}d
                  </option>
                ))}
              </select>
            )}
            <Btn k="awb" variant="primary" disabled={!hasShipment} onClick={() => run("awb", () => adminShiprocketApi.assignAwb(order._id, courierId || undefined), "AWB assigned")}>
              Assign AWB
            </Btn>
          </div>
        </div>
      )}

      {/* Operations */}
      {created && (
        <div className="rounded-lg border border-zinc-200 p-4 space-y-3">
          <p className="text-sm font-medium text-zinc-700">Operations</p>
          <div className="flex flex-wrap gap-2">
            <Btn k="pickup" disabled={!hasShipment} onClick={() => run("pickup", () => adminShiprocketApi.pickup(order._id), "Pickup scheduled")}>Schedule pickup</Btn>
            <Btn k="label" disabled={!hasShipment} onClick={async () => { const d = await run("label", () => adminShiprocketApi.label(order._id)); openUrl(d?.url); }}>Label</Btn>
            <Btn k="manifest" disabled={!hasShipment} onClick={async () => { const d = await run("manifest", () => adminShiprocketApi.manifest(order._id)); openUrl(d?.url); }}>Manifest</Btn>
            <Btn k="invoice" onClick={async () => { const d = await run("invoice", () => adminShiprocketApi.invoice(order._id)); openUrl(d?.url); }}>Invoice</Btn>
            <Btn k="track" disabled={!hasAwb} onClick={doTrack}>Track</Btn>
            <Btn k="cancel" variant="danger" onClick={() => run("cancel", () => adminShiprocketApi.cancel(order._id), "Cancellation requested")}>Cancel shipment</Btn>
          </div>

          {/* NDR */}
          {hasAwb && (
            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <p className="text-xs font-medium text-zinc-500">NDR action</p>
              <input
                type="text"
                value={ndrComment}
                onChange={(e) => setNdrComment(e.target.value)}
                placeholder="Comment (required)"
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs outline-none focus:border-zinc-400"
              />
              <div className="flex gap-2">
                <Btn k="ndr-re" disabled={!ndrComment.trim()} onClick={() => run("ndr-re", () => adminShiprocketApi.ndr(order._id, "re-attempt", ndrComment), "Re-attempt requested")}>Re-attempt</Btn>
                <Btn k="ndr-ret" variant="danger" disabled={!ndrComment.trim()} onClick={() => run("ndr-ret", () => adminShiprocketApi.ndr(order._id, "return", ndrComment), "RTO requested")}>Return (RTO)</Btn>
              </div>
            </div>
          )}

          {/* Manual return */}
          {order.status === "delivered" && !s.returnShipment?.shipmentId && (
            <div className="pt-2 border-t border-zinc-100">
              <Btn k="return" onClick={() => run("return", () => adminShiprocketApi.createReturn(order._id), "Return pickup created")}>Create return pickup</Btn>
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      {(s.labelUrl || s.manifestUrl) && (
        <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Documents</h3>
          {s.labelUrl && (
            <a href={s.labelUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
              <ExternalLinkIcon className="h-3 w-3" /> Shipping label
            </a>
          )}
          {s.manifestUrl && (
            <a href={s.manifestUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
              <ExternalLinkIcon className="h-3 w-3" /> Manifest
            </a>
          )}
        </div>
      )}

      {/* Return shipment */}
      {s.returnShipment?.shipmentId && (
        <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Return shipment</h3>
          <InfoRow label="AWB" value={s.returnShipment.awbNumber} mono />
          <InfoRow label="Courier" value={s.returnShipment.courierName} />
          {s.returnShipment.trackingUrl && (
            <a href={s.returnShipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <ExternalLinkIcon className="h-3 w-3" /> Track return
            </a>
          )}
        </div>
      )}

      {/* Tracking scans */}
      {tracking && (
        <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tracking</h3>
          <TrackingScans tracking={tracking} />
        </div>
      )}
    </div>
  );
}

// Render the scan history from a Shiprocket track-by-AWB response (shape varies).
function TrackingScans({ tracking }) {
  const data = tracking?.tracking_data || tracking;
  const activities =
    data?.shipment_track_activities ||
    data?.shipment_track ||
    data?.scans ||
    [];
  if (!Array.isArray(activities) || activities.length === 0) {
    return <p className="text-xs text-zinc-400">No tracking activity yet.</p>;
  }
  return (
    <ol className="space-y-2">
      {activities.map((a, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
          <div>
            <p className="text-xs text-zinc-700">{a.activity || a.status || a["sr-status-label"] || "—"}</p>
            <p className="text-[11px] text-zinc-400">
              {[a.location, a.date || a.time].filter(Boolean).join(" · ")}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
