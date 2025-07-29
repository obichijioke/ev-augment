'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User, Eye, Heart, MessageCircle, Grid, List, Search, Filter } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  category: string;
  tags: string[];
  featuredImage: string;
  publishedAt: string;
  readTime: number;
  views: number;
  likes: number;
  comments: number;
  isDraft: boolean;
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const CategoryPage = ({ params }: CategoryPageProps) => {
  const resolvedParams = React.use(params);
  const categorySlug = resolvedParams.slug;
  
  // Convert slug to display name
  const categoryName = categorySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Mock data - in a real app, fetch based on category
  const mockPosts: BlogPost[] = [
    {
      id: '1',
      title: 'The Future of Electric Vehicle Technology in 2024',
      excerpt: 'Exploring the latest advancements in EV technology, from solid-state batteries to autonomous driving capabilities.',
      content: 'Full article content here...',
      author: {
        name: 'Sarah Johnson',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20avatar%20headshot&image_size=square',
        username: 'sarah_j'
      },
      category: categoryName,
      tags: ['technology', 'future', 'innovation'],
      featuredImage: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20electric%20vehicle%20technology%20concept&image_size=landscape_16_9',
      publishedAt: '2024-01-15T10:00:00Z',
      readTime: 8,
      views: 1250,
      likes: 89,
      comments: 23,
      isDraft: false
    },
    {
      id: '2',
      title: 'Tesla Model S Plaid: A Comprehensive Review',
      excerpt: 'After 6 months of ownership, here\'s my detailed review of the Tesla Model S Plaid and what you need to know.',
      content: 'Full article content here...',
      author: {
        name: 'Mike Chen',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20man%20avatar%20headshot&image_size=square',
        username: 'mike_c'
      },
      category: categoryName,
      tags: ['tesla', 'review', 'model-s'],
      featuredImage: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=tesla%20model%20s%20plaid%20luxury%20electric%20car&image_size=landscape_16_9',
      publishedAt: '2024-01-12T14:30:00Z',
      readTime: 12,
      views: 2100,
      likes: 156,
      comments: 45,
      isDraft: false
    },
    {
      id: '3',
      title: 'Building Your Home EV Charging Station: Complete Guide',
      excerpt: 'Everything you need to know about installing a Level 2 charging station at home, including costs and permits.',
      content: 'Full article content here...',
      author: {
        name: 'Alex Rivera',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20person%20avatar%20headshot&image_size=square',
        username: 'alex_r'
      },
      category: categoryName,
      tags: ['charging', 'home', 'installation'],
      featuredImage: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=home%20ev%20charging%20station%20installation&image_size=landscape_16_9',
      publishedAt: '2024-01-10T09:15:00Z',
      readTime: 15,
      views: 890,
      likes: 67,
      comments: 18,
      isDraft: false
    }
  ];

  // Get all unique tags from posts
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    mockPosts.forEach(post => {
      post.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [mockPosts]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let filtered = mockPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.some(tag => post.tags.includes(tag));
      return matchesSearch && matchesTags;
    });

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.views + b.likes) - (a.views + a.likes);
        case 'oldest':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case 'latest':
        default:
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
    });

    return filtered;
  }, [mockPosts, searchTerm, selectedTags, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link href="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{categoryName}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the latest articles and insights in {categoryName.toLowerCase()}
            </p>
            <div className="mt-4 text-sm text-gray-500">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Sort */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular' | 'oldest')}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Most Popular</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>

              {/* View Mode */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by tags:</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Posts */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedTags.length > 0
                ? 'Try adjusting your search or filters'
                : `No articles available in ${categoryName} yet`
              }
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
            : 'space-y-6'
          }>
            {filteredPosts.map(post => (
              <article
                key={post.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                <div className={viewMode === 'list' ? 'w-1/3' : ''}>
                  <div className={`aspect-video ${viewMode === 'list' ? 'h-full' : ''}`}>
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-center space-x-2 mb-3">
                    {post.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    <Link href={`/blog/${post.id}`} className="hover:text-blue-600 transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <Link href={`/profile/${post.author.username}`} className="hover:text-blue-600">
                          {post.author.name}
                        </Link>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{post.readTime} min read</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </div>
                    </div>
                    
                    <Link
                      href={`/blog/${post.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Read more →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;