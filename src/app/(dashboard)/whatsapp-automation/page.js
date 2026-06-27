"use client";

import { useState, useEffect, useCallback } from "react";
import { adminWhatsAppApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

const TABS = [
  { label: "Logs", value: "logs" },
  { label: "Templates", value: "templates" },
  { label: "Manual Trigger", value: "manual" },
];

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Approved", value: "APPROVED" },
  { label: "Pending", value: "PENDING" },
  { label: "Rejected", value: "REJECTED" },
];

const CATEGORY_OPTIONS = [
  { label: "All categories", value: "" },
  { label: "Utility", value: "UTILITY" },
  { label: "Marketing", value: "MARKETING" },
  { label: "Authentication", value: "AUTHENTICATION" },
];

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition-colors";

const STATUS_BADGE = {
  APPROVED: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-600",
};

const CATEGORY_BADGE = {
  UTILITY: "bg-blue-50 text-blue-700",
  MARKETING: "bg-purple-50 text-purple-700",
  AUTHENTICATION: "bg-zinc-100 text-zinc-700",
};

/* ---------- template variable helpers ---------- */

const parsePlaceholders = (text) => {
  const nums = new Set();
  const re = /\{\{(\d+)\}\}/g;
  let m;
  while ((m = re.exec(text || ""))) nums.add(Number(m[1]));
  return [...nums].sort((a, b) => a - b);
};

// Flat list of variables a template needs: { comp, n, index? }
const templateVars = (t) => {
  const out = [];
  for (const c of t?.components || []) {
    if (c.type === "HEADER" && c.format === "TEXT" && c.text) {
      parsePlaceholders(c.text).forEach((n) => out.push({ comp: "header", n }));
    }
    if (c.type === "BODY" && c.text) {
      parsePlaceholders(c.text).forEach((n) => out.push({ comp: "body", n }));
    }
    if (c.type === "BUTTONS") {
      (c.buttons || []).forEach((b, idx) => {
        if (b.type === "URL" && b.url) {
          parsePlaceholders(b.url).forEach((n) => out.push({ comp: "button", n, index: idx }));
        }
      });
    }
  }
  return out;
};

const varKey = (v) => `${v.comp}:${v.index ?? 0}:${v.n}`;

// Build Meta-format components[] from collected values.
const buildComponents = (vars, values) => {
  const header = [];
  const body = [];
  const buttons = {};
  for (const v of vars) {
    const val = values[varKey(v)] || "";
    const param = { type: "text", text: val };
    if (v.comp === "header") header[v.n - 1] = param;
    else if (v.comp === "body") body[v.n - 1] = param;
    else if (v.comp === "button") {
      buttons[v.index] = buttons[v.index] || [];
      buttons[v.index][v.n - 1] = param;
    }
  }
  const comps = [];
  if (header.length) comps.push({ type: "header", parameters: header });
  if (body.length) comps.push({ type: "body", parameters: body });
  Object.entries(buttons).forEach(([idx, parameters]) =>
    comps.push({ type: "button", sub_type: "url", index: String(idx), parameters })
  );
  return comps;
};

/* ---------- template card ---------- */

