'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, TrendingUp } from 'lucide-react';
import ForumLayout from '@/components/forum/ForumLayout';
import ThreadCard from '@/components/forum/ThreadCard';
import ForumFilters from '@/components/forum/ForumFilters';
import BreadcrumbNavigation from '@/components/forum/BreadcrumbNavigation';
import StructuredData from '@/components/seo/StructuredData';
import ErrorBoundary, {
  ForumLoading,
  ForumError,
  ForumEmpty,
} from '@/components/forum/ErrorBoundary';
import { ForumCategory, ForumThread, ThreadFilters } from '@/types/forum';
import { useForumThreads } from '@/hooks/useForumApi';

interface Props {
  category: ForumCategory;
  categorySlug: string;
}

const ForumCategoryPage: React.FC<Props> = ({ category, categorySlug }) => {
  const [filteredThreads, setFilteredThreads] = useState<ForumThread[]>([]);
  const [filters, setFilters] = useState<ThreadFilters>({
    sort: 'latest',
    filter: 'all',
    search: '',
  });

  // Get threads for this category
  const {
    threads,
    loading: threadsLoading,
    error: threadsError,
    refetch: refetchThreads,
  } = useForumThreads({
    category_id: category.id,
    sort:
      filters.sort === 'latest'
        ? 'newest'
        : filters.sort === 'oldest'
        ? 'oldest'
        : filters.sort === 'popular'
        ? 'most_views'
        : 'newest',
  });

  // Apply filters and sorting
  useEffect(() => {
    if (!threads || !Array.isArray(threads)) {
      setFilteredThreads([]);
      return;
    }

    let filtered = [...threads];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (thread) =>
          thread.title.toLowerCase().includes(searchLower) ||
          thread.content.toLowerCase().includes(searchLower) ||
          (thread.author?.displayName || '').toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    switch (filters.filter) {
      case 'pinned':
        filtered = filtered.filter((thread) => thread.is_pinned);
        break;
      case 'locked':
        filtered = filtered.filter((thread) => thread.is_locked);
        break;
      case 'unanswered':
        filtered = filtered.filter((thread) => thread.reply_count === 0);
        break;
    }

    // Apply sorting
    switch (filters.sort) {
      case 'latest':
        filtered.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        break;
      case 'oldest':
        filtered.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'popular':
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'replies':
        filtered.sort((a, b) => (b.reply_count || 0) - (a.reply_count || 0));
        break;
    }

    // Pinned threads always come first
    if (filters.filter !== 'locked' && filters.filter !== 'unanswered') {
      const pinned = filtered.filter((thread) => thread.is_pinned);
      const regular = filtered.filter((thread) => !thread.is_pinned);
      filtered = [...pinned, ...regular];
    }

    setFilteredThreads(filtered);
  }, [threads, filters]);

  const handleRetry = () => {
    refetchThreads();
  };

  // Generate structured data for the category
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForum',
    name: category.name,
    description: category.description,
    url: `/forums/${categorySlug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `/forums/${categorySlug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'EV Community Platform',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://evcommunity.com',
    },
    discussionUrl: `/forums/${categorySlug}`,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CreateAction',
        userInteractionCount: category.thread_count || 0,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ReplyAction',
        userInteractionCount: category.post_count || 0,
      },
    ],
  };

  if (threadsLoading) {
    return (
      <ForumLayout title="Loading..." showBackButton={true}>
        <ForumLoading message="Loading category threads..." />
      </ForumLayout>
    );
  }

  if (threadsError) {
    return (
      <ForumLayout title="Error" showBackButton={true}>
        <ForumError
          message={threadsError}
          onRetry={handleRetry}
        />
      </ForumLayout>
    );
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData data={structuredData} />
      
      <ErrorBoundary>
        <ForumLayout
          title={category.name}
          subtitle={category.description}
          showBackButton={true}
          showCreateButton={true}
          createHref={`/forums/new?category=${category.id}`}
          createLabel="New Thread"
        >
          {/* Breadcrumb Navigation */}
          <BreadcrumbNavigation
            items={[
              { label: 'Forums', href: '/forums' },
              { label: category.name, href: `/forums/${categorySlug}` },
            ]}
            className="mb-6"
          />

          {/* Category Stats */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-semibold"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {category.name}
                  </h1>
                  <p className="text-gray-600 mt-1">{category.description}</p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {category.thread_count || threads.length}
                  </div>
                  <div className="text-sm text-gray-600">Threads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {category.post_count || threads.reduce((sum, t) => sum + (t.reply_count || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <ForumFilters
            filters={filters}
            onFiltersChange={setFilters}
            className="mb-6"
          />

          {/* Threads List */}
          {filteredThreads.length === 0 ? (
            <ForumEmpty
              title="No threads found"
              message={
                filters.search || filters.filter !== 'all'
                  ? 'No threads match your current filters. Try adjusting your search or filter criteria.'
                  : "This category doesn't have any threads yet. Be the first to start a discussion!"
              }
              actionLabel="Start New Thread"
              actionHref={`/forums/new?category=${category.id}`}
            />
          ) : (
            <div className="space-y-4">
              {filteredThreads.map((thread) => (
                <ThreadCard 
                  key={thread.id} 
                  thread={thread}
                  href={`/forums/${categorySlug}/${thread.slug}`}
                />
              ))}
            </div>
          )}

          {/* Results Summary */}
          {filteredThreads.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-600">
              Showing {filteredThreads.length} of {threads.length} threads
            </div>
          )}
        </ForumLayout>
      </ErrorBoundary>
    </>
  );
};

export default ForumCategoryPage;
