import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ForumCategoryPage from "@/components/forum/ForumCategoryPage";
import {
  getForumCategory,
  getAllForumCategories,
} from "@/services/forumSeoApi";

interface Props {
  params: {
    category: string;
  };
}

// Generate static params for all categories (for static generation)
export async function generateStaticParams() {
  try {
    const categories = await getAllForumCategories();
    return categories.map((category) => ({
      category: category.slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const category = await getForumCategory(params.category);

    if (!category) {
      return {
        title: "Category Not Found - EV Community Forums",
        description: "The requested forum category could not be found.",
      };
    }

    const title = `${category.name} - EV Community Forums`;
    const description =
      category.description ||
      `Discuss ${category.name.toLowerCase()} topics with fellow EV enthusiasts.`;

    return {
      title,
      description,
      keywords: `EV, electric vehicle, ${category.name.toLowerCase()}, forum, discussion, community`,
      openGraph: {
        title,
        description,
        type: "website",
        url: `/forums/${params.category}`,
        siteName: "EV Community Platform",
        images: [
          {
            url: "/images/forum-og-image.jpg", // You'll need to create this
            width: 1200,
            height: 630,
            alt: `${category.name} Forum - EV Community`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["/images/forum-og-image.jpg"],
      },
      alternates: {
        canonical: `/forums/${params.category}`,
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

// Server-side rendered forum category page
export default async function ForumCategoryPageSSR({ params }: Props) {
  try {
    const category = await getForumCategory(params.category);

    if (!category) {
      notFound();
    }

    return (
      <ForumCategoryPage category={category} categorySlug={params.category} />
    );
  } catch (error) {
    console.error("Error loading forum category:", error);
    notFound();
  }
}
