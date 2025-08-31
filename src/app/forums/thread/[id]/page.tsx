import { redirect } from "next/navigation";
import { getForumThreadById } from "@/services/forumSeoApi";

interface Props {
  params: {
    id: string;
  };
}

/**
 * Redirect old thread URLs to new SEO-friendly URLs
 * Old: /forums/thread/[id]
 * New: /forums/[category]/[slug]
 */
export default async function ThreadRedirectPage({ params }: Props) {
  const thread = await getForumThreadById(params.id);

  if (!thread || !thread.category?.slug || !thread.slug) {
    // If thread not found or missing required data, redirect to forums home
    redirect("/forums");
  }

  // Redirect to new SEO-friendly URL
  redirect(`/forums/${thread.category.slug}/${thread.slug}`);
}
