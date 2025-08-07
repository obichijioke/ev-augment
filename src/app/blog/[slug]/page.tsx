import { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPost } from "../../../types/blog";
import BlogPostClient from "@/app/blog/[slug]/BlogPostClient";

// =============================================================================
// SERVER-SIDE DATA FETCHING
// =============================================================================

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const apiUrl = process.env.API_URL || "http://localhost:4002/api";
    const response = await fetch(`${apiUrl}/blog/posts/${slug}`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch blog post: ${response.status}`);
    }

    const data = await response.json();
    const rawPost = data.data?.post || data.post;

    if (!rawPost) return null;

    // Map API response (snake_case) to frontend interface (camelCase)
    const mappedPost: BlogPost = {
      id: rawPost.id,
      title: rawPost.title,
      slug: rawPost.slug,
      excerpt: rawPost.excerpt,
      content: rawPost.content,
      author: {
        name:
          rawPost.users?.full_name || rawPost.author?.full_name || "Anonymous",
        avatar: rawPost.users?.avatar_url || rawPost.author?.avatar_url || "",
        username:
          rawPost.users?.username || rawPost.author?.username || "anonymous",
        bio: rawPost.users?.bio || rawPost.author?.bio || "",
      },
      publishedAt: rawPost.published_at,
      updatedAt: rawPost.updated_at,
      readTime: Math.ceil((rawPost.content?.length || 0) / 200), // Estimate reading time
      category: rawPost.category,
      tags: rawPost.tags || [],
      featuredImage: rawPost.featured_image || "",
      views: rawPost.view_count || rawPost.views || 0,
      likes: rawPost.like_count || 0,
      bookmarks: 0, // Not provided by API, default to 0
      comments: [], // Comments will be loaded separately by client-side hooks
      status: rawPost.status as "draft" | "published" | "archived",
    };

    return mappedPost;
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}

// =============================================================================
// METADATA GENERATION
// =============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: "Post Not Found | EV Community",
      description: "The blog post you're looking for could not be found.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const imageUrl =
    post.featuredImage || `${siteUrl}/images/default-blog-image.jpg`;

  return {
    title: `${post.title} | EV Community`,
    description: post.excerpt || post.content?.substring(0, 160) + "...",
    authors: [
      { name: post.author?.name || post.author?.username || "Anonymous" },
    ],
    keywords: [
      "electric vehicles",
      "EV news",
      "electric car reviews",
      "EV community",
      "sustainable transportation",
      "electric mobility",
      "EV charging",
      "green technology",
      ...(post.tags || []),
    ],
    openGraph: {
      title: `${post.title} | EV Community`,
      description: post.excerpt || post.content?.substring(0, 160) + "...",
      url: postUrl,
      siteName: "EV Community",
      locale: "en_US",
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author?.name || post.author?.username || "Anonymous"],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@EVCommunity",
      creator: "@EVCommunity",
      title: `${post.title} | EV Community`,
      description: post.excerpt || post.content?.substring(0, 160) + "...",
      images: [imageUrl],
    },
    other: {
      "article:author":
        post.author?.name || post.author?.username || "Anonymous",
      "article:published_time": post.publishedAt,
      "article:modified_time": post.updatedAt || post.publishedAt,
      "article:tag": post.tags?.join(", ") || "",
    },
  };
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return <BlogPostClient post={post} />;
}