function TemplateCard({ t }) {
  const header = t.components?.find((c) => c.type === "HEADER");
  const body = t.components?.find((c) => c.type === "BODY");
  const footer = t.components?.find((c) => c.type === "FOOTER");
  const buttons = t.components?.find((c) => c.type === "BUTTONS")?.buttons || [];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-zinc-900">{t.name}</p>
          <p className="text-xs text-zinc-400">{t.language}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE[t.category] || "bg-zinc-100 text-zinc-600"}`}>
            {t.category}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[t.status] || "bg-zinc-100 text-zinc-600"}`}>
            {t.status}
          </span>
        </div>
      </div>

      <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
        {header?.format === "TEXT" && header?.text && (
          <p className="mb-1 font-semibold text-zinc-900">{header.text}</p>
        )}
        {header && header.format !== "TEXT" && (
          <p className="mb-1 text-xs italic text-zinc-400">[{header.format} header]</p>
        )}
        {body?.text && <p className="whitespace-pre-wrap">{body.text}</p>}
        {footer?.text && <p className="mt-2 text-xs text-zinc-400">{footer.text}</p>}
      </div>

      {buttons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {buttons.map((b, i) => (
            <span key={i} className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600">
              {b.type === "URL" ? "🔗 " : b.type === "PHONE_NUMBER" ? "📞 " : "💬 "}
              {b.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- page ---------- */

export default function WhatsAppAutomationPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("logs");

  // Shared: all templates (also feeds the manual trigger select)
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Logs
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsMeta, setLogsMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [logsPage, setLogsPage] = useState(1);

  // Manual trigger
  const [selectedId, setSelectedId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [varValues, setVarValues] = useState({});
  const [sending, setSending] = useState(false);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await adminWhatsAppApi.listTemplates({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        limit: 100,
      });
      setTemplates(res?.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load templates", "error");
    } finally {
      setTemplatesLoading(false);
    }
  }, [statusFilter, categoryFilter, showToast]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await adminWhatsAppApi.getLogs({ page: logsPage, limit: 25 });
      setLogs(res?.data || []);
      setLogsMeta(res?.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load logs", "error");
    } finally {
      setLogsLoading(false);
    }
  }, [logsPage, showToast]);

  useEffect(() => {
    if (activeTab === "templates" || activeTab === "manual") loadTemplates();
  }, [activeTab, loadTemplates]);

  useEffect(() => {
    if (activeTab === "logs") loadLogs();
  }, [activeTab, loadLogs]);

  const selectedTemplate = templates.find((t) => t.id === selectedId);
  const approvedTemplates = templates.filter((t) => t.status === "APPROVED");
  const vars = selectedTemplate ? templateVars(selectedTemplate) : [];

  const onSelectTemplate = (id) => {
    setSelectedId(id);
    setVarValues({});
  };

  const handleSend = async () => {
    if (!selectedTemplate) return showToast("Pick a template", "error");
    const cleanTo = recipient.replace(/\D/g, "");
    if (cleanTo.length < 10) return showToast("Enter a valid phone number", "error");

    setSending(true);
    try {
      const components = buildComponents(vars, varValues);
      const res = await adminWhatsAppApi.sendTemplate({
        to: cleanTo,
        templateName: selectedTemplate.name,
        languageCode: selectedTemplate.language || "en",
        ...(components.length ? { components } : {}),
      });
      showToast(`Sent — ${res?.status || "ok"} (${res?.wamid || "no id"})`, "success");
      if (activeTab === "logs") loadLogs();
    } catch (err) {
      showToast(err.response?.data?.message || "Send failed", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Messaging</p>
        <h1 className="text-xl font-semibold text-zinc-900">WhatsApp Automation</h1>
      </div>
      <p className="mb-4 text-sm text-zinc-500">
        View send logs, browse approved templates, and manually trigger a template message.
      </p>

      {/* Tab switch */}
      <div className="mb-5 flex w-fit items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---------------- LOGS ---------------- */}
      {activeTab === "logs" && (
        <div className="rounded-lg border border-zinc-200 bg-white">
          {logsLoading ? (
            <p className="p-6 text-sm text-zinc-400">Loading logs…</p>
          ) : logs.length === 0 ? (
            <p className="p-6 text-sm text-zinc-400">No messages sent yet.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-400">
                      <th className="px-4 py-3 font-medium">Recipient</th>
                      <th className="px-4 py-3 font-medium">Template</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Message ID</th>
                      <th className="px-4 py-3 font-medium">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l, i) => (
                      <tr key={l.id || l.wamid || i} className="border-b border-zinc-100 text-zinc-700">
                        <td className="px-4 py-3">{l.to || l.recipient || l.phone || "—"}</td>
                        <td className="px-4 py-3">{l.templateName || l.template?.name || l.template || "—"}</td>
                        <td className="px-4 py-3">{l.status || "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-400">{l.wamid || l.id || "—"}</td>
                        <td className="px-4 py-3 text-zinc-500">
                          {l.createdAt || l.sentAt ? new Date(l.createdAt || l.sentAt).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm text-zinc-500">
                <span>{logsMeta.total} total</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={logsPage <= 1}
                    onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-zinc-200 px-3 py-1 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span>{logsMeta.page} / {logsMeta.totalPages || 1}</span>
                  <button
                    disabled={logsPage >= (logsMeta.totalPages || 1)}
                    onClick={() => setLogsPage((p) => p + 1)}
                    className="rounded-md border border-zinc-200 px-3 py-1 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ---------------- TEMPLATES ---------------- */}
      {activeTab === "templates" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} w-auto`}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`${inputClass} w-auto`}>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {templatesLoading ? (
            <p className="text-sm text-zinc-400">Loading templates…</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-zinc-400">No templates found.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {templates.map((t) => (
                <TemplateCard key={t.id} t={t} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------- MANUAL TRIGGER ---------------- */}
      {activeTab === "manual" && (
        <div className="max-w-xl rounded-lg border border-zinc-200 bg-white p-5">
          {templatesLoading ? (
            <p className="text-sm text-zinc-400">Loading templates…</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Template (approved only)</label>
                <select value={selectedId} onChange={(e) => onSelectTemplate(e.target.value)} className={inputClass}>
                  <option value="">Select a template…</option>
                  {approvedTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
                {approvedTemplates.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">No approved templates available to send.</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Recipient phone (with country code)</label>
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="919876543210"
                  className={inputClass}
                />
              </div>

              {selectedTemplate && vars.length > 0 && (
                <div className="flex flex-col gap-3 rounded-lg bg-zinc-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Variables</p>
                  {vars.map((v) => (
                    <div key={varKey(v)}>
                      <label className="mb-1 block text-xs text-zinc-500">
                        {v.comp}{v.comp === "button" ? ` #${v.index + 1}` : ""} — {`{{${v.n}}}`}
                      </label>
                      <input
                        value={varValues[varKey(v)] || ""}
                        onChange={(e) => setVarValues((s) => ({ ...s, [varKey(v)]: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              )}

              {selectedTemplate && vars.length === 0 && (
                <p className="text-xs text-zinc-400">This template has no variables.</p>
              )}

              <button
                onClick={handleSend}
                disabled={sending || !selectedTemplate}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send Message"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
