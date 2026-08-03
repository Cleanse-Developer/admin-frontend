"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ReloadIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import { MessageCircle, TriangleAlert } from "lucide-react";
import { adminShiprocketApi, adminSettingsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import Toggle from "@/components/toggle";
import {
  TextField,
  TextArea,
  StringList,
  SectionHeading,
} from "@/components/cms/cms-editor-kit";

// Mirrors CMS_DEFAULTS.maintenance in the backend. Needed locally because
// GET /admin/settings returns raw docs with no defaults applied — same reason the
// Settings page keeps its own DEFAULTS for loyalty_config.
const MAINTENANCE_DEFAULTS = {
  enabled: false,
  eyebrow: "Pardon the pause",
  heading: "We are tending\nto something",
  message:
    "Our shelves are being restocked and our rituals refined. Cleanse will reopen shortly.",
  revisitNote: "Please look in on us again in a little while.",
  email: "",
  phone: "",
  whatsapp: "",
  addressLines: [],
  showBranches: true,
};

export default function DeveloperOptionsPage() {
  const { showToast } = useToast();
  const [mode, setMode] = useState(null); // "live" | "test"
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminShiprocketApi.getMode();
      setMode(data.mode);
    } catch {
      showToast("Failed to load shipping mode", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const switchMode = async (next) => {
    if (next === mode) return;
    setSaving(next);
    try {
      const data = await adminShiprocketApi.setMode(next);
      setMode(data.mode);
      showToast(`Shipping switched to ${data.mode === "test" ? "Test" : "Live"} mode`, "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to switch mode", "error");
    } finally {
      setSaving("");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Developer Options</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Advanced controls. Changes apply instantly — no developer or deployment needed.
        </p>
      </div>

      {/* Shipping section */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5 max-w-3xl">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Shipping</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Choose whether shipping actions really happen, or are only pretended for practice.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <ReloadIcon className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {/* Toggle */}
            <div className="inline-flex rounded-lg border border-zinc-200 p-1">
              <ModeButton
                active={mode === "live"}
                busy={saving === "live"}
                onClick={() => switchMode("live")}
                label="Live"
              />
              <ModeButton
                active={mode === "test"}
                busy={saving === "test"}
                onClick={() => switchMode("test")}
                label="Test"
              />
            </div>
            <p className="text-xs text-zinc-500">
              Currently in{" "}
              <span className={`font-semibold ${mode === "live" ? "text-green-700" : "text-amber-700"}`}>
                {mode === "live" ? "Live" : "Test"}
              </span>{" "}
              mode.
            </p>

            {/* Explanations */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <ModeCard
                title="Live"
                tone="green"
                current={mode === "live"}
                bullets={[
                  "Real orders are created with the courier company.",
                  "Real tracking numbers and pickups are booked.",
                  "Your Shiprocket wallet is actually charged for shipping.",
                  "Couriers physically pick up, deliver, and (for COD) collect cash.",
                  "Order status updates automatically as the parcel moves.",
                  "Use this for real customer orders.",
                ]}
              />
              <ModeCard
                title="Test"
                tone="amber"
                current={mode === "test"}
                bullets={[
                  "Nothing is sent to the courier — everything is pretended.",
                  "Fake tracking numbers are shown so you can practice the flow.",
                  "Your wallet is never charged and no courier is booked.",
                  "No one will actually come to pick up or deliver anything.",
                  "Safe for training staff or trying buttons without consequences.",
                  "Switch back to Live before taking real orders.",
                ]}
              />
            </div>

            <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-3">
              <p className="text-xs text-amber-800">
                Tip: while in Test mode, real customer orders will <strong>not</strong> be shipped.
                Remember to return to Live mode.
              </p>
            </div>
          </>
        )}
      </div>

      {/* WhatsApp Automation section */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4 max-w-3xl mt-6">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">WhatsApp Automation</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage automated WhatsApp messages and flows.
          </p>
        </div>
        <Link
          href="/whatsapp-automation"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
        >
          <MessageCircle className="h-4 w-4" />
          Open WhatsApp Automation
        </Link>
      </div>

      {/* Maintenance mode */}
      <MaintenanceSection />
    </div>
  );
}

/* Maintenance mode: the switch and every field the storefront screen renders, in one
   card. Kept as its own component so the Shiprocket state above stays untangled from
   it — the two share nothing but the page they sit on. */
function MaintenanceSection() {
  const { showToast } = useToast();
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Turning maintenance ON takes the public storefront down, so it goes through a
  // confirm step. Every other switch on this page is reversible in a click.
  const [confirmOn, setConfirmOn] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSettingsApi.get();
      setCfg({ ...MAINTENANCE_DEFAULTS, ...(data?.maintenance || {}) });
    } catch {
      showToast("Failed to load maintenance settings", "error");
      setCfg({ ...MAINTENANCE_DEFAULTS });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (field, value) => setCfg((c) => ({ ...c, [field]: value }));

  // `next` lets the caller save a state it just computed, so flipping the switch can
  // persist immediately rather than waiting for the next render's cfg.
  const save = async (next) => {
    const payload = next || cfg;
    setSaving(true);
    try {
      const data = await adminSettingsApi.update({
        maintenance: {
          enabled: !!payload.enabled,
          eyebrow: payload.eyebrow || "",
          heading: payload.heading || "",
          message: payload.message || "",
          revisitNote: payload.revisitNote || "",
          email: payload.email || "",
          phone: payload.phone || "",
          whatsapp: payload.whatsapp || "",
          addressLines: (payload.addressLines || []).filter(Boolean),
          showBranches: payload.showBranches !== false,
        },
      });
      if (data?.maintenance) {
        setCfg({ ...MAINTENANCE_DEFAULTS, ...data.maintenance });
      }
      showToast(
        payload.enabled
          ? "Maintenance mode is ON — the storefront is down"
          : "Maintenance settings saved",
        payload.enabled ? "error" : "success"
      );
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to save maintenance settings",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggle = (value) => {
    if (value) {
      setConfirmOn(true); // don't flip until confirmed
      return;
    }
    setConfirmOn(false);
    const next = { ...cfg, enabled: false };
    setCfg(next);
    save(next);
  };

  const confirmTurnOn = () => {
    setConfirmOn(false);
    const next = { ...cfg, enabled: true };
    setCfg(next);
    save(next);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5 max-w-3xl mt-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">Maintenance Mode</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Replace the entire storefront with a holding page. Everything shown on that
          page is edited here.
        </p>
      </div>

      {loading || !cfg ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <ReloadIcon className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {/* Persistent reminder while the store is down. */}
          {cfg.enabled && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-xs text-red-800">
                <strong>The storefront is currently down.</strong> Every visitor sees
                the maintenance page instead of the shop. Turn this off to reopen.
              </p>
            </div>
          )}

          <Toggle
            checked={!!cfg.enabled}
            onCheckedChange={toggle}
            disabled={saving}
            label="Show maintenance page instead of the storefront"
            description="Takes effect within about 5 seconds. The admin panel is unaffected."
          />

          {confirmOn && (
            <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-3 space-y-2.5">
              <p className="text-xs text-amber-800">
                This replaces the storefront for <strong>all visitors</strong> — nobody
                will be able to browse or place an order until you turn it back off.
                Orders already placed are unaffected.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={confirmTurnOn}
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  Turn on maintenance
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOn(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3 border-t border-zinc-100 pt-5">
            <SectionHeading>Message</SectionHeading>
            <TextField
              label="Eyebrow (small text above the heading)"
              value={cfg.eyebrow}
              onChange={(v) => update("eyebrow", v)}
              placeholder="Pardon the pause"
            />
            <TextArea
              label="Heading"
              hint="Press Enter for a line break — each line animates in on its own."
              rows={2}
              value={cfg.heading}
              onChange={(v) => update("heading", v)}
              placeholder={"We are tending\nto something"}
            />
            <TextArea
              label="What's happening"
              hint="Explain the situation in a sentence or two."
              rows={3}
              value={cfg.message}
              onChange={(v) => update("message", v)}
            />
            <TextField
              label="Come-back-later line"
              value={cfg.revisitNote}
              onChange={(v) => update("revisitNote", v)}
              placeholder="Please look in on us again in a little while."
            />
          </div>

          <div className="space-y-3 border-t border-zinc-100 pt-5">
            <SectionHeading>Contact details</SectionHeading>
            <p className="text-xs text-zinc-400">
              Leave a field blank to reuse the contact details from Homepage → Footer,
              so they only have to be kept up to date in one place.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField
                label="Email"
                value={cfg.email}
                onChange={(v) => update("email", v)}
                placeholder="care@cleanseayurveda.com"
              />
              <TextField
                label="Phone"
                value={cfg.phone}
                onChange={(v) => update("phone", v)}
                placeholder="+91 80000 00000"
              />
            </div>
            <TextField
              label="WhatsApp number"
              hint="Shown only if filled. Digits and country code, e.g. 919876543210."
              value={cfg.whatsapp}
              onChange={(v) => update("whatsapp", v)}
            />
            <StringList
              label="Address lines"
              hint="Blank inherits the footer address."
              value={cfg.addressLines}
              onChange={(v) => update("addressLines", v)}
              placeholder="42 Wellness Avenue, Bandra West"
              addLabel="Add line"
            />
          </div>

          <div className="space-y-3 border-t border-zinc-100 pt-5">
            <SectionHeading>Appearance</SectionHeading>
            <Toggle
              checked={cfg.showBranches !== false}
              onCheckedChange={(v) => update("showBranches", v)}
              label="Show the botanical branches"
              description="The illustrated branches that grow in from the bottom corners."
            />
          </div>

          <div className="flex justify-end border-t border-zinc-100 pt-5">
            <button
              type="button"
              onClick={() => save()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? <ReloadIcon className="h-3.5 w-3.5 animate-spin" /> : null}
              Save maintenance page
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ModeButton({ active, busy, onClick, label }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-md px-6 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {busy ? <ReloadIcon className="h-3.5 w-3.5 animate-spin" /> : null}
      {label}
    </button>
  );
}

function ModeCard({ title, tone, current, bullets }) {
  const ring = tone === "green" ? "border-green-200" : "border-amber-200";
  const dot = tone === "green" ? "text-green-600" : "text-amber-600";
  return (
    <div className={`rounded-lg border ${current ? ring : "border-zinc-200"} p-4`}>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {current && (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
            <CheckCircledIcon className="h-3 w-3" /> active
          </span>
        )}
      </div>
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-xs text-zinc-600">
            <span className={`mt-1 ${dot}`}>•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
