"use client";

import { useState, useEffect, useRef } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { adminCmsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";

import CmsPromoBarEditor from "@/components/cms/cms-promo-bar-editor";
import CmsHeroEditor from "@/components/cms/cms-hero-editor";
import CmsFormulaEditor from "@/components/cms/cms-formula-editor";
import CmsFeaturedProductsEditor from "@/components/cms/cms-featured-products-editor";
import CmsMarqueeEditor from "@/components/cms/cms-marquee-editor";
import CmsBentoEditor from "@/components/cms/cms-bento-editor";
import CmsCtaEditor from "@/components/cms/cms-cta-editor";
import CmsPeelRevealEditor from "@/components/cms/cms-peel-reveal-editor";
import CmsHeaderEditor from "@/components/cms/cms-header-editor";
import CmsFooterEditor from "@/components/cms/cms-footer-editor";
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
  { key: "cmsHeader", label: "Header", Component: CmsHeaderEditor },
  { key: "cmsFooter", label: "Footer", Component: CmsFooterEditor },
  { key: "cmsTerms", label: "Terms of Service", Component: CmsLegalEditor },
  { key: "cmsPrivacy", label: "Privacy Policy", Component: CmsLegalEditor },
];

export default function CmsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(SECTIONS[0].key);
  const [sectionData, setSectionData] = useState({});
  const [loadingKeys, setLoadingKeys] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  const loadedKeysRef = useRef(new Set());

  // Load active tab's data when tab changes
  useEffect(() => {
    // Self-managed tabs handle their own data fetching/saving.
    if (SECTIONS.find((s) => s.key === activeTab)?.selfManaged) return;
    if (loadedKeysRef.current.has(activeTab)) return;
    loadedKeysRef.current.add(activeTab);

    setLoadingKeys((prev) => ({ ...prev, [activeTab]: true }));
    adminCmsApi
      .getSection(activeTab)
      .then((data) => {
        setSectionData((prev) => ({ ...prev, [activeTab]: data || {} }));
      })
      .catch(() => {
        showToast(`Failed to load ${activeTab}`, "error");
        setSectionData((prev) => ({ ...prev, [activeTab]: {} }));
      })
      .finally(() => {
        setLoadingKeys((prev) => ({ ...prev, [activeTab]: false }));
      });
  }, [activeTab, showToast]);

  const handleSave = async (key) => {
    setSavingKey(key);
    try {
      const payload = { ...sectionData[key] };
      // Strip selectedProducts (frontend-only) before saving
      delete payload.selectedProducts;
      delete payload.featuredProducts;

      const updated = await adminCmsApi.updateSection(key, payload);
      setSectionData((prev) => ({ ...prev, [key]: updated }));
      showToast("Section saved successfully", "success");
    } catch {
      showToast("Failed to save section", "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleChange = (key, newData) => {
    setSectionData((prev) => ({ ...prev, [key]: newData }));
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Homepage CMS</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage the content of your storefront homepage sections
        </p>
      </div>

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

        {SECTIONS.map(({ key, Component, selfManaged }) => (
          <Tabs.Content key={key} value={key}>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              {selfManaged ? (
                // Manages its own data + save button.
                <Component />
              ) : loadingKeys[key] ? (
                <div className="py-12 text-center text-sm text-zinc-400">
                  Loading...
                </div>
              ) : (
                <Component
                  data={sectionData[key] || {}}
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
                  disabled={savingKey === key || loadingKeys[key]}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  {savingKey === key ? "Saving..." : "Save Section"}
                </button>
              </div>
            )}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}
