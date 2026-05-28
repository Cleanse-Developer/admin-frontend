"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminBlogApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import BlogForm from "@/components/blog-form";

export default function NewBlogPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData) {
    setIsSubmitting(true);
    try {
      const blog = await adminBlogApi.create(formData);
      showToast(`"${blog.title}" created`, "success");
      router.push("/blogs");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create blog post", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">New Blog Post</h1>
      <BlogForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
