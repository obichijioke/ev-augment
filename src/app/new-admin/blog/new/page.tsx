"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";
import { useToast } from "@/hooks/useToast";
import { useBlogPost } from "@/hooks/useBlogPost";
import { useBlogImageUpload } from "@/hooks/useFileUpload";

export default function NewAdminBlogCreatePage() {
  const router = useRouter();
  const toast = useToast();
  const { createPost, isCreating } = useBlogPost({
    onCreateSuccess: (post) => {
      toast.success("Post saved");
      router.push(`/new-admin/blog`);
    },
    onError: (err) => toast.error(err),
  });
  const { uploadSingle, isUploading } = useBlogImageUpload();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    "draft"
  );
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const autoSlug = useMemo(() => {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return base;
  }, [title]);

  const onUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await uploadSingle(file);
      if (uploaded?.url) setFeaturedImage(uploaded.url);
    } catch (err: any) {
      toast.error(err?.message || "Image upload failed");
    }
  };

  const onSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    const payload: any = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      excerpt: excerpt.trim() || undefined,
      content,
      featured_image: featuredImage || undefined,
      category: category || undefined,
      tags: tagsInput
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
      status,
      is_featured: isFeatured,
    };
    try {
      await createPost(payload);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">New Blog Post</h1>
        <Link href="/new-admin/blog" className="text-sm text-blue-600">
          Back to Posts
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full border rounded px-3 py-2"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={`Slug (auto: ${autoSlug})`}
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Excerpt"
            className="w-full border rounded px-3 py-2 h-24"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Markdown editor ({content.length} chars)
            </span>
            <button
              className="text-sm px-2 py-1 border rounded"
              onClick={() => setIsPreview((p) => !p)}
            >
              {isPreview ? "Edit" : "Preview"}
            </button>
          </div>
          {!isPreview ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write content in Markdown..."
              className="w-full border rounded px-3 py-2 h-96 font-mono"
            />
          ) : (
            <div className="prose max-w-none border rounded p-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeRaw]}>
                {content || "_Nothing to preview..._"}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Tags</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. ev, charging, battery"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Featured image</label>
            <input
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="https://..."
              className="w-full border rounded px-3 py-2 mb-2"
            />
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" onChange={onUploadImage} />
              {(isUploading || isCreating) && (
                <span className="text-xs text-gray-500">Uploading/Saving…</span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="is_featured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <label htmlFor="is_featured" className="text-sm">
              Featured
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 border rounded"
              disabled={isCreating}
              onClick={() => {
                setStatus("draft");
                onSave();
              }}
            >
              Save Draft
            </button>
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              disabled={isCreating}
              onClick={() => {
                setStatus("published");
                onSave();
              }}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

