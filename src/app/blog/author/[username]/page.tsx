'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User, Eye, Heart, MessageCircle, Grid, List, Search, MapPin, Globe, Twitter, Linkedin, Github, Mail } from 'lucide-react';

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

interface Author {
  username: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  website: string;
  joinedAt: string;
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  followers: number;
  following: number;
  social: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    email?: string;
  };
}

interface AuthorPageProps {
  params: Promise<{ username: string }>;
}

const AuthorPage = ({ params }: AuthorPageProps) => {
  const resolvedParams = React.use(params);
  const username = resolvedParams.username;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Mock author data - in a real app, fetch from API
  const author: Author = {
    username: username,
    name: 'Sarah Johnson',
    avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20avatar%20headshot&image_size=square',
    bio: 'EV enthusiast and technology writer with over 8 years of experience in the automotive industry. Passionate about sustainable transportation and the future of mobility.',
    location: 'San Francisco, CA',
    website: 'https://sarahjohnson.dev',
    joinedAt: '2022-03-15T00:00:00Z',
    totalPosts: 24,
    totalViews: 45600,
    totalLikes: 1230,
    followers: 892,
    following: 156,
    social: {
      twitter: 'sarah_j_ev',
      linkedin: 'sarah-johnson-ev',
      github: 'sarahj-dev',
      email: 'sarah@example.com'
    }
  };

  // Mock posts by this author
  const authorPosts: BlogPost[] = [
    {
      id: '1',
      title: 'The Future of Electric Vehicle Technology in 2024',
      excerpt: 'Exploring the latest advancements in EV technology, from solid-state batteries to autonomous driving capabilities.',
      content: 'Full article content here...',
      author: {
        name: author.name,
        avatar: author.avatar,
        username: author.username
      },
      category: 'Technology',
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
      title: 'Understanding EV Battery Chemistry: A Deep Dive',
      excerpt: 'A comprehensive guide to different battery technologies used in electric vehicles and their impact on performance.',
      content: 'Full article content here...',
      author: {
        name: author.name,
        avatar: author.avatar,
        username: author.username
      },
      category: 'Technology',
      tags: ['battery', 'chemistry', 'technical'],
      featuredImage: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electric%20vehicle%20battery%20technology%20diagram&image_size=landscape_16_9',
      publishedAt: '2024-01-10T14:30:00Z',
      readTime: 12,
      views: 890,
      likes: 67,
      comments: 18,
      isDraft: false
    },
    {
      id: '3',
      title: 'EV Charging Infrastructure: Current State and Future Plans',
      excerpt: 'An analysis of the current charging infrastructure and what we can expect in the coming years.',
      content: 'Full article content here...',
      author: {
        name: author.name,
        avatar: author.avatar,
        username: author.username
      },
      category: 'Infrastructure',
      tags: ['charging', 'infrastructure', 'analysis'],
      featuredImage: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electric%20vehicle%20charging%20station%20network&image_size=landscape_16_9',
      publishedAt: '2024-01-05T09:15:00Z',
      readTime: 10,
      views: 1100,
      likes: 78,
      comments: 25,
      isDraft: false
    }
  ];

  // Get unique categories from author's posts
  const categories = useMemo(() => {
    const cats = new Set<string>();
    authorPosts.forEach(post => cats.add(post.category));
    return Array.from(cats);
  }, [authorPosts]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let filtered = authorPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
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
  }, [authorPosts, searchTerm, selectedCategory, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
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
          
          {/* Author Profile */}
          <div className="flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="flex-shrink-0">
              <img
                src={author.avatar}
                alt={author.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{author.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{author.bio}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                {author.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{author.location}</span>
                  </div>
                )}
                {author.website && (
                  <div className="flex items-center space-x-1">
                    <Globe className="h-4 w-4" />
                    <a href={author.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                      Website
                    </a>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatJoinDate(author.joinedAt)}</span>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="flex items-center space-x-3">
                {author.social.twitter && (
                  <a
                    href={`https://twitter.com/${author.social.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {author.social.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${author.social.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {author.social.github && (
                  <a
                    href={`https://github.com/${author.social.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                )}
                {author.social.email && (
                  <a
                    href={`mailto:${author.social.email}`}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex-shrink-0">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{author.totalPosts}</div>
                  <div className="text-sm text-gray-500">Articles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{author.totalViews.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{author.totalLikes}</div>
                  <div className="text-sm text-gray-500">Likes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{author.followers}</div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
              </div>
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
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular' | 'oldest')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="latest">Latest</option>
                <option value="popular">Most Popular</option>
                <option value="oldest">Oldest</option>
              </select>

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
        </div>

        {/* Posts */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory
                ? 'Try adjusting your search or filters'
                : `${author.name} hasn't published any articles yet`
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
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {post.category}
                    </span>
                    {post.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
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

export default AuthorPage;