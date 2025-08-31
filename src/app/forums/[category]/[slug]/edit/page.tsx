import React from "react";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getForumThread, getForumCategory } from "@/services/forumSeoApi";

interface Props {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { category, slug } = await params;
    const thread = await getForumThread(category, slug);
    const categoryData = await getForumCategory(category);

    if (!thread || !categoryData) {
      return {
        title: "Edit Thread - EV Community Forums",
        description: "Edit your forum thread.",
      };
    }

    return {
      title: `Edit: ${thread.title} - ${categoryData.name} | EV Community Forums`,
      description: `Edit your forum thread in ${categoryData.name}.`,
      robots: "noindex, nofollow", // Don't index edit pages
    };
  } catch (error) {
    return {
      title: "Edit Thread - EV Community Forums",
      description: "Edit your forum thread.",
    };
  }
}

// Server-side rendered forum thread edit page
export default async function ForumThreadEditPageSSR({ params }: Props) {
  try {
    const { category, slug } = await params;
    const thread = await getForumThread(category, slug);

    if (!thread) {
      notFound();
    }

    // Redirect to the thread-id based edit page which is implemented
    redirect(`/forums/thread/${thread.id}/edit`);
  } catch (error) {
    console.error("Error loading forum thread for editing:", error);
    notFound();
  }
}
