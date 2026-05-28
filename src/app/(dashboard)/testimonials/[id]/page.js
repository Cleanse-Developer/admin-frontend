"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { adminTestimonialApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import TestimonialForm from "@/components/testimonial-form";

export default function EditTestimonialPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [testimonial, setTestimonial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    adminTestimonialApi
      .get(id)
      .then(setTestimonial)
      .catch((err) => {
        showToast(err.response?.data?.message || "Failed to load testimonial", "error");
        router.push("/testimonials");
      })
      .finally(() => setIsLoading(false));
  }, [id, showToast, router]);

  async function handleSubmit(formData) {
    setIsSubmitting(true);
    try {
      await adminTestimonialApi.update(id, formData);
      showToast("Testimonial updated", "success");
      router.push("/testimonials");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update testimonial", "error");
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

  if (!testimonial) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/testimonials" className="rounded-lg p-1 hover:bg-zinc-100">
          <ChevronLeftIcon className="h-5 w-5 text-zinc-500" />
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Testimonial</h1>
      </div>
      <TestimonialForm
        initialData={testimonial}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
