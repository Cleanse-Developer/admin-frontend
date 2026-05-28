"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { adminBlogApi } from "@/lib/endpoints";
import { useToast } from "@/context/toast-context";
import BlogForm from "@/components/blog-form";

export default function EditBlogPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [blog, setBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    adminBlogApi
      .get(id)
      .then(setBlog)
      .catch((err) => {
        showToast(err.response?.data?.message || "Failed to load blog post", "error");
        router.push("/blogs");
      })
      .finally(() => setIsLoading(false));
  }, [id, showToast, router]);

  async function handleSubmit(formData) {
    setIsSubmitting(true);
    try {
      await adminBlogApi.update(id, formData);
      showToast("Blog post updated", "success");
      router.push("/blogs");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update blog post", "error");
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

  if (!blog) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/blogs" className="rounded-lg p-1 hover:bg-zinc-100">
          <ChevronLeftIcon className="h-5 w-5 text-zinc-500" />
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Blog Post</h1>
      </div>
      <BlogForm
        initialData={blog}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
