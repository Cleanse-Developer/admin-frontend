"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { adminProductApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import ProductForm from "@/components/product-form";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    adminProductApi
      .get(id)
      .then(setProduct)
      .catch((err) => {
        showToast(
          err.response?.data?.message || "Failed to load product",
          "error"
        );
        router.push("/products");
      })
      .finally(() => setIsLoading(false));
  }, [id, showToast, router]);

  async function handleSubmit(formData) {
    setIsSubmitting(true);
    try {
      const updated = await adminProductApi.update(id, formData);
      showToast(`"${updated.name}" updated`, "success");
      router.push("/products");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update product",
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

  if (!product) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/products"
          className="rounded-lg p-1 hover:bg-zinc-100"
        >
          <ChevronLeftIcon className="h-5 w-5 text-zinc-500" />
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Product</h1>
      </div>
      <ProductForm
        initialData={product}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
