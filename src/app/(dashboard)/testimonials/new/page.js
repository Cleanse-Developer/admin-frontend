"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminTestimonialApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import TestimonialForm from "@/components/testimonial-form";

export default function NewTestimonialPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData) {
    setIsSubmitting(true);
    try {
      const testimonial = await adminTestimonialApi.create(formData);
      showToast(`"${testimonial.name}" created`, "success");
      router.push("/testimonials");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create testimonial", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Add Testimonial</h1>
      <TestimonialForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
