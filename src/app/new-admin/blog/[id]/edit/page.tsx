"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";
import { useToast } from "@/hooks/useToast";
import { useBlogPost } from "@/hooks/useBlogPost";
import { useBlogImageUpload } from "@/hooks/useFileUpload";

export default function NewAdminBlogEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const handleUpdateSuccess = useCallback(
    () => toast.success("Post updated"),
    [toast]
  );
  const handleError = useCallback((err: string) => toast.error(err), [toast]);
  const { loadPostById, updatePost, post, isLoading, isUpdating } = useBlogPost(
    {
      onUpdateSuccess: handleUpdateSuccess,
      onError: handleError,
    }
  );
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

  useEffect(() => {
    if (id) {
      // Intentionally omit loadPostById from deps to avoid callback identity changes causing loops
      loadPostById(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!post) return;
    setTitle(post.title || "");
    setSlug(post.slug || "");
    setExcerpt(post.excerpt || "");
    setContent(post.content || "");
    setCategory(post.category || "");
    setTagsInput((post.tags || []).join(", "));
    setFeaturedImage(post.featuredImage || (post as any).featured_image || "");
    setStatus((post.status as any) || "draft");
    setIsFeatured((post as any).is_featured || false);
  }, [post]);

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
      if (id) await updatePost(id, payload);
    } catch {}
  };

  if (isLoading && !post) return <div>Loading…</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Blog Post</h1>
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
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
              >
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
            <label className="block text-sm text-gray-700 mb-1">
              Featured image
            </label>
            <input
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="https://..."
              className="w-full border rounded px-3 py-2 mb-2"
            />
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" onChange={onUploadImage} />
              {(isUploading || isUpdating) && (
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
              disabled={isUpdating}
              onClick={() => {
                setStatus("draft");
                onSave();
              }}
            >
              Save Draft
            </button>
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              disabled={isUpdating}
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
