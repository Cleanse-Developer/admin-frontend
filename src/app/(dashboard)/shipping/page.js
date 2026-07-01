"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrashIcon,
  Pencil1Icon,
  PlusIcon,
  RocketIcon,
} from "@radix-ui/react-icons";
import { adminShippingApi, adminSettingsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import ConfirmDialog from "@/components/confirm-dialog";
import StatusBadge from "@/components/status-badge";
import ZoneForm from "./zone-form";

export default function ShippingZonesPage() {
  const { showToast } = useToast();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editZone, setEditZone] = useState(null); // null = closed, {} = new, zone object = edit
  const [formOpen, setFormOpen] = useState(false);

  // Global (fallback) charges, stored in Settings: applied when no zone overrides.
  // Per payment method — COD and prepaid each get a rate + free-shipping threshold.
  const [shipping, setShipping] = useState({
    prepaid: { STANDARD_RATE: 99, FREE_THRESHOLD: 1200 },
    cod: { STANDARD_RATE: 99, FREE_THRESHOLD: 1200 },
  });
  const [giftWrapCost, setGiftWrapCost] = useState(99);
  const [savingGlobals, setSavingGlobals] = useState(false);

  useEffect(() => {
    adminSettingsApi
      .get()
      .then((data) => {
        const s = data?.SHIPPING;
        if (s) {
          // Accept the new nested per-method shape, falling back to the legacy
          // flat shape ({ STANDARD_RATE, FREE_THRESHOLD }) for older installs.
          const legacy = {
            STANDARD_RATE: s.STANDARD_RATE ?? 99,
            FREE_THRESHOLD: s.FREE_THRESHOLD ?? 1200,
          };
          setShipping({
            prepaid: {
              STANDARD_RATE: s.prepaid?.STANDARD_RATE ?? legacy.STANDARD_RATE,
              FREE_THRESHOLD: s.prepaid?.FREE_THRESHOLD ?? legacy.FREE_THRESHOLD,
            },
            cod: {
              STANDARD_RATE: s.cod?.STANDARD_RATE ?? legacy.STANDARD_RATE,
              FREE_THRESHOLD: s.cod?.FREE_THRESHOLD ?? legacy.FREE_THRESHOLD,
            },
          });
        }
        if (data?.GIFT_WRAP_COST != null) setGiftWrapCost(data.GIFT_WRAP_COST);
      })
      .catch(() => {});
  }, []);

  const setGlobal = (method, field, value) =>
    setShipping((p) => ({ ...p, [method]: { ...p[method], [field]: value } }));

  const saveGlobals = async () => {
    setSavingGlobals(true);
    try {
      await adminSettingsApi.update({
        SHIPPING: {
          prepaid: {
            STANDARD_RATE: Number(shipping.prepaid.STANDARD_RATE),
            FREE_THRESHOLD: Number(shipping.prepaid.FREE_THRESHOLD),
          },
          cod: {
            STANDARD_RATE: Number(shipping.cod.STANDARD_RATE),
            FREE_THRESHOLD: Number(shipping.cod.FREE_THRESHOLD),
          },
        },
        GIFT_WRAP_COST: Number(giftWrapCost),
      });
      showToast("Charges saved", "success");
    } catch {
      showToast("Failed to save charges", "error");
    } finally {
      setSavingGlobals(false);
    }
  };

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminShippingApi.list();
      setZones(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load shipping zones", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminShippingApi.delete(deleteTarget._id);
      showToast("Shipping zone deleted", "success");
      setDeleteTarget(null);
      fetchZones();
    } catch {
      showToast("Failed to delete zone", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (zone) => {
    try {
      await adminShippingApi.update(zone._id, { isActive: !zone.isActive });
      fetchZones();
    } catch {
      showToast("Failed to update zone", "error");
    }
  };

  const openCreate = () => {
    setEditZone(null);
    setFormOpen(true);
  };

  const openEdit = (zone) => {
    setEditZone(zone);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditZone(null);
    fetchZones();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Shipping Zones</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage delivery zones, rates, and serviceability
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {/* Global charges (fallback when no zone overrides), per payment method */}
          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
            <p className="mb-1.5 text-[11px] font-medium text-zinc-500">
              Global charges <span className="font-normal">(used when no zone matches)</span>
            </p>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              {[
                { method: "prepaid", label: "Prepaid" },
                { method: "cod", label: "COD" },
              ].map(({ method, label }) => (
                <div key={method} className="flex items-end gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                      {label} Rate (&#8377;)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={shipping[method].STANDARD_RATE}
                      onChange={(e) => setGlobal(method, "STANDARD_RATE", e.target.value)}
                      placeholder="99"
                      className="w-20 rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                      {label} Free &#8805; (&#8377;)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={shipping[method].FREE_THRESHOLD}
                      onChange={(e) => setGlobal(method, "FREE_THRESHOLD", e.target.value)}
                      placeholder="1200"
                      className="w-24 rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  Gift Wrap (&#8377;)
                </label>
                <input
                  type="number"
                  min="0"
                  value={giftWrapCost}
                  onChange={(e) => setGiftWrapCost(e.target.value)}
                  placeholder="99"
                  className="w-20 rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <button
                onClick={saveGlobals}
                disabled={savingGlobals}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                {savingGlobals ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <PlusIcon className="h-4 w-4" />
            Add Zone
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
          Loading...
        </div>
      ) : zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-zinc-200 bg-white">
          <RocketIcon className="mb-4 h-12 w-12 text-zinc-300" />
          <h3 className="mb-1 text-base font-medium text-zinc-700">No shipping zones</h3>
          <p className="mb-6 text-sm text-zinc-500">Create your first shipping zone to define delivery areas and rates.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <PlusIcon className="h-4 w-4" />
            Add Zone
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Pincodes</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">States</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Prepaid</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">COD</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Est. Days</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr
                    key={zone._id}
                    className="cursor-pointer border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
                    onClick={() => openEdit(zone)}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">{zone.name}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {zone.pincodes?.length || 0} pincode{(zone.pincodes?.length || 0) !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {zone.states?.length > 0
                        ? zone.states.slice(0, 2).join(", ") + (zone.states.length > 2 ? ` +${zone.states.length - 2}` : "")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                      &#8377;{zone.rates?.prepaid?.standard ?? zone.rates?.standard ?? 99}
                      <span className="text-zinc-400"> · free &#8805; &#8377;{zone.rates?.prepaid?.freeAbove ?? zone.rates?.freeAbove ?? 1200}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                      &#8377;{zone.rates?.cod?.standard ?? zone.rates?.standard ?? 99}
                      <span className="text-zinc-400"> · free &#8805; &#8377;{zone.rates?.cod?.freeAbove ?? zone.rates?.freeAbove ?? 1200}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {zone.estimatedDays?.standard || "3-5"} days
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleToggleActive(zone)}>
                        <StatusBadge active={zone.isActive} />
                      </button>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(zone)}
                          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil1Icon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(zone)}
                          className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Shipping Zone"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      {/* Create/Edit form dialog */}
      {formOpen && (
        <ZoneForm
          zone={editZone}
          onClose={() => { setFormOpen(false); setEditZone(null); }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
