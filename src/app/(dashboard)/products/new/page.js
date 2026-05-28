"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminProductApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import ProductForm from "@/components/product-form";

export default function NewProductPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData) {
    setIsSubmitting(true);
    try {
      const product = await adminProductApi.create(formData);
      showToast(`"${product.name}" created`, "success");
      router.push("/products");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to create product",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Add Product</h1>
      <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
