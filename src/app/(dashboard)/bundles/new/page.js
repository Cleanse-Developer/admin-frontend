"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminBundleApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import BundleForm from "@/components/bundle-form";

export default function NewBundlePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data) {
    setIsSubmitting(true);
    try {
      const result = await adminBundleApi.create(data);
      showToast(`"${result.bundle.name}" created`, "success");
      router.push("/bundles");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to create bundle",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Create Bundle</h1>
      <BundleForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
