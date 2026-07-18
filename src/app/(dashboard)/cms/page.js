"use client";

import { useState, useEffect, useRef } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { adminCmsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import { LOCALES, DEFAULT_LOCALE, localeKey } from "@/lib/locales";

import CmsPromoBarEditor from "@/components/cms/cms-promo-bar-editor";
import CmsHeroEditor from "@/components/cms/cms-hero-editor";
import CmsFormulaEditor from "@/components/cms/cms-formula-editor";
import CmsFeaturedProductsEditor from "@/components/cms/cms-featured-products-editor";
import CmsMarqueeEditor from "@/components/cms/cms-marquee-editor";
import CmsBentoEditor from "@/components/cms/cms-bento-editor";
import CmsCtaEditor from "@/components/cms/cms-cta-editor";
import CmsPeelRevealEditor from "@/components/cms/cms-peel-reveal-editor";
import CmsRitualBannerEditor from "@/components/cms/cms-ritual-banner-editor";
import CmsRitualPageEditor from "@/components/cms/cms-ritual-page-editor";
import CmsGenesisEditor from "@/components/cms/cms-genesis-editor";
import CmsWardrobeEditor from "@/components/cms/cms-wardrobe-editor";
import CmsHeaderEditor from "@/components/cms/cms-header-editor";
import CmsFooterSection from "@/components/cms/cms-footer-section";
import CmsLegalEditor from "@/components/cms/cms-legal-editor";

const SECTIONS = [
  { key: "promoBanner", label: "Promo Bar", Component: CmsPromoBarEditor },
  { key: "cmsHero", label: "Hero", Component: CmsHeroEditor },
  { key: "cmsFormula", label: "Formula", Component: CmsFormulaEditor },
  {
    // Self-managed: loads + saves via its own product endpoints, not the shared
    // CMS getSection/updateSection flow.
    key: "featuredProducts",
    label: "Featured Products",
    Component: CmsFeaturedProductsEditor,
    selfManaged: true,
  },
  {
    key: "cmsMarquee",
    label: "Marquee & Reels",
    Component: CmsMarqueeEditor,
  },
  { key: "cmsBento", label: "Bento", Component: CmsBentoEditor },
  { key: "cmsCta", label: "Bottom CTA", Component: CmsCtaEditor },
  {
    key: "cmsPeelReveal",
    label: "Peel Reveal",
    Component: CmsPeelRevealEditor,
  },
  {
    key: "cmsRitualBanner",
    label: "Ritual Section",
    Component: CmsRitualBannerEditor,
  },
  { key: "cmsRitualPage", label: "Ritual Page", Component: CmsRitualPageEditor },
  { key: "cmsGenesis", label: "Genesis Page", Component: CmsGenesisEditor },
  { key: "cmsWardrobe", label: "Shop Banner", Component: CmsWardrobeEditor },
  { key: "cmsHeader", label: "Header", Component: CmsHeaderEditor },
  {
    // Self-managed: this one tab edits three keys — cmsFooter plus the Shipping
    // (cmsShipping) and Returns (cmsReturns) pages the footer links open — each
    // with its own save.
    key: "cmsFooter",
    label: "Footer",
    Component: CmsFooterSection,
    selfManaged: true,
  },
  { key: "cmsTerms", label: "Terms of Service", Component: CmsLegalEditor },
  { key: "cmsPrivacy", label: "Privacy Policy", Component: CmsLegalEditor },
];

// State-map key: one slot per (section, locale) so locales never collide.
const cacheKey = (tab, locale) => `${tab}::${locale}`;

export default function CmsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(SECTIONS[0].key);
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [sectionData, setSectionData] = useState({});
  const [loadingKeys, setLoadingKeys] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  const loadedKeysRef = useRef(new Set());

  // Load the active (tab, locale) slot when either changes.
  useEffect(() => {
    // Self-managed tabs handle their own data fetching/saving.
    if (SECTIONS.find((s) => s.key === activeTab)?.selfManaged) return;

    const ck = cacheKey(activeTab, locale);
    if (loadedKeysRef.current.has(ck)) return;
    loadedKeysRef.current.add(ck);

    const backendKey = localeKey(activeTab, locale);
    setLoadingKeys((prev) => ({ ...prev, [ck]: true }));
    adminCmsApi
      .getSection(backendKey)
      .then(async (data) => {
        const isEmpty =
          !data || (typeof data === "object" && Object.keys(data).length === 0);
        // Translate-in-place: a not-yet-authored non-English locale starts from
        // the English content so the admin edits copy in place (images/refs kept).
        // Storefront still falls back to English per-field, so a saved partial is safe.
        const seeded =
          locale !== DEFAULT_LOCALE && isEmpty
            ? await adminCmsApi.getSection(activeTab).catch(() => ({}))
            : data;
        setSectionData((prev) => ({ ...prev, [ck]: seeded || {} }));
      })
      .catch(() => {
        showToast(`Failed to load ${backendKey}`, "error");
        setSectionData((prev) => ({ ...prev, [ck]: {} }));
      })
      .finally(() => {
        setLoadingKeys((prev) => ({ ...prev, [ck]: false }));
      });
  }, [activeTab, locale, showToast]);

  const handleSave = async (tab) => {
    const ck = cacheKey(tab, locale);
    const backendKey = localeKey(tab, locale);
    setSavingKey(ck);
    try {
      const payload = { ...sectionData[ck] };
      // Strip selectedProducts (frontend-only) before saving
      delete payload.selectedProducts;
      delete payload.featuredProducts;

      const updated = await adminCmsApi.updateSection(backendKey, payload);
      setSectionData((prev) => ({ ...prev, [ck]: updated }));
      showToast("Section saved successfully", "success");
    } catch {
      showToast("Failed to save section", "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleChange = (tab, newData) => {
    setSectionData((prev) => ({ ...prev, [cacheKey(tab, locale)]: newData }));
  };

  const isNonDefault = locale !== DEFAULT_LOCALE;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Homepage CMS</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage the content of your storefront homepage sections
          </p>
        </div>
        {/* Content language toggle. English is the base; other languages overlay
            it and fall back to English per-field on the storefront. */}
        {LOCALES.length > 1 && (
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLocale(l.code)}
                title={l.name}
                className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
                  locale === l.code
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isNonDefault && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Editing content in a non-English language. Empty fields fall back to
          English on the storefront. Images and links are shared with English —
          edit those on the EN tab.
        </div>
      )}

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100 p-1">
          {SECTIONS.map(({ key, label }) => (
            <Tabs.Trigger
              key={key}
              value={key}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm hover:text-zinc-900"
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {SECTIONS.map(({ key, Component, selfManaged }) => {
          const ck = cacheKey(key, locale);
          return (
            <Tabs.Content key={key} value={key}>
              <div className="rounded-xl border border-zinc-200 bg-white p-5">
                {selfManaged ? (
                  // Manages its own data + save button. `locale` is passed so
                  // locale-aware self-managed tabs suffix their keys; locale-
                  // invariant ones (product refs) simply ignore it.
                  <Component locale={locale} />
                ) : loadingKeys[ck] ? (
                  <div className="py-12 text-center text-sm text-zinc-400">
                    Loading...
                  </div>
                ) : (
                  <Component
                    data={sectionData[ck] || {}}
                    onChange={(newData) => handleChange(key, newData)}
                  />
                )}
              </div>

              {/* Shared save button (self-managed tabs render their own) */}
              {!selfManaged && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSave(key)}
                    disabled={savingKey === ck || loadingKeys[ck]}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {savingKey === ck ? "Saving..." : "Save Section"}
                  </button>
                </div>
              )}
            </Tabs.Content>
          );
        })}
      </Tabs.Root>
    </div>
  );
}
