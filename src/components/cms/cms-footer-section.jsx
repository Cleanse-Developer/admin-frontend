"use client";

import { useEffect, useState } from "react";
import { adminCmsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import { DEFAULT_LOCALE, localeKey } from "@/lib/locales";
import CmsFooterEditor from "./cms-footer-editor";
import CmsLegalEditor from "./cms-legal-editor";

/* Self-managed Footer tab. A normal CMS tab edits ONE settings key, but the
   footer conceptually owns three: the footer itself (cmsFooter, which includes
   the editable Support links) plus the two pages those links lead to — the
   Shipping page (cmsShipping) and the Returns page (cmsReturns). Each is a
   separate key with its own save so the one-key-per-PATCH backend contract is
   preserved; they're just grouped under this single tab. */

const KEYS = ["cmsFooter", "cmsShipping", "cmsReturns"];

function Block({ title, description, saving, onSave, children }) {
  return (
    <section className="rounded-lg border border-zinc-200 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-zinc-400">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {children}
    </section>
  );
}

export default function CmsFooterSection({ locale = DEFAULT_LOCALE }) {
  const { showToast } = useToast();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  // `data` holds the CURRENT locale's three sections, keyed by base key. Reload
  // whenever the locale changes; a non-English locale with nothing saved yet is
  // seeded from English (translate-in-place), matching the main CMS page.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all(
      KEYS.map(async (base) => {
        const backendKey = localeKey(base, locale);
        let doc = await adminCmsApi.getSection(backendKey).catch(() => null);
        const isEmpty =
          !doc || (typeof doc === "object" && Object.keys(doc).length === 0);
        if (locale !== DEFAULT_LOCALE && isEmpty) {
          doc = await adminCmsApi.getSection(base).catch(() => ({}));
        }
        return [base, doc || {}];
      })
    )
      .then((entries) => {
        if (!cancelled) setData(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) showToast("Failed to load footer sections", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale, showToast]);

  const setKey = (key, value) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const save = async (base) => {
    setSavingKey(base);
    try {
      const updated = await adminCmsApi.updateSection(
        localeKey(base, locale),
        data[base]
      );
      setKey(base, updated);
      showToast("Saved", "success");
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-zinc-400">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <Block
        title="Footer"
        description="Columns, Support links, socials, contact and copyright."
        saving={savingKey === "cmsFooter"}
        onSave={() => save("cmsFooter")}
      >
        <CmsFooterEditor
          data={data.cmsFooter}
          onChange={(v) => setKey("cmsFooter", v)}
        />
      </Block>

      <Block
        title="Shipping Page"
        description="Content of the page the footer Shipping link opens (/shipping)."
        saving={savingKey === "cmsShipping"}
        onSave={() => save("cmsShipping")}
      >
        <CmsLegalEditor
          data={data.cmsShipping}
          onChange={(v) => setKey("cmsShipping", v)}
        />
      </Block>

      <Block
        title="Returns Page"
        description="Content of the page the footer Returns link opens (/returns)."
        saving={savingKey === "cmsReturns"}
        onSave={() => save("cmsReturns")}
      >
        <CmsLegalEditor
          data={data.cmsReturns}
          onChange={(v) => setKey("cmsReturns", v)}
        />
      </Block>
    </div>
  );
}
