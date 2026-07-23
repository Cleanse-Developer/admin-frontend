"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

import { adminCmsApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import CmsBlogEditor from "@/components/cms/cms-blog-editor";

const KEY = "cmsBlog";

/* Standalone editor for the storefront /blog page's media + content. Reached
   from the "Customize Page" button on the Blog Posts list rather than the main
   CMS tabs, since it lives alongside the posts it fronts. Loads/saves the single
   cmsBlog settings key through the shared CMS section API. */
export default function BlogCustomizePage() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminCmsApi
      .getSection(KEY)
      .then((doc) => {
        if (!cancelled) setData(doc || {});
      })
      .catch(() => {
        if (!cancelled) {
          showToast("Failed to load blog page content", "error");
          setData({});
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await adminCmsApi.updateSection(KEY, data);
      setData(updated);
      showToast("Blog page saved", "success");
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/blogs"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Back to Blog Posts"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Customize Blog Page</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Hero media &amp; heading and the newsletter banner on the storefront
              Journal page.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        {loading || !data ? (
          <div className="py-12 text-center text-sm text-zinc-400">Loading...</div>
        ) : (
          <CmsBlogEditor data={data} onChange={setData} />
        )}
      </div>
    </div>
  );
}
