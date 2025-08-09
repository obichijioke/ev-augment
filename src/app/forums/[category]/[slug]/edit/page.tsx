import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ForumThreadEditPage from '@/components/forum/ForumThreadEditPage';
import { getForumThread, getForumCategory } from '@/services/forumSeoApi';

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
        title: 'Edit Thread - EV Community Forums',
        description: 'Edit your forum thread.',
      };
    }

    return {
      title: `Edit: ${thread.title} - ${category.name} | EV Community Forums`,
      description: `Edit your forum thread in ${category.name}.`,
      robots: 'noindex, nofollow', // Don't index edit pages
    };
  } catch (error) {
    return {
      title: 'Edit Thread - EV Community Forums',
      description: 'Edit your forum thread.',
    };
  }
}

// Server-side rendered forum thread edit page
export default async function ForumThreadEditPageSSR({ params }: Props) {
  try {
    const thread = await getForumThread(params.category, params.slug);
    const category = await getForumCategory(params.category);
    
    if (!thread || !category) {
      notFound();
    }

    return (
      <ForumThreadEditPage 
        thread={thread} 
        category={category}
        categorySlug={params.category}
        threadSlug={params.slug}
      />
    );
  } catch (error) {
    console.error('Error loading forum thread for editing:', error);
    notFound();
  }
}
