import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ForumThreadPage from "@/components/forum/ForumThreadPage";
import { getForumThread, getForumCategory } from "@/services/forumSeoApi";

interface Props {
  params: {
    category: string;
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const thread = await getForumThread(params.category, params.slug);
    const category = await getForumCategory(params.category);

    if (!thread || !category) {
      return {
        title: "Thread Not Found - EV Community Forums",
        description: "The requested forum thread could not be found.",
      };
    }

    // Create SEO-optimized title and description
    const title = `${thread.title} - ${category.name} | EV Community Forums`;
    const description =
      thread.content.length > 160
        ? `${thread.content.substring(0, 157)}...`
        : thread.content;

    return {
      title,
      description,
      keywords: `EV, electric vehicle, ${category.name.toLowerCase()}, forum, discussion, ${
        thread.title
      }`,
      authors: [{ name: thread.author?.username || "EV Community Member" }],
      openGraph: {
        title,
        description,
        type: "article",
        url: `/forums/${params.category}/${params.slug}`,
        siteName: "EV Community Platform",
        publishedTime: thread.created_at,
        modifiedTime: thread.updated_at,
        authors: [thread.author?.username || "EV Community Member"],
        section: category.name,
        tags: [category.name, "EV", "Electric Vehicle", "Forum"],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        creator: `@${thread.author?.username || "EVCommunity"}`,
      },
      alternates: {
        canonical: `/forums/${params.category}/${params.slug}`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "EV Community Forums",
      description: "Connect with EV enthusiasts and share experiences.",
    };
  }
}

// Server-side rendered forum thread page
export default async function ForumThreadPageSSR({ params }: Props) {
  try {
    const thread = await getForumThread(params.category, params.slug);
    const category = await getForumCategory(params.category);

    // Validate that we have both thread and category, and that thread has required properties
    if (!thread || !category || !thread.slug) {
      console.error("Missing thread, category, or thread slug:", {
        hasThread: !!thread,
        hasCategory: !!category,
        threadSlug: thread?.slug,
        categorySlug: params.category,
        requestedSlug: params.slug,
      });
      notFound();
    }

    // Ensure the thread has the category attached
    const threadWithCategory = {
      ...thread,
      category: thread.category || category, // Use thread's category or fallback to fetched category
    };

    return (
      <ForumThreadPage
        thread={threadWithCategory}
        category={category}
        categorySlug={params.category}
        threadSlug={params.slug}
      />
    );
  } catch (error) {
    console.error("Error loading forum thread:", error);
    notFound();
  }
}
