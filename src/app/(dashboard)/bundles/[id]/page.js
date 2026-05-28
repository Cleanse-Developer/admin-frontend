"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { adminBundleApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import BundleForm from "@/components/bundle-form";

export default function EditBundlePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [bundle, setBundle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    adminBundleApi
      .get(id)
      .then((data) => setBundle(data.bundle))
      .catch((err) => {
        showToast(
          err.response?.data?.message || "Failed to load bundle",
          "error"
        );
        router.push("/bundles");
      })
      .finally(() => setIsLoading(false));
  }, [id, showToast, router]);

  async function handleSubmit(data) {
    setIsSubmitting(true);
    try {
      const result = await adminBundleApi.update(id, data);
      showToast(`"${result.bundle.name}" updated`, "success");
      router.push("/bundles");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update bundle",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!bundle) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/bundles"
          className="rounded-lg p-1 hover:bg-zinc-100"
        >
          <ChevronLeftIcon className="h-5 w-5 text-zinc-500" />
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Bundle</h1>
      </div>
      <BundleForm
        initialData={bundle}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
