"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

import { adminCmsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import CmsContactEditor from "@/components/cms/cms-contact-editor";

const SECTION_KEY = "cmsContact";

// Content editor for the storefront Contact page (/touchpoint). Lives here
// rather than under Homepage CMS so it sits next to the submissions it feeds.
export default function ContactContentPage() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminCmsApi
      .getSection(SECTION_KEY)
      .then((d) => setData(d || {}))
      .catch(() => {
        showToast("Failed to load contact page content", "error");
        setData({});
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await adminCmsApi.updateSection(SECTION_KEY, { ...data });
      setData(updated);
      showToast("Contact page content saved", "success");
    } catch {
      showToast("Failed to save content", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/contact"
            className="mb-1 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-800"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Contact Forms
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900">Contact Page Content</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Hero, form panel, subject options and FAQ shown on the storefront contact page.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="w-fit rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        ) : (
          <CmsContactEditor data={data || {}} onChange={setData} />
        )}
      </div>
    </div>
  );
}
